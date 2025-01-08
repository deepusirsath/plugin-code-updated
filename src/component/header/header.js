/**
 * Handles the window close action when close button is clicked
 * @function handleCloseWindow
 * @returns {void}
 */
function handleCloseWindow() {
  window.close();
}

// Event listener for close button click
document
  .getElementById("closeButton")
  .addEventListener("click", handleCloseWindow);
