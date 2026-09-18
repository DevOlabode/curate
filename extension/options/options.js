import { probeApiHealth } from '../shared/api.js';
import {
  getApiConfig,
  setApiBaseUrl,
  DEFAULT_API_URLS,
  sanitizeApiBaseUrl,
  toHostPermissionPattern,
  needsOptionalHostPermission,
} from '../shared/config.js';
import {
  requestHostPermission,
  removeHostPermission,
} from '../shared/browser.js';
import { getTheme } from '../shared/storage.js';

const HINTS = {
  production:
    'Uses the public Curate API. This URL is fixed so everyday installs stay on the hosted server.',
  development:
    'Local Curate server. http:// is allowed only for localhost, 127.0.0.1, and [::1]. Other ports are fine; Chrome will ask for permission if the port is not 3000.',
  selfhosted:
    'Your Curate instance. Use a full https:// URL with no wildcards. Chrome will prompt for access to that host only. Default permissions stay limited to the hosted API and localhost.',
};

const statusEl = document.getElementById('status');
const settingsForm = document.getElementById('settings-form');
const environmentSelect = document.getElementById('environment');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const hintEl = document.getElementById('api-url-hint');

let lastSelfhostedUrl = '';
let savedApiBaseUrl = '';

function showStatus(message, type = 'error') {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function resolveFormUrl() {
  const environment = environmentSelect.value;
  if (environment === 'production') {
    return { ok: true, url: DEFAULT_API_URLS.production, environment };
  }
  const sanitized = sanitizeApiBaseUrl(apiBaseUrlInput.value, { environment });
  if (!sanitized.ok) {
    return sanitized;
  }
  return { ok: true, url: sanitized.url, environment };
}

function syncUrlField({ preserveTyped = true } = {}) {
  const environment = environmentSelect.value;
  apiBaseUrlInput.readOnly = environment === 'production';
  apiBaseUrlInput.required = environment !== 'production';
  apiBaseUrlInput.setAttribute('aria-readonly', String(environment === 'production'));
  hintEl.textContent = HINTS[environment] || HINTS.production;

  if (environment === 'production') {
    apiBaseUrlInput.value = DEFAULT_API_URLS.production;
    return;
  }

  if (environment === 'development') {
    const current = apiBaseUrlInput.value.trim();
    const sanitized = sanitizeApiBaseUrl(current, { environment: 'development' });
    if (!preserveTyped || !sanitized.ok) {
      apiBaseUrlInput.value = DEFAULT_API_URLS.development;
    }
    return;
  }

  if (!preserveTyped || !apiBaseUrlInput.value.trim() || apiBaseUrlInput.readOnly) {
    apiBaseUrlInput.value = lastSelfhostedUrl;
  }
}

async function ensureHostPermission(url) {
  if (!needsOptionalHostPermission(url)) return true;
  return requestHostPermission(toHostPermissionPattern(url));
}

async function releasePreviousHost(previousUrl, nextUrl) {
  if (!previousUrl || previousUrl === nextUrl) return;
  if (!needsOptionalHostPermission(previousUrl)) return;
  if (toHostPermissionPattern(previousUrl) === toHostPermissionPattern(nextUrl)) return;
  try {
    await removeHostPermission(toHostPermissionPattern(previousUrl));
  } catch {
    // Optional cleanup; keep going if Chrome still holds the old grant.
  }
}

async function loadSettings() {
  const { environment, apiBaseUrl } = await getApiConfig();
  savedApiBaseUrl = apiBaseUrl;
  if (environment === 'selfhosted') {
    lastSelfhostedUrl = apiBaseUrl;
  }
  environmentSelect.value = environment;
  apiBaseUrlInput.value = apiBaseUrl;
  syncUrlField({ preserveTyped: true });
}

environmentSelect.addEventListener('change', () => {
  if (environmentSelect.value !== 'selfhosted') {
    const typed = apiBaseUrlInput.value.trim();
    const sanitized = sanitizeApiBaseUrl(typed);
    if (sanitized.ok && !Object.values(DEFAULT_API_URLS).includes(sanitized.url)) {
      lastSelfhostedUrl = sanitized.url;
    }
  }
  syncUrlField({ preserveTyped: false });
});

apiBaseUrlInput.addEventListener('input', () => {
  if (environmentSelect.value === 'selfhosted') {
    lastSelfhostedUrl = apiBaseUrlInput.value.trim();
  }
});

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const resolved = resolveFormUrl();
  if (!resolved.ok) {
    showStatus(resolved.error);
    return;
  }

  const granted = await ensureHostPermission(resolved.url);
  if (!granted) {
    showStatus('Permission denied. Chrome must allow this host before the extension can use it.');
    return;
  }

  try {
    const saved = await setApiBaseUrl(resolved.url, resolved.environment);
    await releasePreviousHost(savedApiBaseUrl, saved);
    savedApiBaseUrl = saved;
    apiBaseUrlInput.value = saved;
    if (resolved.environment === 'selfhosted') {
      lastSelfhostedUrl = saved;
    }
    showStatus('Settings saved.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
});

document.getElementById('test-connection').addEventListener('click', async () => {
  const resolved = resolveFormUrl();
  if (!resolved.ok) {
    showStatus(resolved.error);
    return;
  }

  const granted = await ensureHostPermission(resolved.url);
  if (!granted) {
    showStatus('Permission denied. Allow this host to test the connection.');
    return;
  }

  try {
    await probeApiHealth(resolved.url);
    showStatus('Connection successful.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
});

async function boot() {
  await loadSettings();
  const theme = await getTheme();
  document.documentElement.setAttribute('data-theme', theme);
}

boot();
