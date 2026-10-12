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

There are **no content scripts**. The extension does not inject into web pages and does not read browsing history. Permissions are `storage` plus host access to the Curate API (production and localhost).

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

## Known leftovers

`app.js` still mounts the old EJS library routes (`/bookmark`, `/collections`, `/login`, `/signup`, `/user/*`) from before the extension conversion. Nothing links to them and the landing page says there is no web signup, but they are reachable. They are scheduled for removal in [phases/Phase_0.md](phases/Phase_0.md). Only `/`, `/privacy` and the password reset pages will remain.

## Planned changes

The plan for Oct 2026 to Jan 2027 ([phases/](phases/README.md)) changes this architecture in three ways:

- **Environments:** a separate staging deployment, database and extension build ([Phase 1](phases/Phase_1.md)).
- **Content pipeline:** saving a bookmark enqueues a job in a MongoDB `jobs` collection. The job runs right after the response (`waitUntil`) and is retried by a GitHub Actions sweeper. It fetches the page safely and stores readable text and metadata on the bookmark ([Phase 3](phases/Phase_3.md)).
- **Search:** `GET /api/v1/search` queries an Atlas Search index over titles, tags, notes and extracted page text ([Phase 4](phases/Phase_4.md)).

```text
Popup --Bearer JWT--> /api/v1 --> MongoDB (bookmarks, jobs) <-- Atlas Search index
                         |                ^
                         +-- waitUntil ---+-- fetch + extract (SSRF-safe)
                 GitHub Actions sweeper --+   (retries, backfill)
```

Design decisions are recorded in [adr/](adr/README.md).

## Historical notes

Design work from the web-app-to-extension conversion is in [phase1-analysis.md](phase1-analysis.md), [phase2-architecture.md](phase2-architecture.md), [security-audit.md](security-audit.md), and [store-readiness.md](store-readiness.md). Prefer this file for the current shape of the repo.
