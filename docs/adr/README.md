# Architecture decision records

Short design documents for the decisions behind Curate's main systems. Each one records the context, the decision, the alternatives considered and the consequences. Write each ADR when its phase finishes, while the trade-offs are fresh.

Name files `NNN-short-title.md` (for example `001-content-pipeline.md`).

## Planned

| ADR | Written in | Status |
|---|---|---|
| ADR-001: Content extraction pipeline | [Phase 3](../phases/Phase_3.md), week 6 | Planned |
| ADR-002: Search engine choice | [Phase 4](../phases/Phase_4.md), week 8 | Planned |
| ADR-003: Environments, releases and migrations | [Phase 1](../phases/Phase_1.md), week 3 | Planned |
| ADR-004: Analytics and privacy | [Phase 2](../phases/Phase_2.md), week 4 | Planned |

### ADR-001: Content extraction pipeline

- The MongoDB queue: lease and atomic claim mechanism
- At-least-once delivery and idempotent handlers
- Fast path (`waitUntil`) plus sweeper (GitHub Actions cron), and why there's no always-on worker: Vercel limits, $0 budget, when to upgrade
- Retry classification and backoff schedule; dead-lettering and requeueing
- SSRF threat model and how each defense works (IP blocking, DNS pinning, redirect re-validation, size and time caps)
- Politeness and the robots.txt decision
- Storage cap and M0 capacity math
- Alternatives: BullMQ + Redis, Agenda, SQS, an always-on Railway/Fly worker

### ADR-002: Search engine choice

- Options: Atlas Search, `$text`, Meilisearch, Typesense, Postgres
- Index mapping and field boosts
- Ranking design (exact, fuzzy, phrase, recency)
- The tenancy filter as a security boundary
- Latency targets and how they're measured
- Testing with Atlas-local and the golden relevance set
- Fallback and feature flag
- Backfill strategy
- Open question: tokenizing code terms

### ADR-003: Environments, releases and migrations

- Each staging safeguard and the failure it prevents
- Branch flow
- The two extension build variants and the permission-warning trap
- Expand/contract migrations
- API compatibility with older extension versions
- Rollback limits (especially for the extension)
- Backups and restore testing

### ADR-004: Analytics and privacy

- Server-side events only; no query text, email or name
- Data retention
- Account deletion cascade (database, PostHog, Brevo)
- Consent model for email

## Also planned

- `docs/runbook.md`: requeue dead jobs, rotate secrets, restore a backup, roll back, use the kill switch.
