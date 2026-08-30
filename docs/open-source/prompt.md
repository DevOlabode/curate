# Curate Open-Source Readiness Improvements

## Objective

Update the Curate repository to address the remaining open-source readiness gaps identified during the repository audit.

Do not rewrite the project or replace existing working functionality unnecessarily. Preserve the current architecture and improve the existing setup.

The primary goals are:

1. Improve the contributor workflow.
2. Make the application testable.
3. Replace the current placeholder test command with meaningful automated testing.
4. Strengthen CI.
5. Improve the PR workflow.
6. Improve extension contributor documentation.
7. Prepare the repository for a real contributor backlog.

---

# 1. Audit Existing Files Before Making Changes

Before modifying anything, inspect the current versions of:

```text
.github/
CONTRIBUTING.md
GOVERNANCE.md
docs/roadmap.md
package.json
extension/
README.md
index.js
```

Do not overwrite existing documentation with generic templates.

Preserve useful existing content and make targeted improvements.

---

# 2. Improve `CONTRIBUTING.md`

## Required change

The repository's default branch is `main`.

Remove any unnecessary wording suggesting that contributors might need to use `master`.

For example, replace wording similar to:

```text
Branch off an up-to-date main (or master, if that is the default).
```

With:

```text
Branch off an up-to-date main branch.
```

## Testing section

Review the current testing instructions.

Currently, the project should not imply that `npm test` provides comprehensive automated test coverage if it only performs syntax validation.

Until meaningful tests are implemented, use wording that accurately reflects the available checks.

Once the real test suite is implemented, update the contributing guide to document:

```bash
npm test
npm run build:extension
```

Also explain when contributors should perform manual testing.

---

# 3. Improve the Pull Request Template

File:

```text
.github/PULL_REQUEST_TEMPLATE.md
```

Preserve the existing sections where appropriate.

Add a dedicated testing section similar to:

```md
## Testing

Describe how you tested these changes.

- [ ] Automated tests
- [ ] Manual testing
- [ ] Extension build completed successfully
```

Do not require every checkbox for every PR.

The contributor should be able to explain which checks are applicable.

Consider adding a short note such as:

```text
Check the items that apply to your change.
```

---

# 4. Improve Application Architecture for Testability

## Problem

The current application startup architecture makes comprehensive automated API testing difficult.

The application should separate:

```text
Express application creation
```

from:

```text
HTTP server startup
```

## Desired architecture

Refactor toward a structure similar to:

```text
app.js
```

Responsible for:

* Creating the Express application.
* Registering middleware.
* Registering routes.
* Configuring application-level behavior.
* Exporting the configured Express app.

Example concept:

```js
const app = express();

// middleware
// routes

module.exports = app;
```

Then:

```text
index.js
```

Should be responsible for:

* Loading environment configuration.
* Connecting to required services.
* Importing the Express app.
* Starting the HTTP server.

Example concept:

```js
const app = require("./app");

app.listen(PORT, () => {
  // server startup
});
```

## Important requirements

Do not blindly copy this example.

Adapt the refactor to the repository's existing architecture.

Preserve:

* Existing middleware.
* Existing routes.
* Database initialization.
* Authentication behavior.
* Environment validation.
* Error handling.

Ensure the application still starts normally using:

```bash
npm start
```

and:

```bash
npm run dev
```

after the refactor.

---

# 5. Implement a Real Automated Testing Foundation

## Current problem

The current `npm test` command should not only syntax-check one JavaScript file.

Implement a real testing foundation.

Prefer starting with Node.js's built-in test runner unless the existing architecture strongly benefits from another solution.

The desired command should eventually resemble:

```json
{
  "scripts": {
    "test": "node --test"
  }
}
```

Do not add unnecessary dependencies if Node's built-in testing tools are sufficient.

---

# 6. Create a Test Structure

Create an organized test structure appropriate for the existing repository.

Recommended structure:

```text
tests/
├── api/
│   ├── auth.test.js
│   ├── bookmarks.test.js
│   └── collections.test.js
│
├── unit/
│   └── validators.test.js
│
└── helpers/
    └── setup.js
```

Do not create empty placeholder tests simply to populate directories.

Only create files containing meaningful tests.

Adapt the exact structure if the repository architecture suggests a better organization.

---

# 7. Add Authentication API Tests

Create meaningful automated tests for authentication behavior.

Inspect the actual API routes and implement tests appropriate to the existing functionality.

Potential coverage should include relevant behaviors such as:

* Valid registration.
* Invalid registration input.
* Login with valid credentials.
* Login with invalid credentials.
* Authentication-required endpoints rejecting unauthenticated requests.
* JWT-related behavior where applicable.

Do not test implementation details unnecessarily.

