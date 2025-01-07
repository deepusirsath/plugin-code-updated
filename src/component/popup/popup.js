import {
  loadHTMLContent,
  loadScript,
} from "/src/helper/content_loader_helper.js";
import { COMPONENTS } from "/src/constant/component_constant.js";

/**
 * Dynamically loads a component by fetching its HTML content and JavaScript file
 *
 * @param {string} componentName - The name of the component to load (e.g. 'header', 'sidebar')
 * @returns {Promise<void>} A promise that resolves when the component is loaded
 *
 * @example
 * // Load the header component
 * await loadComponent('header');
 *
 * @description
 * The function performs the following steps:
 * 1. Constructs the file path using the component name
 * 2. Loads the HTML content from componentName.html
 * 3. Injects the HTML into the container with id "{componentName}-container"
 * 4. Loads and executes the associated JavaScript file
 *
 * @requires
 * - loadHTMLContent from content_loader_helper.js
 * - loadScript from content_loader_helper.js
 * - A container element with id "{componentName}-container" must exist in the DOM
 */
const loadComponent = async (componentName) => {
  const fileName = `/src/component/${componentName}/${componentName}`;
  const htmlContent = await loadHTMLContent(`${fileName}.html`);
  document.getElementById(`${componentName}-container`).innerHTML = htmlContent;
  loadScript(`${fileName}.js`);
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([
      loadComponent(COMPONENTS.HEADER),
      loadComponent(COMPONENTS.SIDEBAR),
      loadComponent(COMPONENTS.FOOTER),
    ]);
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
});
