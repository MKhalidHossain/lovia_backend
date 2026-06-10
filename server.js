require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const todoRoutes = require("./routes/todo");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

connectDB();

// Health check (handy for the Flutter client / load balancers).
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/api", todoRoutes);


app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
