// Import necessary modules
import config from "./config.js";
import {
  CHECK_EMAIL,
  PLUGINS_ENABLE_DISABLE,
  PENDING_STATUS_CHECK,
} from "./src/routes/api_route.js";
import {
  sendDisputeToServer,
  checkAdminComment,
  checkDisputeCount,
} from "./src/pages/dispute/dispute.js";
import {
  checkEmailPageStatus,
  checkGmailUrl,
} from "./src/helper/background_helper.js";

// Define constants
const baseUrl = config.BASE_URL;
let currentMessageId = null;
let latitude = null;
let longitude = null;
let pluginId = null;
let ipAddress = null;
let browserInfo = null;
let operatingSystem = null;
let macId = null;

chrome.storage.local.set({ registration: true });

/** ___________________________________________________________Extension___________________________________________________________ */

async function fetchDeviceDataToSend() {
  try {
    const response = await fetch("http://localhost:3000/deviceIdentifiers");
    if (response.ok) {
      const data = await response.json();
      await chrome.storage.local.set({
        access_token: data?.licenseStatus?.access_token,
      });
      await chrome.storage.local.set({
        refresh_token: data?.licenseStatus?.refresh_token,
      });
      await chrome.storage.local.set({
        mac_address: data?.deviceDetails?.macAdress,
      });
    }
  } catch (error) {
    console.error("Error fetching device data:", error);
  }
}

chrome.storage.local.get(null, function (items) {
  console.log("All Local Storage Data:", items);
});

// Listener for chrome startup
chrome.runtime.onStartup.addListener(async () => {
  const access_token_data = await chrome.storage.local.get(["access_token"]);
  if (!access_token_data?.access_token) {
    fetchDeviceDataToSend();
  }
  userDetails();
});

// Listener for chrome installation
chrome.runtime.onInstalled.addListener(async () => {
  const access_token_data = await chrome.storage.local.get(["access_token"]);
  if (!access_token_data?.access_token) {
    fetchDeviceDataToSend();
  }
  userDetails();
});

// Reloads the current page
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "reloadPage") {
    // Query the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTab = tabs[0];
      // Reload the current tab
      chrome.tabs.reload(currentTab.id, function () {
        sendResponse({ success: true });
      });
    });
    return true; // Keeps the message channel open until sendResponse is called
  }
});

// Listener for chrome runtime message
chrome.management.onEnabled.addListener(() => {
  // Make the fetch request to the server
  const url = baseUrl + PLUGINS_ENABLE_DISABLE;

  fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {})
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
});

/** ___________________________________________________________Information___________________________________________________________ */

async function getExtensionid() {
  return new Promise((resolve) => {
    const extensionId = chrome.runtime.id;
    pluginId = extensionId;
    chrome.storage.local.set({ extensionId: extensionId }, () => {
      resolve();
    });
  });
}

// fetching user Ipv4 address
async function fetchIpAddress() {
  return fetch("https://api64.ipify.org?format=json")
    .then((response) => response.json())
    .then((data) => {
      ipAddress = data.ip;
      chrome.storage.local.set({ ipAddress: data.ip }, () => {
        return data.ip;
      });
    })
    .catch((error) => {
      console.error("Error fetching IP address.", error);
      throw error;
    });
}

// This functions gets the user Browser details with its version
function userBrowserInfo() {
  return new Promise((resolve) => {
    navigator.sayswho = (function () {
      var ua = navigator.userAgent;
      var tem;
      var M =
        ua.match(
          /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
        ) || [];
      if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return "IE " + (tem[1] || "");
      }
      if (M[1] === "Chrome") {
        tem = ua.match(/\b(OPR|Edg)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(" ").replace("OPR", "Opera");
      }
      M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];
      if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
      return M.join(" ");
    })();
    browserInfo = navigator.sayswho;
    chrome.storage.local.set({ browserInfo: navigator.sayswho }, () => {
      resolve();
    });
  });
}

// This function will gets the Operation system of user
function getPlatformInfo() {
  return new Promise((resolve) => {
    chrome.runtime.getPlatformInfo(function (platformInfo) {
      operatingSystem = platformInfo.os;
      chrome.storage.local.set({ operatingSystem: platformInfo.os }, () => {
        resolve();
      });
    });
  });
}

