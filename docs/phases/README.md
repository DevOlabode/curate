# Curate plan: Oct 12, 2026 to Jan 10, 2027

This is the plan for the next three months of work on Curate. Each phase has its own file in this folder. The release process, metrics and design docs live in separate files linked below.

## Goal

The promise: **"Save anything useful while you develop, and find it when you need it."**

The plan is **not** to turn Curate into a big SaaS. It aims to make Curate:

1. A product developers use repeatedly, with measured usage numbers.
2. A technically strong project: background job pipeline, full-text search, and running a public product professionally.
3. A professionally run product: staging, CI, safe production releases, release notes and user communication.

**Out of scope:** team workspaces, organizations, roles; billing and paid plans; file storage and uploads; AI features; rewriting the stack.

## Budget

13 weeks at about 11 hours a week gives about 143 hours. The planned work adds up to about 127 hours, which leaves roughly 16 hours (11%) of buffer, plus one light week over the holidays.

**Cut line:** if the work is behind at the end of week 8, shrink [Phase 5](Phase_5.md) to the keyboard shortcut and context menu only (about 6 hours).

## Phases

| Phase | File | Weeks | Hours | Ships |
|---|---|---|---|---|
| 0. Fix first | [Phase_0.md](Phase_0.md) | 1 | 8 | With Release A |
| 1. Staging and release pipeline | [Phase_1.md](Phase_1.md) | 2–3 | 15 | Staging environment |
| 2. Measurement and email | [Phase_2.md](Phase_2.md) | 3–4 | 11 (+5 release) | **Release A v1.1.0** |
| 3. Content pipeline | [Phase_3.md](Phase_3.md) | 5–7 | 24 | Dark launch, API only |
| 4. Full-text search | [Phase_4.md](Phase_4.md) | 7–9 | 20 (+8 release) | **Release B v1.2.0**, Email 1 |
| 5. Capture polish | [Phase_5.md](Phase_5.md) | 10–12 | 12 | **Release C v1.3.0** |
| 6. Launch push | [Phase_6.md](Phase_6.md) | 12–13 | 12 | Launch, Email 2 |
| Design docs | [../adr/README.md](../adr/README.md) | spread | 6 | ADR-001 to ADR-004 |

Related documents:

- [Release process](../release-process.md): the release checklist used by every phase, branch flow, hotfixes and rollback.
- [Metrics](../metrics.md): what we measure and the targets.
- [Design docs (ADRs)](../adr/README.md): what each ADR must cover.

## Current state (as of Oct 12, 2026)

### What exists

