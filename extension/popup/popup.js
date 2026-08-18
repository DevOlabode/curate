import { api, ApiError } from '../shared/api.js';
import {
  login,
  register,
  logout,
  getSessionUser,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../shared/auth.js';
import { getTheme, setTheme } from '../shared/storage.js';
import { getApiBaseUrl } from '../shared/config.js';
import { normalizeUrl } from '../shared/url.js';

const $ = (sel) => document.querySelector(sel);

const views = {
  loading: $('#view-loading'),
  auth: $('#view-auth'),
  main: $('#view-main'),
  collection: $('#view-collection'),
  settings: $('#view-settings'),
};

const statusEl = $('#status');
const authForm = $('#auth-form');
const registerFields = $('#register-fields');
const authTitle = $('#auth-title');
const authSubmit = $('#auth-submit');
const toggleAuthMode = $('#toggle-auth-mode');
const bookmarkList = $('#bookmark-list');
const emptyState = $('#empty-state');
const collectionList = $('#collection-list');
const collectionsEmpty = $('#collections-empty');
const addForm = $('#add-form');
const userLine = $('#user-line');
const bookmarkFields = $('#bookmark-fields');
const collectionFields = $('#collection-fields');
const bookmarkCollectionSelect = $('#bookmark-collection');
const collectionBookmarksEl = $('#collection-bookmarks');
const collectionEmpty = $('#collection-empty');
const profileForm = $('#profile-form');
const passwordForm = $('#password-form');
const deleteForm = $('#delete-form');

let authMode = 'login';
let composerType = 'bookmark';
let currentUser = null;
let collectionsCache = [];

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

function hostnameFromUrl(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function collectionName(bookmark) {
  if (!bookmark.collection) return '';
  if (typeof bookmark.collection === 'object') {
    return bookmark.collection.name || '';
  }
  const found = collectionsCache.find((item) => item._id === bookmark.collection);
  return found ? found.name : '';
}

function bookmarkRowHtml(bookmark) {
  const href = escapeHtml(normalizeUrl(bookmark.url));
  const title = escapeHtml(bookmark.title);
  const host = escapeHtml(hostnameFromUrl(bookmark.url));
  const category = bookmark.category ? escapeHtml(bookmark.category) : '';
  const tags = Array.isArray(bookmark.tags) ? bookmark.tags.filter(Boolean) : [];
  const collection = escapeHtml(collectionName(bookmark));

  const chips = [
    category ? `<span class="chip">${category}</span>` : '',
    collection ? `<span class="chip chip-quiet">${collection}</span>` : '',
    ...tags.map((tag) => `<span class="chip chip-quiet">${escapeHtml(tag)}</span>`),
  ].join('');

  return `
    <a class="bookmark-main" href="${href}" target="_blank" rel="noopener noreferrer">
      <span class="bookmark-title">${title}</span>
      <span class="bookmark-host">${host}</span>
      ${chips ? `<div class="bookmark-meta">${chips}</div>` : ''}
    </a>
    <button class="icon-btn icon-btn-danger" type="button" data-delete="${bookmark._id}" aria-label="Delete ${title}" title="Delete">×</button>
  `;
}

function renderBookmarkList(container, bookmarks, emptyEl) {
  container.textContent = '';
  emptyEl.hidden = bookmarks.length > 0;

  bookmarks.forEach((bookmark) => {
    const item = document.createElement('article');
    item.className = 'bookmark-row';
    item.innerHTML = bookmarkRowHtml(bookmark);
    container.appendChild(item);
  });
}

function renderCollections(collections) {
  collectionList.textContent = '';
  collectionsEmpty.hidden = collections.length > 0;

  collections.forEach((collection) => {
    const count = Array.isArray(collection.bookmarks) ? collection.bookmarks.length : 0;
    const item = document.createElement('article');
    item.className = 'collection-card';
    item.innerHTML = `
      <button type="button" class="collection-main" data-open-collection="${collection._id}">
        <span class="collection-name">${escapeHtml(collection.name)}</span>
        <span class="collection-meta">${count} bookmark${count === 1 ? '' : 's'}</span>
        ${collection.description ? `<span class="collection-desc">${escapeHtml(collection.description)}</span>` : ''}
      </button>
      <button class="icon-btn icon-btn-danger" type="button" data-delete-collection="${collection._id}" aria-label="Delete ${escapeHtml(collection.name)}" title="Delete">×</button>
    `;
    collectionList.appendChild(item);
  });
}

function fillCollectionSelect(selectedId = '') {
  const current = selectedId || bookmarkCollectionSelect.value;
  bookmarkCollectionSelect.innerHTML = '<option value="">None</option>';
  collectionsCache.forEach((collection) => {
    const option = document.createElement('option');
    option.value = collection._id;
    option.textContent = collection.name;
    bookmarkCollectionSelect.appendChild(option);
  });
  bookmarkCollectionSelect.value = current;
}

async function loadLibrary() {
  const [{ bookmarks }, { collections }] = await Promise.all([
    api.listBookmarks(),
    api.listCollections(),
  ]);
  collectionsCache = collections;
  renderCollections(collections);
  renderBookmarkList(bookmarkList, bookmarks, emptyState);
  fillCollectionSelect();
}

function hideComposer() {
  addForm.hidden = true;
  addForm.reset();
  setComposerType('bookmark');
}

function setComposerType(type) {
  composerType = type;
  bookmarkFields.hidden = type !== 'bookmark';
  collectionFields.hidden = type !== 'collection';
  addForm.querySelectorAll('.composer-tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.type === type);
  });
}

async function bootMain(user) {
  currentUser = user;
  $('#open-settings').hidden = false;
  showView('main');
  userLine.textContent = `Signed in as ${user.username}`;
  hideComposer();
  await loadLibrary();
}

async function openCollection(id) {
  clearStatus();
  hideComposer();
  const { collection } = await api.getCollection(id);
  $('#collection-title').dataset.id = collection._id;
  $('#collection-title').textContent = collection.name;
  $('#collection-description').textContent = collection.description || '';
  const bookmarks = collection.bookmarks || [];
  renderBookmarkList(collectionBookmarksEl, bookmarks, collectionEmpty);
  showView('collection');
}

function fillSettings(user) {
  currentUser = user;
  $('#settings-user-line').textContent = `${user.firstName} ${user.lastName} (@${user.username})`;
  profileForm.elements.firstName.value = user.firstName || '';
  profileForm.elements.lastName.value = user.lastName || '';
  profileForm.elements.username.value = user.username || '';
  profileForm.elements.email.value = user.email || '';
  passwordForm.reset();
  deleteForm.reset();
}

async function boot() {
  showView('loading');
  clearStatus();

  try {
    const user = await getSessionUser();
    if (user) {
      await bootMain(user);
    } else {
      $('#open-settings').hidden = true;
      showView('auth');
    }
  } catch (err) {
    $('#open-settings').hidden = true;
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
  fillCollectionSelect();
});

$('#cancel-add').addEventListener('click', () => {
  hideComposer();
});

addForm.querySelectorAll('.composer-tab').forEach((tab) => {
  tab.addEventListener('click', () => setComposerType(tab.dataset.type));
});

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  const data = new FormData(addForm);

  try {
    if (composerType === 'collection') {
      const name = String(data.get('name') || '').trim();
      if (!name) {
        showStatus('Please add a collection name.');
        return;
      }
      await api.createCollection({
        name,
        description: data.get('description'),
      });
      showStatus('Collection saved.', 'success');
    } else {
      const title = String(data.get('title') || '').trim();
      const url = String(data.get('url') || '').trim();
      if (!title || !url) {
        showStatus('Please add a title and URL.');
        return;
      }
      await api.createBookmark({
        title,
        url: normalizeUrl(url),
        category: data.get('category'),
        tags: data.get('tags'),
        notes: '',
        collectionId: data.get('collectionId') || undefined,
      });
      showStatus('Bookmark saved.', 'success');
    }
    hideComposer();
    await loadLibrary();
  } catch (err) {
    showStatus(err.message);
  }
});

