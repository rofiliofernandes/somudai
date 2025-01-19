import express from "express";
import passport from "passport";

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

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,       // REQUIRED on Render
      sameSite: "none",   // REQUIRED for frontend-backend
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
  }
);

export default router;
