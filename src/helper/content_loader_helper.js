/**
 * Helper functions for loading external HTML content, JS scripts, and CSS files
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
  script.type = "module";
  script.src = scriptUrl;
  document.body.appendChild(script);
  return script;
};

/**
 * Dynamically loads a CSS file by injecting a link tag into the document head
 * @param {string} cssUrl - The URL of the CSS file to load
 *
 * @example
 * loadCSS('https://example.com/style.css');
 */
export const loadCSS = (cssUrl) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssUrl;
  document.head.appendChild(link);
  return link;
};

/**
 * Dynamically loads a component by fetching its HTML content, JavaScript file, and CSS file
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

  // Load HTML content
  const htmlContent = await loadHTMLContent(`${fileName}.html`);
  document.getElementById(targetId).innerHTML = htmlContent;

  // Load JavaScript file
  loadScript(`${fileName}.js`);

  // Load CSS file
  loadCSS(`${fileName}.css`);
};


/**
 * Dynamically loads HTML content and CSS file for a component
 * 
 * @param {Object} config - Configuration object for component loading
 * @param {string} config.componentName - Name of the component (e.g. 'header', 'sidebar')
 * @param {string} config.basePath - Base directory path where component files are located (e.g. 'component', 'pages')
 * @param {string} config.targetId - ID of the HTML element where content will be inserted
 * 
 * @returns {Promise<void>} Resolves when HTML and CSS are loaded
 * 
 * @example
 * // Load HTML and CSS for a sidebar component
 * await loadCssAndHtmlFile({
 *   componentName: 'sidebar',
 *   basePath: 'component',
 *   targetId: 'sidebar-container'
 * });
 * 
 * @description
 * This function:
 * 1. Constructs file paths based on component name and base path
 * 2. Loads and injects HTML content into specified target element
 * 3. Loads associated CSS file into document head
 * Does not load JavaScript files, unlike the loadComponent function
 */
export const loadCssAndHtmlFile = async ({
  componentName,
  basePath,
  targetId,
}) => {
  const fileName = `/src/${basePath}/${componentName}/${componentName}`;

  // Load HTML content
  const htmlContent = await loadHTMLContent(`${fileName}.html`);
  document.getElementById(targetId).innerHTML = htmlContent;

  // Load CSS file
  loadCSS(`${fileName}.css`);
};


