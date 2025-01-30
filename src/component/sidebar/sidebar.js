import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { displayError } from "/src/helper/display_error.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { initializeDisputeForm } from "/src/pages/dispute/dispute.js";
import { SIDEBAR_CONFIG } from "./sidebar_config.js";
import { setCurrentSearchQuery } from "/src/pages/spam-mail/spam-mail.js";

/**
 * Updates the active state of menu items in the sidebar
 * @param {HTMLElement} clickedButton - The button element that was clicked in the sidebar
 * @description This function:
 * - Removes 'active' class from all menu items
 * - Adds 'active' class to the clicked menu item's parent
 * - Clears any existing error messages
 * @example
 * // When a sidebar button is clicked
 * updateActiveMenuItem(buttonElement);
 */
const updateActiveMenuItem = (clickedButton) => {
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => item.classList.remove("active"));
  clickedButton.closest(".menu-item").classList.add("active");
  document.getElementById("errorDisplay").innerHTML = "";

  const searchInput = document.getElementById("search-input");

  const clearButton = document.getElementById("clearButton");
  if (searchInput) {
    searchInput.value = "";
    setCurrentSearchQuery("");
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
    displayError(error);
  }
};

const handleDisputeButton = async (componentName) => {
  try {
    chrome.runtime.sendMessage(
      { action: "checkEmailPage" },
      async function (response) {
        const openedServices = ["OpenedGmail", "OpenedOutlook", "OpenedYahoo", "Gmail"];
        console.log(response);
        if (openedServices.includes(response)) {
          chrome.runtime.sendMessage(
            { action: "checkDispute" },
            async function (disputeResponse) {
              console.log(disputeResponse);
              if (disputeResponse?.error === "Not found") {
                await loadComponent({
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
                document.dispatchEvent(
                  new CustomEvent("componentLoaded", {
                    detail: { componentName, disputeData: disputeResponse },
                  })
                );
              }
            }
          );
        } else {
          await loadComponent({
            componentName: COMPONENTS.OPENED_MAIL_NOT_FOUND,
            basePath: BASEPATH.COMPONENT,
            targetId: TARGET_ID.DATA_OUTPUT,
          });
        }
      }
    );
  } catch (error) {
    displayError(error);
  }
};

/**
 * Handles the click events for sidebar navigation buttons by loading corresponding components
 * @param {string} componentName - The name of the component to be loaded
 * @param {HTMLElement} clickedButton - The button element that was clicked
 * @returns {Promise<void>} A promise that resolves when the component is loaded and rendered
 * @throws {Error} If component loading fails, error is caught and displayed in errorDisplay element
 * @fires {CustomEvent} componentLoaded - Dispatched when component is successfully loaded
 */
const handleButtonClick = async (componentName, clickedButton) => {
  updateActiveMenuItem(clickedButton);
  if (clickedButton.id === "dispute-btn") {
    handleDisputeButton(componentName).then(() => {
      // Add event listener after component loads
      document.addEventListener("componentLoaded", async (event) => {
        if (event.detail.componentName === COMPONENTS.DISPUTE) {
          initializeDisputeForm(event.detail.disputeData);
        }
      });
    });
  } else {
    await handleRegularButton(componentName);
  }
};

/**
 * Initializes sidebar navigation by attaching click handlers to buttons
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
