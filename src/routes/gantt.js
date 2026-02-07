const express = require('express');
const router = express.Router();
const ganttController = require('../controllers/ganttController');
const { isAuthenticated, hasBasecampAuth } = require('../middleware/auth');

// Validate that Basecamp IDs are numeric to prevent injection
function validateIds(req, res, next) {
  const { accountId, projectId } = req.params;
  const idPattern = /^\d+$/;

  if (accountId && !idPattern.test(accountId)) {
    return res.status(400).json({ error: 'Invalid account ID' });
  }
  if (projectId && !idPattern.test(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }
  next();
}

// Project selection page
router.get('/', isAuthenticated, hasBasecampAuth, ganttController.showProjectSelect);

// Gantt chart page for specific project
router.get('/view', isAuthenticated, hasBasecampAuth, ganttController.showGantt);

// API: Get tasks for a specific project
router.get('/api/tasks/:accountId/:projectId', isAuthenticated, hasBasecampAuth, validateIds, ganttController.getTasks);

// API: Get projects list
router.get('/api/projects/:accountId', isAuthenticated, hasBasecampAuth, validateIds, ganttController.getProjects);

module.exports = router;
