import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { displayError } from "/src/helper/display_error.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { initializeDisputeForm } from "/src/pages/dispute/dispute.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { setCurrentSearchQuery } from "/src/pages/spam-mail/spam-mail.js";
import { setCurrentdisputeMailSearchQuery } from "/src/pages/dispute-mail/dispute-mail.js";
import {
  loadComponent,
  loadCssAndHtmlFile,
  loadScript,
} from "/src/helper/content_loader_helper.js";
import { SIDEBAR_CONFIG } from "./sidebar_config.js";

let currentLoadingOperation = null;

/**
 * Updates the active state of menu items in the sidebar and resets search-related elements
 * @param {HTMLElement} clickedButton - The button element that was clicked in the sidebar
 * @description
 * - Removes 'active' class from all menu items
 * - Adds 'active' class to the clicked menu item's parent
 * - Clears any error messages
 * - Resets search input value and query state
 * - Hides the clear button
 * @example
 * const button = document.getElementById('menu-button');
 * updateActiveMenuItem(button);
 */
const updateActiveMenuItem = (clickedButton) => {
  const searchInput = document.getElementById("search-input");
  const clearButton = document.getElementById("clearButton");
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((item) => item.classList.remove("active"));
  clickedButton.closest(".menu-item").classList.add("active");
  document.getElementById("errorDisplay").innerHTML = "";

  if (searchInput) {
    searchInput.value = "";
    setCurrentSearchQuery("");
    setCurrentdisputeMailSearchQuery("");
  }

  if (clearButton) {
    clearButton.style.display = "none";
  }
};

/**
 * Handles loading of regular (non-dispute) components in the sidebar
 * @param {string} componentName - The name of the component to be loaded
 * @returns {Promise<void>} A promise that resolves when the component is loaded
 * @fires {CustomEvent} componentLoaded - Dispatched with component details after successful loading
 * @throws {Error} Caught and handled by displayError if component loading fails
 * @example
 * // Load a regular component
 * await handleRegularButton('details');
 */
const handleRegularButton = async (componentName) => {
  try {
    await loadComponent({
      componentName,
      basePath: BASEPATH.PAGES,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    document.dispatchEvent(
      new CustomEvent("componentLoaded", {
        detail: { componentName },
      })
    );
  } catch (error) {
    displayError();
  }
};

/**
 * Handles dispute button click events and manages email service verification and component loading
 *
 * @param {string} componentName - Name of the component to be loaded
 * @returns {Promise<void>}
 *
 * @description
 * This function performs the following operations:
 * 1. Verifies if the current page is a valid email service page
 * 2. Checks for dispute data if email service is valid
 * 3. Loads appropriate components based on the response:
 *    - Loads "mail not found" component if dispute data is not found
 *    - Loads specified component with dispute data if available
 *    - Dispatches a custom event with component and dispute data
 *
 * Supported email services:
 * - Gmail
 * - Outlook
 * - Yahoo
 *
 * @example
 * await handleDisputeButton('dispute');
 *
 * @throws {Error} Displays error message if any operation fails
 */

const handleDisputeButton = async (componentName) => {
  const thisOperation = {};
  currentLoadingOperation = thisOperation;
  document.getElementById("data-output").innerHTML = "";
  showLoader();

  // Create a timeout promise that resolves after 5 seconds
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve({ timedOut: true });
    }, 3000);
  });

  try {
    chrome.runtime.sendMessage(
      { action: "checkEmailPage" },
      async function (response) {
        if (currentLoadingOperation !== thisOperation) {
          hideLoader();
          return;
        }

        const openedServices = [
          "OpenedGmail",
          "OpenedOutlook",
          "OpenedYahoo",
          "Gmail",
        ];

        if (openedServices.includes(response)) {
          // Set up a flag to track if the dispute response has been processed
          let disputeResponseProcessed = false;

          // Start the timeout
          timeoutPromise.then(async (result) => {
            // Only proceed if the operation hasn't been cancelled and the dispute response hasn't been processed yet
            if (
              currentLoadingOperation === thisOperation &&
              !disputeResponseProcessed
            ) {
              disputeResponseProcessed = true;

              await loadCssAndHtmlFile({
                componentName: COMPONENTS.OPENED_MAIL_NOT_FOUND,
                basePath: BASEPATH.COMPONENT,
                targetId: TARGET_ID.DATA_OUTPUT,
              });
              hideLoader();
            }
          });

          chrome.runtime.sendMessage(
            { action: "checkDispute" },
            async function (disputeResponse) {
              if (disputeResponseProcessed) {
                return;
              }

              disputeResponseProcessed = true;

              if (currentLoadingOperation !== thisOperation) {
                hideLoader();
                return;
              }

              if (disputeResponse?.error === "Not found") {
                hideLoader();
                await loadCssAndHtmlFile({
                  componentName: COMPONENTS.OPENED_MAIL_NOT_FOUND,
                  basePath: BASEPATH.COMPONENT,
                  targetId: TARGET_ID.DATA_OUTPUT,
                });
              } else if (disputeResponse) {
                await loadComponent({
                  componentName,
                  basePath: BASEPATH.PAGES,
                  targetId: TARGET_ID.DATA_OUTPUT,
                });
                hideLoader();
                document.dispatchEvent(
                  new CustomEvent("componentLoaded", {
                    detail: { componentName, disputeData: disputeResponse },
                  })
                );
              } else {
                // Handle case when disputeResponse is falsy but not "Not found"
                await loadCssAndHtmlFile({
                  componentName: COMPONENTS.OPENED_MAIL_NOT_FOUND,
                  basePath: BASEPATH.COMPONENT,
                  targetId: TARGET_ID.DATA_OUTPUT,
                });
                hideLoader();
              }
            }
          );
        } else {
          console.log("outer idsubf vjdfvdf");
          await loadCssAndHtmlFile({
            componentName: COMPONENTS.OPENED_MAIL_NOT_FOUND,
            basePath: BASEPATH.COMPONENT,
            targetId: TARGET_ID.DATA_OUTPUT,
          });
          hideLoader();
        }
      }
    );
  } catch (error) {
    console.error("Error in handleDisputeButton:", error);
    hideLoader();
    displayError();
  }
};

