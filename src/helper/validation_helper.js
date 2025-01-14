// Generic validation function
export const validateField = (value, rules, errorElement) => {
  const error = rules.find((rule) => rule.condition(value));
  errorElement.textContent = error ? error.message : "";
  return !error;
};
