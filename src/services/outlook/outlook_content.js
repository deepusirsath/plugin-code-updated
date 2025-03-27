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

let messageReason = " ";

const ERROR_MESSAGES = {
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
};

// Listen for tab activation/focus
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    findOutlookEmailId();
  }
});

let userEmailId = null;
let dataConvid;
let intervalId = null;

/**
 * Retrieves the "registration" data from Chrome's local storage.
 * If registration data is found, it initializes the Outlook-related functionalities.
 * The initialization process involves:
 * - Finding the Outlook email ID
 * - Setting up click listeners
 * - Handling email interactions
 *
 * These operations are executed in parallel using `Promise.all()`.
 */
chrome.storage.local.get("registration", (data) => {
  if (chrome.runtime.lastError) {
    return;
  }
  if (data.registration) {
    const initializeOutlook = async () => {
      // Run these operations in parallel since they're independent
      await Promise.all([
        findOutlookEmailId(),
        setupClickListener(),
        handleEmailInteractions(),
      ]);
    };

    // Execute initialization
    initializeOutlook().catch((error) =>
      console.error(ERROR_MESSAGES.SOMETHING_WENT_WRONG)
    );
  }
});

/**
 * Handles email interactions by adding event listeners to specific elements.
 *
 * This function runs at an interval of 1 second and performs the following actions:
 * 1. Logs a message indicating it is checking for email interactions.
 * 2. Selects all elements with the class `.EeHm8` and adds a click event listener:
 *    - Disables pointer events on click.
 *    - Restores pointer events after 3 seconds.
 * 3. Selects all elements with the class `.bvdCQ` and disables their pointer events permanently.
 */
function handleEmailInteractions() {
  setInterval(() => {
    // Handle .EeHm8 elements
    const emailElements = document.querySelectorAll(".EeHm8");
    emailElements.forEach((element) => {
      element.addEventListener("click", () => {
        element.style.pointerEvents = "none";
        setTimeout(() => {
          element.style.pointerEvents = "auto";
        }, 3000);
      });
    });

    // Handle .bvdCQ elements
    const bvdElements = document.querySelectorAll(".bvdCQ");
    bvdElements.forEach((element) => {
      element.style.pointerEvents = "none";
    });
  }, 1000); // Checks every 1 second
}

/**
 * Fetches the user's geolocation coordinates if the script is running on
 * Outlook's live mail domain.
 *
 * - Ensures the function only executes on `outlook.live.com`.
 * - Checks if geolocation is supported by the browser.
 * - Retrieves the user's current latitude and longitude if permission is granted.
 * - Sends the coordinates to the background script via `chrome.runtime.sendMessage`.
 * - Handles errors if geolocation access is denied or unavailable.
 *
 * If the script is not running on Outlook, Yahoo, or Gmail, it logs a message and exits.
 */
function fetchLocation() {
  // Ensure this only runs on Outlook's live mail domain
  if (window.location.href.includes("outlook.live.com")) {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      return;
    }

    // Attempt to get the user's current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Send the coordinates to the background script
        chrome.runtime.sendMessage({
          type: "geoLocationUpdate",
          coordinates: {
            latitude: latitude,
            longitude: longitude,
          },
        });
      },
      (error) => {
        console.error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
      }
    );
  } else {
  }
}




let lastUrlPath = location.pathname;
// console.log("Initial URL path:", lastUrlPath);
new MutationObserver(() => {
  const currentUrlPath = location.pathname;
  if (currentUrlPath !== lastUrlPath) {
    lastUrlPath = currentUrlPath;
    
    // Check if the current URL matches any of the target paths
    const urlRegex = /^\/mail(\/\d+)?(\/junkemail|\/deleteditems|\/archive)?$/;
    if (urlRegex.test(currentUrlPath)) {
      // console.log("Detected navigation to target Outlook path:", currentUrlPath);
      // Reset any existing click listeners and set up new ones
      setupClickListener();
    }
  }
}).observe(document, { subtree: true, childList: true });


chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "badRequestServerError" &&
    request.client === "outlook"
  ) {
    showAlert("badRequest");
    hideLoadingScreen();
  }
})

