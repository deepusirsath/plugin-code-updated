// This file is used to define the routes that are accessible to unauthenticated users.
// The routes are defined as an array of objects, where each object contains the component name, base path, and target ID.
// The loadUnauthenticatedComponents function loads all the components defined in the unauthenticatedRoutes array.
// The loadComponent function is imported from the content_loader_helper.js file and is used to load the components dynamically.

import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Configuration array for unauthenticated user routes
 *
 * Defines the component configuration for users who haven't registered yet.
 * Currently contains the registration component setup with:
 *
 * @property {Array<Object>} - UnauthenticatedRoute
 * @property {string} componentName - Name of the component to be loaded from COMPONENTS constant
 * @property {string} basePath -  Base directory path from BASEPATH constant where component is located
 * @property {string} targetId - DOM element ID from TARGET_ID constant where component will be rendered
 *
 * Used by loadUnauthenticatedComponents() to dynamically load and render
 * the registration form for new users.
 */
const UnauthenticatedRoute = [
  {
    componentName: COMPONENTS.TOKEN_EXPIRE,
    basePath: BASEPATH.PAGES,
    targetId: TARGET_ID.DATA_OUTPUT,
  },
];

/**
 * Loads all unauthenticated components concurrently
 *
 * This async function takes the UnauthenticatedRoute array which contains component configurations
 * and loads them in parallel using Promise.all. Each component config contains:
 * - componentName: Name of the component from COMPONENTS enum
 * - basePath: Base path from BASEPATH enum
 * - targetId: Target DOM element ID from TARGET_ID enum
 *
 * The function uses the loadComponent helper to load and render each component.
 *
 * @returns {Promise<void>} Resolves when all components are loaded
 */
export const loadUnauthenticatedComponents = async () => {
  await Promise.all(
    UnauthenticatedRoute.map((config) => loadComponent(config))
  );
};
