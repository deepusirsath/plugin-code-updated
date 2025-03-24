// Component imports
const importComponent = async (path) => {
  const src = chrome.runtime.getURL(path);
  return await import(src);
};

// Initialize UI components
let showAlert = null;
let showBlockedPopup = null;
let showLoadingScreen = null;
let hideLoadingScreen = null;

// import component
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

const ERROR_MESSAGES = {
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  FAILED_TO_SEND_EMAIL_CONTENT:
    "Failed to send email content to background script:",
};

let messageReason = " ";

document.addEventListener("visibilitychange", function () {
  chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {});

  if (document.visibilityState === "visible") {
    // Extract only email from scripts
    const scripts = Array.from(document.querySelectorAll("script[nonce]"));
    let userEmail = null;

    scripts.forEach((script) => {
      const content = script.textContent || script.innerHTML;
      const selectedMailboxRegex =
        /"selectedMailbox":\{"id":"([A-Za-z0-9_-]+)","email":"([A-Za-z0-9@._-]+)"/;
      const selectedMailboxMatch = selectedMailboxRegex.exec(content);

      if (selectedMailboxMatch) {
        userEmail = selectedMailboxMatch[2];
      }
    });

    if (userEmail) {
      chrome.storage.local.set({ currentMailId: userEmail });
      chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {
        chrome.storage.local.set({ yahoo_email: userEmail }, () => {});
      });
    }
  }
});

let extractionDone = false;
let shouldApplyPointerEvents = true;
let sendMessageId;
let sendUserEmail;
const url = window.location.href;

/**
 * Handles checking for Yahoo Mail emails and extracting relevant details.
 *
 * This function listens for messages with the actions "checkYahoomail" or
 * "fetchDisputeMessageId". It searches for the email body within Yahoo Mail's
 * DOM structure and attempts to extract the sender's email if marked as "unsafeEmail".
 * Additionally, it clears stored email data in Chrome's local storage.
 *
 * @param {Object} message - The message object received from the extension.
 * @param {string} message.action - The action type to determine the operation.
 * @param {Function} sendResponse - Callback function to send a response back to the sender.
 *
 * @returns {void} Sends a response containing email details if found or an error message.
 */
function handleYahooMailCheck(message, sendResponse) {
  if (
    message.action == "checkYahoomail" ||
    message.action == "fetchDisputeMessageId"
  ) {
    const emailBodySearch = document.querySelector(
      'div[data-test-id="message-group-view-scroller"]'
    );

    const scripts = Array.from(document.querySelectorAll("script[nonce]"));
    // Regular expression to find "unsafeEmail" values
    const regex = /"unsafeEmail":"(.*?)"/;

    let senderEmail = ""; // Default empty value

    // Loop through each script tag and try to match the regex
    for (const script of scripts) {
      const match = script.textContent.match(regex);
      if (match) {
        senderEmail = match[1]; // Assign the extracted email

        break; // Stop after finding the first match
      }
    }

    chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {});

    if (emailBodySearch) {
      sendResponse({
        emailBodyExists: true,
        messageId: sendMessageId,
        emailId: sendUserEmail,
        senderEmail: senderEmail,
      });
    } else {
      sendResponse({
        emailBodyExists: false,
        error: "did't get the messasge Id",
      });
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleYahooMailCheck(message, sendResponse);
  return true; // Keeps the message channel open for async sendResponse
});

/**
 * Listens for messages sent to the extension and performs actions based on the request.
 *
 * This listener specifically checks if the received message has an action type of "runScript".
 * exits early to allow the page reload to reset the script execution.
 *
 * @param {Object} request - The message received by the listener.
 * @param {Object} sender - Information about the script or extension sending the message.
 * @param {Function} sendResponse - A function to send a response back to the sender.
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "runScript") {
    // Exit early since reload will reset the script
    window.location.reload();
    return;
  }
});

/**
 * Checks if the given URL belongs to Yahoo Mail and contains a message.
 * If conditions are met and extraction has not been done, the function logs the URL
 * and retrieves registration data from Chrome's local storage.
 *
 * - If an error occurs while accessing storage, it logs the error.
 * - If registration data is found, it logs the data and executes the email extraction script.
 *
 * Conditions for execution:
 * - The URL contains "in.mail.yahoo.com"
 * - OR the URL contains "mail.yahoo.com", includes "message", and extraction is not already done.
 */
