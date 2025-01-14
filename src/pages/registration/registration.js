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

document.getElementById("submit").addEventListener("click", async function () {
  console.log("submit button clicked");
  const formElements = {
    licenseId: document.getElementById("licenseId").value,
    pluginId: document.getElementById("pluginId").value,
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    mobile: document.getElementById("mobile").value,
    ipAddress: document.getElementById("ipAddress").value,
    chrome: document.getElementById("chrome").value,
  };

  // chrome.storage.local.get(["deviceData"], async (result) => {
  //   if (result?.deviceData) {
  //     const {
  //       arch,
  //       hostname,
  //       macAddress,
  //       osPlatform,
  //       osRelease,
  //       osType,
  //       serialNumber,
  //       uid,
  //     } = result.deviceData;
  //   }
  // });

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
      alert("Form submitted successfully");
      chrome.storage.local.set({ registration: true });
    } else {
      alert(response.message || "Failed to submit form");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("Error submitting form");
  }
});
