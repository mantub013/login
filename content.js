// content.js - Injected into the web page to handle verification and RC number updates

(() => {
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
    if (newRcNumber && newRcNumber.trim() !== "") {
      const trimmedRc = newRcNumber.trim();
      rcInput.value = trimmedRc;
      
      // Dispatch events so ASP.NET and JavaScript forms detect the change
      rcInput.dispatchEvent(new Event("input", { bubbles: true }));
      rcInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

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

  // Optional: auto-check once on load
  window.addEventListener("load", () => {
    chrome.storage.local.get(["isEnabled", "authorizedUsername", "activeMonth", "usedChanges", "maxChanges"], (data) => {
      if (!data || data.isEnabled === false) return;
      const check = checkPagePrerequisites(data.authorizedUsername || "9731147181");
      if (check.ok) {
        console.log("[RC Extension] Portal verified and ready for RC modification.");
      }
    });
  });
})();