/**
 * Listens for messages sent from other parts of the Chrome extension.
 *
 * This listener checks for specific actions ("checkOutlookmail" or "fetchDisputeMessageId")
 * and attempts to locate the email body in the Outlook web interface. If found, it extracts
 * the sender's email and message ID, then sends this data as a response.
 *
 * - If an email body is found, it retrieves:
 *   - The sender's email (if available).
 *   - The message ID (`dataConvid`).
 *   - The user's email (`userEmailId`).
 *
 * - If the email body is not found, it returns an error message.
 *
 * @param {Object} message - The received message object.
 * @param {Object} sender - The sender object providing details about the sender.
 * @param {Function} sendResponse - A callback function to send a response.
 * @returns {boolean} - Returns `true` to indicate an asynchronous response.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action == "checkOutlookmail" ||
    message.action == "fetchDisputeMessageId"
  ) {
    const emailBodySearch =
      document.querySelector("#ConversationReadingPaneContainer") ||
      document.querySelector("#ReadingPaneContainerId");

    if (emailBodySearch) {
      const senderEmailElement = document.querySelector(".OZZZK");
      let senderEmail = null;
      if (senderEmailElement) {
        const emailMatch = senderEmailElement.textContent.match(/<([^>]+)>/);
        senderEmail = emailMatch ? emailMatch[1] : userEmailId;
      }
      sendResponse({
        emailBodyExists: true,
        messageId: dataConvid,
        emailId: userEmailId,
        senderEmail: senderEmail,
      });
    } else {
      sendResponse({
        emailBodyExists: false,
        error: "did't get the messasge Id",
      });
    }
  }
  return true;
});

/**
 * Detects clicks on specific menu items in an email client and triggers a page reload.
 *
 * This function listens for click events and determines whether the clicked element
 * or its parent is a menu item such as "Junk Email," "Archive," "Deleted Items,"
 * "Sent Items," "Drafts," or "Inbox." If a match is found, the page reloads after
 * a short delay.
 *
 * Steps:
 * 1. Identifies the target element from the event.
 * 2. Traverses up the DOM tree to ensure the correct parent <div> is found.
 * 3. Uses a helper function to check if the target matches specified menu items.
 * 4. If a matching menu item is clicked, the script reloads the page after 200ms.
 *
 * @param {Event} event - The click event object.
 */
function detectMenuItems(event) {
  let target = event.target;

  // Traverse up the DOM tree to find the parent div, in case the click was on a child element
  while (target && target.tagName !== "DIV") {
    target = target.parentElement;
  }

  // Helper function to check if the target matches the given criteria
  function isMatchingDiv(target, titleText, folderName) {
    return (
      target &&
      target.tagName === "DIV" &&
      target
        .getAttribute("title")
        ?.toLowerCase()
        .includes(titleText.toLowerCase()) &&
      (target.getAttribute("aria-selected") === "true" ||
        target.getAttribute("data-folder-name")?.toLowerCase() ===
          folderName.toLowerCase())
    );
  }

  const isJunkEmailDiv = isMatchingDiv(target, "junk email", "junk email");
  const isArchiveDiv = isMatchingDiv(target, "archive", "archive");
  const isDeletedItemsDiv = isMatchingDiv(
    target,
    "deleted items",
    "deleted items"
  );
  const isSentItemsDiv = isMatchingDiv(target, "sent items", "sent items");
  const isDraftDiv = isMatchingDiv(target, "drafts", "drafts");
  const isInboxDiv = isMatchingDiv(target, "inbox", "inbox");

  if (
    isJunkEmailDiv ||
    isArchiveDiv ||
    isDeletedItemsDiv ||
    isSentItemsDiv ||
    isDraftDiv ||
    isInboxDiv
  ) {
    // reInitializeTheScript();
    setTimeout(() => {
      window.location.reload();
    }, 200);
    // twoSecondDelay();
  }
}
document.addEventListener("click", detectMenuItems, true);

// Global boolean flag to control the execution of blockEmailBody
let shouldApplyPointerEvents = true; // Default value

// Blocking user interactions

function blockUserInteraction() {
  document.body.style.pointerEvents = "none"; // Disable all pointer events on the page
  window.addEventListener("keydown", preventDefaultForKeyPress, true); // Block keyboard interaction
  window.addEventListener("mousedown", preventDefaultForMouse, true); // Block mouse clicks
}
// Unblocking user interactions
function unblockUserInteraction() {
  document.body.style.pointerEvents = ""; // Re-enable pointer events
  window.removeEventListener("keydown", preventDefaultForKeyPress, true); // Unblock keyboard
  window.removeEventListener("mousedown", preventDefaultForMouse, true); // Unblock mouse clicks
}

function preventDefaultForKeyPress(e) {
  e.preventDefault(); // Prevent all key presses
}

function preventDefaultForMouse(e) {
  e.preventDefault(); // Prevent all mouse events
}

function hideTargetedLoadingScreen(loadingOverlay) {
  if (loadingOverlay && loadingOverlay.parentNode) {
    loadingOverlay.parentNode.removeChild(loadingOverlay);
  }
}

