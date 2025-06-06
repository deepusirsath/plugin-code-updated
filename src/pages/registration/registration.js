import { ERROR_MESSAGES } from "/src/constant/error_message.js";
import { postData } from "/src/api/api_method.js";
import { validateField } from "/src/helper/validation_helper.js";
import { validationConfig } from "/src/pages/registration/validation-config.js";
import { showCustomAlert } from "/src/component/custom_alert/custom_alert.js";

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
    errorDisplay.textContent = ERROR_MESSAGES.LICENSE_ID_INVALID;
    return false;
  }

  errorDisplay.textContent = "";
  try {
    const response = await postData("/license/verify", { licenseId });

    if (response.success) {
      document.getElementById("email").value = response.data.email;
      browser.storage.local.set({ license_Id: licenseId });
      return true;
    }

    errorDisplay.textContent =
      response.message || ERROR_MESSAGES.LICENSE_ID_NOT_CORRECT;
  } catch (error) {
    errorDisplay.textContent = ERROR_MESSAGES.SOMETHING_WENT_WRONG;
  }
  return false;
};

document
  .getElementById("licenseId")
  .addEventListener("input", async function () {
    await validateLicenseId(this.value.trim());
  });

document.getElementById("submit").addEventListener("click", async function () {
  const formElements = {
    licenseId: document.getElementById("licenseId").value,
    pluginId: document.getElementById("pluginId").value,
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    mobile: document.getElementById("mobile").value,
    ipAddress: document.getElementById("ipAddress").value,
    browser: document.getElementById("browser").value,
  };

  try {
    const response = await postData("/register", {
      ...formElements,
      macAddress,
      serialNumber,
      osType,
      osPlatform,
      osRelease,
      hostName: hostname,
      architecture: arch,
      uuid: uid,
    });

    if (response.success) {
      showCustomAlert("Form submitted successfully.", "success");
      browser.storage.local.set({ registration: true });
      browser.runtime.sendMessage({ action: "reloadPage" }, function (response) {
        if (response.success) {
          window.close();
        } 
      });
    }
  } catch (error) {
    showCustomAlert(ERROR_MESSAGES.SOMETHING_WENT_WRONG, "error");
  }
});
