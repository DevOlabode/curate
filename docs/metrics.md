# Metrics

What Curate measures and the target for each measure. Instrumentation is built in [phases/Phase_2.md](phases/Phase_2.md).

## Definitions

- **Active user:** saved, searched or opened a resource that day. Opening the popup alone does not count.
- **Activated user:** made a first save.
- Internal and smoke-test accounts (`User.isInternal`) are excluded from every metric.
- **Raw installs never count as success.** Installs only appear as aggregates in the store dashboards.

## Small numbers

Until a cohort reaches about 30 users, report **counts, not percentages** ("3 of 7 beta users searched in week 1", not "43%"). The percentage targets below apply once a cohort is large enough to make them meaningful.

Cohorts are reported separately (`User.cohort`):

- `beta`: the 5–10 developers recruited in week 4 ([Phase 2](phases/Phase_2.md))
- `launch`: everyone who signs up from launch week onward

## Funnel order

Signup happens inside the extension, so the funnel is:

store listing → install → signup → first save → first search → return visit

## Targets

| Area | Metric | Target |
|---|---|---|
| Activation | Weekly signups ÷ weekly installs (store dashboard) | ≥ 50% |
| | Signup → first save within 24 hours | ≥ 60% |
| | First search within 7 days | ≥ 30% |
| | Return on a later day within 7 days | ≥ 40% |
| Engagement (per weekly active user, per week) | Saves | ≥ 3 |
| | Searches | ≥ 1 |
| | Resources reopened from Curate | ≥ 2 |
| | Search success (a result opened within 60 seconds) | ≥ 50% |
| Retention (activated users) | D1 / D7 / D30 | ≥ 30% / ≥ 20% / ≥ 10% |
| | Weekly active users | tracked weekly |
| Health | Failed saves (5xx plus client errors) | < 1% |
| | HTML pages extracted successfully | ≥ 85% |
| | Pipeline jobs ending dead | < 5% |
| | Time-to-searchable p95 | < 2 minutes |
| | Search latency p50 / p95 (server, warm) | < 150 ms / < 400 ms |
| | API 5xx rate | < 0.5% |
| | Uptime | ≥ 99.5% |

## Where each number comes from

| Source | Metrics |
|---|---|
| PostHog (server-side events) | Funnel, engagement, retention |
| Chrome Web Store and Edge dashboards | Installs, weekly users, `utm_source` |
| `scripts/metrics.js` (MongoDB) | Pipeline success and dead-letter rates, time-to-searchable, queue depth, storage |
| Sentry | API errors, 5xx rate |
| Better Stack | Uptime |
| API timing in `search_performed` | Search latency |

## Baseline

Recorded in week 1 before any changes ([Phase 0](phases/Phase_0.md)): total users, users with at least one bookmark, users who saved in at least two distinct weeks since the August 2026 launch, bookmarks per user. These numbers are not published in this repository.

