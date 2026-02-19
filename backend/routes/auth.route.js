import express from "express";
import passport from "passport";
import { authCookieOptions } from "../utils/cookies.js";

const router = express.Router();

// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const { token } = req.user;

    res.cookie("token", token, authCookieOptions);

    res.redirect(process.env.CLIENT_URL);
  }
);

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: authCookieOptions.secure,
    sameSite: authCookieOptions.sameSite,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

export default router;
