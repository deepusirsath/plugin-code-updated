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
  script.src = scriptUrl;
  document.body.appendChild(script);
};