/**
 * Listens for messages sent to the background script and processes geolocation updates.
 *
 * @callback onMessageListener
 * @param {Object} request - The message sent from the content script or another extension component.
 * @param {string} request.type - The type of message being received.
 * @param {Object} request.coordinates - The geolocation coordinates sent in the message.
 * @param {number} request.coordinates.latitude - The latitude of the user's location.
 * @param {number} request.coordinates.longitude - The longitude of the user's location.
 * @param {Object} sender - The sender of the message, containing details about the context.
 * @param {Function} sendResponse - A function to send a response back to the sender (not used in this case).
 *
 * @description
 * If the received message has a `type` of `"geoLocationUpdate"`, the function extracts latitude
 * and longitude from `request.coordinates`, updates global variables, and stores the coordinates
 * in `chrome.storage.local`.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "geoLocationUpdate") {
    const coordinates = request.coordinates;
    latitude = coordinates.latitude;
    longitude = coordinates.longitude;
    chrome.storage.local.set({ coordinates: coordinates }, () => {
      chrome.storage.local.get("coordinates");
    });
  }
});

/**
 * Asynchronously fetches and stores user details.
 *
 * This function retrieves multiple pieces of user information concurrently using `Promise.all`.
 * It fetches the user's IP address, browser information, platform details, and the extension ID.
 * If all promises resolve successfully, a confirmation message is logged to the console.
 * If any of the promises fail, an error message is logged instead.
 *
 * @async
 * @function userDetails
 * @returns {Promise<void>} A promise that resolves once all user details are fetched and processed.
 */
async function userDetails() {
  return Promise.all([
    fetchIpAddress(),
    userBrowserInfo(),
    getPlatformInfo(),
    getExtensionid(),
  ])
    .then(() => {})
    .catch((error) => {
      console.log("Error in userDetails:", error);
    });
}

// ----------------------------------Listeners from Popup Script----------------------------------------------

