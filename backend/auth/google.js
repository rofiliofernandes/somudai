import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        user = await User.create({
          username: profile.displayName,
          email: profile.emails[0].value,
          password: "google-oauth",
          profilePicture: profile.photos[0].value,
        });
      }

      return done(null, user);
    }
  )
);
