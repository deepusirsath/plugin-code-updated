console.log("Content script loaded for Gmail--------");
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    findEmailId();
  }
});

let shouldApplyPointerEvents = true;
blockEmailBody();
let emailId = null;
let messageId = null;
let isValidSegmentLength = 32;
let url = window.location.href;

// Function to check if the current page is a Gmail page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GmailDetectedForExtraction") {
    console.log("Message received in content script - Gmail detected");

    chrome.storage.local.set({ registration: true });
    chrome.storage.local.get("registration", (data) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      if (data.registration) {
        let url = window.location.href;
        console.log("URL:", url);
        const lastSegment = url.split("/").pop().split("#").pop();

        // Check if the last segment has exactly isValidSegmentLength characters
        if (lastSegment.length === isValidSegmentLength) {
          console.log(
            `The last segment "${lastSegment}" has exactly isValidSegmentLength characters.`
          );
          // Single initialization
          init();
        } else {
          console.log(
            `The last segment "${lastSegment}" does not have 32 characters.`
          );
        }
      }
    });
    sendResponse({ status: "received" });
  }
});

// Function to initialize the script
const init = () => {
  console.log("init called=======================");
  Promise.all([extractMessageIdAndEml(), findEmailId()])
    .then(() => console.log("Operations completed"))
    .catch((error) => console.error("Error:", error));
};

// Function to extract message ID and EML content
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "fetchDisputeMessageId") {
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
      // findMessageIdRecursive(sendResponse);
      return true;
    }
  }
});

//Detect Gmail URL and extract message ID
async function extractMessageIdAndEml() {
  blockEmailBody();
  console.log("extractMessageIdAndEm called");
  const node = document.querySelector("[data-legacy-message-id]");
  if (node) {
    messageId = node.getAttribute("data-legacy-message-id");
    console.log("Message ID found for first time:", messageId);

    if (messageId) {
      console.log("Working on the messageId to First Time check ");
      // Retrieve the "messages" object from chrome.storage.local
      chrome.storage.local.get("messages", function (result) {
        let messages = JSON.parse(result.messages || "{}");
        console.log("local storage mesaage id Items ", messages);
        if (messages[messageId]) {
          console.log(
            "Message Id found in local storage:",
            messages[messageId]
          );
          if (
            messages[messageId] === "safe" ||
            messages[messageId] === "Safe"
          ) {
            showAlert("safe");
            console.log("Local Storage status", messages[messageId]);
            shouldApplyPointerEvents = false;
            blockEmailBody();
            console.log(
              `Removing blocking layer because message is ${messages[messageId]}`
            );
          } else if (
            messages[messageId] === "unsafe" ||
            messages[messageId] === "Unsafe"
          ) {
            showAlert("unsafe");
            console.log("Local Storage status", messages[messageId]);
            console.log(
              `Applying blocking layer because message is ${messages[messageId]}`
            );
            shouldApplyPointerEvents = true;
            blockEmailBody();
          } else if (
            messages[messageId] === "pending" ||
            messages[messageId] === "Pending"
          ) {
            console.log("send response to background for pending status");
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
          console.log(
            "Sending message to background for first check for firstCheckForEmail API in Gmail"
          );
          chrome.runtime.sendMessage(
            {
              client: "gmail",
              action: "firstCheckForEmail",
              messageId: messageId,
              email: emailId,
            },
            (response) => {
              console.log(
                "Response from background for firstCheckForEmail API:",
                response
              );
              //   let error = response.status;
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
                  console.log(
                    "Message not found on server, extracting content"
                  );
                  setTimeout(() => {
                    console.log(
                      "Script Executed for create url==========================="
                    );
                    createUrl(url, messageId);
                  }, 100);
                }
              } else if (response.status === "error") {
                console.log(
                  "API call failed okokokok error print from server:"
                );
                showAlert("inform");
                // extractEmlContent(dataConvid);
              }
            }
          );
          console.log("API call failed:");
          // showAlert("inform");
        }
      });
    } else {
      console.log("messageId not found, skipping email extraction");
    }
  } else {
    console.log("No node found");
  }
}

