const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./index');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    (accessToken, refreshToken, profile, done) => {
      // Store user profile and tokens
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value,
        googleAccessToken: accessToken,
      };
      return done(null, user);
    }
  )
);

module.exports = passport;
