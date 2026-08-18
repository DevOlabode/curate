import { api, ApiError } from './api.js';
import { setAuth, clearAuth, getToken, getUser } from './storage.js';

export { ApiError };

export async function isAuthenticated() {
  const token = await getToken();
  if (!token) return false;
  try {
    await api.me();
    return true;
  } catch (err) {
    if (err.status === 401) {
      await clearAuth();
    }
    return false;
  }
}

export async function login(username, password) {
  const { token, user } = await api.login(username, password);
  await setAuth(token, user);
  return user;
}

export async function register(payload) {
  const { token, user } = await api.register(payload);
  await setAuth(token, user);
  return user;
}

export async function logout() {
  try {
    if (await getToken()) {
      await api.logout();
    }
  } catch {
    // Token may already be invalid; still clear local state.
  }
  await clearAuth();
}

export async function getSessionUser() {
  const cached = await getUser();
  if (!cached) return null;
  try {
    const { user } = await api.me();
    await setAuth(await getToken(), user);
    return user;
  } catch (err) {
    if (err.status === 401) {
      await clearAuth();
    }
    return null;
  }
}

export async function updateProfile(payload) {
  const { user } = await api.updateMe(payload);
  await setAuth(await getToken(), user);
  return user;
}

export async function changePassword(payload) {
  return api.changePassword(payload);
}

export async function deleteAccount() {
  await api.deleteAccount();
  await clearAuth();
}
