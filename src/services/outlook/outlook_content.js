console.log("Content script loaded.");
let messageReason =  " ";
// Listen for tab activation/focus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
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
      await Promise.all([findOutlookEmailId(), setupClickListener(), handleEmailInteractions()]);
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
      emailElements.forEach(element => {
          element.addEventListener("click", () => {
              element.style.pointerEvents = "none";
              setTimeout(() => {
                  element.style.pointerEvents = "auto";
              }, 3000);
          });
      });

      // Handle .bvdCQ elements
      const bvdElements = document.querySelectorAll(".bvdCQ");
      bvdElements.forEach(element => {
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

function showLoadingScreen() {
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";

  // Professional Dark Glass Background
  Object.assign(loadingScreen.style, {
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.6)", // Same opacity
    backdropFilter: "blur(12px)", // Glass effect
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    zIndex: "2147483647",
    fontFamily: "Segoe UI, sans-serif",
    textAlign: "center",
  });

  // Circular Loader (Professional)
  const loader = document.createElement("div");
  Object.assign(loader.style, {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255, 255, 255, 0.2)", // Light outline
    borderTop: "4px solid #0078d4", // Professional blue color
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  });

  // Loading Text (Minimal & Elegant)
  const loadingText = document.createElement("p");
  loadingText.innerText = "Processing...";
  Object.assign(loadingText.style, {
    marginTop: "15px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#ddd",
  });

  // Subtle Progress Bar
  const progressBar = document.createElement("div");
  Object.assign(progressBar.style, {
    marginTop: "20px",
    width: "120px",
    height: "4px",
    borderRadius: "50px",
    background: "rgba(255, 255, 255, 0.1)", // Light transparency
    position: "relative",
    overflow: "hidden",
  });

  // Animated Fill for Progress Bar
  const progressFill = document.createElement("div");
  Object.assign(progressFill.style, {
    width: "40%",
    height: "100%",
    background: "#0078d4", // Professional blue
    position: "absolute",
    left: "-40%",
    animation: "progressMove 1.5s infinite ease-in-out",
  });

  progressBar.appendChild(progressFill);
  loadingScreen.appendChild(loader);
  loadingScreen.appendChild(loadingText);
  loadingScreen.appendChild(progressBar);
  document.body.appendChild(loadingScreen);

  // Adding keyframes for smooth animations
  const styleSheet = document.styleSheets[0];

  const spinKeyframes = `@keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }`;

  const progressKeyframes = `@keyframes progressMove {
      0% { left: -40%; }
      100% { left: 100%; }
    }`;

  styleSheet.insertRule(spinKeyframes, styleSheet.cssRules.length);
  styleSheet.insertRule(progressKeyframes, styleSheet.cssRules.length);
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
            }  
            else if (dataConvid) {
              console.log("data-convid found, running email extraction");
              chrome.storage.local.get("messages", function (result) {
                  let messages = JSON.parse(result.messages || "{}");
                  console.log("messageId already stored___________________", messages);
          
                  if (messages[dataConvid]) {
                      console.log("data-convid found in local storage yehhhhhhhhhhhhhhhhhhhhhhhhh");
                      const status = messages[dataConvid].status;
                      const unsafeReason = messages[dataConvid].unsafeReason;
                      console.log("Thread ID status:", status);
          
                      if (status === "safe") {
                          console.log("Local Storage status", status);
                          shouldApplyPointerEvents = false;
                          blockEmailBody();
                          showAlert("safe", unsafeReason);
                          console.log(`Removing blocking layer because message is ${status}`);
                      } else if (status === "unsafe") {
                          console.log("Local Storage status", status);
                          console.log(`Applying blocking layer because message is ${status}`);
                          showAlert("unsafe", unsafeReason);
                          shouldApplyPointerEvents = true;
                          blockEmailBody();
                      } else if (status === "pending") {
                          console.log("Pending status in Local Storage");
                          showAlert("pending", unsafeReason);
                          chrome.storage.local.get("outlook_email", (data) => {
                              console.log("Email Id is stored in the Local", data.outlook_email);
                              console.log("send response to background for pending status in outlook =============================");
                              chrome.runtime.sendMessage({
                                  action: "pendingStatusOutlook",
                                  emailId: data.outlook_email,
                                  messageId: dataConvid,
                              });
                              shouldApplyPointerEvents = true;
                              blockEmailBody();
                          });
                      } else {
                          console.log("Applying blocking layer because message is not Present in Local storage");
                          shouldApplyPointerEvents = true;
                          blockEmailBody();
                      }
                  } else {
                      shouldApplyPointerEvents = true;
                      blockEmailBody();
                      console.log("Sending message to background for first check for firstCheckForEmail API");
                      chrome.runtime.sendMessage(
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
                                      console.log("Response from background for firstCheckForEmail API:", response);
                                      const serverData = response.data.data;
                                      const resStatus = serverData.eml_status || serverData.email_status;
                                      const messId = serverData.messageId || serverData.msg_id;
                                      const unsafeReason = serverData.unsafe_reasons || " ";
          
                                      console.log("serverData:", serverData);
                                      console.log("resStatus:", resStatus);
                                      console.log("messId:", messId);
          
                                      if (["safe", "unsafe", "pending"].includes(resStatus)) {
                                          chrome.storage.local.get("messages", function (result) {
                                              let messages = JSON.parse(result.messages || "{}");
                                              messages[messId] = {
                                                  status: resStatus,
                                                  unsafeReason: unsafeReason
                                              };
          
                                              chrome.storage.local.set(
                                                  {
                                                      messages: JSON.stringify(messages),
                                                  },
                                                  () => {
                                                      console.log(`Status ${resStatus} stored for message ${messId}`);
                                                      shouldApplyPointerEvents = resStatus !== "safe";
                                                      blockEmailBody();
                                                      console.log(`Removing blocking layer because message is ${resStatus}`);
                                                      showAlert(resStatus, unsafeReason);
                                                  }
                                              );
                                          });
                                      }
                                  } else {
                                      console.log("Message not found on server, extracting content");
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
                      ).catch((error) => {
                          console.log("API call failed:", error);
                          showAlert("inform");
                      });
                  }
              });
          }          
            else {
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

// Add the URL observer code here
let currentUrl = window.location.href;

const urlObserver = new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    const alertContainer = document.querySelector('div[style*="position: fixed"][style*="top: 50%"]');
    if (alertContainer) {
      alertContainer.remove();
    }
  }
});

