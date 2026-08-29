# Development

How to run Curate locally. For the contribution workflow (fork, branch, PR), see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB (local or a connection string)

## 1. Clone and install

```bash
git clone https://github.com/DevOlabode/curate.git
cd curate
npm install
cp .env.example .env
```

Set at least:

- `MONGO_URI`
- `SESSION_SECRET`
- `JWT_SECRET`

See [`.env.example`](../.env.example) for the rest. Never commit `.env`. Never put those secrets in `extension/` or `src/shared/`.

## 2. Start the API

```bash
npm run dev
```

| URL | What |
|-----|------|
| `http://localhost:3000/api/v1` | JSON API |
| `http://localhost:3000/api/v1/health` | Liveness |
| `http://localhost:3000` | Express-rendered landing |
| `http://localhost:3000/privacy` | Privacy |
| `http://localhost:3000/forgot-password` | Password reset pages |

## 3. Build and load the extension

```bash
npm run build:extension
```

Output: `dist/extension/`.

In Chrome (`chrome://extensions`) or Edge (`edge://extensions`):

1. Turn on Developer mode.
2. Load unpacked.
3. Select `dist/extension/`.

Open **Details → Extension options** and set environment to **Development** (`http://localhost:3000`). That page is for developers. It is not in the popup.

After you change popup, options, or `src/shared/` code:

```bash
npm run build:extension
```

Then reload the extension on `chrome://extensions` / `edge://extensions`.

More: [extension/README.md](../extension/README.md).

## 4. Landing site

The public site is static files in [`landing/`](../landing/). No Node or Mongo.

```bash
cd landing
npx serve .
```

Vercel: set Root Directory to `landing`, framework Other, empty build and output. Do not run `node index.js` on Vercel. See [landing/README.md](../landing/README.md).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | API + Express pages (nodemon) |
| `npm start` | Production server |
| `npm test` | Syntax check of `index.js` |
| `npm run build:extension` | Bundle unpacked extension to `dist/extension/` |

## API surface

The popup uses Bearer JWT against `/api/v1`.

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

Password reset is HTML at `/forgot-password` so the extension can open it in a tab.

## Tests

CI runs `npm test` and `npm run build:extension`. There is no end-to-end suite yet. Manually check the flow you changed in the loaded unpacked extension.

## Project map

See [architecture.md](architecture.md).
