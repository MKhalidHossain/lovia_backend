const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const {
  authResponse,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} = require("../utils/tokens");
const { verifyGoogleIdToken, verifyFacebookToken } = require("../utils/socialVerify");

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      provider: "email",
    });
    // Log the new user straight in.
    res.status(201).json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    res.json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------------------------------------------------------
// Social — Google / Facebook
// ---------------------------------------------------------------------------

exports.google = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "idToken is required" });

    const profile = await verifyGoogleIdToken(idToken);

    // Reuse an existing account by googleId, then by email; otherwise create.
    let user = await User.findOne({ googleId: profile.id });
    if (!user && profile.email)
      user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email ? profile.email.toLowerCase() : undefined,
        googleId: profile.id,
        avatarUrl: profile.avatarUrl,
        provider: "google",
      });
    } else if (!user.googleId) {
      // Link Google to a pre-existing email/guest account.
      user.googleId = profile.id;
      if (user.provider === "guest") user.provider = "google";
      user.isGuest = false;
      if (!user.avatarUrl) user.avatarUrl = profile.avatarUrl;
      await user.save();
    }

    res.json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Google sign-in failed" });
  }
};

exports.facebook = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: "accessToken is required" });

    const profile = await verifyFacebookToken(accessToken);

    let user = await User.findOne({ facebookId: profile.id });
    if (!user && profile.email)
      user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email ? profile.email.toLowerCase() : undefined,
        facebookId: profile.id,
        avatarUrl: profile.avatarUrl,
        provider: "facebook",
      });
    } else if (!user.facebookId) {
      user.facebookId = profile.id;
      if (user.provider === "guest") user.provider = "facebook";
      user.isGuest = false;
      if (!user.avatarUrl) user.avatarUrl = profile.avatarUrl;
      await user.save();
    }

    res.json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Facebook sign-in failed" });
  }
};

// ---------------------------------------------------------------------------
// Guest
// ---------------------------------------------------------------------------

exports.guest = async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ message: "deviceId is required" });

    let user = await User.findOne({ deviceId });
    if (!user) {
      user = await User.create({
        name: "Guest",
        deviceId,
        provider: "guest",
        isGuest: true,
      });
    }
    res.json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Guest sign-in failed" });
  }
};

// ---------------------------------------------------------------------------
// Refresh / logout
// ---------------------------------------------------------------------------

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "refreshToken is required" });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    if (!user || decoded.tv !== user.tokenVersion)
      return res.status(401).json({ message: "Refresh token revoked" });

    // Rotate both tokens.
    res.json({
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user),
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  try {
    // Invalidate outstanding refresh tokens for this user.
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------------------------------------------------------
// Password reset (OTP) — email flow
// ---------------------------------------------------------------------------

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ message: "User email not found" });

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpVerified = false;
    await user.save();

    await sendEmail(
      user.email,
      "Your OTP for Password Reset",
      `
        <h2>Password Reset Request</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 5px">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      `
    );
    console.log("OTP:", otp);
    res.json({ message: "OTP sent successfully to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(404).json({ message: "Email not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP expired" });

    user.otpVerified = true;
    await user.save();
    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(404).json({ message: "Email not found" });
    if (!user.otpVerified) return res.status(400).json({ message: "OTP not verified" });
    void otp;

    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword)
        return res.status(400).json({ message: "New password cannot be same as old password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpVerified = false;
    user.tokenVersion += 1; // invalidate old sessions after a reset
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
