require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const express = require("express");
const mongoose = require("mongoose");

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
    done: { type: Boolean, default: false}
});

const Todo = mongoose.model("Todo", todoSchema);

app.get("/todos", async(req, res) => {
    const todos = await Todo.find();
    res.json(todos);
});


app.get("/todos/:id", async (req, res) => {
    // const todo = todos.find(t => t.id === Number(req.params.id));
    const todo = await Todo.findById(req.params.id);
    if (!todo) 
        return res.status(404).json({error: "Not Found"});
    res.json(todo);
});


app.post("/todos", async(req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
//   const todo = { id: nextId++, title, done: false };
  const todo = await Todo.create({title});
//   todos.push(todo);
  res.status(201).json(todo);
});


app.put("/todos/:id", async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body);
  if (!todo) return res.status(404).json({ error: "Not found" });
  res.json(todo);
});



app.delete("/todos/:id", async (req, res) => {
  try{
    // const result =  Todo.findByIdAndUpdate(req.params.id);
    const result =  Todo.findById(req.params.id);
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