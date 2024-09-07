import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";

// REGISTER
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ message: "All fields required", success: false });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email already exists", success: false });

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ username, email, password: hashedPassword });

        return res.status(201).json({ message: "User registered successfully", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "All fields required", success: false });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials", success: false });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials", success: false });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.status(200).json({
            message: "Login successful",
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// GET PROFILE
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.id).select("-password");
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// EDIT PROFILE
export const editProfile = async (req, res) => {
    try {
        const { bio, gender } = req.body;
        const user = await User.findById(req.id);

        if (!user)
            return res.status(404).json({ message: "User not found", success: false });

        // If profile picture uploaded
        if (req.file) {
            const img = req.file;
            const base64Img = img.buffer.toString("base64");
            const fileUri = `data:${img.mimetype};base64,${base64Img}`;

            const upload = await cloudinary.uploader.upload(fileUri, {
                folder: "somudai_profiles"
            });

            user.profilePicture = upload.secure_url;
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated",
            user
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// FOLLOW / UNFOLLOW
export const followOrUnfollow = async (req, res) => {
    try {
        const userId = req.id;
        const targetId = req.params.id;

        if (userId === targetId)
            return res.status(400).json({ message: "You cannot follow yourself", success: false });

        const user = await User.findById(userId);
        const target = await User.findById(targetId);

        if (!user || !target)
            return res.status(404).json({ message: "User not found", success: false });

        const alreadyFollowing = user.following.includes(targetId);

        if (alreadyFollowing) {
            // Unfollow
            user.following.pull(targetId);
            target.followers.pull(userId);
            await user.save();
            await target.save();

            return res.status(200).json({ message: "User unfollowed", success: true });
        }

        // Follow
        user.following.push(targetId);
        target.followers.push(userId);
        await user.save();
        await target.save();

        return res.status(200).json({ message: "User followed", success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
