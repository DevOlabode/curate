# Governance

Curate is maintained as a small open-source project. This document describes who decides what, so that does not have to be reinvented in every thread.

## Who makes decisions

**Project maintainer:** Samuel (@DevOlabode)

The maintainer has write access to the repository, store listings, and hosted API. Until other maintainers are named here, Samuel makes the final call on merges, releases, and scope.

## How decisions are made

| Kind of change | Process |
|----------------|---------|
| Typo, docs, small bug fix | Open a PR. Maintainer review is enough. An issue is optional. |
| New feature or user-visible behavior | Open an issue first. Discuss, then implement. |
| Permissions, auth, or data handling | Open an issue. Security-sensitive work follows [SECURITY.md](SECURITY.md). |
| Major architecture change | Write a short proposal in an issue (problem, options, recommended path). Wait for maintainer agreement before a large PR. |

"Small" means one focused change that does not expand the product. If you are unsure, file an issue.

The [Code of Conduct](CODE_OF_CONDUCT.md) applies to all project spaces. The maintainer enforces it.

## Becoming a maintainer

Write access is not granted for a single PR.

Someone may be invited as a maintainer when they have, over time:

- Made high-quality contributions
- Reviewed pull requests carefully
- Helped other contributors
- Shown they understand the architecture (extension, API, and landing site)

Invitations are at the current maintainer's discretion. Trusted reviewers can be added to [CODEOWNERS](.github/CODEOWNERS) for a path without becoming full maintainers.

## Releases

The maintainer publishes extension versions (`extension/manifest.json`) and records them in [CHANGELOG.md](CHANGELOG.md). Store uploads (Chrome Web Store, Microsoft Edge Add-ons) stay with the maintainer unless that is explicitly delegated.
