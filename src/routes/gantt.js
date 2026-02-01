const express = require('express');
const router = express.Router();
const ganttController = require('../controllers/ganttController');
const { isAuthenticated, hasBasecampAuth } = require('../middleware/auth');

// Project selection page
router.get('/', isAuthenticated, hasBasecampAuth, ganttController.showProjectSelect);

// Gantt chart page for specific project
router.get('/view', isAuthenticated, hasBasecampAuth, ganttController.showGantt);

// API: Get tasks for a specific project
router.get('/api/tasks/:accountId/:projectId', isAuthenticated, hasBasecampAuth, ganttController.getTasks);

// API: Get projects list
router.get('/api/projects/:accountId', isAuthenticated, hasBasecampAuth, ganttController.getProjects);

module.exports = router;
