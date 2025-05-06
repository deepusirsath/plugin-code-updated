const importComponent = async (path) => {
  const src = chrome.runtime.getURL(path);
  return await import(src);
};
// console.log("gmail content script executed")

// Function to find and block elements with class "brd"
const findAndBlockBrdElements = () => {
  const maxAttempts = 150;
  let attempts = 0;

  const checkBrdElements = setInterval(() => {
    const brdElements = document.getElementsByClassName("brd");
    attempts++;

    if (brdElements && brdElements.length > 0) {
      // console.log(`Found ${brdElements.length} elements with class "brd"`);

      // Apply multiple blocking techniques to all brd elements
      Array.from(brdElements).forEach((element) => {
        // Apply inline styles with !important to override any other styles
        element.style.cssText =
          "pointer-events: none !important; cursor: default !important;";

        // Also apply to child elements
        const childElements = element.querySelectorAll("*");
        childElements.forEach((child) => {
          child.style.cssText =
            "pointer-events: none !important; cursor: default !important;";
        });

        // Remove jsaction attributes that might be handling clicks
        element.removeAttribute("jsaction");

        // Add our own click handler with capture phase to intercept clicks before other handlers
        element.addEventListener("click", blockClickHandler, true);

        // For the specific brc child elements
        const brcElements = element.getElementsByClassName("brc");
        Array.from(brcElements).forEach((brc) => {
          brc.style.cssText =
            "pointer-events: none !important; cursor: default !important;";
          brc.removeAttribute("jsaction");
          brc.setAttribute("aria-disabled", "true");
          brc.removeAttribute("tabindex");
        });
      });

      clearInterval(checkBrdElements);
    } else if (attempts >= maxAttempts) {
      // console.log("Failed to find elements with class 'brd' after maximum attempts");
      clearInterval(checkBrdElements);
    }
  }, 1000);
};
// Click handler function to block clicks and show message
function blockClickHandler(event) {
  event.preventDefault();
  event.stopPropagation();

  // Show message to the user

  return false;
}

findAndBlockBrdElements();

// Add a global click event listener with capture phase to intercept all clicks
document.addEventListener(
  "click",
  (event) => {
    // Check if the clicked element or any of its parents has the class "brd"
    let target = event.target;
    while (target && target !== document) {
      if (target.classList && target.classList.contains("brd")) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      if (
        target.parentElement &&
        target.parentElement.classList &&
        target.parentElement.classList.contains("brd")
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      target = target.parentElement;
    }
  },
  true
);

// Also run the check periodically to catch dynamically added elements
setInterval(findAndBlockBrdElements, 5000);

// Initialize UI components
let showAlert = null;
let showBlockedPopup = null;
let showLoadingScreen = null;
let hideLoadingScreen = null;
let intervalId = null;

const ERROR_MESSAGES = {
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  FAILED_TO_SEND_EMAIL_CONTENT:
    "Failed to send email content to background script:",
};

Promise.all([
  importComponent("/src/component/email_status/email_status.js"),
  importComponent("/src/component/block_email_popup/block_email_popup.js"),
  importComponent(
    "/src/component/outlook_loading_screen/outlook_loading_screen.js"
  ),
]).then(([emailStatus, blockPopup, loadingScreen]) => {
  showAlert = emailStatus.showAlert;
  showBlockedPopup = blockPopup.showBlockedPopup;
  showLoadingScreen = loadingScreen.showLoadingScreen;
  hideLoadingScreen = loadingScreen.hideLoadingScreen;
});

/**
 * Continuously checks for the presence of elements with the class "nH a98 iY" in the DOM.
 * The function attempts to locate these elements up to a maximum of 15 times, with a 1-second interval between attempts.
 * If the elements are found within the attempts, the `blockEmailBody` function is executed, and the interval is cleared.
 * This function replaces the previous setTimeout-based approach to ensure elements are detected dynamically.
 */

const waitForElements = () => {
  const maxAttempts = 15;
  let attempts = 0;

  const checkElements = setInterval(() => {
    const elements = document.getElementsByClassName("nH a98 iY");
    attempts++;

    if (elements && elements.length > 0) {
      blockEmailBody();
      clearInterval(checkElements);
    } else if (attempts >= maxAttempts) {
      clearInterval(checkElements);
    }
  }, 1000);
};

// Replace the original setTimeout with the new function
waitForElements();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !emailId) {
    findEmailId();
  }
});

