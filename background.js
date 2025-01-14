import {
  isGmailPage,
  isGmailMailOpened,
  isOutlookPage,
  isYahooPage,
} from "/src/helper/mail_services_helper.js";

// Received message from popup script and send which age is opened currectly
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkEmailPage") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0]?.url;
      if (isGmailMailOpened(currentUrl)) {
        sendResponse("OpendedGmail");
      } else if (isGmailPage(currentUrl)) {
        sendResponse("Gmail");
      } else if (isOutlookPage(currentUrl)) {
        // Send a message to the content script to check for Outlook email
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "checkOutlookmail" },
          (response) => {
            if (response && response.emailBodyExists) {
              sendResponse("OpenedOutlook");
            } else {
              sendResponse("Outlook");
            }
          }
        );
        return true; // Keep the channel open for async response
      } else if (isYahooPage(currentUrl)) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "checkYahoomail" },
          (response) => {
            if (response && response.emailBodyExists) {
              sendResponse("OpenedYahoo");
            } else {
              sendResponse("Yahoo");
            }
          }
        );
      } else {
        sendResponse(false);
      }
    });
    return true;
  }
  return false;
});
