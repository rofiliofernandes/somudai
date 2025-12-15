import { User } from "../models/user.model.js";

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
