import {
  checkEmailPageStatus,
  checkGmailUrl,
  emlExtractionGmail,
  sendEmlToServer,
  displayAllSpamMails,
  checkDisputeCount,
  checkDisputeStatus,
  sendDisputeToServer,
  checkPendingResponseStatus,
  fetchDeviceDataToSend,
  userDetails,
  checkRegistration,
  getExtensionid,
  emlExtractionYahoo,
  checkAdminComment,
  user_email,
  currentMessageId, 
  latitude,
  longitude,
} from "./background/background_helper.js";
import { CHECK_EMAIL_PAGE_STATUS } from "./src/constant/background_action.js";

import { config } from "./config.js";
import {
  PLUGINS_ENABLE_DISABLE,
  VERIFY_LICENSE,
} from "/src/routes/api_route.js";

const baseUrl = config.BASE_URL;

/**
 * Message listener for handling background script communications
 *
 * This listener processes messages sent from other parts of the extension,
 * specifically handling email page status checks.
 *
 * @param {Object} request - The message request object
 * @param {string} request.action - Action type to identify the operation
 * @param {Object} sender - Information about the script context that sent the message
 * @param {Function} sendResponse - Callback function to send a response back to the sender
 *
 * @listens chrome.runtime.onMessage
 *
 * Flow:
 * 1. Checks if the received action is CHECK_EMAIL_PAGE_STATUS
 * 2. Queries for the active tab in the current window
 * 3. Extracts the current URL from the active tab
 * 4. Calls checkEmailPageStatus with URL, tab ID and response callback
 *
 * @returns {boolean} True if using sendResponse asynchronously, false otherwise
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === CHECK_EMAIL_PAGE_STATUS) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        sendResponse(null);
        return;
      }
      const currentUrl = tabs[0]?.url;
      return checkEmailPageStatus(currentUrl, tabs[0].id, sendResponse);
    });
    return true;
  }
  return false;
});

chrome.storage.local.get(null, function (data) {
  console.log("Data retrieved from local storage:", data);
});

chrome.storage.local.set({ registration: true });

// Listener for chrome startup
chrome.runtime.onStartup.addListener(() => {
  console.log("On startup is running");
  userDetails();
  // fetchDeviceDataToSend();
  checkRegistration();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("On Installed is running");
  userDetails();
  // fetchDeviceDataToSend();
  checkRegistration();
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
    .then((data) => {
      console.log("Fetch successful:", data);
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
});

getExtensionid();

// Received Geolocation from content script and stored in Local storage

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "geoLocationUpdate") {
    console.log("coords  received");
    const coordinates = request.coordinates; // Access the coordinates object
    latitude = coordinates.latitude; // Extract latitude
    longitude = coordinates.longitude; // Extract longitude
    console.log("coords  received", latitude, "coords  received", longitude);
    chrome.storage.local.set({ coordinates: coordinates }, () => {
      console.log("Saved coords to local storage");
      chrome.storage.local.get("coordinates", (result) => {
        console.log(
          "Retrieved coords from local storage",
          result.coordinates.latitude
        );
      });
    });
    console.log("Received latitude , longitude", latitude, longitude);
  }
});

// ----------------------------------Listeners from Popup Script----------------------------------------------

// Received message from popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExtensiondata") {
    chrome.storage.local.get(
      ["extensionId", "browserInfo", "ipAddress"],
      (data) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkDispute") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "fetchDisputeMessageId" },
        (response) => {
          chrome.storage.local.set({ receiver_email: response.emailId });
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

              if (dispute_count >= 0) {
                sendResponse({
                  status:
                    emailStatus === "Dispute"
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

// Received message from popup script to show all spam mails in a list
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "displayAllSpams") {
    console.log("received response form popup to show all spams");
    displayAllSpamMails(user_email);
  }
});

// Received message from dispute_popup for disputing on particular mail
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

// Here the content script message is received by the background script for Pending Status
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("Message received from content.js on Gmail:", message);
  if (message.action === "pendingStatusGmail") {
    console.log(
      "Message received from content.js on Gmailfor pending Status and the ===================:",
      message
    );
    const messageId = message.messageId;
    const email = message.emailId;
    console.log("Message ID:", messageId);
    console.log("Email ID:", email);
    checkPendingResponseStatus(messageId, email, "gmail");
  } else if (message.action === "pendingStatusYahoo") {
    console.log(
      "Message received from content.js on Yahoo for pending Status and the ===================:"
    );
    const messageId = message.messageId;
    const email = message.emailId;
    console.log("Message ID:", messageId);
    console.log("Email ID:", email);
    checkPendingResponseStatus(messageId, email, "yahoo");
  } else if (message.action === "pendingStatusOutlook") {
    console.log(
      "Message received from content.js on Outlook for pending Status and the ===================:"
    );
    const messageId = message.messageId;
    const email = message.emailId;
    console.log("Message ID:", messageId);
    console.log("Email ID:", email);
    checkPendingResponseStatus(messageId, email, "outlook");
  }
});

// ________________________________________ GMAIL ______________________________________________

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check for both URL changes and complete page loads
  if (changeInfo.url || changeInfo.status === "complete") {
    const urlToCheck = changeInfo.url || tab.url;
    const matchedKeyword = checkGmailUrl(urlToCheck);

    if (matchedKeyword) {
      console.log(`Keyword detected: ${matchedKeyword}`);
      chrome.tabs.sendMessage(
        tabId,
        { action: "GmailDetectedForExtraction" },
        (response) => {
          console.log("Response from content script:", response);
        }
      );
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendGmailData") {
    console.log("Received message from content.js Gmail:", message);
    currentMessageId = message.messageId;
    const { messageId, emailId, eml_Url } = message;
    console.log("Received messageId:", message.messageId);
    console.log("Received emailId:", message.emailId);
    console.log("Received eml_Url:", message.eml_Url);
    emlExtractionGmail(eml_Url, messageId, emailId);
  }
});

// ________________________________________ OUTLOOK ______________________________________________

// Listen for messages from the content script OF OUTLOOK and store messageId and eml data

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "outlookEmlContent") {
    const emailContent = message.emailContent;
    currentMessageId = message.dataConvid;
    user_email = message.userEmailId;
    console.log("Data Convid Id:", currentMessageId);
    // Ensure pluginId is set
    getExtensionid().then(() => {
      sendEmlToServer(currentMessageId, emailContent, "outlook", user_email);
    });
  }
});

// ---------------------------------------Yahoo Mail--------------------------------------------
// chrome.storage.local.remove("messages", function () {
//   console.log("Messages cleared from local storage");
// });

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Background script received message:', message);
  // console.log("Message received from content.js on Yahoo Mail:");
  if (message.action === "sendYahooData") {
    let userEmail = message.userEmail;
    currentMessageId = message.lastMessageId;
    let emlUrl = message.url;

    console.log("User email:", userEmail);
    console.log("Message ID:", currentMessageId);
    console.log("EML URL:", emlUrl);
    emlExtractionYahoo(emlUrl, currentMessageId, userEmail);
  }
});

// Received message from dispute_popup for disputing on particular mail
chrome.runtime.onMessage.addListener((request, messageId, sendResponse) => {
  const messageIdData = request.messageId;
  const email = request.emailId;
  const client = request.client;

  if (request.action === "reload") {
    const combinedResponse = {};
    let completedRequests = 0;

    const handleApiResponse = () => {
      completedRequests++;
      if (completedRequests === 2) {
        sendResponse(combinedResponse);
      }
    };

    checkDisputeStatus(
      messageIdData,
      email,
      (response) => {
        combinedResponse.disputeStatus = response;
        handleApiResponse();
      },
      client
    );

    checkAdminComment(messageIdData, email, (response) => {
      combinedResponse.adminComment = response;
      handleApiResponse();
    });
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const client = message.client;
  const messageId = message.messageId;
  const email = message.email;
  const url = baseUrl + "/pending-status-check/";
  if (message.action === "firstCheckForEmail") {
    console.log(
      "Received message from content.js first Check Email here :",
      message
    );
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
        console.log("Response received from the server:", data);
        sendResponse({
          IsResponseRecieved: "success",
          data: data,
          client: client,
        });
      })
      .catch((error) => {
        console.error("Error in calling the first check API:", error);
        sendResponse({
          status: "error",
          client: client,
          error: error.message,
        });
      });
    return true; // Keep the message channel open for async response
  }
});
