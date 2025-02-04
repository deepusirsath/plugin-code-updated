// This file contains the common route configuration for the application.
// It includes the base path for components, the target ID for the header and footer,
// and the components to be loaded. It also defines a function to load all unauthenticated components concurrently.
// The loadCommonComponents function uses the loadComponent helper to load each component in parallel.

import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

/**
 * Configuration array defining the common components that should be loaded on all pages
 *
 * @constant {Array<Object>} commonComponents
 * @property {string} componentName - Name of the component from COMPONENTS enum
 * @property {string} basePath - Base directory path from BASEPATH enum where component is located
 * @property {string} targetId - DOM element ID from TARGET_ID enum where component will be rendered
 *
 * Current components:
 * 1. Header component - Renders in the header container
 * 2. Footer component - Renders in the footer container
 *
 * These components are loaded regardless of authentication state or page context
 */
const commonComponents = [
  {
    componentName: COMPONENTS.HEADER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.HEADER,
  },
  {
    componentName: COMPONENTS.FOOTER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.FOOTER,
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
export const loadCommonComponents = async () => {
  await Promise.all(commonComponents.map((config) => loadComponent(config)));
};
