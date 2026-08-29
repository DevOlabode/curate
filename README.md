<p align="center">
  <img src="landing/images/download.svg" alt="Curate" width="72" height="72">
</p>

# Curate

A private bookmark library for developers, as a Chrome and Edge extension.

Save docs, repos, tools, and articles from a popup. File them into collections. Open them later without digging through a bookmarks bar. There is no public feed.

[Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo) · [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk) · [Contributing](CONTRIBUTING.md) · [Roadmap](docs/roadmap.md)

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)

## Screenshots

The live popup is on the store listings:

- [Curate on the Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo)
- [Curate on Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk)

The public site lives in [`landing/`](landing/). Sign in, the library, and account management are in the extension, not on the website.

## Features

- **Bookmarks** — title, URL, category, and tags. Open, edit, or delete from the popup.
- **Collections** — named groups of related links. Add into a collection from that view.
- **Accounts in the popup** — register, sign in, edit profile, change password, log out, delete account.
- **Private by default** — links stay on your account.
- **Light and dark** theme.
- **Library first** — the home screen is your collections and bookmarks. Forms appear when you add or edit.

## Tech stack

| Piece | Stack |
|-------|--------|
| Extension | Manifest V3, vanilla JS, HTML, CSS |
| API | Node.js 18+, Express 5, Joi, JWT |
| Database | MongoDB (Mongoose) |
| Landing | Static HTML/CSS (`landing/`) |

Chrome and Edge share the same unpacked build.

## Installation

**Use the product**

1. Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo) or [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk).
2. Open the toolbar popup and create an account or sign in.

**Run from source** (contributors and self-hosting) — [Development setup](#development-setup) below, or [docs/development.md](docs/development.md).

## Development setup

```bash
git clone https://github.com/DevOlabode/curate.git
cd curate
npm install
cp .env.example .env
```

Set `MONGO_URI`, `SESSION_SECRET`, and `JWT_SECRET`. Then:

```bash
npm run dev
npm run build:extension
```

Load `dist/extension/` as unpacked in Chrome or Edge. In **Details → Extension options**, set environment to Development (`http://localhost:3000`).

Full walkthrough: [docs/development.md](docs/development.md). How to send a PR: [CONTRIBUTING.md](CONTRIBUTING.md).

## Architecture overview

```text
Popup  --Bearer JWT-->  /api/v1  -->  MongoDB
```

The popup cannot use the website's session cookie (`chrome-extension://` origin), so the extension talks to `/api/v1` with a JWT in `chrome.storage.local`. There are no content scripts and no history permission.

| Path | Role |
|------|------|
| `extension/` | MV3 popup, options, service worker |
| `src/shared/` | API client used by the extension |
| `routes/api/` | JSON API |
| `landing/` | Static product site |
| `index.js` | Express API, password reset, optional Express landing |

See [docs/architecture.md](docs/architecture.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before you open a PR.

1. Fork, clone, branch (`feature/…`, `fix/…`, `docs/…`).
2. Claim or open an [issue](https://github.com/DevOlabode/curate/issues/new/choose).
3. Make one focused change, test it, open a PR.

New here? Look for [`good first issue`](https://github.com/DevOlabode/curate/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Usage questions belong in [SUPPORT.md](SUPPORT.md), not in Issues. Security reports go to [SECURITY.md](SECURITY.md).

## Roadmap

Shipped: private library in the popup, Chrome and Edge listings. Next: tests, tighter auth, clearer empty states. Details: [docs/roadmap.md](docs/roadmap.md). How decisions are made: [GOVERNANCE.md](GOVERNANCE.md).

## Contributors

Maintainer: [Samuel Olabode](https://github.com/DevOlabode) ([@DevOlabode](https://github.com/DevOlabode)).

<a href="https://github.com/DevOlabode/curate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DevOlabode/curate" alt="Contributors to Curate" />
</a>

PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