let shouldApplyPointerEvents = true;

let emailId = null;
let messageId = null;
let isValidSegmentLength = 30;
let messageReason = " ";

/**
 * Chrome extension message listener for Gmail email detection and processing
 *
 * @param {Object} message - Message object containing the action type
 * @param {Object} sender - Sender information object
 * @param {Function} sendResponse - Callback function to send response back
 *
 * Features:
 * - Listens for "GmailDetectedForExtraction" action
 * - Ignores compose URLs
 * - Validates user registration status
 * - Checks URL segment length against isValidSegmentLength (30)
 * - Initializes processing after validation
 *
 * Flow:
 * - Receives message
 * - Waits 1 second for page load
 * - Checks if URL is not compose view
 * - Verifies registration status
 * - Validates URL segment length
 * - Calls init() if all checks pass
 * - Sends confirmation response
 *
 * Security:
 * - Checks chrome.runtime.lastError
 * - Validates registration data
 * - Ensures minimum segment length
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GmailDetectedForExtraction") {
    // console.log("clearInterval(intervalId);")
    clearInterval(intervalId);
    setTimeout(() => {
      let url = window.location.href;
      // Extract the part after #
      const hashParts = url.split("#");
      if (hashParts.length < 2) return;

      const afterHash = hashParts[1];

      // Check if compose appears immediately after folder name
      if (
        afterHash.match(
          /^(inbox|starred|snoozed|imp|label|search|scheduled|all|spam|trash|category)\/?\?compose=/
        )
      ) {
        return;
      }

      // If compose exists but has a long string before it, proceed
      if (afterHash.includes("?compose=")) {
        const beforeCompose = afterHash.split("?compose=")[0];
        if (beforeCompose.length < 30) {
          // console.log("compose found return=================================");
          return;
        }
      }
      // console.log("compose not found ===========================");
      chrome.storage.local.get("registration", (data) => {
        if (chrome.runtime.lastError) {
          return;
        }

        if (data.registration) {
          const lastSegment = url.split("/").pop().split("#").pop();
          if (lastSegment.length >= isValidSegmentLength) {
            console.log("init called");
            init();
          }
        }
      });
    }, 100);
    sendResponse({ status: "received" });
  }
});

/**
 * Chrome runtime message listener for Gmail-related actions
 *
 * Listens for specific message actions to extract Gmail message details from the current page.
 * Handles two main actions:
 * - checkGmailmail
 * - fetchDisputeMessageId
 *
 * @param {Object} message - The message object from the sender
 * @param {string} message.action - The action to perform ('checkGmailmail' or 'fetchDisputeMessageId')
 * @param {Object} sender - Details about the message sender
 * @param {Function} sendResponse - Callback function to send response back to sender
 *
 * @returns {boolean} Returns true to indicate async response handling
 *
 * Response payload:
 * Success: {
 *   emailBodyExists: true,
 *   messageId: string,
 *   emailId: string,
 *   senderEmail: string
 * }
 *
 * Error: {
 *   emailBodyExists: false,
 *   error: string
 * }
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action === "checkGmailmail" ||
    message.action == "fetchDisputeMessageId"
  ) {
    const node = document.querySelector("[data-legacy-message-id]");
    const messageId = node.getAttribute("data-legacy-message-id");
    const gmailContainer = document.querySelector("div[role='main']");
    if (gmailContainer) {
      const senderEmail = gmailContainer
        .querySelector("span[email]")
        ?.getAttribute("email");

      if (messageId && emailId) {
        sendResponse({
          emailBodyExists: true,
          messageId: messageId,
          emailId: emailId,
          senderEmail: senderEmail,
        });
      } else {
        sendResponse({
          emailBodyExists: false,
          error: "Failed to extract Gmail message ID or email ID",
        });
      }
      return true;
    }
  }
});

/**
 * Chrome runtime message listener for handling email-related events
 *
 * @param {Object} request - The message request object
 * @param {string} request.action - Action type, specifically "EmailNotFoundInPendingRequest"
 * @param {string} request.client - Client type, specifically "gmail"
 * @param {string} request.messageId - The message ID from the email
 * @param {Object} sender - Chrome runtime sender information
 * @param {Function} sendResponse - Callback function to send response
 *
 * Features:
 * - Listens for specific email not found events from Gmail
 * - Checks if current URL is not a compose window
 * - Creates new URL using message ID if conditions are met
 *
 * Behavior:
 * - Returns early if URL contains "?compose="
 * - Calls createUrl() with current URL and messageId
 * - Only processes Gmail client requests
 * - Specifically handles "EmailNotFoundInPendingRequest" action
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "EmailNotFoundInPendingRequest" &&
    request.client === "gmail"
  ) {
    console.log("EmailNotFoundInPendingRequest");
    init();
  }
});

/**
 * Chrome runtime message listener for handling server error notifications
 * specifically for Gmail client.
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} request - The message request object
 * @param {string} request.action - Action type, checks for "erroRecievedFromServer"
 * @param {string} request.client - Client type, checks for "gmail"
 *
 * Features:
 * - Listens for server error messages
 * - Validates if error is from Gmail client
 * - Triggers showAlert with "inform" parameter when conditions match
 * - Handles Gmail-specific error notifications
 */
chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "gmail"
  ) {
    showAlert("inform");
    hideLoadingScreen();
  }
});

window.addEventListener("offline", function () {
  showAlert("networkError");
  hideLoadingScreen();
  chrome.storage.local.set({ networkWentOffline: true });
});

window.addEventListener("online", function () {
  // Check if the network previously went offline
  chrome.storage.local.get("networkWentOffline", function (result) {
    if (result.networkWentOffline) {
      chrome.storage.local.remove("networkWentOffline");
      window.location.reload();
    }
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "badRequestServerError" &&
    request.client === "gmail"
  ) {
    showAlert("badRequest");
    hideLoadingScreen();
  }
});

function pendingStatusCallForGmail() {
  chrome.runtime.sendMessage({
    action: "pendingStatusGmail",
    emailId: emailId,
    messageId: messageId,
  });
}

/**
 * Listens for messages from the background or content script and processes actions based on the message.
 *
 * This event listener checks for messages sent by Gmail client, specifically performing actions based
 * on the `action` type. It handles three types of actions:
 * - "blockUrls": Clears the interval, hides the loading screen, and applies the "unsafe" status with the provided reason.
 * - "unblock": Clears the interval, hides the loading screen, and applies the "safe" status.
 * - "pending": Hides the loading screen, sets the pointer events to true, and starts an interval to check for the pending status every 5 seconds.
 *
 * The function also calls `blockEmailBody()` for each action and responds with a status of "success".
 *
 * @param {Object} message - The message object containing details about the action, client, and unsafe reason.
 * @param {Object} sender - Information about the script that sent the message.
 * @param {Function} sendResponse - A function to send a response back to the sender, with the status "success".
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "gmail") {
    messageReason = message.unsafeReason;

    if (message.action === "blockUrls") {
      clearInterval(intervalId);
      hideLoadingScreen();
      shouldApplyPointerEvents = true;
      showAlert("unsafe", messageReason);
    } else if (message.action === "unblock") {
      clearInterval(intervalId);
      hideLoadingScreen();
      shouldApplyPointerEvents = false;
      showAlert("safe");
    } else if (message.action === "pending") {
      hideLoadingScreen();
      shouldApplyPointerEvents = true;
      // showAlert("pending");
      // Clear any existing interval before setting a new one
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Start the interval manually
      intervalId = setInterval(() => {
        // console.log("pendingStatusCallForGmail()");
        pendingStatusCallForGmail();
      }, 5000);
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});
// Function to initialize the script
const init = () => {
  Promise.all([extractMessageIdAndEml(), findEmailId()])
    .then(() => console.log("ok"))
    .catch((error) =>
      console.error(ERROR_MESSAGES.FAILED_TO_SEND_EMAIL_CONTENT)
    );
};

/**
 * Asynchronously extracts the message ID from the currently opened email and determines its security status.
 *
 * This function:
 * - Blocks the email body initially.
 * - Extracts the `data-legacy-message-id` attribute from the email element.
 * - Retrieves stored messages from `chrome.storage.local` to check the email's security status.
 * - Displays appropriate alerts based on the status (`safe`, `unsafe`, or `pending`).
 * - Sends a request to the background script if the email's status is unknown,
 *   fetching security details from the server and updating local storage accordingly.
 * - Ensures proper handling of email security enforcement by setting pointer events.
 *
 * The function interacts with Chrome's storage API and messaging system to process
 * security checks dynamically.
 *
 * Dependencies:
 * - `blockEmailBody()`: Blocks or unblocks email content.
 * - `showAlert(status, reason)`: Displays a security alert.
 * - `chrome.runtime.sendMessage()`: Sends messages to the background script for processing.
 * - `createUrl(newUrl, messageId)`: Handles URL-based operations for message identification.
 *
 * @async
 * @function extractMessageIdAndEml
 */

async function extractMessageIdAndEml() {
  // console.log("start the extractMessageIdAndEml");
  blockEmailBody();
  const node = document.querySelector("[data-legacy-message-id]");
  // console.log("node", node);
  if (!node) {
    // console.log("node not found");
    return;
  }

  messageId = node.getAttribute("data-legacy-message-id");
  // console.log("messageId", messageId);

  if (!messageId) {
    // console.log("messageId not found");
    return;
  }

  chrome.storage.local.get("messages", function (result) {
    let messages = JSON.parse(result.messages || "{}");

    if (messages[messageId]) {
      // console.log("found the message Id");
      const status = messages[messageId].status;
      const unsafeReason = messages[messageId].unsafeReason;

      if (status === "safe" || status === "Safe") {
        clearInterval(intervalId);
        hideLoadingScreen();
        showAlert("safe", unsafeReason);
        shouldApplyPointerEvents = false;
        blockEmailBody();
      } else if (status === "unsafe" || status === "Unsafe") {
        hideLoadingScreen();
        clearInterval(intervalId);
        showAlert("unsafe", unsafeReason);
        shouldApplyPointerEvents = true;
        blockEmailBody();
      } else if (status === "pending" || status === "Pending") {
        shouldApplyPointerEvents = true;
        blockEmailBody();
        pendingEmailId = emailId;
        pendingMessageId = messageId;
        chrome.runtime.sendMessage({
          action: "pendingStatusGmail",
          emailId: emailId,
          messageId: messageId,
        });
      }
    } else {
      // console.log("messageId not found in messages");
      showLoadingScreen();
      shouldApplyPointerEvents = true;
      blockEmailBody();
      chrome.runtime.sendMessage(
        {
          client: "gmail",
          action: "firstCheckForEmail",
          messageId: messageId,
          email: emailId,
        },
        (response) => {
          if (response.IsResponseRecieved === "success") {
            if (response.data.code === 200) {
              // console.log("response in else part", response.data);
              const serverData = response.data.data;
              const resStatus =
                serverData.eml_status || serverData.email_status;
              const messId = serverData.messageId || serverData.msg_id;
              const unsafeReason = serverData.unsafe_reasons || " ";
              if (["safe", "unsafe", "pending"].includes(resStatus)) {
                chrome.storage.local.get("messages", function (result) {
                  let messages = JSON.parse(result.messages || "{}");
                  messages[messId] = {
                    status: resStatus,
                    unsafeReason: unsafeReason,
                  };
                  chrome.storage.local.set(
                    { messages: JSON.stringify(messages) },
                    () => {
                      shouldApplyPointerEvents = resStatus !== "safe";
                      if (resStatus === "pending") {
                        hideLoadingScreen();
                        // showAlert("pending", "Some time");
                        if (intervalId) {
                          clearInterval(intervalId);
                        }
                        intervalId = setInterval(() => {
                          // console.log("pendingStatusCallForGmail()");
                          pendingStatusCallForGmail();
                        }, 5000);
                      } else {
                        blockEmailBody();
                        hideLoadingScreen();
                        showAlert(resStatus, unsafeReason);
                      }
                    }
                  );
                });
              }
            } else {
              setTimeout(() => {
                // console.log("creating the new URL");
                let newUrl = window.location.href;
                // if (newUrl.includes("?compose=")) {
                //   return;
                // }
                createUrl(newUrl, messageId);
              }, 300);
            }
          } else if (response.status === "error") {
            hideLoadingScreen();
            showAlert("inform");
          }
        }
      );
    }
  });
}

let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    hideLoadingScreen();
  }
}).observe(document, { subtree: true, childList: true });

