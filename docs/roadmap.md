# Roadmap

This is the direction of the project, not a contract. Features start as [issues](https://github.com/DevOlabode/curate/issues). See [GOVERNANCE.md](../GOVERNANCE.md) for how scope is decided.

The detailed plan for Oct 12, 2026 to Jan 10, 2027, phase by phase, is in [phases/](phases/README.md).

## Shipped

- Private bookmark library in a Manifest V3 popup (title, URL, category, tags)
- Collections, with add/edit/delete from the popup
- Accounts in the popup (register, sign in, profile, password, delete)
- `/api/v1` JSON API with Bearer JWT
- Automated API tests (`node --test`) for auth, bookmarks, and collections, running in CI
- Light and dark theme
- Product landing page and privacy policy
- [Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk)

## Now (Oct 2026 – Jan 2027)

| Phase | What | Issues |
|---|---|---|
| [0. Fix first](phases/Phase_0.md) | Rate limiting, token revocation on password change, remove the unlinked EJS library, indexes, save the current tab | #13 |
| [1. Staging](phases/Phase_1.md) | Isolated staging environment, migrations, backups, release flow | #12 (CI work) |
| [2. Measurement and email](phases/Phase_2.md) | Error tracking, uptime, privacy-preserving analytics, email domain and streams, data export | #16 (export) |
| [3. Content pipeline](phases/Phase_3.md) | Background extraction of page text and metadata; duplicate detection | |
| [4. Full-text search](phases/Phase_4.md) | Search inside saved pages with Atlas Search | #15 |
| [5. Capture polish](phases/Phase_5.md) | Keyboard shortcuts, right-click save, quick tags, save feedback | #17 |
| [6. Launch](phases/Phase_6.md) | Store listings, README, community launch | |

How releases work: [release-process.md](release-process.md). How success is measured: [metrics.md](metrics.md).

## Considering

These need an issue and a design discussion before a PR:

- Import of browser bookmarks (HTML file upload, no extra permission)
- A full-page library view, built as an extension page on the same API
- Self-hosted API URLs with `optional_host_permissions` (#14)
- Firefox, if MV3 APIs and store review stay aligned with Chrome/Edge

## Not planned

- Team workspaces, organizations, shared projects, roles
- Billing or paid plans
- File storage and uploads
- AI features
- A public feed or social sharing. Curate stays private unless that decision changes in an issue.
