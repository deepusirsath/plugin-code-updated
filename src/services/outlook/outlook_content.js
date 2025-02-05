// Component imports
const importComponent = async (path) => {
  const src = chrome.runtime.getURL(path);
  return await import(src);
};

// Initialize UI components
let showAlert = null;
let showBlockedPopup = null;
let showLoadingScreen = null;

// Load components
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
});

console.log("Content script loaded.");

let messageReason = " ";
// Listen for tab activation/focus
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    findOutlookEmailId();
  }
});

let userEmailId = null;

chrome.storage.local.get("registration", (data) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  if (data.registration) {
    console.log("Registration data:", data.registration);
    const initializeOutlook = async () => {
      console.log("Registration data:", data.registration);
      // Run these operations in parallel since they're independent
      await Promise.all([
        findOutlookEmailId(),
        setupClickListener(),
        handleEmailInteractions(),
      ]);
    };

    // Execute initialization
    initializeOutlook().catch((error) =>
      console.error("Failed to initialize Outlook:", error)
    );
  }
});

function handleEmailInteractions() {
  setInterval(() => {
    console.log("Checking for email interactions and double clicks...");
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

function fetchLocation() {
  // Ensure this only runs on Outlook's live mail domain
  if (window.location.href.includes("https://outlook.live.com/")) {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }

    // Attempt to get the user's current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

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
        console.error(`Geolocation error (${error.code}): ${error.message}`);
      }
    );
  } else {
    console.log("This script only runs on outlook, yahoo and Gmail");
  }
}

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

// Content.js
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
    console.log("Junk Email, Archive, or Deleted Items div clicked");
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

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

// Function to execute email extraction code with loading screen

async function executeWithLoadingScreenAndExtraction() {
  blockUserInteraction(); // Disable all user interactions
  showLoadingScreen(); // Show the loading screen indefinitely

  try {
    await runEmailExtraction(); // Extract email content
  } finally {
    hideLoadingScreen(); // Hide the loading screen once email content is extracted
    unblockUserInteraction(); // Re-enable user interactions
  }
}

// Updated blockEmailBody function to toggle pointer-events

function blockEmailBody() {
  const element = document.querySelector("#ConversationReadingPaneContainer");
  const junkBox = document.querySelector("#ItemReadingPaneContainer");

  // Function to apply pointer events to an element if it exists
  function applyPointerEvents(el, state) {
    if (el) {
      el.style.pointerEvents = state;
      console.log(`Applied pointer-events: ${state} to ${el.id}`);
    }
  }

  // Apply pointer events to both elements
  if (element || junkBox) {
    const pointerState = shouldApplyPointerEvents ? "none" : "all";
    applyPointerEvents(element, pointerState);
    applyPointerEvents(junkBox, pointerState);
  }
}

