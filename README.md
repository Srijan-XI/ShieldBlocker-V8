# 🛡️ ShieldBlocker-V8

**ShieldBlocker-V8** is a lightweight, cross-browser (Chrome and Firefox) ad blocker powered by WebExtension APIs. It blocks intrusive ads using static filter rules and allows per-site control directly from the popup interface.

> Built as an intermediate-level extension — more powerful than beginner demos, yet lighter than full-featured solutions like uBlock Origin.

---

## 🚀 Features

- ✅ Block ads using static filter lists (via `declarativeNetRequest`)
- ✅ Inject CSS to hide visual ads from the DOM
- ✅ Lightweight popup UI to enable/disable per-site blocking
- ✅ Global pause/resume for all blocking
- ✅ Persistent allowlist with in-popup management and removal buttons
- ✅ Cross-browser support (Chrome & Firefox)
 - ✅ Accessible, responsive popup with dark mode support

---

## 🧪 Current UX (Popup)

| Element | Purpose |
|---------|--------|
| Global badge | Shows whether blocking engine is active or globally paused |
| "Pause Global" button | Temporarily suspends all blocking without altering allowlist |
| Site status text | Indicates ON/OFF state for the current hostname |
| "Disable/Enable Blocking Here" | Toggles current site in allowlist |
| Allowed Sites list | Scrollable list of hostnames with per-item remove buttons |
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

Chrome:
1. `chrome://extensions` → Enable Developer Mode.
2. Click "Load unpacked" and select the project folder.

Firefox (using temporary add-on):
1. `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on" and select `manifest.json`.

---

## 🧩 Tech Notes

- Global state key: `globalEnabled` (boolean, defaults to `true`).
- Allowlist key: `allowlist` (array of hostnames).
- Popup obtains consolidated state via background message `GET_STATE`.
- Content script checks both `globalEnabled` and allowlist before injecting CSS.

---

## 🔐 Privacy

Only the hostnames you add to the allowlist are stored locally. No telemetry is sent.

---

---

## 📁 Project Structure

```plaintext
ShieldBlocker-V8/
│
├── manifest.json                  # Manifest V3 (Chrome + Firefox support)
├── background.js                  # Handles blocking rules and events
├── content.js                     # Injects CSS for visual ad hiding
├── storage.js                     # Wrapper for chrome.storage / browser.storage
├── utils/
│   └── matcher.js                 # URL pattern matcher logic
├── rules/
│   ├── blocklist.json            # List of blocking rules (JSON array)
│   └── allowlist.json            # List of allowed domains
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
    ├── popup.html
    ├── popup.js
    └── popup.css