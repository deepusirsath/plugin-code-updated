/**
 * Helper functions for loading external HTMl content and Js scripts
 */

/**
 * Loads HTML content from a specified URL asynchronously
 * @param {string} url - The URL from which to fetch the HTML content
 * @returns {Promise<string>} The HTML content as text
 * @throws {Error} Logs error to console if fetch fails
 * 
 * @example
 * const content = await loadHTMLContent('https://example.com/content.html');
 */
export const loadHTMLContent = async (url) => {
  console.log("Loading HTML content from:", url);
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error("Error loading HTML content:", error);
  }
};

/**
 * Dynamically loads a JavaScript file by injecting a script tag into the document body
 * @param {string} scriptUrl - The URL of the JavaScript file to load
 * 
 * @example
 * loadScript('https://example.com/script.js');
 */
export const loadScript = (scriptUrl) => {
  const script = document.createElement("script");
  script.type = 'module';
  script.src = scriptUrl;
  document.body.appendChild(script);
  return script;
};

/**
 * Dynamically loads a component by fetching its HTML content and JavaScript file
 * 
 * @param {Object} config - Configuration object containing component details
 * @param {string} config.componentName - Name of the component to load (e.g. 'header', 'sidebar')
 * @param {string} config.basePath - Base path where components are located ('component' or 'pages')
 * @param {string} config.targetId - HTML element ID where the component will be inserted
 * 
 * @returns {Promise<void>} Resolves when component is loaded and inserted
 * 
 * @throws {Error} If target element is not found or HTML content cannot be loaded
 * 
 * @example
 * // Load a header component
 * await loadComponent({
 *   componentName: 'header',
 *   basePath: 'component',
 *   targetId: 'header-container'
 * });
 * 
 * @description
 * This function performs the following steps:
 * 1. Constructs file paths for HTML and JS files based on the component name
 * 2. Fetches the HTML content using loadHTMLContent()
 * 3. Injects the HTML into the specified target element
 * 4. Loads and executes the associated JavaScript file
 */
export const loadComponent = async ({ componentName, basePath, targetId }) => {
  const fileName = `/src/${basePath}/${componentName}/${componentName}`;
  const htmlContent = await loadHTMLContent(`${fileName}.html`);
  document.getElementById(targetId).innerHTML = htmlContent;
  loadScript(`${fileName}.js`);
};