function setupClickListener(attempts = 500) {
  console.log("Setting up click listener for email elements");
  const emailListContainer = document.querySelector(".customScrollBar.jEpCF");
  if (emailListContainer) {
    console.log("Email list container found, setting up click listener");
    emailListContainer.addEventListener("click", (event) => {
      let clickedElement = event.target;

      while (clickedElement && !clickedElement.classList.contains("EeHm8")) {
        clickedElement = clickedElement.parentElement;
      }
      if (clickedElement) {
        console.log("Clicked on an element within .EeHm8");
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
          console.log("data-convid:", dataConvid);

          //Adding the new message Id creation functionality
          waitForTimeElements().then((timeElements) => {
            console.log("timeElements:", timeElements);
            console.log("Time Elements Found:", timeElements.length);
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
            console.log("Last Time Element Text:", timeText);
            console.log("Parsed Time:", lastTime);
            console.log("Formatted Time:", newDateTime);

            const MessageIdCreated = `${dataConvid}_${newDateTime}_${countNumber}`;
            let NewMessageId = MessageIdCreated.slice(0, 84);
            dataConvid = NewMessageId;
            console.log("Secret Identifier:", NewMessageId);
            console.log("New data-convid: ", dataConvid);

            // Get aria-label from the clicked element
            const ariaLabelDiv =
              clickedElement.querySelector("div[aria-label]");
            const ariaLabel = ariaLabelDiv?.getAttribute("aria-label");
            const containsUnknown = ariaLabel?.includes("[Unknown]");
            console.log("Contains '[Unknown]':", containsUnknown);

            // Query once for inner folder div
            const innerFolderDiv = document.querySelector("span.vlQVl.jXaVF");
            const isSentItems = innerFolderDiv?.textContent === "Sent Items";
            const isDraftItems = innerFolderDiv?.textContent === "Drafts";

            if (isSentItems) {
              console.log("This is the Sent Items folder");
            } else if (isDraftItems) {
              console.log("This is the Draft Items folder");
            }

            // Execute further actions if necessary conditions are met
            if (containsUnknown || isSentItems || isDraftItems) {
              shouldApplyPointerEvents = false;
              blockEmailBody();
              return;
            } else if (dataConvid) {
              console.log("data-convid found, running email extraction");
              chrome.storage.local.get("messages", function (result) {
                let messages = JSON.parse(result.messages || "{}");
                console.log(
                  "messageId already stored___________________",
                  messages
                );

                if (messages[dataConvid]) {
                  console.log(
                    "data-convid found in local storage yehhhhhhhhhhhhhhhhhhhhhhhhh"
                  );
                  const status = messages[dataConvid].status;
                  const unsafeReason = messages[dataConvid].unsafeReason;
                  console.log("Thread ID status:", status);

                  if (status === "safe") {
                    console.log("Local Storage status", status);
                    shouldApplyPointerEvents = false;
                    blockEmailBody();
                    showAlert("safe", unsafeReason);
                    console.log(
                      `Removing blocking layer because message is ${status}`
                    );
                  } else if (status === "unsafe") {
                    console.log("Local Storage status", status);
                    console.log(
                      `Applying blocking layer because message is ${status}`
                    );
                    showAlert("unsafe", unsafeReason);
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                  } else if (status === "pending") {
                    console.log("Pending status in Local Storage");
                    showAlert("pending", unsafeReason);
                    chrome.storage.local.get("outlook_email", (data) => {
                      console.log(
                        "Email Id is stored in the Local",
                        data.outlook_email
                      );
                      console.log(
                        "send response to background for pending status in outlook ============================="
                      );
                      chrome.runtime.sendMessage({
                        action: "pendingStatusOutlook",
                        emailId: data.outlook_email,
                        messageId: dataConvid,
                      });
                      shouldApplyPointerEvents = true;
                      blockEmailBody();
                    });
                  } else {
                    console.log(
                      "Applying blocking layer because message is not Present in Local storage"
                    );
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                  }
                } else {
                  shouldApplyPointerEvents = true;
                  blockEmailBody();
                  console.log(
                    "Sending message to background for first check for firstCheckForEmail API"
                  );
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
                            console.log(
                              "Response from background for firstCheckForEmail API:",
                              response
                            );
                            const serverData = response.data.data;
                            const resStatus =
                              serverData.eml_status || serverData.email_status;
                            const messId =
                              serverData.messageId || serverData.msg_id;
                            const unsafeReason =
                              serverData.unsafe_reasons || " ";

                            console.log("serverData:", serverData);
                            console.log("resStatus:", resStatus);
                            console.log("messId:", messId);

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
                                      console.log(
                                        `Status ${resStatus} stored for message ${messId}`
                                      );
                                      shouldApplyPointerEvents =
                                        resStatus !== "safe";
                                      blockEmailBody();
                                      console.log(
                                        `Removing blocking layer because message is ${resStatus}`
                                      );
                                      showAlert(resStatus, unsafeReason);
                                    }
                                  );
                                }
                              );
                            }
                          } else {
                            console.log(
                              "Message not found on server, extracting content"
                            );
                            shouldApplyPointerEvents = true;
                            blockEmailBody();
                            setTimeout(() => {
                              executeWithLoadingScreenAndExtraction();
                            }, 100);
                          }
                        } else if (response.status === "error") {
                          console.log("API call failed ok:", error);
                          showAlert("inform");
                        }
                      }
                    )
                    .catch((error) => {
                      console.log("API call failed:", error);
                      showAlert("inform");
                    });
                }
              });
            } else {
              console.log("data-convid not found or null, skipping extraction");
            }
          });
        }, 1000);
      }
    });
    console.log("Click listener set up for .EeHm8 elements");
  } else if (attempts > 0) {
    console.log("Email list container not found, retrying...");
    setTimeout(() => setupClickListener(attempts - 1), 500);
  } else {
    console.log(
      "Email list container still not found after multiple attempts, giving up"
    );
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "outlook"
  ) {
    console.log(
      "Received message from server to show the erroRecievedFromServer:"
    );
    showAlert("inform");
  }
});

