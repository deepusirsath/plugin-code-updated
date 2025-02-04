/**
 * Displays an error message in the UI by clearing existing content and showing formatted error text
 * 
 * @param {string} message - The error message to display
 * 
 * @example
 * displayError('Network connection failed');
 * // Clears data-output element
 * // Shows "Loading error: Network connection failed" in errorDisplay element
 */
export const displayError = (message) => {
  document.getElementById("data-output").innerHTML = "";
  document.getElementById(
    "errorDisplay"
  ).innerHTML = `Loading error: ${message}`;
};