/**
 * Executes the email extraction process with a loading screen.
 *
 * This function temporarily disables user interaction, displays a loading screen,
 * and attempts to extract email content asynchronously. Once the extraction
 * process completes (whether successfully or not), it hides the loading screen
 * and re-enables user interaction.
 *
 * Steps:
 * 1. Blocks user interactions.
 * 2. Displays a loading screen.
 * 3. Runs the email extraction process.
 * 4. Hides the loading screen and restores user interactions.
 *
 * @async
 * @function executeWithLoadingScreenAndExtraction
 */

// Add this flag at the top of the file with other global variables
let isExtractionInProgress = false;

/**
 * Executes the email extraction process with a loading screen.
 * Modified to prevent multiple concurrent executions.
 */
async function executeWithLoadingScreenAndExtraction() {
  // If extraction is already in progress, don't start another one
  if (isExtractionInProgress) {
    // console.log("Email extraction already in progress, skipping new request");
    return;
  }
 
  // Set flag to indicate extraction is in progress
  isExtractionInProgress = true;
 
  blockUserInteraction(); // Disable all user interactions
  showLoadingScreen(); // Show the loading screen indefinitely

  try {
    await runEmailExtraction(); // Extract email content
  } catch (error) {
    console.error("Error during email extraction:", error);
  } finally {
    // Reset flag when extraction is complete (whether successful or not)
    isExtractionInProgress = false;
    unblockUserInteraction(); // Re-enable user interactions
  }
}
// async function executeWithLoadingScreenAndExtraction() {
//   blockUserInteraction(); // Disable all user interactions
//   showLoadingScreen(); // Show the loading screen indefinitely

//   try {
//     await runEmailExtraction(); // Extract email content
//   } finally {
//     // hideLoadingScreen(); // Hide the loading screen once email content is extracted
//     unblockUserInteraction(); // Re-enable user interactions
//   }
// }

let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    hideLoadingScreen();
  }
}).observe(document, { subtree: true, childList: true });

/**
 * Toggles the pointer-events property of email body containers to either block or allow interactions.
 *
 * This function targets two specific elements:
 * - `#ConversationReadingPaneContainer`: The main reading pane for emails.
 * - `#ItemReadingPaneContainer`: The reading pane for junk emails.
 *
 * It checks if either element exists and applies the pointer-events style based on the global
 * `shouldApplyPointerEvents` flag:
 * - If `shouldApplyPointerEvents` is `true`, it sets `pointer-events: none` to block interactions.
 * - If `shouldApplyPointerEvents` is `false`, it sets `pointer-events: all` to allow interactions.
 *
 * A helper function `applyPointerEvents()` is used to apply the styles and log the changes.
 */
function blockEmailBody() {
  const element = document.querySelector("#ConversationReadingPaneContainer");
  const junkBox = document.querySelector("#ItemReadingPaneContainer");

  // Function to apply pointer events to an element if it exists
  function applyPointerEvents(el, state) {
    if (el) {
      el.style.pointerEvents = state;
    }
  }

  // Apply pointer events to both elements
  if (element || junkBox) {
    const pointerState = shouldApplyPointerEvents ? "none" : "all";
    applyPointerEvents(element, pointerState);
    applyPointerEvents(junkBox, pointerState);
  }
}

/**
 * Sets up a click event listener for email elements within the email list container.
 *
 * This function attempts to find the email list container (`.customScrollBar.jEpCF`),
 * and if found, it listens for clicks on email elements (`.EeHm8`). When an email is clicked,
 * it extracts the `data-convid` attribute from the selected email and constructs a unique
 * message ID using timestamp data. It then verifies the email status against stored data
 * in `chrome.storage.local` and applies necessary actions based on its classification
 * (safe, unsafe, or pending).
 *
 * Behavior:
 * - Listens for clicks on email elements.
 * - Extracts and processes `data-convid` from the clicked element.
 * - Waits for time-related elements (`SentReceivedSavedTime`) to appear in the DOM.
 * - Constructs a unique message identifier based on the email's timestamp.
 * - Checks if the email belongs to "Sent Items" or "Drafts".
 * - Determines whether the email should be blocked based on stored statuses.
 * - Interacts with `chrome.storage.local` to retrieve and update email safety status.
 * - If no stored data is found, it sends a request to the background script for verification.
 * - If necessary, executes an email extraction process after applying safety checks.
 *
 * If the email list container is not immediately found, the function retries for a specified
 * number of attempts before giving up.
 *
 * @param {number} attempts - Number of retry attempts for finding the email list container. Defaults to 500.
 */
