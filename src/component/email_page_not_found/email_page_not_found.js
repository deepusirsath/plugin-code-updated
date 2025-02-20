import { EMAIL_SERVICES } from "./email_page_config.js";

/**
 * @description Sets up click event handlers for email service icons
 *
 * Iterates through the EMAIL_SERVICES object and adds click handlers to each email service icon.
 * When an icon is clicked, it opens the corresponding email service URL in a new tab.
 *
 * @example
 * // EMAIL_SERVICES structure:
 * // {
 * //   'gmail-icon': "https://mail.google.com",
 * //   'outlook-icon': "https://outlook.live.com"
 * // }
 *
 * // The code will add click handlers to elements with IDs matching the keys
 * // When clicked, opens the corresponding URL in a new tab
 */
Object.entries(EMAIL_SERVICES).forEach(([iconId, url]) => {
  document.getElementById(iconId)?.addEventListener("click", () => {
    window.open(url, "_blank");
  });
});
