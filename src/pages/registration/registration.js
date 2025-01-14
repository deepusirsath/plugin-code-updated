import { postData } from "/src/api/api_method.js";
import { validateField } from "/src/helper/validation_helper.js";
import { validationConfig } from "/src/pages/registration/validation-config.js";


// Setup field validators
["name", "mobile", "email"].forEach((field) => {
  document.getElementById(field).addEventListener("input", function () {
    const value = this.value.trim();
    const errorDisplay = document.getElementById(
      `errorDisplay${field.charAt(0).toUpperCase() + field.slice(1)}`
    );
    validateField(value, validationConfig[field], errorDisplay);
  });
});

// License validation
const validateLicenseId = async (licenseId) => {
  const errorDisplay = document.getElementById("errorDisplay");

  if (licenseId.length !== 64) {
    errorDisplay.textContent = "License ID must be exactly 64 characters long";
    return false;
  }

  errorDisplay.textContent = "";
  try {
    const response = await postData("/license/verify", { licenseId });

    if (response.success) {
      document.getElementById("email").value = response.data.email;
      chrome.storage.local.set({ license_Id: licenseId });
      return true;
    }

    errorDisplay.textContent = response.message || "License ID is not correct";
  } catch (error) {
    errorDisplay.textContent = "Error verifying license. Please try again.";
  }
  return false;
};

document
  .getElementById("licenseId")
  .addEventListener("input", async function () {
    await validateLicenseId(this.value.trim());
  });