function setupClickListener(attempts = 500) {
  const emailListContainer = document.querySelector(".customScrollBar.jEpCF");
  if (emailListContainer) {
    emailListContainer.addEventListener("click", (event) => {
      emailListContainer.style.pointerEvents = "none";
      setTimeout(() => {
        emailListContainer.style.pointerEvents = "auto";
      }, 2000);

      let clickedElement = event.target;

      while (clickedElement && !clickedElement.classList.contains("EeHm8")) {
        clickedElement = clickedElement.parentElement;
      }
      if (clickedElement) {
        const waitForTimeElements = () => {
          return new Promise((resolve) => {
            const checkElements = () => {
              const timeElements = document.querySelectorAll(
                'div[data-testid="SentReceivedSavedTime"]'
              );
              if (timeElements && timeElements.length > 0) {
                resolve(timeElements);
              } else {
                setTimeout(checkElements, 100);
              }
            };
            checkElements();
          });
        };

        setTimeout(() => {
          const selectedDiv = clickedElement.querySelector(
            'div[aria-selected="true"]'
          );
          dataConvid = selectedDiv?.getAttribute("data-convid");

          //Adding the new message Id creation functionality
          waitForTimeElements().then((timeElements) => {
            const countNumber = timeElements.length;
            const lastTimeElement = timeElements[timeElements.length - 1];
            const timeText = lastTimeElement.textContent;
            const lastTime = new Date(timeText);
            const newDateTime = `${lastTime.getFullYear()}${(
              lastTime.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}${lastTime
              .getDate()
              .toString()
              .padStart(2, "0")}_${lastTime
              .getHours()
              .toString()
              .padStart(2, "0")}${lastTime
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;

            const MessageIdCreated = `${dataConvid}_${newDateTime}_${countNumber}`;
            let NewMessageId = MessageIdCreated.slice(0, 84);
            dataConvid = NewMessageId;

            // Get aria-label from the clicked element
            const ariaLabelDiv =
              clickedElement.querySelector("div[aria-label]");
            const ariaLabel = ariaLabelDiv?.getAttribute("aria-label");
            const containsUnknown = ariaLabel?.includes("[Unknown]");

            // Query once for inner folder div
            const innerFolderDiv = document.querySelector("span.vlQVl.jXaVF");
            const isSentItems = innerFolderDiv?.textContent === "Sent Items";
            const isDraftItems = innerFolderDiv?.textContent === "Drafts";

            if (isSentItems) {
            } else if (isDraftItems) {
            }

            // Execute further actions if necessary conditions are met
            if (containsUnknown || isSentItems || isDraftItems) {
              shouldApplyPointerEvents = false;
              blockEmailBody();
              return;
            } else if (dataConvid) {
              chrome.storage.local.get("messages", function (result) {
                let messages = JSON.parse(result.messages || "{}");

                if (messages[dataConvid]) {
                  const status = messages[dataConvid].status;
                  const unsafeReason = messages[dataConvid].unsafeReason;

                  if (status === "safe") {
                    clearInterval(intervalId);
                    shouldApplyPointerEvents = false;
                    blockEmailBody();
                    hideLoadingScreen();
                    showAlert("safe", unsafeReason);
                  } else if (status === "unsafe") {
                    clearInterval(intervalId);
                    showAlert("unsafe", unsafeReason);
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                    hideLoadingScreen();
                  } else if (status === "pending") {
                    hideLoadingScreen();
                    showAlert("pending", unsafeReason);
                    chrome.storage.local.get("outlook_email", (data) => {
                      chrome.runtime.sendMessage({
                        action: "pendingStatusOutlook",
                        emailId: data.outlook_email,
                        messageId: dataConvid,
                      });
                      shouldApplyPointerEvents = true;
                      blockEmailBody();
                    });
                  } else {
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                  }
                } else {
                  shouldApplyPointerEvents = true;
                  blockEmailBody();
                  chrome.runtime
                    .sendMessage(
                      {
                        client: "outlook",
                        action: "firstCheckForEmail",
                        messageId: dataConvid,
                        email: userEmailId,
                      },
                      (response) => {
                        let error = response.status;
                        if (response.IsResponseRecieved === "success") {
                          if (response.data.code === 200) {
                            const serverData = response.data.data;
                            const resStatus =
                              serverData.eml_status || serverData.email_status;
                            const messId =
                              serverData.messageId || serverData.msg_id;
                            const unsafeReason =
                              serverData.unsafe_reasons || " ";

                            if (
                              ["safe", "unsafe", "pending"].includes(resStatus)
                            ) {
                              chrome.storage.local.get(
                                "messages",
                                function (result) {
                                  let messages = JSON.parse(
                                    result.messages || "{}"
                                  );
                                  messages[messId] = {
                                    status: resStatus,
                                    unsafeReason: unsafeReason,
                                  };

                                  chrome.storage.local.set(
                                    {
                                      messages: JSON.stringify(messages),
                                    },
                                    () => {
                                      if (resStatus === "pending") {
                                        handlePendingStatus();
                                      } else {
                                        shouldApplyPointerEvents =
                                          resStatus !== "safe";
                                        blockEmailBody();
                                        showAlert(resStatus, unsafeReason);
                                      }
                                    }
                                  );
                                }
                              );
                            }

                            // Function to handle "pending" status
                            function handlePendingStatus() {
                              hideLoadingScreen();
                              shouldApplyPointerEvents = true;
                              showAlert("pending");
                              // Clear any existing interval before starting a new one
                              if (intervalId) {
                                clearInterval(intervalId);
                              }

                              intervalId = setInterval(() => {
                                // console.log("pendingStatusCallForOutlook()");
                                pendingStatusCallForOutlook();
                              }, 5000);
                            }
                          } else {
                            shouldApplyPointerEvents = true;
                            blockEmailBody();
                            setTimeout(() => {
                              if (!isExtractionInProgress) {
                                executeWithLoadingScreenAndExtraction();
                              } else {
                                // console.log("Skipping extraction request as one is already in progress");
                              }
                            }, 100);
                          }
                        } else if (response.status === "error") {
                          showAlert("networkError");
                          hideLoadingScreen();
                        }
                      }
                    )
                    .catch((error) => {
                      showAlert("inform");
                      hideLoadingScreen();
                    });
                }
              });
            } else {
            }
          });
        }, 1000);
      }
    });
  } else if (attempts > 0) {
    setTimeout(() => setupClickListener(attempts - 1), 500);
  } else {
  }
}

window.addEventListener('offline', function() {
  showAlert("networkError");
  hideLoadingScreen();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "outlook"
  ) {
    showAlert("inform");
    hideLoadingScreen();
  }
});

/**
 * Asynchronously extracts email content from Outlook's web interface.
 *
 * This function automates the process of navigating the Outlook email UI,
 * opening the contextual menu, selecting "View message source," extracting
 * the email's raw text, and sending it to the background script for further
 * processing.
 *
 * Steps:
 * 1. Identifies the active email reading pane.
 * 2. Clicks on the last navigation button to open the contextual menu.
 * 3. Waits for the menu to open and extracts its options.
 * 4. Triggers a mouseover event on the "View" button.
 * 5. Clicks "View message source" to open the raw email content.
 * 6. Extracts and sends the email text to the background script.
 * 7. Closes the email modal after extraction.
 *
 * The function includes retry logic to handle dynamic UI changes.
 */
async function runEmailExtraction() {
  // Batch processing for DOM interactions
  const processNavigationButton = async () => {
    // First find which container is active
    const activeContainer =
      document.querySelector("#ConversationReadingPaneContainer") ||
      document.querySelector("#ItemReadingPaneContainer");

    if (activeContainer) {
      // Find all menu buttons within the active container
      const navi = activeContainer.querySelectorAll(".ms-Button--hasMenu");

      // Get the last button from the collection
      const lastIndex = navi.length - 1;

      if (navi[lastIndex] && navi[lastIndex].offsetParent !== null) {
        navi[lastIndex].click();
        await waitForMenu();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await processNavigationButton();
      }
    }
  };

  const waitForMenu = async () => {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        const list = document.querySelector(".ms-ContextualMenu-list.is-open");
        if (list) {
          resolve(extractMenu(list)); // Call extractMenu directly
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  };

  const extractMenu = async (list) => {
    const listItems = list.querySelectorAll(".ms-ContextualMenu-item");
    for (const item of listItems) {
      const button = item.querySelector("button.ms-ContextualMenu-link");
      const buttonText = button?.querySelector(".ms-ContextualMenu-itemText");
      if (buttonText?.textContent === "View") {
        const mouseoverEvent = new MouseEvent("mouseover", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        button.dispatchEvent(mouseoverEvent);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Short delay
    await clickViewMessageSource();
  };

  const clickViewMessageSource = async () => {
    const button = document.querySelector(
      'button[aria-label="View message source"]'
    );
    if (button) {
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for content to load
      await extractTextContent();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await clickViewMessageSource(); // Retry
    }
  };

  const extractTextContent = async () => {
    const element = document.querySelector(".lz61e.allowTextSelection");
    if (element && element.innerText.trim().length > 0) {
      const emailContent = element.innerText;

      await sendContentToBackground(emailContent);
      await closeEmail();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await extractTextContent(); // Retry
    }
  };

  const sendContentToBackground = async (emailContent) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "outlookEmlContent", emailContent, dataConvid, userEmailId },
        function (response) {
          resolve();
        }
      );
    });
  };

  const closeEmail = async () => {
    const overlay = document.querySelector(
      ".fui-DialogSurface__backdrop.rsptlh5"
    );
    overlay.click();
    // Enable scrolling (if it was disabled during the modal display)
  };

  // Start the extraction process
  await processNavigationButton();
}

/**
 * Listens for messages from the background script and performs actions based on the message content.
 * This listener is specifically for handling messages related to the Outlook client.
 *
 * @param {Object} message - The message object received from the background script.
 * @param {string} message.client - Identifies the client (should be "outlook").
 * @param {string} message.action - The action to be performed ("blockUrls", "unblock", or "pending").
 * @param {string} [message.unsafeReason] - The reason provided when blocking URLs.
 * @param {Object} sender - The sender object providing context about the source of the message.
 * @param {Function} sendResponse - A callback function to send a response back to the sender.
 *
 * Actions:
 * - "blockUrls": Blocks URLs by setting `shouldApplyPointerEvents` to `true` and displaying an "unsafe" alert.
 * - "unblock": Unblocks URLs by setting `shouldApplyPointerEvents` to `false` and displaying a "safe" alert.
 * - "pending": Sets URLs to a pending state by setting `shouldApplyPointerEvents` to `true` and displaying a "pending" alert.
 *
 * After processing the message, it calls `blockEmailBody()` to apply the necessary UI restrictions.
 * A success response is sent back to acknowledge message handling.
 */
function pendingStatusCallForOutlook() {
  chrome.runtime.sendMessage({
    action: "pendingStatusOutlook",
    emailId: userEmailId,
    messageId: dataConvid,
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "outlook") {
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
        // console.log("pendingStatusCallForOutlook()");
        pendingStatusCallForOutlook();
      }, 5000);
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});

/**
 * Finds and stores the logged-in Outlook email ID from the current Outlook mail page.
 *
 * This function first checks if the current URL belongs to an Outlook mail page using a regex pattern.
 * If the page is valid, it starts an interval-based search to find an anchor element with
 * `aria-label="Go to Outlook"`, which contains the email ID in its `href` attribute.
 *
 * Once found, the email ID is extracted, decoded, and stored in Chrome's local storage under
 * the key `outlook_email`. It also removes any previously stored Gmail and Yahoo email IDs.
 *
 * If the email ID is not found initially, the function continues searching every 500 milliseconds
 * until the email ID is located or the script is stopped.
 */
function findOutlookEmailId() {
  const outlookRegex =
    /^https:\/\/(?:outlook\.office\.com|outlook\.live\.com|office\.live\.com|outlook\.office365\.com)\/mail\//;

  if (!outlookRegex.test(window.location.href)) {
    return;
  }
  const searchInterval = setInterval(() => {
    const anchor = [...document.querySelectorAll("a")].find(
      (a) => a.getAttribute("aria-label") === "Go to Outlook"
    );
    if (anchor) {
      const match = anchor.getAttribute("href").match(/login_hint=([^&]+)/);
      userEmailId = match ? decodeURIComponent(match[1]) : null;

      if (userEmailId) {
        clearInterval(searchInterval); // Stop searching once email ID is found

        // Add the storage code here
        chrome.storage.local.remove(["gmail_email", "yahoo_email"], () => {
          chrome.storage.local.set({ outlook_email: userEmailId }, () => {});
        });
        chrome.storage.local.set({ currentMailId: userEmailId });
        return;
      }
    }
  }, 500); // Run the search every 0.5 second (adjust interval as needed)
}

chrome.storage.local.get(null, function (data) {});

chrome.storage.local.get("messages", function (result) {
  let messages = JSON.parse(result.messages || "{}"); // Ensure messages is an object
});

chrome.storage.local.get("registration", (data) => {
  if (chrome.runtime.lastError) {
    return;
  }

  if (data.registration) {
    window.addEventListener("load", () => {
      setTimeout(checkReloadStatusOutlook, 1000);
    });
  }
});

/**
 * Checks and reloads the status of an email in Outlook.
 *
 * This function attempts to detect the scrollbar element to determine if the email body is loaded.
 * If the scrollbar is found, it proceeds to extract the email's message ID and status.
 * If not found, it retries multiple times before logging an error.
 *
 * Steps:
 * 1. Detect the scrollbar (max 30 attempts).
 * 2. If found, locate the selected email and extract its message ID.
 * 3. Retrieve and format the email's timestamp.
 * 4. Generate a unique message ID using `data-convid` and timestamp.
 * 5. Check the email's current status from local storage.
 * 6. If the email exists in storage:
 *    - If "safe", allow access.
 *    - If "unsafe", block access and show an alert.
 *    - If "pending", send a request to the background script.
 * 7. If the email is not found in storage, block access.
 * 8. If key elements are missing, reload the page to attempt processing again.
 *
 * Functions:
 * - findScrollBar(): Searches for the scrollbar element.
 * - findEmailBodyClassifier(): Extracts and formats email data.
 * - checkThecurrentStatus(): Checks and handles the email's status.
 */
function checkReloadStatusOutlook() {
  findScrollBar();
  function findScrollBar(attempts = 30) {
    const scrollbar = document.querySelector(".customScrollBar.jEpCF");
    if (scrollbar) {
      findEmailBodyClassifier();
      shouldApplyPointerEvents = true;
      blockEmailBody();
    } else if (attempts > 0) {
      setTimeout(() => findScrollBar(attempts - 1), 500);
    } else {
    }
  }

  function findEmailBodyClassifier(attempts = 5) {
    const selectedDiv = document.querySelector('.EeHm8 [aria-selected="true"]');

    if (selectedDiv) {
      const processEmailData = () => {
        return new Promise((resolve, reject) => {
          dataConvid = selectedDiv.getAttribute("data-convid");

          if (!dataConvid) {
            reject("No data-convid found");
            return;
          }

          // Wait for time elements to be available in DOM
          const waitForTimeElements = () => {
            const timeElements = document.querySelectorAll(
              'div[data-testid="SentReceivedSavedTime"]'
            );

            if (timeElements && timeElements.length > 0) {
              const countNumber = timeElements.length;
              const lastTimeElement = timeElements[timeElements.length - 1];
              const timeText = lastTimeElement.textContent;
              const lastTime = new Date(timeText);

              const newDateTime = `${lastTime.getFullYear()}${(
                lastTime.getMonth() + 1
              )
                .toString()
                .padStart(2, "0")}${lastTime
                .getDate()
                .toString()
                .padStart(2, "0")}_${lastTime
                .getHours()
                .toString()
                .padStart(2, "0")}${lastTime
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;

              const MessageIdCreated = `${dataConvid}_${newDateTime}_${countNumber}`;
              let NewMessageId = MessageIdCreated.slice(0, 84);
              dataConvid = NewMessageId;

              resolve(dataConvid);
            } else {
              setTimeout(waitForTimeElements, 100);
            }
          };
          waitForTimeElements();
        });
      };

      processEmailData()
        .then((dataConvid) => {
          dataConvid = dataConvid;

          checkThecurrentStatus(dataConvid);
        })
        .catch((error) => {
          console.error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
        });
    } else if (attempts > 0) {
      setTimeout(() => findEmailBodyClassifier(attempts - 1), 500); // Retry after a delay
    } else {
      shouldApplyPointerEvents = true;
      blockEmailBody();
      const element = document.querySelector(
        "#ConversationReadingPaneContainer"
      );
      const junkBox = document.querySelector("#ItemReadingPaneContainer");
      if (element || junkBox) {
        window.location.reload();
      }
    }
  }

  function checkThecurrentStatus(dataConvid) {
    chrome.storage.local.get("messages", function (result) {
      let messages = JSON.parse(result.messages || "{}");

      if (messages[dataConvid]) {
        const status = messages[dataConvid].status;
        const unsafeReason = messages[dataConvid].unsafeReason;

        if (status === "safe") {
          clearInterval(intervalId);
          shouldApplyPointerEvents = false;
          blockEmailBody();
          showAlert("safe", unsafeReason);
        } else if (status === "unsafe") {
          clearInterval(intervalId);
          setTimeout(() => {
            shouldApplyPointerEvents = true;
            blockEmailBody();
          }, 500);
          showAlert("unsafe", unsafeReason);
        } else if (status === "pending") {
          showAlert("pending", unsafeReason);

          chrome.storage.local.get("outlook_email", (data) => {
            setTimeout(() => {
              shouldApplyPointerEvents = true;
              blockEmailBody();
            }, 1000);

            chrome.runtime.sendMessage({
              action: "pendingStatusOutlook",
              emailId: data.outlook_email,
              messageId: dataConvid,
            });
          });
        }
      } else {
        shouldApplyPointerEvents = true;
        blockEmailBody();
      }
    });
  }
}

window.addEventListener("click", (e) => {
  const element = document.querySelector("#ConversationReadingPaneContainer");
  const junkBox = document.querySelector("#ItemReadingPaneContainer");
  if ((shouldApplyPointerEvents && element) || junkBox) {
    showBlockedPopup();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ExtractEMailForOutlook") {
    findOutlookEmailId();
  }
});



// Store original prototype methods that we'll override
const originalCreateElement = document.createElement;
const originalAppendChild = Node.prototype.appendChild;
const originalInsertBefore = Node.prototype.insertBefore;
const originalSetAttribute = Element.prototype.setAttribute;

// Function to check and disable menu items
const checkAndDisableMenuItem = (element) => {
  // Skip if not an element
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
  
  // Check if this is a menu item we want to disable
  if (element.getAttribute && element.getAttribute('role') === 'menuitem') {
    // Wait for the text content to be set
    setTimeout(() => {
      if (element.textContent && 
          (element.textContent.includes('Open in new window') || 
           element.textContent.includes('Open in new tab'))) {
        
        // console.log('Intercepted menu item:', element.textContent);
        
        // Disable the element
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.5';
        element.style.cursor = 'default';
        element.setAttribute('aria-disabled', 'true');
        element.removeAttribute('tabindex');
        
        // Mark as processed
        element.setAttribute('data-disabled-by-extension', 'true');
        
        // Disable all children
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          child.style.pointerEvents = 'none';
          child.style.cursor = 'default';
        });
        
        // Add a click interceptor
        element.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
      }
    }, 0);
  }
  
  // Also check children recursively
  if (element.children && element.children.length) {
    Array.from(element.children).forEach(checkAndDisableMenuItem);
  }
};

