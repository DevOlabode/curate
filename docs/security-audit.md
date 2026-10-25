# Security Audit - Curate Browser Extension (Phase 11)

**Date:** 2026-08-18  
**Scope:** `extension/`, `src/shared/`, `/api/v1` backend routes

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Manifest permissions | Pass | Only `storage` + scoped host permissions |
| Secrets in bundle | Pass | No `.env`, JWT secret, or DB credentials in extension |
| CSP | Pass | `script-src 'self'`, no inline scripts |
| XSS / innerHTML | Mitigated | User content escaped before DOM insertion in popup/options |
| eval / remote code | Pass | Not used |
| Token handling | Pass | Bearer token in `chrome.storage.local`; cleared on 401 |
| CORS | Pass | Extension origins + optional web allowlist |
| Content scripts | N/A | None shipped |
| Message passing | Pass | Minimal auth state messages in service worker |

## Permissions justification

| Permission | Justification |
|------------|---------------|
| `storage` | Persist auth token, theme, API URL preference |
| `host_permissions` (production URL) | HTTPS API calls to deployed Curate backend |
| `host_permissions` (localhost) | Local development only |

## Findings

### Low - Static host permissions for custom API URLs

Users who set a custom API base URL in options must also add that origin to `host_permissions` in `manifest.json` and rebuild. Documented in options UI and store readiness doc.

### Low - JWT in local storage

Acceptable for v1. **Correction (Oct 2026):** tokens are revocable only by expiry. Changing or resetting a password does **not** invalidate existing tokens, because the JWT carries no password or token version. Fixed in [Phase 0](phases/Phase_0.md) with a `tokenVersion` claim.

### Informational - No refresh tokens

Users re-authenticate after JWT expiry.

## Prohibited patterns (verified absent)

- `eval()`
- `new Function()`
- Remote script injection
- Inline event handlers in extension HTML
- Broad `<all_urls>` permission

## Recommendations (future, not blocking)

1. Optional refresh tokens + server revocation list.
2. `optional_host_permissions` workflow for self-hosted API URLs.
3. Automated extension E2E tests in CI.

## Web application

Existing SSR routes unchanged. New `/api/v1` routes are additive and do not expose server secrets.

## Addendum: review of Oct 12, 2026

A full repository review found the following. Fixes are scheduled in [phases/Phase_0.md](phases/Phase_0.md) unless noted.

| Severity | Finding | Plan |
|---|---|---|
| High | No rate limiting on `/api/v1/auth/login`, `/register`, `/forgot-password` or the web equivalents. Allows password brute force and exhausting the Brevo daily quota, which blocks real password resets. | Mongo-backed rate limits (Phase 0) |
| Medium | Password change or reset does not revoke existing JWTs (7-day lifetime). | `tokenVersion` claim (Phase 0) |
| Medium | The EJS library routes (`/bookmark`, `/collections`, `/login`, `/signup`, `/user/*`) are unlinked but live in production. They use session cookies with method-override and no CSRF tokens. | Delete them (Phase 0) |
| Medium | `SESSION_SECRET` falls back to `'defaultsecret'`; session cookie has no `secure` or `sameSite`. | Fail boot without secrets; set cookie flags (Phase 0) |
| Medium | `isValidHttpUrl` accepts `localhost`. Harmless while URLs are only stored; an SSRF hole once the server fetches saved pages. | SSRF-safe fetcher with IP blocking and DNS pinning ([Phase 3](phases/Phase_3.md)) |
| Medium | MongoDB Atlas M0 has no backups. | Encrypted nightly backups to object storage ([Phase 1](phases/Phase_1.md)) |
| Low | Local development can point at a hosted Atlas cluster, and with no database name in the URI, Mongo uses its default `test` database. | Local Docker database; boot guard matching `APP_ENV` to database name (Phases 0–1) |
| Low | Any `chrome-extension://` origin passes CORS with `credentials: true`. Acceptable because the API uses Bearer tokens, not cookies. | No change |
| Info | `/health` does not check the database. | Database-aware health check (Phase 0) |
