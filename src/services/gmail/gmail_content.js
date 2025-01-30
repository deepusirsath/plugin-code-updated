console.log("Content script loaded for Gmail--------");
setTimeout(() => {
  blockEmailBody();
}, 2000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    console.log("Page is visible, checking for email ID...");
    findEmailId();
  }
});

let shouldApplyPointerEvents = true;

let emailId = null;
let messageId = null;
let isValidSegmentLength = 30;
let messageReason = " ";


// Function to check if the current page is a Gmail page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GmailDetectedForExtraction") {
    console.log("Message received in content script - Gmail detected");

    setTimeout(()=>{
      let url = window.location.href;
      if (url.includes("?compose=")) {
        console.log("Compose URL detected. Skipping email extraction.");
        return; // Exit early for compose URLs
      }      
      chrome.storage.local.get("registration", (data) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        if (data.registration) {
          console.log("URL:", url);
          const lastSegment = url.split("/").pop().split("#").pop();
          console.log("last segment ", lastSegment, "total count ", lastSegment.length)
  
          // Check if the last segment has exactly isValidSegmentLength characters
          if (lastSegment.length >= isValidSegmentLength) {
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
    },1000)
    sendResponse({ status: "received" });
  }
});

// when I am on this page https://mail.google.com/mail/u/0/#inbox then by chicking on mail and then when tab changing I went to https://mail.google.com/mail/u/0/#inbox/QgrcJHrnwgRnwdBJtVXrSpjnkBgHcPVrJLb URL at that time it's working fine but the issue is when I am already on this page https://mail.google.com/mail/u/0/#inbox/QgrcJHrnwgRnwdBJtVXrSpjnkBgHcPVrJLb means the mail is opened then the background script does not send the action of "GmailDetectedForExtraction"
// console output:
// Content script loaded for Gmail--------
// gmail_content.js:644 Elements not found



// Function to initialize the script
const init = () => {
  console.log("init called=======================");
  Promise.all([extractMessageIdAndEml(), findEmailId()])
    .then(() => console.log("Operations completed"))
    .catch((error) => console.error("Error:", error));
};

