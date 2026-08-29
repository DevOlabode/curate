# Contributing to Curate

Thanks for wanting to help. Curate is a private bookmark library that lives in a Chrome and Edge extension, with an Express API behind it.

Bug reports and feature ideas should start as [GitHub issues](https://github.com/DevOlabode/curate/issues/new/choose). Large code changes should have an issue before the PR.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Path from idea to merge

```text
Fork
  ↓
Clone
  ↓
Create branch
  ↓
Set up project
  ↓
Find/claim issue
  ↓
Make changes
  ↓
Test
  ↓
Open PR
  ↓
Review
  ↓
Merge
```

### 1. Fork and clone

Fork [DevOlabode/curate](https://github.com/DevOlabode/curate), then:

```bash
git clone https://github.com/<your-username>/curate.git
cd curate
git remote add upstream https://github.com/DevOlabode/curate.git
```

### 2. Create a branch

Branch off an up-to-date `main` (or `master`, if that is the default).

```bash
git fetch upstream
git checkout -b feature/add-bookmark-tags upstream/main
```

### 3. Set up the project

Follow [docs/development.md](docs/development.md). Short version:

```bash
npm install
cp .env.example .env
# Set MONGO_URI, SESSION_SECRET, and JWT_SECRET
npm run dev
npm run build:extension
```

Load `dist/extension/` as an unpacked extension. Point it at `http://localhost:3000` from the developer options page.

### 4. Find or claim an issue

- Look for [`good first issue`](https://github.com/DevOlabode/curate/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) if you are new here.
- Comment on the issue you want to take so two people do not duplicate the work.
- Open a [bug report](https://github.com/DevOlabode/curate/issues/new?template=bug_report.yml) or [feature request](https://github.com/DevOlabode/curate/issues/new?template=feature_request.yml) if the work is not filed yet.

### 5. Make changes

Keep the PR to one change. Match the style of nearby files. Do not commit `.env`, secrets, or `node_modules`.

Do not widen extension permissions (`storage`, host permissions) without an issue that explains why.

### 6. Test

There is no automated UI suite yet. Before you open a PR:

```bash
npm test
npm run build:extension
```

Then exercise the path you changed:

- Reload the unpacked extension.
- Sign in against your local API.
- Confirm the popup (and options page, if you touched it) still work.
- If you changed the landing site, check `landing/index.html` and `landing/privacy.html`.

### 7. Open a pull request

Push your branch and open a PR against `DevOlabode/curate`. Use the PR template. Link the issue with `Closes #123`.

### 8. Review and merge

A maintainer reviews. Expect questions or requested changes. Once it is approved, a maintainer merges.

## Branch naming

| Prefix | Use |
|--------|-----|
| `feature/` | New behavior |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | No behavior change |
| `chore/` | Tooling, CI, dependencies |

Examples:

```text
feature/add-bookmark-tags
fix/search-filter-bug
docs/improve-setup-guide
```

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add bookmark filtering
fix: resolve duplicate bookmark issue
docs: update installation guide
refactor: extract collection list renderer
chore: add CI workflow
```

- `feat` — user-facing addition
- `fix` — bug fix
- `docs` — documentation
- `refactor` — internal change
- `test` — tests
- `chore` — build, CI, deps

Keep the subject under ~72 characters. Explain *why* in the body when the diff is not obvious.

## What belongs where

| Kind of work | Where it lives |
|--------------|----------------|
| Popup UI and library | `extension/popup/` |
| Developer API settings | `extension/options/` |
| Shared API client | `src/shared/` |
| JSON API | `routes/api/`, `controllers/api/` |
| Product site | `landing/` |
| Contributor docs | `docs/`, files in the repo root |

## License

By contributing, you agree that your work is licensed under the [MIT License](LICENSE), the same as the rest of Curate.
