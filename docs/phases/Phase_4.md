# Phase 4: Full-text search

**Weeks:** 7–9 (Nov 23–Dec 13, 2026) · **Estimate:** 21 hours + 8 hours for Release B · **Ships:** Release B v1.2.0, Email 1

## Objective

Search across the extracted text of saved pages, not just titles and tags, with ranking, filters and defined latency targets. Collections are searched too, so a user with many bookmarks and collections finds either from one box. Backfill everything saved before the pipeline existed.

## Search engine choice: MongoDB Atlas Search

| Option | Verdict |
|---|---|
| **Atlas Search** | **Chosen.** Already on Atlas: no new service, no sync pipeline (Atlas syncs the index within seconds), real BM25 relevance, fuzzy matching, highlighting, available on M0 (the free tier allows a small number of search indexes, about 3 at last check; verify). Downsides: ties Curate to Atlas; `mongodb-memory-server` can't run `$search` (solved with the Atlas-local Docker image); shares cluster resources on M0. |
| Mongo `$text` | One text index per collection, weak relevance, no fuzzy matching, no highlighting. Not good enough. |
| Meilisearch / Typesense | Excellent relevance, but another server to host and pay for (about $5–30/month), plus a sync pipeline and deletion bookkeeping. |
| Postgres full-text search | Would mean rewriting the stack. Out of scope. |

## What gets built

### Index

The definition lives in the repo at `search/bookmarks.index.json` and is applied to staging first, then production.

- `user` indexed as `objectId`. **Every query must filter on `user`.** This is the tenant boundary; it has its own test.
- Text fields and boosts:

  | Field | Boost |
  |---|---|
  | `title` | 4 |
  | `tags` | 3 |
  | `notes` | 2 |
  | `content.title` | 2 |
  | `content.description` | 1.5 |
  | `content.text` | 1 |

- `autocomplete` mapping on `title` for search-as-you-type.
- `tags`, `collection`, `content.siteName` and `createdAt` indexed for filters.

### Ranking

- An exact clause plus a fuzzy clause (`maxEdits: 1`, `prefixLength: 2`, no boost), so exact matches rank higher.
- A `phrase` `should` clause on `content.text` with a 2× boost.
- A small recency boost: `near` on `createdAt` with a 90-day pivot.
- **Open question:** tokenizing code terms (`Array.prototype.flatMap`, `useEffect`). Measure with the golden set before adding custom analyzers.

### Backend / API

- `GET /api/v1/search?q=&tag=&collection=&site=&from=&to=&page=`
  - 20 results per page
  - Each result includes a highlighted snippet from `content.text`, site, date and score
  - If `$search` fails (index missing or still building), returns 503 with `{fallback: true}`
  - Rate limit: 60 per minute per user
- **Feature flag:** `GET /api/v1/config` returns flags read from environment variables (`search: on|off`). A store release can't be rolled back quickly, so this server-side switch is the kill switch.
- Analytics: `search_performed {resultCount, latencyMs, filters}` and `result_opened {rank}`. Never the query text.

### Extension (popup)

- Search box focused on open; `/` focuses it; 150 ms debounce.
- **Results appear as the user types; Enter is never needed to search.** Requests start at 2 characters; a newer keystroke aborts the in-flight request (`AbortController`) so stale results never overwrite newer ones. Clearing the box restores the normal list.
- **Collections in results:** matching collections show as a group above bookmark results (name, description, bookmark count). Selecting one opens that collection. They are filtered in the browser from the collection list the popup already loads (case-insensitive substring on `name` and `description`): a user has tens of collections, not thousands, so no index or endpoint is needed.
- Results show the highlighted snippet, site and date. Arrow keys move, Enter opens.
- On a 503 or when the flag is off: filter the already-loaded list by title and tags in the browser.

### Backfill

- `scripts/backfill-content.js` enqueues a job for every bookmark without content. The library is a few dozen bookmarks today, so no batching or throttling; the sweeper drains it.
- Resumable and idempotent: skips bookmarks that already have content or an open job.
- Runs on staging first, then production through the workflow with approval.
- Most of the production backfill has already run during the [Phase 3](Phase_3.md) dark launch.
- Search works the whole time on title, tags and notes, so there's no downtime.

## Latency targets

| Measure | Target |
|---|---|
| Server-side p50 (warm) | < 150 ms |
| Server-side p95 (warm) | < 400 ms |
| End-to-end p95 including cold starts | < 800 ms |
| Popup: first results after the user stops typing | < 500 ms |

Track cold starts separately from warm requests.

## Data model changes

- Atlas Search index on `bookmarks` (staging, then production).
- No document shape changes.

## Tests required

- Query-builder unit tests.
- Integration tests in CI against Docker `mongodb/mongodb-atlas-local`.
- **Cross-tenant test:** user B never gets user A's documents.
- **Golden relevance set:** 30 real queries against the seeded corpus with expected top-3 results. Fails if relevance regresses.
- Flag off returns the fallback response.
- Collection filter unit test: matches on name and description, case-insensitive, and only the user's own collections are in the list.

## Security considerations

- The `user` filter is enforced in the query builder, not by callers; the cross-tenant test guards it.
- Query text is not logged or sent to analytics.
- Search is rate-limited.

## Release checkpoint: Release B v1.2.0 (week 9)

Follow the [standard checklist](../release-process.md#release-checklist), plus:

- **Before store submission:** privacy policy updated and the store data disclosures say "website content" is collected.
- Staging Fri Dec 4; staging soak Mon–Tue Dec 7–8; production Wed Dec 9; store submissions Wed Dec 9.
- Release notes and CHANGELOG.
- **Email 1** once both stores are live (~Dec 11–14). With one active existing user, send it as a personal email, not a Brevo campaign. The draft below is the template for that email and for future announcements.

### Email 1 draft

**Subject:** Curate now searches the full text of everything you save

> Hi {firstName},
>
> You can now search inside the pages you've saved in Curate, not just their titles and tags.
>
> Open the Curate popup and start typing. You'll get matches from the page text itself, with the matching line highlighted. Pages you saved before today have been indexed too.
>
> Also new:
> - Curate fills in the title and description when you save a page.
> - Saving the same page twice shows "Already saved" instead of creating a copy.
>
> To make search work, Curate now stores the readable text of each page you save. Pages behind a login aren't fetched. You can read the updated privacy policy, export your library, or delete your account from the popup at any time.
>
> Chrome and Edge update extensions automatically. If you don't see the search box yet, open chrome://extensions and click Update.
>
> Reply to this email if something breaks. I read every reply.
>
> Samuel
>
> [Unsubscribe from product updates]

## Metrics introduced

- Searches per weekly active user
- Search success rate (a result opened within 60 seconds)
- Search latency p50 / p95
- First search within 7 days of signup

## Design doc

Write **ADR-002: Search engine choice** in week 8. See [adr/README.md](../adr/README.md).

## Definition of done

- Latency targets hold on production.
- The golden set passes.
- Backfill is over 95% complete.
- Release B is live in both stores and Email 1 has been sent.

## Not in this phase

- Semantic or vector search (AI is out of scope)
- Saved searches
- Searching across users
