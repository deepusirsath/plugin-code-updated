import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Handles the click events for sidebar navigation buttons by loading corresponding components
 * @param {string} componentName - The name of the component to be loaded
 * @returns {Promise<void>} A promise that resolves when the component is loaded
 * @throws {Error} If component loading fails, error is displayed in errorDisplay element
 */
const handleButtonClick = async (componentName) => {
  try {
    await loadComponent({
      componentName,
      basePath: BASEPATH.PAGES,
      targetId: TARGET_ID.DATA_OUTPUT,
    });
    document.dispatchEvent(new CustomEvent('componentLoaded', { 
      detail: { componentName } 
    }));
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
};

/**
 * Event Listeners Setup
 * Attaches click event listeners to sidebar navigation buttons
 * Each button triggers handleButtonClick with its corresponding component:
 * - details-btn: Loads the details component
 * - dispute-mail: Loads the dispute mail component
 * - spam-mails: Loads the spam mails component
 * - activity-btn: Loads the activity component
 * - dispute-btn: Loads the dispute component
 *
 * When clicked, each button:
 * 1. Triggers an async component load operation
 * 2. Renders the component in the TARGET_ID.DATA_OUTPUT container
 * 3. Displays any loading errors in the errorDisplay element
 */
document
  .getElementById("details-btn")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.DETAILS));
document
  .getElementById("dispute-mail")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.DISPUTE_MAIL));
document
  .getElementById("spam-mails")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.SPAM_MAIL));
document
  .getElementById("activity-btn")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.ACTIVITY));
document
  .getElementById("dispute-btn")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.DISPUTE));

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
