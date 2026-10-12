# Phase 3: Content pipeline

**Weeks:** 5–7 (Nov 9–29, 2026) · **Estimate:** 24 hours · **Ships:** API-only dark launch to production (Mon Nov 23), no store submission

## Objective

Every saved URL gets its readable text and metadata extracted, reliably, at no cost. Handles retries, timeouts, failures, sites that block scraping, rate limits and duplicate URLs.

## Where the work runs

This is the key decision for **ADR-001**.

- **Queue in MongoDB** (`jobs` collection). Jobs are claimed atomically with `findOneAndUpdate`:
  - match `{status: 'queued', runAt <= now}` or `{status: 'running', lockedUntil < now}` (expired lease)
  - set `status: 'running'`, `lockedUntil: now + 60s`, increment `attempts`
- **Fast path:** `POST /bookmarks` inserts the bookmark and the job, returns 201, then processes the job via `waitUntil()`. A page is searchable seconds after saving.
- **Sweeper:** a GitHub Actions cron every 10 minutes, one per environment (the staging sweeper checks out the `staging` branch). Runs `scripts/sweep.js` for up to 4 minutes with concurrency 4. Picks up retries, expired leases and the backfill.
- **Cost:** $0.
- **Delivery is at-least-once**, so every handler is idempotent.

**Alternatives considered** (document in the ADR):

| Option | Why not now |
|---|---|
| BullMQ + Redis | New infrastructure to host and pay for |
| Agenda | Extra dependency; a hand-written queue is ~100 lines and a better design story |
| Always-on worker (Railway, Fly) | About $5 per environment per month |
| Vercel cron | Hobby plan runs cron at most once a day |

**When to upgrade:** move to an always-on worker if sweeper lag shows up in time-to-searchable p95, or GitHub cron becomes unreliable. GitHub disables scheduled workflows after 60 days without repo activity.

## What gets built

### Fetching (the security core)

- Resolve DNS yourself and **reject** private, loopback, link-local, CGNAT and metadata addresses (including 169.254.169.254, IPv6 ULA and `::1`).
- Allow only ports 80 and 443.
- **Pin the connection to the validated IP** (an undici `Agent` with a custom `lookup`), so DNS rebinding can't swap in a private address after the check.
- Follow at most 3 redirects manually and re-validate every hop.
- 10-second total timeout; 3 MB streamed size cap.
- Content types `text/html` and `application/xhtml+xml` only. Anything else gets metadata only with status `unsupported`.
- User agent `CurateBot/1.0 (+https://<domain>/bot)` with a `/bot` page explaining it.
- Fetches are user-initiated, one page at a time, so robots.txt is not consulted. Record this decision in the ADR.
- **Politeness:** at most one in-flight request per host, at least 2 seconds between requests to the same host.

### Extraction

- `@mozilla/readability` with `linkedom` (lighter than jsdom for the serverless bundle).
- Metadata from Open Graph, meta tags and JSON-LD: title, description, author, site name, published date, canonical URL, language.
- Reading time = word count ÷ 230.
- Store at most 30 KB of text per page.

### Failure handling

| Kind | Examples | Action |
|---|---|---|
| Retryable | timeouts, connection resets, 5xx, 408, 429 (honor `Retry-After`) | Backoff 1 min, 5 min, 30 min, 2 h, 12 h, with jitter |
| Terminal | other 4xx, SSRF-blocked, too large, unsupported type | `content.status = 'failed'` with an error code |
| Blocked | Cloudflare or similar challenge (`cf-mitigated` header, 403/503 challenge page) | `content.status = 'blocked'` |
| Exhausted | 5 attempts used | Job status `dead`; requeue with a script |

A failed extraction never fails the save. The bookmark stays searchable by title, tags and notes.

Note: Vercel and GitHub runner IPs are cloud IPs and more likely to be challenged. Measure the blocked rate; the optional extension-side metadata capture in [Phase 5](Phase_5.md) is the fallback.

