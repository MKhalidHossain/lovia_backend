const express = require ("express");
const router = express.Router();
const bcrypt = require ("bcrypt");
const jwt = require ("jsonwebtoken");
const User = require ("../models/User");


router.post("/register", async (req, res) =>{
    try {
        const { username, email, password } = req.body;


        const existing = await User.findOne ({ email});
        if (existing) return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = new User.create({name, email, password: hashed});
        res.status(201).json({ message: "Account created successfully"});

    }catch (error) {
        res.status(500).json({ message: "Server error"});
    }
});

router.post("/login", async (req, res)=> {
    try {
        const { eamil, password} = req.body;

        const user = await User.findOne({email});
        if (!user) return res.status(400).json({message: "Invalid credentials"});

        const match = await bcrypt.compare(passwrod, user.password);
        if (!match) return res.status(400).json({message: "Invalid credentials"});

        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: "7h"});
        res.json({ token, name: user.name });
    }catch (error) {
        res.status(500).json({ message: "Server error"});
    }
});

module.exports = router;