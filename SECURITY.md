# Security Policy

Curate is a browser extension plus an API that stores private bookmarks. Treat security reports as confidential.

## Where to report

**Report privately.** Use GitHub's private advisory form:

[Report a vulnerability](https://github.com/DevOlabode/curate/security/advisories/new)

Do **not** open a public GitHub issue, pull request, or discussion for a vulnerability. Do not post details in Chrome Web Store or Edge Add-ons reviews.

## What to include

- A description of the issue and the impact (what an attacker can do)
- The affected surface: popup, options page, service worker, `/api/v1`, or the landing site
- Steps to reproduce, or a proof of concept
- Curate version (`extension/manifest.json`) and browser (Chrome or Edge)
- Whether you tested against production or a local server

Do not attach live session tokens, passwords, or other people's bookmark data.

## What we consider in scope

- Authentication bypass or account takeover
- Access to another user's bookmarks or collections
- Cross-site scripting in the extension popup or options page
- Secrets shipped in the extension bundle (`JWT_SECRET`, database URLs, SMTP keys)
- Privilege issues from overly broad extension permissions
- Server injection or unsafe deserialization on `/api/v1`

Out of scope unless you can show a practical exploit: theoretical issues with no reproduction, reports about third-party CDNs on password-reset pages, and social-engineering of individual users.

## Disclosure process

1. You submit a private advisory.
2. The maintainer acknowledges the report, usually within **5 days**.
3. We confirm the issue, agree on severity, and work on a fix.
4. We release a patch (and a store update if the extension is affected).
5. We publish a summary after users have had time to update. We will credit you if you want that.

Please give us a reasonable window before any public write-up. If you have not heard back after 5 days, you can follow up on the same advisory.

## Maintainer notes

Extension JavaScript is public. Never put `JWT_SECRET`, `SESSION_SECRET`, `MONGO_URI`, or SMTP credentials in `extension/`, `src/shared/`, or `landing/`.
