/**
 * MV3 service worker - auth coordination, install lifecycle, and commands.
 * Does not assume persistent execution.
 */

import {
  COMMANDS,
  MESSAGE_TYPES as SHORTCUT_MESSAGES,
  PENDING_ADD_KEY,
  createPendingAddPayload,
  queryActiveTabPage,
} from '../shared/shortcuts.mjs';

const MESSAGE_TYPES = {
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  CLEAR_AUTH: 'CLEAR_AUTH',
};

function pendingStorage() {
  return chrome.storage.session || chrome.storage.local;
}

async function stashPendingAddBookmark(page) {
  await pendingStorage().set({
    [PENDING_ADD_KEY]: createPendingAddPayload(page),
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMANDS.ADD_BOOKMARK) return;

  const page = await queryActiveTabPage(chrome.tabs);
  await stashPendingAddBookmark(page);

  try {
    await chrome.action.openPopup();
  } catch {
    // Older Chromium, or the popup is already visible.
  }

  try {
    await chrome.runtime.sendMessage({
      type: SHORTCUT_MESSAGES.OPEN_ADD_BOOKMARK,
      ...page,
    });
  } catch {
    // No listener when the popup is closed; boot reads storage instead.
  }
});

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
