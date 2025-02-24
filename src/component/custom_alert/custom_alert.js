import { customAlertConfig } from "./custom_alert_config.js";

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
    customAlertConfig.find((config) => config.type === type) ||
    customAlertConfig[0];

  alertDiv.innerHTML = `
    <div class="custom-alert-box ${type}">
      ${currentConfig.icon}
      <p>${message}</p>
      <button id="alertOkButton" style="--btnColor: ${currentConfig.btnColor};">
        Close
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
