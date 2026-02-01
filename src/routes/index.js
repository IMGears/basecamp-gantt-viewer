const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Home page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Basecamp Gantt Viewer',
    user: req.user || null,
  });
});

// Health check endpoint for Railway
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Dashboard (protected)
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', {
    user: req.user,
  });
});

module.exports = router;
