# Phase 2: Measurement and email foundations

**Weeks:** 3–4 (Oct 26–Nov 8, 2026) · **Estimate:** 11 hours + 5 hours for Release A · **Ships:** Release A v1.1.0

## Objective

Be able to see errors, uptime and real usage before building the bigger features, and set up professional user email.

## What gets built

### Backend / API

- **Sentry** via `@sentry/node`, tagged with `environment=APP_ENV` and `release=VERCEL_GIT_COMMIT_SHA`. Alert rules filter to `environment=production`.
- **No Sentry in the extension:** there's no bundler and vendoring the SDK isn't worth it. The popup reports failed API calls to `POST /api/v1/events {type: 'client_error', op, status}` instead. Failures that never reach the server stay invisible; that's an accepted limit.
- **PostHog, server-side only** (`posthog-node`, sent after the response with `waitUntil`):
  - `distinct_id` is the user ID. No email, no name, GeoIP off.
  - **Never send the raw search query**; only its length and the result count.
  - Events: `signed_up`, `app_opened` (at most once per day per user, deduplicated client-side), `bookmark_saved {source, duplicate}`, `search_performed {resultCount, latencyMs, filters}`, `result_opened {rank}`, `bookmark_opened {from}`.
- `POST /api/v1/bookmarks/:id/open` updates `openCount` and `lastOpenedAt` and emits `bookmark_opened`. The popup calls it when a bookmark is opened.
- Exclude `User.isInternal` accounts (added in [Phase 0](Phase_0.md)) from every analytics event and metric. The smoke-test account is created internal.
- `User.cohort`: `'beta'` or `'launch'`, set at signup from an environment variable, so the beta cohort is reported separately.
- **Data export:** `GET /api/v1/export` as JSON and as Netscape bookmark HTML. Closes half of issue #16.
- **Account deletion cascade:** `DELETE /auth/me` also removes jobs and stored content (once they exist), deletes the PostHog person and removes the Brevo contact.

### Email

- **Provider: stay on Brevo.** It's already integrated, the free tier (300/day) is enough, and its campaigns handle unsubscribe and `List-Unsubscribe` headers.
- **Domain:** buy one (about $12/year). SPF, DKIM and DMARC require a domain you own.
  - Use the DNS records Brevo generates; don't hand-write them.
  - DMARC starts at `p=none` with a `rua` reporting address, then moves to `p=quarantine` after 3 weeks of clean reports.
  - **The API stays on `curate-eight-omega.vercel.app`.** Changing the API host means a new host permission, which disables the extension for every user.
- **Three email streams:**

  | Stream | Examples | From | Unsubscribe |
  |---|---|---|---|
  | Transactional | password reset, **password changed** (new), account deleted | `account@` | No |
  | Onboarding | one welcome email at signup | `hello@` | Yes |
  | Product updates | release announcements (Brevo campaigns) | `samuel@` | Yes (Brevo) |

  No onboarding drip: with so few users there's nothing to tune.
- **Consent:** Brevo is the single source of truth for the "Product updates" list. A checkbox at signup (unchecked by default) and a toggle in the popup's account settings call the Brevo API. Existing users get one announcement with a clear one-click unsubscribe. Check CAN-SPAM, CASL or GDPR depending on where users are.
- **Templates:** pull the styling from the reset email in `utils/mailer.js` into one `layout({heading, body, cta})` function with a plain-text version.
- **Staging** uses the email guard from [Phase 1](Phase_1.md) and never has the Brevo marketing key.

**When an update deserves an email:** only when a release changes what a user can do, or how their data is handled. Fixes and polish go in the changelog only. At most one product email every 4 weeks, and never before the release is live in both stores.

### Monitoring

- **Uptime:** Better Stack free tier on `/api/v1/health` (database-aware since [Phase 0](Phase_0.md)), with a public status page.
- **healthchecks.io** as a dead-man's switch for the pipeline sweeper ([Phase 3](Phase_3.md)).

### Web / landing

- **Privacy policy v2:** covers server-side analytics and announces that page content will be stored starting with Release B.
- Update the Chrome Web Store privacy practices form to match.

### Extension

- Send `app_opened` once per day and call the `/open` endpoint when a bookmark is opened.
- Signup consent checkbox and an account-settings toggle for product update emails.
- Export link in account settings.

## Data model changes

- `Bookmark.openCount: Number` (default 0), `Bookmark.lastOpenedAt: Date`
- `User.cohort: String` (`'beta'` until launch week, then `'launch'`)

All additive; no migration needed beyond defaults.

## Tests required

- Analytics event payloads never contain query text, email or name.
- Export returns only the caller's data.
- Account deletion cascades.
- The email guard blocks non-allowlisted addresses outside production.
- Consent toggle calls Brevo with the right list action (mocked).

## Security considerations

- No personal data in PostHog or Sentry (scrub request bodies in Sentry).
- Export is authenticated and rate-limited.
- The Brevo API key exists only in the production environment.

### Beta cohort

Recruit 5–10 developers (classmates, friends, developer communities you're already in) in week 4, once Release A is live. Ask each to use Curate for real for two weeks, and ask for one short piece of feedback at the end. Phases 3 and 4 depend on their saves for tuning extraction and ranking. About 4–5 hours, paid for by the simplifications in Phases 3 and 4.

## Release checkpoint: Release A v1.1.0 (week 4)

Includes [Phase 0](Phase_0.md) and this phase. Follow the [standard checklist](../release-process.md#release-checklist):

- Staging Wed Nov 4 → production Fri Nov 6 → submit to **both stores Fri Nov 6**.
- Release notes and CHANGELOG entry, including a privacy policy notice.
- **No user email.** Saving the current tab is useful but not email-worthy.

## Metrics

The whole funnel starts reporting (see [metrics.md](../metrics.md)). Search metrics start at Release B.

## Definition of done

- A production error shows up in Sentry within a minute.
- The funnel is visible in PostHog.
- A test email passes SPF, DKIM and DMARC (mail-tester.com score of 9/10 or better).
- Release A is live in both stores.
- At least 5 beta users have signed up.

## Not in this phase

- A custom email preference center (Brevo handles it)
- A metrics warehouse
- Client-side analytics
