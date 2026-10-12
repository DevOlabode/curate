# Release process

How every change gets from a branch to production and the browser stores. Staging is set up in [phases/Phase_1.md](phases/Phase_1.md).

## Branches

| Branch | Role | Deploys to |
|---|---|---|
| `main` | Production | Vercel production |
| `staging` | Long-lived integration branch | Vercel staging (branch-scoped env vars) |
| `feature/*`, `fix/*`, `docs/*` | Short-lived work, cut from `staging` | No deploy |
| `hotfix/*` | Urgent production fix, cut from `main` | No deploy |

Contributors open PRs against `staging`.

## Normal release flow

1. **PR `feature/x → staging`.** CI must pass:
   - `npm test` (in-memory MongoDB)
   - search integration tests (Docker `mongodb/mongodb-atlas-local`)
   - production and staging extension builds
   - manifest checks: no staging URL or localhost in the production build, no permission outside the allowlist

   Squash-merge.
2. **Staging deploy.** Vercel deploys automatically and `scripts/smoke.js` runs against staging. If the release has a migration, run the "migrate (staging)" workflow. Load the staging extension (CI artifact, unpacked) and check the flows by hand.
3. **Release PR `staging → main`,** titled `Release vX.Y.Z`, containing the CHANGELOG diff. Merge with a merge commit (not squash) so the two branches keep a shared history.
4. **Production migration.** Run "migrate (production)" with environment approval **before** merging. It must be an expand-only migration that works with the code already in production.
5. **Merge.** Vercel deploys to production. Run the smoke script against production with the internal account.
6. **Tag `vX.Y.Z`.** CI builds the production extension zip and attaches it to the GitHub Release. Upload the same zip to the Chrome Web Store and Edge Add-ons on the same day.
7. **Monitor for 72 hours:** Sentry, uptime, funnel dashboard, pipeline health.
8. **Email users** only if the release meets the email rule below, and only once it's live in both stores.
9. **Contract migrations** (removing old fields or indexes) go in the *next* release, never the same one.

## Release checklist

Every user-facing release goes through this list and budgets time for it.

| Step | Time |
|---|---|
| 1. CI green on the PR into `staging` | (in CI) |
| 2. Staging deploy → smoke script → manual check of save, search, sign-in, sync, password reset (allowlisted email) | 1 h |
| 3. Production migration if any (expand only), release PR `staging → main`, deploy | 0.5 h |
| 4. Production smoke script with the internal account; check Sentry, uptime and dashboards daily for 72 hours | 1 h spread out |
| 5. Tag, build the production zip, submit to Chrome and Edge the same day. Chrome review usually takes 1–3 days; Edge up to 7 business days | 0.5 h |
| 6. GitHub Release notes and `CHANGELOG.md` | 0.5 h |
| 7. User email, if it meets the rule, after both stores are live | 1 h |
| 8. Fix regressions | from the buffer |

### Manual staging checklist

- Register, sign in, sign out
- Save from the popup (and shortcut and context menu once [Phase 5](phases/Phase_5.md) ships)
- Content extracted within 2 minutes
- Search finds a phrase from the page body; open a result
- Edit and delete a bookmark; create and delete a collection
- Password reset email arrives at the allowlisted address
- Export downloads; account deletion removes everything

## Rules

- **The API ships first, the extension second.** The API must keep working for the previous extension version for at least 30 days, because Edge users update late. Changes inside `/api/v1` are additive only.
- **One version number** shared by `package.json` and `extension/manifest.json`, following semver.
- **Risky behavior goes behind a server-side flag** in `GET /api/v1/config`, because a store release can't be rolled back quickly.
- **No new permission with an install warning** without a deliberate decision: it disables the extension for every existing user until they accept.

## When an update deserves an email

- **Email** when a release changes what a user can do, or how their data is handled.
- **Changelog only** for fixes, polish and performance.
- At most one product email every 4 weeks.
- Never before the release is live in both stores.

## Hotfix flow

1. Branch `hotfix/*` from `main`.
2. PR into `main`; CI must pass.
3. Deploy to staging first (cherry-pick onto `staging`), unless production is down.
4. Merge into `main`, smoke-test production.
5. Merge `main` back into `staging`.
6. If the extension is affected, tag and submit a patch version.

## Rollback

| What | How |
|---|---|
| API | Vercel Instant Rollback to the previous deployment. Safe because migrations are expand-only. |
| A feature | Turn it off with its flag in `/api/v1/config`. |
| Extension | No true rollback. Republish the previous code under a new, higher version number. |
| Data | Restore from the encrypted nightly backup (see the runbook). |
