import { ERROR_MESSAGES } from "/src/constant/error_message.js";
import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { hideUiElement } from "/src/helper/hide_ui_element_helper.js";

/**
 * Sends an HTTP request to the specified URL.
 * @param {string} url - The API endpoint URL.
 * @param {string} method - The HTTP method (e.g., "GET", "POST", "PUT", "DELETE").
 * @param {Object} [payload=null] - The request body data for POST and PUT requests.
 * @param {Object} [customHeaders] - Optional customHeaders for the request.
 * @returns {Promise<Object|null>} The JSON response from the server if successful, or null if status is 204.
 * @throws Will throw an error if the request fails.
 */
export async function apiRequest(url, method, payload = null, customHeaders) {
  // Construct the request options

  const { access_token } = await browser.storage.local.get(["access_token"]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: access_token ? `Bearer ${access_token}` : "",
    ...customHeaders,
  };

  const options = {
    method,
    headers,
  };

  // Add payload to options if provided
  if (payload) {
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);

    if (response.status === 401) {
      // Set registration to false and ensure it completes
      await browser.storage.local.set({ registration: false });
      console.log("Registration set to false due to 401 error");

      // Remove access token and ensure it completes
      await browser.storage.local.remove("access_token");
      console.log("Access token removed due to 401 error");

      hideUiElement()

      await loadComponent({
        componentName: COMPONENTS.TOKEN_EXPIRE,
        basePath: BASEPATH.PAGES,
        targetId: TARGET_ID.DATA_OUTPUT,
      });

      return { tokenExpired: true };
    }

    // Check for HTTP errors
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Error ${response.status}: ${errorMessage}`);
    }

    // Return response as JSON or null for 204 No Content
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    console.error(ERROR_MESSAGES.API_FAILED_MESSAGE);
  }
}
