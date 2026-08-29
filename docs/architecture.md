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
└── dist/extension/         # Build output (gitignored)
```

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

## Historical notes

Design work from the web-app-to-extension conversion is in [phase1-analysis.md](phase1-analysis.md), [phase2-architecture.md](phase2-architecture.md), [security-audit.md](security-audit.md), and [store-readiness.md](store-readiness.md). Prefer this file for the current shape of the repo.