/**
 * Extracts the base Gmail URL from a full Gmail URL
 *
 * @param {string} url - Full Gmail URL to parse
 * @returns {string} Base Gmail URL or default fallback URL
 *
 * @description
 * - Uses regex to match Gmail URL pattern with user number
 * - Extracts base URL up to user number (e.g. /mail/u/0)
 * - Returns default URL if no match found
 *
 * @example
 * // Returns "https://mail.google.com/mail/u/1"
 * getBaseUrl("https://mail.google.com/mail/u/1/inbox")
 *
 * // Returns default "https://mail.google.com/mail/u/0"
 * getBaseUrl("invalid-url")
 */

function getBaseUrl(url) {
  const match = url.match(/^(https:\/\/mail\.google\.com\/mail\/u\/\d+)\//);
  return match ? match[1] : "https://mail.google.com/mail/u/0"; // Default fallback
}

/**
 * Constructs a Gmail EML download URL and sends message data to background script
 *
 * @param {string} url - The current Gmail URL used to extract the base URL
 * @param {string} messageId - The unique identifier for the Gmail message
 *
 * @description
 * This function:
 * 1. Gets the base Gmail URL using getBaseUrl()
 * 2. Constructs an EML download URL with the following parameters:
 *    - view=att: Specifies attachment view
 *    - th: Thread/message ID
 *    - attid=0: Attachment ID (default)
 *    - disp=comp: Display as complete message
 *    - safe=1: Safe mode enabled
 *    - zw: Gmail-specific parameter
 * 3. Sends the constructed URL and message details to background script
 *
 * @example
 * // For Gmail URL: https://mail.google.com/mail/u/0/#inbox/ABC123
 * createUrl('https://mail.google.com/mail/u/0/#inbox/ABC123', 'ABC123');
 * // Creates EML URL: https://mail.google.com/mail/u/0/?view=att&th=ABC123&attid=0&disp=comp&safe=1&zw
 *
 * @throws {Error} Logs error if sending message to background script fails
 */

function createUrl(url, messageId) {
  // console.log("Creatnig the new uRL");
  let prefixUrl = getBaseUrl(url); // Get dynamic base URL
  // console.log("prefixUrl, url", prefixUrl, url);
  let eml_Url = `${prefixUrl}/?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`;
  // console.log("eml_Url", eml_Url);
  try {
    chrome.runtime.sendMessage({
      action: "sendGmailData",
      messageId,
      emailId,
      eml_Url,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.FAILED_TO_SEND_EMAIL_CONTENT);
  }
}

/**
 * Asynchronously extracts an email ID from the document title.
 *
 * This function searches for an email address in the page's title using a regular expression.
 * If an email is found, it stores the last matched email in Chrome's local storage under
 * the key `gmail_email`, while removing any previously stored Yahoo or Outlook email entries.
 *
 * @returns {Promise<void>} - A promise that resolves once the storage update is complete.
 */
async function findEmailId() {
  const titleContent = document.title;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = titleContent.match(emailPattern);
  emailId = emailMatches ? emailMatches[emailMatches.length - 1] : null;
  if (emailId) {
    chrome.storage.local.set({ currentMailId: emailId });
    chrome.storage.local.remove(["yahoo_email", "outlook_email"], () => {
      chrome.storage.local.set({ gmail_email: emailId });
    });
  }
}

/**
 * Attaches an event listener to the document that listens for a click event.
 * When clicked, it checks for an alert container with a `z-index` of 1000.
 * If found, the script removes the alert container from the DOM and
 * unregisters the click event listener to ensure it runs only once.
 *
 * This prevents multiple unnecessary event listener executions after
 * the alert is removed.
 *
 * @param {Event} event - The click event triggered by the user.
 */

document.addEventListener("click", function removeAlertOnClick(event) {
  const alertContainer = document.querySelector("div[style*='z-index: 1000']");
  if (alertContainer && alertContainer.parentNode) {
    alertContainer.parentNode.removeChild(alertContainer);
    document.removeEventListener("click", removeAlertOnClick);
  }
});

/**
 * Toggles the ability to interact with email body elements.
 *
 * This function selects all elements with the class name "nH a98 iY" and
 * modifies their `pointerEvents` style property based on the global
 * variable `shouldApplyPointerEvents`. If `shouldApplyPointerEvents` is
 * true, interaction with these elements is disabled (`pointer-events: none`).
 * Otherwise, interaction is enabled (`pointer-events: all`).
 */
function blockEmailBody() {
  const elements = document.getElementsByClassName("nH a98 iY");
  if (elements && elements.length > 0) {
    Array.from(elements).forEach((element) => {
      if (shouldApplyPointerEvents) {
        element.style.pointerEvents = "none";
      } else {
        element.style.pointerEvents = "all";
      }
    });
  }
}

function isSentOrDraftEmail() {
  console.log("isSentOrDraftEmail called");
  const url = window.location.href;
  return url.includes('#sent') || url.includes('#draft');
}
window.addEventListener("click", (e) => {
  // First check if we're in sent or drafts folder
  const elements = document.getElementsByClassName("nH a98 iY");
  if (isSentOrDraftEmail()) {
    shouldApplyPointerEvents = false;
  }
  if (elements && elements.length > 0) {
    Array.from(elements).forEach(() => {
      if (shouldApplyPointerEvents) {
        showBlockedPopup();
      }
    });
  }
});
// window.addEventListener("click", (e) => {
//   const elements = document.getElementsByClassName("nH a98 iY");
//   if (elements && elements.length > 0) {
//     Array.from(elements).forEach(() => {
//       if (shouldApplyPointerEvents) {
//         showBlockedPopup();
//       }
//     });
//   }
// });

/**
 * Listens for messages from the background script and extracts the email address from the page title.
 *
 * When the "ExtractEMailForGmail" action is received, this function attempts to extract an email address
 * from the document title using a regex pattern. If an email is found, it is stored in Chrome's local storage.
 * If no email is found, the extraction function retries after 200 milliseconds.
 *
 * @param {Object} request - The message received from the background script.
 * @param {Object} sender - Information about the script that sent the message.
 * @param {Function} sendResponse - Function to send a response back to the sender (not used in this implementation).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ExtractEMailForGmail") {
    // console.log("ExtractEMailForGmailExtractEMailForGmailExtractEMailForGmail");
    const extractEmail = () => {
      // setTimeout(() => {
      const titleText = document.title;
      const emailMatch = titleText.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );
      const emailId = emailMatch ? emailMatch[0] : null;
      // console.log("mail : ", emailId);
      if (emailId) {
        chrome.storage.local.set({ currentMailId: emailId });
      } else {
        // Retry after 1 second if email not found
        setTimeout(extractEmail, 200);
      }
      // }, 2000); // Initial delay of 2 seconds
    };

    extractEmail();
  }
});

/**
 * Disables the "Open in new window" menu item in the Gmail context menu.
 *
 * This function searches for menu items with `role="menuitem"` and checks
 * if they contain the text "Open in new window". If found, it disables
 * interaction by setting `pointer-events: none`, reducing opacity,
 * and preventing clicks from triggering any action.
 *
 * Additionally, it disables inner elements, including the `.J-N-Jz`
 * (inner menu item) and `.J-N-JX` (icon element), ensuring that
 * users cannot bypass the restriction.
 */
const disableOpenInNewWindow = () => {
  // Look for menu items with role="menuitem"
  const menuItems = document.querySelectorAll('div.J-N[role="menuitem"]');

  menuItems.forEach((menuItem) => {
    // Check if this menu item contains "Open in new window" text
    if (
      menuItem.textContent &&
      menuItem.textContent.includes("Open in new window")
    ) {
      // console.log('Found "Open in new window" menu item:', menuItem);

      // Disable the entire menu item
      menuItem.style.pointerEvents = "none";
      menuItem.style.opacity = "0.5";
      menuItem.style.cursor = "default";

      // Also disable the inner J-N-Jz element
      const innerElement = menuItem.querySelector(".J-N-Jz");
      if (innerElement) {
        innerElement.style.pointerEvents = "none";
        innerElement.style.cursor = "default";
      }

      // And the icon element
      const iconElement = menuItem.querySelector(".J-N-JX");
      if (iconElement) {
        iconElement.style.pointerEvents = "none";
      }

      // Prevent the default action by adding a click handler
      menuItem.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        },
        true
      );

      // Mark as processed
      menuItem.setAttribute("data-disabled-by-extension", "true");
    }
  });
};

