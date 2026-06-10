const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Email is required for email/social accounts but not for anonymous guests.
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    // Password only exists for email accounts (social/guest accounts have none).
    password: { type: String },

    // How this account was created.
    provider: {
      type: String,
      enum: ["email", "google", "facebook", "guest"],
      default: "email",
    },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    // Stable device id used to recover an anonymous guest session.
    deviceId: { type: String, unique: true, sparse: true },

    avatarUrl: { type: String, default: "" },
    coins: { type: Number, default: 5 },
    isGuest: { type: Boolean, default: false },
    language: { type: String, default: "en-US" },

    // Bumped on logout / password reset to invalidate outstanding refresh tokens.
    tokenVersion: { type: Number, default: 0 },

    // Password-reset OTP fields (email flow).
    otp: { type: String },
    otpExpiry: { type: Date },
    otpVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
