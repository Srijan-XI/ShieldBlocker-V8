# ⚙️ Customizing ShieldBlocker-V8

This document provides instructions for customizing the ad-blocking behavior, visuals, and features of ShieldBlocker-V8.

---

## ✏️ 1. Modify Static Filter Rules

### `rules/blocklist.json`

Add or update rules using the [Declarative Net Request format](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/).

```json
{
  "id": 10,
  "priority": 1,
  "action": { "type": "block" },
  "condition": {
    "urlFilter": "ads.example.com",
    "resourceTypes": ["script", "image"]
  }
}
```

**Supported `resourceTypes`:** `script`, `image`, `stylesheet`, `font`, `xmlhttprequest`, `sub_frame`, `media`, `other`.

> Static rule IDs should stay below `1000` to avoid collisions with the generated blocklist (which starts at `1000`) and dynamic allow rules (which start at `9000`).

---

## 🎨 2. Customize CSS Ad-Hiding Selectors

### `content.js`

The `adSelectors` array controls which DOM elements are visually hidden on every page. Edit it to add or remove selectors:

```javascript
const adSelectors = [
  // Google / network ad slots
  'ins.adsbygoogle',
  '[data-ad-slot]',
  '[data-ad-unit]',
  '[data-google-query-id]',
  '[id^="div-gpt-ad"]',
  '[id^="google_ads"]',
  // Generic ad containers
  '[id^="ad-"]', '[id^="ad_"]', '#ad',
  '.ad-banner', '.ad-container', '.ad-wrapper',
  '.ad-block', '.ad-unit', '.ad-placement',
  '.advertisement', '.advertising',
  // Network-specific iframes
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="googlesyndication.com"]',
  'iframe[src*="adnxs.com"]',
  // Sponsored content widgets
  '[class*="sponsored-content"]',
  '[class*="sponsored_content"]',
  '[data-testid*="sponsored"]',
];
```

**Tips:**
- Avoid overly broad patterns like `[class*="banner"]` — they can hide legitimate site navigation.
- CSS is injected at `document_start` to prevent ad flash.
- A `MutationObserver` automatically re-injects the style if a page removes it (common in SPAs).
- CSS injection is skipped when global blocking is paused or the site is on the allowlist.

---

## 🌗 3. Customize the Popup UI

### `popup/popup.css`

The popup is `320px` wide with a card-based layout. Key properties to tweak:

| Selector / Property | What it controls |
|---|---|
| `body` `width` | Popup width (default `320px`) |
| `body` `background` | Light-mode gradient |
| `.btn` `background` | Primary button fill colour |
| `.badge` `background` | "ACTIVE" badge colour (green `#10b981`) |
| `.badge.off` `background` | "OFF" badge colour (red `#ef4444`) |
| `.badge.paused` `background` | "PAUSED" badge colour (amber `#f59e0b`) |
| `.list` `max-height` | Max height of the allowlist scroll area (default `130px`) |
| `@media (prefers-color-scheme: dark)` | Dark-mode overrides |

Dark mode is supported automatically via `prefers-color-scheme: dark`. Override colours in that block to match your palette.

---

## 🗄️ 4. Storage Keys

All state is persisted in `chrome.storage.local`. The canonical keys are:

| Key | Type | Default | Description |
|---|---|---|---|
| `globalEnabled` | `boolean` | `true` | Whether global blocking is active |
| `allowlist` | `string[]` | `[]` | Hostnames excluded from blocking |
| `hostnameRuleIds` | `object` | `{}` | Internal map of hostname → dynamic rule ID (do not edit manually) |

Read/write helpers are exposed by `storage.js`: `getAllowlist`, `getGlobalEnabled`, `setGlobalEnabled`, `toggleSite`, `isAllowed`.

---

## 📡 5. Background Message API

Send messages to the service worker via `chrome.runtime.sendMessage`. All handlers return `{ status: 'ok', ... }` or `{ status: 'error', error: string }`.

| `type` | Payload | Response extras | Description |
|---|---|---|---|
| `GET_STATE` | — | `allowlist`, `globalEnabled` | Fetch full current state |
| `TOGGLE_SITE` | `hostname: string` | `allowlist` | Add/remove a hostname from the allowlist and update dynamic rules |
| `TOGGLE_GLOBAL` | — | `globalEnabled` | Flip the global enabled flag |

