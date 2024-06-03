import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const userSocketMap = new Map();

io.on("connection", (socket) => {
  // Client will send userId after login
  socket.on("identify", (userId) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
    }
    // Broadcast online users to admin panel
    io.emit("analytics:update", { onlineUsers: userSocketMap.size });
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of userSocketMap.entries()) {
      if (sockId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
    io.emit("analytics:update", { onlineUsers: userSocketMap.size });
  });
});

export { app, server, io };
