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

  const { _retried, ...fetchOptions } = options;

  try {
    const response = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
      ...fetchOptions,
      headers,
      credentials: 'omit',
      signal: controller.signal,
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status, data);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. The server may still be waking up. Try again.', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    if (!_retried) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return apiRequest(path, { ...fetchOptions, _retried: true });
    }
    throw new ApiError(
      `Could not reach ${baseUrl}. Open extension options, set Production (${baseUrl || 'https://curate-h0ga.onrender.com'}), save, then reload the extension.`,
      0
    );
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
  updateMe: (payload) =>
    apiRequest('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload) =>
    apiRequest('/auth/password', { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAccount: () => apiRequest('/auth/me', { method: 'DELETE' }),
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