// Function to create the URL for the EML file
function createUrl(url, messageId) {
  console.log("createUrs called");
  let prefixUrl = url.substr(0, url.search("/#"));
  console.log("prefixUrl", prefixUrl);
  let eml_Url = `${prefixUrl}?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`;
  console.log("Gmail EML Url ", eml_Url);
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

// Listen for messages from the background script like if the pending staus is empty
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "EmailNotFoundInPendingRequest" &&
    request.client === "gmail"
  ) {
    console.log(
      "Received message in content script EmailNotFoundInPendingRequest:",
      request
    );
    const { messageId } = request;
    createUrl(url, messageId);
  }
});

// Function to find the email ID
async function findEmailId() {
  const titleContent = document.title;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = titleContent.match(emailPattern);
  emailId = emailMatches ? emailMatches[emailMatches.length - 1] : null;
  if (emailId) {
    chrome.storage.local.remove(["yahoo_email", "outlook_email"], () => {
      console.log("Cleared yahoo_email and Outlook emails from storage");
      chrome.storage.local.set({ gmail_email: emailId }, () => {
        console.log("gmail email stored:", emailId);
      });
    });
  }
  console.log("Gmail email ID:", emailId);
}

// Function to show the alert to the user
function showAlert(key) {
  const elements = document.getElementsByClassName("nH a98 iY");
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
    const elements = document.getElementsByClassName("nH a98 iY");
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "gmail"
  ) {
    console.log(
      "Received message from server to show the erroRecievedFromServer:"
    );
    showAlert("inform");
  }
});

// Function to remove the alert when clicked outside of it
document.addEventListener("click", function removeAlertOnClick(event) {
  const alertContainer = document.querySelector("div[style*='z-index: 1000']");
  if (alertContainer) {
    document.body.removeChild(alertContainer);
    document.removeEventListener("click", removeAlertOnClick); // Remove listener after execution
  }
});

// Function to toggle pointer events means blocking the email body or unblocking it
function blockEmailBody() {
  const elements = document.getElementsByClassName("nH a98 iY");
  if (elements && elements.length > 0) {
    // Convert HTMLCollection to Array and apply styles to each element
    Array.from(elements).forEach((element) => {
      if (shouldApplyPointerEvents) {
        console.log("Pointer Event None");
        element.style.pointerEvents = "none";
      } else {
        console.log("Pointer Event All");
        element.style.pointerEvents = "all";
      }
    });
  } else {
    console.log("Elements not found");
  }
}

// function to handle the server response and show the alert with the appropriate message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "gmail") {
    // Check if the message is for Outlook
    console.log(
      "this is the function that will be called when the content script receives a message for the Gmail client"
    );
    if (message.action === "blockUrls") {
      console.log("Outlook Content script received message:", message.action);
      shouldApplyPointerEvents = true;
      showAlert("unsafe");
      console.log("Blocking URLs for Gmail");
    } else if (message.action === "unblock") {
      shouldApplyPointerEvents = false;
      console.log("Unblocking URLs for Gmail");
      showAlert("safe");
    } else if (message.action === "pending") {
      console.log("Pending Status for Gmail");
      shouldApplyPointerEvents = true;
      showAlert("pending");
      console.log("Blocking URLs for Gmail due to pending status");
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});

// Function to show the blocked popup
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

// Add a click event listener to the window to detect the click event on the email body
window.addEventListener("click", (e) => {
  const elements = document.getElementsByClassName("nH a98 iY");
  if (elements && elements.length > 0) {
    Array.from(elements).forEach(() => {
      if (shouldApplyPointerEvents) {
        console.log("Clicked on element detected and showing popup");
        showBlockedPopup();
      }
    });
  }
});

//my code
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "checkGmailmail") {
    const emailBodySearch = document.querySelector(".adn.ads");
    const gmailMessageId = document.querySelector("[data-message-id]")?.getAttribute("data-message-id");

    if (emailBodySearch && gmailMessageId) {
      const senderEmailElement = document.querySelector(".gD");
      let senderEmail = null;

      if (senderEmailElement) {
        const emailMatch = senderEmailElement.textContent.match(/<([^>]+)>/);
        senderEmail = emailMatch ? emailMatch[1] : userEmailId;
      }

      sendResponse({
        emailBodyExists: true,
        messageId: gmailMessageId,
        emailId: userEmailId,
        senderEmail: senderEmail,
      });
    } else {
      sendResponse({
        emailBodyExists: false,
        error: "didn't get the message Id",
      });
    }
  }
  return true;
});

