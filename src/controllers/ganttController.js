const basecampService = require('../services/basecamp');

// Display project selection page
async function showProjectSelect(req, res) {
  try {
    const accounts = req.user.basecampAccounts || [];

    // Auto-select account if only one exists
    const accountId = accounts.length === 1 ? accounts[0].id : accounts[0]?.id;

    if (!accountId) {
      return res.render('project-select', {
        user: req.user,
        projects: [],
        accountId: null,
        error: 'No Basecamp accounts found.',
      });
    }

    // Fetch projects for this account
    const accessToken = req.user.basecampAccessToken;
    const projects = await basecampService.getProjects(accessToken, accountId);

    res.render('project-select', {
      user: req.user,
      projects,
      accountId,
      error: null,
    });
  } catch (err) {
    console.error('Project select error:', err);
    res.render('project-select', {
      user: req.user,
      projects: [],
      accountId: null,
      error: 'Failed to load projects.',
    });
  }
}

// Display Gantt chart page for a specific project
async function showGantt(req, res) {
  try {
    const { accountId, projectId } = req.query;

    if (!accountId || !projectId) {
      return res.redirect('/gantt');
    }

    // Get project details
    const accessToken = req.user.basecampAccessToken;
    const project = await basecampService.getProject(accessToken, accountId, projectId);

    res.render('gantt', {
      user: req.user,
      accountId,
      projectId,
      projectName: project.name,
      error: null,
    });
  } catch (err) {
    console.error('Gantt page error:', err);
    res.render('gantt', {
      user: req.user,
      accountId: req.query.accountId,
      projectId: req.query.projectId,
      projectName: 'Unknown Project',
      error: 'Failed to load project.',
    });
  }
}

// API endpoint to fetch tasks for a specific project
async function getTasks(req, res) {
  try {
    const { accountId, projectId } = req.params;
    const accessToken = req.user.basecampAccessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Basecamp not connected' });
    }

    const tasks = await basecampService.getProjectTasksForGantt(accessToken, accountId, projectId);

    res.json({ tasks });
  } catch (err) {
    console.error('Fetch tasks error:', err.response?.data || err.message);

    // Handle token expiry
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Token expired. Please reconnect Basecamp.' });
    }

    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

// API endpoint to get projects list
async function getProjects(req, res) {
  try {
    const { accountId } = req.params;
    const accessToken = req.user.basecampAccessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Basecamp not connected' });
    }

    const projects = await basecampService.getProjects(accessToken, accountId);

    res.json({ projects });
  } catch (err) {
    console.error('Fetch projects error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

module.exports = {
  showProjectSelect,
  showGantt,
  getTasks,
  getProjects,
};
