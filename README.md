# Ration Portal RC Assistant & Admin Dashboard

A lightweight, secure Google Chrome extension and companion Admin Dashboard for the Ration Bio-Auth portal.

---

## 📂 Repository Structure

- 📁 **`extension/`** — **The Chrome Extension** (Load unpacked from here in Chrome!)
  - `manifest.json` — Chrome Manifest V3 configuration.
  - `content.js` — Portal DOM verification & field modification.
  - `popup.html` — Minimalist popup for user (zero settings).
  - `popup.css` — Clean styling.
  - `popup.js` — User logic & automatic remote admin sync.
  - `icons/` — Extension icons.
  - `README.md` — Extension loading instructions.

- 🌐 **Live Web Pages (Hosted on GitHub Pages)**:
  - `admin.html` — Live Admin Management Dashboard.
  - `index.html` / `test_page.html` — Live test portal simulation.
  - `config.json` — Remote administrative configuration.

---

## 🌐 Live URLs

- ⚙️ **Admin Dashboard:** [https://mantub013.github.io/login/admin.html](https://mantub013.github.io/login/admin.html) *(Default PIN: `1234`)*
- 🧪 **Live Test Portal:** [https://mantub013.github.io/login/](https://mantub013.github.io/login/)
- 📄 **Remote Config:** [https://mantub013.github.io/login/config.json](https://mantub013.github.io/login/config.json)

---

## 📦 How to Install the Extension in Chrome

1. Open Google Chrome and go to `chrome://extensions/`
2. Turn **ON** **Developer mode** (top-right).
3. Click **Load unpacked** (top-left).
4. Select the folder:
   ```
   C:\Users\MAHANTESH\Downloads\pass\extension
   ```
5. Pin the extension to your toolbar.
