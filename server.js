require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB connected"))
.catch(err => console.log(err));


// let todos = [
//     { id: 1, text: "Learn Express", done: false },
//     { id: 2, text: "Build a REST API", done: false },
// ];

// let nextId =3;




const todoSchema = new mongoose.Schema({
    title : { type: String, required: true},
    done: { type: Boolean, default: false},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
});

const Todo = mongoose.model("Todo", todoSchema);


app.use("/auth",authRoutes);


app.get("/todos", authMiddleware, async(req, res) => {
    const todos = await Todo.find();
    res.json(todos);
});


app.get("/todos/:id", authMiddleware, async (req, res) => {
    // const todo = todos.find(t => t.id === Number(req.params.id));
    const todo = await Todo.findById(req.params.id);
    if (!todo) 
        return res.status(404).json({error: "Not Found"});
    res.json(todo);
});


app.post("/todos", authMiddleware, async(req, res) => {
  try{
    const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  console.log("userId form token :", req.userId);
//   const todo = { id: nextId++, title, done: false };
  const todo = await Todo.create({title, userId: req.userId});
  
//   todos.push(todo);
  res.status(201).json(todo);
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});


app.put("/todos/:id", authMiddleware , async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body);
  if (!todo) return res.status(404).json({ error: "Not found" });
  res.json(todo);
});



app.delete("/todos/:id", authMiddleware , async (req, res) => {
  try{
    // const result =  Todo.findByIdAndUpdate(req.params.id);
    const result = await Todo.findById(req.params.id);
    console.log("Result of findById:", result);
    if(result) await Todo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
  
});




app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});