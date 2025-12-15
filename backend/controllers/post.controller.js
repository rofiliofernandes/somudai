import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        if (!image) {
            return res.status(400).json({ message: "Image required", success: false });
        }

        // Upload image to Cloudinary
        const cloudResponse = await cloudinary.uploader.upload(image.path, {
            folder: "posts",
            transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" }
            ]
        });

        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        await User.findByIdAndUpdate(authorId, { $push: { posts: post._id } });

        await post.populate({ path: "author", select: "-password" });

        return res.status(201).json({ message: "New post added", post, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

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
        return res.status(500).json({ success: false });
    }
};

export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;

        const posts = await Post.find({ author: authorId })
            .sort({ createdAt: -1 })
            .populate("author", "username profilePicture")
            .populate({
                path: "comments",
                populate: { path: "author", select: "username profilePicture" }
            });

        return res.status(200).json({ posts, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

export const likePost = async (req, res) => {
    try {
        const userId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found", success: false });

        await post.updateOne({ $addToSet: { likes: userId } });

        // Send notification to post owner
        const postOwner = post.author.toString();
        if (postOwner !== userId) {
            const user = await User.findById(userId).select("username profilePicture");

            const notification = {
                type: "like",
                userId,
                userDetails: user,
                postId,
                message: "Your post was liked"
            };

            const socketId = getReceiverSocketId(postOwner);
            if (socketId) io.to(socketId).emit("notification", notification);
        }

        return res.status(200).json({ message: "Post liked", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

export const dislikePost = async (req, res) => {
    try {
        const userId = req.id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found", success: false });

        await post.updateOne({ $pull: { likes: userId } });

        return res.status(200).json({ message: "Post unliked", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: "Text required", success: false });

        const comment = await Comment.create({
            text,
            author: userId,
            post: postId
        });

        await comment.populate("author", "username profilePicture");

        await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

        return res.status(201).json({ message: "Comment added", comment, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found", success: false });

        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized", success: false });
        }

        await Post.findByIdAndDelete(postId);
        await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({ message: "Post deleted", success: true });

    } catch (error) {
        console.log(error);
        r
