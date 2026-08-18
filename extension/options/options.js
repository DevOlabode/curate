import { api } from '../shared/api.js';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  getEnvironment,
  DEFAULT_API_URLS,
} from '../shared/config.js';
import { getTheme } from '../shared/storage.js';

const statusEl = document.getElementById('status');
const settingsForm = document.getElementById('settings-form');
const environmentSelect = document.getElementById('environment');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');

function showStatus(message, type = 'error') {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

async function loadSettings() {
  const env = await getEnvironment();
  environmentSelect.value = env;
  apiBaseUrlInput.value = await getApiBaseUrl();
}

environmentSelect.addEventListener('change', () => {
  const env = environmentSelect.value;
  apiBaseUrlInput.value = DEFAULT_API_URLS[env];
});

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const env = environmentSelect.value;
  const url = apiBaseUrlInput.value.trim();
  await setApiBaseUrl(url, env);
  showStatus('Settings saved.', 'success');
});

document.getElementById('test-connection').addEventListener('click', async () => {
  try {
    await api.health();
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
