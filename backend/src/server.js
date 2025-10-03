import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import jwt from "jsonwebtoken";

// ----------------- Setup -----------------
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ----------------- Middleware -----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- MongoDB Connection -----------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----------------- Example API Route -----------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "KaiChat backend is running 🚀" });
});

// ----------------- JWT Auth Middleware Example -----------------
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Protected route example
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// ----------------- Socket.io -----------------
io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  socket.on("chatMessage", (msg) => {
    console.log("💬 Message received:", msg);
    io.emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("🔴 A user disconnected:", socket.id);
  });
});

// ----------------- Serve React Frontend -----------------
app.use(express.static(path.join(__dirname, "../../frontend/build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"));
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
