// popup.js - Controller for user popup and admin settings

function getCurrentYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const DEFAULTS = {
  isEnabled: true,
  adminPin: "1234",
  authorizedUsername: "9731147181",
  activeMonth: getCurrentYearMonth(),
  maxChanges: 50,
  usedChanges: 0,
  lastRcNumber: "240500267410"
};

let currentConfig = { ...DEFAULTS };

// DOM Elements
const userView = document.getElementById("userView");
const adminView = document.getElementById("adminView");
const adminPinModal = document.getElementById("adminPinModal");

const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const inputRcNumber = document.getElementById("inputRcNumber");
const btnApplyRc = document.getElementById("btnApplyRc");
const quotaCountText = document.getElementById("quotaCountText");
const quotaProgressBar = document.getElementById("quotaProgressBar");
const userFeedback = document.getElementById("userFeedback");

// Admin Modal Elements
const btnToggleAdmin = document.getElementById("btnToggleAdmin");
const inputAdminPin = document.getElementById("inputAdminPin");
const btnCancelPin = document.getElementById("btnCancelPin");
const btnSubmitPin = document.getElementById("btnSubmitPin");
const pinErrorMsg = document.getElementById("pinErrorMsg");

// Admin View Elements
const btnCloseAdmin = document.getElementById("btnCloseAdmin");
const adminSwitchEnabled = document.getElementById("adminSwitchEnabled");
const adminActiveMonth = document.getElementById("adminActiveMonth");
const btnAuthorizeMonth = document.getElementById("btnAuthorizeMonth");
const adminAuthUsername = document.getElementById("adminAuthUsername");
const adminMaxChanges = document.getElementById("adminMaxChanges");
const btnResetUsage = document.getElementById("btnResetUsage");
const adminUsageDetail = document.getElementById("adminUsageDetail");
const adminNewPin = document.getElementById("adminNewPin");
const btnSaveAdminSettings = document.getElementById("btnSaveAdminSettings");
const adminSaveFeedback = document.getElementById("adminSaveFeedback");

// Load settings from storage
function loadSettings(callback) {
  chrome.storage.local.get(DEFAULTS, (data) => {
    currentConfig = { ...DEFAULTS, ...data };
    if (callback) callback();
  });
}

