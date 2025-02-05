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

setTimeout(() => {
  blockEmailBody();
}, 2000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
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
    setTimeout(() => {
      let url = window.location.href;
      if (url.includes("?compose=")) {
        return; 
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
                          shouldApplyPointerEvents = resStatus !== "safe";
                          blockEmailBody();
                          showAlert(resStatus, unsafeReason);
                        }
                      );
                    });
                  }
                } else {
                  setTimeout(() => {
                    let newUrl = window.location.href;
                    if (newUrl.includes("?compose=")) {
                      return;
                    }
                    createUrl(newUrl, messageId);
                  }, 100);
                }
              } else if (response.status === "error") {
                console.log(
                  "API call failed okokokok error print from server:"
                );
                showAlert("inform");
              }
            }
          );
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
  let prefixUrl = "https://mail.google.com/mail/u/0/";
  let eml_Url = `${prefixUrl}?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`;
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
    const { messageId } = request;
    let new2Url = window.location.href;
    if (new2Url.includes("?compose=")) {
      return;
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
      chrome.storage.local.set({ gmail_email: emailId });
    });
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "gmail"
  ) {
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
    Array.from(elements).forEach((element) => {
      if (shouldApplyPointerEvents) {
        element.style.pointerEvents = "none";
      } else {
        element.style.pointerEvents = "all";
      }
    });
  }
}

// function to handle the server response and show the alert with the appropriate message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "gmail") {
    messageReason = message.unsafeReason;
    if (message.action === "blockUrls") {
      shouldApplyPointerEvents = true;
      showAlert("unsafe", messageReason);
    } else if (message.action === "unblock") {
      shouldApplyPointerEvents = false;
      showAlert("safe");
    } else if (message.action === "pending") {
      shouldApplyPointerEvents = true;
      showAlert("pending");
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
