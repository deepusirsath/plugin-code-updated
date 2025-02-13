const alertConfigs = [
  {
    type: "success",
    icon: `<svg class="alert-icon success-icon" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`,
    btnColor: "#4CAF50",
    buttonText: "close",
  },
  {
    type: "limit",
    icon: `<svg class="alert-icon limit-icon" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`,
    btnColor: "#ff4757",
    buttonText: "close",
  },
  {
    type: "warning",
    icon: `<svg class="alert-icon warning-icon" viewBox="0 0 24 24">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>`,
    btnColor: "#ffa502",
    buttonText: "close",
  },
];

/**
 * Creates and displays a customized alert dialog overlay
 *
 * @param {string} message - The text message to display in the alert
 * @param {string} [type="success"] - The alert type - either "success" or "limit"
 *
 * Features:
 * - Creates an overlay with a styled alert box
 * - Displays SVG icon based on type (checkmark for success, exclamation for limit)
 * - Shows message text and close button
 * - Auto-focuses close button for keyboard accessibility
 * - Closes on Escape key or button click
 * - Fade out animation on close
 * - Auto closes window for success alerts
 *
 * Example usage:
 * showCustomAlert("Operation completed!", "success");
 * showCustomAlert("Rate limit exceeded", "limit");
 */
export const showCustomAlert = (message, type = "success") => {
  const alertDiv = document.createElement("div");
  alertDiv.className = "custom-alert-overlay";

  const currentConfig =
    alertConfigs.find((config) => config.type === type) || alertConfigs[0];

  alertDiv.innerHTML = `
    <div class="custom-alert-box ${type}">
      ${currentConfig.icon}
      <p>${message}</p>
      <button id="alertOkButton" style="--btnColor: ${currentConfig.btnColor};">
        ${currentConfig.buttonText}
      </button>
    </div>
  `;

  document.body.appendChild(alertDiv);

  const okButton = document.getElementById("alertOkButton");
  okButton.focus();

  /**
   * Handles closing the custom alert dialog with animation
   *
   * Features:
   * - Adds fade-out animation class to alert overlay
   * - Removes alert from DOM after animation completes
   * - Automatically closes window if alert type was "success"
   * - Uses 100ms timeout to allow animation to complete
   *
   * Called when:
   * - User clicks close button
   * - User presses Escape key
   */
  const closeAlert = () => {
    alertDiv.classList.add("fade-out");
    setTimeout(() => {
      alertDiv.remove();
      if (type === "success") {
        window.close();
      }
    }, 100);
  };

  /**
   * Event handler for keyboard Escape key press
   *
   * @param {KeyboardEvent} e - The keyboard event object
   *
   * Features:
   * - Detects Escape key press
   * - Removes itself as event listener to prevent memory leaks
   * - Triggers alert closing via closeAlert()
   *
   * Used as keyboard shortcut for dismissing the alert dialog
   * for better accessibility and user experience
   */
  const escHandler = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", escHandler);
      closeAlert();
    }
  };

  document.addEventListener("keydown", escHandler);
  okButton.addEventListener("click", closeAlert);
};
