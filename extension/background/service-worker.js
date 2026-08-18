/**
 * MV3 service worker — auth coordination and install lifecycle.
 * Does not assume persistent execution.
 */

const MESSAGE_TYPES = {
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  CLEAR_AUTH: 'CLEAR_AUTH',
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    console.info('[Curate] Extension installed/updated:', details.reason);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === MESSAGE_TYPES.GET_AUTH_STATE) {
    chrome.storage.local.get(['authToken', 'authUser'], (data) => {
      sendResponse({
        authenticated: Boolean(data.authToken),
        user: data.authUser || null,
      });
    });
    return true;
  }

  if (message?.type === MESSAGE_TYPES.CLEAR_AUTH) {
    chrome.storage.local.remove(['authToken', 'authUser'], () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

export { MESSAGE_TYPES };
