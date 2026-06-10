const jwt = require("jsonwebtoken");

// Access tokens are short-lived; refresh tokens are long-lived and carry the
// user's tokenVersion so logout can invalidate them server-side.
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "30d";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

function signAccessToken(user) {
  return jwt.sign({ userId: user._id, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { userId: user._id, type: "refresh", tv: user.tokenVersion },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, REFRESH_SECRET);
  if (decoded.type !== "refresh") throw new Error("Not a refresh token");
  return decoded;
}

// Shape consumed by the Flutter app: { id, name, email, avatarUrl, coins, isGuest }.
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || null,
    avatarUrl: user.avatarUrl || null,
    coins: user.coins,
    isGuest: user.isGuest,
    language: user.language,
  };
}

// Full auth payload returned by every sign-in endpoint.
function authResponse(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: publicUser(user),
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  publicUser,
  authResponse,
};
