import express from "express";
import isAdmin from "../middlewares/isAdmin.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";

const router = express.Router();

// Admin analytics overview
router.get("/overview", isAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email createdAt");

    res.json({
      userCount,
      postCount,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
