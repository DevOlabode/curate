For your current Curate web app, I’d give Cursor a **single comprehensive engineering task**, but explicitly tell it to preserve existing functionality and avoid inventing features.

# Engineering Task — Convert Bookmark Vault Web App to Browser Extension

## Objective

Convert the existing Bookmark Vault web application into a **production-ready Manifest V3 browser extension**, while preserving the existing functionality, design, and backend integration wherever technically appropriate.

The extension should initially target:

* Google Chrome
* Microsoft Edge

The extension must remain **free and open source**.

Do **not** introduce unrelated features or redesign the product unless required for extension compatibility.

---

## Phase 1 — Analyze the Existing Application

Before making code changes:

1. Inspect the entire repository.
2. Identify:

   * Frontend framework and build system
   * Existing routes/pages
   * Authentication flow
   * API calls
   * State management
   * Storage mechanisms
   * Environment variables
   * Backend dependencies
   * Existing deployment assumptions
   * Components that can be reused directly
   * Components that require modification for extension compatibility
3. Determine which existing functionality belongs in:

   * Extension popup
   * Extension options/settings page
   * Background service worker
   * Content scripts
   * Existing backend/API
4. Identify any functionality that depends on browser APIs or normal webpage behavior.
5. Identify anything that will conflict with Manifest V3.
6. Identify authentication and cross-origin requirements.
7. Identify all required extension permissions and minimize them.

**Do not modify the repository during this analysis phase.**

Produce an implementation plan before proceeding.

---

# Phase 2 — Extension Architecture

Implement a proper Manifest V3 architecture.

The resulting structure should conceptually resemble:

```text
Bookmark Vault
├── extension/
│   ├── manifest.json
│   ├── background/
│   │   └── service-worker.*
│   ├── popup/
│   ├── options/
│   ├── content/
│   ├── assets/
│   └── ...
├── src/
│   └── shared application code
├── public/
└── ...
```

The exact structure may differ based on the existing project architecture.

Do not unnecessarily duplicate existing application code.

Prefer reusable shared components and utilities.

---

# Phase 3 — Manifest V3

Create a valid production Manifest V3 configuration.

Requirements:

* Use Manifest V3.
* Define only permissions that are actually required.
* Avoid broad permissions when a narrower permission works.
* Configure the extension name and description appropriately.
* Configure extension icons.
* Configure the popup.
* Configure the service worker if required.
* Configure content scripts only if required.
* Configure externally accessible resources only if required.
* Configure host permissions only for domains that are genuinely necessary.
* Ensure the manifest passes Chrome extension validation.

Do not request permissions simply because they might be useful later.

---

# Phase 4 — Convert the Existing UI

Adapt the existing Bookmark Vault interface for extension usage.

Preserve the existing:

* Visual identity
* Components
* Colors
* Typography
* UX patterns
* Bookmark functionality
* Existing terminology

However, adapt layouts where necessary for the smaller extension viewport.

The popup must:

* Load reliably.
* Render quickly.
* Not depend on the normal website being open.
* Handle loading states.
* Handle errors gracefully.
* Work after the browser has restarted.

If functionality is unsuitable for a popup, determine whether it belongs in an options page or another extension context.

Do not add unrelated features.

---

# Phase 5 — Authentication

Audit the existing authentication system carefully.

The extension must be able to:

* Authenticate the user.
* Maintain authentication state.
* Make authenticated API requests.
* Log out.
* Recover gracefully from expired/invalid authentication.

Do not expose secrets in the extension bundle.

**Never place backend secrets, API secrets, client secrets, database credentials, or private environment variables inside the extension.**

Remember that anything shipped inside a browser extension should be treated as publicly inspectable.

If the current web authentication flow cannot safely be reused inside an extension, redesign only the authentication portion necessary to make it work correctly.

Document the authentication flow.

---

# Phase 6 — API Integration

Ensure the extension can communicate with the existing Bookmark Vault backend.

Audit:

* API base URL configuration
* CORS
* Authentication headers/cookies
* Error handling
* Network failures
* Request timeouts
* Production vs development environments

The extension must not depend on localhost in the production build.

Development and production configuration should be clearly separated.

Do not modify the backend unnecessarily.

If backend changes are required, document exactly why they are required before making them.

---

# Phase 7 — Extension Storage

Determine whether existing application storage should remain as-is or be migrated to browser extension storage.

Evaluate:

* `chrome.storage`
* `browser.storage`
* Local storage
* Existing application state
* Authentication persistence

Use the appropriate browser storage API when extension-specific persistent storage is required.

Do not store sensitive information unnecessarily.

---

# Phase 8 — Background Service Worker

Create a background service worker only where it provides actual value.

Potential responsibilities may include:

* Background API coordination
* Extension events
* Context menu integration if already supported/required
* Authentication coordination
* Browser events

Do not create unnecessary background functionality.

Ensure the implementation respects Manifest V3 service-worker lifecycle behavior.

Do not assume the service worker remains alive indefinitely.

---

# Phase 9 — Browser Compatibility

The extension must work on:

### Google Chrome

Test the unpacked extension using Chrome's extension developer tools.

### Microsoft Edge

Test the same production build using Edge's extension developer tools.

