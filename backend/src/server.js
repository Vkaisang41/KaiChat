import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import emojiRoutes from "./routes/emojiRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import callRoutes from "./routes/callRoutes.js";

// Import socket handler
import chatSocket from "./sockets/chatSocket.js";

// ----------------- Setup -----------------
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ----------------- Middleware -----------------
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "https://kaichat-frontend.onrender.com",
      "http://localhost:3000",
      "http://localhost:5000"
    ].filter(Boolean), // Remove falsy values
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- Routes -----------------
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/emojis', emojiRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);

// ----------------- MongoDB Connection -----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----------------- Example API Route -----------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "KaiChat backend is running 🚀" });
});

// ----------------- JWT Auth Middleware -----------------
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

// ----------------- Socket.io Auth Middleware -----------------
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// ----------------- Socket.io -----------------
chatSocket(io);

// ----------------- Error Handling Middleware -----------------
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);

  // If response already sent, don't send again
  if (res.headersSent) {
    return next(error);
  }

  // Return JSON error for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(error.status || 500).json({
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  // For non-API routes, send a simple error message
  res.status(error.status || 500).send('Internal Server Error');
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
