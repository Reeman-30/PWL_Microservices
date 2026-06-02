const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userService = require("../services/userService");

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    console.error("Deserialization error:", error);
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("📝 Google Profile received:", {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
        });

        const user = await userService.createOrUpdateUser(profile);

        await userService.updateLoginInfo(user._id);

        console.log("✓ User authenticated:", user.email);
        return done(null, user);
      } catch (error) {
        console.error("✗ Google Strategy Error:", error);
        return done(error, null);
      }
    },
  ),
);

module.exports = passport;
