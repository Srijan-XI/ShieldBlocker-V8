# 🛡️ ShieldBlocker-V8

**ShieldBlocker-V8** is a lightweight, cross-browser (Chrome and Firefox) ad blocker powered by WebExtension APIs. It blocks intrusive ads using static filter rules and allows per-site control directly from the popup interface.

> Built as an intermediate-level extension — more powerful than beginner demos, yet lighter than full-featured solutions like uBlock Origin.

**Current version:** `1.8.0`

---

## 🚀 Features

- ✅ Block ads using static filter lists (via `declarativeNetRequest`)
- ✅ 15 targeted rules covering Google Syndication, DoubleClick, AppNexus, Amazon Ads, Taboola, Outbrain, and more
- ✅ Inject CSS to hide visual ads from the DOM at `document_start` (no ad flash)
- ✅ `MutationObserver` style guard prevents SPAs from stripping injected CSS
- ✅ Lightweight popup UI to enable/disable per-site blocking
- ✅ Global pause/resume for all blocking
- ✅ Persistent allowlist with in-popup management and removal buttons
- ✅ Dynamic `declarativeNetRequest` allow rules (priority 2) sync when allowlist changes
- ✅ Error banner in popup when service worker is unavailable
- ✅ `chrome://` / `edge://` page guard — site toggle disabled on restricted pages
- ✅ Cross-browser support (Chrome & Firefox)
- ✅ Accessible, responsive popup with dark mode support
- ✅ 23 Jest unit tests covering `storage.js` and `utils/matcher.js`
- ✅ ESLint v9 flat config with separate rule sets for extension, scripts, and test files

---

## 🧪 Current UX (Popup)

| Element | Purpose |
|---------|---------|
| Global badge | Shows `ACTIVE`, `OFF`, or `PAUSED` state of the blocking engine |
| "Pause Global" button | Temporarily suspends all blocking without altering the allowlist |
| Site status text | Indicates ON/OFF blocking state for the current hostname |
| "Disable/Enable Blocking Here" | Toggles current site in the allowlist |
| Allowed Sites list | Scrollable list of hostnames with per-item remove buttons |
| Error banner | Visible alert when the background service worker is unavailable |
| Tips section | Provides quick usage guidance |

---

## 💡 Usage

1. Open any website.
2. Click the extension icon to open the popup.
3. Use "Disable Blocking Here" to add the current site to the allowlist (ads will show again).
4. Use "Enable Blocking Here" to remove it from the allowlist.
5. Use "Pause Global" to stop blocking everywhere temporarily.
6. Remove any site from the allowlist via its "Remove" button.

Blocking CSS is injected only when Global Blocking is active AND the site is not allowlisted.

---

## 🔄 Roadmap Ideas

- Blocked request counter (requires `declarativeNetRequestFeedback` permission)
- Import/export allowlist
- Sync storage option
- Remote rule list update with signature verification
- Rule tester UI for pattern debugging

---

## ♿ Accessibility Notes

- All dynamic status elements use `aria-live="polite"` for screen reader announcements.
- Buttons expose their pressed state via `aria-pressed`.
- Color contrast follows WCAG AA in both light and dark modes.

---

## 🛠 Development

Load the extension unpacked:

**Chrome:**
1. `chrome://extensions` → Enable Developer Mode.
2. Click "Load unpacked" and select the project folder.

