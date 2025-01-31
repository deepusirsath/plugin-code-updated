import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Shows the loader component by loading it into the designated container
 * Uses the loadComponent helper to inject the loader HTML into the DOM
 *
 * @function showLoader
 * @returns {void}
 */
export const showLoader = () => {
  loadComponent({
    componentName: COMPONENTS.LOADER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.LOADER_CONTAINER,
  });
};

/**
 * Hides the loader component by clearing its container
 * Removes the loader from the DOM by setting innerHTML to empty string
 *
 * @function hideLoader
 * @returns {void}
 */
export const hideLoader = () => {
  document.getElementById(TARGET_ID.LOADER_CONTAINER).innerHTML = "";
};