// Create a function to check for context menu appearance
const checkForContextMenu = () => {
  // Check if any context menu is currently visible
  const visibleMenus = document.querySelectorAll(".J-M");
  if (visibleMenus.length > 0) {
    // If a menu is visible, check for the "Open in new window" option
    disableOpenInNewWindow();
  }
};

// Run the check when right-click happens
document.addEventListener(
  "contextmenu",
  () => {
    // Run multiple checks with different timing to catch the menu at different stages
    setTimeout(checkForContextMenu, 0);
    setTimeout(checkForContextMenu, 50);
    setTimeout(checkForContextMenu, 100);
    setTimeout(checkForContextMenu, 200);
  },
  true
);

// Create a mutation observer to watch for menu appearances
const menuObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      // Check if any added nodes are or contain menu items
      const hasMenuItems = Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;

        // Check if this is a menu item or contains menu items
        return (
          node.classList?.contains("J-M") ||
          node.classList?.contains("J-N") ||
          node.querySelector?.('.J-M, .J-N[role="menuitem"]')
        );
      });

      if (hasMenuItems) {
        disableOpenInNewWindow();
      }
    }
  }
});

// Start observing the document body
if (document.body) {
  menuObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    menuObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// Also run a periodic check to catch any menus that might have been missed
setInterval(checkForContextMenu, 500);

/**
 * Listens for messages from the background or content script and processes email size categories.
 *
 * This event listener checks if the received message has the action `"emailSizeCategory"`
 * and comes from the `"gmail"` client. If both conditions are met, it calls
 * `handleEmailSizeCategory` with the provided size category.
 *
 * @param {Object} message - The message object sent from another script.
 * @param {Object} sender - Information about the script that sent the message.
 * @param {Function} sendResponse - A function to send a response back to the sender.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "emailSizeCategory" && message.client === "gmail") {
    // console.log(`message.action === "emailSizeCategory" && message.client === "gmail"`)
    handleEmailSizeCategory(message.sizeCategory);
  }
});

/**
 * Handles email size categorization and displays an alert accordingly.
 *
 * This function takes an email size category and triggers an alert with
 * the corresponding status. It also sets a message describing the email size range.
 *
 * The function categorizes email sizes as:
 * - "underTwo": Emails smaller than 2 MB.
 * - "underTen": Emails between 2 MB and 10 MB.
 * - "underTwenty": Emails between 10 MB and 20 MB.
 * - "overTwenty": Emails larger than 20 MB.
 * - Default case: Unknown email size.
 *
 * @param {string} sizeCategory - The category of the email size.
 */
function handleEmailSizeCategory(sizeCategory) {
  let sizeMessage = "";

  switch (sizeCategory) {
    case "underTwo":
      showAlert("pending", "underTwo");
      sizeMessage = "Email size is under 2 MB";
      break;
    case "underTen":
      showAlert("pending", "underTen");
      sizeMessage = "Email size is between 2-10 MB";
      break;
    case "underTwenty":
      showAlert("pending", "underTwenty");
      sizeMessage = "Email size is between 10-20 MB";
      break;
    case "overTwenty":
      showAlert("pending", "overTwenty");
      sizeMessage = "Email size is over 20 MB";
      break;
    default:
      showAlert("pending", "Some time");
      sizeMessage = "Email size unknown";
  }

  // console.log(`Gmail: ${sizeMessage}`);
}
