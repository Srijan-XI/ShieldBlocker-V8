# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres (aspirationally) to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Blocked request counter in popup
- Import/export allowlist
- Remote signed rule updates
- Sync storage option (`chrome.storage.sync`)

## [1.8.0] - 2026-02-24
### Added
- **Unit tests** — 23 passing Jest tests covering `storage.js` and `utils/matcher.js` (`npm test`).
- **ESLint config** (`eslint.config.js`) — flat ESLint v9 config with separate rule sets for browser extension files, Node.js build scripts, and test files (`npm run lint`).
- **Regex cache in `matcher.js`** — compiled `RegExp` objects are now cached in a `Map` keyed by pattern string; `clearCache()` helper exposed for tests.
- **Error banner in popup** — visible error message when the background service worker is unavailable, replacing a silent "Loading…" freeze.
- **`chrome://` / `edge://` page guard** — site toggle is disabled on pages where content scripts cannot run.
- **Expanded blocklist** — `rules/blocklist.json` grows from 1 rule to 15 targeted `||domain^` rules covering Google Syndication, DoubleClick, AppNexus (adnxs), Amazon Ads, Taboola, Outbrain, Media.net, PubMatic, OpenX, Rubicon, ScoreCard Research, and Google Analytics.
- **Dependency tracking** (`hostnameRuleIds` in local storage) — stable numeric rule IDs per hostname, persisted across sessions.

### Changed
- **Version bumped** — `manifest.json` and `package.json` now reflect `1.8.0`.
- **`content.js` runs at `document_start`** — prevents ad flash by injecting the style block before page HTML is parsed.
- **Targeted CSS selectors** — replaced 6 over-broad patterns (e.g. `[class*="banner"]`) with 20 precise selectors scoped to known ad network patterns, eliminating false positives on legitimate site content.
- **`MutationObserver` style guard** — re-injects the ad-hiding `<style>` if a page removes it (common in SPAs).
- **`background.js` fully async** — all `chrome.storage` callbacks replaced with a `store` promise wrapper; all message handlers are now `async` IIFEs.
- **`refreshDomainRules` actually called** — the function is now invoked from `TOGGLE_SITE`, making network-level per-site allowlisting functional.
- **`declarativeNetRequest` allow rules** use `requestDomains` (correct MV3 field) and priority `2` to override static block rules.
- **Popup state management** — single shared mutable `state` object replaces individual per-handler closures, fixing stale `allowlist` reads in the global toggle handler.
- **Messaging helpers** — `sendMsg()` wrapper checks `chrome.runtime.lastError` and rejects on background errors.
- **`generate-blocklist.js`** — concurrency pool (4 parallel requests), exponential-backoff retries, and `||domain^` urlFilter format replacing bare substring matches.
- **Node engine** requirement raised from `>=16` to `>=18`.

### Fixed
- Rule ID collision bug: `5000 + hostname.length` collided for hostnames of equal length; replaced with persisted per-hostname ID map.
- `refreshDomainRules` was defined but never called — network-level allowlisting was silently broken.
- Stale closure in `globalToggle.onclick` read the original `allowlist` snapshot even after `siteToggle` had changed it.
- No `chrome.runtime.lastError` checks — storage failures were silently swallowed.
- Popup showed no error when service worker was inactive.
- `declarativeNetRequest` `allow` rule used non-existent `domains` field instead of `requestDomains`.
- `generate-blocklist.js` rules used bare domain strings as `urlFilter` instead of `||domain^`, matching unrelated URLs.
- Duplicate old function definitions left at the bottom of `generate-blocklist.js` after refactor.

### Removed
- `generated_ruleset` static manifest entry (always-disabled; now managed dynamically when generated rules are ready).
- Broad `urlFilter: "ads"` rule that matched unrelated legitimate URLs.

## [1.0.1] - 2025-11-17
### Added
- Global pause/resume blocking functionality (`globalEnabled` state).
- Accessible, semantic popup layout with panels, badges, and tips section.
- Allowlist management UI (scrollable list with remove buttons).
- Dark mode styling via `prefers-color-scheme`.
- README expanded with UX, accessibility, privacy, and roadmap sections.
- Conditional content script logic (respects global pause + per-site allowlist).

### Changed
- Popup no longer reloads on toggling site; state updates dynamically.
- Consistent badge component displaying active/off status.
- Refactored storage to include global state helpers.
- Background script now supports `GET_STATE`, `TOGGLE_GLOBAL` messages.

### Fixed
- Eliminated legacy code fragment causing syntax errors in popup script.
- Prevent ad-hiding CSS injection when site is allowlisted or global blocking paused.

### Security / Privacy
- Explicit privacy section: only hostnames stored locally, no telemetry.

## [1.0.0] - 2025-11-17
### Added
- Initial release of ShieldBlocker-V8.
- Basic per-site allowlist toggle.
- CSS-based ad hiding selectors.
- Static blocking rule (`ruleset_1`) using `declarativeNetRequest`.
- Minimal popup with site toggle.

---

### Versioning Guidelines
- PATCH: UI refinements, non-breaking performance tweaks, documentation updates.
- MINOR: New user-facing features (e.g., request counter, sync, import/export).
- MAJOR: Architectural changes or permission scope expansion.

### Upgrade Notes
- When adding dynamic rules or feedback APIs, ensure permissions updates are reflected in `manifest.json` and documented above.

