# Phase 5: Extension capture polish

**Weeks:** 10–12 (Dec 14, 2026–Jan 3, 2027; week 11 is a light holiday week) · **Estimate:** 12 hours · **Ships:** Release C v1.3.0

## Objective

Saving is fast from anywhere, with clear success and failure feedback. The extension stays focused on capture and quick retrieval.

**Cut line:** if the plan is behind at the end of week 8, this phase shrinks to the keyboard shortcut and context menu only (about 6 hours).

## What gets built

### Extension

- **Already saved?** When the popup opens, it checks whether the current tab is already saved.
  - Not saved: a primary "Save this page" button, prefilled.
  - Saved: "Saved Oct 3 · in Rust" with an edit option.
- **Keyboard shortcuts** (manifest `commands`; not a permission):
  - `_execute_action`: Alt+Shift+K opens the popup.
  - `save-current-page`: Alt+Shift+S saves without opening the popup. Running a command grants `activeTab` automatically.
- **Context menu** (`contextMenus` permission, no install warning):
  - "Save page to Curate"
  - "Save link to Curate". No title needed; the pipeline fills it in.
- **Feedback:** badge text and color for shortcut and context-menu saves (✓ green, ! red). Do **not** add the `notifications` permission; it triggers an install warning.
- **Quick tags:** recent tags shown as chips from `GET /api/v1/tags`.
- **Pending saves:** failed saves are kept in `chrome.storage` and retried the next time the popup opens.
- **Keyboard navigation** polish in search results.
- **Feedback channels:**
  - "Report a bug" link in the popup footer (GitHub issue template or email).
  - `chrome.runtime.setUninstallURL` pointing at a one-question uninstall survey. This is the best source of churn reasons.
- **Optional (2h):** use `scripting` (no install warning) to read meta and Open Graph tags at save time, so sites that block the server fetcher still get a description.

### Backend / API

- `Bookmark.source`: `popup | shortcut | context_menu`.
- Allow an empty title when `source` isn't `popup`; the API stores a placeholder and sets `titleSource: 'auto'`.
- `GET /api/v1/tags`: the user's distinct tags ordered by frequency.

### Permissions check

`activeTab`, `contextMenus` and `scripting` have no install warning, so this update won't disable the extension for existing users. The manifest permission allowlist in CI ([Phase 1](Phase_1.md)) enforces it.

## Data model changes

- `Bookmark.source` (additive; missing means `popup`).

## Tests required

- Manifest permission allowlist unit test.
- API tests for empty-title saves from each source.
- `GET /tags` returns only the caller's tags.
- Manual staging checklist for each entry point: popup, shortcut, page context menu, link context menu, offline save then retry.

## Security considerations

- `scripting` is used only on the active tab after a user action, and only reads metadata, never page text.
- No new host permissions.

## Release checkpoint: Release C v1.3.0 (week 12)

Follow the [standard checklist](../release-process.md#release-checklist). Submit to both stores by about **Dec 30**; holiday reviews can be slow. The launch in [Phase 6](Phase_6.md) does **not** depend on this release being approved.

**Email 2** goes out in launch week (Tue Jan 5). Draft in [Phase_6.md](Phase_6.md).

## Metrics

- `bookmark_saved` broken down by `source`
- Failed saves and pending-save retries
- Saves per weekly active user

## Definition of done

- Each entry point works on staging and production.
- Release C submitted to both stores.

## Not in this phase

- An omnibox command
- Offline mode beyond retrying pending saves
- A full-page library view
- Firefox