/**
 * Handles click events for sidebar buttons and manages component loading based on button type
 * @param {string} componentName - The name of the component to be loaded
 * @param {HTMLElement} clickedButton - The button element that was clicked
 * @returns {Promise<void>} A promise that resolves when component loading is complete
 *
 * @description
 * This function handles three types of button clicks:
 * 1. Dispute Button (TARGET_ID.DISPUTE_BTN):
 *    - Loads dispute component
 *    - Sets up componentLoaded event listener
 *    - Initializes dispute form with provided data
 *
 * 2. Mail Buttons (SPAM_MAIL, DISPUTE_MAIL):
 *    - Loads mail-specific component script
 *    - Dispatches componentLoaded event
 *
 * 3. Regular Buttons:
 *    - Loads standard component content
 *
 * @fires {CustomEvent} componentLoaded - Dispatched after successful component loading
 * @example
 * // Handle dispute button click
 * await handleButtonClick('dispute', disputeButton);
 *
 * // Handle mail button click
 * await handleButtonClick('spam-mail', spamMailButton);
 *
 * // Handle regular button click
 * await handleButtonClick('details', regularButton);
 */
const handleButtonClick = async (componentName, clickedButton) => {
  currentLoadingOperation = null;
  updateActiveMenuItem(clickedButton);
  if (clickedButton.id === TARGET_ID.DISPUTE_BTN) {
    handleDisputeButton(componentName).then(() => {
      // Add event listener after component loads
      document.addEventListener("componentLoaded", async (event) => {
        if (event.detail.componentName === COMPONENTS.DISPUTE) {
          initializeDisputeForm(event.detail.disputeData);
        }
      });
    });
  } else if (
    clickedButton.id === TARGET_ID.SPAM_MAIL ||
    clickedButton.id === TARGET_ID.DISPUTE_MAIL
  ) {
    document.getElementById("data-output").innerHTML = "";
    loadScript(`/src/pages/${componentName}/${componentName}.js`);
    document.dispatchEvent(
      new CustomEvent("componentLoaded", {
        detail: { componentName },
      })
    );
  } else {
    await handleRegularButton(componentName);
  }
};

/**
 * Initializes click event listeners for all sidebar navigation buttons
 * @description
 * This function:
 * - Iterates through all entries in SIDEBAR_CONFIG
 * - Finds each button by its buttonId
 * - Attaches click event listeners to handle navigation
 * - Triggers handleButtonClick with component name and button element
 *
 * @example
 * // Initialize all sidebar navigation buttons
 * initializeSidebarNavigation();
 *
 * // SIDEBAR_CONFIG structure example:
 * // {
 * //   details: { buttonId: 'details-btn', component: 'details' },
 * //   dispute: { buttonId: 'dispute-btn', component: 'dispute' }
 * // }
 */
const initializeSidebarNavigation = () => {
  Object.values(SIDEBAR_CONFIG).forEach(({ buttonId, component }) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", (event) =>
        handleButtonClick(component, event.currentTarget)
      );
    }
  });
};

// Initialize sidebar navigation
initializeSidebarNavigation();

/**
 * Toggles the sidebar visibility and adjusts the toggle button position
 * @description This function handles the sidebar's show/hide functionality by:
 * - Toggling the 'active' class on the sidebar element
 * - Adjusting the toggle button position with margin
 */
const toggleSidebar = () => {
  const sidebar = document.getElementById("sidebar");
  const toggleSlide = document.getElementById("toggleSlide");

  sidebar.classList.toggle("active");
  toggleSlide.style.marginLeft = "-15px";
};

// Attach click event listener to toggle button
document.getElementById("toggle-btn").addEventListener("click", toggleSidebar);
