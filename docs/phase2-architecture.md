# Phase 2 — Extension Architecture

```text
curate/
├── extension/                 # MV3 extension source
│   ├── manifest.json
│   ├── background/
│   │   └── service-worker.js
│   ├── popup/                 # Primary UI (auth + bookmarks)
│   ├── options/               # Settings + collections
│   └── assets/icons/
├── src/shared/                # Reusable extension modules
│   ├── api.js
│   ├── auth.js
│   ├── browser.js             # Chrome/Edge compat
│   ├── config.js
│   └── storage.js
├── routes/api/                # JSON API for extension (additive)
├── controllers/api/
├── scripts/
│   ├── build-extension.js
│   └── generate-icons.js
└── dist/extension/            # Production build output (gitignored)
```

## Context mapping

| Web app | Extension |
|---------|-----------|
| Home / marketing | Not in extension |
| Login / signup | Popup |
| Bookmark list / CRUD | Popup |
| Collections | Options page |
| Profile / password | Web app (unchanged) |
| Session cookie auth | JWT Bearer auth |

## No content scripts

Page injection is not required for core bookmark CRUD. The extension talks to the API directly.