// Override createElement to intercept menu creation
document.createElement = function(tagName, options) {
  const element = originalCreateElement.call(document, tagName, options);
  
  // Add a mutation observer to this element to catch when it becomes a menu item
  const observer = new MutationObserver((mutations) => {
    if (element.getAttribute('role') === 'menuitem' || 
        element.getAttribute('role') === 'menu') {
      checkAndDisableMenuItem(element);
    }
  });
  
  observer.observe(element, { 
    attributes: true, 
    childList: true,
    subtree: true,
    attributeFilter: ['role', 'class']
  });
  
  return element;
};

// Override appendChild to intercept menu items being added to the DOM
Node.prototype.appendChild = function(child) {
  const result = originalAppendChild.call(this, child);
  
  // Check if this is a menu or menu item
  if (this.getAttribute && 
      (this.getAttribute('role') === 'menu' || 
       child.getAttribute && child.getAttribute('role') === 'menuitem')) {
    checkAndDisableMenuItem(child);
  }
  
  // Also check if this is a Gmail menu
  if ((this.classList && this.classList.contains('J-M')) || 
      (child.classList && child.classList.contains('J-N'))) {
    checkAndDisableMenuItem(child);
  }
  
  return result;
};

// Override insertBefore to intercept menu items being added to the DOM
Node.prototype.insertBefore = function(newNode, referenceNode) {
  const result = originalInsertBefore.call(this, newNode, referenceNode);
  
  // Check if this is a menu or menu item
  if (this.getAttribute && 
      (this.getAttribute('role') === 'menu' || 
       newNode.getAttribute && newNode.getAttribute('role') === 'menuitem')) {
    checkAndDisableMenuItem(newNode);
  }
  
  // Also check if this is a Gmail menu
  if ((this.classList && this.classList.contains('J-M')) || 
      (newNode.classList && newNode.classList.contains('J-N'))) {
    checkAndDisableMenuItem(newNode);
  }
  
  return result;
};