Focus on observable behavior and API responses.

---

# 8. Add Bookmark API Tests

Create meaningful tests for bookmark CRUD behavior.

Test the actual API contract.

Potential coverage should include:

## Create

* Authenticated user can create a bookmark.
* Invalid input is rejected.
* Required fields are validated.

## Read

* User can retrieve their own bookmarks.
* User cannot access another user's private bookmarks where applicable.

## Update

* User can update their own bookmark.
* Invalid updates are rejected.
* Unauthorized updates are rejected.

## Delete

* User can delete their own bookmark.
* Unauthorized deletion is rejected.

Adapt these requirements to the actual Curate API and data model.

Do not invent endpoints that do not exist.

---

# 9. Add Collection API Tests

Create meaningful tests for collection operations.

Potential coverage should include:

## Create

* Authenticated user can create a collection.
* Validation works correctly.

## Read

* User can retrieve their own collections.
* User isolation is maintained.

## Update

* User can update their own collections.
* Unauthorized updates are rejected.

## Delete

* User can delete their own collections.
* Unauthorized deletion is rejected.

Again, adapt to the actual implementation.

---

# 10. Test Database Strategy

Determine the best strategy for testing MongoDB behavior.

Requirements:

* Tests must not accidentally use or modify production data.
* Test data should be isolated.
* Test data should be cleaned up appropriately.
* Tests should be reasonably easy for contributors to run.

Before implementing a database testing solution, inspect:

```text
Database connection code
Mongoose configuration
Environment variable usage
Existing development setup
```

Document any required test environment variables.

If additional dependencies are necessary, justify them and keep the testing setup simple.

---

# 11. Improve `package.json` Scripts

After implementing the test suite, ensure the scripts accurately represent their purpose.

The final setup should support at least:

```bash
npm start
npm run dev
npm test
npm run build:extension
```

Do not leave:

```bash
npm test
```

performing only a syntax check.

If useful, add separate scripts such as:

```bash
npm run test:watch
npm run test:api
```

Only add these if they provide genuine value.

Avoid unnecessary script proliferation.

---

# 12. Improve GitHub Actions CI

File:

```text
.github/workflows/ci.yml
```

Inspect the existing workflow first.

Preserve existing useful behavior.

The CI workflow should eventually perform the following on relevant pushes and pull requests:

## Step 1: Install dependencies

Use:

```bash
npm ci
```

where appropriate.

## Step 2: Run automated tests

Use:

```bash
npm test
```

## Step 3: Build the browser extension

Use:

```bash
npm run build:extension
```

## Step 4: Verify the build output

Verify that the expected extension build output exists.

At minimum, confirm that the generated extension includes the expected manifest.

Do not make CI dependent on unavailable secrets unless absolutely necessary.

If database-backed integration tests require special infrastructure, determine whether:

1. A temporary test database can be used safely, or
2. Those tests should be separated from the basic CI workflow.

Document the decision.

---

# 13. Improve Extension Contributor Documentation

File:

```text
extension/README.md
```

Review the existing documentation.

Add or improve a section explaining the extension structure.

The documentation should explain the purpose of major directories, based on the actual codebase.

For example:

```text
extension/
├── assets/
│   └── Static assets such as icons.
│
├── background/
│   └── Background/service worker functionality.
│
├── options/
│   └── Extension configuration and settings UI.
│
├── popup/
│   └── Primary user-facing extension interface.
│
└── manifest.json
    └── Extension configuration and permissions.
```

Do not describe files incorrectly.

Inspect the actual implementation first.

Also document:

* How to build the extension.
* How to load it locally.
* Where generated build files are placed.
* Important development considerations.

Keep the documentation concise.

---

# 14. Review Issue Forms

Inspect:

```text
.github/ISSUE_TEMPLATE/
```

Existing forms should include appropriate templates for:

* Bug reports.
* Feature requests.
* Good first issues.

Do not replace working forms unnecessarily.

Verify that each form collects useful information.

## Bug reports should help collect:

* Clear description.
* Steps to reproduce.
* Expected behavior.
* Actual behavior.
* Environment information.
* Screenshots or additional context where relevant.

## Feature requests should help collect:

* The problem being solved.
* Proposed solution.
* Alternatives considered.
* Additional context.

## Good first issues

Ensure the template helps maintainers create well-scoped beginner-friendly issues.

A good first issue should ideally include:

* Clear problem description.
* Relevant files or directories.
* Suggested starting point where useful.
* Acceptance criteria.
* Explicitly defined scope.

---

# 15. Do Not Overcomplicate GitHub Configuration

The current project already has important community health files.

Do not add numerous unnecessary files or templates.

Do not add extra issue templates merely for the sake of having more templates.

The current open-source foundation should remain focused and easy to understand.

