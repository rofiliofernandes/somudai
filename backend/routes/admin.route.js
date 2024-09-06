import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Example admin route
router.get("/dashboard", isAuthenticated, isAdmin, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin panel access granted"
    });
});

export default router;