// Override setAttribute to catch when elements become menu items
Element.prototype.setAttribute = function(name, value) {
  const result = originalSetAttribute.call(this, name, value);
  
  // Check if this element is becoming a menu item
  if (name === 'role' && (value === 'menuitem' || value === 'menu')) {
    checkAndDisableMenuItem(this);
  }
  
  return result;
};

// Function to scan the entire document for menu items
const scanForMenuItems = () => {
  // Look for all menu items
  const menuItems = document.querySelectorAll('[role="menuitem"]');
  
  menuItems.forEach(item => {
    if (item.textContent && 
        (item.textContent.includes('Open in new window') || 
         item.textContent.includes('Open in new tab')) &&
        !item.hasAttribute('data-disabled-by-extension')) {
      
      // console.log('Found menu item in scan:', item.textContent);
      
      // Disable the element
      item.style.pointerEvents = 'none';
      item.style.opacity = '0.5';
      item.style.cursor = 'default';
      item.setAttribute('aria-disabled', 'true');
      item.removeAttribute('tabindex');
      
      // Mark as processed
      item.setAttribute('data-disabled-by-extension', 'true');
      
      // Disable all children
      const children = item.querySelectorAll('*');
      children.forEach(child => {
        child.style.pointerEvents = 'none';
        child.style.cursor = 'default';
      });
      
      // Add a click interceptor
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
    }
  });
};

// Run an initial scan
scanForMenuItems();

// Run periodic scans
setInterval(scanForMenuItems, 500);

// Also listen for context menu events
document.addEventListener('contextmenu', () => {
  // Run multiple scans after a context menu event
  for (let i = 0; i < 10; i++) {
    setTimeout(scanForMenuItems, i * 50);
  }
}, true);


