# Curate Extension

Manifest V3 browser extension for [Curate](https://github.com/DevOlabode/curate) - save and organize development bookmarks via the Curate API.

Targets **Google Chrome** and **Microsoft Edge** (Chromium).

## Directory structure

```text
extension/
├── assets/
│   ├── icons/          # Generated PNG icons (16/32/48/128) - checked in, rebuilt by build:extension
│   └── logo.svg        # Source logo
├── background/
│   └── service-worker.js   # MV3 service worker - install handling, auth message passing
├── options/
│   ├── options.html    # Developer-only settings page (API host, environment)
│   ├── options.js
│   └── options.css
├── popup/
│   ├── popup.html      # Primary user-facing UI - sign in, library, collections
│   ├── popup.js
│   └── popup.css
└── manifest.json        # MV3 manifest - permissions, icons, popup/background entry points
```

Shared code used by both `popup/` and `options/` (API client, auth, storage,
Chrome/Edge shim) lives outside this folder in [`src/shared/`](../src/shared/)
and is copied in at build time.

## Build

```bash
npm install
npm run build:extension
```

Output: `dist/extension/`

## Load unpacked (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `dist/extension/`
5. Click the Curate toolbar icon to open the popup

## Load unpacked (Edge)

1. Open `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `dist/extension/`

## Development

1. Copy `.env.example` → `.env` and set `JWT_SECRET`.
2. Start the web/API server: `npm run dev`
3. Open extension options from `chrome://extensions` (Details, then Extension options) and set environment to **Development** (`http://localhost:3000`), or **Self-hosted** with your own `https://` API URL.
4. Rebuild after source changes: `npm run build:extension`, then reload the extension.

API connection (environment and base URL) is for developers and self-hosters. Open it from `chrome://extensions` (Details, then Extension options). It is not shown in the popup.

### Self-hosted API

You do not need to edit `manifest.json` or rebuild to point the extension at your own Curate server.

1. Load the unpacked extension (store build or `dist/extension/`).
2. Open **Details → Extension options**.
3. Choose **Self-hosted**.
4. Enter a full URL with a scheme, for example `https://curate.example.com`.
5. Save. Chrome or Edge will ask for permission to reach that host only.

Rules the options page enforces:

- Scheme is required (`https://`, or `http://` only for localhost / `127.0.0.1` / `[::1]`).
- No `*` wildcards, credentials, query strings, or fragments.
- A path prefix is kept (`https://example.com/curate` calls `/curate/api/v1/...`).
- Production stays locked to the hosted API so everyday installs do not silently switch hosts.

Default `host_permissions` remain the hosted URL and `http://localhost:3000`. Extra hosts use `optional_host_permissions` plus `chrome.permissions.request()` at save time. The self-hosted server must allow `chrome-extension://` origins (the bundled CORS config already does).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Web app + API (nodemon) |
| `npm run build:extension` | Production extension bundle |
| `npm start` | Production web server |

## Architecture

See [docs/architecture.md](../docs/architecture.md) and [docs/development.md](../docs/development.md).

## Permissions

- `storage` - auth token and preferences
- Host permissions - hosted Curate API and `http://localhost:3000`
- Optional host permissions - a self-hosted origin the user grants at runtime

No content scripts. No `<all_urls>` or other broad default host access.
