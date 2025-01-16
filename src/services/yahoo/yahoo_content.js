document.addEventListener("visibilitychange", function () {
  chrome.storage.local.remove(["gmail_email", "outlook_email"], () => {
    console.log("Stored data removed.");
  });

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

function handleYahooMailCheck(message, sendResponse) {
  if (
    message.action == "checkYahoomail" ||
    message.action == "fetchDisputeMessageId"
  ) {
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
  if (
    request.action === "EmailNotFoundInPendingRequest" &&
    request.client === "yahoo"
  ) {
    console.log(
      "Received message in content script EmailNotFoundInPendingRequest:",
      request
    );
    executeExtractionScriptIfFailed();
  }
});

// let currentAlert = null; // Global variable to track the current alert

function showAlert(key) {
  const elements = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );
  if (!elements || elements.length === 0) {
    return; // Exit if target element not found
  }
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
  button.style.padding = "10px 25px";
  button.style.border = "none";
  button.style.borderRadius = "6px";
  button.style.cursor = "pointer";
  button.style.backgroundColor = "#4C9ED9"; // Blue color
  button.style.color = "#fff";
  button.style.fontSize = "16px";
  button.style.transition = "background-color 0.3s ease, transform 0.2s"; // Smooth transitions

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#2A7BB0"; // Darker blue on hover
    button.style.transform = "scale(1.05)";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#4C9ED9"; // Revert to original blue
    button.style.transform = "scale(1)";
  });

  let iconHtml = "";
  switch (key) {
    case "safe":
      message.innerText = "This mail is safe you can proceed!!";
      alertContainer.style.border = "4px solid green";
      iconHtml = `
              <svg width="80" height="80">
                  <circle cx="40" cy="40" r="36" stroke="green" stroke-width="6" fill="none"/>
                  <polyline points="24,44 36,58 60,26" stroke="green" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <animate attributeName="stroke-dasharray" values="0,60;60,0" dur="1s" repeatCount="indefinite"/>
                  </polyline>
              </svg>`;
      break;
    case "unsafe":
      message.innerText =
        "Caution! This email has been identified as potentially unsafe. You have the option to raise a dispute regarding its content.";
      alertContainer.style.border = "4px solid red";
      iconHtml = `
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <line x1="26" y1="26" x2="54" y2="54" stroke="red" stroke-width="6" stroke-linecap="round">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
                    </line>
                    <line x1="54" y1="26" x2="26" y2="54" stroke="red" stroke-width="6" stroke-linecap="round">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
                    </line>
                </svg>`;
      break;
    case "inform":
      message.innerText =
        "Heads up! Server is busy, please wait for a moment and try again.";
      alertContainer.style.border = "4px solid orange";
      iconHtml = `
                  <svg width="80" height="80">
                      <circle cx="40" cy="40" r="36" stroke="orange" stroke-width="6" fill="none"/>
                      <text x="40" y="48" text-anchor="middle" font-size="36" fill="orange" font-weight="bold">?</text>
                      <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite"/>
                  </svg>`;
      break;
    case "pending":
      message.innerText =
        "Your request is being processed... Please hold on while we block the email currently being processed.";
      alertContainer.style.border = "4px solid #4C9ED9"; // Softer blue border
      alertContainer.style.backgroundColor = "#fff"; // Light background for a softer look
      iconHtml = `
          <svg width="80" height="30" viewBox="0 0 80 20">
              <circle cx="20" cy="10" r="5" fill="#4C9ED9">
                  <animate attributeName="cy" values="10;5;10" dur="0.6s" repeatCount="indefinite" begin="0s" />
              </circle>
              <circle cx="40" cy="10" r="5" fill="#4C9ED9">
                  <animate attributeName="cy" values="10;5;10" dur="0.6s" repeatCount="indefinite" begin="0.2s" />
              </circle>
              <circle cx="60" cy="10" r="5" fill="#4C9ED9">
                  <animate attributeName="cy" values="10;5;10" dur="0.6s" repeatCount="indefinite" begin="0.4s" />
              </circle>
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

  const observer = new MutationObserver(() => {
    const elements = document.querySelector(
      'div[data-test-id="message-group-view-scroller"]'
    );
    if (!elements || elements.length === 0) {
      if (alertContainer && alertContainer.parentNode) {
        document.body.removeChild(alertContainer);
      }
      observer.disconnect();
    }
  });

  // Start observing the document for DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  document.addEventListener("click", dismissOnOutsideClick, true);
  button.addEventListener("click", removeAlert);
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