const yahooMailRegex = /^https:\/\/(in\.)?mail\.yahoo\.com.*message/;
if (yahooMailRegex.test(url) && !extractionDone) {
  chrome.storage.local.get("registration", (data) => {
    if (chrome.runtime.lastError) {
      return;
    }
    if (data.registration) {
      setTimeout(() => {}, 500); // Move this inside executeExtractionScript
      executeExtractionScript();
    }
  });
}

/**
 * Asynchronously executes the email extraction script after a delay.
 *
 * This function waits for 2.5 seconds before performing the following actions:
 * - Extracts the last message ID and user email from nonce scripts.
 * - Calls `blockEmailBody()` to restrict email content visibility.
 * - Stores the extracted message ID and user email in global variables.
 * - Sets `extractionDone` to `true` to indicate completion.
 */
async function executeExtractionScript() {
  setTimeout(() => {
    const { lastMessageId, userEmail } = extractIdsFromNonceScripts();
    blockEmailBody();
    sendMessageId = lastMessageId;
    sendUserEmail = userEmail;
    extractionDone = true;
  }, 2500);
}
chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "badRequestServerError" &&
    request.client === "yahoo"
  ) {
    showAlert("badRequest");
    hideLoadingScreen();
  }
})


let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    hideLoadingScreen();
  }
}).observe(document, { subtree: true, childList: true });

/**
 * Executes the email extraction script with a delay.
 * If extraction fails initially, this function attempts to retrieve the last
 * message ID and user email from nonce scripts, blocks the email body,
 * and sets global variables to store extracted values.
 *
 * The extraction process is marked as complete by setting `extractionDone` to `true`.
 * A timeout of 100ms is used to ensure necessary elements are available.
 */
async function executeExtractionScriptIfFailed() {
  setTimeout(() => {
    const { lastMessageId, userEmail } = extractIdsFromNonceScripts();
    blockEmailBody();
    sendMessageId = lastMessageId;
    sendUserEmail = userEmail;
    extractionDone = true;
  }, 100);
}

/**
 * Listens for messages from the background script and executes specific actions based on the request.
 *
 * This listener checks if the received message has the action "EmailNotFoundInPendingRequest"
 * and originates from the "yahoo" client. If these conditions are met, it logs the request
 * details and triggers the `executeExtractionScriptIfFailed()` function to retry the extraction process.
 *
 * @param {Object} request - The message received from the background script.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - A function to send a response back to the sender (not used in this case).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "EmailNotFoundInPendingRequest" &&
    request.client === "yahoo"
  ) {
    executeExtractionScriptIfFailed();
  }
});

/**
 * fetchLocation retrieves the user's current geographical location if the script is running on Yahoo Mail.
 *
 * - Checks if the current URL belongs to Yahoo Mail domains.
 * - Verifies if geolocation is supported by the browser.
 * - Attempts to get the user's current latitude and longitude.
 * - Handles possible geolocation errors.
 *
 * Note: The function currently does not send the coordinates to the background script, but the logic is in place for future use.
 */
function fetchLocation() {
  // Ensure this only runs on Outlook's live mail domain
  let first = "https://mail.yahoo.com/";
  let second = "https://in.mail.yahoo.com/";
  if (window.location.href.includes(first || second)) {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      return;
    }
    // Attempt to get the user's current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // // Send the coordinates to the background script
        // chrome.runtime.sendMessage({
        //   type: "geoLocationUpdate",
        //   coordinates: {
        //     latitude: latitude,
        //     longitude: longitude,
        //   },
        // });
      },
      (error) => {
        console.error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
      }
    );
  } else {
  }
}

/**
 * Toggles the ability to interact with the email body by enabling or disabling pointer events.
 *
 * This function selects the email body container based on its `data-test-id` attribute.
 * If the element is found, it applies or removes the `pointer-events: none` style depending
 * on the `shouldApplyPointerEvents` flag.
 *
 * - If `shouldApplyPointerEvents` is `true`, interaction with the email body is blocked.
 * - If `shouldApplyPointerEvents` is `false`, interaction is restored.
 */
function blockEmailBody() {
  const element = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );
  if (element) {
    if (shouldApplyPointerEvents) {
      element.style.pointerEvents = "none";
    } else {
      element.style.pointerEvents = "all";
    }
  }
}

