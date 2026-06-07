const express = require("express");
// const mongoose = require("mongoose");
const router = express.Router();
// const authRoutes = require("../routes/auth");
const todoController = require("../controllers/todoController");
const authMiddleware = require("../middleware/auth");


router.get("/todos", authMiddleware, todoController.getAllTodos);
router.get("/:id", authMiddleware, todoController.getTodo);
router.post("/", authMiddleware, todoController.createTodo);
router.put("/:id", authMiddleware, todoController.updateTodo);
router.delete("/:id", authMiddleware, todoController.deleteTodo);

module.exports = router;