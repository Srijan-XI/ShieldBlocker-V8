# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres (aspirationally) to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- (placeholder) Blocked request counter
- (placeholder) Import/export allowlist
- (placeholder) Remote signed rule updates
- (placeholder) Sync storage option

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

