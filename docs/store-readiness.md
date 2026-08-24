# Store & Privacy Readiness - Curate Extension (Phase 12)

## Extension metadata

| Field | Value |
|-------|-------|
| Name | Curate |
| Short description | Save, organize, and revisit your development bookmarks. |
| Category | Productivity |
| License | MIT (open source) |

## Data collection disclosure (accurate)

The extension **does** process user data:

| Data | Collected | Transmitted | Purpose |
|------|-----------|-------------|---------|
| Username / password | At login only | To your Curate API over HTTPS | Authentication |
| Auth token (JWT) | Stored locally | Sent as Bearer header to API | Session |
| Bookmark content | User-created | To API | Core functionality |
| Profile (name, email) | From API | Display only | Account context |
| Theme preference | Stored locally | Not transmitted | UX |

The extension **does not**:

- Sell data
- Run analytics SDKs
- Inject content scripts into arbitrary pages
- Read browsing history (no `tabs` / `history` permission)

## Permissions justification (for store review)

Copy into store submission:

> **storage** - Saves your login token and extension preferences on your device.  
> **host_permissions** - Allows the extension to sync bookmarks with the Curate server.

## Privacy policy requirements

Publish a privacy policy URL covering:

1. What data is collected (above table).
2. That data is stored on the Curate backend you operate.
3. How users delete data (web app account / bookmark deletion).
4. Contact email for privacy requests.

**Manual action:** Host `PRIVACY.md` on GitHub Pages or your domain and link it in store listings.

## Icons & screenshots (manual)

- [ ] 128×128 store icon (generated in `extension/assets/icons/`)
- [ ] 440×280 promotional tile (create manually)
- [ ] Screenshots: popup login, bookmark list, options page

## Chrome Web Store checklist

- [ ] Developer account registered
- [ ] Unpacked extension tested (`dist/extension`)
- [ ] Privacy policy URL
- [ ] Permission justifications entered
- [ ] Single-purpose description aligned with bookmark management

## Microsoft Edge Add-ons checklist

- [x] Same `dist/extension` package (Chromium-compatible)
- [x] Edge Partner Center listing ([Curate on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk))
- [x] Privacy policy URL

## Open-source repository

- [x] No secrets committed (`.env` gitignored)
- [x] `LICENSE` present (MIT)
- [x] Build reproducible via `npm run build:extension`

## Known manual steps before submission

1. Replace placeholder production API URL in `manifest.json` if deployment URL changes.
2. Add privacy policy URL to manifest / store listing (`homepage_url` points to GitHub).
3. Complete Phase 13 manual browser testing (see `docs/transitioning.md`).
4. Capture screenshots from Chrome and Edge.
