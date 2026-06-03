const express = require ("express");
const router = express.Router();
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const crypto = require ("crypto");
const nodemailer = require ("nodemailer");
const User = require ("../models/User");


router.post("/register", async (req, res) =>{
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne ({ email});
        if (existing) return res.status(400).json({ message: "User already exists" });
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({name, email, password: hashed});
        res.status(201).json({ message: "Account created successfully"});
    }catch (error) {
        res.status(500).json({ message: "Server error"});
    }
});


router.post("/login", async (req, res)=> {
    try {
        const { email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) return res.status(400).json({message: "Invalid credentials"});
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({message: "Invalid credentials"});
        const token = jwt.sign({ userId: user._id}, process.env.JWT_SECRET, { expiresIn: "7d"});
        res.json({ token, name: user.name });
    }catch (error) {
        res.status(500).json({ message: "Server error"});
    }
});



router.post("/forgot-password", async (req, res) =>{
    const { email} = req.body;

    const user = await User.findOne

});


router.post("/reset-password", async (req, res) => {

});

module.exports = router;