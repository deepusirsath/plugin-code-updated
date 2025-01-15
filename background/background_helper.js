import {
  CHECK_GMAIL_MAIL_STATUS,
  CHECK_OUTLOOK_MAIL_STATUS,
  CHECK_YAHOO_MAIL_STATUS,
} from "/src/constant/background_action.js";
import {
  isGmailPage,
  isOutlookPage,
  isYahooPage,
} from "/src/helper/mail_services_helper.js";
import {
  CHECK_EMAIL,
  DISPUTES_RAISE,
  SPAM_MAIL,
  PLUGIN_COUNTER,
  PENDING_STATUS_CHECK,
  PLUGINS_ENABLE_DISABLE,
} from "/src/routes/api_route.js";

export let pluginId = null;
export let ipAddress = null;
export let browserInfo = null;
export let operatingSystem = null;
export let macId = null;
export let user_email = null;
export let currentMessageId = null; //Contains latest message Id which will send to server
export let latitude = null;
export let longitude = null;

/**
 * Handles the response from mail service checks and formats the appropriate response
 *
 * @param {Object} response - The response object from mail service containing emailBodyExists flag
 * @param {Function} sendResponse - Callback function to send the formatted response
 * @param {string} mailService - The name of the mail service (Gmail, Outlook, or Yahoo)
 *
 * @returns {void}
 *
 * Examples:
 * - If email is open: sendResponse("OpenedGmail")
 * - If on mail service homepage: sendResponse("Gmail")
 */
const handleMailResponse = (response, sendResponse, mailService) => {
  if (response && response.emailBodyExists) {
    sendResponse(`Opened${mailService}`);
  } else {
    sendResponse(mailService);
  }
};

/**
 * Checks the current page status to determine which email service is active and if an email is opened
 *
 * @param {string} currentUrl - The URL of the current tab
 * @param {number} tabId - Chrome tab identifier
 * @param {Function} sendResponse - Callback function to send the status response
 *
 * @returns {boolean|void} Returns true for async message handling, void otherwise
 *
 * Status responses:
 * - "Gmail" - On Gmail homepage
 * - "OpenedGmail" - Viewing Gmail email
 * - "Outlook" - On Outlook homepage
 * - "OpenedOutlook" - Viewing Outlook email
 * - "Yahoo" - On Yahoo homepage
 * - "OpenedYahoo" - Viewing Yahoo email
 * - false - Not on any supported mail service
 */
export const checkEmailPageStatus = (currentUrl, tabId, sendResponse) => {
  switch (true) {
    case isGmailPage(currentUrl):
      sendResponse("Gmail");
      break;

    case checkGmailUrl(urlToCheck):
      console.log("url check called 1", currentUrl);
      chrome.tabs.sendMessage(
        tabId,
        { action: CHECK_GMAIL_MAIL_STATUS },
        (response) => handleMailResponse(response, sendResponse, "Gmail")
      );
      return true;

    case isOutlookPage(currentUrl):
      console.log("url check called 2", currentUrl);
      chrome.tabs.sendMessage(
        tabId,
        { action: CHECK_OUTLOOK_MAIL_STATUS },
        (response) => handleMailResponse(response, sendResponse, "Outlook")
      );
      return true;

    case isYahooPage(currentUrl):
      console.log("url check called 3", currentUrl);
      chrome.tabs.sendMessage(
        tabId,
        { action: CHECK_YAHOO_MAIL_STATUS },
        (response) => handleMailResponse(response, sendResponse, "Yahoo")
      );
      return true;

    default:
      sendResponse(false);
  }
};

export const handleEmailScanResponse = (serverData, activeTabId, client) => {
  const resStatus = serverData.eml_status || serverData.email_status;
  const messId = serverData.messageId || serverData.msg_id;
  console.log("Received Message ID from Server:", messId, resStatus);

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
    messages[messId] = resStatus;
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
          .sendMessage(activeTabId, { action, client })
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
      chrome.runtime.sendMessage({
        action: "erroRecievedFromServer",
        client: client,
      });
    }
  });
};

export const sendEmlToServer = async (
  messageId,
  blob = null,
  client,
  user_email
) => {
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
    formData.append("emailId", user_email);

    const url = baseUrl + CHECK_EMAIL;

    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Disposition": 'attachment; filename="downloaded.eml"',
      },
    });

    const serverData = await uploadResponse.json();

    // Handle the response using the separate handler function
    handleEmailScanResponse(serverData, activeTabId, client);
  } catch (error) {
    console.error("Error uploading file to the server:", error);
  }
};

