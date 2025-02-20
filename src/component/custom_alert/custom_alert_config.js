/**
 * Configuration array for custom alert types and their visual properties
 * @constant {Array<Object>} customAlertConfig
 *
 * @property {Object[]} customAlertConfig - Array of alert configuration objects
 * @property {string} customAlertConfig[].type - Alert type identifier ('success', 'limit', or 'warning')
 * @property {string} customAlertConfig[].icon - SVG markup for the alert icon
 * @property {string} customAlertConfig[].btnColor - Hex color code for the alert button
 * @property {string} customAlertConfig[].buttonText - Text displayed on the alert button
 *
 * Available alert types:
 * - success: Green checkmark icon with #4CAF50 button
 * - limit: Red info icon with #ff4757 button
 * - warning: Yellow triangle icon with #ffa502 button
 */
export const customAlertConfig = [
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
