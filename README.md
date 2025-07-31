# 🛡️ ShieldBlocker-V8

**ShieldBlocker-V8** is a lightweight, cross-browser (Chrome and Firefox) ad blocker powered by WebExtension APIs. It blocks intrusive ads using static filter rules and allows per-site control directly from the popup interface.

> Built as an intermediate-level extension — more powerful than beginner demos, yet lighter than full-featured solutions like uBlock Origin.

---

## 🚀 Features

- ✅ Block ads using static filter lists (via `declarativeNetRequest`)
- ✅ Inject CSS to hide visual ads from the DOM
- ✅ Lightweight popup UI to enable/disable per-site blocking
- ✅ Blocked request count tracker
- ✅ Persistent allowlist with `chrome.storage` or `browser.storage`
- ✅ Cross-browser support (Chrome & Firefox)

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