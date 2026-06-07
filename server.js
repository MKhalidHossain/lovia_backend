require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const todoRoutes = require("./routes/todo");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

connectDB();

app.use("/auth", authRoutes);
app.use("/api", todoRoutes);


console.log("MONGO_URI:", process.env.MONGO_URI);


app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
