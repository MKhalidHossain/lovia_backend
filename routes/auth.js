const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

// Email / password
router.post("/register", authController.register);
router.post("/login", authController.login);

// Social + guest
router.post("/google", authController.google);
router.post("/facebook", authController.facebook);
router.post("/guest", authController.guest);

// Session lifecycle
router.post("/refresh", authController.refresh);
router.post("/logout", auth, authController.logout);

// Password reset (OTP)
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
