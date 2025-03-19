import {
  isGmailPage,
  isGmailMailOpened,
  isOutlookPage,
  isYahooPage,
} from "/src/helper/mail_services_helper.js";

export const checkGmailUrl = (url) => {
  if (url && url.includes("mail.google.com")) {
    const keywords = [
      "inbox",
      "starred",
      "snoozed",
      "imp",
      "scheduled",
      "all",
      "spam",
      "trash",
      "category",
      "label",
      "search",
    ];
    const regex = new RegExp(keywords.join("|"), "i");
    const match = url.match(regex);
    return match ? match[0] : null;
  }
  return null;
};

export const handleMailResponse = (response, sendResponse, mailService) => {
  if (response && response.emailBodyExists) {
    const responseValue = `Opened${mailService}`;
    sendResponse(responseValue);
  } else {
    sendResponse(mailService);
  }
};

export const checkEmailPageStatus = (currentUrl, tabId, sendResponse) => {
  // First check if we're on any email service page
  if (
    !isGmailPage(currentUrl) &&
    !isOutlookPage(currentUrl) &&
    !isYahooPage(currentUrl)
  ) {
    sendResponse("Please select email service");
    return;
  }

  // Then handle specific email service cases
  switch (true) {
    case isGmailMailOpened(currentUrl):
      chrome.tabs.sendMessage(tabId, { action: "checkGmailmail" }, (response) =>
        handleMailResponse(response, sendResponse, "Gmail")
      );
      return true;

    case isGmailPage(currentUrl):
      sendResponse("Gmail");
      return true;

    case isOutlookPage(currentUrl):
      chrome.tabs.sendMessage(
        tabId,
        { action: "checkOutlookmail" },
        (response) => handleMailResponse(response, sendResponse, "Outlook")
      );
      return true;

    case isYahooPage(currentUrl):
      chrome.tabs.sendMessage(tabId, { action: "checkYahoomail" }, (response) =>
        handleMailResponse(response, sendResponse, "Yahoo")
      );
      return true;

    default:
      sendResponse(false);
  }
};