/**
 * Listens for messages sent to the extension and responds with stored extension data.
 *
 * This listener handles messages with the action "getExtensiondata" and retrieves
 * the extension ID, browser information, and IP address from `chrome.storage.local`.
 * If any data is unavailable, it falls back to default values.
 *
 * @param {Object} request - The message sent to the extension.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - The function to send a response back to the sender.
 * @returns {boolean} Returns true to indicate that the response will be sent asynchronously.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExtensiondata") {
    chrome.storage.local.get(
      ["extensionId", "browserInfo", "ipAddress"],
      (data) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError });
          return;
        }
        const pluginId = data.extensionId || chrome.runtime.id;
        const browserInfo = data.browserInfo || "Unknown";
        const ipAddress = data.ipAddress || "Unknown";
        sendResponse({
          pluginId: pluginId,
          browserInfo: browserInfo,
          ipAddress: ipAddress,
        });
      }
    );
    return true;
  }
});

/**
 * Listens for messages from other parts of the extension and processes the "checkEmailPage" action.
 *
 * @param {Object} request - The message request object.
 * @param {string} request.action - The action to be performed. Expected to be "checkEmailPage".
 * @param {Object} sender - Information about the sender of the message.
 * @param {Function} sendResponse - A function to send a response back to the sender.
 *
 * @returns {boolean} - Returns true to indicate an asynchronous response.
 *
 * Functionality:
 * - When a message with action "checkEmailPage" is received, it waits for 500ms before executing.
 * - It queries the currently active tab in the current window.
 * - If no active tab is found, it sends a `null` response.
 * - Otherwise, it extracts the `url` or `pendingUrl` from the active tab.
 * - The extracted URL and tab ID are passed to the `checkEmailPageStatus` function along with `sendResponse`.
 * - Returning `true` ensures that `sendResponse` is used asynchronously after the timeout.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkEmailPage") {
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0) {
          sendResponse(null);
          return;
        }
        const currentUrl = tabs[0]?.url || tabs[0]?.pendingUrl;
        return checkEmailPageStatus(currentUrl, tabs[0].id, sendResponse);
      });
    }, 500);
    return true;
  }
  return false;
});

/**
 * Listens for messages from other parts of the Chrome extension and handles the "checkDispute" action.
 * When triggered, this function queries the currently active tab, sends a message to fetch the dispute message ID,
 * and then retrieves and processes dispute-related data.
 *
 * @param {Object} request - The message request object sent by another script.
 * @param {string} request.action - The action type, expected to be "checkDispute".
 * @param {Object} sender - Information about the sender of the message.
 * @param {Function} sendResponse - A callback function to send a response back to the sender.
 *
 * If the requested action is "checkDispute":
 * - It retrieves the active tab in the current window.
 * - It sends a message to the content script to fetch the dispute message ID.
 * - If no email ID is found, it responds with an error.
 * - Otherwise, it stores the email in Chrome's local storage.
 * - It asynchronously fetches:
 *   - The dispute count from `checkDisputeCount()`.
 *   - The email status from Chrome local storage.
 *   - Admin remarks from `checkAdminComment()`.
 *   - The dispute status from `checkDisputeStatus()`.
 * - If a dispute is found (`dispute_count > 0`), it determines the final status based on `emailStatus`, `adminRemark`, and `emailStatusData`.
 * - Finally, it sends a structured response containing:
 *   - `status`: The dispute status of the email.
 *   - `messageId`: The email message ID.
 *   - `countRaise`: The number of disputes raised.
 *   - `emailId`: The recipient email ID.
 *   - `senderEmail`: The sender's email address.
 *   - `adminRemark`: Any remarks left by an admin.
 *
 * The function returns `true` to indicate that it will asynchronously send a response.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkDispute") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "fetchDisputeMessageId" },
        (response) => {
          if (!response || !response.emailId) {
            sendResponse({ error: "Not found" });
            return;
          }
          let disputeEmail = response.emailId;
          chrome.storage.local.set({ receiver_email: disputeEmail });
          async function fetchCombinedData() {
            try {
              const { dispute_count } = await checkDisputeCount(
                response.messageId
              );
              const emailStatus = await new Promise((resolve) => {
                chrome.storage.local.get("email_status", function (data) {
                  resolve(data.email_status);
                });
              });
              const adminRemark = await checkAdminComment(
                response.messageId,
                response.emailId
              );
              const emailStatusData = await checkDisputeStatus(
                response.messageId,
                response.emailId
              );

              if (dispute_count > 0) {
                sendResponse({
                  status:
                    emailStatus === "Dispute" && !adminRemark
                      ? "Dispute"
                      : emailStatusData
                      ? emailStatusData
                      : "-",
                  messageId: response.messageId,
                  countRaise: dispute_count,
                  emailId: response.emailId,
                  senderEmail: response.senderEmail,
                  adminRemark: adminRemark,
                });
              } else {
                sendResponse({
                  status: emailStatusData ? emailStatusData : "-",
                  messageId: response.messageId,
                  countRaise: dispute_count,
                  emailId: response.emailId,
                  senderEmail: response.senderEmail,
                  adminRemark: adminRemark,
                });
              }
            } catch (error) {
              sendResponse({ error: "Error fetching combined data" });
            }
          }

          if (response.messageId) {
            fetchCombinedData();
          }
        }
      );
    });
    return true; // Keeps the message channel open for async sendResponse
  }
});

/**
 * Asynchronously checks the dispute status of an email message by sending a request to the server.
 *
 * @async
 * @function checkDisputeStatus
 * @param {string} messageId - The unique identifier of the email message.
 * @param {string} email - The email address associated with the message.
 * @param {Function} sendResponse - A callback function to send the response back.
 * @param {Object} client - The client-related data or identifier.
 * @returns {Promise<string|null>} - Resolves to the `eml_status` value if available, otherwise `null`.
 *
 * @throws {Error} - Logs errors if the request fails.
 *
 * @description
 * This function queries the currently active tab and sends a POST request
 * to the server to check the pending dispute status of an email.
 * If the response contains `eml_status`, it processes the data using
 * `handleEmailScanResponse` and returns the status.
 */
async function checkDisputeStatus(messageId, email, sendResponse, client) {
  const url = `${baseUrl}${PENDING_STATUS_CHECK}`;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = tabs && tabs[0] ? tabs[0].id : null;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: messageId, email: email }),
    });
    const data = await response.json();
    const serverData = data.data;

    if (data?.data?.eml_status) {
      handleEmailScanResponse(serverData, activeTabId, client);
      return data?.data?.eml_status || null;
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * Listener for messages sent to the extension.
 *
 * This function listens for messages from other parts of the extension.
 * If the message contains an action `"dispute"`, it extracts the `messageId`,
 * `reason`, and `emailId` from the request and sends a dispute to the server.
 *
 * @param {Object} request - The message sent to the listener.
 * @param {string} request.action - The action type, expected to be `"dispute"`.
 * @param {string} request.messageId - The unique ID of the email message.
 * @param {string} request.reason - The reason for the dispute.
 * @param {string} request.emailId - The email address associated with the dispute.
 * @param {Object} sender - Information about the sender of the message.
 * @param {Function} sendResponse - Function to send a response back to the sender.
 * @returns {boolean} Returns `true` to indicate an asynchronous response.
 *
 * @example
 * chrome.runtime.sendMessage({
 *   action: "dispute",
 *   messageId: "12345",
 *   reason: "Incorrect classification",
 *   emailId: "user@example.com"
 * });
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == "dispute") {
    const messageId = request.messageId;
    const reason = request.reason;
    const email = request.emailId;
    sendDisputeToServer(reason, email, messageId)
      .then(async (response) => {
        await sendResponse(response);
      })
      .catch((error) => {
        console.error("Error sending dispute to server:", error);
      });
    return true;
  }
});

