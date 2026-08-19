/** Default API base URLs - no secrets. Overridable in options. */
export const DEFAULT_API_URLS = {
  development: 'http://localhost:3000',
  production: 'https://curate-h0ga.onrender.com',
};

export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 30000;

const LEGACY_HOSTS = [
  'https://developer-bookmark-vault-5.onrender.com',
];

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

function isLocalHost(url) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizeBaseUrl(url));
}

export async function getApiBaseUrl() {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  const stored = await storage.get([
    'apiBaseUrl',
    'environment',
    'apiHostMigratedToRender',
  ]);

  if (!stored.apiHostMigratedToRender) {
    await storage.set({
      apiBaseUrl: DEFAULT_API_URLS.production,
      environment: 'production',
      apiHostMigratedToRender: true,
    });
    return DEFAULT_API_URLS.production;
  }

  const env = stored.environment === 'development' ? 'development' : 'production';
  let url = normalizeBaseUrl(stored.apiBaseUrl);

  if (env === 'production') {
    if (!url || isLocalHost(url) || LEGACY_HOSTS.includes(url)) {
      url = DEFAULT_API_URLS.production;
      await storage.set({ apiBaseUrl: url, environment: 'production' });
    }
    return url;
  }

  return url || DEFAULT_API_URLS.development;
}

export async function setApiBaseUrl(url, environment = 'production') {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  await storage.set({
    apiBaseUrl: normalizeBaseUrl(url),
    environment,
  });
}

export async function getEnvironment() {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  const { environment } = await storage.get(['environment']);
  return environment === 'development' ? 'development' : 'production';
}
