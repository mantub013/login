# Chrome Extension: Ration Portal RC Assistant

This folder contains the complete, self-contained Google Chrome extension.

---

## 📁 Folder Contents
- `manifest.json`: Manifest V3 configuration with frame & host permissions.
- `content.js`: Portal scanner, username validator, input unlocker, and postback observer.
- `popup.html`: Minimalist user popup (zero settings).
- `popup.css`: Lightweight stylesheet.
- `popup.js`: Controller with quota management, local caching, and remote admin sync.
- `icons/`: Extension icons (16px, 48px, 128px).

---

## 📦 How to Load in Google Chrome
1. Open Google Chrome.
2. In the address bar, go to: `chrome://extensions/`
3. Toggle **Developer mode** **ON** (top-right corner).
4. Click **Load unpacked** (top-left).
5. Select this exact folder:
   ```
   C:\Users\MAHANTESH\Downloads\pass\extension
   ```
6. The extension is now loaded and ready! Click the puzzle icon 🧩 in Chrome and pin the extension to your toolbar.
