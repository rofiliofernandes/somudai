import "./config/env.js"; 

import express from "express";
import http from "http";
import cors from "cors";

import connectDB from "./utils/db.js"; 
import passport from "passport";
import "./auth/google.js";


// Routes
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
// Socket.IO
import { initSocket } from "./socket/socket.js";


const app = express();
app.use(express.json());
const server = http.createServer(app);


app.use(passport.initialize());


// Middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}));

app.use("/api/v1/auth", authRoutes);

// Connect DB
connectDB();

// Use routes
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/admin", adminRoutes);

// Initialize Socket.IO on same server
initSocket(server);

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});








