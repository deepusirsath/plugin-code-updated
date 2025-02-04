// This file contains the email page not found route configuration for the application.
// It includes the base path for components, the target ID for the header and footer,
// and the components to be loaded. It also defines a function to load all unauthenticated components concurrently.
// The loadCommonComponents function uses the loadComponent helper to load each component in parallel.

import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Configuration array for the email page not found route
 * @constant {Array<Object>} notEmailPageRoutes
 * @property {string} componentName - The name of the component to load (EMAIL_PAGE_NOT_FOUND)
 * @property {string} basePath - The base path for component location (BASEPATH.COMPONENT)
 * @property {string} targetId - The DOM element ID where component will be rendered (TARGET_ID.DATA_OUTPUT)
 */
const notEmailPageRoutes = [
  {
    componentName: COMPONENTS.EMAIL_PAGE_NOT_FOUND,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.DATA_OUTPUT,
  },
];

/**
 * Loads all components defined in notEmailPageRoutes concurrently
 * @async
 * @function loadNotEmailPageComponents
 * @returns {Promise<void>} Resolves when all components are loaded
 * @description Uses Promise.all to load the EMAIL_PAGE_NOT_FOUND component in parallel,
 * mapping through the route configurations and utilizing the loadComponent helper
 */
export const loadNotEmailPageComponents = async () => {
  await Promise.all(notEmailPageRoutes.map((config) => loadComponent(config)));
};
