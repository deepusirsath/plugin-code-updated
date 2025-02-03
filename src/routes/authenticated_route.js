// This file contains all the routes used in the application that are accessible only after authentication.
// The routes are defined as an array of objects, where each object contains the component name, base path, and target ID.
// The loadAuthenticatedComponents function loads all the components defined in the authenticatedRoutes array.
// The loadComponent function is imported from the content_loader_helper.js file and is used to load the components dynamically.

import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Configuration array defining the authenticated routes and their component details
 * Used to dynamically load components that should only be accessible after user authentication
 *
 * @constant {Array<Object>} authenticatedRoutes
 * @property {string} componentName - Name of the component to be loaded from COMPONENTS constant
 * @property {string} basePath - Base directory path from BASEPATH constant where component is located
 * @property {string} targetId - DOM element ID from TARGET_ID constant where component will be rendered
 *
 * Current routes:
 * 1. Sidebar component - Renders in the sidebar container
 * 2. Details component - Renders in the main data output container
 */
const authenticatedRoutes = [
  {
    componentName: COMPONENTS.SIDEBAR,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.SIDEBAR,
  },
  {
    componentName: COMPONENTS.DETAILS,
    basePath: BASEPATH.PAGES,
    targetId: TARGET_ID.DATA_OUTPUT,
  },
];

/**
 * Loads all authenticated components in parallel using Promise.all
 * Maps over the authenticatedRoutes array and loads each component configuration
 * using the loadComponent helper function
 *
 * @async
 * @function loadAuthenticatedComponents
 * @returns {Promise<void>} Resolves when all components are successfully loaded
 * @example
 * // Load all authenticated components
 * await loadAuthenticatedComponents();
 */
export const loadAuthenticatedComponents = async () => {
  await Promise.all(authenticatedRoutes.map((config) => loadComponent(config)));
};
