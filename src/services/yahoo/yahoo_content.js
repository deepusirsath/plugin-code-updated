document.addEventListener("visibilitychange", function () {
  chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {
    console.log("Stored data removed.");
  });
  if (document.visibilityState === "visible") {
    // When tab becomes visible, extract IDs and handle email storage
    const { userEmail } = extractIdsFromNonceScripts();

    if (userEmail) {
      chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {
        chrome.storage.local.set({ yahoo_email: userEmail }, () => {
          console.log("Yahoo email stored:", userEmail);
        });
      });
    }
  }
});
let extractionDone = false;
let shouldApplyPointerEvents = true;
let sendMessageId;
let sendUserEmail;
const url = window.location.href;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action == "checkYahoomail" ||
    message.action == "fetchDisputeMessageId"
  ) {
    // Check if the div with id 'message-group-view-scroller' exists
    const emailBodySearch = document.querySelector(
      'div[data-test-id="message-group-view-scroller"]'
    );
    const senderEmailElement = document.querySelector(
      'span[data-test-id="email-pill"] + span, span[data-test-id="message-to"]'
    );

    const senderEmail =
      senderEmailElement?.innerText || senderEmailElement?.textContent;
    chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {
      console.log("Stored data removed.");
    });
    if (emailBodySearch) {
      // Send response back to background.js
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
  return true; // Keeps the message channel open for async sendResponse
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "runScript") {
    console.log("URL contains 'message'. Running script...");
    // Exit early since reload will reset the script
    window.location.reload();
    return;
  }
});

//Main function starts here-------------------
if (
  url.includes("in.mail.yahoo.com") ||
  (url.includes("mail.yahoo.com") && url.includes("message") && !extractionDone)
) {
  console.log("Extracted URL:");
  chrome.storage.local.get("registration", (data) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (data.registration) {
      console.log(
        "Registration data found now execute the extractIdsFromNonceScripts(): ",
        data.registration
      );
      executeExtractionScript();
    }
  });
}

async function executeExtractionScript() {
  setTimeout(() => {
    const { lastMessageId, userEmail } = extractIdsFromNonceScripts();
    // fetchLocation()
    console.log(
      "Extracted messageId:",
      lastMessageId,
      "Extracted UserEmail:",
      userEmail
    );
    blockEmailBody();
    sendMessageId = lastMessageId;
    sendUserEmail = userEmail;
    extractionDone = true;
  }, 2500);
}

async function executeExtractionScriptIfFailed() {
  setTimeout(() => {
    const { lastMessageId, userEmail } = extractIdsFromNonceScripts();
    // fetchLocation()
    console.log(
      "Extracted messageId:",
      lastMessageId,
      "Extracted UserEmail:",
      userEmail
    );
    blockEmailBody();
    sendMessageId = lastMessageId;
    sendUserEmail = userEmail;
    extractionDone = true;
  }, 100);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const currentCount = 0;
  if (request.action === "EmailNotFoundOnServerRequest" && request.client === "yahoo" && currentCount < 3) {
    console.log("Received message in content script EmailNotFoundOnServerRequest on Yahoo:", request);
    currentCount++ ;
    executeExtractionScriptIfFailed();
  }
});


function showAlert(key) {
  // Common styles for alert container
  const commonContainerStyles = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "1000",
    width: "360px",
    padding: "24px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff"
  };

  // Alert type specific configurations
  const alertConfigs = {
    safe: {
      message: "Security verification complete - Safe to proceed",
      styles: {
        background: "linear-gradient(135deg, #ffffff, #f8fff8)",
        border: "1px solid rgba(40, 167, 69, 0.2)",
        borderLeft: "6px solid #28a745",
        boxShadow: "0 6px 16px rgba(40, 167, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)"
      },
      color: "#28a745"
    },
    unsafe: {
      message: "Security Notice: Email requires verification. Raise a dispute to review content.",
      styles: {
        background: "linear-gradient(135deg, #ffffff, #fafafa)",
        border: "1px solid rgba(220, 53, 69, 0.2)", 
        borderLeft: "6px solid #dc3545",
        boxShadow: "0 6px 16px rgba(220, 53, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)"
      },
      color: "#dc3545"
    },
    inform: {
      message: "System maintenance in progress - Your security is our priority",
      styles: {
        background: "linear-gradient(135deg, #ffffff, #fff8f0)",
        border: "1px solid rgba(255, 153, 0, 0.2)",
        borderLeft: "6px solid #ff9900",
        boxShadow: "0 6px 16px rgba(255, 153, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)"
      },
      color: "#ff9900"
    },
    pending: {
      message: "Your request is being processed... Please hold on while we block the email currently being processed.",
      styles: {
        border: "4px solid #4C9ED9",
        backgroundColor: "#fff"
      },
      color: "#4C9ED9"
    }
  };

  const config = alertConfigs[key];
  if (!config) {
    console.log("Invalid key for showAlert");
    return;
  }

  const alertContainer = document.createElement("div");
  Object.assign(alertContainer.style, commonContainerStyles, config.styles);

  const message = document.createElement("p");
  Object.assign(message.style, {
    margin: "10px 0 15px",
    fontSize: "18px",
    textAlign: "center"
  });
  message.innerText = config.message;

  const button = createButton();
  const iconContainer = createIconContainer(key, config.color);

  alertContainer.append(iconContainer, message, button);
  document.body.appendChild(alertContainer);

  setupEventListeners(alertContainer, button);
}

