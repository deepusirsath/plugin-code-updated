import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

export const initializeViewDetail = (emailData) => {
  const senderElement = document.getElementById("sender-email");
  const subjectElement = document.getElementById("email-subject");
  const bodyElement = document.getElementById("email-body");

  // Populate the data
  senderElement.textContent = emailData.sender;
  subjectElement.textContent = emailData.subject;
  bodyElement.textContent = emailData.body;

  // Handle close button with direct selector and cleanup
  const closeButton = document.querySelector(".close-popup");
  if (closeButton) {
    const closeHandler = async () => {
      await loadComponent({
        componentName: COMPONENTS.SPAM_MAIL,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.DATA_OUTPUT,
      });
      closeButton.removeEventListener("click", closeHandler);
    };

    closeButton.addEventListener("click", closeHandler);
  }
};
