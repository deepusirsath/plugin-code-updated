import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { MAIL_STATUS } from "/src/constant/mail_status.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

// Initialize a flag to track if a popup is currently being processed
let isProcessingClick = false;

/**
 * Creates a "View" button element with dynamic state based on mail status
 *
 * @param {string} sender - Message ID identifier
 * @param {string|number} status - Mail status to determine button state
 * @returns {HTMLButtonElement} Configured view button element
 */
export const createViewButton = (sender, status) => {
  const view_button = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_BUTTON}/${COMPONENTS.VIEW_BUTTON}`;
  loadCSS(`${view_button}.css`);
  
  const button = document.createElement("button");
  button.className = "view-button";
  button.textContent = "View";
  button.dataset.msg_id = sender;
  
  // Replace the standard onclick with a custom one
  const originalOnClick = button.onclick;
  button.onclick = null; // Remove any existing onclick
  
  // Add the click event listener with capture to ensure it runs first
  button.addEventListener("click", function(event) {
    // If already processing a click, prevent this one
    if (isProcessingClick) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log("Prevented multiple view button clicks");
      return false;
    }
    
    // Set the processing flag
    isProcessingClick = true;
    
    // Reset the flag after a delay (adjust timeout as needed)
    setTimeout(() => {
      isProcessingClick = false;
    }, 100); // 1 second delay before allowing another click
    
    // If there was an original onclick, we can call it now
    if (typeof originalOnClick === 'function') {
      return originalOnClick.call(this, event);
    }
  }, true); // true for capture phase to ensure this runs before other handlers
  
  return button;
};

// Add a global document listener to catch all clicks on view buttons
// This is a backup in case buttons are created without using our createViewButton function
document.addEventListener("click", function(event) {
  // Check if the clicked element is a view button
  if (event.target && event.target.classList.contains("view-button")) {
    // If already processing a click, prevent this one
    if (isProcessingClick) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log("Prevented multiple view button clicks (global handler)");
      return false;
    }
    
    // Set the processing flag
    isProcessingClick = true;
    
    // Reset the flag after a delay
    setTimeout(() => {
      isProcessingClick = false;
    }, 2000);
  }
}, true); // true for capture phase
