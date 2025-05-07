import { ERROR_MESSAGES } from "/src/constant/error_message.js";
import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

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

  const { access_token } = await chrome.storage.local.get(["access_token"]);

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
      try {
        // Set registration to false and ensure it completes
        await chrome.storage.local.set({ registration: false });
        console.log("Registration set to false due to 401 error");
        
        // Remove access token and ensure it completes
        await chrome.storage.local.remove("access_token");
        console.log("Access token removed due to 401 error");
        
        const dataOutputElement = document.getElementById(TARGET_ID.DATA_OUTPUT);
        if (dataOutputElement) {
          dataOutputElement.innerHTML = "";
        }

        const sidebarElement = document.getElementById(TARGET_ID.SIDEBAR);
        if (sidebarElement) {
          sidebarElement.style.display = "none";
        }

        loadComponent({
          componentName: COMPONENTS.TOKEN_EXPIRE,
          basePath: BASEPATH.PAGES,
          targetId: TARGET_ID.DATA_OUTPUT,
        });
      } catch (storageError) {
        console.error("Failed to update storage on 401 error:", storageError);
        // Retry storage operation
        setTimeout(async () => {
          try {
            await chrome.storage.local.set({ registration: false });
            await chrome.storage.local.remove("access_token");
          } catch (retryError) {
            console.error("Retry failed:", retryError);
          }
        }, 500);
      }

      // Return a special object to indicate token expiry instead of throwing an error
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
