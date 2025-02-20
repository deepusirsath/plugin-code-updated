import { ERROR_MESSAGES } from "/src/constant/error_message.js";

/**
 * Displays an error message in the UI by clearing existing content and showing formatted error text
 *
 * @example
 * displayError('Network connection failed');
 * // Clears data-output element
 * // Shows error in errorDisplay element
 */
export const displayError = () => {
  document.getElementById("data-output").innerHTML = "";
  document.getElementById(
    "errorDisplay"
  ).innerHTML = `${ERROR_MESSAGES.SOMETHING_WENT_WRONG}`;
};
