import express from "express";
import passport from "passport";

const router = express.Router();

// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false
  }),
  (req, res) => {
    // req.user comes from GoogleStrategy
    const { token } = req.user;

    // Redirect to frontend with token
    res.redirect(
      `${process.env.CLIENT_URL}/oauth-success?token=${token}`
    );
  }
);

export default router;