// -----------------------------------New  Code-----------------------------
/**
 * Asynchronously sends an EML file to the server for email analysis.
 *
 * @async
 * @function sendEmlToServer
 * @param {string} messageId - The unique identifier of the email message.
 * @param {Blob|null} [blob=null] - The email content as a Blob object (required for Gmail and Yahoo).
 * @param {string} client - The email provider (e.g., "gmail", "yahoo", "outlook").
 * @param {string} user_email - The recipient's email address.
 * @throws {Error} If no active tab is available or if the file upload fails.
 * @returns {Promise<void>} Resolves when the email scan response is handled.
 *
 * @description
 * This function collects necessary metadata (such as `messageId`, `macId`, `pluginId`, browser information,
 * and geolocation data) and constructs a `FormData` object. The email file is appended to the form data
 * and sent to the server for analysis. Once the server processes the request, the response is handled using
 * `handleEmailScanResponse()`. If an error occurs during the upload process, it is caught and logged.
 */
async function sendEmlToServer(messageId, blob = null, client, user_email) {
  try {
    console.log("send eml to server start");
    // if (!pluginId) {
    //   await getExtensionid();
    // }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs.length) {
      throw new Error("No active tab available");
    }
    const activeTabId = tabs[0].id;
    const formData = new FormData();

    if (client == "gmail" || client == "yahoo") {
      formData.append("file", blob, "downloaded.eml");
    } else if (client == "outlook") {
      blob = new Blob([blob], { type: "text/plain" });
      formData.append("file", blob, "downloaded.eml");
    }

    formData.append("macId", macId);
    formData.append("messageId", messageId);
    formData.append("pluginId", pluginId);
    formData.append("chrome", browserInfo);
    formData.append("ipv4", ipAddress);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    formData.append("receiverEmail", user_email);

    const url = baseUrl + CHECK_EMAIL;
    // Make the server request
    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Disposition": 'attachment; filename="downloaded.eml"',
      },
    });
    console.log("send successfully");
    const serverData = await uploadResponse.json();
    console.log("serverData", serverData);

    if (serverData.status === "error" || serverData.message === "Bad Request") {
      // Send error message to content script
      chrome.tabs.sendMessage(activeTabId, {
        action: "badRequestServerError",
        client: client,
        details: serverData.details || "",
      });
      return;
    }
    // Handle the response using the separate handler function
    handleEmailScanResponse(serverData, activeTabId, client);
  } catch (error) {
    console.error("Error uploading file to the server:", error);
  }
}

/**
 * Processes the server response for an email scan and updates local storage.
 *
 * @param {Object} serverData - The response data from the server, containing email status and message ID.
 * @param {number} activeTabId - The ID of the active browser tab where the response should be sent.
 * @param {string} client - The client identifier for the request.
 *
 * The function extracts the email's status (`resStatus`) and message ID (`messId`) from the response.
 * If either is missing, it sends an error message to the extension runtime.
 *
 * It then updates `chrome.storage.local` with the status and unsafe reason for the given `messId`.
 * If the `currentMessageId` matches `messId`, it determines an action based on `resStatus`:
 * - `"unsafe"` or `"Unsafe"` → `"blockUrls"`
 * - `"safe"` or `"Safe"` → `"unblock"`
 * - `"pending"` or `"Pending"` → `"pending"`
 *
 * The function sends this action along with `client` and `unsafeReason` to the content script.
 * If the message ID does not match `currentMessageId`, an error message is sent to the runtime.
 */

