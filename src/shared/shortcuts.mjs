/**
 * Popup keyboard shortcuts and the add-bookmark command.
 *
 * Suggested keys avoid Chrome/Edge chrome bindings such as Ctrl+T, Ctrl+W,
 * Ctrl+L, and Ctrl+Shift+B (bookmarks bar). Users can remap or disable the
 * command at chrome://extensions/shortcuts or edge://extensions/shortcuts.
 */

export const COMMANDS = {
  ADD_BOOKMARK: 'add-bookmark',
};

export const MESSAGE_TYPES = {
  OPEN_ADD_BOOKMARK: 'OPEN_ADD_BOOKMARK',
};

export const PENDING_ADD_KEY = 'pendingAddBookmark';

export const ADD_BOOKMARK_SUGGESTED_KEY = {
  default: 'Alt+Shift+S',
  mac: 'Alt+Shift+S',
};

export const ESCAPE_ACTIONS = {
  SUPPRESS: 'suppress-browser-default',
  CLOSE_COMPOSER: 'close-composer',
  CLOSE_COLLECTION_COMPOSER: 'close-collection-composer',
  BACK_COLLECTION: 'back-collection',
  BACK_SETTINGS: 'back-settings',
};

export const SHORTCUTS = [
  {
    id: COMMANDS.ADD_BOOKMARK,
    keys: 'Alt+Shift+S',
    macKeys: 'Option+Shift+S',
    description: 'Open the popup on Add a bookmark and prefill the current tab when the URL is http(s).',
    justification: 'Alt+Shift+S is unused by Chrome/Edge chrome, unlike Ctrl+T/W/L or Ctrl+Shift+B. Remappable from the browser shortcuts page.',
  },
  {
    id: 'escape',
    keys: 'Esc',
    description: 'Close the add/edit form, or go back from a collection or Account to the library. On the library with no form open, Esc still closes the popup.',
    justification: 'Standard cancel/back. preventDefault only when Curate handles the key so the home view still dismisses like other extension popups.',
  },
];

function emptyPage() {
  return { url: '', title: '' };
}

export function isSavableTabUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function tabPageFromTab(tab) {
  if (!tab || typeof tab !== 'object') return emptyPage();
  const url = isSavableTabUrl(tab.url) ? tab.url : '';
  const title = url && typeof tab.title === 'string' ? tab.title : '';
  return { url, title };
}

export async function queryActiveTabPage(tabsApi) {
  if (!tabsApi || typeof tabsApi.query !== 'function') return emptyPage();
  try {
    const tabs = await tabsApi.query({ active: true, lastFocusedWindow: true });
    return tabPageFromTab(Array.isArray(tabs) ? tabs[0] : undefined);
  } catch {
    return emptyPage();
  }
}

export function createPendingAddPayload(page) {
  return {
    openComposer: true,
    url: page?.url || '',
    title: page?.title || '',
  };
}

export function pendingAddFromStorage(value) {
  if (!value || value.openComposer !== true) return null;
  return createPendingAddPayload(value);
}

export function fillEmptyBookmarkFields(form, page) {
  if (!form?.elements || !page) return form;
  if (page.title && form.elements.title && !String(form.elements.title.value || '').trim()) {
    form.elements.title.value = page.title;
  }
  if (page.url && form.elements.url && !String(form.elements.url.value || '').trim()) {
    form.elements.url.value = page.url;
  }
  return form;
}

/**
 * Decide what Esc should do. `null` means leave the event alone so the
 * browser can close the popup.
 */
export function resolveEscapeAction({
  addFormOpen = false,
  collectionAddFormOpen = false,
  onCollectionView = false,
  onSettingsView = false,
  targetIsSelect = false,
} = {}) {
  if (targetIsSelect) return ESCAPE_ACTIONS.SUPPRESS;
  if (addFormOpen) return ESCAPE_ACTIONS.CLOSE_COMPOSER;
  if (collectionAddFormOpen) return ESCAPE_ACTIONS.CLOSE_COLLECTION_COMPOSER;
  if (onCollectionView) return ESCAPE_ACTIONS.BACK_COLLECTION;
  if (onSettingsView) return ESCAPE_ACTIONS.BACK_SETTINGS;
  return null;
}

export function shouldHandleEscapeKey(event) {
  if (!event || event.defaultPrevented) return false;
  if (event.isComposing || event.key === 'Process') return false;
  if (event.key !== 'Escape') return false;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  return true;
}
