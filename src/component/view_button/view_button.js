import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { MAIL_STATUS } from "/src/constant/mail_status.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

/**
 * Creates a "View" button element with dynamic state based on mail status
 *
 * @param {string} sender - Message ID  identifier
 * @param {string|number} status - Mail status to determine button state
 * @returns {HTMLButtonElement} Configured view button element
 *
 * Features:
 * - Automatically loads required CSS styles
 * - Sets button class and text content
 * - Stores message ID in data attribute
 *
 * Example:
 * const button = createViewButton('msg123', MAIL_STATUS.SAFE);
 * container.appendChild(button);
 *
 */
export const createViewButton = (sender, status) => {
  const view_button = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_BUTTON}/${COMPONENTS.VIEW_BUTTON}`;
  loadCSS(`${view_button}.css`);
  const button = document.createElement("button");
  button.className = "view-button";
  button.textContent = "View";
  button.dataset.msg_id = sender;
  return button;
};