- **API:** Express 5 on Vercel serverless (`vercel.json` sends every request to `api/index.js`), MongoDB Atlas through Mongoose, Bearer JWT for the extension. Routes: `/api/v1/auth`, `/bookmarks`, `/collections`, `/health`.
- **Extension:** Manifest V3, vanilla JS, no bundler. `scripts/build-extension.js` copies `extension/` and `src/shared/` into `dist/`. Permissions: `storage` plus host permissions for the production API and localhost.
- **Landing site:** static HTML in `landing/`, deployed separately to Vercel.
- **Email:** Brevo SMTP through nodemailer, used only for password resets.
- **Tests:** 47 `node:test` tests (API tests against an in-memory MongoDB, plus unit tests). CI runs tests and the extension build. No extension tests.
- **Project signals:** listed on Chrome Web Store and Edge Add-ons; merged PRs from an outside contributor (#18, #20, #23).

### Gaps that shape the plan

1. **The extension cannot save the current page.** The popup has no `chrome.tabs` or `activeTab` code, so users type the title and URL by hand. Fixed in [Phase 0](Phase_0.md).
2. **There is no search of any kind**, not even a title filter in the popup (issue #15).
3. **The EJS web app is unlinked but still live.** `/bookmark`, `/collections`, `/login`, `/signup` and `/user/*` are mounted in `app.js` and reachable in production, even though the landing page says there is no web signup. The code duplicates the API controllers, has no tests, and uses session cookies without CSRF protection. **Decision: delete it** ([Phase 0](Phase_0.md)). If Curate later needs a full library view, build it as an extension page (`chrome-extension://…/library.html`) on the same JWT API.
4. **The funnel order is install first.** Signup happens inside the extension: store listing → install → signup → first save → first search → return. Installs only appear as aggregates in the store dashboards.
5. **There is nowhere to run a long-lived worker.** Everything runs on Vercel serverless, and Vercel Hobby cron runs at most once a day. The pipeline in [Phase 3](Phase_3.md) is designed around this.

### Security issues and bugs to fix first

| # | Issue | Where | Fixed in |
|---|---|---|---|
| 1 | No rate limiting on login, register or forgot-password. Allows brute force and burning the Brevo quota (300 emails/day), which blocks real resets. | `routes/api/auth.js`, `routes/user.js` | Phase 0 |
| 2 | Changing or resetting a password does not invalidate existing 7-day JWTs. | `utils/jwt.js` | Phase 0 |
| 3 | Session secret falls back to `'defaultsecret'`; the cookie has no `secure` or `sameSite`; EJS forms have no CSRF protection. | `config/sessionConfig.js` | Phase 0 |
| 4 | EJS controller bugs: `signUp` and `logout` call an undefined `next`; `editUser` doesn't `return` after redirecting. | `controllers/user.js` | Phase 0 (deleted) |
| 5 | No index on `bookmarks.user`, so every list is a full collection scan. | `models/bookmark.js` | Phase 0 |
| 6 | `GET /bookmarks` returns the whole library with no projection; it will balloon once page text is stored. | `controllers/api/bookmarks.js` | Phase 3 |
| 7 | `isValidHttpUrl` accepts `localhost`: harmless for storage, an SSRF hole once the server fetches saved URLs. | `utils/normalizeUrl.js` | Phase 3 (fetcher guard) |
| 8 | Atlas M0 has no backups. | infrastructure | Phase 1 |
| 9 | Local development can point at the hosted Atlas cluster with no database name, which means Mongo's default `test` database. | `.env` | Phase 0 / 1 |
| 10 | CI uses Node 20 while `engines` says 24.x; `/health` doesn't check the database; `dbConfig` calls `process.exit(1)` in a serverless function. | CI, config | Phase 0 |
| 11 | Three copies of the privacy policy (`PRIVACY.md`, `landing/privacy.html`, `views/privacy.ejs`); `package.json` is 1.0.0 while the manifest is 1.0.2; CHANGELOG has no 1.0.2 entry. | docs | Phase 0 |
| 12 | Collection membership is stored twice (`Collection.bookmarks[]` and `Bookmark.collection`); `collections.createBookmark` saves the collection before the bookmark. **Known, deliberately left alone in this plan.** | `controllers/api/collections.js` | — |

**Before changing anything:** run a read-only aggregate on production and record the baseline: total users, users with at least one bookmark, users who saved in at least two distinct weeks since the August launch, and bookmarks per user.

## Baseline and what it changes

The baseline was recorded on Oct 15, 2026 (numbers are kept outside this repository). The existing user base is very small: a handful of real accounts, one of which saved bookmarks over three days and then stopped. Effectively, every user measured after launch comes from this plan. That changes the plan in six ways:

1. **Talk to the active user in week 1.** A 15-minute conversation: why they saved in a burst, why they stopped, and whether they ever went back to find a saved link. It tests whether search is the real need before about 44 hours go into Phases 3 and 4. Notes go in the private plan notes.
2. **Recruit a beta cohort of 5–10 developers in week 4**, alongside Release A. Phases 3 and 4 need real saves to tune extraction and ranking, and real people in the funnel. Beta users count in the metrics but are tracked as a separate cohort from launch signups (`User.cohort`, see [Phase 2](Phase_2.md)).
3. **Report counts, not percentages,** until a cohort reaches about 30 users. See [metrics.md](../metrics.md#small-numbers).
4. **Smaller migrations and backfill.** The duplicate merge and the content backfill cover a few dozen bookmarks. The scripts must still be correct and idempotent, but they don't need throttling or batch scheduling ([Phase 3](Phase_3.md), [Phase 4](Phase_4.md)).
5. **Email 1 becomes a personal email** to the existing active user. The full email setup (domain records, consent checkbox, Brevo list) stays, because launch signups need it. Together with point 4, this frees about 4–5 hours, which go to the beta cohort.
6. **Flag the maintainer and test accounts as internal** so they never count in any metric. This moves `User.isInternal` into [Phase 0](Phase_0.md).

## Timeline

| Wk | Dates | Work | Ships / sends |
|---|---|---|---|
| 1 | Oct 12–18 | Phase 0 fixes, baseline numbers, save current tab; **interview the active user** | — |
| 2 | Oct 19–25 | Phase 1: staging Atlas project, Vercel staging branch, boot and email guards, staging extension build | **Staging live** |
| 3 | Oct 26–Nov 1 | Phase 1: migrations, seed data, R2 backups, smoke script; ADR-003. Phase 2: Sentry, health check, uptime | — |
| 4 | Nov 2–8 | Phase 2: PostHog, open tracking, domain DNS, Brevo streams, export, privacy policy v2; **recruit the beta cohort** | **Release A v1.1.0**: staging Wed → prod Fri → **both stores Fri**; changelog only |
| 5 | Nov 9–15 | Phase 3: model and `urlKey` migration, duplicate report, jobs, SSRF-safe fetcher, extraction | staging only |
| 6 | Nov 16–22 | Phase 3: retries, `waitUntil` path, sweeper workflows, staging soak with bad URLs; ADR-001 | staging only |
| 7 | Nov 23–29 | **Pipeline dark launch to production (Mon)**, throttled production backfill. Phase 4: search index, `/search`, ranking | API-only production release, no store submission |
| 8 | Nov 30–Dec 6 | Phase 4: popup search, fallback, golden set, latency measurement; ADR-002 | Release B to staging Fri |
| 9 | Dec 7–13 | Staging soak Mon–Tue; production Wed; privacy and store disclosures; store submissions Wed | **Release B v1.2.0**; **Email 1** (personal email to the existing active user) once both stores are live (~Dec 11–14) |
| 10 | Dec 14–20 | Monitoring and regressions (exam buffer); Phase 5: context menu, shortcuts | — |
| 11 | Dec 21–27 | Light week (~4h): quick tags, badge feedback, pending-save retry | — |
| 12 | Dec 28–Jan 3 | Phase 5 finish; launch assets (screenshots, listing, README, GIF, article draft) | **Release C v1.3.0** staging → prod → stores ~Dec 30 |
| 13 | Jan 4–10 | **Launch week** (see [Phase 6](Phase_6.md)); listing update | **Email 2** Tue Jan 5 |
| +6 wk | Feb 13, 2027 | **Post-launch review** of the [metrics](../metrics.md) | — |

## Professional basics: in or out

| Item | Decision |
|---|---|
| Privacy policy | **In.** Consolidated in Phase 0, v2 in Phase 2, updated for page content at Release B. Required by the stores. |
| Account deletion | Exists. **In:** extend the cascade to jobs, stored content, PostHog and Brevo (Phase 2). |
| Data export | **In** (Phase 2, ~2h). |
| Rate limiting | **In.** Auth in Phase 0; save and search in Phase 3. |
| Feedback / bug-report link | **In** (Phase 5, including an uninstall survey). |
| Backups | **In** (Phase 1). Not optional on M0. |
| Email verification, refresh tokens | **Later.** Token-version revocation (Phase 0) is enough for now. |
| Import from browser bookmarks | **Later, but the strongest next candidate.** It is the best activation lever for a search product (an empty library has nothing to search). Do it as an HTML file upload so no `bookmarks` permission (which shows an install warning) is needed. |

