// content.js - Injected into the web page to handle verification and RC number updates

(() => {
  let isObserverActive = false;

  // Check page status and elements
  function checkPagePrerequisites(authorizedUsername) {
    // 1. Check for the hidden username input
    const hidUsernameEl = document.getElementById("ctl00_ContentPlaceHolder1_hidusername") ||
                          document.querySelector('input[name="ctl00$ContentPlaceHolder1$hidusername"]');

    if (!hidUsernameEl) {
      return {
        ok: false,
        reason: "Page check failed: User ID element (ctl00_ContentPlaceHolder1_hidusername) not found."
      };
    }

    const currentPageUsername = (hidUsernameEl.value || "").trim();
    const expectedUsername = (authorizedUsername || "").trim();

    if (currentPageUsername !== expectedUsername) {
      return {
        ok: false,
        reason: `Access Denied: Page username (${currentPageUsername}) does not match authorized username (${expectedUsername}).`
      };
    }

    // 2. Check for the verify button
    const btnVerify = document.getElementById("ctl00_ContentPlaceHolder1_btn_verify") ||
                      document.querySelector('input[name="ctl00$ContentPlaceHolder1$btn_verify"]');

    if (!btnVerify) {
      return {
        ok: false,
        reason: "Verify button (ctl00_ContentPlaceHolder1_btn_verify) not found on this page."
      };
    }

    // 3. Check for RC input field
    const rcInput = document.getElementById("ctl00_ContentPlaceHolder1_txt_rc_no") ||
                    document.querySelector('input[name="ctl00$ContentPlaceHolder1$txt_rc_no"]');

    if (!rcInput) {
      return {
        ok: false,
        reason: "Ration Card input field (ctl00_ContentPlaceHolder1_txt_rc_no) not found."
      };
    }

    return {
      ok: true,
      hidUsernameEl,
      btnVerify,
      rcInput,
      currentValue: rcInput.value
    };
  }

  // Ensure field stays enabled if ASP.NET partial postback alters it
  function attachPostbackObserver(rcInput, desiredValue) {
    if (isObserverActive || !rcInput) return;
    isObserverActive = true;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "disabled") {
          if (rcInput.disabled || rcInput.getAttribute("disabled")) {
            rcInput.removeAttribute("disabled");
            rcInput.disabled = false;
            rcInput.setAttribute("enable", "enable");
            rcInput.readOnly = false;
            if (desiredValue) rcInput.value = desiredValue;
          }
        }
      });
    });

    observer.observe(rcInput, { attributes: true });
  }

  // Perform enabling and updating RC number
  function applyRcUpdate(newRcNumber, authorizedUsername) {
    const check = checkPagePrerequisites(authorizedUsername);
    if (!check.ok) {
      return { success: false, reason: check.reason };
    }

    const { rcInput } = check;

    // Enable the input element as requested
    rcInput.removeAttribute("disabled");
    rcInput.disabled = false;
    rcInput.setAttribute("enable", "enable");
    rcInput.readOnly = false;

    // Set new RC number if provided
    let finalRc = rcInput.value;
    if (newRcNumber && newRcNumber.trim() !== "") {
      finalRc = newRcNumber.trim();
      rcInput.value = finalRc;
      
      // Dispatch events so ASP.NET and JavaScript forms detect the change
      rcInput.dispatchEvent(new Event("input", { bubbles: true }));
      rcInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Attach observer to prevent ASP.NET from re-disabling
    attachPostbackObserver(rcInput, finalRc);

    // Visual feedback highlight
    const originalBorder = rcInput.style.border;
    const originalBg = rcInput.style.backgroundColor;
    rcInput.style.border = "2px solid #10b981";
    rcInput.style.backgroundColor = "#ecfdf5";
    setTimeout(() => {
      rcInput.style.border = originalBorder;
      rcInput.style.backgroundColor = originalBg;
    }, 2500);

    return {
      success: true,
      message: "RC input enabled and updated successfully!",
      updatedValue: rcInput.value
    };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CHECK_PAGE_STATUS") {
      const check = checkPagePrerequisites(request.authorizedUsername);
      sendResponse({
        ok: check.ok,
        reason: check.reason || "",
        currentValue: check.currentValue || ""
      });
      return true;
    }

    if (request.action === "APPLY_RC_UPDATE") {
      const result = applyRcUpdate(request.newRcNumber, request.authorizedUsername);
      sendResponse(result);
      return true;
    }
  });

  // Admin Dashboard Bridge (Allows admin.html on GitHub Pages to communicate with extension storage directly)
  window.addEventListener("message", (event) => {
    if (!event.data || !event.data.type) return;

    if (event.data.type === "RC_ADMIN_REQUEST_DATA") {
      chrome.storage.local.get(null, (data) => {
        window.postMessage({ type: "RC_ADMIN_RESPONSE_DATA", data }, "*");
      });
    }

    if (event.data.type === "RC_ADMIN_SAVE_DATA" && event.data.updates) {
      chrome.storage.local.set(event.data.updates, () => {
        window.postMessage({ type: "RC_ADMIN_SAVE_SUCCESS" }, "*");
      });
    }
  });

  // Auto-check once DOM is ready
  function initOnPageReady() {
    chrome.storage.local.get(["isEnabled", "authorizedUsername"], (data) => {
      if (!data || data.isEnabled === false) return;
      const check = checkPagePrerequisites(data.authorizedUsername || "9731147181");
      if (check.ok) {
        console.log("[RC Extension] Portal verified and ready for RC modification.");
      }
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    initOnPageReady();
  } else {
    window.addEventListener("DOMContentLoaded", initOnPageReady);
    window.addEventListener("load", initOnPageReady);
  }
})();
