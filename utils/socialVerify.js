// Verifies social sign-in tokens against the provider directly, with no extra
// npm dependencies (Node 18+ global fetch). Returns a normalized profile.

// Verify a Google ID token via the public tokeninfo endpoint. This validates
// the signature/expiry and returns the decoded claims. We additionally assert
// the audience matches our web client id.
async function verifyGoogleIdToken(idToken) {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) throw new Error("Invalid Google token");
  const data = await res.json();

  const expectedAud = process.env.GOOGLE_WEB_CLIENT_ID;
  if (expectedAud && data.aud !== expectedAud) {
    throw new Error("Google token audience mismatch");
  }
  return {
    id: data.sub,
    email: data.email,
    name: data.name || data.email,
    avatarUrl: data.picture || "",
  };
}

// Verify a Facebook access token by fetching the user's profile from the
// Graph API. A valid token returns the profile; an invalid one errors.
async function verifyFacebookToken(accessToken) {
  const fields = "id,name,email,picture.type(large)";
  const res = await fetch(
    `https://graph.facebook.com/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) throw new Error("Invalid Facebook token");
  const data = await res.json();
  if (!data.id) throw new Error("Invalid Facebook token");

  return {
    id: data.id,
    email: data.email || null,
    name: data.name || "Facebook user",
    avatarUrl: data.picture && data.picture.data ? data.picture.data.url : "",
  };
}

module.exports = { verifyGoogleIdToken, verifyFacebookToken };
