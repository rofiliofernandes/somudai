import express from "express";
import {
    addNewPost,
    getAllPost,
    getUserPost,
    likePost,
    dislikePost,
    addComment,
    deletePost
} from "../controllers/post.controller.js";


import isAuthenticated from "../middlewares/isAuthenticated.js";

import { upload } from "../middlewares/multer.js";

const router = express.Router();

// Create post
router.post("/", isAuthenticated, upload.single("image"), addNewPost);

//Create tweet
router.post("/addpost", isAuthenticated, upload.single("image"), addNewPost);


// All posts
router.get("/", isAuthenticated, getAllPost);

// User's posts
router.get("/me", isAuthenticated, getUserPost);

// Like / dislike
router.put("/like/:id", isAuthenticated, likePost);
router.put("/dislike/:id", isAuthenticated, dislikePost);

// Comment
router.post("/comment/:id", isAuthenticated, addComment);

// Delete post
router.delete("/:id", isAuthenticated, deletePost);

export default router;