/**
 * Extracts message IDs, selected mailbox ID, and user email from nonce scripts in Yahoo Mail.
 *
 * This function scans all nonce-bearing script tags on the page to find and extract message-related data.
 * If the email is in the "Sent" folder, extraction is skipped.
 *
 * The extracted message ID and mailbox ID are used to construct a URL for further processing.
 * The function also checks local storage for message statuses and interacts with the background script
 * to determine whether the email is safe, unsafe, or pending.
 *
 * Key Features:
 * - Extracts `messageId`, `selectedMailboxId`, and `userEmail` from scripts.
 * - Stores the extracted email ID in `chrome.storage.local`.
 * - If message data is missing, retries extraction after a short delay.
 * - Checks local storage for message safety status and applies appropriate UI changes.
 * - Sends requests to the background script to verify email safety if status is unknown.
 * - Blocks or allows email access based on security analysis.
 *
 * @returns {Object} An object containing the last extracted message ID and user email.
 */
function extractIdsFromNonceScripts() {
  let messageIds = [];
  let selectedMailboxId = null;
  let userEmail = null;

  const isSentFound = Array.from(
    document.querySelectorAll('div[data-test-id="pill-text"]')
  ).some((div) => div.textContent.trim() === "Sent");

  if (isSentFound) {
    shouldApplyPointerEvents = false;
    hideLoadingScreen();

    return;
  }

  const scripts = Array.from(document.querySelectorAll("script[nonce]"));

  scripts.forEach((script) => {
    const nonceValue = script.getAttribute("nonce");
    const content = script.textContent || script.innerHTML;

    if (nonceValue === "") {
      const messageIdRegex = /"messageId":"([A-Za-z0-9_-]+)"/g;
      const selectedMailboxRegex =
        /"selectedMailbox":\{"id":"([A-Za-z0-9_-]+)","email":"([A-Za-z0-9@._-]+)"/;

      let match;
      while ((match = messageIdRegex.exec(content)) !== null) {
        messageIds.push(match[1]);
      }

      const selectedMailboxMatch = selectedMailboxRegex.exec(content);
      if (selectedMailboxMatch) {
        selectedMailboxId = selectedMailboxMatch[1];
        userEmail = selectedMailboxMatch[2];
      }
      chrome.storage.local.set({ yahoo_email: userEmail }, () => {});
    } else {
    }
  });

  // Construct the URL using the last messageId and selectedMailboxId
  let lastMessageId = messageIds[messageIds.length - 1];

  // If messageId or selectedMailboxId is not found, re-execute after 1 second
  if (!selectedMailboxId || !lastMessageId) {
    setTimeout(executeExtractionScriptIfFailed, 200);
    return;
  }

  if (lastMessageId) {
    chrome.storage.local.get("messages", function (result) {
      let messages = JSON.parse(result.messages || "{}");
      if (messages[lastMessageId]) {
        const status = messages[lastMessageId].status;
        const unsafeReason = messages[lastMessageId].unsafeReason;

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
          hideLoadingScreen();
          showAlert("pending", unsafeReason);

          chrome.runtime.sendMessage({
            action: "pendingStatusYahoo",
            emailId: sendUserEmail,
            messageId: sendMessageId,
          });
        }
      } else {
        showLoadingScreen();
        shouldApplyPointerEvents = true;
        blockEmailBody();

        chrome.runtime.sendMessage(
          {
            client: "yahoo",
            action: "firstCheckForEmail",
            messageId: lastMessageId,
            email: userEmail,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              return;
            }
            let error = response.status;

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
                      { messages: JSON.stringify(messages) },
                      () => {
                        hideLoadingScreen();
                        showAlert(resStatus, unsafeReason);

                        if (resStatus === "pending") {
                          shouldApplyPointerEvents = true;

                          // Clear any previous interval before setting a new one
                          if (intervalId) {
                            clearInterval(intervalId);
                          }

                          intervalId = setInterval(() => {
                            // console.log("pendingStatusCallForYahoo()");
                            pendingStatusCallForYahoo();
                          }, 5000);
                        } else {
                          // If the status is "safe" or "unsafe", clear the interval (if any)
                          if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                          }
                          shouldApplyPointerEvents = resStatus !== "safe";
                        }

                        blockEmailBody(); // Execute after all conditions
                      }
                    );
                  });
                }
              } else {
                blockEmailBody();

                setTimeout(() => {
                  createUrl(selectedMailboxId, lastMessageId, userEmail);
                }, 100);
              }
            } else if (response.status === "error") {
              showAlert("inform");
              hideLoadingScreen();
            }
          }
        );
      }
    });
  } else {
  }
  return { lastMessageId, userEmail };
}

