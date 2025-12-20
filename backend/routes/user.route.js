import express from "express";
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

// USER
router.get("/profile", getProfile);
router.put("/profile", editProfile);
router.post("/follow/:id", followOrUnfollow);

export default router;
