# Changelog

All notable changes to Curate are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) for the
extension (`extension/manifest.json`).

## [Unreleased]

### Added

- The add-bookmark forms fill in the current tab's title and URL (`activeTab` permission, no install warning)
- Rate limits on sign-in, registration and password-reset requests
- `/api/v1/health` now checks the database and returns 503 when it is unreachable
- Database indexes for listing bookmarks and collections

### Changed

- Changing or resetting your password signs out other devices. The device you changed it on stays signed in.
- Session cookies are `secure` and `SameSite=Lax` in production; the server refuses to start in production without its secrets

### Changed

- If the database is unreachable, the API now answers `/api/v1/health` with 503 instead of crashing
- The website no longer uses sessions or sets cookies; the password-reset pages show their messages directly

### Fixed

- One privacy policy instead of three copies, now covering the short-lived rate-limit counters

### Removed

- The old website library (`/bookmark`, `/collections`, `/login`, `/signup`, `/user/*`). It was unlinked; the library lives in the extension. Password reset pages stay.

## [1.0.2] - 2026-09-29

### Added

- Open-source contributor docs and GitHub community files (issues, PRs, CI, code of conduct)

### Changed

- Clearer collections empty state in the popup, with focus on the name field when creating a collection
- Production API moved to a new Vercel deployment
- Removed a deprecated `scripts` entry from `manifest.json`

## [1.0.1] - 2026-08-24

### Added

- Listing on [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk)
- Chrome and Edge install links on the landing site

### Changed

- Landing and privacy copy no longer treats Edge as coming soon

## [1.0.0] - 2026-08

### Added

- Initial public release
- Manifest V3 popup for bookmarks, collections, and accounts
- `/api/v1` JSON API with Bearer JWT auth
- Product landing page and privacy policy
- Listing on the [Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo)