function handleEmailScanResponse(serverData, activeTabId, client) {
  const resStatus = serverData.eml_status || serverData.email_status;
  const messId = serverData.messageId || serverData.msg_id;
  let unsafeReason = serverData.unsafe_reasons || " ";

  if (typeof resStatus === "undefined" || typeof messId === "undefined") {
    chrome.runtime.sendMessage({
      action: "erroRecievedFromServer",
      client: client,
    });
  }

  chrome.storage.local.get("messages", function (result) {
    let messages = result.messages ? JSON.parse(result.messages) : {};

    // Store both status and unsafeReason for each messageId
    messages[messId] = {
      status: resStatus,
      unsafeReason: unsafeReason,
    };

    chrome.storage.local.set({ messages: JSON.stringify(messages) });

    if (currentMessageId == messId) {
      const statusActions = {
        unsafe: "blockUrls",
        Unsafe: "blockUrls",
        safe: "unblock",
        Safe: "unblock",
        pending: "pending",
        Pending: "pending",
      };

      const action = statusActions[resStatus];

      if (action) {
        chrome.tabs
          .sendMessage(activeTabId, { action, client, unsafeReason })
          .then((response) => {})
          .catch((error) => {
            console.error("Error sending message to content script:", error);
          });
      }
    } else {
      chrome.runtime.sendMessage({
        action: "erroRecievedFromServer",
        client: client,
      });
    }
  });
}

/**
 * Listens for messages from other parts of the Chrome extension and handles pending status checks
 * for different email providers (Gmail, Yahoo, Outlook).
 *
 * @param {Object} message - The message object sent from another part of the extension.
 * @param {string} message.action - The action type to determine the email provider.
 * @param {string} message.messageId - The unique message ID of the email.
 * @param {string} message.emailId - The email ID associated with the message.
 * @param {Object} sender - The sender object providing context about the message source.
 * @param {Function} sendResponse - A function to send a response back to the sender.
 *
 * Actions handled:
 * - "pendingStatusGmail": Checks the pending response status for a Gmail email.
 * - "pendingStatusYahoo": Checks the pending response status for a Yahoo email.
 * - "pendingStatusOutlook": Checks the pending response status for an Outlook email.
 *
 * The function updates `currentMessageId` and calls `checkPendingResponseStatus`
 * with the corresponding email provider.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pendingStatusGmail") {
    const messageId = message.messageId;
    currentMessageId = messageId;
    const email = message.emailId;
    checkPendingResponseStatus(messageId, email, "gmail");
  } else if (message.action === "pendingStatusYahoo") {
    const messageId = message.messageId;
    currentMessageId = messageId;
    const email = message.emailId;
    checkPendingResponseStatus(messageId, email, "yahoo");
  } else if (message.action === "pendingStatusOutlook") {
    const messageId = message.messageId;
    currentMessageId = messageId;
    const email = message.emailId;
    checkPendingResponseStatus(messageId, email, "outlook");
  }
});

/**
 * Asynchronously checks the pending response status for a given email message.
 *
 * This function sends a POST request to the pending status check endpoint with
 * the provided message ID and email. It then retrieves the response data and
 * processes it using the `handleEmailScanResponse` function. Additionally, it
 * ensures that an active tab is available before proceeding.
 *
 * @async
 * @function checkPendingResponseStatus
 * @param {string} messageId - The unique identifier of the email message.
 * @param {string} email - The email address associated with the message.
 * @param {string} client - The client identifier (if applicable) used for processing.
 * @returns {Promise<void>} - Resolves when the status check is complete, or logs an error if it fails.
 *
 * @throws {Error} Logs an error message if the fetch request fails.
 */
async function checkPendingResponseStatus(messageId, email, client) {
  const url = `${baseUrl}${PENDING_STATUS_CHECK}`;

  try {
    // Get active tab first and handle potential empty results
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = tabs && tabs[0] ? tabs[0].id : null;

    if (!activeTabId) {
      return;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: messageId,
        email: email,
      }),
    });
    const data = await response.json();
    const serverData = data.data;

    handleEmailScanResponseOfPending(serverData, activeTabId, client);
  } catch (error) {
    chrome.runtime.sendMessage({
      action: "erroRecievedFromServer",
      client: client,
    });
    console.log("Error in checkPendingResponseStatus:", error);
  }
}

