import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export default async function isAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.cookies.token;
    if (!authHeader) return res.status(401).json({ message: "Not authenticated" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.SECRET_KEY
    );

    if (!payload || !payload.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(payload.id).select("+role");

    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Authentication failed",
      error: err.message,
    });
  }
}
