# 📦 Installation Guide for ShieldBlocker-V8

This document explains how to install the ShieldBlocker-V8 browser extension for both Chrome and Firefox.

---

## 🔧 Chrome (Chromium-based browsers)

1. Download or clone the repository:

 ```
 git clone https://github.com/Srijan-XI/ShieldBlocker-V8.git
 ```
 
2. Go to: `chrome://extensions`

3. Enable **Developer Mode** (toggle on top-right)

4. Click **Load Unpacked**

5. Select the folder where `manifest.json` is located (`ShieldBlocker-V8/`)

6. You should now see the ShieldBlocker-V8 icon in your Chrome toolbar

---

## 🔧 Firefox

1. Open Firefox and go to:` about:debugging#/runtime/this-firefox` 

2. Click **Load Temporary Add-on**

3. Browse to the `ShieldBlocker-V8/` directory and select `manifest.json`

4. The extension will be temporarily loaded and functional

📝 _Note: You will need to reload it each time Firefox restarts unless it is signed and published on AMO._
