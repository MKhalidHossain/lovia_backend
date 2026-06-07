const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, name: user.name });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        message: "User email not found",
      });

    // const otp = math.floor( 100000 + Math.random() * 900000);
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpVerified = false;
    await user.save();

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Password Reset",
        html: `
            <h2> Password Reset Request</h2>
            <p> Your OTP code is: </p>
            <h1 style = "letter-spacing: 5px"> ${otp} </h1>
             <p>This OTP expires in 15 minutes. </p>
             <p> If you did not request this, ignore this email.</p>
        `
    });

    console.log("OTP:", otp);

    res.json({ message: "OTP sent Successfully to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" || error.message});
  }
});

router.post("/verify-otp", async (req, res) =>{
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email});
        if (!user) return res.status(404).json({ message: "Email not found"});

        if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP"});

        if (user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP expired"});


        user.otpVerified = true;
        await user.save();

        res.json({ message: "OTP verified successfully"});

    }catch (error){
        res.status(500).json({ message: "Server error" || error.message });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword} = req.body;

        const user = await User.findOne({ email});

        if (!user) return res.status(404).json({ message: "Email not found" });
        if (!user.otpVerified) return res.status(400).json({ message: "OTP not verified"});

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if  ( isSamePassword) return res.status(400).json({ message: "New password cannot be same as old password"})

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpVerified = false;
        
        await user.save();

        res.json({ message: "Password reset successfully"});

    }catch (error){
        res.status(500).json({ message: "Server error" || error.message});
    }
});

module.exports = router;
