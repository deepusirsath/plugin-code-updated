/**
 * Attaches a click event listener to the refresh button and executes the provided callback
 * 
 * @function handleRefresh
 * @param {Function} callback - The function to be executed when refresh button is clicked
 * @description
 * - Finds the refresh button element by ID 'refresh-button'
 * - Adds click event listener if button exists
 * - Validates and executes the callback if it's a valid function
 * 
 * @example
 * handleRefresh(() => {
 *   // Refresh logic here
 *   loadData();
 * });
 */
export const handleRefresh = (callback) => {
  const refreshButton = document.getElementById("refresh-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      if (typeof callback === "function") {
        callback();
      }
    });
  }
};