function showAlert(key, messageReason = " ") {
  // Create the alert container
  const alertContainer = document.createElement("div");
  alertContainer.style.position = "fixed";
  alertContainer.style.top = "50%";
  alertContainer.style.left = "50%";
  alertContainer.style.transform = "translate(-50%, -50%)";
  alertContainer.style.zIndex = "1000";
  alertContainer.style.width = "360px";
  alertContainer.style.padding = "20px";
  alertContainer.style.borderRadius = "12px";
  alertContainer.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.3)";
  alertContainer.style.display = "flex";
  alertContainer.style.flexDirection = "column";
  alertContainer.style.alignItems = "center";
  alertContainer.style.backgroundColor = "#fff";

  // Create the message and button
  const message = document.createElement("p");
  message.style.margin = "10px 0 15px";
  message.style.fontSize = "18px";
  message.style.textAlign = "center";

  const button = document.createElement("button");
button.innerText = "Close";

Object.assign(button.style, {
  padding: "8px 20px",
  border: "1px solid #4C9ED9",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#4C9ED9",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s ease",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  boxShadow: "0 1px 2px rgba(76, 158, 217, 0.15)"
});

button.addEventListener("mouseover", () => {
  Object.assign(button.style, {
    backgroundColor: "#3989c2",
    transform: "translateY(-1px)"
  });
});

