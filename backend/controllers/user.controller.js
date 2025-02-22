import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

// REGISTER
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ message: "All fields required", success: false });

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ message: "Email already exists", success: false });

        const hashed = await bcrypt.hash(password, 10);
        

        const user = await User.create({
            username,
            email,
            password: hashed
        });

       const { password: _, ...safeUser } = user.toObject();

return res.status(201).json({
  message: "User registered",
  success: true,
  user: safeUser
});



        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user.toObject();

    //  Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: safeUser
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




// GET PROFILE
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.id).select("-password");

        if (!user)
            return res.status(404).json({ message: "User not found", success: false });

        return res.status(200).json({ success: true, user });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


// EDIT PROFILE
export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const avatar = req.file;

        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found", success: false });

        if (avatar) {
            const base64 = avatar.buffer.toString("base64");
            const fileUri = `data:${avatar.mimetype};base64,${base64}`;

            const uploaded = await cloudinary.uploader.upload(fileUri, {
                folder: "profiles",
                transformation: [
                    { width: 400, height: 400, crop: "limit" },
                    { quality: "auto" }
                ]
            });

            user.profilePicture = uploaded.secure_url;
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated",
            user
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


// FOLLOW OR UNFOLLOW
export const followOrUnfollow = async (req, res) => {
    try {
        const userId = req.id;
        const targetId = req.params.id;

        if (userId === targetId)
            return res.status(400).json({ message: "Cannot follow yourself", success: false });

        const user = await User.findById(userId);
        const target = await User.findById(targetId);

        if (!user || !target)
            return res.status(404).json({ message: "User not found", success: false });

        const isFollowing = user.following.includes(targetId);

        if (isFollowing) {
            user.following.pull(targetId);
            target.followers.pull(userId);

            await user.save();
            await target.save();

            return res.status(200).json({ message: "User unfollowed", success: true });
        }

        user.following.push(targetId);
        target.followers.push(userId);

        await user.save();
        await target.save();

        return res.status(200).json({ message: "User followed", success: true });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};



