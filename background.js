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

const baseUrl = config.BASE_URL;

let currentMessageId = null; //Contains latest message Id which will send to server
let latitude = null;
let longitude = null;
let pluginId = null;
let ipAddress = null;
let browserInfo = null;
let operatingSystem = null;
let macId = null;

chrome.storage.local.set({ registration: true });

// Listener for chrome startup
chrome.runtime.onStartup.addListener(() => {
  console.log("On startup is running");
  userDetails();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("On Installed is running");
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

// ___________________________________________________________extension___________________________________________________________

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

// Received Geolocation from content script and stored in Local storage
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

// Function to fetch and store user details like ip,extension id ,chrome details
async function userDetails() {
  return Promise.all([
    fetchIpAddress(),
    userBrowserInfo(),
    getPlatformInfo(),
    getExtensionid(),
  ])
    .then(() => {
      console.log("User details have been fetched and stored.");
    })
    .catch((error) => {
      console.log("Error in userDetails:", error);
    });
}

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

// Received message from popup script, it checks dispute counts and status and send back to popup script

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
      chrome.storage.local.set({ email_status: data?.data?.eml_status });
      handleEmailScanResponse(serverData, activeTabId, client);
      return data?.data?.eml_status || null;
    }
  } catch (err) {
    console.error(err);
  }
}

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

// -----------------------------------New  Code-----------------------------

async function sendEmlToServer(messageId, blob = null, client, user_email) {
  try {
    if (!pluginId) {
      pluginId = chrome.runtime.id;
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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

    // If the response is received before the timeout, clear the timer
    // clearTimeout(delayTimer);

    console.log("File successfully uploaded to the server");
    const serverData = await uploadResponse.json();
    console.log("Server Response:", serverData);

    // Handle the response using the separate handler function
    handleEmailScanResponse(serverData, activeTabId, client);
  } catch (error) {
    console.error("Error uploading file to the server:", error);
  }
}

function handleEmailScanResponse(serverData, activeTabId, client) {
  const resStatus = serverData.eml_status || serverData.email_status;
  const messId = serverData.messageId || serverData.msg_id;
  let unsafeReason = serverData.unsafe_reasons || " ";
  console.log("serverData:", serverData);

  console.log("unsafe reason Response:", unsafeReason);
  console.log(
    "Received Message ID from Server:",
    messId,
    resStatus,
    unsafeReason
  );

  if (typeof resStatus === "undefined" || typeof messId === "undefined") {
    chrome.runtime.sendMessage({
      action: "erroRecievedFromServer",
      client: client,
    });
  } else {
    chrome.storage.local.set({ email_status: resStatus });
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
      console.log("Current Message Id matches");

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
          .then((response) => {
            console.log(
              `Message sent to content script for ${action}:`,
              response
            );
          })
          .catch((error) => {
            console.error("Error sending message to content script:", error);
          });
      }
    } else {
      console.log("Response received for different message ID");
      chrome.runtime.sendMessage({
        action: "erroRecievedFromServer",
        client: client,
      });
    }
  });
}

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

// Function to check the pending response status
async function checkPendingResponseStatus(messageId, email, client) {
  const url = `${baseUrl}${PENDING_STATUS_CHECK}`;

  try {
    // Get active tab first and handle potential empty results
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = tabs && tabs[0] ? tabs[0].id : null;

    if (!activeTabId) {
      console.log("No active tab found");
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

    handleEmailScanResponse(serverData, activeTabId, client);
  } catch (error) {
    console.log("Error in checkPendingResponseStatus:", error);
  }
}

// ________________________________________ GMAIL ______________________________________________

let lastProcessedTime = 0;
const DEBOUNCE_DELAY = 100; // milliseconds

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const currentTime = Date.now();

  if (changeInfo.url || changeInfo.status === "complete") {
    // Prevent duplicate executions within the debounce delay
    if (currentTime - lastProcessedTime < DEBOUNCE_DELAY) {
      return;
    }

    lastProcessedTime = currentTime;
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
    currentMessageId = message.messageId;
    const { messageId, emailId, eml_Url } = message;
    console.log("Received messageId:", message.messageId);
    console.log("Received emailId:", message.emailId);
    console.log("Received eml_Url:", message.eml_Url);
    emlExtractionGmail(eml_Url, messageId, emailId);
  }
});

async function emlExtractionGmail(emlUrl, currentMessageId, emailId) {
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
    console.log("Email Blob:", emlBlob);

    if (emlBlob) {
      await sendEmlToServer(currentMessageId, emlBlob, "gmail", emailId);
      console.log("Email Blob sent to server");
    }
  } catch (error) {
    console.log("Error fetching email data:", error);
  }
}

// ________________________________________ OUTLOOK ______________________________________________

// Listen for messages from the content script OF OUTLOOK and store messageId and eml data

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let user_email = null;
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
chrome.storage.local.remove("messages", function () {
  console.log("Messages cleared from local storage");
});

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

async function emlExtractionYahoo(emlUrl, currentMessageId, userEmail) {
  try {
    const response = await fetch(emlUrl);
    const emailContent = await response.text();
    console.log("Email Content:", emailContent);

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
    console.log("Email Blob:", emlBlob);

    if (emlBlob) {
      await sendEmlToServer(currentMessageId, emlBlob, "yahoo", userEmail);
    }
  } catch (error) {
    console.log("Error fetching email data:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    return true;
  }
});
