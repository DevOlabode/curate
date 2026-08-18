# Phase 1 — Application Analysis

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express 5 |
| Views | EJS + ejs-mate (server-rendered) |
| Database | MongoDB via Mongoose |
| Auth | Passport Local + express-session (cookie) |
| Validation | Joi |
| Frontend assets | Vanilla JS, Bootstrap 5 CDN, custom CSS |
| Build | None (direct `node index.js`) |

## Routes (web)

- `/` — home
- `/signup`, `/login`, `/logout` — auth
- `/bookmark/*` — bookmark CRUD
- `/collections/*` — collection CRUD
- `/collections/:id/bookmarks/*` — collection-scoped bookmarks
- `/user/*` — profile

## Auth flow (web)

1. User submits credentials via HTML form POST.
2. Passport validates against MongoDB (`passport-local-mongoose`).
3. Session cookie stored (`express-session`, httpOnly).
4. `isLoggedIn` middleware redirects unauthenticated users to `/login`.

**Extension conflict:** MV3 popup runs on `chrome-extension://` origin. Session cookies from the web app are not reliably available to the popup. **Resolution:** Add `/api/v1` JSON API with Bearer JWT (secret server-side only).

## Storage

| Context | Mechanism |
|---------|-----------|
| Web app | MongoDB |
| Web session | Server session cookie |
| Extension (planned) | `chrome.storage.local` for token + preferences |

## Environment variables (server only — never in extension)

- `MONGO_URI` / `DATABASE_URL`
- `SESSION_SECRET`
- `JWT_SECRET` (new, for extension API)
- `PORT`, `NODE_ENV`
- `ALLOWED_ORIGINS` (optional CORS allowlist for web origins)

## Reuse map

| Web component | Extension destination |
|---------------|----------------------|
| Bookmark CRUD logic | Shared API controllers + popup |
| Collection CRUD | Options page + API |
| Login/signup | Popup auth views |
| CSS design tokens | `popup.css` / `options.css` (subset) |
| Navbar, hero, footer | Not used in popup |
| Content scripts | Not required (no page injection features) |
| Service worker | Auth coordination, install handler |

## MV3 considerations

- No persistent background page — use service worker.
- CSP on extension pages — no inline scripts, no `eval`.
- Host permissions scoped to API origin only.
- All extension JavaScript treat as public.

## Required extension permissions (minimal)

| Permission | Reason |
|------------|--------|
| `storage` | Persist auth token and settings |
| Host permission for API URL | HTTPS calls to Curate backend |

No `tabs`, `cookies`, or broad `<all_urls>` unless a future feature requires them.

## Implementation plan (Phases 2–12)

1. Add `extension/` tree + `src/shared/` modules.
2. Ship MV3 `manifest.json`.
3. Convert UI to popup (bookmarks) + options (settings/collections).
4. JWT auth API on server; extension stores token in `chrome.storage`.
5. CORS for extension origins.
6. Service worker for lifecycle + messaging.
7. `browser.js` compatibility shim (Chrome + Edge).
8. `npm run build:extension` → `dist/extension/`.
9. Security + store-readiness documentation.

The existing web application remains unchanged in behavior; API routes are additive.
