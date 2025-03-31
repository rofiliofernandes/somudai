import "./config/env.js";

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./utils/db.js";
import passport from "passport";
import "./auth/google.js";
import { isAllowedOrigin } from "./utils/cors.js";

// Routes
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";

// Socket.IO
import { initSocket } from "./socket/socket.js";

const app = express();
const server = http.createServer(app);

// 🔐 Middlewares
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(passport.initialize());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/admin", adminRoutes);

// DB
connectDB();

// Socket.IO
initSocket(server);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});