/**
 * Constructs a Yahoo Mail API URL to fetch the raw plaintext content of an email
 * and sends the extracted URL along with email details to the background script.
 *
 * @param {string} selectedMailboxId - The unique identifier for the selected mailbox.
 * @param {string} lastMessageId - The unique identifier for the last email message.
 * @param {string} userEmail - The email address of the user.
 */
function createUrl(selectedMailboxId, lastMessageId, userEmail) {
  const url = `https://apis.mail.yahoo.com/ws/v3/mailboxes/@.id==${selectedMailboxId}/messages/@.id==${lastMessageId}/content/rawplaintext?appId=YMailNovation`;
  try {
    chrome.runtime.sendMessage({
      action: "sendYahooData",
      lastMessageId,
      userEmail,
      url,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.FAILED_TO_SEND_EMAIL_CONTENT);
  }
}

/**
 * Listens for messages sent from the background script or other parts of the extension.
 * Specifically, it handles error messages received from the server for Yahoo clients.
 * If the request action is "erroRecievedFromServer" and the client is "yahoo",
 *
 * @param {Object} request - The message received, containing action and client details.
 * @param {Object} sender - The sender of the message (not used in this case).
 * @param {Function} sendResponse - A function to send a response back to the sender (not used in this case).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "yahoo"
  ) {
    showAlert("inform");
    hideLoadingScreen();
  }
});

/**
 * Listens for messages sent to the content script from other parts of the Chrome extension.
 * This listener specifically handles messages related to the Yahoo client.
 *
 * @param {Object} message - The message object received from the sender.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - A function to send a response back to the sender.
 *
 * Behavior:
 * - If the message is from the Yahoo client (`message.client === "yahoo"`):
 *   - Stores the unsafe reason from the message.
 *   - Removes stored email data (`gmail_email` and `outlook_email`) from `chrome.storage.local`.
 *   - Depending on the `message.action`, the script performs different tasks:
 *     - `"blockUrls"`: Enables pointer events restriction, displays an "unsafe" alert, and logs blocking action.
 *     - `"unblock"`: Disables pointer events restriction, displays a "safe" alert, and logs unblocking action.
 *     - `"pending"`: Enables pointer events restriction, displays a "pending" alert, and logs the pending status.
 *   - Calls `blockEmailBody()` to apply necessary email body restrictions.
 *   - Sends a success response back to the sender.
 */

// let pendingCounter = 0;
function pendingStatusCallForYahoo() {
  // pendingCounter++;
  // console.log("pendingCounter", pendingCounter);
  // console.log("sendMessageId", sendMessageId);
  chrome.runtime.sendMessage({
    action: "pendingStatusYahoo",
    emailId: sendUserEmail,
    messageId: sendMessageId,
  });
}

let intervalId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "yahoo") {
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
      showAlert("pending");
      // Clear any existing interval before setting a new one
      if (intervalId) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(() => {
        // console.log("pendingStatusCallForYahoo()");
        pendingStatusCallForYahoo();
      }, 5000);
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});

/**
 * Listens for click events on the window and checks for the presence of a specific
 * message group view element in the DOM. If the `shouldApplyPointerEvents` flag
 * is set to true and the element exists, it triggers the `showBlockedPopup()` function.
 *
 * This function is used to enforce restrictions on certain UI elements by displaying
 * a blocked popup when interactions are detected.
 */
window.addEventListener("click", (e) => {
  const element = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );
  if (shouldApplyPointerEvents && element) {
    showBlockedPopup();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ExtractEMailForYahoo") {
    // console.log("Received message from background script:==========", request);
    setTimeout(() => {
      const titleContent = document.title;
      const emailRegex = /- ([\w.-]+@[\w.-]+) - Yahoo Mail/;
      const match = titleContent.match(emailRegex);
      if (match && match[1]) {
        const email = match[1];
        // console.log("Extracted Email:", email);
        chrome.storage.local.set({ currentMailId: email });
      }
    }, 1000);
  }
});
