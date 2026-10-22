# Ration Card Helper Chrome Extension

A lightweight, secure Google Chrome extension designed for the Ration Bio-Auth portal.

---

## 🚀 Key Features

1. **Security & Authentication Check**:
   - Strictly verifies `<input id="ctl00_ContentPlaceHolder1_hidusername" value="9731147181">`.
   - If the username does **not** match `9731147181` (or the configured authorized ID), the extension deactivates and will not alter anything.

2. **Verify Button Detection**:
   - Detects `<input id="ctl00_ContentPlaceHolder1_btn_verify" ...>` on the page.

3. **Field Unlock & RC Update**:
   - Converts `<input id="ctl00_ContentPlaceHolder1_txt_rc_no" ... disabled="disabled">` to an editable field (`enable="enable"` and `disabled=false`).
   - Replaces the default RC number with the new RC number specified by the user.

4. **Monthly Admin Control**:
   - Admin can enable/disable access per month with a single click ("Authorize This Month").
   - When a new month starts, the tool automatically expires until approved by the admin.

5. **Quota / Usage Limit Control**:
   - Admin sets the maximum number of times the user can change the RC number (e.g., 50 times).
   - Shows remaining usage counter in real time.
   - Admin can reset the counter back to 0 at any time.

6. **Ultra-Minimal User Interface**:
   - Simple 1-box popup with status badge and one-click action.
   - Admin controls are hidden behind a secure PIN (`1234` by default).

---

## 📦 How to Install in Google Chrome

1. Open Google Chrome.
2. In the address bar, type `chrome://extensions/` and press **Enter**.
3. In the top-right corner, turn **ON** **Developer mode**.
4. In the top-left corner, click **Load unpacked**.
5. Select the folder:
   ```
   C:\Users\MAHANTESH\Downloads\pass
   ```
6. The extension **Ration Portal RC Assistant** is now installed!
7. Pin the extension to your Chrome toolbar for quick access (click the puzzle icon 🧩 in Chrome, then click the pin 📌 next to the extension).

---

## 🛠️ How to Use

### For the Operator / User:
1. Open the portal page (or test page).
2. Click the extension icon in the toolbar.
3. Enter the new Ration Card number (or leave the existing one).
4. Click **⚡ Enable & Update RC**.
5. The input field on the page is instantly enabled and updated!

### For the Admin (Management & Restrictions):
1. Open the extension popup and click the gear icon (**⚙️**) in the top right.
2. Enter the Admin PIN (Default: `1234`).
3. Inside the Admin Panel, you can:
   - **Master Switch**: Toggle the extension ON or OFF.
   - **Monthly Authorization**: Click **Authorize This Month** (sets active month, e.g. `2026-10`).
   - **Authorized Username**: Change or confirm the portal ID (`9731147181`).
   - **Max Changes Allowed**: Set how many times the user can change the RC number (e.g. 50, 100, etc.).
   - **Reset Counter**: Reset the usage counter back to `0`.
   - **Change PIN**: Set a new secret PIN for admin access.
4. Click **Save Admin Settings**.

---

## 🧪 Testing Locally

To test right away without opening the live portal:
- Double-click or open `test_page.html` in Chrome.
- It contains the exact HTML structure and diagnostic inspector so you can watch the field unlock and update in real-time!
