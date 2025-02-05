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
          const lastSegment = url.split("/").pop().split("#").pop();

          if (lastSegment.length >= isValidSegmentLength) {
            init();
          }
        }
      });
    }, 1000);
    sendResponse({ status: "received" });
  }
});

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

chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "erroRecievedFromServer" &&
    request.client === "gmail"
  ) {
    showAlert("inform");
  }
});

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

// Function to initialize the script
const init = () => {
  Promise.all([extractMessageIdAndEml(), findEmailId()])
    .then(() => console.log("Operations completed"))
    .catch((error) => console.error("Error:", error));
};

//Detect Gmail URL and extract message ID
async function extractMessageIdAndEml() {
  blockEmailBody();
  const node = document.querySelector("[data-legacy-message-id]");
  if (!node) {
    return;
  }

  messageId = node.getAttribute("data-legacy-message-id");

  if (!messageId) {
    return;
  }

  chrome.storage.local.get("messages", function (result) {
    let messages = JSON.parse(result.messages || "{}");

    if (messages[messageId]) {
      const status = messages[messageId].status;
      const unsafeReason = messages[messageId].unsafeReason;

      if (status === "safe" || status === "Safe") {
        showAlert("safe", unsafeReason);
        shouldApplyPointerEvents = false;
        blockEmailBody();
      } else if (status === "unsafe" || status === "Unsafe") {
        showAlert("unsafe", unsafeReason);
        shouldApplyPointerEvents = true;
        blockEmailBody();
      } else if (status === "pending" || status === "Pending") {
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
          if (response.IsResponseRecieved === "success") {
            if (response.data.code === 200) {
              const serverData = response.data.data;
              const resStatus =
                serverData.eml_status || serverData.email_status;
              const messId = serverData.messageId || serverData.msg_id;
              const unsafeReason = serverData.unsafe_reasons || " ";
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
            showAlert("inform");
          }
        }
      );
    }
  });
}


/**
 * Constructs a Gmail EML download URL and sends message data to background script
 * 
 * @param {string} url - Current Gmail URL (unused in current implementation)
 * @param {string} messageId - Unique identifier for the Gmail message
 * 
 * @description
 * This function creates a special Gmail URL that allows downloading the email in EML format.
 * It uses a fixed Gmail prefix and combines it with the message ID to generate the EML URL.
 * The function then sends the constructed URL along with message details to the background script
 * using chrome.runtime.sendMessage.
 * 
 * The constructed URL includes the following parameters:
 * - view=att: Specifies attachment view
 * - th: Thread/message ID
 * - attid=0: Attachment ID
 * - disp=comp: Display as complete message
 * - safe=1: Safe mode enabled
 * - zw: Zero-width character (Gmail-specific parameter)
 * 
 * @example
 * createUrl('https://mail.google.com/mail/u/0/#inbox/12345', '12345');
 * // Sends message with EML URL: https://mail.google.com/mail/u/0/?view=att&th=12345&attid=0&disp=comp&safe=1&zw
 */
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