// Refresh User View UI
function refreshUserUi() {
  const currentMonth = getCurrentYearMonth();
  const isMonthValid = currentConfig.activeMonth === currentMonth;
  const isQuotaAvailable = currentConfig.usedChanges < currentConfig.maxChanges;

  // Status Badge Logic
  statusBadge.className = "status-badge";
  if (!currentConfig.isEnabled) {
    statusBadge.classList.add("badge-disabled");
    statusText.textContent = "Disabled by Admin";
    btnApplyRc.disabled = true;
  } else if (!isMonthValid) {
    statusBadge.classList.add("badge-warning");
    statusText.textContent = `Expired (${currentConfig.activeMonth || "None"}) - Needs Admin`;
    btnApplyRc.disabled = true;
  } else if (!isQuotaAvailable) {
    statusBadge.classList.add("badge-disabled");
    statusText.textContent = `Quota Limit Reached (${currentConfig.usedChanges}/${currentConfig.maxChanges})`;
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

  // RC input value (fill last entered if input empty)
  if (!inputRcNumber.value && currentConfig.lastRcNumber) {
    inputRcNumber.value = currentConfig.lastRcNumber;
  }
}

// Show feedback message in user view
function showUserMessage(text, type = "info") {
  userFeedback.textContent = text;
  userFeedback.className = `feedback-msg ${type}`;
  userFeedback.classList.remove("hidden");
}

function clearUserMessage() {
  userFeedback.textContent = "";
  userFeedback.classList.add("hidden");
}

// Show feedback message in admin view
function showAdminMessage(text, type = "info") {
  adminSaveFeedback.textContent = text;
  adminSaveFeedback.className = `feedback-msg ${type}`;
  adminSaveFeedback.classList.remove("hidden");
  setTimeout(() => {
    adminSaveFeedback.classList.add("hidden");
  }, 3000);
}

// Populate Admin UI
function populateAdminUi() {
  adminSwitchEnabled.checked = currentConfig.isEnabled;
  adminActiveMonth.value = currentConfig.activeMonth || getCurrentYearMonth();
  adminAuthUsername.value = currentConfig.authorizedUsername || "9731147181";
  adminMaxChanges.value = currentConfig.maxChanges || 50;
  adminUsageDetail.textContent = `Used: ${currentConfig.usedChanges || 0} / ${currentConfig.maxChanges || 50}`;
  adminNewPin.value = "";
}

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

    // Send action to content script
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
          // Increment usage counter and save last RC
          const updatedUsed = (currentConfig.usedChanges || 0) + 1;
          currentConfig.usedChanges = updatedUsed;
          currentConfig.lastRcNumber = rcVal;

          chrome.storage.local.set({
            usedChanges: updatedUsed,
            lastRcNumber: rcVal
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

// Admin modal open
btnToggleAdmin.addEventListener("click", () => {
  inputAdminPin.value = "";
  pinErrorMsg.classList.add("hidden");
  adminPinModal.classList.remove("hidden");
  inputAdminPin.focus();
});

// Admin modal cancel
btnCancelPin.addEventListener("click", () => {
  adminPinModal.classList.add("hidden");
});

// Admin modal verify PIN
btnSubmitPin.addEventListener("click", () => {
  const entered = inputAdminPin.value.trim();
  if (entered === currentConfig.adminPin) {
    adminPinModal.classList.add("hidden");
    userView.classList.add("hidden");
    adminView.classList.remove("hidden");
    populateAdminUi();
  } else {
    pinErrorMsg.classList.remove("hidden");
  }
});

inputAdminPin.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    btnSubmitPin.click();
  }
});

// Back from admin
btnCloseAdmin.addEventListener("click", () => {
  adminView.classList.add("hidden");
  userView.classList.remove("hidden");
  refreshUserUi();
});

// Admin: Authorize Current Month
btnAuthorizeMonth.addEventListener("click", () => {
  const thisMonth = getCurrentYearMonth();
  adminActiveMonth.value = thisMonth;
  showAdminMessage(`Active month set to ${thisMonth}`, "info");
});

// Admin: Reset Usage
btnResetUsage.addEventListener("click", () => {
  if (confirm("Reset change usage count back to 0?")) {
    currentConfig.usedChanges = 0;
    chrome.storage.local.set({ usedChanges: 0 }, () => {
      adminUsageDetail.textContent = `Used: 0 / ${adminMaxChanges.value}`;
      showAdminMessage("Usage counter reset to 0.", "success");
    });
  }
});

// Admin: Save Settings
btnSaveAdminSettings.addEventListener("click", () => {
  const newMax = parseInt(adminMaxChanges.value, 10);
  if (isNaN(newMax) || newMax < 1) {
    showAdminMessage("Max changes must be at least 1", "error");
    return;
  }

  const updates = {
    isEnabled: adminSwitchEnabled.checked,
    activeMonth: adminActiveMonth.value.trim() || getCurrentYearMonth(),
    authorizedUsername: adminAuthUsername.value.trim() || "9731147181",
    maxChanges: newMax
  };

  const newPinVal = adminNewPin.value.trim();
  if (newPinVal) {
    if (newPinVal.length < 4) {
      showAdminMessage("PIN should be at least 4 digits", "error");
      return;
    }
    updates.adminPin = newPinVal;
  }

  chrome.storage.local.set(updates, () => {
    currentConfig = { ...currentConfig, ...updates };
    showAdminMessage("Admin settings saved successfully!", "success");
    setTimeout(() => {
      btnCloseAdmin.click();
    }, 900);
  });
});

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadSettings(() => {
    refreshUserUi();
  });
});
