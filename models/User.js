const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: { type: String, required: true, unique: true},
    password: {type:String, required: true},
    otp: {type:String},
    otpExpiry: {type:Date},
    otpVerified: {type: Boolean, default: false},
    resetOtp: String,
    restOtpExpires: Date,

});

module.exports = mongoose.model("User", userSchema)