button.addEventListener("mouseout", () => {
  Object.assign(button.style, {
    backgroundColor: "#4C9ED9",
    transform: "translateY(0)"
  });
});

  let iconHtml = "";
  let currentUrl = window.location.href;
  switch (key) {
    case "safe":
    message.innerText = "Security verification complete - Safe to proceed";
    
    alertContainer.style.width = "360px";
    alertContainer.style.padding = "24px";
    alertContainer.style.background = "linear-gradient(135deg, #ffffff, #f8fff8)";
    alertContainer.style.border = "1px solid rgba(40, 167, 69, 0.2)";
    alertContainer.style.borderLeft = "6px solid #28a745";
    alertContainer.style.boxShadow = "0 6px 16px rgba(40, 167, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
    alertContainer.style.borderRadius = "8px";

    iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
        <defs>
            <filter id="shadow-success">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#28a745" flood-opacity="0.25"/>
            </filter>
        </defs>
        
        <!-- Shield outline with pulsing effect -->
        <path d="M24 4 L42 12 V24 C42 34 34 41 24 44 C14 41 6 34 6 24 V12 L24 4Z"
              fill="none"
              stroke="#28a745"
              stroke-width="2.5"
              filter="url(#shadow-success)">
            <animate attributeName="stroke-dasharray"
                     values="0,150;150,0"
                     dur="2s"
                     repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity"
                     values="0.6;1;0.6"
                     dur="2s"
                     repeatCount="indefinite"/>
        </path>
        
        <!-- Checkmark with dynamic animation -->
        <path d="M16 24 L22 30 L32 18"
              stroke="#28a745"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round">
            <animate attributeName="stroke-dasharray"
                     values="0,40;40,0"
                     dur="1.5s"
                     repeatCount="indefinite"/>
            <animate attributeName="stroke-width"
                     values="2.5;3;2.5"
                     dur="1.5s"
                     repeatCount="indefinite"/>
        </path>
    </svg>`;
    break;

    case "unsafe":
      message.innerHTML = `
    <div style="font-family: 'Segoe UI', sans-serif;">
        <div style="font-size: 16px; color: #333;font-weight : bolder">
            Security Notice: This email has been identified as unsafe.
        </div>
        <hr style="border: 0; height: 1px; background: #e0e0e0; margin: 8px 0;"/>
        <div style="color: #dc3545; font-size: 16px; font-weight : bold">${messageReason}</div>
    </div>`;



      alertContainer.style.width = "360px"; // Slightly wider for better text flow
      alertContainer.style.padding = "24px"; // Increased padding
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #fafafa)"; // Diagonal gradient
      alertContainer.style.border = "1px solid rgba(220, 53, 69, 0.2)"; // Subtle border all around
      alertContainer.style.borderLeft = "6px solid #dc3545"; // Thicker left border
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(220, 53, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)"; // Multi-layered shadow
      alertContainer.style.borderRadius = "8px"; // Increased border radius

      // Enhanced SVG with more dynamic animations
      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
    <defs>
        <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#dc3545" flood-opacity="0.25"/>
        </filter>
    </defs>
    
    <!-- Shield outline with pulsing effect -->
    <path d="M24 4 L42 12 V24 C42 34 34 41 24 44 C14 41 6 34 6 24 V12 L24 4Z"
          fill="none"
          stroke="#dc3545"
          stroke-width="2.5"
          filter="url(#shadow)">
        <animate attributeName="stroke-dasharray"
                 values="0,150;150,0"
                 dur="2s"
                 repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity"
                 values="0.6;1;0.6"
                 dur="2s"
                 repeatCount="indefinite"/>
    </path>
    
    <!-- Enhanced alert mark -->
    <g transform="translate(24,24)">
        <line x1="0" y1="-10" x2="0" y2="4"
              stroke="#dc3545"
              stroke-width="3"
              stroke-linecap="round">
            <animate attributeName="opacity"
                     values="0.7;1;0.7"
                     dur="1.5s"
                     repeatCount="indefinite"/>
            <animate attributeName="stroke-width"
                     values="2.5;3;2.5"
                     dur="1.5s"
                     repeatCount="indefinite"/>
        </line>
        <circle cx="0" cy="8" r="2.2"
                fill="#dc3545">
            <animate attributeName="r"
                     values="2;2.4;2"
                     dur="1.5s"
                     repeatCount="indefinite"/>
            <animate attributeName="opacity"
                     values="0.7;1;0.7"
                     dur="1.5s"
                     repeatCount="indefinite"/>
        </circle>
        </g>
      </svg>`;

      break;
    case "inform":
        message.innerText = "System maintenance in progress - Your security is our priority";
        
        alertContainer.style.width = "360px";
        alertContainer.style.padding = "24px";
        alertContainer.style.background = "linear-gradient(135deg, #ffffff, #fff8f0)";
        alertContainer.style.border = "1px solid rgba(255, 153, 0, 0.2)";
        alertContainer.style.borderLeft = "6px solid #ff9900";
        alertContainer.style.boxShadow = "0 6px 16px rgba(255, 153, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
        alertContainer.style.borderRadius = "8px";
    
        iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
            <defs>
                <filter id="shadow-warning">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#ff9900" flood-opacity="0.25"/>
                </filter>
            </defs>
            
            <!-- Outer rotating circle -->
            <circle cx="24" cy="24" r="20" 
                    stroke="#ff9900" 
                    stroke-width="2.5"
                    fill="none"
                    stroke-dasharray="31.4 31.4"
                    filter="url(#shadow-warning)">
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 24 24"
                    to="360 24 24"
                    dur="3s"
                    repeatCount="indefinite"/>
            </circle>
    
            <!-- Inner rotating circle -->
            <circle cx="24" cy="24" r="15"
                    stroke="#ff9900"
                    stroke-width="2.5"
                    fill="none"
                    stroke-dasharray="23.5 23.5"
                    filter="url(#shadow-warning)">
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="360 24 24"
                    to="0 24 24"
                    dur="2s"
                    repeatCount="indefinite"/>
            </circle>
    
            <!-- Center pulsing dot -->
            <circle cx="24" cy="24" r="4"
                    fill="#ff9900">
                <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="1s"
                    repeatCount="indefinite"/>
                <animate
                    attributeName="fill-opacity"
                    values="0.7;1;0.7"
                    dur="1s"
                    repeatCount="indefinite"/>
            </circle>
        </svg>`;
        break;
   
        case "pending":
          message.innerText =
            "We're processing your request.... Please wait for the procedure to be finished.";
    
          alertContainer.style.background =
            "linear-gradient(145deg, #ffffff, #f0f8ff)";
          alertContainer.style.border = "1px solid rgba(0, 123, 255, 0.15)";
          alertContainer.style.borderLeft = "6px solid #007bff";
          alertContainer.style.boxShadow =
            "0 8px 20px rgba(0, 123, 255, 0.06), 0 4px 8px rgba(0, 0, 0, 0.08)";
          alertContainer.style.borderRadius = "12px";
    
          iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
            <defs>
                <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#007bff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0056b3;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Outer rotating circle -->
            <circle cx="24" cy="24" r="20" 
                    stroke="url(#pendingGradient)" 
                    stroke-width="3" 
                    fill="none" 
                    stroke-dasharray="31.4 31.4">
                <animateTransform 
                    attributeName="transform"
                    type="rotate"
                    from="0 24 24"
                    to="360 24 24"
                    dur="2.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1"/>
            </circle>
            
            <!-- Inner pulsing dots -->
            <g fill="#007bff">
                <circle cx="24" cy="24" r="2">
                    <animate attributeName="opacity"
                        values="0.3;1;0.3" dur="1.5s"
                        repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="32" cy="24" r="2">
                    <animate attributeName="opacity"
                        values="0.3;1;0.3" dur="1.5s"
                        repeatCount="indefinite" begin="0.5s"/>
                </circle>
                <circle cx="16" cy="24" r="2">
                    <animate attributeName="opacity"
                        values="0.3;1;0.3" dur="1.5s"
                        repeatCount="indefinite" begin="1s"/>
                </circle>
            </g>
        </svg>`;
          break;
    default:
      console.log("Invalid key for showAlert");
      return;
  }

  const iconContainer = document.createElement("div");
  iconContainer.innerHTML = iconHtml;
  iconContainer.style.marginBottom = "15px";

  alertContainer.appendChild(iconContainer);
  alertContainer.appendChild(message);
  alertContainer.appendChild(button);
  document.body.appendChild(alertContainer);

  const removeAlert = () => {
    if (alertContainer && alertContainer.parentNode) {
      document.body.removeChild(alertContainer);
      document.removeEventListener("click", dismissOnOutsideClick);
      window.removeEventListener("keydown", handleEnterKey);
    }
  };

  const handleEnterKey = (event) => {
    if (event.key === "Enter") {
      removeAlert();
    }
  };

  window.addEventListener("keydown", handleEnterKey);

  const dismissOnOutsideClick = (event) => {
    if (!alertContainer.contains(event.target)) {
      removeAlert();
    }
  };

  document.addEventListener("click", dismissOnOutsideClick, true);
  button.addEventListener("click", removeAlert);
}

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
  // First find which container is active
  // const processNavigationButton = async () => {
  //   let activeContainer = document.querySelector("#ConversationReadingPaneContainer");
  //   if (activeContainer) {
  //       console.log("Active container found (ConversationReadingPaneContainer)");

  //       // Find all elements with class "aVla3" inside the active container
  //       const elements = activeContainer.querySelectorAll(".aVla3");

  //       if (elements.length > 0) {
  //           let lastElement = elements[elements.length - 1]; // Default last element

  //           // Check if the last "aVla3" element contains a div with class "o4zjZ SfSRI"
  //           if (lastElement.querySelector(".o4zjZ.SfSRI") && elements.length > 1) {
  //               lastElement = elements[elements.length - 2]; // Use second last element
  //           }

  //           // Find the nested div with `aria-expanded`
  //           const expandedDiv = lastElement.querySelector('div[aria-expanded]');

  //           if (expandedDiv) {
  //               const isExpanded = expandedDiv.getAttribute("aria-expanded") === "true";

  //               if (!isExpanded) {
  //                   // Execute first set of actions
  //                   let clickElements = document.querySelectorAll('.GjFKx.WWy1F.YoK0k');
  //                   if (clickElements.length > 0) {
  //                       // Click the last element in the list
  //                       clickElements[clickElements.length - 1].click();
  //                   }
  //               }
  //               // Execute the navigation process
  //               const navi = activeContainer.querySelectorAll(".ms-Button--hasMenu");
  //               const lastIndex = navi.length - 1;

  //               if (navi[lastIndex] && navi[lastIndex].offsetParent !== null) {
  //                   navi[lastIndex].click();
  //                   await waitForMenu();
  //               } else {
  //                   console.log("Navigation button not found or not visible, retrying...");
  //                   await new Promise((resolve) => setTimeout(resolve, 500));
  //                   await processNavigationButton();
  //               }
  //           }
  //       }
  //   } 
  //   else {
  //       // If `#ConversationReadingPaneContainer` is not found, fallback to `#ItemReadingPaneContainer`
  //       activeContainer = document.querySelector("#ItemReadingPaneContainer");

  //       if (activeContainer) {
  //           console.log("Active container found (ItemReadingPaneContainer)");
  //           // Execute the navigation process for ItemReadingPaneContainer (without new functionality)
  //           const navi = activeContainer.querySelectorAll(".ms-Button--hasMenu");
  //           const lastIndex = navi.length - 1;
  //           if (navi[lastIndex] && navi[lastIndex].offsetParent !== null) {
  //               navi[lastIndex].click();
  //               await waitForMenu();
  //           } else {
  //               console.log("Navigation button not found or not visible, retrying...");
  //               await new Promise((resolve) => setTimeout(resolve, 500));
  //               await processNavigationButton();
  //           }
  //       }
  //   }
  // };

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

