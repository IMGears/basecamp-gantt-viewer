const axios = require('axios');
const config = require('../config');

const BASECAMP_AUTH_URL = 'https://launchpad.37signals.com/authorization/new';
const BASECAMP_TOKEN_URL = 'https://launchpad.37signals.com/authorization/token';
const BASECAMP_API_URL = 'https://3.basecampapi.com';

// Generate authorization URL
function getAuthUrl() {
  const params = new URLSearchParams({
    type: 'web_server',
    client_id: config.basecamp.clientId,
    redirect_uri: config.basecamp.callbackUrl,
  });
  return `${BASECAMP_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for access token
async function getAccessToken(code) {
  const response = await axios.post(BASECAMP_TOKEN_URL, {
    type: 'web_server',
    client_id: config.basecamp.clientId,
    client_secret: config.basecamp.clientSecret,
    redirect_uri: config.basecamp.callbackUrl,
    code,
  });
  return response.data;
}

// Refresh access token
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(BASECAMP_TOKEN_URL, {
    type: 'refresh',
    client_id: config.basecamp.clientId,
    client_secret: config.basecamp.clientSecret,
    refresh_token: refreshToken,
  });
  return response.data;
}

// Get user's Basecamp accounts (authorization info)
async function getAuthorization(accessToken) {
  const response = await axios.get('https://launchpad.37signals.com/authorization.json', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Basecamp Gantt Viewer (athulan@example.com)',
    },
  });
  return response.data;
}

// Create API client for a specific account
function createApiClient(accessToken, accountId) {
  const client = axios.create({
    baseURL: `${BASECAMP_API_URL}/${accountId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Basecamp Gantt Viewer (athulan@example.com)',
      'Content-Type': 'application/json',
    },
  });
  return client;
}

// Follow Basecamp pagination via Link headers and return all results
async function fetchAllPages(client, url) {
  let results = [];
  let nextUrl = url;

  while (nextUrl) {
    const response = await client.get(nextUrl);
    results = results.concat(response.data);

    // Parse Link header for next page
    const linkHeader = response.headers?.link;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = nextMatch ? nextMatch[1] : null;
    } else {
      nextUrl = null;
    }
  }

  return results;
}

// Get all projects
async function getProjects(accessToken, accountId) {
  const client = createApiClient(accessToken, accountId);
  return fetchAllPages(client, '/projects.json');
}

// Get project details
async function getProject(accessToken, accountId, projectId) {
  const client = createApiClient(accessToken, accountId);
  const response = await client.get(`/projects/${projectId}.json`);
  return response.data;
}

// Get to-do sets (lists container) for a project
async function getTodoSet(accessToken, accountId, projectId) {
  const client = createApiClient(accessToken, accountId);
  const project = await getProject(accessToken, accountId, projectId);

  // Find the todoset dock
  const todosetDock = project.dock.find(d => d.name === 'todoset');
  if (!todosetDock) {
    return null;
  }

  const response = await client.get(`/buckets/${projectId}/todosets/${todosetDock.id}.json`);
  return response.data;
}

// Get all to-do lists in a project
async function getTodoLists(accessToken, accountId, projectId) {
  const client = createApiClient(accessToken, accountId);
  const todoset = await getTodoSet(accessToken, accountId, projectId);

  if (!todoset) {
    return [];
  }

  return fetchAllPages(client, `/buckets/${projectId}/todosets/${todoset.id}/todolists.json`);
}

// Get all to-dos in a list
async function getTodos(accessToken, accountId, projectId, todoListId) {
  const client = createApiClient(accessToken, accountId);
  return fetchAllPages(client, `/buckets/${projectId}/todolists/${todoListId}/todos.json`);
}

// Get tasks for a specific project formatted for Gantt chart
async function getProjectTasksForGantt(accessToken, accountId, projectId) {
  const project = await getProject(accessToken, accountId, projectId);
  const ganttTasks = [];

  try {
    const todoLists = await getTodoLists(accessToken, accountId, projectId);

    // Fetch all todo lists in parallel instead of sequentially
    const todoResults = await Promise.all(
      todoLists.map(async (list) => {
        const todos = await getTodos(accessToken, accountId, projectId, list.id);
        return { list, todos };
      })
    );

    for (const { list, todos } of todoResults) {
      for (const todo of todos) {
        // Only include tasks with dates for Gantt display
        if (todo.starts_on || todo.due_on) {
          ganttTasks.push({
            id: todo.id.toString(),
            name: todo.content,
            start: todo.starts_on || todo.due_on,
            end: todo.due_on || todo.starts_on,
            progress: todo.completed ? 100 : 0,
            project: project.name,
            list: list.name,
            completed: todo.completed,
            assignees: todo.assignees?.map(a => a.name) || [],
            url: todo.app_url,
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error fetching tasks for project ${project.name}:`, err.message);
  }

  return ganttTasks;
}

module.exports = {
  getAuthUrl,
  getAccessToken,
  refreshAccessToken,
  getAuthorization,
  getProjects,
  getProject,
  getTodoSet,
  getTodoLists,
  getTodos,
  getProjectTasksForGantt,
};
