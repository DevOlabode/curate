# Phase 1: Staging and the release pipeline

**Weeks:** 2–3 (Oct 19–Nov 1, 2026) · **Estimate:** 15 hours · **Ships:** the staging environment

## Objective

A staging environment that cannot touch production data or email real users, and a release process that can be repeated for every release. This phase comes before the pipeline and search work on purpose: both need a safe place to run migrations and backfills first.

Staging is not "another copy of production." Each safeguard below exists to stop a specific failure.

## What gets built

### Separate database

- A separate Atlas **project** with its own M0 cluster, database user and IP access list. Database name: `curate_staging`.
- Production moves to database name `curate_prod` (it currently uses Mongo's default `test` database). This move is the first migration run with the new tool.
- **Why a separate project, not just a separate database:** production credentials never exist anywhere staging can read them. A staging leak can't reach production.

### Separate API and web deployment

- Vercel keeps deploying `main` to production.
- A long-lived `staging` branch gets its own deployment with a stable branch URL and **environment variables scoped to the `staging` branch only**.
- Disable preview deploys for every other branch (`git.deploymentEnabled` in `vercel.json`) so random PR previews never receive staging secrets.
- `X-Robots-Tag: noindex` on staging.
- No Vercel deployment protection: it would block the extension's API calls.

### Boot guard (the most important safeguard)

- `APP_ENV` is required: `production`, `staging`, `development` or `test`.
- The app refuses to start unless the database name in `MONGO_URI` matches `APP_ENV` (`curate_prod` only when `APP_ENV=production`, `curate_staging` only when `APP_ENV=staging`).
- **Failure it prevents:** an environment variable copied to the wrong place makes the app stop at boot instead of writing to the wrong database.

### Email guard

- All mail goes through one `send()` function.
- Outside production, it delivers only to addresses in `STAGING_EMAIL_ALLOWLIST` (your own domain) and logs everything else.
- Staging never receives the Brevo marketing/API key, so it physically can't send a campaign.
- **Failure it prevents:** a staging test or seeded user triggers a real email to a real person.

### Separate secrets

- GitHub Environments `staging` and `production`, each with its own secrets. `production` requires manual approval.
- Different `JWT_SECRET` and `SESSION_SECRET` per environment.
- **Failure it prevents:** a token minted on staging works against production.

### Separate error tracking and analytics

Wired up in [Phase 2](Phase_2.md): Sentry with `environment=staging` (alert rules filter to production only) and a separate PostHog project for staging, so staging noise never mixes with production numbers.

### Staging extension build

- `npm run build:extension -- --env staging` produces **"Curate (Staging)"** with an orange icon and an "STG" badge.
- Its `host_permissions` and CSP `connect-src` contain only the staging API URL.
- It locks the API URL and skips the `apiHostMigratedToRender` reset in `src/shared/config.js`.
- Loaded unpacked only. Never zipped, never uploaded to a store.
- **CI checks:** fail the build if the production zip contains a staging URL or localhost, or if `manifest.json` adds a permission that isn't on an allowlist. A new permission with an install warning **disables the extension for every existing user** until they accept it.

### Seed data

- Rewrite `seeds/seed.js` so it refuses to run unless `APP_ENV` is `staging` or `development`.
- Seed 3 users and about 200 bookmarks of real developer URLs (MDN, GitHub, Stack Overflow).
- Include deliberately bad cases for the pipeline: a PDF, a 404, a Cloudflare-protected site, a very large page, a redirect chain, a URL pointing at a private IP.
- Never copy production data into staging, anonymized or not.

### Migrations

- `migrate-mongo` with a changelog collection.
- **Expand/contract:** a release only adds fields or indexes, the code tolerates both shapes, and removals happen in a later release.
- Migrations run through a manually triggered GitHub workflow: staging first, then production with environment approval.
- Mongoose `autoIndex` off in production; indexes are created only by migrations.

### Backups

- A nightly GitHub Action runs `mongodump` on production, encrypts it with `age`, and uploads it to Cloudflare R2 (free tier). Keep 14 days.
- **Never use GitHub artifacts for backups:** on a public repo, any logged-in GitHub user can download them.
- Monthly restore test into a local Docker container. Never restore production into staging.

### Smoke script

`scripts/smoke.js` runs against any environment: register a throwaway user, save a bookmark, poll until content is extracted (once [Phase 3](Phase_3.md) exists), search, delete the account. CI runs it after each staging deploy.

### Branch flow

`feature/*` → PR into `staging` → CI → staging deploy → release PR `staging → main` → production. Full details in [release-process.md](../release-process.md).

## Data model changes

- Migration changelog collection (created by `migrate-mongo`).
- First migrations: move production to `curate_prod`; create the Phase 0 indexes through a migration so staging and production match.

## Tests required

- Boot guard: wrong database name for `APP_ENV` → process exits.
- Email guard: a non-allowlisted address is not sent outside production.
- Seed script refuses when `APP_ENV=production`.
- Manifest checks: staging URL or localhost in a production build fails; an unlisted permission fails.

## Security considerations

- Production secrets only in the `production` GitHub Environment and the Vercel production scope.
- Backups are encrypted before they leave the runner.
- Staging is publicly reachable but contains only seeded data and has the same rate limits as production.

## Release checkpoint

No user-facing release. Done when a test PR has gone feature → staging → main end to end.

## Metrics

None new. Staging must not report into the production analytics or error projects.

## Design doc

Write **ADR-003: Environments, releases and migrations** at the end of this phase. See [adr/README.md](../adr/README.md).

## Definition of done

- A PR can go feature → staging → main.
- The staging extension talks only to the staging API.
- Every guard (boot, email, seed, manifest) has a passing test.
- The first encrypted backup is in R2 and has been restored locally once.

## Not in this phase

- Vercel deployment protection
- Copying production data into staging
- Infrastructure-as-code tooling
