const basecampService = require('../services/basecamp');

// Display project selection page
async function showProjectSelect(req, res) {
  try {
    const accounts = req.user.basecampAccounts || [];

    // Use accountId from query string, or fall back to first account
    const accountId = req.query.accountId || accounts[0]?.id;

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

// API endpoint to update a specific task
async function updateTask(req, res) {
  try {
    const { accountId, projectId, todoId } = req.params;
    const accessToken = req.user.basecampAccessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Basecamp not connected' });
    }

    const { content, starts_on, due_on, completed } = req.body;
    const updateFields = {};

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ error: 'Task name cannot be empty' });
      }
      updateFields.content = content.trim();
    }
    if (starts_on !== undefined) updateFields.starts_on = starts_on || null;
    if (due_on !== undefined) updateFields.due_on = due_on || null;

    if (Object.keys(updateFields).length > 0) {
      await basecampService.updateTodo(accessToken, accountId, projectId, todoId, updateFields);
    }
    if (completed === true) {
      await basecampService.completeTodo(accessToken, accountId, projectId, todoId);
    } else if (completed === false) {
      await basecampService.uncompleteTodo(accessToken, accountId, projectId, todoId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update task error:', err.response?.data || err.message);
    const status = err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Token expired. Please reconnect Basecamp.' });
    if (status === 403) return res.status(403).json({ error: 'You do not have permission to edit this task.' });
    if (status === 404) return res.status(404).json({ error: 'Task not found.' });
    if (status === 422) return res.status(422).json({ error: 'Invalid data. Check date formats (YYYY-MM-DD).' });
    res.status(500).json({ error: 'Failed to update task' });
  }
}

module.exports = {
  showProjectSelect,
  showGantt,
  getTasks,
  getProjects,
  updateTask,
};
