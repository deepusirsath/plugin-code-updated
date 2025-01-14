import { postData } from "/src/api/api_method.js";
import { COMPONENTS } from "/src/constant/component.js";
import { displayError } from "/src/helper/display_error.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { GET_ALLOCATION_DATA } from "/src/routes/api_route.js";

export const getAllDetails = async () => {
  document.getElementById("details-box").style.display = "none";

  showLoader();

  try {
    const licenseId =
      "c6ef942170cda72c2d1c9bb3fcfbc5003144e03f6cc3eeed15feae8407fc3b9b";
    const requestData = {
      licenseId: licenseId,
    };
    const response = await postData(`${GET_ALLOCATION_DATA}`, requestData);
    const allocated_to = response.data.allocated_to;
    const allocated_date = response.data?.valid_from;
    const allocated_till = response.data?.valid_till;

    // Update all elements with details-value class
    const detailsValues = document.querySelectorAll("#details-value");
    detailsValues[0].textContent = allocated_to || "Not allocated";
    detailsValues[1].textContent = allocated_date || "Not specified";
    detailsValues[2].textContent = allocated_till || "Not specified";

    document.getElementById("details-box").style.display = "block";

    hideLoader();
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.DETAILS) {
    getAllDetails();
  }
});

getAllDetails();
