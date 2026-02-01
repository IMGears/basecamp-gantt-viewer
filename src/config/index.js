require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },

  basecamp: {
    clientId: process.env.BASECAMP_CLIENT_ID,
    clientSecret: process.env.BASECAMP_CLIENT_SECRET,
    callbackUrl: process.env.BASECAMP_CALLBACK_URL || 'http://localhost:3000/auth/basecamp/callback',
  },
};
