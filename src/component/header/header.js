/**
 * Handles the window close action when close button is clicked.
 * This function is triggered when the user clicks the close button
 * in the plugin window header. It uses the window.close() method
 * to close the current window/popup. If it fails, it logs an error
 * or provides a fallback mechanism.
 *
 * @function handleCloseWindow
 * @returns {void}
 */
const handleCloseWindow = () => {
  try {
    window.close();
    // Check if the window is still open
    if (!window.closed) {
      console.warn("Window close attempt failed. Please try again.");
    }
  } catch (error) {
    alert("Unable to close the window automatically. Please close it manually by clicking on the plugin icon or anywhere outside the panel.");
  }
};

// Event listener for close button click
document
  .getElementById("closeButton")
  .addEventListener("click", handleCloseWindow);
