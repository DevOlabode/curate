/**
 * Cross-browser compatibility (Chrome + Edge Chromium).
 * Edge exposes the `chrome` namespace for MV3 extensions.
 */
export function getBrowser() {
  if (typeof globalThis.browser !== 'undefined' && globalThis.browser.runtime) {
    return globalThis.browser;
  }
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.runtime) {
    return globalThis.chrome;
  }
  throw new Error('Extension APIs are unavailable');
}

export function getRuntime() {
  return getBrowser().runtime;
}

export function getStorageArea(area = 'local') {
  return getBrowser().storage[area];
}

export function getPermissionsApi() {
  return getBrowser().permissions || null;
}

export async function requestHostPermission(originPattern) {
  const permissions = getPermissionsApi();
  if (!permissions?.request) return true;
  return permissions.request({ origins: [originPattern] });
}

export async function hasHostPermission(originPattern) {
  const permissions = getPermissionsApi();
  if (!permissions?.contains) return false;
  return permissions.contains({ origins: [originPattern] });
}

export async function removeHostPermission(originPattern) {
  const permissions = getPermissionsApi();
  if (!permissions?.remove) return false;
  return permissions.remove({ origins: [originPattern] });
}
