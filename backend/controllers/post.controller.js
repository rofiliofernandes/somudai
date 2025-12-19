import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

/*
    POST TYPES SUPPORTED:
    - "image" → requires an uploaded image
    - "text"  → tweet-style text post (no image)
*/


//  CREATE NEW POST (IMAGE or TEXT)

export const addNewPost = async (req, res) => {
    try {
        const { caption, type } = req.body; // type = "text" or "image"
        const file = req.file;
        const authorId = req.id;

        if (!type) {
            return res.status(400).json({ message: "Post type required" });
        }

        /
        // CASE 1: TEXT POST (TWEET)
        
        if (type === "text") {
            if (!caption || caption.trim().length === 0) {
                return res.status(400).json({ message: "Text content required" });
            }

            if (caption.length > 280) {
                return res.status(400).json({ message: "Text post cannot exceed 280 characters" });
            }

            const post = await Post.create({
                caption,
                image: null,
                type: "text",
                author: authorId
            });

            const user = await User.findById(authorId);
            if (user) {
                user.posts.push(post._id);
                await user.save();
            }

            await post.populate({ path: "author", select: "-password" });

            return res.status(201).json({
                message: "Text post created",
                post,
                success: true
            });
        }

        
        // CASE 2: IMAGE POST
        
        if (type === "image") {
            if (!file) {
                return res.status(400).json({ message: "Image required" });
            }

            // Reject videos
            if (!file.mimetype.startsWith("image/")) {
                return res.status(400).json({ message: "Only image uploads allowed" });
            }

            // Resize + optimize using sharp
            const optimized = await sharp(file.buffer)
                .resize({ width: 800, height: 800, fit: "inside" })
                .jpeg({ quality: 80 })
                .toBuffer();

            const fileUri = `data:image/jpeg;base64,${optimized.toString("base64")}`;
            const cloud = await cloudinary.uploader.upload(fileUri);

            const post = await Post.create({
                caption,
                image: cloud.secure_url,
                type: "image",
                author: authorId
            });

            const user = await User.findById(authorId);
            if (user) {
                user.posts.push(post._id);
                await user.save();
            }

            await post.populate({ path: "author", select: "-password" });

            return res.status(201).json({
                message: "Image post created",
                post,
                success: true
            });
        }

        return res.status(400).json({ message: "Invalid post type" });

    } catch (error) {
        console.log("POST ERROR:", error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};


//  GET ALL POSTS

export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ path: "author", select: "username profilePicture" })
            .populate({
                path: "comments",
                sort: { createdAt: -1 },
                populate: { path: "author", select: "username profilePicture" }
            });

        return res.status(200).json({ posts, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};


//  GET POSTS FOR LOGGED-IN USER

export const getUserPost = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.id })
            .sort({ createdAt: -1 })
            .populate({ path: "author", select: "username profilePicture" })
            .populate({
                path: "comments",
                sort: { createdAt: -1 },
                populate: { path: "author", select: "username profilePicture" }
            });

        return res.status(200).json({ posts, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};


//  LIKE POST

export const likePost = async (req, res) => {
    try {
        const userId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        await post.updateOne({ $addToSet: { likes: userId } });

        const user = await User.findById(userId).select("username profilePicture");

        const receiverId = post.author.toString();
        if (receiverId !== userId) {
            const socketId = getReceiverSocketId(receiverId);
            if (socketId) {
                io.to(socketId).emit("notification", {
                    type: "like",
                    userId,
                    userDetails: user,
                    postId,
                    message: "Your post was liked"
                });
            }
        }

        return res.status(200).json({ success: true, message: "Post liked" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};


//  DISLIKE POST

export const dislikePost = async (req, res) => {
    try {
        const userId = req.id;
        const postId = req.params.id;

        await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });

        return res.status(200).json({ success: true, message: "Post disliked" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};


//  ADD COMMENT

export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.id;

        if (!text) return res.status(400).json({ message: "Text is required" });

        const comment = await Comment.create({
            text,
            author: userId,
            post: postId
        });

        await comment.populate("author", "username profilePicture");

        await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

        return res.status(201).json({
            success: true,
            message: "Comment added",
            comment
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};


//  DELETE POST

export const deletePost = async (req, res) => {
    try {
        const userId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await Post.findByIdAndDelete(postId);
        await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            message: "Post deleted",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

//  BOOKMARK POST

export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;

        const user = await User.findById(userId);

        let type;
        if (user.bookmarks.includes(postId)) {
            await user.updateOne({ $pull: { bookmarks: postId } });
            type = "unsaved";
        } else {
            await user.updateOne({ $addToSet: { bookmarks: postId } });
            type = "saved";
        }

        return res.status(200).json({ type, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};
