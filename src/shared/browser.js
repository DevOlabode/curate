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
