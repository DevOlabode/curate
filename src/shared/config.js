/** Default API base URLs — no secrets. Overridable in options. */
export const DEFAULT_API_URLS = {
  development: 'http://localhost:3000',
  production: 'https://developer-bookmark-vault-5.onrender.com',
};

export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 15000;

export async function getApiBaseUrl() {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  const stored = await storage.get(['apiBaseUrl', 'environment']);
  if (stored.apiBaseUrl) {
    return stored.apiBaseUrl.replace(/\/$/, '');
  }
  const env = stored.environment === 'development' ? 'development' : 'production';
  return DEFAULT_API_URLS[env];
}

export async function setApiBaseUrl(url, environment = 'production') {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  await storage.set({
    apiBaseUrl: url.replace(/\/$/, ''),
    environment,
  });
}

export async function getEnvironment() {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  const { environment } = await storage.get(['environment']);
  return environment === 'development' ? 'development' : 'production';
}