**Firefox (temporary add-on):**
1. `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on" and select `manifest.json`.

### Available npm Scripts

Requires Node.js ≥ 18.

```powershell
npm test               # Run all 23 Jest unit tests
npm run test:coverage  # Run tests with coverage report
npm run lint           # Lint with ESLint v9 flat config
npm run lint:fix       # Auto-fix linting issues
npm run generate:rules # Generate blocklist from dataset (400 rules)
```

---

## 🧩 Tech Notes

- Global state key: `globalEnabled` (boolean, defaults to `true`).
- Allowlist key: `allowlist` (array of hostnames).
- Rule ID map key: `hostnameRuleIds` (object, maps hostname → persistent dynamic rule ID starting at 9000).
- Popup obtains consolidated state via background message `GET_STATE`.
- Content script runs at `document_start` and checks both `globalEnabled` and the allowlist before injecting CSS.
- Dynamic allow rules use `requestDomains` with priority `2` to override static block rules (priority `1`).
- `refreshDomainRules` is called on every `TOGGLE_SITE` message to keep network-level rules in sync with the allowlist.
- Generated rulesets are managed dynamically at runtime; there is no always-disabled static entry in `manifest.json`.
- `utils/matcher.js` caches compiled `RegExp` objects in a `Map`; call `matcher.clearCache()` to reset between tests.

---

## 🧪 Dataset-Driven Rule Generation

The `dataset/` folder contains source metadata for many public filter/host lists:

- `Add_Block_data.csv`: CSV with columns including `tagIds`, `primaryViewUrl` referencing raw list URLs.
- `response.json`: Expanded JSON version of the same dataset.

### Script
Run the generation script to create a simplified blocklist from selected remote lists:

```powershell
npm run generate:rules
# or with a custom limit:
node scripts/generate-blocklist.js 800
```

Rules are emitted in `||domain^` `urlFilter` format. A 4-worker concurrency pool with exponential-backoff retries is used for resilient fetching.

### High-Performance Go Generator (Concurrent)

For faster large-list aggregation use the Go tool (concurrent fetching, streaming CSV parsing):

```powershell
go run ./go/cmd/generator --limit 800 --c 12
```

Outputs to `rules/generated_blocklist_go.json` by default. Adjust flags:

| Flag | Description | Default |
|------|-------------|---------|
| `--csv` | Path to dataset CSV | `dataset/Add_Block_data.csv` |
| `--limit` | Max domains/rules | 400 |
| `--c` | Concurrent fetch workers | 10 |
| `--timeout` | Per-request timeout | 12s |
| `--out` | Output file path | rules/generated_blocklist_go.json |
| `--api` | Run HTTP server instead of one-shot | false |

Start API server (dynamic on-demand rule generation):

```powershell
go run ./go/cmd/generator --api --limit 500
```

Endpoints:
- `GET /health` → `ok`
- `GET /generate?limit=500` → JSON array of MV3 rules

To enable the generated ruleset at runtime:

```javascript
chrome.declarativeNetRequest.updateEnabledRulesets({
  enableRulesetIds: ['generated_ruleset'],
});
```

Performance characteristics:
- Streaming CSV parsing avoids loading the entire dataset into memory.
- 4-worker concurrency pool with exponential-backoff retries prevents network saturation.
- Domain extraction handles hosts-file, ABP, cosmetic filter, and generic patterns.
- Deduplication occurs before rule object creation.

### Caveats
- Remote fetches rely on public HTTPS; failures are silently skipped.
- Rule IDs start at 1000 for generated set; avoid collisions if adding more.
- Not all extracted domains guarantee ad relevance; post-filter manually for precision.
- Respect original list licenses before distributing combined output.

---

## 🔐 Privacy

Only the hostnames you add to the allowlist are stored locally. No telemetry is sent.

---

## 📁 Project Structure

```plaintext
ShieldBlocker-V8/
│
├── manifest.json                  # Manifest V3 (Chrome + Firefox support)
├── background.js                  # Service worker: blocking rules, message handlers
├── content.js                     # Injects ad-hiding CSS at document_start
├── storage.js                     # chrome.storage helpers (getAllowlist, toggleSite, etc.)
├── eslint.config.js               # ESLint v9 flat config
├── package.json                   # npm scripts: test, lint, generate:rules
├── utils/
│   └── matcher.js                 # Wildcard URL matcher with RegExp cache
├── rules/
│   ├── blocklist.json             # 15 static MV3 block rules
│   ├── allowlist.json             # Starter allowlist
│   └── generated_blocklist.json   # Output of rule generators (optional)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── tests/
│   ├── storage.test.js            # Jest tests for storage.js
│   └── matcher.test.js            # Jest tests for utils/matcher.js
├── scripts/
│   └── generate-blocklist.js      # Node.js MV3 rule generator
├── dataset/
│   ├── Add_Block_data.csv         # Filter list metadata (tagIds, URLs)
│   └── response.json              # Expanded JSON version of the dataset
├── go/
│   ├── go.mod
│   ├── cmd/generator/main.go      # Go CLI / API server entry point
│   └── internal/
│       ├── extract/domains.go     # Domain extraction logic
│       └── fetch/worker.go        # Concurrent fetch worker pool
└── demo/
    ├── index.html                 # Standalone demo page
    ├── app.js
    └── style.css