function showPending() {
  // Create the pending container
  const pendingContainer = document.createElement("div");
  pendingContainer.style.position = "fixed";
  pendingContainer.style.top = "50%";
  pendingContainer.style.left = "50%";
  pendingContainer.style.transform = "translate(-50%, -50%)";
  pendingContainer.style.zIndex = "1000";
  pendingContainer.style.width = "400px";
  pendingContainer.style.padding = "30px";
  pendingContainer.style.borderRadius = "12px";
  pendingContainer.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.2)";
  pendingContainer.style.backgroundColor = "#ffffff";
  pendingContainer.style.textAlign = "center";
  pendingContainer.style.fontFamily = "Arial, sans-serif";
  pendingContainer.style.color = "#333";

  // Add a larger spinner
  const spinner = document.createElement("div");
  spinner.style.width = "60px";
  spinner.style.height = "60px";
  spinner.style.border = "6px solid #e0e0e0";
  spinner.style.borderTop = "6px solid #007bff";
  spinner.style.borderRadius = "50%";
  spinner.style.margin = "0 auto 20px";
  spinner.style.animation = "spin 1s linear infinite";

  // Add keyframes for spinner animation
  const styleSheet = document.styleSheets[0];
  const spinnerKeyframes = `@keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }`;
  styleSheet.insertRule(spinnerKeyframes, styleSheet.cssRules.length);

  // Add a larger message
  const message = document.createElement("p");
  message.innerText = "Your mail is under process... Please wait.";
  message.style.margin = "0";
  message.style.fontSize = "18px";
  message.style.fontWeight = "bold";

  // Append elements to the container
  pendingContainer.appendChild(spinner);
  pendingContainer.appendChild(message);
  document.body.appendChild(pendingContainer);

  // Remove the pending container after 5 seconds
  setTimeout(() => {
    if (pendingContainer && pendingContainer.parentNode) {
      document.body.removeChild(pendingContainer);
    }
  }, 5000);
}

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "responseDelayStatus" , message.client === "outlook") {
//     console.log("Server response delayed for more than 4 seconds");
//     showAlert("pending");
//   }
// });

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

// window.addEventListener("load", () => {
//   setTimeout(checkReloadStatusOutlook, 1000);
// });

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
          console.log("Message already exists in the local storage", messages[dataConvid]);
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
              console.log("send response to background for pending status in outlook on reload section");
              
              chrome.storage.local.get("outlook_email", (data) => {
                  setTimeout(() => {
                      shouldApplyPointerEvents = true;
                      blockEmailBody();
                  }, 1000);
                  console.log("Email Id is stored in the Local", data.outlook_email);
                  console.log("send response to background for pending status in outlook =============================");
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
  
    // chrome.storage.local.get("messages", function (result) {
    //   let messages = JSON.parse(result.messages || "{}");
    //   console.log("Message Id ", messages);
    //   if (messages[dataConvid]) {
    //     console.log(
    //       "Message already exists in the local storage",
    //       messages[dataConvid]
    //     );
    //     if (messages[dataConvid] === "safe") {
    //       console.log("Message is already safe");
    //       shouldApplyPointerEvents = false;
    //       blockEmailBody();
    //       showAlert("safe");
    //     } else if (messages[dataConvid] === "unsafe") {
    //       console.log("Message is already unsafe");
    //       // shouldApplyPointerEvents = true;
    //       setTimeout(() => {
    //         shouldApplyPointerEvents = true;
    //         blockEmailBody();
    //       }, 500);
    //       showAlert("unsafe");
    //     } else if (messages[dataConvid] === "pending") {
    //       console.log("Message is already pending");
    //       showAlert("pending");
    //       console.log(
    //         "send response to background for pending status in outlook on reload section"
    //       );
    //       chrome.storage.local.get("outlook_email", (data) => {
    //         setTimeout(() => {
    //           shouldApplyPointerEvents = true;
    //           blockEmailBody();
    //         }, 1000);
    //         console.log(
    //           "Email Id is stored in the Localaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    //           data.outlook_email
    //         );
    //         console.log(
    //           "send response to background for pending status in outlook ============================="
    //         );
    //         chrome.runtime.sendMessage({
    //           action: "pendingStatusOutlook",
    //           emailId: data.outlook_email,
    //           messageId: dataConvid,
    //         });
    //       });
    //     }
    //   } else {
    //     console.log("Message does not exist in the local storage");
    //     shouldApplyPointerEvents = true;
    //     blockEmailBody();
    //     // alert("There is an issue, please refresh the page and try again");
    //     // const element = document.querySelector("#ConversationReadingPaneContainer");
    //     // const junkBox = document.querySelector("#ItemReadingPaneContainer");
    //     // if(element || junkBox){
    //     //   window.location.reload();
    //     // }
    //     // externalCallForPendingStatus();
    //   }
    //   // function externalCallForPendingStatus( attempts = 10) {
    //   //   console.log("Message does not exist in the local storage");
    //   //   const mailBody = document.querySelector(".GjFKx.WWy1F.YoK0k");
    //   //   if(mailBody){
    //   //     console.log("Mail body found");
    //   //     mailBody.click();
    //   //     // setTimeout(()=>{
    //   //       console.log("Mail body clicked");
    //   //       shouldApplyPointerEvents = true;
    //   //       blockEmailBody();
    //   //       // executeWithLoadingScreenAndExtraction();
    //   //     // }, 1000);
    //   //   }
    //   //   else if(attempts > 0){
    //   //     setTimeout(() => externalCallForPendingStatus(attempts - 1), 500);
    //   //   }
    //   //   else{
    //   //     console.log("Mail body not found, Meaning the email is not loaded yet or No mail is opened");
    //   //     shouldApplyPointerEvents = true;
    //   //     blockEmailBody();
    //   //     // alert("Mail body not found");
    //   //   }
    //   // }
    // });
  }
}

//---------------------------------------------
// Add this function to create and show the popup
function showBlockedPopup() {
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    animation: fadeInOut 2s forwards;
  `;

  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(
    `
    @keyframes fadeInOut {
      0% { opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { opacity: 0; }
    }
  `,
    styleSheet.cssRules.length
  );

  popup.textContent =
    "This email content is currently blocked for your security";
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 2000);
}

window.addEventListener("click", (e) => {
  console.log("Clicked on the email body");
  const element = document.querySelector("#ConversationReadingPaneContainer");
  const junkBox = document.querySelector("#ItemReadingPaneContainer");
  if ((shouldApplyPointerEvents && element) || junkBox) {
    console.log(
      "Clicked on the email body and execute the popup if the mail is pending or unsafe"
    );
    showBlockedPopup();
  }
});