import { getStorageArea } from './browser.js';

const KEYS = {
  token: 'authToken',
  user: 'authUser',
  theme: 'theme',
};

export async function getToken() {
  const storage = getStorageArea();
  const data = await storage.get([KEYS.token]);
  return data[KEYS.token] || null;
}

export async function setAuth(token, user) {
  const storage = getStorageArea();
  await storage.set({
    [KEYS.token]: token,
    [KEYS.user]: user,
  });
}

export async function getUser() {
  const storage = getStorageArea();
  const data = await storage.get([KEYS.user]);
  return data[KEYS.user] || null;
}

export async function clearAuth() {
  const storage = getStorageArea();
  await storage.remove([KEYS.token, KEYS.user]);
}

export async function getTheme() {
  const storage = getStorageArea();
  const data = await storage.get([KEYS.theme]);
  return data[KEYS.theme] || 'light';
}

export async function setTheme(theme) {
  const storage = getStorageArea();
  await storage.set({ [KEYS.theme]: theme });
}

export { KEYS };
