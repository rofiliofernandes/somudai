import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.id = decoded.id;

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};
