browser.runtime.sendMessage({ popupOpened: true }, () => {
  console.log("popup opened");
});

import { displayError } from "/src/helper/display_error.js";
import { isEmailPage } from "/src/helper/is_gmail_page_helper.js";
import { loadCommonComponents } from "/src/routes/common_route.js";
import { loadNotEmailPageComponents } from "/src/routes/not_email_page_route.js";
import { loadAuthenticatedComponents } from "/src/routes/authenticated_route.js";
import { loadUnauthenticatedComponents } from "/src/routes/unauthenticated_route.js";
import { checkTokenValidity } from "/src/helper/decode_Jwt_helper.js";

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
export const handleRegisteredUser = async () => {
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
 * 3. Token expiration status
 *
 * Flow:
 * - For non-email pages: loads not-email-page components
 * - For email pages:
 *   - Checks registration status in browser.storage
 *   - Checks if token is expired
 *   - Loads appropriate components based on conditions
 *
 * @async
 * @param {Object} response - Response object from email page check
 * @returns {Promise<void>}
 * @throws {Error} Handled by displayError if storage access fails
 */
const handleEmailPageResponse = async (response) => {
  // const { access_token } = await browser.storage.local.get("access_token");
  // const { revoke_status } = await browser.storage.local.get("revoke_status");

  // if (revoke_status) {
  //   await browser.storage.local.set({ registration: false });
  //   await loadUnauthenticatedComponents("licenseExpire");
  //   return;
  // }

  // if (access_token) {
  //   const isTokenValid = await checkTokenValidity(access_token);
  //   if (!isTokenValid || !access_token) {
  //     await browser.storage.local.set({ registration: false });
  //     await loadUnauthenticatedComponents("tokenExpire");
  //     return;
  //   }
  // } else {
  //   await browser.storage.local.set({ registration: false });
  //   await loadUnauthenticatedComponents("tokenExpire");
  //   return;
  // }

  await loadCommonComponents();

  if (!isEmailPage(response)) {
    await loadNotEmailPageComponents();
    return;
  }

  try {
    await handleRegisteredUser();
    // if (access_token) {
    //   await handleRegisteredUser();
    // }
  } catch (error) {
    displayError();
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
    document.body.style.width = "550px";
    document.body.style.height = "590px";
    document.body.style.overflow = "hidden";
    browser.runtime.sendMessage(
      { action: "checkEmailPage" },
      handleEmailPageResponse
    );
  });
};

initializePopup();
