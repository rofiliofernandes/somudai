import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  register,
  login,
  getProfile,
  editProfile,
  followOrUnfollow
} from "../controllers/user.controller.js";

const router = express.Router();

// AUTH
router.post("/register", register);
router.post("/login", login);

router.post("/refresh", refreshToken);



// USER
router.get("/profile", protect, getProfile);
router.put("/profile", protect, editProfile);
router.post("/follow/:id", protect, followOrUnfollow);

export default router;




