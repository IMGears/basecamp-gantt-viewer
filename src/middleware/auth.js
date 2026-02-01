// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// Middleware to check if user has connected Basecamp
const hasBasecampAuth = (req, res, next) => {
  if (req.user?.basecampAccessToken) {
    return next();
  }
  res.redirect('/auth/basecamp');
};

module.exports = {
  isAuthenticated,
  hasBasecampAuth,
};
