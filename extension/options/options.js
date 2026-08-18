import { api } from '../shared/api.js';
import { logout, getSessionUser } from '../shared/auth.js';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  getEnvironment,
  DEFAULT_API_URLS,
} from '../shared/config.js';
import { getTheme, setTheme } from '../shared/storage.js';

const statusEl = document.getElementById('status');
const settingsForm = document.getElementById('settings-form');
const environmentSelect = document.getElementById('environment');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const accountPanel = document.getElementById('account-panel');
const accountInfo = document.getElementById('account-info');
const collectionsPanel = document.getElementById('collections-panel');
const collectionsList = document.getElementById('collections-list');
const collectionForm = document.getElementById('collection-form');

function showStatus(message, type = 'error') {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout();
  accountPanel.hidden = true;
  collectionsPanel.hidden = true;
  showStatus('Logged out.', 'success');
});

async function loadCollections() {
  const { collections } = await api.listCollections();
  collectionsList.textContent = '';
  collections.forEach((collection) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(collection.name)}</strong>
      <div class="muted">${escapeHtml(collection.description || 'No description')}</div>`;
    collectionsList.appendChild(li);
  });
}

collectionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(collectionForm);
  try {
    await api.createCollection({
      name: data.get('name'),
      description: data.get('description'),
    });
    collectionForm.reset();
    await loadCollections();
    showStatus('Collection created.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
});

async function boot() {
  await loadSettings();
  const theme = await getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  const user = await getSessionUser();
  if (user) {
    accountPanel.hidden = false;
    collectionsPanel.hidden = false;
    accountInfo.textContent = `${user.firstName} ${user.lastName} (@${user.username}) — ${user.email}`;
    try {
      await loadCollections();
    } catch (err) {
      showStatus(err.message);
    }
  }
}

boot();
