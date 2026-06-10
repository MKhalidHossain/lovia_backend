const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const auth = require("../middleware/auth");

router.get("/me", auth, usersController.getMe);
router.patch("/me", auth, usersController.updateMe);

module.exports = router;
