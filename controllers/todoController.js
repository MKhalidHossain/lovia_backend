const Todo = require("../models/Todo");

exports.getAllTodos = async (req, res) => {
  try {
    const todos = await Todo.find({userId: req.userId});
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodo = async (req, res) => {
  try {
    const todo = await Todo.findById({_id: req.params.id, userId: req.userId});
    if (!todo) return res.status(404).json({ error: "Not Found" });
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTodo = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    console.log("userId form token :", req.userId);
    const todo = await Todo.create({ title, userId: req.userId });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateTodo = async (req, res) => {
  try {
     const todo = await Todo.findByIdAndUpdate({ _id: req.params.id,userId : req.userId },
         req.body,
         { new: true }
        );
  if (!todo) return res.status(404).json({ error: "Not found" });
  res.json(todo);

  }catch(err){
    res.status(500).json({ error: err.message});
  }
};


exports.deleteTodo = async (req, res) => {
  try{
    const result = await Todo.findById(req.params.id);
    console.log("Result of findById:", result);
    if(result) await Todo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};