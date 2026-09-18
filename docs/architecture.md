# Architecture

Curate is three pieces that share one repository:

1. **Browser extension** — Manifest V3 popup where people sign in and manage their library
2. **API** — Express JSON routes at `/api/v1`, plus password-reset HTML pages
3. **Landing site** — static marketing and privacy pages in `landing/`

A stranger's bookmarks never appear on the website. The toolbar popup is the product.

## Why the API is JWT, not cookies

The popup runs on a `chrome-extension://` origin. It cannot reliably share the web app's session cookie. The extension therefore authenticates with a Bearer JWT stored in `chrome.storage.local`. The server still uses Passport Local + sessions for `/forgot-password` pages.

Details: [authentication.md](authentication.md).

## Layout

```text
curate/
├── extension/              # MV3 source
│   ├── manifest.json
│   ├── background/         # Install + auth message passing
│   ├── popup/              # Sign in, library, collections
│   └── options/            # Developer API host (not shown in the popup)
├── src/shared/             # API client, auth, storage, Chrome/Edge shim
├── routes/api/             # /api/v1
├── controllers/api/
├── models/                 # User, bookmark, collection (MongoDB)
├── landing/                # Static site (Vercel)
├── views/                  # Express HTML (landing fallback, password reset)
├── tests/                  # node --test suite (api/, unit/, helpers/)
├── app.js                  # Express app: middleware, routes, error handling
├── index.js                # Env, DB connection, HTTP server startup
└── dist/extension/         # Build output (gitignored)
```

`app.js` exports the configured Express app with no server listening or DB
connection, so tests can import it directly. `index.js` loads environment
variables, connects to MongoDB, then starts the HTTP server with that app.

`npm run build:extension` copies `extension/` and `src/shared/` into `dist/extension/` and checks `manifest.json`.

## Request path

```text
Popup  --Bearer JWT-->  /api/v1  -->  MongoDB
Options page           (same API, developer host override)
```

There are **no content scripts**. The extension does not inject into web pages and does not read browsing history. Default permissions are `storage` plus host access to the hosted Curate API and `http://localhost:3000`. A self-hosted API URL is opt-in: the options page validates the URL, then `chrome.permissions.request()` asks for that origin only via `optional_host_permissions`. Default `host_permissions` stay narrow on purpose.

### Self-hosted API URLs

| Environment | URL | Host access |
|-------------|-----|-------------|
| Production | Hosted Render URL (fixed) | Default `host_permissions` |
| Development | Loopback only (`localhost`, `127.0.0.1`, `[::1]`) | Default for port 3000; optional grant for other loopback ports |
| Self-hosted | Caller-supplied `https://` URL (no wildcards, credentials, query, or fragment) | Optional grant for that origin |

`http://` is rejected except on loopback so `connect-src` can stay `https:` plus localhost variants instead of a blanket `*`. Path prefixes are kept (`https://example.com/curate` → `/curate/api/v1/...`). Validation lives in `src/shared/apiUrl.js`.

## Auth in brief

| Client | Mechanism |
|--------|-----------|
| Extension | `POST /api/v1/auth/login` → JWT in `chrome.storage.local` |
| Password-reset pages | Session cookie (Passport) |
| Landing site | None (theme preference only) |

On `401`, the popup clears the token and shows sign-in.

## Stack

| Layer | Choice |
|-------|--------|
| Extension | Vanilla JS, HTML, CSS, Manifest V3 |
| API | Node.js 18+, Express 5, Joi, jsonwebtoken |
| Data | MongoDB, Mongoose |
| Web auth (reset pages) | Passport Local, express-session |
| Landing | Static HTML/CSS |

Chrome and Edge both expose the `chrome.*` MV3 APIs. `src/shared/browser.js` is the compatibility shim.

## Historical notes

Design work from the web-app-to-extension conversion is in [phase1-analysis.md](phase1-analysis.md), [phase2-architecture.md](phase2-architecture.md), [security-audit.md](security-audit.md), and [store-readiness.md](store-readiness.md). Prefer this file for the current shape of the repo.
