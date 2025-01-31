/**
 * Validates a field value against a set of validation rules
 * 
 * @param {*} value - The value to validate
 * @param {Array<{condition: Function, message: string}>} rules - Array of validation rules
 *        Each rule object contains:
 *        - condition: Function that returns true if validation fails
 *        - message: Error message to display if validation fails
 * @param {HTMLElement} errorElement - DOM element to display error messages
 * @returns {boolean} Returns true if validation passes, false if it fails
 * 
 * @example
 * const rules = [
 *   { 
 *     condition: (value) => value.length < 3,
 *     message: "Must be at least 3 characters"
 *   }
 * ];
 * const errorEl = document.getElementById("error-msg");
 * const isValid = validateField("ab", rules, errorEl);
 */
export const validateField = (value, rules, errorElement) => {
  const error = rules.find((rule) => rule.condition(value));
  errorElement.textContent = error ? error.message : "";
  return !error;
};
