# ⚙️ Customizing ShieldBlocker-V8

This document provides instructions for customizing the ad-blocking behavior, visuals, and features of ShieldBlocker-V8.

---

## ✏️ Modify Static Filter Rules

### `rules/blocklist.json`

- Open the file and add or update rules using the [Declarative Net Request format](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/).
- Example rule:

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
