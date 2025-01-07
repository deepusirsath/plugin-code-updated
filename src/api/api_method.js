/**
 * Sends a GET request to the specified endpoint.
 * @param {string} endpoint - The API endpoint to request data from.
 * @returns {Promise<Object>} The response data from the server.
 */
async function getData(endpoint) {
  const url = `${baseUrl}${endpoint}`;
  return await apiRequest(url, "GET");
}

/**
 * Sends a POST request to the specified endpoint with the given data.
 * @param {string} endpoint - The API endpoint to send data to.
 * @param {Object} data - The data to send in the request body.
 * @returns {Promise<Object>} The response data from the server.
 */
async function postData(endpoint, data) {
  const url = `${baseUrl}${endpoint}`;
  return await apiRequest(url, "POST", data);
}

/**
 * Sends a PUT request to the specified endpoint with the given data.
 * @param {string} endpoint - The API endpoint to update data.
 * @param {Object} data - The data to update in the request body.
 * @returns {Promise<Object>} The response data from the server.
 */
async function putData(endpoint, data) {
  const url = `${baseUrl}${endpoint}`;
  return await apiRequest(url, "PUT", data);
}

/**
 * Sends a DELETE request to the specified endpoint.
 * @param {string} endpoint - The API endpoint to delete data from.
 * @param {Object} [data=null] - Optional data to send in the request body.
 * @returns {Promise<Object>} The response data from the server.
 */
async function deleteData(endpoint, data = null) {
  const url = `${baseUrl}${endpoint}`;
  return await apiRequest(url, "DELETE", data);
}