Avoid unnecessary additions such as separate templates for every possible category.

---

# 16. Keep `GOVERNANCE.md` Simple

Review the existing governance document.

The project currently has a primary maintainer.

Do not introduce unnecessary voting systems or complex governance processes.

The governance model should remain appropriate for a project with one primary maintainer and potential future contributors.

Preserve the existing concepts around:

* Maintainer decision-making.
* Major architecture discussions.
* Security-sensitive changes.
* Pathways for trusted contributors to become maintainers.

Only make changes if there are actual inconsistencies with the current repository.

---

# 17. Keep the Roadmap Separate From the Issue Backlog

File:

```text
docs/roadmap.md
```

Do not turn the roadmap into a giant issue tracker.

The roadmap should describe:

```text
Direction
```

while GitHub Issues should describe:

```text
Specific work
```

Maintain this distinction.

Roadmap items can eventually link to relevant GitHub Issues when appropriate.

---

# 18. Create a Contributor Issue Backlog

After inspecting the actual implementation and file paths, create detailed GitHub Issues for real work.

Do not create fake or vague issues.

Each issue should represent meaningful work that the project actually needs.

---

## Issue 1: Improve the Empty State When No Bookmarks Exist

Suggested labels:

```text
good first issue
extension
ui/ux
```

Requirements:

* Inspect the current empty state implementation.
* Improve clarity for new users.
* Explain what the user can do next.
* Provide a clear action where appropriate.
* Preserve existing behavior.
* Work correctly in supported themes.
* Maintain accessibility.

The final issue should reference the actual relevant files.

---

## Issue 2: Improve the Empty State When No Collections Exist

Suggested labels:

```text
good first issue
extension
ui/ux
```

Requirements:

* Inspect the existing collections experience.
* Improve the empty state.
* Explain the purpose of collections.
* Make the next action clear.
* Preserve theme support.
* Maintain accessibility.

Reference actual files.

---

## Issue 3: Standardize User-Facing Error Messages

Suggested labels:

```text
good first issue
extension
ui/ux
```

Requirements:

* Identify inconsistent error messages.
* Establish a consistent user-facing pattern.
* Avoid unnecessarily exposing technical implementation details.
* Preserve useful error information.
* Avoid changing API behavior unnecessarily.

Document the final scope in the GitHub Issue.

---

## Issue 4: Add Accessible Names to Icon-Only Controls

Suggested labels:

```text
good first issue
accessibility
extension
```

Requirements:

* Audit icon-only interactive elements.
* Ensure interactive controls have accessible names.
* Preserve existing functionality.
* Verify keyboard accessibility where relevant.

Use the actual implementation to identify affected components.

---

## Issue 5: Document the Extension Directory Structure

Suggested labels:

```text
good first issue
documentation
```

Update:

```text
extension/README.md
```

Explain the purpose of major directories and important files.

Keep the documentation accurate and concise.

---

## Issue 6: Refactor Application Initialization for Testability

Suggested labels:

```text
backend
refactor
testing
```

Requirements:

* Separate Express app creation from HTTP server startup.
* Preserve existing behavior.
* Allow the Express app to be imported into automated tests.
* Avoid duplicate middleware or route registration.
* Keep normal development and production startup working.

This issue should be completed before or alongside comprehensive API testing if required by the current architecture.

---

## Issue 7: Add Authentication API Tests

Suggested labels:

```text
testing
backend
help wanted
```

Requirements should be based on actual authentication routes.

Cover successful and unsuccessful authentication flows where appropriate.

Do not test implementation details unnecessarily.

---

## Issue 8: Add Bookmark API Test Coverage

Suggested labels:

```text
testing
backend
```

Cover actual bookmark CRUD behavior.

Include authorization and validation cases where relevant.

---

## Issue 9: Add Collection API Test Coverage

Suggested labels:

```text
testing
backend
```

Cover actual collection behavior.

Ensure user data isolation is tested where applicable.

---

## Issue 10: Add Test Coverage Reporting

Suggested labels:

```text
testing
ci
```

Do this after meaningful automated tests exist.

Requirements:

* Add coverage reporting if appropriate for the selected test framework.
* Establish a realistic initial baseline.
* Do not enforce an artificially high threshold immediately.
* Document how contributors can run coverage locally.

---

## Issue 11: Improve JWT Lifecycle and Token Handling

Suggested labels:

```text
security
authentication
backend
needs discussion
```

This should initially be treated as a discussion/design task.

Do not implement security-sensitive changes without understanding the current authentication architecture.

The issue should define:

* Current behavior.
* Identified limitations.
* Desired security properties.
* Proposed approaches.
* Compatibility considerations.

---

## Issue 12: Support Configurable Self-Hosted API URLs

