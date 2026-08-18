import { api, ApiError } from '../shared/api.js';
import { login, register, logout, getSessionUser } from '../shared/auth.js';
import { getTheme, setTheme } from '../shared/storage.js';
import { getRuntime } from '../shared/browser.js';
import { getApiBaseUrl } from '../shared/config.js';
import { normalizeUrl } from '../shared/url.js';

const $ = (sel) => document.querySelector(sel);

const views = {
  loading: $('#view-loading'),
  auth: $('#view-auth'),
  main: $('#view-main'),
};

const statusEl = $('#status');
const authForm = $('#auth-form');
const registerFields = $('#register-fields');
const authTitle = $('#auth-title');
const authSubmit = $('#auth-submit');
const toggleAuthMode = $('#toggle-auth-mode');
const bookmarkList = $('#bookmark-list');
const emptyState = $('#empty-state');
const addForm = $('#add-form');
const userLine = $('#user-line');

let authMode = 'login';

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

function showStatus(message, type = 'error') {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = '';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBookmarks(bookmarks) {
  bookmarkList.textContent = '';
  emptyState.hidden = bookmarks.length > 0;

  bookmarks.forEach((bookmark) => {
    const item = document.createElement('article');
    item.className = 'bookmark-item';
    item.innerHTML = `
      <h3>${escapeHtml(bookmark.title)}</h3>
      <a href="${escapeHtml(normalizeUrl(bookmark.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(bookmark.url)}</a>
      <div class="bookmark-meta">
        <span class="chip">${escapeHtml(bookmark.category || 'General')}</span>
      </div>
      <div class="item-actions">
        <button class="btn btn-danger" type="button" data-delete="${bookmark._id}">Delete</button>
      </div>
    `;
    bookmarkList.appendChild(item);
  });

  bookmarkList.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this bookmark?')) return;
      try {
        await api.deleteBookmark(btn.dataset.delete);
        await loadBookmarks();
        showStatus('Bookmark deleted.', 'success');
      } catch (err) {
        showStatus(err.message);
      }
    });
  });
}

async function loadBookmarks() {
  const { bookmarks } = await api.listBookmarks();
  renderBookmarks(bookmarks);
}

async function bootMain(user) {
  showView('main');
  userLine.textContent = `Signed in as ${user.username}`;
  await loadBookmarks();
}

async function boot() {
  showView('loading');
  clearStatus();

  try {
    const user = await getSessionUser();
    if (user) {
      await bootMain(user);
    } else {
      showView('auth');
    }
  } catch (err) {
    showView('auth');
    showStatus(err.message);
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === 'register';
  registerFields.hidden = !isRegister;
  authTitle.textContent = isRegister ? 'Create account' : 'Sign in';
  authSubmit.textContent = isRegister ? 'Sign up' : 'Sign in';
  toggleAuthMode.textContent = isRegister ? 'Already have an account?' : 'Create an account';
  const forgotWrap = $('#forgot-wrap');
  if (forgotWrap) forgotWrap.hidden = isRegister;
}

toggleAuthMode.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  const data = new FormData(authForm);

  try {
    if (authMode === 'login') {
      const user = await login(data.get('username'), data.get('password'));
      await bootMain(user);
    } else {
      const user = await register({
        firstName: data.get('firstName'),
        lastName: data.get('lastName'),
        email: data.get('email'),
        username: data.get('username'),
        password: data.get('password'),
      });
      await bootMain(user);
    }
    authForm.reset();
    setAuthMode('login');
  } catch (err) {
    showStatus(err.message);
  }
});

$('#show-add-form').addEventListener('click', () => {
  addForm.hidden = false;
});

$('#cancel-add').addEventListener('click', () => {
  addForm.hidden = true;
  addForm.reset();
});

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  const data = new FormData(addForm);

  try {
    await api.createBookmark({
      title: data.get('title'),
      url: normalizeUrl(data.get('url')),
      category: data.get('category'),
      tags: data.get('tags'),
      notes: '',
    });
    addForm.reset();
    addForm.hidden = true;
    await loadBookmarks();
    showStatus('Bookmark saved.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
});

$('#open-options').addEventListener('click', () => {
  getRuntime().openOptionsPage();
});

$('#theme-toggle').addEventListener('click', async () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  await setTheme(next);
});

async function initTheme() {
  const theme = await getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const forgotLink = $('#forgot-password-link');
  if (forgotLink) {
    forgotLink.href = `${await getApiBaseUrl()}/forgot-password`;
  }
}

initTheme();
boot();

export { ApiError, logout };