async function runEmailExtraction() {
  console.log("Running email extraction code");

  // Batch processing for DOM interactions
  const processNavigationButton = async () => {
    // First find which container is active
    const activeContainer =
      document.querySelector("#ConversationReadingPaneContainer") ||
      document.querySelector("#ItemReadingPaneContainer");

    if (activeContainer) {
      console.log("Active container found");
      // Find all menu buttons within the active container
      const navi = activeContainer.querySelectorAll(".ms-Button--hasMenu");

      // Get the last button from the collection
      const lastIndex = navi.length - 1;

      if (navi[lastIndex] && navi[lastIndex].offsetParent !== null) {
        navi[lastIndex].click();
        await waitForMenu();
      } else {
        console.log("Navigation button not found or not visible, retrying...");
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
          console.log("Menu opened");
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
        console.log('Mouseover event triggered on "View" button');
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
      console.log('Clicked "View message source"');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for content to load
      await extractTextContent();
    } else {
      console.log("View message source button not found, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await clickViewMessageSource(); // Retry
    }
  };

  const extractTextContent = async () => {
    const element = document.querySelector(".lz61e.allowTextSelection");
    if (element && element.innerText.trim().length > 0) {
      const emailContent = element.innerText;
      console.log("Extracted email content:", emailContent);
      await sendContentToBackground(emailContent);
      await closeEmail();
    } else {
      console.log("Text content element not found or empty, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await extractTextContent(); // Retry
    }
  };

  const sendContentToBackground = async (emailContent) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "outlookEmlContent", emailContent, dataConvid, userEmailId },
        function (response) {
          console.log(
            "the outlook data is sended to background.js and response will be undefined: ",
            response
          );
          resolve();
        }
      );
    });
  };

  const closeEmail = async () => {
    console.log(
      "Attempting to force-close modal by removing it from the DOM..."
    );
    const overlay = document.querySelector(
      ".fui-DialogSurface__backdrop.rsptlh5"
    );
    overlay.click();
    // Enable scrolling (if it was disabled during the modal display)
    console.log("Modal forcibly removed from DOM");
  };

  // Start the extraction process
  await processNavigationButton();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "outlook") {
    messageReason = message.unsafeReason;
    // Check if the message is for Outlook
    console.log(
      "this is the function that will be called when the content script receives a message for the Outlook client"
    );

    if (message.action === "blockUrls") {
      console.log("Outlook Content script received message:", message.action);
      shouldApplyPointerEvents = true;
      showAlert("unsafe", messageReason);
      console.log("Blocking URLs for Outlook");
    } else if (message.action === "unblock") {
      shouldApplyPointerEvents = false;
      console.log("Unblocking URLs for Outlook");
      showAlert("safe");
    } else if (message.action === "pending") {
      console.log("Pending Status for Outlook");
      shouldApplyPointerEvents = true;
      showAlert("pending");
      console.log("Blocking URLs for Outlook due to pending status");
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});

// Function to find the Outlook email ID
function findOutlookEmailId() {
  const outlookRegex =
    /^https:\/\/(?:outlook\.office\.com|outlook\.live\.com|office\.live\.com|outlook\.office365\.com)\/mail\//;

  if (!outlookRegex.test(window.location.href)) {
    console.log("Not on an Outlook mail page");
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
        console.log("Email ID found:", userEmailId);
        clearInterval(searchInterval); // Stop searching once email ID is found

        // Add the storage code here
        chrome.storage.local.remove(["gmail_email", "yahoo_email"], () => {
          console.log("Cleared Gmail and Outlook emails from storage");
          chrome.storage.local.set({ outlook_email: userEmailId }, () => {
            console.log("Outlook email stored:", userEmailId);
          });
        });

        chrome.storage.local.get(null, function (data) {
          console.log("Data retrieved from local storage:", data);
        });
        return;
      }
    } else {
      console.log("Email ID not found. Searching again...");
    }
  }, 500); // Run the search every 0.5 second (adjust interval as needed)
}
chrome.storage.local.get(null, function (data) {
  console.log("Data retrieved from local storage:", data);
});

