import {
  DEFAULT_API_URLS,
  normalizeEnvironment,
  sanitizeApiBaseUrl,
  resolveStoredApiConfig,
  ApiUrlError,
} from './apiUrl.js';

export {
  DEFAULT_API_URLS,
  API_PREFIX,
  ENVIRONMENTS,
  ApiUrlError,
  normalizeEnvironment,
  normalizeBaseUrl,
  sanitizeApiBaseUrl,
  resolveStoredApiConfig,
  toHostPermissionPattern,
  needsOptionalHostPermission,
} from './apiUrl.js';

export const REQUEST_TIMEOUT_MS = 30000;

async function loadStoredApiConfig() {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  const stored = await storage.get([
    'apiBaseUrl',
    'environment',
    'apiHostMigratedToRender',
  ]);
  const resolved = resolveStoredApiConfig(stored);
  if (resolved.shouldPersist) {
    await storage.set(resolved.persist);
  }
  return resolved;
}

export async function getApiConfig() {
  const resolved = await loadStoredApiConfig();
  return {
    apiBaseUrl: resolved.apiBaseUrl,
    environment: resolved.environment,
  };
}

export async function getApiBaseUrl() {
  const { apiBaseUrl } = await getApiConfig();
  return apiBaseUrl;
}

export async function setApiBaseUrl(url, environment = 'production') {
  const { getStorageArea } = await import('./browser.js');
  const storage = getStorageArea();
  const env = normalizeEnvironment(environment);

  let nextUrl = DEFAULT_API_URLS.production;
  if (env !== 'production') {
    const sanitized = sanitizeApiBaseUrl(url, { environment: env });
    if (!sanitized.ok) {
      throw new ApiUrlError(sanitized.error);
    }
    nextUrl = sanitized.url;
  }

  await storage.set({
    apiBaseUrl: nextUrl,
    environment: env,
    apiHostMigratedToRender: true,
  });
  return nextUrl;
}

export async function getEnvironment() {
  const { environment } = await getApiConfig();
  return environment;
}
