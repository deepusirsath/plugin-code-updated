/**
 * Displays a custom alert overlay with success or limit icon and message
 * 
 * @param {string} message - The message to display in the alert
 * @param {Function} closeCallback - Optional callback function to execute when alert is closed
 * @param {string} type - Alert type, either 'success' (default) or any other value for limit/error style
 * 
 * Features:
 * - Creates an overlay with animated fade effects
 * - Shows either a success (checkmark) or limit (exclamation) icon based on type
 * - Customizable button colors (#4CAF50 for success, #ff4757 for others)
 * - Can be closed by:
 *   - Clicking the close button
 *   - Pressing ESC key
 * - Auto-focuses the close button
 * - Executes optional closeCallback when closed
 * - Auto-closes window if type is 'success'
 * - Supports fade-out animation on close
 * 
 * CSS Classes:
 * - custom-alert-overlay: Main overlay container
 * - custom-alert-box: Alert box container
 * - alert-icon: Base icon class
 * - success-icon/limit-icon: Specific icon variants
 * - fade-out: Animation class for closing
 */

export const showCustomAlert = (message, closeCallback, type = 'success') => {
  const alertDiv = document.createElement("div");
  alertDiv.className = "custom-alert-overlay";

  const successIconSVG = `<svg class="alert-icon success-icon" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`;

  const limitIconSVG = `<svg class="alert-icon limit-icon" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>`;

  const btnColor = type === 'success' ? '#4CAF50' : '#ff4757';
  const icon = type === 'success' ? successIconSVG : limitIconSVG;
  const buttonText = type === 'success' ? 'close!' : 'close!';

  alertDiv.innerHTML = `
    <div class="custom-alert-box ${type}">
      ${icon}
      <p>${message}</p>
      <button id="alertOkButton" style="--btnColor: ${btnColor};">
        ${buttonText}
      </button>
    </div>
  `;

  document.body.appendChild(alertDiv);

  const okButton = document.getElementById("alertOkButton");
  okButton.focus();

  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", escHandler);
      closeAlert();
    }
  });

  okButton.addEventListener("click", closeAlert);

  function closeAlert() {
    alertDiv.classList.add("fade-out");
    setTimeout(() => {
        alertDiv.remove();
        if (closeCallback) closeCallback();
        if (type === 'success') {
            window.close();
        }
    }, 100);
}
};
