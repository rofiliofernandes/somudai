import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import { getDataUri } from "../utils/datauri.js";
import { User } from "../models/user.model.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields required", success: false });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User registered",
            user: newUser,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields", success: false });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password", success: false });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        return res.status(200).json({
            message: "Login successful",
            token,
            user,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        return res.status(200).json({ user, success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const avatar = req.file;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        // Upload new profile picture
        if (avatar) {
            const fileUri = getDataUri(avatar);
            const cloudResponse = await cloudinary.uploader.upload(fileUri, {
                folder: "profiles",
                transformation: [
                    { width: 400, height: 400, crop: "limit" },
                    { quality: "auto" }
                ]
            });
            user.profilePicture = cloudResponse.secure_url;
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;

        await user.save();

        return res.status(200).json({
            message: "Profile updated",
            user,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const followOrUnfollow = async (req, res) => {
    try {
        const userId = req.id;
        const targetId = req.params.id;

        if (userId === targetId) {
            return res.status(400).json({ message: "Cannot follow yourself", success: false });
        }

        const user = await User.findById(userId);
        const target = await User.findById(targetId);

        if (!user || !target) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        if (user.following.includes(targetId)) {
            // Unfollow
            user.following.pull(targetId);
            target.followers.pull(userId)
