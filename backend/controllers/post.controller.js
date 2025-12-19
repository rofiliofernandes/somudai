import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";


// CREATE NEW POST (TEXT TWEET or IMAGE POST)

export const addNewPost = async (req, res) => {
    try {
        const { caption, text, type } = req.body; 
        const file = req.file; 
        const authorId = req.id;

        if (!type) {
            return res.status(400).json({
                message: "Post type (text/image) required",
                success: false
            });
        }

        // ----------------------------------------------------------
        // CASE 1: TEXT POST ("tweet")
        // ----------------------------------------------------------
        if (type === "text") {
            if (!text || text.trim() === "") {
                return res.status(400).json({
                    message: "Tweet text is required",
                    success: false
                });
            }

            if (text.length > 280) {
                return res.status(400).json({
                    message: "Text cannot exceed 280 characters",
                    success: false
                });
            }

            const post = await Post.create({
                caption: caption || "",
                text,
                type: "text",
                image: null,
                author: authorId
            });

            const user = await User.findById(authorId);
            user.posts.push(post._id);
            await user.save();

            await post.populate({ path: "author", select: "-password" });

            return res.status(201).json({
                message: "Text post created",
                post,
                success: true
            });
        }

        // ----------------------------------------------------------
        // CASE 2: IMAGE POST
        // ----------------------------------------------------------
        if (type === "image") {
            if (!file) {
                return res.status(400).json({
                    message: "Image is required",
                    success: false
                });
            }

            // block videos
            if (!file.mimetype.startsWith("image/")) {
                return res.status(400).json({
                    message: "Only image files allowed",
                    success: false
                });
            }

            // optimize image
            const optimizedBuffer = await sharp(file.buffer)
                .resize({ width: 800, height: 800, fit: "inside" })
                .jpeg({ quality: 80 })
                .toBuffer();

            const fileUri =
                "data:image/jpeg;base64," + optimizedBuffer.toString("base64");

            const upload = await cloudinary.uploader.upload(fileUri);

            const post = await Post.create({
                caption: caption || "",
                text: "",
                type: "image",
                image: upload.secure_url,
                author: authorId
            });

            const user = await User.findById(authorId);
            user.posts.push(post._id);
            await user.save();

            await post.populate({ path: "author", select: "-password" });

            return res.status(201).json({
                message: "Image post created",
                post,
                success: true
            });
        }

        return res.status(400).json({
            message: "Invalid post type",
            success: false
        });

    } catch (error) {
        console.error("POST ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};


// GET ALL POSTS

export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate("author", "username profilePicture")
            .populate({
                path: "comments",
                populate: { path: "author", select: "username profilePicture" }
            });

        return res.status(200).json({ posts, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


// GET USER POSTS

export const getUserPost = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.id })
            .sort({ createdAt: -1 })
            .populate("author", "username profilePicture")
            .populate({
                path: "comments",
                populate: { path: "author", select: "username profilePicture" }
            });

        return res.status(200).json({ posts, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


// LIKE POST

export const likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        await Post.findByIdAndUpdate(postId, {
            $addToSet: { likes: userId }
        });

        // send real-time notification
        const ownerSocketId = getReceiverSocketId(post.author.toString());
        const liker = await User.findById(userId).select("username profilePicture");

        if (ownerSocketId) {
            io.to(ownerSocketId).emit("notification", {
                type: "like",
                userId,
                userDetails: liker,
                postId,
                message: "Your post was liked"
            });
        }

        return res.status(200).json({ success: true, message: "Post liked" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


// DISLIKE POST

export const dislikePost = async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            $pull: { likes: req.id }
        });
        return res.status(200).json({ success: true, message: "Post disliked" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


// ADD COMMENT

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

        await Post.findByIdAndUpdate(postId, {
            $push: { comments: comment._id }
        });

        await comment.populate("author", "username profilePicture");

        return res.status(201).json({
            success: true,
            comment,
            message: "Comment added"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


// DELETE POST

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await Post.findByIdAndDelete(postId);
        await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};


// BOOKMARK POST

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

        return res.status(200).json({ success: true, type });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};
