const User = require("../models/User");
const { publicUser } = require("../utils/tokens");

// GET /users/me — current profile (avatar, name, coins, language, …).
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /users/me — update profile fields (language preference, display name).
exports.updateMe = async (req, res) => {
  try {
    const { language, name } = req.body;
    const update = {};
    if (typeof language === "string") update.language = language;
    if (typeof name === "string" && name.trim()) update.name = name.trim();

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
