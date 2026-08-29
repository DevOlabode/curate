# Roadmap

This is the direction of the project, not a contract. Features start as [issues](https://github.com/DevOlabode/curate/issues). See [GOVERNANCE.md](../GOVERNANCE.md) for how scope is decided.

## Shipped

- Private bookmark library in a Manifest V3 popup (title, URL, category, tags)
- Collections, with add/edit/delete from the popup
- Accounts in the popup (register, sign in, profile, password, delete)
- `/api/v1` JSON API with Bearer JWT
- Light and dark theme
- Product landing page and privacy policy
- [Chrome Web Store](https://chromewebstore.google.com/detail/curate/nlkfmdiphacjgicdcagonbfnpcdjfapo)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/curate/ailonhflbailiggfiimmkkmbeoggbjpk)

## Next

Work that would help the project most, in no strict order:

- **Automated tests** — API tests and a smoke check for the extension build in CI (CI already builds the unpacked bundle)
- **Clearer empty and error states** in the popup, labeled as `good first issue` when they are small enough
- **Token handling** — shorter-lived JWTs or a revocation path (see [security-audit.md](security-audit.md))
- **Self-hosted API URLs** — `optional_host_permissions` so a custom host does not require a rebuild
- **Contributor onboarding** — keep `good first issue` items specific (file paths and acceptance criteria)

## Considering

These need an issue and a design discussion before a PR:

- Search and filter across bookmarks
- Import / export a personal library
- Keyboard shortcuts in the popup
- Firefox, if MV3 APIs and store review stay aligned with Chrome/Edge

Curate stays private. A public feed or social sharing is out of scope unless that decision changes in an issue.