function handleEmailScanResponseOfPending(serverData, activeTabId, client) {
  const resStatus = serverData.eml_status || serverData.email_status;
  const messId = serverData.messageId || serverData.msg_id;
  let unsafeReason = serverData.unsafe_reasons || " ";

  if (typeof resStatus === "undefined" || typeof messId === "undefined") {
    chrome.runtime.sendMessage({
      action: "erroRecievedFromServer",
      client: client,
    });
  }

  chrome.storage.local.get("messages", function (result) {
    let messages = result.messages ? JSON.parse(result.messages) : {};

    // Store both status and unsafeReason for each messageId
    messages[messId] = {
      status: resStatus,
      unsafeReason: unsafeReason,
    };

    chrome.storage.local.set({ messages: JSON.stringify(messages) });

    if (currentMessageId == messId) {
      const statusActions = {
        unsafe: "blockUrls",
        Unsafe: "blockUrls",
        safe: "unblock",
        Safe: "unblock",
      };

      const action = statusActions[resStatus];

      if (action) {
        chrome.tabs
          .sendMessage(activeTabId, { action, client, unsafeReason })
          .then((response) => {})
          .catch((error) => {
            console.error("Error sending message to content script:", error);
          });
      }
    } else {
      chrome.runtime.sendMessage({
        action: "erroRecievedFromServer",
        client: client,
      });
    }
  });
}

/** ________________________________________ Gmail ______________________________________________*/

/**
 * Listener for tab updates in Chrome.
 * This function checks if a tab has finished loading and then verifies if the URL matches a Gmail-related pattern.
 * If a match is found, it sends a message to the content script after a short delay.
 *
 * @param {number} tabId - The ID of the updated tab.
 * @param {object} changeInfo - Contains details about the change in the tab's state.
 * @param {string} changeInfo.status - The status of the tab update (e.g., "loading", "complete").
 * @param {object} tab - The updated tab object.
 * @param {string} tab.url - The URL of the updated tab.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    const urlToCheck = tab.url;
    const matchedKeyword = checkGmailUrl(urlToCheck);

    if (matchedKeyword) {
      setTimeout(() => {
        chrome.tabs.sendMessage(
          tabId,
          { action: "GmailDetectedForExtraction" },
          (response) => {}
        );
      }, 1000);
    }
  }
});

/**
 * Listens for messages sent via chrome.runtime.onMessage and processes Gmail data.
 * This event listener listens for messages with the action `"sendGmailData"` and extracts
 * the `messageId`, `emailId`, and `eml_Url` from the received message. It logs the extracted data
 *
 * @param {Object} message - The message object received from the sender.
 * @param {string} message.action - The action type of the received message.
 * @param {string} message.messageId - The unique identifier of the Gmail message.
 * @param {string} message.emailId - The email address associated with the message.
 * @param {string} message.eml_Url - The URL of the EML file for the message.
 * @param {Object} sender - The sender of the message, contains metadata about the sender.
 * @param {Function} sendResponse - A function to send a response back to the sender (unused).
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendGmailData") {
    currentMessageId = message.messageId;
    const { messageId, emailId, eml_Url } = message;
    emlExtractionGmail(eml_Url, messageId, emailId);
  }
});

/**
 * Asynchronously fetches and processes an email in EML format from Gmail.
 *
 * This function retrieves the email content from the specified EML URL, formats it as a
 * valid RFC 822 email message, and converts it into a Blob. The processed email is then
 * sent to the server for further handling.
 *
 * @async
 * @function emlExtractionGmail
 * @param {string} emlUrl - The URL from which the EML file is to be fetched.
 * @param {string} currentMessageId - The unique identifier of the current email message.
 * @param {string} emailId - The email ID associated with the message.
 * @returns {Promise<void>} - Resolves when the email has been successfully fetched, processed, and uploaded.
 *
 * @throws Will log an error message if the fetch request fails or any other error occurs during processing.
 */
async function emlExtractionGmail(emlUrl, currentMessageId, emailId) {
  console.log("EML URL:", emlUrl);
  try {
    const response = await fetch(emlUrl, {
      mode: "cors",
      credentials: "include",
      headers: {
        Accept: "*/*",
      },
    });
    const emailContent = await response.text();
    console.log("Email Content:", emailContent);
    const formattedContent = [
      "MIME-Version: 1.0",
      "Content-Type: message/rfc822",
      "",
      emailContent,
    ].join("\r\n");

    const emlBlob = new Blob([formattedContent], {
      type: "message/rfc822",
    });

    if (emlBlob) {
      await sendEmlToServer(currentMessageId, emlBlob, "gmail", emailId);
    }
  } catch (error) {
    console.log("Error fetching email data:", error);
  }
}