export const emlExtractionGmail = async (emlUrl, currentMessageId, emailId) => {
  try {
    const response = await fetch(emlUrl, {
      mode: "cors",
      credentials: "include",
      headers: {
        Accept: "*/*",
      },
    });
    const emailContent = await response.text();
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
};

export const checkGmailUrl = (url) => {
  if (url && url.includes("mail.google.com")) {
    const keywords = [
      "inbox",
      "starred",
      "snoozed",
      "drafts",
      "imp",
      "scheduled",
      "all",
      "spam",
      "trash",
      "category",
    ];
    const regex = new RegExp(keywords.join("|"), "i");
    const match = url.match(regex);
    return match ? match[0] : null;
  }
  return null;
};

export const displayAllSpamMails = async () => {
  try {
    if (!pluginId) {
      pluginId = await getExtensionid();
    }
    if (!user_email) {
      console.log("Currently email is null", user_email);
      const data = await new Promise((resolve) => {
        chrome.storage.local.get("user_email", function (data) {
          resolve(data);
        });
      });

      if (data.user_email) {
        user_email = data.user_email;
        console.log("Retrieved email from storage:", user_email);
      }
    }

    let sendingData = [user_email, pluginId];
    console.log("data[1][3] , data[1][8]", sendingData);
    console.log(JSON.stringify({ user_email, pluginId }));
    const url = baseUrl + SPAM_MAIL;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailId: user_email, pluginId }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    console.log(data[1][3], data[1][10]);

    // Handle the response data here
    console.log("Server response:", data);
    chrome.runtime.sendMessage({ action: "spamTables", content: data });
  } catch (error) {
    // Handle errors here
    console.error("Error fetching data:", error.message);
  }
};

export const checkDisputeCount = async (messageId) => {
  const url = `${baseUrl}${PLUGIN_COUNTER}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: messageId }),
    });
    const data = await response.json();
    const dispute_count = data.counter ? data.counter : 0;
    if (dispute_count) {
      chrome.storage.local.set({
        dispute_count: data.counter || 0,
      });
    }
    return { dispute_count };
  } catch (err) {
    console.error(err);
  }
};

export const checkDisputeStatus = async (
  messageId,
  email,
  sendResponse,
  client
) => {
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
};

// Send Dispute with reason to server
export const sendDisputeToServer = async (reason, email, messageId) => {
  try {
    const url = `${baseUrl}${DISPUTES_RAISE}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userComment: reason, email, msgId: messageId }),
    });
    if (response.ok) {
      chrome.storage.local.set({ email_status: "Dispute" });
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending dispute to server:", error);
  }
};

// Function to check the pending response status
export const checkPendingResponseStatus = async (messageId, email, client) => {
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
};

export const fetchDeviceDataToSend = async () => {
  try {
    const response = await fetch("http://localhost:3000/deviceIdentifiers");
    if (response.ok) {
      const data = await response.json();

      // Store the device data in Chrome local storage
      chrome.storage.local.set({ deviceData: data });
      chrome.storage.local.get("deviceData", (result) => {
        macId = result.deviceData.macAddress;
      });
    }
  } catch (error) {
    console.error("Error fetching device data:", error);
  }
};

// fetching user Ipv4 address
async function fetchIpAddress() {
  return fetch("https://api64.ipify.org?format=json")
    .then((response) => response.json())
    .then((data) => {
      console.log("User IP Address:", data.ip);
      // userData.push({type: 'ip',value: data.ip});
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
    console.log(navigator.sayswho);
    // userData.push({type: 'userAgent', value: navigator.sayswho});
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
      console.log("Platform:", platformInfo.os);
      // console.log('Architecture:', platformInfo.arch);
      // userData.push({ type: 'platform', os: platformInfo.os});
      operatingSystem = platformInfo.os;
      chrome.storage.local.set({ operatingSystem: platformInfo.os }, () => {
        resolve();
      });
    });
  });
}

// Function to fetch and store user details like ip,extension id ,chrome details
export const userDetails = async () => {
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
};

// Check for registration if not registered then called backend for true and false response
export const checkRegistration = () => {
  chrome.storage.local.get("registration", (data) => {
    if (chrome.runtime.lastError || !data.registration) {
      // Registration not found, proceed to call server API
      const extensionId = chrome.runtime.id;
      const url = baseUrl + VERIFY_LICENSE;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ extensionId: extensionId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            chrome.storage.local.set({ registration: true });
          }
        })
        .catch((error) => {
          console.error("API call failed:", error);
        });
    } else {
      console.log("Registration already exists.");
    }
  });
};

export const getExtensionid = () => {
  return new Promise((resolve) => {
    const extensionId = chrome.runtime.id;
    console.log("Extension ID:", extensionId);
    // userData.push({ type: 'extensionId', value: extensionId });
    pluginId = extensionId;
    chrome.storage.local.set({ extensionId: extensionId }, () => {
      resolve();
    });
  });
};

export const emlExtractionYahoo = async (
  emlUrl,
  currentMessageId,
  userEmail
) => {
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
};

export const checkAdminComment = async (messageId, email) => {
  const url = `http://192.168.0.2:10101/plugin/update-email-details/`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: messageId, email: email }),
    });
    const data = await response.json();
    return data?.data[0]?.admin_comment || null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const notifyPluginStatus = async () => {
  const url = baseUrl + PLUGINS_ENABLE_DISABLE;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Plugin status update successful:", data);
  } catch (error) {
    console.error("Failed to update plugin status:", error);
  }
};

export const checkEmailStatus = async (messageId, email) => {
  const url = `${baseUrl}/pending-status-check/`;
  const requestBody = {
    messageId,
    email,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  };

  const response = await fetch(url, requestOptions);
  return response.json();
};

export const handleEmailCheck = async (message, sendResponse) => {
  const { client, messageId, email } = message;

  try {
    const data = await checkEmailStatus(messageId, email);
    sendResponse({
      IsResponseRecieved: "success",
      data,
      client,
    });
  } catch (error) {
    sendResponse({
      status: "error",
      client,
      error: error.message,
    });
  }
};
