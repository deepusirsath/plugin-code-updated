import { authenticatedRoutes } from "/src/routes/authenticated_route.js";
import { displayError } from "/src/helper/display_error.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { UnauthenticatedRoute } from "/src/routes/unauthenticated_route.js";

const loadAuthenticatedComponents = async () => {
  await Promise.all(authenticatedRoutes.map((config) => loadComponent(config)));
};

const loadRegistrationComponent = async () => {
  await Promise.all(
    UnauthenticatedRoute.map((config) => loadComponent(config))
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // const isUserLoggedIn = localStorage.getItem("userToken");
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
});
