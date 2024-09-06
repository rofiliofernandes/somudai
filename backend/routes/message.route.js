import express from "express";
import { sendMessage, getMessages } from "../controllers/message.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Send message
router.post("/:id", isAuthenticated, sendMessage);

// Get messages between two users
router.get("/:id", isAuthenticated, getMessages);

export default router;
