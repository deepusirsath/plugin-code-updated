import {
  CHECK_GMAIL_MAIL_STATUS,
  CHECK_OUTLOOK_MAIL_STATUS,
  CHECK_YAHOO_MAIL_STATUS,
} from "/src/constant/background_action.js";
import {
  isGmailPage,
  isGmailMailOpened,
  isOutlookPage,
  isYahooPage,
} from "/src/helper/mail_services_helper.js";

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

    case isGmailMailOpened(currentUrl):
      chrome.tabs.sendMessage(
        tabId,
        { action: CHECK_GMAIL_MAIL_STATUS },
        (response) => handleMailResponse(response, sendResponse, "Gmail")
      );
      return true;

    case isOutlookPage(currentUrl):
      chrome.tabs.sendMessage(
        tabId,
        { action: CHECK_OUTLOOK_MAIL_STATUS },
        (response) => handleMailResponse(response, sendResponse, "Outlook")
      );
      return true;

    case isYahooPage(currentUrl):
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
