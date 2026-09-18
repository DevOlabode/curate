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
| `npm test` | Automated test suite (`node --test`) |
| `npm run test:watch` | Automated test suite in watch mode |
| `npm run test:coverage` | Same suite plus Node's built-in coverage report |
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

```bash
npm test
```

Runs `node --test` against `app.js` (the Express app, exported separately from
`index.js` so it can be exercised without a real HTTP server or a real
database). It covers:

- `tests/api/auth.test.js` - registration, login, `/auth/me`, account deletion
- `tests/api/bookmarks.test.js` - bookmark CRUD, ownership, validation
- `tests/api/collections.test.js` - collection CRUD, ownership, validation
- `tests/unit/validators.test.js` - `normalizeUrl`, `parseTags`, Joi schemas

Tests run against a throwaway MongoDB started in memory by
`mongodb-memory-server` - no local MongoDB, `MONGO_URI`, or other setup is
needed, and your dev/production data is never touched. CI runs
`npm run test:coverage` and `npm run build:extension` on every push and pull
request. Coverage is informational: CI does not fail on a percentage. The
text report is uploaded as the `coverage-report` workflow artifact
(`coverage/coverage.txt`).

There is still no end-to-end UI suite. Manually check the flow you changed in
the loaded unpacked extension.

### Coverage

```bash
npm run test:coverage
```

This wraps `node --test --experimental-test-coverage` (no extra dependency;
see `scripts/coverage-report.js`). After the suite finishes, Node prints a
per-file table and writes the same output to `coverage/coverage.txt`
(gitignored).

How to read the table:

| Column | Meaning |
|--------|---------|
| `file` | Source file the runner loaded |
| `line %` | Share of executable lines that ran |
| `branch %` | Share of branches (if/else, ternaries, and similar) that ran |
| `funcs %` | Share of functions that were called |
| `uncovered lines` | Line numbers or ranges the suite never hit |

The `all files` row is the headline number. Files the suite does not load
(the extension popup, landing site, most Express HTML routes) do not appear.

**Baseline** (refreshed with this change on Node 22; CI is Node 20, so expect
small drift):

| | line % | branch % | funcs % |
|---|--------|----------|---------|
| **all files** | **67** | **83** | **63** |

- At 100% lines: `routes/api/*`, `middleware/apiAuth.js`, `middleware/validateId.js`, `models/collection.js`, `models/user.js`, `joiSchema.js`.
- Partial, because the suite does not hit every handler: `controllers/api/auth.js` (~44% lines), `controllers/api/bookmarks.js` (~63%), `controllers/api/collections.js` (~68%), `models/bookmark.js` (~85%).
- Still thin: `utils/mailer.js` (~9% lines, 0% functions), `utils/passwordReset.js` (50% lines, 0% functions), `utils/friendlyError.js` (~51% lines, ~42% branches).
- Express HTML controllers (`controllers/user.js`, `controllers/bookmarks.js`, and the rest) are mostly unused by this suite. Extension and landing code are not loaded, so they do not appear.

The table includes test files the runner loaded. That baseline is a snapshot,
not a gate. Raise it by adding tests, not by adding a threshold. Coverage
needs Node 18.15 or newer (`--experimental-test-coverage`).

## Project map

See [architecture.md](architecture.md).
