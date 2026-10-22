// popup.js - Ultra-minimal user controller with zero user settings
// All permissions, limits, and monthly activations are controlled by the Admin.

const REMOTE_CONFIG_URL = "https://mantub013.github.io/login/config.json";

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const DEFAULTS = {
  isEnabled: true,
  authorizedUsername: "9731147181",
  activeMonth: getCurrentYearMonth(),
  maxChanges: 50,
  usedChanges: 0,
  lastRcNumber: "240500267410",
  rcHistory: []
};

let currentConfig = { ...DEFAULTS };

// DOM Elements
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const inputRcNumber = document.getElementById("inputRcNumber");
const btnApplyRc = document.getElementById("btnApplyRc");
const quotaCountText = document.getElementById("quotaCountText");
const quotaProgressBar = document.getElementById("quotaProgressBar");
const userFeedback = document.getElementById("userFeedback");

// Show feedback message
function showUserMessage(text, type = "info") {
  userFeedback.textContent = text;
  userFeedback.className = `feedback-msg ${type}`;
  userFeedback.classList.remove("hidden");
}

function clearUserMessage() {
  userFeedback.textContent = "";
  userFeedback.classList.add("hidden");
}

// Refresh User UI
function refreshUserUi() {
  const currentMonth = getCurrentYearMonth();
  const isMonthValid = currentConfig.activeMonth === currentMonth;
  const isQuotaAvailable = currentConfig.usedChanges < currentConfig.maxChanges;

  statusBadge.className = "status-badge";

  if (!currentConfig.isEnabled) {
    statusBadge.classList.add("badge-disabled");
    statusText.textContent = "Disabled by Admin";
    btnApplyRc.disabled = true;
  } else if (!isMonthValid) {
    statusBadge.classList.add("badge-warning");
    statusText.textContent = `Expired (${currentConfig.activeMonth || "N/A"}) - Needs Admin Approval`;
    btnApplyRc.disabled = true;
  } else if (!isQuotaAvailable) {
    statusBadge.classList.add("badge-disabled");
    statusText.textContent = `Quota Reached (${currentConfig.usedChanges}/${currentConfig.maxChanges})`;
    btnApplyRc.disabled = true;
  } else {
    statusBadge.classList.add("badge-active");
    statusText.textContent = `Active (${currentConfig.activeMonth})`;
    btnApplyRc.disabled = false;
  }

  // Quota bar
  const used = currentConfig.usedChanges || 0;
  const max = currentConfig.maxChanges || 50;
  quotaCountText.textContent = `${used} / ${max}`;
  const pct = Math.min(100, Math.round((used / max) * 100));
  quotaProgressBar.style.width = `${pct}%`;

  if (pct >= 100) {
    quotaProgressBar.style.backgroundColor = "#ef4444";
  } else if (pct >= 80) {
    quotaProgressBar.style.backgroundColor = "#f59e0b";
  } else {
    quotaProgressBar.style.backgroundColor = "#10b981";
  }

  // Default input value
  if (!inputRcNumber.value && currentConfig.lastRcNumber) {
    inputRcNumber.value = currentConfig.lastRcNumber;
  }
}

// Sync latest remote config from Admin server / GitHub Pages
async function syncRemoteAdminConfig() {
  try {
    const res = await fetch(`${REMOTE_CONFIG_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const remote = await res.json();
      const updates = {};
      if (typeof remote.isEnabled === "boolean") updates.isEnabled = remote.isEnabled;
      if (remote.authorizedUsername) updates.authorizedUsername = remote.authorizedUsername;
      if (remote.activeMonth) updates.activeMonth = remote.activeMonth;
      if (remote.maxChanges) updates.maxChanges = remote.maxChanges;

      currentConfig = { ...currentConfig, ...updates };
      chrome.storage.local.set(updates, () => {
        refreshUserUi();
      });
    }
  } catch (e) {
    // If offline or unreachable, rely on local cached settings
    console.log("[RC Extension] Using local config cache:", e.message);
  }
}

// Allow pressing Enter in input field
inputRcNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!btnApplyRc.disabled) {
      btnApplyRc.click();
    }
  }
});

// Apply RC update on the active page
btnApplyRc.addEventListener("click", async () => {
  clearUserMessage();
  const rcVal = inputRcNumber.value.trim();

  if (!rcVal) {
    showUserMessage("Please enter a valid Ration Card number.", "error");
    return;
  }

  btnApplyRc.disabled = true;
  btnApplyRc.textContent = "Processing...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      showUserMessage("Cannot access active tab. Open portal page first.", "error");
      btnApplyRc.disabled = false;
      btnApplyRc.textContent = "⚡ Enable & Update RC";
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "APPLY_RC_UPDATE",
        newRcNumber: rcVal,
        authorizedUsername: currentConfig.authorizedUsername
      },
      (response) => {
        btnApplyRc.disabled = false;
        btnApplyRc.textContent = "⚡ Enable & Update RC";

        if (chrome.runtime.lastError) {
          showUserMessage("Could not connect to page. Refresh the page and try again.", "error");
          return;
        }

        if (response && response.success) {
          const updatedUsed = (currentConfig.usedChanges || 0) + 1;
          currentConfig.usedChanges = updatedUsed;
          currentConfig.lastRcNumber = rcVal;

          const historyEntry = {
            rcNumber: rcVal,
            timestamp: new Date().toLocaleString(),
            date: new Date().toISOString()
          };
          const updatedHistory = [historyEntry, ...(currentConfig.rcHistory || [])].slice(0, 100);
          currentConfig.rcHistory = updatedHistory;

          chrome.storage.local.set({
            usedChanges: updatedUsed,
            lastRcNumber: rcVal,
            rcHistory: updatedHistory
          }, () => {
            refreshUserUi();
            showUserMessage(`✓ Enabled & updated to ${rcVal}!`, "success");
          });
        } else {
          const reason = (response && response.reason) ? response.reason : "Operation failed on page.";
          showUserMessage(reason, "error");
        }
      }
    );
  } catch (err) {
    btnApplyRc.disabled = false;
    btnApplyRc.textContent = "⚡ Enable & Update RC";
    showUserMessage(`Error: ${err.message}`, "error");
  }
});

// Initialize on open
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(DEFAULTS, (data) => {
    currentConfig = { ...DEFAULTS, ...data };
    refreshUserUi();
    syncRemoteAdminConfig();
  });
});
