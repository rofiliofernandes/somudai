import sharp from "sharp";
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

        if (!image) return res.status(400).json({ message: "Image required" });

        // Resize + optimize image
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: "inside" })
            .toFormat("jpeg", { quality: 80 })
            .toBuffer();

        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString("base64")}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);

        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({ path: "author", select: "-password" });

        return res.status(201).json({
            message: "New post added",
            post,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ path: "author", select: "username profilePicture" })
            .populate({
                path: "comments",
                sort: { createdAt: -1 },
                populate: {
                    path: "author",
                    select: "username profilePicture"
                }
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
            .populate({
                path: "author",
                select: "username profilePicture"
            })
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
            const notification = {
                type: "like",
                userId,
                userDetails: user,
                postId,
                message: "Your post was liked"
            };
            const socketId = getReceiverSocketId(receiverId);
            if (socketId) io.to(socketId).emit("notification", notification);
        }

        return res.status(200).json({ success: true, message: "Post liked" });

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
        if (!post) return res.status(404).json({ message: "Post not found" });

        await post.updateOne({ $pull: { likes: userId } });

        return res.status(200).json({ success: true, message: "Post disliked" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

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

        const post = await Post.findById(postId);
        post.comments.push(comment._id);
        await post.save();

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

        return res.status(200).json({ message: "Post deleted", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};

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

        await user.save();

        return res.status(200).json({ type, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false });
    }
};