/** ________________________________________ OUTLOOK ______________________________________________*/

/**
 * Listens for messages from other parts of the extension and processes email content.
 *
 * This listener waits for a message with the action `"outlookEmlContent"`. When triggered, it:
 * - Extracts the email content, message ID (`dataConvid`), and user email.
 * - Ensures that `pluginId` is set before sending the email content to the server.
 *
 * @param {Object} message - The message received from another script.
 * @param {string} message.action - The action type, should be `"outlookEmlContent"`.
 * @param {string} message.emailContent - The extracted email content.
 * @param {string} message.dataConvid - The unique ID associated with the email.
 * @param {string} message.userEmailId - The user's email address.
 * @param {Object} sender - The sender of the message (not used in this function).
 * @param {Function} sendResponse - A callback function to send a response back (not used in this function).
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let user_email = null;
  if (message.action === "outlookEmlContent") {
    const emailContent = message.emailContent;
    currentMessageId = message.dataConvid;
    user_email = message.userEmailId;

    // Ensure pluginId is set
    getExtensionid().then(() => {
      sendEmlToServer(currentMessageId, emailContent, "outlook", user_email);
    });
  }
});

/** ________________________________________ Yahoo ______________________________________________*/
chrome.storage.local.remove("messages", function () {});

/**
 * Listens for tab updates and checks if the URL changes.
 * If the updated URL contains "mail.yahoo.com" and "messages",
 * it sends a message to the content script to trigger a specific action.
 *
 * @param {number} tabId - The ID of the updated tab.
 * @param {object} changeInfo - Contains information about the changes in the tab.
 * @param {object} tab - The updated tab object.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (
      changeInfo.url.includes("mail.yahoo.com") &&
      changeInfo.url.includes("messages")
    ) {
      chrome.tabs.sendMessage(tabId, { action: "runScript" });
    }
  }
});

/**
 * Extracts and processes Yahoo email content for phishing detection
 *
 * @async
 * @param {string} emlUrl - The URL to fetch the email content from Yahoo
 * @param {string} currentMessageId - Unique identifier for the current email message
 * @param {string} userEmail - Email address of the user
 *
 * @description
 * This function performs the following steps:
 * 1. Fetches raw email content from the provided Yahoo email URL
 * 2. Formats the email content with proper MIME headers
 * 3. Creates a properly formatted email blob
 * 4. Sends the formatted email to server for analysis
 *
 * The email content is formatted according to RFC822 standards with:
 * - MIME Version header
 * - Content-Type header
 * - Original email content
 *
 * @example
 * ```js
 * await emlExtractionYahoo(
 *   'https://yahoo.com/email/123',
 *   'MSG_123',
 *   'user@yahoo.com'
 * );
 * ```
 *
 * @throws {Error} Logs error message if email fetching or processing fails
 */
async function emlExtractionYahoo(emlUrl, currentMessageId, userEmail) {
  try {
    const response = await fetch(emlUrl);
    const emailContent = await response.text();

    // console.log("Yahoo",emailContent)
    // Create properly formatted email content with headers
    const formattedContent = [
      "MIME-Version: 1.0",
      "Content-Type: message/rfc822",
      "",
      emailContent,
    ].join("\r\n");

    const emlBlob = new Blob([formattedContent], {
      type: "message/rfc822",
    });

    if (emlBlob) {
      await sendEmlToServer(currentMessageId, emlBlob, "yahoo", userEmail);
    }
  } catch (error) {
    console.log("Error fetching email data:", error);
  }
}

