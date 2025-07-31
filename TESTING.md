# 🧪 Testing ShieldBlocker-V8

Follow the instructions below to verify that the extension is working correctly.

---

## ✅ Step 1: Visit an Ad-Heavy Site

Try loading any of the following websites:

- https://timesofindia.indiatimes.com
- https://cricbuzz.com
- https://weather.com
- Any blog or news site with banner or sidebar ads

---

## ✅ Step 2: Open Dev Tools to Monitor Network Requests

1. Press `F12` or right-click → **Inspect**

2. Go to the **Network** tab

3. Reload the page

4. You should observe:
   - Fewer requests to known ad domains (e.g., `doubleclick.net`, `googlesyndication`)
   - Blocked requests shown in **red** (Chrome)

---

## ✅ Step 3: Visual Ads Hidden

1. Observe the layout of the page

2. Ads should either not load or be visually hidden (via injected CSS)

---

## ✅ Step 4: Use Popup UI

1. Click the ShieldBlocker-V8 icon in the toolbar

2. Use the toggle switch to enable/disable blocking on the current site

3. Refresh the page to confirm the toggle works

---

## ✅ Step 5: Verify Block Count

The popup displays a running count of blocked resources for each site.
