import { getApiBaseUrl, API_PREFIX, REQUEST_TIMEOUT_MS } from './config.js';
import { getToken } from './storage.js';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function apiRequest(path, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const token = await getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status, data);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network error', 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  health: () => apiRequest('/health'),
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  listBookmarks: () => apiRequest('/bookmarks'),
  createBookmark: (payload) =>
    apiRequest('/bookmarks', { method: 'POST', body: JSON.stringify(payload) }),
  updateBookmark: (id, payload) =>
    apiRequest(`/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBookmark: (id) => apiRequest(`/bookmarks/${id}`, { method: 'DELETE' }),
  listCollections: () => apiRequest('/collections'),
  createCollection: (payload) =>
    apiRequest('/collections', { method: 'POST', body: JSON.stringify(payload) }),
  getCollection: (id) => apiRequest(`/collections/${id}`),
  updateCollection: (id, payload) =>
    apiRequest(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCollection: (id) => apiRequest(`/collections/${id}`, { method: 'DELETE' }),
};
