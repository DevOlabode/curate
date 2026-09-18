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
3. Open extension options from `chrome://extensions` (Details, then Extension options) and set environment to **Development** (`http://localhost:3000`).
4. Rebuild after source changes: `npm run build:extension`, then reload the extension.

API connection (environment and base URL) is developer-only. Open it from `chrome://extensions` (Details, then Extension options). It is not shown in the popup.

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
- Host permissions - Curate API (production + localhost for dev)

No content scripts. No broad site access.
