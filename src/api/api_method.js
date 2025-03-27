import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { apiRequest } from "./api_request.js";
import config from "../../config.js";

/**
 * Sends a GET request to the specified endpoint.
 * @param {string} endpoint - The API endpoint to request data from.
 * @returns {Promise<Object>} The response data from the server.
 */
export async function getData(endpoint) {
  const url = `${config.BASE_URL}${endpoint}`;
  return await apiRequest(url, "GET");
}

/**
 * Sends a POST request to the specified endpoint with the given data.
 * @param {string} endpoint - The API endpoint to send data to.
 * @param {Object} data - The data to send in the request body.
 * @param {string} [refresh_token] - The authentication token to include in the request.
 * @returns {Promise<Object>} The response data from the server.
 */
export async function postData(endpoint, data, refresh_token) {
  const url = `${config.BASE_URL}${endpoint}`;

  try {
    if (refresh_token && refresh_token.refresh_token) {
      return await apiRequest(url, "POST", data, {
        Authorization: `Bearer ${refresh_token.refresh_token}`,
      });
    } else {
      return await apiRequest(url, "POST", data);
    }
  } catch (error) {
    if (error.status === 401) {
      loadComponent({
        componentName: COMPONENTS.TOKEN_EXPIRE,
        basePath: BASEPATH.PAGES,
        targetId: TARGET_ID.DATA_OUTPUT,
      });
    }
    throw error;
  }
}
