import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const BASE_URL = process.env.API_BASE_URL || 'http://clinvida.ddnsfree.com:9000';

let cachedToken = null;

async function getOrFetchToken() {
  if (cachedToken) return cachedToken;

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to login: ${response.status}`);
    }
    const token = await response.text();
    cachedToken = token.trim();
    return cachedToken;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    return null;
  }
}

// Fetches a path under /api/agendamento on the ClinVida backend, handling
// bearer token acquisition/caching and a single retry on 401.
export async function clinvidaRequest(path, { method = 'GET', body } = {}) {
  let token = await getOrFetchToken();

  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}/api/agendamento/${path}`;
  const requestInit = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let response = await fetch(url, requestInit);

  if (response.status === 401) {
    cachedToken = null;
    token = await getOrFetchToken();

    const retryHeaders = { ...headers };
    if (token) {
      retryHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete retryHeaders['Authorization'];
    }
    response = await fetch(url, { ...requestInit, headers: retryHeaders });
  }

  return response.json();
}
