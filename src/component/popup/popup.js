import { authenticatedRoutes } from "/src/routes/authenticated_route.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { UnauthenticatedRoute } from "/src/routes/unauthenticated_route.js";

const loadAuthenticatedComponents = async () => {
  await Promise.all(authenticatedRoutes.map((config) => loadComponent(config)));
};

const loadRegistrationComponent = async () => {
  await Promise.all(UnauthenticatedRoute.map((config) => loadComponent(config)));
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // const isUserLoggedIn = localStorage.getItem("userToken");
    const isUserLoggedIn = true;
    if (isUserLoggedIn) {
      await loadAuthenticatedComponents();
    } else {
      await loadRegistrationComponent();
    }
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
});
