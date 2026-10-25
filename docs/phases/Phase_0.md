# Phase 0: Fix first

**Weeks:** 1 (Oct 12–18, 2026) · **Estimate:** 8 hours · **Ships with:** Release A (end of week 4), because staging doesn't exist yet.

## Objective

Remove the security risks and bugs found in the current-state review ([README.md](README.md#security-issues-and-bugs-to-fix-first)), and make saving the current page possible.

## Before starting

Record the baseline with a read-only aggregate on production:

- total users
- users with at least one bookmark
- users who saved in at least two distinct weeks since the August 2026 launch
- bookmarks per user

These are the honest "before" numbers for [metrics.md](../metrics.md). They are kept in the private plan notes, not in this repository.

**Interview the active user this week.** Ask for 15 minutes: why they saved in a burst, why they stopped, and whether they ever went back to find a saved link. Write the answers in the private plan notes before starting [Phase 3](Phase_3.md).

## What gets built

### Backend / API

- **Rate limiting backed by MongoDB** (`utils/rateLimit.js`: a small fixed-window counter in a Mongo collection with a TTL index; in-memory counters don't work across serverless instances, and this needs no new dependency):
  - `POST /auth/login`: 10 per 15 minutes per IP and per username
  - `POST /auth/register`: 5 per hour per IP
  - `POST /auth/forgot-password` and the web form: 3 per hour per email, 10 per hour per IP
- **Token revocation:** add `User.tokenVersion`, include it as a `tv` claim in the JWT, and bump it on password change and password reset. `apiAuth` rejects tokens whose `tv` doesn't match.
- **Refuse to boot in production** if `SESSION_SECRET` or `JWT_SECRET` is missing. Remove the `'defaultsecret'` fallback.
- Session cookie: `secure` and `sameSite: 'lax'` in production, with `app.set('trust proxy', 1)`.
- **Indexes:** `bookmarks {user: 1, createdAt: -1}`, `collections {owner: 1}`.
- `/api/v1/health` pings MongoDB with a 2-second timeout and returns 503 when it fails.
- ~~`config/dbConfig.js`: throw instead of `process.exit(1)`~~ **Kept as is:** exiting forces Vercel to start a fresh instance that retries the connection, which is better than a warm instance stuck without a database.
- `User.isInternal` (default false). Set it on the maintainer account and every test account in production, so none of them count in metrics. Delete test accounts that are no longer needed.

### Web app

- **Delete the unlinked EJS library:** `/bookmark`, `/collections`, `/collections/:id/bookmarks`, `/login`, `/signup`, `/logout`, `/user/*`, with their controllers and views. This removes the CSRF exposure, the duplicated controllers and the bugs in `controllers/user.js`.
- **Keep** `/`, `/privacy`, `/forgot-password` and `/reset-password/:token` (reset emails link to these).
- Keep one privacy policy (`landing/privacy.html`). `PRIVACY.md` and `/privacy` link or redirect to it.

### Extension

- Add the `activeTab` permission (no install warning).
- When the add-bookmark form opens (from the library or inside a collection), prefill the title and URL from the current tab. The one-click save button comes in [Phase 5](Phase_5.md).

### Infrastructure / DevOps

- CI: Node 24 to match `engines`.
- Local development uses Docker `mongodb/mongodb-atlas-local` (or a local MongoDB), never a hosted Atlas cluster. Update `.env.example` and [development.md](../development.md).
- Bring `package.json` and `manifest.json` to the same version and add the missing 1.0.2 entry to the CHANGELOG.

## Data model changes

- `User.tokenVersion: Number`, default 0. No migration needed (missing means 0).
- `User.isInternal: Boolean`, default false. Set by hand on the maintainer and test accounts.
- New indexes on `bookmarks` and `collections`. These are created by hand now and moved into migrations once [Phase 1](Phase_1.md) adds the migration tool.

## Tests required

- Rate limits return 429 after the threshold.
- A token issued before a password change or reset is rejected afterwards.
- The deleted web routes return 404; the password reset pages still work.
- The app refuses to boot in production without secrets.
- `/health` returns 503 when the database is unreachable.

## Security considerations

This phase is the security fix. Also correct [security-audit.md](../security-audit.md), which wrongly says a password change revokes tokens.

## Release checkpoint

No separate release. Everything ships in Release A at the end of [Phase 2](Phase_2.md), through the staging flow built in [Phase 1](Phase_1.md).

## Metrics

Baseline recorded (see above). Nothing new is measured yet.

## Definition of done

- Issues 1–5 and 9–11 in the [current-state table](README.md#security-issues-and-bugs-to-fix-first) are fixed or have a merged PR.
- Baseline numbers recorded and the active-user interview done.
- The maintainer and test accounts are flagged internal or deleted.
- The popup prefills the current tab.

## Not in this phase

- Refresh tokens
- Email verification
- Cleaning up the duplicated collection membership data model