// Function to extract message ID and EML content
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
            console.log("Message Id found in local storage:", messages[messageId]);
            const status = messages[messageId].status;
            const unsafeReason = messages[messageId].unsafeReason;
    
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
                shouldApplyPointerEvents = true;
                blockEmailBody();
                chrome.runtime.sendMessage({
                    action: "pendingStatusGmail",
                    emailId: emailId,
                    messageId: messageId,
                });
            }
        }else {
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
              // if (response.IsResponseRecieved === "success") {
              //   if (response.data.code === 200) {
              //     console.log(
              //       "Response from background for firstCheckForEmail API:",
              //       response
              //     );
              //     const serverData = response.data.data;
              //     const resStatus =
              //     serverData.eml_status || serverData.email_status;
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
              //     console.log(
              //       "Message not found on server, extracting content"
              //     );
              //     setTimeout(() => {
              //       console.log(
              //         "Script Executed for create url==========================="
              //       );
              //       let newUrl = window.location.href;
              //       if (newUrl.includes("?compose=")) {
              //         return; // Exit early for compose URLs
              //       }
              //       createUrl(newUrl, messageId);
              //     }, 100);
              //   }
              // } 
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
                    setTimeout(() => {
                        console.log("Script Executed for create url===========================");
                        let newUrl = window.location.href;
                        if (newUrl.includes("?compose=")) {
                            return; // Exit early for compose URLs
                        }
                        createUrl(newUrl, messageId);
                    }, 100);
                }
              }else if (response.status === "error") {
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

// async function extractMessageIdAndEml() {
//   blockEmailBody();
//   console.log("extractMessageIdAndEm called");
//   const node = document.querySelector("[data-legacy-message-id]");
//   if (node) {
//     messageId = node.getAttribute("data-legacy-message-id");
//     console.log("Message ID found for first time:", messageId);

//     if (messageId) {
//       console.log("Working on the messageId to First Time check ");
//       // Retrieve the "messages" object from chrome.storage.local
//       chrome.storage.local.get("messages", function (result) {
//         let messages = JSON.parse(result.messages || "{}");
//         console.log("local storage mesaage id Items ", messages);
//         if (messages[messageId]) {
//           console.log(
//             "Message Id found in local storage:",
//             messages[messageId]
//           );
//           if (
//             messages[messageId] === "safe" ||
//             messages[messageId] === "Safe"
//           ) {
//             showAlert("safe");
//             console.log("Local Storage status", messages[messageId]);
//             shouldApplyPointerEvents = false;
//             blockEmailBody();
//             console.log(
//               `Removing blocking layer because message is ${messages[messageId]}`
//             );
//           } else if (
//             messages[messageId] === "unsafe" ||
//             messages[messageId] === "Unsafe"
//           ) {
//             showAlert("unsafe");
//             console.log("Local Storage status", messages[messageId]);
//             console.log(
//               `Applying blocking layer because message is ${messages[messageId]}`
//             );
//             shouldApplyPointerEvents = true;
//             blockEmailBody();
//           } else if (
//             messages[messageId] === "pending" ||
//             messages[messageId] === "Pending"
//           ) {
//             console.log("send response to background for pending status");
//             shouldApplyPointerEvents = true;
//             blockEmailBody();
//             chrome.runtime.sendMessage({
//               action: "pendingStatusGmail",
//               emailId: emailId,
//               messageId: messageId,
//             });
//           }
//         } else {
//           shouldApplyPointerEvents = true;
//           blockEmailBody();
//           console.log(
//             "Sending message to background for first check for firstCheckForEmail API in Gmail"
//           );
//           chrome.runtime.sendMessage(
//             {
//               client: "gmail",
//               action: "firstCheckForEmail",
//               messageId: messageId,
//               email: emailId,
//             },
//             (response) => {
//               console.log(
//                 "Response from background for firstCheckForEmail API:",
//                 response
//               );
//               //   let error = response.status;
//               if (response.IsResponseRecieved === "success") {
//                 if (response.data.code === 200) {
//                   console.log(
//                     "Response from background for firstCheckForEmail API:",
//                     response
//                   );
//                   const serverData = response.data.data;
//                   const resStatus =
//                     serverData.eml_status || serverData.email_status;
//                   const messId = serverData.messageId || serverData.msg_id;
//                   console.log("serverData:", serverData);
//                   console.log("resStatus:", resStatus);
//                   console.log("messId:", messId);
//                   if (["safe", "unsafe", "pending"].includes(resStatus)) {
//                     chrome.storage.local.get("messages", function (result) {
//                       let messages = JSON.parse(result.messages || "{}");
//                       messages[messId] = resStatus;
//                       chrome.storage.local.set(
//                         {
//                           messages: JSON.stringify(messages),
//                         },
//                         () => {
//                           console.log(
//                             `Status ${resStatus} stored for message ${messId}`
//                           );
//                           shouldApplyPointerEvents = resStatus !== "safe";
//                           blockEmailBody();
//                           console.log(
//                             `Removing blocking layer because message is ${resStatus}`
//                           );
//                           showAlert(resStatus);
//                         }
//                       );
//                     });
//                   }
//                 } else {
//                   console.log(
//                     "Message not found on server, extracting content"
//                   );
//                   setTimeout(() => {
//                     console.log(
//                       "Script Executed for create url==========================="
//                     );
//                     let newUrl = window.location.href;
//                     if (newUrl.includes("?compose=")) {
//                       return; // Exit early for compose URLs
//                     }
//                     createUrl(newUrl, messageId);
//                   }, 100);
//                 }
//               } else if (response.status === "error") {
//                 console.log(
//                   "API call failed okokokok error print from server:"
//                 );
//                 showAlert("inform");
//                 // extractEmlContent(dataConvid);
//               }
//             }
//           );
//           console.log("API call failed:");
//           // showAlert("inform");
//         }
//       });
//     } else {
//       console.log("messageId not found, skipping email extraction");
//     }
//   } else {
//     console.log("No node found");
//   }
// }

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
    let new2Url = window.location.href;
    if (new2Url.includes("?compose=")) {
      return; // Exit early for compose URLs
    }
    createUrl(new2Url, messageId);
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
    messageReason = message.unsafeReason;
    // Check if the message is for Outlook
    console.log(
      "this is the function that will be called when the content script receives a message for the Gmail client"
    );
    if (message.action === "blockUrls") {
      console.log("Outlook Content script received message:", message.action);
      shouldApplyPointerEvents = true;
      showAlert("unsafe", messageReason);
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
