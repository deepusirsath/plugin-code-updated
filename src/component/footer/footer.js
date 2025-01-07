/**
 * Executes the copyright year update by setting the current year in the DOM.
 */
const showCurrentYear = () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();
};

showCurrentYear();
