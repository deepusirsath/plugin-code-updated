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
  latitude,
  longitude,
  notifyPluginStatus,
  checkEmailStatus,
  handleEmailCheck,
} from "./background/background_helper.js";
import { CHECK_EMAIL_PAGE_STATUS } from "./src/constant/background_action.js";

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
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0) {
          sendResponse(null);
          return;
        }
        const currentUrl = tabs[0]?.url || tabs[0]?.pendingUrl;

        console.log("url check called", currentUrl);
        return checkEmailPageStatus(currentUrl, tabs[0].id, sendResponse);
      });
    }, 500);
    return true;
  }
  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const currentUrl = tab.url;
    if (
      currentUrl.includes("mail.google.com") ||
      currentUrl.includes("mail.yahoo.com") ||
      currentUrl.includes("outlook.live.com")
    ) {
      chrome.tabs.sendMessage(tabId, {
        action: "urlUpdated",
        url: currentUrl,
      });
    }
  }
});

chrome.storage.local.get(null, function (data) {
  console.log("Data retrieved from local storage:", data);
});

chrome.storage.local.set({ registration: true });

// Listener for chrome startup
chrome.runtime.onStartup.addListener(() => {
  userDetails();
  // fetchDeviceDataToSend();/
  checkRegistration();
});

chrome.runtime.onInstalled.addListener(() => {
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

chrome.management.onEnabled.addListener(notifyPluginStatus);

getExtensionid();

// Received Geolocation from content script and stored in Local storage

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "geoLocationUpdate") {
    const coordinates = request.coordinates; // Access the coordinates object
    latitude = coordinates.latitude; // Extract latitude
    longitude = coordinates.longitude; // Extract longitude
    chrome.storage.local.set({ coordinates: coordinates }, () => {
      chrome.storage.local.get("coordinates", (result) => {
        console.log(
          "Retrieved coords from local storage",
          result.coordinates.latitude
        );
      });
    });
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
  if (message.action === "pendingStatusGmail") {
    const messageId = message.messageId;
    const email = message.emailId;
    checkPendingResponseStatus(messageId, email, "gmail");
  } else if (message.action === "pendingStatusYahoo") {
    const messageId = message.messageId;
    const email = message.emailId;

    checkPendingResponseStatus(messageId, email, "yahoo");
  } else if (message.action === "pendingStatusOutlook") {
    const messageId = message.messageId;
    const email = message.emailId;
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
    // currentMessageId = message.messageId;
    const { messageId, emailId, eml_Url } = message;
    emlExtractionGmail(eml_Url, messageId, emailId);
  }
});

// ________________________________________ OUTLOOK ______________________________________________

// Listen for messages from the content script OF OUTLOOK and store messageId and eml data

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "outlookEmlContent") {
    // const emailContent = message.emailContent;
    // currentMessageId = message.dataConvid;
    // user_email = message.userEmailId;
    getExtensionid().then(() => {
      sendEmlToServer(
        message.dataConvid,
        message.emailContent,
        "outlook",
        message.userEmailId
      );
    });
  }
});

// ---------------------------------------Yahoo Mail--------------------------------------------

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
  if (message.action === "sendYahooData") {
    let userEmail = message.userEmail;
    // currentMessageId = message.lastMessageId;
    let emlUrl = message.url;
    emlExtractionYahoo(emlUrl, message.lastMessageId, userEmail);
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
  if (message.action !== "firstCheckForEmail") {
    return false;
  }
  handleEmailCheck(message, sendResponse);
  return true;
});