// Helper functions
function createButton() {
  const button = document.createElement("button");
  button.innerText = "Close";
  
  const buttonStyles = {
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
  };

  Object.assign(button.style, buttonStyles);
  setupButtonHoverEffects(button);
  return button;
}

function setupButtonHoverEffects(button) {
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
}

function createIconContainer(key, color) {
  const iconContainer = document.createElement("div");
  iconContainer.style.marginBottom = "15px";
  iconContainer.innerHTML = getIconSvg(key, color);
  return iconContainer;
}

function setupEventListeners(alertContainer, button) {
  const removeAlert = () => {
    if (alertContainer?.parentNode) {
      document.body.removeChild(alertContainer);
      document.removeEventListener("click", dismissOnOutsideClick);
      window.removeEventListener("keydown", handleEnterKey);
    }
  };

  const handleEnterKey = (event) => {
    if (event.key === "Enter") removeAlert();
  };

  const dismissOnOutsideClick = (event) => {
    if (!alertContainer.contains(event.target)) removeAlert();
  };

  window.addEventListener("keydown", handleEnterKey);
  document.addEventListener("click", dismissOnOutsideClick, true);
  button.addEventListener("click", removeAlert);

  // Observer setup
  const observer = new MutationObserver(() => {
    const elements = document.getElementsByClassName("nH a98 iY");
    if (!elements?.length) {
      removeAlert();
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function fetchLocation() {
  // Ensure this only runs on Outlook's live mail domain
  let first = "https://mail.yahoo.com/";
  let second = "https://in.mail.yahoo.com/";
  if (window.location.href.includes(first || second)) {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this chrome.");
      return;
    }
    // Attempt to get the user's current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

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
        console.error(`Geolocation error (${error.code}): ${error.message}`);
      }
    );
  } else {
    console.log("This script only runs on outlook, yahoo and Gmail");
  }
}
function blockEmailBody() {
  const element = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );
  if (element) {
    if (shouldApplyPointerEvents) {
      console.log("Blocking the email body");
      element.style.pointerEvents = "none";
    } else {
      console.log("Unblocking the email body");
      element.style.pointerEvents = "all";
    }
  }
}
//New changes in the extractIdsFromNonceScripts function to hande the first check
function extractIdsFromNonceScripts() {
  console.log("Extracting IDs from scripts start...");
  let messageIds = [];
  let selectedMailboxId = null;
  let userEmail = null;

  const isSentFound = Array.from(
    document.querySelectorAll('div[data-test-id="pill-text"]')
  ).some((div) => div.textContent.trim() === "Sent");

  if (isSentFound) {
    console.log("Sent folder found. Skipping extraction.");
    return;
  }

  const scripts = Array.from(document.querySelectorAll("script[nonce]"));

  console.log("Scripts:", scripts);
  console.log("Number of scripts found:", scripts.length);

  scripts.forEach((script) => {
    const nonceValue = script.getAttribute("nonce");
    const content = script.textContent || script.innerHTML;

    if (nonceValue === "") {
      console.log(
        "Nonce value is empty. Skipping this script.",
        nonceValue === ""
      );
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
      chrome.storage.local.set({ yahoo_email: userEmail }, () => {
        console.log("Email Id is stored in the Local", yahoo_email);
      });
    } else {
      console.log("Script nonce:", nonceValue);
    }
  });
  // Construct the URL using the last messageId and selectedMailboxId
  let lastMessageId = messageIds[messageIds.length - 1];
  if (lastMessageId) {
    console.log("Working on the messageId to First Time check ");
    // Retrieve the "messages" object from chrome.storage.local
    chrome.storage.local.get("messages", function (result) {
      let messages = JSON.parse(result.messages || "{}"); // Ensure messages is an object
      // console.log("___________________", messages);
      if (messages[lastMessageId]) {
        console.log("Thread ID status:", messages[lastMessageId]);
        if (
          messages[lastMessageId] === "safe" ||
          messages[lastMessageId] === "Safe"
        ) {
          showAlert("safe");
          console.log("Local Storage status", messages[lastMessageId]);
          shouldApplyPointerEvents = false;
          blockEmailBody();
          console.log(
            `Removing blocking layer because message is ${messages[lastMessageId]}`
          );
        } else if (
          messages[lastMessageId] === "unsafe" ||
          messages[lastMessageId] === "Unsafe"
        ) {
          showAlert("unsafe");
          console.log("Local Storage status", messages[lastMessageId]);
          console.log(
            `Applying blocking layer because message is ${messages[lastMessageId]}`
          );
          shouldApplyPointerEvents = true;
          blockEmailBody();
        } else if (
          messages[lastMessageId] === "pending" ||
          messages[lastMessageId] === "Pending"
        ) {
          console.log("send response to background for pending status");
          chrome.runtime.sendMessage({
            action: "pendingStatusYahoo",
            emailId: sendUserEmail,
            messageId: sendMessageId,
          });
        }
      } else {
        shouldApplyPointerEvents = true;
        blockEmailBody();
        console.log(
          "Sending message to background for first check for firstCheckForEmail API in YAHOO MAIL"
        );
        chrome.runtime.sendMessage(
          {
            client: "yahoo",
            action: "firstCheckForEmail",
            messageId: lastMessageId,
            email: userEmail,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
              return;
            }
            // console.log("Response from background for firstCheckForEmail API:", response);
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
                const messId = serverData.messageId || serverData.msg_id;
                console.log("serverData:", serverData);
                console.log("resStatus:", resStatus);
                console.log("messId:", messId);
                if (["safe", "unsafe", "pending"].includes(resStatus)) {
                  chrome.storage.local.get("messages", function (result) {
                    let messages = JSON.parse(result.messages || "{}");
                    messages[messId] = resStatus;
                    chrome.storage.local.set(
                      {
                        messages: JSON.stringify(messages),
                      },
                      () => {
                        console.log(
                          `Status ${resStatus} stored for message ${messId}`
                        );
                        shouldApplyPointerEvents = resStatus !== "safe";
                        blockEmailBody();
                        console.log(
                          `Removing blocking layer because message is ${resStatus}`
                        );
                        showAlert(resStatus);
                      }
                    );
                  });
                }
              } else {
                blockEmailBody();
                console.log("Message not found on server, extracting content");
                setTimeout(() => {
                  createUrl(selectedMailboxId, lastMessageId, userEmail);
                }, 100);
              }
            } else if (response.status === "error") {
              console.log("API call failed ok:", error);
              showAlert("inform");
            }
          }
        );
        // .catch((error) => {
        //   console.error("Error sending message to background:", error);
        // });
      }
    });
  } else {
    console.log("messageId not found, skipping email extraction");
  }
  return { lastMessageId, userEmail };
}
function createUrl(selectedMailboxId, lastMessageId, userEmail) {
  console.log("Script Executed===========================");
  const url = `https://apis.mail.yahoo.com/ws/v3/mailboxes/@.id==${selectedMailboxId}/messages/@.id==${lastMessageId}/content/rawplaintext?appId=YMailNovation`;
  console.log("Extracted URL:", url);
  try {
    chrome.runtime.sendMessage({
      action: "sendYahooData",
      lastMessageId,
      userEmail,
      url,
    });
  } catch (error) {
    console.error("Error sending email content to background script:", error);
  }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "yahoo"
  ) {
    console.log(
      "Received message from server to show the erroRecievedFromServer:"
    );
    showAlert("inform");
  }
});

//code to handle the response from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "yahoo") {
    // Check if the message is for Outlook
    console.log(
      "this is the function that will be called when the content script receives a message for the yahoo client"
    );
    chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {
      console.log("Stored data removed.");
    });
    if (message.action === "blockUrls") {
      console.log("Outlook Content script received message:", message.action);
      shouldApplyPointerEvents = true;
      showAlert("unsafe");
      console.log("Blocking URLs for Yahoo");
    } else if (message.action === "unblock") {
      shouldApplyPointerEvents = false;
      console.log("Unblocking URLs for Yahoo");
      showAlert("safe");
    } else if (message.action === "pending") {
      console.log("Pending Status for Yahoo");
      shouldApplyPointerEvents = true;
      showAlert("pending");
      console.log("Blocking URLs for Yahoo due to pending status");
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});

chrome.storage.local.get(null, function (data) {
  console.log("Data retrieved from local storage:", data);
});

chrome.storage.local.get("messages", function (data) {
  console.log("Messages retrieved from local storage:", data);
});


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
  const element = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );
  if (shouldApplyPointerEvents && element) {
    console.log(
      "Clicked on the email body and execute the popup if the mail is pending or unsafe"
    );
    showBlockedPopup();
  }
});
