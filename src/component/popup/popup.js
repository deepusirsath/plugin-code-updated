import { authenticatedRoutes } from "/src/routes/authenticated_route.js";
import { displayError } from "/src/helper/display_error.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { UnauthenticatedRoute } from "/src/routes/unauthenticated_route.js";
import { COMPONENTS } from "/src/constant/component.js";
import { BASEPATH } from "/src/constant/basepath.js";
import { TARGET_ID } from "/src/constant/target_id.js";

const loadAuthenticatedComponents = async () => {
  await Promise.all(authenticatedRoutes.map((config) => loadComponent(config)));
};

const loadRegistrationComponent = async () => {
  await Promise.all(
    UnauthenticatedRoute.map((config) => loadComponent(config))
  );
};

const EMAIL_PAGES = [
  "Gmail",
  "Outlook",
  "OpenedGmail",
  "OpenedOutlook",
  "Yahoo",
  "OpenedYahoo",
];

function isEmailPage(pageName) {
  return EMAIL_PAGES.includes(pageName);
}

// Handle the email page check response
async function handleEmailPageResponse(response) {
  if (isEmailPage(response)) {
    try {
      const isUserLoggedIn = true;
      if (isUserLoggedIn) {
        await loadAuthenticatedComponents();
        const detailsBtn = document.getElementById("details-btn");
        if (detailsBtn) {
          detailsBtn.click();
          detailsBtn.closest(".menu-item").classList.add("active");
        }
      } else {
        await loadRegistrationComponent();
      }
    } catch (error) {
      displayError(error);
    }
  } else {
    loadComponent({
      componentName: COMPONENTS.HEADER,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.HEADER,
    });
    loadComponent({
      componentName: COMPONENTS.FOOTER,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.FOOTER,
    });

    loadComponent({
      componentName: COMPONENTS.EMAIL_PAGE_NOT_FOUND,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  chrome.runtime.sendMessage({ action: "checkEmailPage" }, (response) => {
    handleEmailPageResponse(response);
  });
});