/**
 * Message listener for Yahoo email data processing
 *
 * Handles incoming messages with "sendYahooData" action to process Yahoo emails.
 * Extracts necessary data and initiates email content processing.
 *
 * @param {Object} message - The message object containing:
 *   @param {string} message.action - Action identifier ("sendYahooData")
 *   @param {string} message.userEmail - User's email address
 *   @param {string} message.lastMessageId - Unique message identifier
 *   @param {string} message.url - URL to fetch email content
 * @param {Object} sender - Information about the message sender
 * @param {Function} sendResponse - Callback function to send response
 *
 * Flow:
 * 1. Extracts userEmail, messageId and emlUrl from message
 * 2. Logs extracted data for debugging
 * 3. Calls emlExtractionYahoo() to process the email content
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendYahooData") {
    let userEmail = message.userEmail;
    currentMessageId = message.lastMessageId;
    let emlUrl = message.url;
    console.log(userEmail, currentMessageId, emlUrl);
    emlExtractionYahoo(emlUrl, currentMessageId, userEmail);
  }
});

/**
 * Handles reloading dispute status and admin comments for an email
 *
 * @async
 * @param {string} messageIdData - Unique identifier for the email message
 * @param {string} email - User's email address
 * @param {string} client - Email client type (gmail/yahoo/outlook)
 * @param {Function} sendResponse - Callback function to send response back to caller
 *
 * @returns {void} Sends response via callback with:
 * - On success: {disputeStatus, adminComment}
 * - On error: {error: string}
 *
 * Features:
 * - Concurrently fetches dispute status and admin comments using Promise.all
 * - Handles errors gracefully with error message response
 * - Uses checkDisputeStatus and checkAdminComment helper functions
 *
 * Example usage:
 * ```js
 * chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
 *   if (request.action === "reload") {
 *     handleReload(request.messageId, request.email, request.client, sendResponse);
 *     return true;
 *   }
 * });
 * ```
 */

const handleReload = async (messageIdData, email, client, sendResponse) => {
  try {
    const [disputeStatus, adminComment] = await Promise.all([
      checkDisputeStatus(messageIdData, email, client),
      checkAdminComment(messageIdData, email),
    ]);

    sendResponse({
      disputeStatus,
      adminComment,
    });
  } catch (error) {
    sendResponse({ error: "Failed to fetch updates" });
  }
};

/**
 * Listens for messages sent from other parts of the extension.
 *
 * This listener waits for an incoming message with the action `"reload"`, extracts relevant
 * details (message ID, email ID, and client type), and invokes `handleReload` to process them.
 *
 * @param {Object} request - The message object sent by another part of the extension.
 * @param {string} request.action - The action type of the message (expects `"reload"`).
 * @param {string} request.messageId - The unique identifier of the email message.
 * @param {string} request.emailId - The email address associated with the message.
 * @param {string} request.client - The email client (e.g., "Outlook", "Yahoo").
 * @param {Object} sender - The sender object containing information about the script that sent the message.
 * @param {Function} sendResponse - A function to send a response back to the sender.
 *
 * @returns {boolean} - Returns `true` to indicate that `sendResponse` will be called asynchronously.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reload") {
    const messageIdData = request.messageId;
    const email = request.emailId;
    const client = request.client;
    handleReload(messageIdData, email, client, sendResponse);
    return true;
  }
});

/**
 * Listens for messages sent from other parts of the Chrome extension and processes
 * email status checks based on the received action.
 *
 * @param {Object} message - The message object received from the sender.
 * @param {string} message.client - The client identifier associated with the request.
 * @param {string} message.messageId - The unique identifier of the email message.
 * @param {string} message.email - The email address associated with the request.
 * @param {string} message.action - The action type to be processed.
 * @param {Object} sender - The sender of the message (unused in this function).
 * @param {Function} sendResponse - Callback function to send a response back to the sender.
 *
 * This function checks if the action is `"firstCheckForEmail"`, then makes a POST request
 * to the pending status check endpoint with the `messageId` and `email` as the request body.
 * The response from the server is sent back to the sender with the status of the request.
 *
 * @returns {boolean} Returns `true` to indicate an asynchronous response.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const client = message.client;
  const messageId = message.messageId;
  const email = message.email;
  const url = baseUrl + "/pending-status-check/";
  if (message.action === "firstCheckForEmail") {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId: messageId,
        email: email,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        sendResponse({
          IsResponseRecieved: "success",
          data: data,
          client: client,
        });
      })
      .catch((error) => {
        sendResponse({
          status: "error",
          client: client,
          error: error.message,
        });
      });
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.popupOpened) {
    console.log("Popup opened!+++++++++++++++++++++++++++++");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0].url;
      console.log("Popup opened! and current url is ", currentUrl);
      if (currentUrl.includes("mail.yahoo.com")) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "ExtractEMailForYahoo" });
        console.log("Yahoo mail detected with the POPUP opened");
      }
      if (currentUrl.includes("mail.google.com")) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "ExtractEMailForGmail" });
        console.log("Google mail detected with the POPUP opened");
      }
      if (currentUrl.includes("outlook.live.com")) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "ExtractEMailForOutlook",
        });
        console.log("Outlook mail detected with the POPUP opened");
      }
    });
  }
});
