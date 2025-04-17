import { COMPONENTS } from "/src/constant/component.js";
import { displayError } from "/src/helper/display_error.js";

/**
 * Formats a date string to a readable format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date or "No Data Found" if no date
 */
const formatDate = (dateString) => {
  if (!dateString) return "No Data Found";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Retrieves and displays license details
 */
export const getAllDetails = async () => {
  const noDataFoundElement = document.getElementById("noDataFound");
  if (noDataFoundElement) {
    noDataFoundElement.innerHTML = "";
  }
  const detailsBox = document.getElementById("details-box");
  detailsBox.style.display = "none";

  try {
    const {
      mac_address = "",
      validFrom = "",
      validTill = "",
    } = await chrome.storage.local.get([
      "mac_address",
      "validFrom",
      "validTill",
    ]);

    const detailsValues = document.querySelectorAll("#details-value");

    if (detailsValues.length >= 3) {
      detailsValues[0].textContent = mac_address || "No Data Found";
      detailsValues[1].textContent = formatDate(validFrom);
      detailsValues[2].textContent = formatDate(validTill);
    }

    detailsBox.style.display = "block";
  } catch (error) {
    displayError();
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.DETAILS) {
    getAllDetails();
  }
});

getAllDetails();
