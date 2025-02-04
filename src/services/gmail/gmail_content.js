// Component imports
const importComponent = async (path) => {
  const src = chrome.runtime.getURL(path);
  return await import(src);
};

// Initialize UI components
let showAlert = null;
let showBlockedPopup = null;

// Load components
Promise.all([
  importComponent("/src/component/email_status/email_status.js"),
  importComponent("/src/component/block_email_popup/block_email_popup.js"),
]).then(([emailStatus, blockPopup]) => {
  showAlert = emailStatus.showAlert;
  showBlockedPopup = blockPopup.showBlockedPopup;
});

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

    setTimeout(() => {
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
          console.log(
            "last segment ",
            lastSegment,
            "total count ",
            lastSegment.length
          );

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
    }, 1000);
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
          console.log(
            "Message Id found in local storage:",
            messages[messageId]
          );
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
                  console.log(
                    "Message not found on server, extracting content"
                  );
                  setTimeout(() => {
                    console.log(
                      "Script Executed for create url==========================="
                    );
                    let newUrl = window.location.href;
                    if (newUrl.includes("?compose=")) {
                      return; // Exit early for compose URLs
                    }
                    createUrl(newUrl, messageId);
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
  // let prefixUrl = url.substr(0, url.search("/#"));
  let prefixUrl = "https://mail.google.com/mail/u/0/";
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
