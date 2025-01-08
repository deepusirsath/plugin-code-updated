/**
 * Executes the copyright year update by setting the current year in the DOM.
 * @description Updates the element with id="currentYear" with the current year
 * @example
 * // Updates <span id="currentYear">2024</span> automatically
 */
const showCurrentYear = () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();
};

showCurrentYear();
