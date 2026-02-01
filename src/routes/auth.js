const express = require('express');
const passport = require('passport');
const router = express.Router();
const basecampService = require('../services/basecamp');
const { isAuthenticated } = require('../middleware/auth');

// Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
  }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Basecamp OAuth - initiate
router.get('/basecamp', isAuthenticated, (req, res) => {
  const authUrl = basecampService.getAuthUrl();
  res.redirect(authUrl);
});

// Basecamp OAuth - callback
router.get('/basecamp/callback', isAuthenticated, async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect('/dashboard?error=no_code');
    }

    // Exchange code for tokens
    const tokenData = await basecampService.getAccessToken(code);

    // Get user's Basecamp accounts
    const authInfo = await basecampService.getAuthorization(tokenData.access_token);

    // Store tokens and account info in session
    req.user.basecampAccessToken = tokenData.access_token;
    req.user.basecampRefreshToken = tokenData.refresh_token;
    req.user.basecampAccounts = authInfo.accounts.filter(a => a.product === 'bc3');

    // Update session
    req.session.passport.user = req.user;

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Basecamp OAuth error:', err.response?.data || err.message);
    res.redirect('/dashboard?error=basecamp_auth_failed');
  }
});

module.exports = router;
