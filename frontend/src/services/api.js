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

export async function assuranceReadinessScore(body) {
  const res = await fetch(`${BASE_URL}/api/assurance-readiness/score`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// AI Analysis Endpoints - POST with { id } in body
// ---------------------------------------------------------------------------

export async function analyzeEsgReport(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-esg-report`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeCarbon(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-carbon`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeSustainability(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-sustainability`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function checkCompliance(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/check-compliance`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeSupplyChain(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-supply-chain`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function assessRisk(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/assess-risk`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function detectGreenwashing(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/detect-greenwashing`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function buildStakeholderReport(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/build-stakeholder-report`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function validateData(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/validate-data`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function analyzeClimate(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-climate`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function trackBiodiversity(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/track-biodiversity`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function optimizeWater(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/optimize-water`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function auditEnergy(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/audit-energy`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function measureSocial(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/measure-social`, {
    ...requestOptions,
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function monitorGovernance(id, requestOptions = {}) {
  const res = await fetch(`${BASE_URL}/api/ai/monitor-governance`, {
    ...requestOptions,
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
