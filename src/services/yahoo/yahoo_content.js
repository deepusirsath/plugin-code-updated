let messageReason = " ";
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

    const scripts = Array.from(document.querySelectorAll("script[nonce]"));
    // Regular expression to find "unsafeEmail" values
    const regex = /"unsafeEmail":"(.*?)"/;

    let senderEmail = ""; // Default empty value

    // Loop through each script tag and try to match the regex
    for (const script of scripts) {
      const match = script.textContent.match(regex);
      if (match) {
        senderEmail = match[1]; // Assign the extracted email
        console.log("Found unsafeEmail:", senderEmail);
        break; // Stop after finding the first match
      }
    }

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

//Older one
// Function to show the alert to the user
function showAlert(key, messageReason = " ") {
  const element = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );
  if (!element) {
    return;
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
    boxShadow: "0 1px 2px rgba(76, 158, 217, 0.15)",
  });

  button.addEventListener("mouseover", () => {
    Object.assign(button.style, {
      backgroundColor: "#3989c2",
      transform: "translateY(-1px)",
    });
  });

  button.addEventListener("mouseout", () => {
    Object.assign(button.style, {
      backgroundColor: "#4C9ED9",
      transform: "translateY(0)",
    });
  });

  let iconHtml = "";
  switch (key) {
    case "safe":
      message.innerText = "Security verification complete - Safe to proceed";

      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #f8fff8)";
      alertContainer.style.border = "1px solid rgba(40, 167, 69, 0.2)";
      alertContainer.style.borderLeft = "6px solid #28a745";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(40, 167, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
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
      message.innerText =
        "System maintenance in progress - Your security is our priority";

      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #fff8f0)";
      alertContainer.style.border = "1px solid rgba(255, 153, 0, 0.2)";
      alertContainer.style.borderLeft = "6px solid #ff9900";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(255, 153, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
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

  // If messageId or selectedMailboxId is not found, re-execute after 1 second
  if (!selectedMailboxId || !lastMessageId) {
    console.log(
      "messageId or selectedMailboxId not found, retrying in 1 second..."
    );
    setTimeout(executeExtractionScriptIfFailed, 200);
    return;
  }

  if (lastMessageId) {
    console.log("Working on the messageId to First Time check ");
    // Retrieve the "messages" object from chrome.storage.local
    // chrome.storage.local.get("messages", function (result) {
    //   let messages = JSON.parse(result.messages || "{}"); // Ensure messages is an object
    //   // console.log("___________________", messages);
    //   if (messages[lastMessageId]) {
    //     console.log("Thread ID status:", messages[lastMessageId]);
    //     if (
    //       messages[lastMessageId] === "safe" ||
    //       messages[lastMessageId] === "Safe"
    //     ) {
    //       showAlert("safe");
    //       console.log("Local Storage status", messages[lastMessageId]);
    //       shouldApplyPointerEvents = false;
    //       blockEmailBody();
    //       console.log(
    //         `Removing blocking layer because message is ${messages[lastMessageId]}`
    //       );
    //     } else if (
    //       messages[lastMessageId] === "unsafe" ||
    //       messages[lastMessageId] === "Unsafe"
    //     ) {
    //       showAlert("unsafe");
    //       console.log("Local Storage status", messages[lastMessageId]);
    //       console.log(
    //         `Applying blocking layer because message is ${messages[lastMessageId]}`
    //       );
    //       shouldApplyPointerEvents = true;
    //       blockEmailBody();
    //     } else if (
    //       messages[lastMessageId] === "pending" ||
    //       messages[lastMessageId] === "Pending"
    //     ) {
    //       console.log("send response to background for pending status");
    //       chrome.runtime.sendMessage({
    //         action: "pendingStatusYahoo",
    //         emailId: sendUserEmail,
    //         messageId: sendMessageId,
    //       });
    //     }
    //   }
    chrome.storage.local.get("messages", function (result) {
      let messages = JSON.parse(result.messages || "{}");

      if (messages[lastMessageId]) {
        console.log("Thread ID status:", messages[lastMessageId]);
        const status = messages[lastMessageId].status;
        const unsafeReason = messages[lastMessageId].unsafeReason;

        if (status === "safe" || status === "Safe") {
          showAlert("safe", unsafeReason);
          console.log("Local Storage status", status);
          shouldApplyPointerEvents = false;
          blockEmailBody();
          console.log(`Removing blocking layer because message is ${status}`);
        } else if (status === "unsafe" || status === "Unsafe") {
          showAlert("unsafe", unsafeReason);
          console.log("Local Storage status", status);
          console.log(`Applying blocking layer because message is ${status}`);
          shouldApplyPointerEvents = true;
          blockEmailBody();
        } else if (status === "pending" || status === "Pending") {
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
            // if (response.IsResponseRecieved === "success") {
            //   if (response.data.code === 200) {
            //     console.log(
            //       "Response from background for firstCheckForEmail API:",
            //       response
            //     );
            //     const serverData = response.data.data;
            //     const resStatus =
            //       serverData.eml_status || serverData.email_status;
            //     const messId = serverData.messageId || serverData.msg_id;
            //     console.log("serverData:", serverData);
            //     console.log("resStatus:", resStatus);
            //     console.log("messId:", messId);
            //     if (["safe", "unsafe", "pending"].includes(resStatus)) {
            //       chrome.storage.local.get("messages", function (result) {
            //         let messages = JSON.parse(result.messages || "{}");
            //         messages[messId] = resStatus;
            //         chrome.storage.local.set(
            //           {
            //             messages: JSON.stringify(messages),
            //           },
            //           () => {
            //             console.log(
            //               `Status ${resStatus} stored for message ${messId}`
            //             );
            //             shouldApplyPointerEvents = resStatus !== "safe";
            //             blockEmailBody();
            //             console.log(
            //               `Removing blocking layer because message is ${resStatus}`
            //             );
            //             showAlert(resStatus);
            //           }
            //         );
            //       });
            //     }
            //   } else {
            //     blockEmailBody();
            //     console.log("Message not found on server, extracting content");
            //     setTimeout(() => {
            //       createUrl(selectedMailboxId, lastMessageId, userEmail);
            //     }, 100);
            //   }
            // }
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
                const unsafeReason = serverData.unsafe_reasons || " ";

                console.log("serverData:", serverData);
                console.log("resStatus:", resStatus);
                console.log("messId:", messId);

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
                        console.log(
                          `Status ${resStatus} stored for message ${messId}`
                        );
                        shouldApplyPointerEvents = resStatus !== "safe";
                        blockEmailBody();
                        console.log(
                          `Removing blocking layer because message is ${resStatus}`
                        );
                        showAlert(resStatus, unsafeReason);
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
    messageReason = message.unsafeReason;
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
      showAlert("unsafe", messageReason);
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
