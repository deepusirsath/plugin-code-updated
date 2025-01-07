/**
 * Updates the copyright year in the footer to the current year
 * Targets an element with id "currentYear" and sets its text content
 */
const updateCopyrightYear = () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();
};

// Execute the copyright year update
updateCopyrightYear();
