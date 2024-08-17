import express from "express";
import { register, login, getProfile, editProfile, followOrUnfollow } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get profile (requires token)
router.get("/profile", isAuthenticated, getProfile);

// Update profile (bio, gender, avatar)
router.put("/profile", isAuthenticated, upload.single("avatar"), editProfile);

// Follow / Unfollow
router.put("/follow/:id", isAuthenticated, followOrUnfollow);

export default router;
