import { checkEmailPageStatus } from "./background/background_helper.js";
import { CHECK_EMAIL_PAGE_STATUS } from "./src/constant/background_action.js";

/**
 * Message listener for handling background script communications
 *
 * This listener processes messages sent from other parts of the extension,
 * specifically handling email page status checks.
 *
 * @param {Object} request - The message request object
 * @param {string} request.action - Action type to identify the operation
 * @param {Object} sender - Information about the script context that sent the message
 * @param {Function} sendResponse - Callback function to send a response back to the sender
 *
 * @listens chrome.runtime.onMessage
 *
 * Flow:
 * 1. Checks if the received action is CHECK_EMAIL_PAGE_STATUS
 * 2. Queries for the active tab in the current window
 * 3. Extracts the current URL from the active tab
 * 4. Calls checkEmailPageStatus with URL, tab ID and response callback
 *
 * @returns {boolean} True if using sendResponse asynchronously, false otherwise
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === CHECK_EMAIL_PAGE_STATUS) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0]?.url;
      return checkEmailPageStatus(currentUrl, tabs[0].id, sendResponse);
    });
    return true;
  }
  return false;
});