### Duplicates

- `urlKey` = lowercase host, fragment removed, `utm_*` and `fbclid` stripped, trailing slash removed.
- Unique partial index on `{user, urlKey}`.
- Saving a URL that already exists returns `200 {bookmark, duplicate: true}` and the popup shows "Already saved".
- A unique partial index on `{bookmarkId}` for queued or running jobs prevents double-enqueueing.
- **Stale results:** the handler writes only if the bookmark still exists and its `urlKey` still matches the job's. If the user edited the URL mid-flight, the old result is discarded.
- If the user didn't type a title, the extracted title replaces the placeholder (`titleSource: 'user' | 'auto'`).

### Rate limits

- Saves: 60 per minute and 500 per day per user. Stops anyone using Curate as a free fetch proxy.
- Search: 60 per minute per user (used in [Phase 4](Phase_4.md)).

### API changes

- `GET /bookmarks` projects out `content.text`.
- `POST /bookmarks` enqueues a job and returns `duplicate: true` for existing URLs.

### Storage

M0 allows 512 MB. At about 20 KB per bookmark that's roughly 20,000 bookmarks. The metrics script reports storage use. Upgrade path: Atlas Flex.

### Operations

- `scripts/requeue-dead.js` to requeue dead jobs.
- `scripts/metrics.js` reports extraction success rate by error code, dead-letter rate, time-to-searchable p50/p95, queue depth and oldest queued job.
- The sweeper pings healthchecks.io on each run.

## Data model changes (expand migration)

- `Bookmark.urlKey: String`
- `Bookmark.titleSource: 'user' | 'auto'`
- `Bookmark.content`: `{status, title, description, author, siteName, publishedAt, lang, readingMinutes, wordCount, text, canonicalUrl, fetchedAt, error: {code, message}}`
- `jobs` collection: `{type, bookmarkId, urlKey, status, attempts, maxAttempts, runAt, lockedUntil, lastError, createdAt}`, index `{status: 1, runAt: 1}`, 14-day TTL index on completed jobs.

**Migration order:**

1. Backfill `urlKey` on all bookmarks.
2. **Report duplicates read-only** on staging, then production.
3. Merge duplicates: keep the oldest, union the tags, concatenate the notes.
4. Only then create the unique `{user, urlKey}` index.

## Tests required

- SSRF table test: private IPs, a DNS rebinding mock, a redirect to localhost, non-standard ports.
- Retry classification for each status code and error type.
- Claim and lease: two concurrent workers never process the same job; an expired lease is reclaimed.
- Idempotency: running a job twice gives the same result.
- A URL edited mid-flight discards the stale result.
- Extraction against 10 saved HTML fixtures.
- `urlKey` normalization.
- The duplicate-merge migration.

## Security considerations

SSRF is the main risk; see "Fetching" above. Also: stored page text is user data. It's covered by the account deletion cascade and export, and announced in privacy policy v2.

## Release checkpoint

**Dark launch, Mon Nov 23 (week 7):** deploy the pipeline to production with **no UI changes**. API only, no store submission. New saves start extracting, which gives real failure rates before search exists.

- Run the migrations on staging, verify, then production with approval.
- Start a throttled production backfill (see [Phase 4](Phase_4.md)).
- CHANGELOG entry under the API. No email.

## Metrics introduced

- Extraction success rate by error code
- Dead-letter rate
- Time-to-searchable p50 / p95
- Queue depth and oldest queued job age
- Database storage used

## Design doc

Write **ADR-001: Content extraction pipeline** in week 6. See [adr/README.md](../adr/README.md).

## Definition of done

- The pipeline has run on production for 7 days.
- At least 85% of HTML pages extract successfully.
- Fewer than 5% of jobs end up dead.
- p95 time-to-searchable is under 2 minutes.

## Not in this phase

- Headless browsers
- PDF parsing
- Sharing fetched content across users
- Extension-side full-text capture (pages behind a login raise privacy questions)
