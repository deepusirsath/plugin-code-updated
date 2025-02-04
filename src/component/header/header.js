/**
 * Handles the window close action when close button is clicked.
 * This function is triggered when the user clicks the close button
 * in the plugin window header. It uses the window.close() method
 * to close the current window/popup.
 * 
 * @function handleCloseWindow
 * @returns {void}
 */
const handleCloseWindow = () => {
  window.close();
};

// Event listener for close button click
document
  .getElementById("closeButton")
  .addEventListener("click", handleCloseWindow);