Suggested labels:

```text
extension
enhancement
help wanted
```

Requirements:

* Investigate the current API URL configuration.
* Support self-hosting without requiring contributors to modify and rebuild source code unnecessarily.
* Review browser extension permission requirements carefully.
* Preserve the current default hosted API experience.
* Avoid unnecessarily broad host permissions.

The implementation should be discussed before modifying permissions.

---

## Issue 13: Design Bookmark Search and Filtering

Suggested labels:

```text
feature
extension
needs discussion
```

This should initially be a design issue.

Define:

* Search scope.
* Filtering behavior.
* Performance considerations.
* UI placement.
* API implications.
* Accessibility requirements.

Do not jump directly into implementation without defining expected behavior.

---

## Issue 14: Design Import and Export for Bookmark Libraries

Suggested labels:

```text
feature
backend
extension
needs discussion
```

Before implementation, define:

* Export format.
* Import validation.
* Duplicate handling.
* Error behavior.
* Security considerations.
* Large library handling.

---

## Issue 15: Add Keyboard Shortcuts

Suggested labels:

```text
accessibility
extension
enhancement
```

Investigate useful shortcuts based on the existing extension UI.

Potential areas include:

* Navigation.
* Focusing important controls.
* Creating bookmarks.
* Dialog interactions.

Do not introduce shortcuts that conflict with common browser behavior.

---

# 19. Recommended GitHub Label System

Keep the label system simple.

## Difficulty

```text
good first issue
help wanted
```

## Type

```text
bug
enhancement
documentation
testing
refactor
```

## Area

```text
extension
backend
landing
accessibility
authentication
ci
```

## Status

```text
needs discussion
in progress
blocked
```

Do not create an excessive number of labels.

---

# 20. Recommended Issue Workflow

The intended contributor workflow should be:

```text
Contributor discovers Curate
        ↓
Reads README
        ↓
Reads CONTRIBUTING.md
        ↓
Finds an appropriate issue
        ↓
Comments that they want to work on it
        ↓
Maintainer confirms/assigns the issue
        ↓
Contributor forks the repository
        ↓
Creates a focused branch
        ↓
Makes and tests changes
        ↓
Opens a Pull Request
        ↓
CI runs
        ↓
Maintainer reviews
        ↓
Changes requested or PR approved
        ↓
PR merged
```

Avoid assigning multiple contributors to the same issue unless collaboration is explicitly intended.

---

# 21. Recommended GitHub Discussions Structure

If GitHub Discussions is enabled, organize discussions around:

```text
Ideas
Q&A
Announcements
Development
```

Recommended flow:

```text
Question
    ↓
Discussion

New idea
    ↓
Discussion
    ↓
Decision
    ↓
GitHub Issue

Defined task
    ↓
GitHub Issue
    ↓
Pull Request
```

Use Issues primarily for actionable, defined work.

---

# 22. Validation Requirements

Before considering these improvements complete, verify:

## Application

```bash
npm install
npm start
```

works correctly.

Verify development mode:

```bash
npm run dev
```

works correctly.

## Testing

Verify:

```bash
npm test
```

runs meaningful automated tests.

Do not consider a syntax check alone sufficient.

## Extension

Verify:

```bash
npm run build:extension
```

completes successfully.

Verify the expected extension output exists.

## Documentation

Verify that:

* `README.md` remains accurate.
* `CONTRIBUTING.md` accurately describes the actual workflow.
* `extension/README.md` matches the actual directory structure.
* Testing instructions match the implemented test setup.

## CI

Verify that CI:

1. Installs dependencies.
2. Runs automated tests.
3. Builds the extension.
4. Fails when an important check fails.

---

# 23. Final Deliverables

After completing the work, provide a summary containing:

## Changed files

List every modified or added file.

## Architecture changes

Explain any refactoring performed to make the application testable.

## Testing

Explain:

* Which test runner was selected.
* What is currently covered.
* How tests isolate data.
* How to run tests locally.

## CI

Explain the checks performed on pull requests.

## Documentation

List documentation improvements.

## Recommended follow-up issues

List any remaining work that should become GitHub Issues.

---

# Important Constraints

* Do not rewrite the application unnecessarily.
* Preserve existing working behavior.
* Inspect existing files before modifying them.
* Do not replace existing documentation with generic templates.
* Do not add dependencies without a clear reason.
* Do not create fake tests.
* Do not claim test coverage that does not exist.
* Do not expose secrets or require secrets in pull-request CI unnecessarily.
* Do not broaden browser extension permissions without justification.
* Keep the contributor experience simple.
* Prefer small, focused changes over a large unnecessary refactor.

The final result should make Curate easier to test, easier to contribute to, and easier to maintain as an open-source project.
