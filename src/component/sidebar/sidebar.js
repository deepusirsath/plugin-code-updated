import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

const handleButtonClick = async (componentName) => {
  try {
    await loadComponent({
      componentName,
      basePath: BASEPATH.PAGES,
      targetId: TARGET_ID.DATA_OUTPUT,
    });
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
};

document
  .getElementById("details-btn")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.DETAILS));
document
  .getElementById("dispute-mail")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.DISPUTE_MAIL));
document
  .getElementById("spam-mails")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.SPAM_MAIL));
document
  .getElementById("activity-btn")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.ACTIVITY));
document
  .getElementById("dispute-btn")
  .addEventListener("click", () => handleButtonClick(COMPONENTS.DISPUTE));
