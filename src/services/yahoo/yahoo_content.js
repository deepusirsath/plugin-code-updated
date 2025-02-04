let showAlert = null;

(async () => {
  const src = chrome.runtime.getURL(
    "/src/component/email_status/email_status.js"
  );
  const content = await import(src);
  // Store the function reference without calling it
  showAlert = content.showAlert;
})();

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
