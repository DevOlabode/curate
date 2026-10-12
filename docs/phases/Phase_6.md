# Phase 6: Launch and user acquisition

**Weeks:** 12–13 (Dec 28, 2026–Jan 10, 2027) · **Estimate:** 12 hours · **Ships:** launch, Email 2

## Objective

Get full-text search in front of real developers and measure what happens. The launch headline is full-text search from [Release B](Phase_4.md); it does not depend on Release C being approved.

## What gets built

### Store listings

- Rewrite both listings around: **"Save anything useful while you develop, and find it when you need it."**
- Short description of 132 characters or fewer.
- Five 1280×800 screenshots (reuse the `store-assets/src` pipeline):
  1. Full-text search with a highlighted snippet
  2. One-click save and the "Already saved" state
  3. Right-click "Save link to Curate"
  4. Collections
  5. Dark mode
- Use a UTM link per channel. The Chrome Web Store dashboard reports `utm_source`.

### README

- A save-to-search GIF at the top.
- An architecture diagram (extension → API → MongoDB, with the queue and sweeper).
- A "How Curate is run" section: staging, CI, releases, monitoring.
- Links to the ADRs.

### Landing site

- New hero matching the store listing.
- `/bot` page for `CurateBot` (if not done in Phase 3).
- Changelog link (GitHub Releases).

### Channel schedule (week 13)

One channel per day, so problems can be fixed between waves and signups can be attributed:

| Day | Channel |
|---|---|
| Mon Jan 4 | r/chrome_extensions, r/SideProject |
| Tue Jan 5 | Show HN: "Show HN: Curate – full-text search over every page you've saved"; **Email 2** to existing users |
| Wed Jan 6 | dev.to technical article ("An SSRF-safe content pipeline on serverless for $0"), cross-posted to Hashnode |
| Thu Jan 7 | LinkedIn, X, Bluesky, with the GIF |
| Sat Jan 9 | r/webdev Showoff Saturday |

Check each subreddit's self-promotion rules first. Skip Product Hunt; it gives little return for developer tools.

### Pre-launch capacity check

- Atlas M0 storage headroom
- Brevo daily sending limit (300/day) against the list size
- Rate-limit thresholds (launch traffic shouldn't trip them for normal users)
- Vercel usage

### Email 2 draft

**Subject:** Save to Curate without opening it

> Hi {firstName},
>
> Three faster ways to save to Curate:
>
> - **Alt+Shift+S** saves the page you're on without opening the popup.
> - **Right-click any link** and choose "Save link to Curate". The title fills in on its own.
> - Opening the popup on a page you've already saved now shows "Already saved" and where it is.
>
> And search still looks inside every page you've saved.
>
> If anything feels slow or broken, reply. I read every reply.
>
> Samuel
>
> [Unsubscribe from product updates]

If Release C isn't approved in both stores by Jan 5, send Email 2 only after it is, or skip it.

## Data model changes

None.

## Tests required

- Smoke script against production before the first post.
- Manual check of the listing links and UTM parameters.

## Security considerations

- Watch rate limits and Sentry closely on launch days; abuse often arrives with traffic.
- Make sure the smoke and internal accounts are flagged `isInternal`.

## Release checkpoint

No new code release. Listing and landing updates go live before Mon Jan 4. Monitor daily for the week and fix regressions from the buffer.

## Metrics watched

Everything in [metrics.md](../metrics.md), split by channel where possible: installs (store dashboard), signups, first save, first search, D1 and D7 for the launch cohort.

## Definition of done

- All five channel posts published.
- Listing, README and landing updated.
- Launch-week numbers recorded for the post-launch review.

## Not in this phase

- Paid ads
- Product Hunt
- New features in response to launch feedback (log them as issues for the post-launch review)
