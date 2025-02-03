import { loadNotEmailPageComponents } from "/src/routes/not_email_page_route.js";
import { loadAuthenticatedComponents } from "/src/routes/authenticated_route.js";
import { loadUnauthenticatedComponents } from "/src/routes/unauthenticated_route.js";
import { displayError } from "/src/helper/display_error.js";
import { isEmailPage } from "/src/helper/is_gmail_page_helper.js";
import { loadCommonComponents } from "/src/routes/common_route.js";

/**
 * Initializes the popup interface for registered users by loading authenticated components
 * and setting up the initial UI state.
 *
 * The function:
 * 1. Loads all authenticated components in parallel
 * 2. Finds and clicks the details button to open the details view
 * 3. Highlights the details menu item by adding the 'active' class
 *
 * Called when:
 * - Popup initializes on an email page
 * - User has valid registration data
 *
 * @async
 * @returns {Promise<void>}
 */
const handleRegisteredUser = async () => {
  await loadAuthenticatedComponents();
  const detailsBtn = document.getElementById("details-btn");

  if (detailsBtn) {
    detailsBtn.click();
    const menuItem = detailsBtn.closest(".menu-item");
    if (menuItem) menuItem.classList.add("active");
  }
};

/**
 * Handles the response from email page check and loads appropriate components based on context.
 *
 * The function determines which components to load based on:
 * 1. Whether current page is an email page
 * 2. User's registration status
 *
 * Flow:
 * - For non-email pages: loads not-email-page components
 * - For email pages:
 *   - Checks registration status in chrome.storage
 *   - Loads authenticated components for registered users
 *   - Loads unauthenticated components for unregistered users
 *
 * @async
 * @param {Object} response - Response object from email page check
 * @returns {Promise<void>}
 * @throws {Error} Handled by displayError if storage access fails
 */
const handleEmailPageResponse = async (response) => {
  loadCommonComponents();

  if (!isEmailPage(response)) {
    await loadNotEmailPageComponents();
    return;
  }

  try {
    const { registration } = await chrome.storage.local.get("registration");

    if (registration) {
      await handleRegisteredUser();
    } else {
      await loadUnauthenticatedComponents();
    }
  } catch (error) {
    displayError(error);
  }
};

/**
 * Initializes the popup interface when the extension icon is clicked.
 * Sets up the core event listener to begin popup functionality.
 *
 * The function:
 * 1. Listens for DOMContentLoaded event
 * 2. Sends message to check current page type
 * 3. Handles response through handleEmailPageResponse
 *
 * Called immediately on script load to ensure popup
 * is ready as soon as user clicks extension icon.
 *
 * @returns {void}
 */
const initializePopup = () => {
  document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage(
      { action: "checkEmailPage" },
      handleEmailPageResponse
    );
  });
};

initializePopup();