Example:

```javascript
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (resp) => {
  console.log(resp.globalEnabled, resp.allowlist);
});
```

---

## 🔄 6. Dynamic Allow Rules

When a site is added to the allowlist, `background.js` creates a dynamic `declarativeNetRequest` allow rule with **priority 2** (higher than static block rules at priority 1):

```javascript
{
  id: <auto-assigned from 9000+>,
  priority: 2,
  action: { type: 'allow' },
  condition: {
    requestDomains: ['example.com'],
    resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'stylesheet', 'font', 'media', 'other'],
  },
}
```

The rule is removed automatically when the site is taken off the allowlist.
Rule IDs are stored in `hostnameRuleIds` and start at `9000` to avoid collisions with static and generated rules.

---

## 📦 7. Add or Enable Extra Rulesets

### `manifest.json` — `declarative_net_request.rule_resources`

Append entries to register additional rulesets:

```json
"declarative_net_request": {
  "rule_resources": [
    { "id": "ruleset_1",         "enabled": true,  "path": "rules/blocklist.json" },
    { "id": "generated_ruleset", "enabled": false, "path": "rules/generated_blocklist.json" }
  ]
}
```

Enable a ruleset at runtime:

```javascript
chrome.declarativeNetRequest.updateEnabledRulesets({
  enableRulesetIds: ['generated_ruleset'],
});
```

> **Rule ID ranges to keep separate:**
> - Static ruleset (`ruleset_1`): IDs **1–999**
> - Generated ruleset: IDs **1000–8999** (generator starts at 1000)
> - Dynamic allow rules: IDs **9000+**

---

## ⚡ 8. Generate a Larger Blocklist

### Node.js script

```powershell
npm run generate:rules
# or with a custom domain limit:
node scripts/generate-blocklist.js 800
```

Reads `dataset/Add_Block_data.csv`, fetches filter lists whose tag IDs overlap `{2, 3, 6}` (ads / tracking / malware), and writes MV3 rules to `rules/generated_blocklist.json`.

### High-Performance Go Generator

```powershell
go run ./go/cmd/generator --limit 800 --c 12
```

Outputs to `rules/generated_blocklist_go.json` by default.

| Flag | Description | Default |
|---|---|---|
| `--csv` | Path to dataset CSV | `dataset/Add_Block_data.csv` |
| `--limit` | Max domains/rules | `400` |
| `--c` | Concurrent fetch workers | `10` |
| `--timeout` | Per-request timeout | `12s` |
| `--out` | Output file path | `rules/generated_blocklist_go.json` |
| `--api` | Run as HTTP server instead of one-shot | `false` |

#### API server mode

```powershell
go run ./go/cmd/generator --api --limit 500
```

| Endpoint | Response |
|---|---|
| `GET /health` | `ok` |
| `GET /generate?limit=500` | JSON array of MV3 rules |

After generating, copy the output to `rules/generated_blocklist.json` (or the path declared in `manifest.json`) and enable the ruleset as shown in section 7.

---

## 🔐 9. Permissions Reference

Declared in `manifest.json`:

| Permission | Purpose |
|---|---|
| `storage` | Persist `globalEnabled`, `allowlist`, `hostnameRuleIds` |
| `declarativeNetRequest` | Enable/disable static rulesets; update dynamic rules |
| `declarativeNetRequestWithHostAccess` | Required for dynamic allow rules scoped to specific domains |
| `scripting` | Reserved for future programmatic CSS/script injection |
| `host_permissions: <all_urls>` | Apply rules and content scripts to every site |

> To add a blocked-request counter you would also need the `declarativeNetRequestFeedback` permission (see Roadmap in README).

---

## 🧩 10. Project File Map (Quick Reference)

| File | What to change |
|---|---|
| `rules/blocklist.json` | Network-level block rules |
| `content.js` → `adSelectors` | CSS selectors for visual ad hiding |
| `popup/popup.css` | Popup colours, sizing, dark mode |
| `popup/popup.html` | Popup markup / layout |
| `popup/popup.js` | Popup interaction logic |
| `background.js` | Message handling, dynamic rule management |
| `storage.js` | Storage key names and helpers |
| `manifest.json` | Permissions, rulesets, icons |
| `scripts/generate-blocklist.js` | Node.js rule generator |
| `go/cmd/generator/main.go` | Go rule generator entry point |
