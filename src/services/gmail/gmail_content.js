// Component imports
const importComponent = async (path) => {
  const src = chrome.runtime.getURL(path);
  return await import(src);
};
console.log("Content script loaded");
// Initialize UI components
let showAlert = null;
let showBlockedPopup = null;


/**
 * Asynchronously imports two JavaScript modules using Promise.all and assigns specific functions 
 * from the imported modules to global variables.
 *
 * - Imports `email_status.js` and `block_email_popup.js` components.
 * - Extracts `showAlert` from `email_status.js` and assigns it to a global variable.
 * - Extracts `showBlockedPopup` from `block_email_popup.js` and assigns it to a global variable.
 * - Ensures both modules are fully loaded before executing further logic.
 */
Promise.all([
  importComponent("/src/component/email_status/email_status.js"),
  importComponent("/src/component/block_email_popup/block_email_popup.js"),
]).then(([emailStatus, blockPopup]) => {
  showAlert = emailStatus.showAlert;
  showBlockedPopup = blockPopup.showBlockedPopup;
});

/**
 * Continuously checks for the presence of elements with the class "nH a98 iY" in the DOM.
 * The function attempts to locate these elements up to a maximum of 15 times, with a 1-second interval between attempts.
 * 
 * - If the elements are found within the attempts, the `blockEmailBody` function is executed, and the interval is cleared.
 * - If the elements are not found after the maximum attempts, the interval is cleared, and a message is logged to the console.
 * 
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
      console.log("Elements not found after maximum attempts");
    }
  }, 1000);
};

// Replace the original setTimeout with the new function
waitForElements();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
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
    setTimeout(() => {
      let url = window.location.href;

      if (url.includes("?compose=")) {
        return;
      }
      chrome.storage.local.get("registration", (data) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        if (data.registration) {
          const lastSegment = url.split("/").pop().split("#").pop();

          if (lastSegment.length >= isValidSegmentLength) {
            init();
          }
        }
      });
    }, 1000);
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
    const { messageId } = request;
    let new2Url = window.location.href;
    if (new2Url.includes("?compose=")) {
      return;
    }
    createUrl(new2Url, messageId);
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
  }
});

/**
 * Chrome runtime message listener for handling Gmail security states
 * 
 * @param {Object} message - The message object containing:
 *   - client: String identifying the email client ('gmail')
 *   - action: Action to take ('blockUrls'|'unblock'|'pending') 
 *   - unsafeReason: Reason message for unsafe URLs
 * @param {Object} sender - Message sender details
 * @param {Function} sendResponse - Callback to send response
 * 
 * Features:
 * - Handles 3 security states for Gmail:
 *   1. blockUrls: Blocks unsafe content and shows reason
 *   2. unblock: Unblocks content and shows safe message
 *   3. pending: Shows pending verification state
 * - Controls pointer events access via shouldApplyPointerEvents
 * - Stores unsafe reason message
 * - Triggers appropriate alert type based on action
 * - Applies email body blocking
 * - Sends success response back
 * 
 * State Management:
 * - Updates messageReason global variable
 * - Updates shouldApplyPointerEvents boolean
 * - Triggers showAlert with appropriate type
 * - Calls blockEmailBody() to apply restrictions
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "gmail") {
    messageReason = message.unsafeReason;
    if (message.action === "blockUrls") {
      shouldApplyPointerEvents = true;
      showAlert("unsafe", messageReason);
    } else if (message.action === "unblock") {
      shouldApplyPointerEvents = false;
      showAlert("safe");
    } else if (message.action === "pending") {
      shouldApplyPointerEvents = true;
      showAlert("pending");
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});

// Function to initialize the script
const init = () => {
  Promise.all([extractMessageIdAndEml(), findEmailId()])
    .then(() => console.log("Operations completed"))
    .catch((error) => console.error("Error:", error));
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
  blockEmailBody();
  const node = document.querySelector("[data-legacy-message-id]");
  if (!node) {
    return;
  }

  messageId = node.getAttribute("data-legacy-message-id");

  if (!messageId) {
    return;
  }

  chrome.storage.local.get("messages", function (result) {
    let messages = JSON.parse(result.messages || "{}");

    if (messages[messageId]) {
      const status = messages[messageId].status;
      const unsafeReason = messages[messageId].unsafeReason;

      if (status === "safe" || status === "Safe") {
        showAlert("safe", unsafeReason);
        shouldApplyPointerEvents = false;
        blockEmailBody();
      } else if (status === "unsafe" || status === "Unsafe") {
        showAlert("unsafe", unsafeReason);
        shouldApplyPointerEvents = true;
        blockEmailBody();
      } else if (status === "pending" || status === "Pending") {
        shouldApplyPointerEvents = true;
        blockEmailBody();
        chrome.runtime.sendMessage({
          action: "pendingStatusGmail",
          emailId: emailId,
          messageId: messageId,
        });
      }
    } else {
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
                    {
                      messages: JSON.stringify(messages),
                    },
                    () => {
                      shouldApplyPointerEvents = resStatus !== "safe";
                      blockEmailBody();
                      showAlert(resStatus, unsafeReason);
                    }
                  );
                });
              }
            } else {
              setTimeout(() => {
                let newUrl = window.location.href;
                if (newUrl.includes("?compose=")) {
                  return;
                }
                createUrl(newUrl, messageId);
              }, 300);
            }
          } else if (response.status === "error") {
            showAlert("inform");
          }
        }
      );
    }
  });
}

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
  console.log(match);
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
  let prefixUrl = getBaseUrl(url); // Get dynamic base URL
  console.log("prefixUrl is ",prefixUrl);
  let eml_Url = `${prefixUrl}/?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`;
  console.log("eml_Url is ",eml_Url);
  // let prefixUrl = "https://mail.google.com/mail/u/0/";
  // let eml_Url = `${prefixUrl}?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`;
  try {
    chrome.runtime.sendMessage({
      action: "sendGmailData",
      messageId,
      emailId,
      eml_Url,
    });
  } catch (error) {
    console.error("Error sending email content to background script:", error);
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
  if (alertContainer) {
    document.body.removeChild(alertContainer);
    document.removeEventListener("click", removeAlertOnClick); // Remove listener after execution
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

// Add a click event listener to the window to detect the click event on the email body
window.addEventListener("click", (e) => {
  const elements = document.getElementsByClassName("nH a98 iY");
  if (elements && elements.length > 0) {
    Array.from(elements).forEach(() => {
      if (shouldApplyPointerEvents) {
        showBlockedPopup();
      }
    });
  }
});