Avoid Chrome-specific APIs where a cross-browser-compatible implementation is practical.

If browser-specific differences are necessary, isolate them behind a small compatibility layer.

Do not create two separate implementations unless absolutely necessary.

---

# Phase 10 — Build System

Create a reliable production build process.

The build must:

* Produce a clean extension directory.
* Include all required assets.
* Include `manifest.json`.
* Include compiled JavaScript/CSS.
* Exclude development files.
* Exclude `.env` files.
* Exclude secrets.
* Exclude source maps if they expose sensitive information.
* Be reproducible.

Add appropriate scripts such as:

```text
npm run dev
npm run build
npm run build:extension
```

Use the project's existing conventions where possible.

Do not unnecessarily replace the existing build system.

---

# Phase 11 — Security Audit

Perform a security review specifically for a browser extension.

Check:

* Manifest permissions
* Host permissions
* Content Security Policy
* XSS risks
* DOM injection
* `innerHTML`
* Dynamic script execution
* `eval`
* Remote code execution
* Token handling
* API credentials
* Environment variables
* Authentication persistence
* Cross-origin requests
* Content scripts
* Message passing
* Service-worker communication

The extension must not use:

```text
eval()
new Function()
remote JavaScript execution
```

unless there is an unavoidable, documented reason.

Do not expose secrets through the extension bundle.

---

# Phase 12 — Privacy and Store Readiness

Prepare the project for Chrome Web Store and Microsoft Edge Add-ons submission.

Audit:

* Extension description
* Permissions justification
* Privacy implications
* Data collection
* Data transmission
* External services
* Authentication
* Third-party dependencies
* Icons
* Screenshots
* Store metadata requirements

Do not claim that the extension collects no data unless that is actually true.

Document what user data is processed and why.

---

# Phase 13 — Testing

Create or update tests where appropriate.

At minimum, manually verify:

### Installation

* [ ] Extension installs successfully.
* [ ] Extension loads without errors.
* [ ] Popup opens.
* [ ] No console errors appear.

### Authentication

* [ ] Login works.
* [ ] Authentication persists appropriately.
* [ ] Logout works.
* [ ] Invalid authentication is handled.
* [ ] Expired authentication is handled.

### Bookmark functionality

* [ ] Existing bookmarks load.
* [ ] Bookmark creation works.
* [ ] Bookmark editing works.
* [ ] Bookmark deletion works.
* [ ] Bookmark search/filtering works.
* [ ] Existing functionality has not regressed.

### Browser behavior

* [ ] Works after browser restart.
* [ ] Works after extension reload.
* [ ] Works with multiple tabs.
* [ ] Handles network failures.
* [ ] Handles API failures.
* [ ] Handles slow API responses.

### Browsers

* [ ] Chrome tested.
* [ ] Edge tested.

---

# Phase 14 — Production Audit

After implementation, perform a final audit as if you were preparing the extension for public release.

Check:

1. Manifest validity.
2. Permissions.
3. Security.
4. Authentication.
5. API communication.
6. Storage.
7. Service worker behavior.
8. Production build.
9. Chrome compatibility.
10. Edge compatibility.
11. Error handling.
12. Performance.
13. Privacy.
14. Store requirements.
15. Open-source repository cleanliness.

Fix issues discovered during the audit.

Do not add new product features during this phase.

---

# Important Constraints

Follow these constraints throughout the implementation:

### 1. Do not rewrite the application unnecessarily.

Reuse existing code wherever technically sound.

### 2. Do not add features.

This task is a **platform conversion and production hardening task**, not a feature-development task.

### 3. Do not break the existing web application.

The current web application should continue working unless a change is absolutely necessary.

### 4. Do not expose secrets.

Assume the extension package will be completely inspected by users.

### 5. Minimize permissions.

Request the smallest possible set of browser permissions.

### 6. Do not fake compatibility.

If something works in Chrome but not Edge, identify and resolve the actual compatibility issue rather than hiding it.

### 7. Do not mark the task complete merely because it builds.

A successful build does not mean the extension is production-ready.

---

# Definition of Done

The task is complete only when:

* [ ] Bookmark Vault can be built as a Manifest V3 extension.
* [ ] The extension installs successfully in Chrome.
* [ ] The extension installs successfully in Edge.
* [ ] Existing core functionality works.
* [ ] Authentication works correctly.
* [ ] API communication works correctly.
* [ ] No secrets are included in the extension.
* [ ] Permissions are minimized.
* [ ] Production build is reproducible.
* [ ] Security audit has been completed.
* [ ] Chrome compatibility has been tested.
* [ ] Edge compatibility has been tested.
* [ ] Existing web application still works.
* [ ] No unnecessary features were added.
* [ ] No known blocking issues remain.
* [ ] The extension is technically ready for store submission.

## Final Deliverables

At the end of the task, provide:

1. Summary of architectural changes.
2. Files added/modified.
3. New dependencies.
4. Required permissions and why each is required.
5. Authentication architecture.
6. API changes, if any.
7. Build instructions.
8. Chrome testing instructions.
9. Edge testing instructions.
10. Known limitations.
11. Store-submission requirements still requiring manual action.
12. Final security findings.
13. Final test results.

**Do not claim the extension is production-ready unless all Definition of Done requirements have actually been verified.**