chrome.storage.local.get("messages", function (result) {
  let messages = JSON.parse(result.messages || "{}"); // Ensure messages is an object
  console.log(
    "++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    messages
  );
});

chrome.storage.local.get("registration", (data) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }

  if (data.registration) {
    window.addEventListener("load", () => {
      setTimeout(checkReloadStatusOutlook, 1000);
    });
  }
});

function checkReloadStatusOutlook() {
  findScrollBar();
  function findScrollBar(attempts = 30) {
    const scrollbar = document.querySelector(".customScrollBar.jEpCF");
    if (scrollbar) {
      console.log("Scrollbar found");
      findEmailBodyClassifier();
      shouldApplyPointerEvents = true;
      blockEmailBody();
    } else if (attempts > 0) {
      setTimeout(() => findScrollBar(attempts - 1), 500);
    } else {
      console.log("Scrollbar not found");
    }
  }

  function findEmailBodyClassifier(attempts = 5) {
    console.log(
      "Finding Email Body Classifier 2222222222222222222222222222222222222"
    );
    const selectedDiv = document.querySelector('.EeHm8 [aria-selected="true"]');

    if (selectedDiv) {
      const processEmailData = () => {
        return new Promise((resolve, reject) => {
          let dataConvid = selectedDiv.getAttribute("data-convid");
          // console.log('data-convid:', dataConvid);

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

              console.log("Time Elements Found:", timeElements.length);
              console.log("Last Time Element Text:", timeText);
              console.log("Parsed Time:", lastTime);
              console.log("Formatted Time:", newDateTime);

              const MessageIdCreated = `${dataConvid}_${newDateTime}_${countNumber}`;
              let NewMessageId = MessageIdCreated.slice(0, 84);
              dataConvid = NewMessageId;
              console.log("New Message ID:", dataConvid);

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
          console.log("New message ID:", dataConvid);
          checkThecurrentStatus(dataConvid);
        })
        .catch((error) => {
          console.log("Error processing email data:", error);
        });
    } else if (attempts > 0) {
      console.log(
        'No element with aria-selected="true" found under class "EeHm8". Retrying...'
      );
      setTimeout(() => findEmailBodyClassifier(attempts - 1), 500); // Retry after a delay
    } else {
      console.log("Max attempts reached, element not found.");
      shouldApplyPointerEvents = true;
      blockEmailBody();
      const element = document.querySelector(
        "#ConversationReadingPaneContainer"
      );
      const junkBox = document.querySelector("#ItemReadingPaneContainer");
      if (element || junkBox) {
        window.location.reload();
      }
      console.log("Element not found");
    }
  }

  function checkThecurrentStatus(dataConvid) {
    console.log(
      "Checking the current status of the message3333333333333333333333333333333333"
    );
    console.log("dataConvid", dataConvid);
    chrome.storage.local.get("messages", function (result) {
      let messages = JSON.parse(result.messages || "{}");
      console.log("Message Id ", messages);

      if (messages[dataConvid]) {
        console.log(
          "Message already exists in the local storage",
          messages[dataConvid]
        );
        const status = messages[dataConvid].status;
        const unsafeReason = messages[dataConvid].unsafeReason;

        if (status === "safe") {
          console.log("Message is already safe");
          shouldApplyPointerEvents = false;
          blockEmailBody();
          showAlert("safe", unsafeReason);
        } else if (status === "unsafe") {
          console.log("Message is already unsafe");
          setTimeout(() => {
            shouldApplyPointerEvents = true;
            blockEmailBody();
          }, 500);
          showAlert("unsafe", unsafeReason);
        } else if (status === "pending") {
          console.log("Message is already pending");
          showAlert("pending", unsafeReason);
          console.log(
            "send response to background for pending status in outlook on reload section"
          );

          chrome.storage.local.get("outlook_email", (data) => {
            setTimeout(() => {
              shouldApplyPointerEvents = true;
              blockEmailBody();
            }, 1000);
            console.log("Email Id is stored in the Local", data.outlook_email);
            console.log(
              "send response to background for pending status in outlook ============================="
            );
            chrome.runtime.sendMessage({
              action: "pendingStatusOutlook",
              emailId: data.outlook_email,
              messageId: dataConvid,
            });
          });
        }
      } else {
        console.log("Message does not exist in the local storage");
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
