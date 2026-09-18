# Security Audit - Curate Browser Extension (Phase 11)

**Date:** 2026-08-18  
**Scope:** `extension/`, `src/shared/`, `/api/v1` backend routes

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Manifest permissions | Pass | `storage` + scoped default host permissions; self-hosted hosts are optional |
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
| `optional_host_permissions` | User-granted access to one self-hosted API origin |

## Findings

### Resolved - Custom API URLs no longer need a rebuild

Self-hosted hosts are requested at runtime with `optional_host_permissions`. Default `host_permissions` stay limited to the hosted API and localhost. URLs are validated in `src/shared/apiUrl.js` (scheme required, no wildcards, `http://` only on loopback).

### Low - JWT in local storage

Acceptable for v1. Tokens are revocable only by expiry or password change (no server-side denylist yet).

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
2. Automated extension E2E tests in CI.

## Web application

Existing SSR routes unchanged. New `/api/v1` routes are additive and do not expose server secrets.
