# Curate

A private bookmark library for developers, as a Chrome and Edge extension.

Save docs, repos, tools, and articles from a popup. File them into collections. Open them later without digging through a bookmarks bar.

The public site is the product landing page, with Chrome Web Store and Microsoft Edge Add-ons install links. Sign in, library, and account management live in the extension. The Express app behind this repo is the API and password-reset pages.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)

## Status

Curate is on the [Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo) and [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk).

## What the extension includes

- **Bookmarks:** title, URL, category, and tags. Open, edit, or delete from the popup.
- **Collections:** named groups of related links. Add bookmarks into a collection from that view.
- **Accounts in the popup:** register, sign in, edit profile, change password, log out, delete account.
- **Private by default:** links stay on your account. No public feed.
- **Light and dark** theme.
- **Library first:** the home screen is your collections and bookmarks. Forms appear when you add or edit.

## Repo layout

| Path | Role |
|------|------|
| `landing/` | Static landing site for Vercel |
| `extension/` | Manifest V3 popup source |
| `src/shared/` | Shared API client used by the extension |
| `index.js` | Express API, password reset, landing at `/`, and privacy at `/privacy` |
| `dist/extension/` | Built unpacked extension (`npm run build:extension`) |

## Local development

### Prerequisites

- Node.js 18 or newer
- MongoDB
- npm

### API server

```bash
git clone https://github.com/DevOlabode/curate.git
cd curate
npm install
cp .env.example .env
```

Set at least `MONGO_URI`, `SESSION_SECRET`, and `JWT_SECRET` in `.env`. See [`.env.example`](.env.example).

```bash
npm run dev
```

API: `http://localhost:3000/api/v1`  
Landing (Express): `http://localhost:3000`  
Privacy: `http://localhost:3000/privacy`

### Browser extension

```bash
npm run build:extension
```

Then in Chrome (`chrome://extensions`) or Edge (`edge://extensions`):

1. Turn on Developer mode.
2. Load unpacked.
3. Select `dist/extension/`.

For local API calls, open the extension options from `chrome://extensions` (Details, then Extension options) and set environment to Development (`http://localhost:3000`). That page is for developers. It is not in the popup.

After source changes, run `npm run build:extension` again and reload the extension.

More detail: [extension/README.md](extension/README.md).

## Landing page (Vercel)

The deployable static site is in [`landing/`](landing/). No Node, Mongo, or env vars. Privacy is at `/privacy`. Chrome and Edge install links are on the homepage.

In Vercel: set **Root Directory** to `landing`, framework **Other**, leave build and output empty. Do not run `node index.js` on Vercel.

See [landing/README.md](landing/README.md).

## API (`/api/v1`)

The popup talks to this JSON API with a Bearer JWT.

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/health` | Liveness |
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Returns `{ token, user }` |
| `GET` | `/auth/me` | Current user |
| `PUT` | `/auth/me` | Update profile |
| `PUT` | `/auth/password` | Change password |
| `DELETE` | `/auth/me` | Delete account and library |
| `POST` | `/auth/logout` | Client still clears the token |
| `GET/POST` | `/bookmarks` | List / create |
| `PUT/DELETE` | `/bookmarks/:id` | Update / delete |
| `GET/POST` | `/collections` | List / create |
| `GET/PUT/DELETE` | `/collections/:id` | One collection |

Password reset uses web pages at `/forgot-password` so the extension can open them in a tab.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | API and Express landing (nodemon) |
| `npm start` | Production server |
| `npm run build:extension` | Bundle the unpacked extension to `dist/extension/` |

## License

MIT. See [LICENSE](LICENSE).
