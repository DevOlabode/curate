/** Default API base URLs - no secrets. Overridable in options. */
export const DEFAULT_API_URLS = {
  development: 'http://localhost:3000',
  production: 'https://curate-h0ga.onrender.com',
};

export const API_PREFIX = '/api/v1';

export const ENVIRONMENTS = ['production', 'development', 'selfhosted'];

const LEGACY_HOSTS = new Set([
  'https://developer-bookmark-vault-5.onrender.com',
]);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export class ApiUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiUrlError';
  }
}

export function normalizeEnvironment(value) {
  if (value === 'development' || value === 'selfhosted') return value;
  return 'production';
}

export function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function canonicalizeHostname(hostname) {
  return String(hostname || '')
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
}

export function isLocalHostname(hostname) {
  return LOCAL_HOSTNAMES.has(canonicalizeHostname(hostname));
}

export function isLocalApiUrl(url) {
  try {
    return isLocalHostname(new URL(normalizeBaseUrl(url)).hostname);
  } catch {
    return false;
  }
}

export function isLegacyApiUrl(url) {
  return LEGACY_HOSTS.has(normalizeBaseUrl(url));
}

export function isProductionApiUrl(url) {
  return normalizeBaseUrl(url) === DEFAULT_API_URLS.production;
}

export function builtinApiOrigins() {
  return Object.values(DEFAULT_API_URLS).map((url) => new URL(url).origin);
}

/**
 * Parse, validate, and sanitize an API base URL.
 * http:// is only allowed for loopback hosts so CSP and optional
 * permissions can stay scoped.
 *
 * @param {unknown} raw
 * @param {{ environment?: string }} [options]
 * @returns {{ ok: true, url: string, origin: string } | { ok: false, error: string }}
 */
export function sanitizeApiBaseUrl(raw, options = {}) {
  const environment = options.environment
    ? normalizeEnvironment(options.environment)
    : undefined;
  const trimmed = String(raw ?? '').trim();

  if (!trimmed) {
    return { ok: false, error: 'Enter an API base URL, including https:// or http://.' };
  }

  if (trimmed.includes('*')) {
    return { ok: false, error: 'API URL cannot contain * wildcards. Use a specific hostname.' };
  }

  if (/[\s<>\\]/.test(trimmed)) {
    return { ok: false, error: 'API URL cannot contain spaces or angle brackets.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: 'Enter a full URL with a scheme, for example https://curate.example.com.',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'API URL must use http:// or https://.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'API URL cannot include a username or password.' };
  }

  if (parsed.hash) {
    return { ok: false, error: 'API URL cannot include a #fragment.' };
  }

  if (parsed.search) {
    return { ok: false, error: 'API URL cannot include query parameters.' };
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return { ok: false, error: 'API URL must include a hostname.' };
  }

  if (hostname.includes('*')) {
    return { ok: false, error: 'API URL must include a specific hostname, not a wildcard.' };
  }

  if (parsed.protocol === 'http:' && !isLocalHostname(hostname)) {
    return {
      ok: false,
      error: 'http:// is only allowed for localhost, 127.0.0.1, or [::1]. Use https:// for a self-hosted server.',
    };
  }

  if (environment === 'production') {
    const production = new URL(DEFAULT_API_URLS.production);
    return { ok: true, url: DEFAULT_API_URLS.production, origin: production.origin };
  }

  if (environment === 'development' && !isLocalHostname(hostname)) {
    return { ok: false, error: 'Development must point at localhost, 127.0.0.1, or [::1].' };
  }

  const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
  const url = `${parsed.origin}${path}`;
  return { ok: true, url, origin: parsed.origin };
}

export function toHostPermissionPattern(url) {
  return `${new URL(url).origin}/*`;
}

export function needsOptionalHostPermission(url) {
  try {
    return !builtinApiOrigins().includes(new URL(url).origin);
  } catch {
    return true;
  }
}

/**
 * Resolve stored environment + URL without touching chrome.storage.
 * Callers persist `persist` when `shouldPersist` is true.
 */
export function resolveStoredApiConfig(stored = {}) {
  const persist = {};
  const set = (patch) => Object.assign(persist, patch);

  if (!stored.apiHostMigratedToRender) {
    set({ apiHostMigratedToRender: true });
  }

  const raw = typeof stored.apiBaseUrl === 'string' ? stored.apiBaseUrl : '';
  const sanitized = raw ? sanitizeApiBaseUrl(raw) : { ok: false };

  if (!raw || isLegacyApiUrl(raw) || (sanitized.ok && isLegacyApiUrl(sanitized.url))) {
    return finish(stored, persist, 'production', DEFAULT_API_URLS.production);
  }

  let environment = stored.environment;
  if (environment !== 'development' && environment !== 'selfhosted') {
    if (sanitized.ok && isLocalApiUrl(sanitized.url)) {
      environment = 'development';
    } else if (sanitized.ok && !isProductionApiUrl(sanitized.url)) {
      environment = 'selfhosted';
    } else {
      environment = 'production';
    }
  }

  if (environment === 'development') {
    const url = sanitized.ok && isLocalApiUrl(sanitized.url)
      ? sanitized.url
      : DEFAULT_API_URLS.development;
    return finish(stored, persist, 'development', url);
  }

  if (environment === 'selfhosted') {
    if (sanitized.ok && !isLegacyApiUrl(sanitized.url)) {
      return finish(stored, persist, 'selfhosted', sanitized.url);
    }
    return finish(stored, persist, 'production', DEFAULT_API_URLS.production);
  }

  return finish(stored, persist, 'production', DEFAULT_API_URLS.production);
}

function finish(stored, persist, environment, apiBaseUrl) {
  persist.environment = environment;
  persist.apiBaseUrl = apiBaseUrl;

  const next = {};
  for (const [key, value] of Object.entries(persist)) {
    if (stored[key] !== value) {
      next[key] = value;
    }
  }

  return {
    environment,
    apiBaseUrl,
    persist: next,
    shouldPersist: Object.keys(next).length > 0,
  };
}