async function handleBookmarkDelete(id) {
  if (!confirm('Delete this bookmark?')) return;
  try {
    await api.deleteBookmark(id);
    const collectionId = $('#collection-title').dataset.id;
    if (!views.collection.hidden && collectionId) {
      await openCollection(collectionId);
    } else {
      await loadLibrary();
    }
    showStatus('Bookmark deleted.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
}

function bindBookmarkDeletes(container) {
  container.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-delete]');
    if (!btn) return;
    event.preventDefault();
    await handleBookmarkDelete(btn.dataset.delete);
  });
}

bindBookmarkDeletes(bookmarkList);
bindBookmarkDeletes(collectionBookmarksEl);

collectionList.addEventListener('click', async (event) => {
  const openBtn = event.target.closest('[data-open-collection]');
  const deleteBtn = event.target.closest('[data-delete-collection]');

  if (deleteBtn) {
    if (!confirm('Delete this collection and its bookmarks?')) return;
    try {
      await api.deleteCollection(deleteBtn.dataset.deleteCollection);
      await loadLibrary();
      showStatus('Collection deleted.', 'success');
    } catch (err) {
      showStatus(err.message);
    }
    return;
  }

  if (openBtn) {
    try {
      await openCollection(openBtn.dataset.openCollection);
    } catch (err) {
      showStatus(err.message);
    }
  }
});

$('#collection-back').addEventListener('click', async () => {
  clearStatus();
  showView('main');
  await loadLibrary();
});

$('#open-settings').addEventListener('click', () => {
  if (!currentUser) return;
  clearStatus();
  hideComposer();
  fillSettings(currentUser);
  showView('settings');
});

$('#settings-back').addEventListener('click', () => {
  clearStatus();
  showView('main');
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  const data = new FormData(profileForm);
  try {
    const user = await updateProfile({
      firstName: data.get('firstName'),
      lastName: data.get('lastName'),
      username: data.get('username'),
      email: data.get('email'),
    });
    fillSettings(user);
    userLine.textContent = `Signed in as ${user.username}`;
    showStatus('Profile updated.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  const data = new FormData(passwordForm);
  try {
    await changePassword({
      currentPassword: data.get('currentPassword'),
      newPassword: data.get('newPassword'),
      confirmPassword: data.get('confirmPassword'),
    });
    passwordForm.reset();
    showStatus('Password updated.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  await logout();
  currentUser = null;
  collectionsCache = [];
  hideComposer();
  $('#open-settings').hidden = true;
  showView('auth');
  showStatus('Logged out.', 'success');
});

deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();
  const typed = String(new FormData(deleteForm).get('confirmUsername') || '').trim();
  if (!currentUser || typed !== currentUser.username) {
    showStatus('Type your username to confirm account deletion.');
    return;
  }
  if (!confirm('Delete your account permanently?')) return;
  try {
    await deleteAccount();
    currentUser = null;
    collectionsCache = [];
    hideComposer();
    $('#open-settings').hidden = true;
    showView('auth');
    showStatus('Your account was deleted.', 'success');
  } catch (err) {
    showStatus(err.message);
  }
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
