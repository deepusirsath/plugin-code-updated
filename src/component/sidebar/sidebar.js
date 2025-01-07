import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

const handleClick = async (componentName) => {
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
  .addEventListener("click", () => handleClick(COMPONENTS.DETAILS));
document
  .getElementById("dispute-mail")
  .addEventListener("click", () => handleClick(COMPONENTS.DISPUTE_MAIL));
document
  .getElementById("spam-mails")
  .addEventListener("click", () => handleClick(COMPONENTS.SPAM_MAIL));
document
  .getElementById("activity-btn")
  .addEventListener("click", () => handleClick(COMPONENTS.ACTIVITY));
document
  .getElementById("dispute-btn")
  .addEventListener("click", () => handleClick(COMPONENTS.DISPUTE));
