import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { displayError } from "/src/helper/display_error.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Handles the click events for sidebar navigation buttons by loading corresponding components
 * @param {string} componentName - The name of the component to be loaded
 * @param {HTMLElement} clickedButton - The button element that was clicked
 * @returns {Promise<void>} A promise that resolves when the component is loaded and rendered
 * @throws {Error} If component loading fails, error is caught and displayed in errorDisplay element
 * @fires {CustomEvent} componentLoaded - Dispatched when component is successfully loaded
 */
const handleButtonClick = async (componentName, clickedButton) => {
  try {
    const menuItems = document.querySelectorAll(".menu-item");

    // Remove active class from all menu items
    menuItems.forEach((item) => item.classList.remove("active"));

    // Add active class to clicked menu item
    clickedButton.closest(".menu-item").classList.add("active");
    document.getElementById("errorDisplay").innerHTML = "";

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
 * @listens click
 * @param {Event} e - Click event object
 * @fires handleButtonClick
 *
 * The handleButtonClick function:
 * - Takes a component identifier and the clicked button element
 * - Handles component loading and rendering
 * - Component content is rendered in the designated output container
 * - Any errors during loading are handled appropriately
 */
document
  .getElementById("details-btn")
  .addEventListener("click", (e) =>
    handleButtonClick(COMPONENTS.DETAILS, e.currentTarget)
  );
document
  .getElementById("dispute-mail")
  .addEventListener("click", (e) =>
    handleButtonClick(COMPONENTS.DISPUTE_MAIL, e.currentTarget)
  );
document
  .getElementById("spam-mails")
  .addEventListener("click", (e) =>
    handleButtonClick(COMPONENTS.SPAM_MAIL, e.currentTarget)
  );
document
  .getElementById("activity-btn")
  .addEventListener("click", (e) =>
    handleButtonClick(COMPONENTS.ACTIVITY, e.currentTarget)
  );
document
  .getElementById("dispute-btn")
  .addEventListener("click", (e) =>
    handleButtonClick(COMPONENTS.DISPUTE, e.currentTarget)
  );

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
