import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADD_BOOKMARK_SUGGESTED_KEY,
  COMMANDS,
  ESCAPE_ACTIONS,
  createPendingAddPayload,
  fillEmptyBookmarkFields,
  isSavableTabUrl,
  pendingAddFromStorage,
  queryActiveTabPage,
  resolveEscapeAction,
  shouldHandleEscapeKey,
  tabPageFromTab,
} from '../../src/shared/shortcuts.mjs';

test('suggested add-bookmark key avoids reserved browser chrome shortcuts', () => {
  const reserved = ['Ctrl+T', 'Ctrl+W', 'Ctrl+L', 'Ctrl+Shift+B', 'Ctrl+N', 'Ctrl+Shift+N'];
  for (const binding of Object.values(ADD_BOOKMARK_SUGGESTED_KEY)) {
    assert.equal(binding, 'Alt+Shift+S');
    for (const shortcut of reserved) {
      assert.notEqual(binding, shortcut);
    }
  }
  assert.equal(COMMANDS.ADD_BOOKMARK, 'add-bookmark');
});

test('isSavableTabUrl accepts only http(s) pages', () => {
  assert.equal(isSavableTabUrl('https://example.com/docs'), true);
  assert.equal(isSavableTabUrl('http://localhost:3000'), true);
  assert.equal(isSavableTabUrl('chrome://extensions'), false);
  assert.equal(isSavableTabUrl('edge://settings'), false);
  assert.equal(isSavableTabUrl('about:blank'), false);
  assert.equal(isSavableTabUrl('chrome-extension://abc/popup.html'), false);
  assert.equal(isSavableTabUrl('file:///tmp/page.html'), false);
  assert.equal(isSavableTabUrl(''), false);
  assert.equal(isSavableTabUrl('not a url'), false);
});

test('tabPageFromTab drops internal pages and keeps http(s) title and url', () => {
  assert.deepEqual(
    tabPageFromTab({ url: 'https://voult.dev', title: 'Voult' }),
    { url: 'https://voult.dev', title: 'Voult' },
  );
  assert.deepEqual(
    tabPageFromTab({ url: 'chrome://newtab/', title: 'New Tab' }),
    { url: '', title: '' },
  );
  assert.deepEqual(tabPageFromTab(undefined), { url: '', title: '' });
});

test('queryActiveTabPage reads the active tab and ignores query failures', async () => {
  const page = await queryActiveTabPage({
    query: async () => [{ url: 'https://example.com', title: 'Example' }],
  });
  assert.deepEqual(page, { url: 'https://example.com', title: 'Example' });

  const empty = await queryActiveTabPage({
    query: async () => {
      throw new Error('no tab access');
    },
  });
  assert.deepEqual(empty, { url: '', title: '' });
});

test('pending add payload round-trips through storage helpers', () => {
  const payload = createPendingAddPayload({ url: 'https://a.dev', title: 'A' });
  assert.deepEqual(pendingAddFromStorage(payload), payload);
  assert.equal(pendingAddFromStorage(null), null);
  assert.equal(pendingAddFromStorage({ url: 'https://a.dev' }), null);
});

test('fillEmptyBookmarkFields writes only blank title and url inputs', () => {
  const form = {
    elements: {
      title: { value: '' },
      url: { value: 'https://already.example' },
    },
  };
  fillEmptyBookmarkFields(form, { title: 'Docs', url: 'https://docs.example' });
  assert.equal(form.elements.title.value, 'Docs');
  assert.equal(form.elements.url.value, 'https://already.example');
});

test('resolveEscapeAction closes the most specific overlay first', () => {
  assert.equal(
    resolveEscapeAction({ addFormOpen: true, onCollectionView: true }),
    ESCAPE_ACTIONS.CLOSE_COMPOSER,
  );
  assert.equal(
    resolveEscapeAction({ collectionAddFormOpen: true, onCollectionView: true }),
    ESCAPE_ACTIONS.CLOSE_COLLECTION_COMPOSER,
  );
  assert.equal(
    resolveEscapeAction({ onCollectionView: true }),
    ESCAPE_ACTIONS.BACK_COLLECTION,
  );
  assert.equal(
    resolveEscapeAction({ onSettingsView: true }),
    ESCAPE_ACTIONS.BACK_SETTINGS,
  );
  assert.equal(resolveEscapeAction({}), null);
  assert.equal(
    resolveEscapeAction({ targetIsSelect: true, addFormOpen: true }),
    ESCAPE_ACTIONS.SUPPRESS,
  );
});

test('shouldHandleEscapeKey ignores IME, modifiers, and other keys', () => {
  assert.equal(shouldHandleEscapeKey({ key: 'Escape' }), true);
  assert.equal(shouldHandleEscapeKey({ key: 'Escape', defaultPrevented: true }), false);
  assert.equal(shouldHandleEscapeKey({ key: 'Escape', isComposing: true }), false);
  assert.equal(shouldHandleEscapeKey({ key: 'Escape', ctrlKey: true }), false);
  assert.equal(shouldHandleEscapeKey({ key: 'Enter' }), false);
});
