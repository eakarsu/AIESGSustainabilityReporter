const BASE_URL = process.env.REACT_APP_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Generic CRUD
// ---------------------------------------------------------------------------

export async function getAll(resource) {
  const res = await fetch(`${BASE_URL}/api/${resource}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getOne(resource, id) {
  const res = await fetch(`${BASE_URL}/api/${resource}/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createItem(resource, data) {
  const res = await fetch(`${BASE_URL}/api/${resource}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateItem(resource, id, data) {
  const res = await fetch(`${BASE_URL}/api/${resource}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteItem(resource, id) {
  const res = await fetch(`${BASE_URL}/api/${resource}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// AI Analysis Endpoints - POST with { id } in body
// ---------------------------------------------------------------------------

export async function analyzeEsgReport(id) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-esg-report`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeCarbon(id) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-carbon`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeSustainability(id) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-sustainability`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function checkCompliance(id) {
  const res = await fetch(`${BASE_URL}/api/ai/check-compliance`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeSupplyChain(id) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-supply-chain`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function assessRisk(id) {
  const res = await fetch(`${BASE_URL}/api/ai/assess-risk`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function detectGreenwashing(id) {
  const res = await fetch(`${BASE_URL}/api/ai/detect-greenwashing`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function buildStakeholderReport(id) {
  const res = await fetch(`${BASE_URL}/api/ai/build-stakeholder-report`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function validateData(id) {
  const res = await fetch(`${BASE_URL}/api/ai/validate-data`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeClimate(id) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-climate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function trackBiodiversity(id) {
  const res = await fetch(`${BASE_URL}/api/ai/track-biodiversity`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function optimizeWater(id) {
  const res = await fetch(`${BASE_URL}/api/ai/optimize-water`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function auditEnergy(id) {
  const res = await fetch(`${BASE_URL}/api/ai/audit-energy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function measureSocial(id) {
  const res = await fetch(`${BASE_URL}/api/ai/measure-social`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function monitorGovernance(id) {
  const res = await fetch(`${BASE_URL}/api/ai/monitor-governance`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  const res = await fetch(`${BASE_URL}/api/ai/dashboard-stats`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}
