const importComponent = async (path) => {
  const src = chrome.runtime.getURL(path);
  return await import(src);
};

// Initialize UI components
let showAlert = null;
let showBlockedPopup = null;
let showLoadingScreen = null;
let hideLoadingScreen = null;
let emailId = "";
let senderElementForDispute = "";
let nicMessageId = "";
let shouldApplyPointerEvents = true;
let lastClickedMailId = null;
let lastClickTime = 0;
let isExtractionInProgress = false;
let messageReason = " ";
// import component
Promise.all([
  importComponent("/src/component/email_status/email_status.js"),
  importComponent("/src/component/block_email_popup/block_email_popup.js"),
  importComponent("/src/component/outlook_loading_screen/outlook_loading_screen.js"),
]).then(([emailStatus, blockPopup, loadingScreen]) => {
  showAlert = emailStatus.showAlert;
  showBlockedPopup = blockPopup.showBlockedPopup;
  showLoadingScreen = loadingScreen.showLoadingScreen;
  hideLoadingScreen = loadingScreen.hideLoadingScreen;
});

const ERROR_MESSAGES = {
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  FAILED_TO_SEND_EMAIL_CONTENT:
    "Failed to send email content to background script:",
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "initializeNicScript") {
    console.log("Initializing NIC email script");
    chrome.storage.local.set({ registration: true });
    chrome.storage.local.get("registration", (data) => {
      if (chrome.runtime.lastError) {
        return;
      }
      if (data.registration) {
        setTimeout(() => {}, 500);
        console.log("Registration data found:", data.registration);
        initializeSetupListener();
      }
    });
    return true;
  }
});

function initializeSetupListener() {
  setupMailItemClickListeners();
  findEmailId();
  setTimeout(() => {
    disableButtonDiv();
  }, 500);
}

const setupMailItemClickListeners = () => {
  const mailListContainer = document.getElementById("zl__CLV-main__rows");

  if (!mailListContainer) {
    console.log("Mail list container not found, will retry later");
    setTimeout(setupMailItemClickListeners, 1000);
    return;
  }
  mailListContainer.addEventListener("click", (event) => {
    const mailItem = event.target.closest("li.RowDouble");
    if (mailItem) {
      const isOdd = mailItem.classList.contains("RowOdd");
      const isEven = mailItem.classList.contains("RowEven");

      if (isOdd || isEven) {
        const mailId = mailItem.id;
        const currentTime = Date.now();
        if (mailId === lastClickedMailId && currentTime - lastClickTime < 300) {
          return;
        }
        lastClickedMailId = mailId;
        lastClickTime = currentTime;

        // Extract relevant information from the mail item
        const subjectElement = mailItem.querySelector(
          '[id$="__su"] span:first-child'
        );
        const senderElement = mailItem.querySelector('[id$="__pa__0"]');
        const dateElement = mailItem.querySelector('[id$="__dt"]');
        senderElementForDispute = senderElement.textContent;
        const mailInfo = {
          id: mailId,
          subject: subjectElement
            ? subjectElement.textContent
            : "Unknown Subject",
          sender: senderElement ? senderElement.textContent : "Unknown Sender",
          date: dateElement ? dateElement.textContent : "Unknown Date",
          rowType: isOdd ? "RowOdd" : "RowEven",
        };
        console.log("Mail item clicked:", mailInfo);
        // Increase delay to allow more time for DOM elements to load
        setTimeout(() => {
          // console.log("Mail info found lets extract the funcrtion");
          ExtractIdFromDate();
        }, 1500); // Increased from 1000 to 2000ms
      }
    }
  });
};

let data = {};

function ExtractIdFromDate() {
  const let1 = document.querySelectorAll(".date");
  console.log("Extracting ID for EML file from date elements:", let1);
  let latest = { date: null, id: null, number: null };

  let1.forEach((el) => {
    const dateText = el.innerText;
    const date = new Date(dateText);
    const id = el.id || "";
    // Extract the number from the ID using RegExp
    const match = id.match(/main_MSGC(\d+)__header_dateCell/);
    const number = match ? match[1] : null;

    if (!latest.date || date > latest.date) {
      latest.date = date;
      latest.id = id;
      latest.number = number;
    }
  });
  generateUniqueIdAndTest(latest.date.toString(), latest.id, latest.number, emailId);
  // console.log("Data extracted for EML file:", data);
}

function generateUniqueIdAndTest(latestDate, elementId, extractedNumber, userName) {
  data = {
    latestDate: latestDate,
    elementId: elementId,
    extractedNumber: extractedNumber,
    userName: userName,
  };
  console.log("Generating unique ID for EML file with data:", data);
  const date = new Date(latestDate);
  const formattedDate =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0");
  const userMailInString = userName.replace(/\W+/g, "").toLowerCase();
  nicMessageId = `${userMailInString}_${extractedNumber}_${formattedDate}`;
  console.log("Created message Id: ", nicMessageId);
  if (nicMessageId) {
    chrome.storage.local.get("messages", function (result) {
      let messages = JSON.parse(result.messages || "{}");

      //Mail found in localStorage
      if (messages[nicMessageId]) {
        console.log("Mail found in localStorage");
        const status = messages[nicMessageId].status;
        const unsafeReason = messages[nicMessageId].unsafeReason;

        if (status === "safe") {
          console.log("Mail is safe");
          clearInterval(intervalId);
          shouldApplyPointerEvents = false;
          blockEmailBody();
          hideLoadingScreen();
          showAlert("safe", unsafeReason);
        } else if (status === "unsafe") {
          console.log("Mail is unsafe");
          clearInterval(intervalId);
          showAlert("unsafe", unsafeReason);
          shouldApplyPointerEvents = true;
          blockEmailBody();
          hideLoadingScreen();
        } else if (status === "pending" || status === "Pending") {
          console.log("Mail is pending");
          hideLoadingScreen();
          // showAlert("pending", "Some time");
          chrome.runtime.sendMessage({
            action: "pendingStatusNic",
            emailId: emailId,
            messageId: nicMessageId,
          });
        } else {
          shouldApplyPointerEvents = true;
          blockEmailBody();
        }
      }
      //Mail not found in localstorage
      else {
        console.log(
          "Mail not found in localStorage, so start the process of checking"
        );
        showLoadingScreen();
        shouldApplyPointerEvents = true;
        blockEmailBody();

        chrome.runtime.sendMessage(
          {
            client: "nic",
            action: "firstCheckForEmail",
            messageId: nicMessageId,
            email: emailId,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              return;
            }
            let error = response.status;

            if (response.IsResponseRecieved === "success") {
              if (response.data.code === 200) {
                const serverData = response.data.data;
                console.log("Server data for pending api call:", serverData);
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
                      { messages: JSON.stringify(messages) },
                      () => {
                        hideLoadingScreen();
                        showAlert(resStatus, unsafeReason);

                        if (resStatus === "pending") {
                          shouldApplyPointerEvents = true;

                          // Clear any previous interval before setting a new one
                          if (intervalId) {
                            clearInterval(intervalId);
                          }
                          intervalId = setInterval(() => {
                            console.log(
                              "pendingStatusCallForYahoo() in pending status for pending api call"
                            );
                            pendingStatusCallForYahoo();
                          }, 5000);
                        } else {
                          // If the status is "safe" or "unsafe", clear the interval (if any)
                          if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                          }
                          shouldApplyPointerEvents = resStatus !== "safe";
                        }

                        blockEmailBody(); // Execute after all conditions
                      }
                    );
                  });
                }
              } else {
                blockEmailBody();
                setTimeout(() => {
                  createUrl(extractedNumber);
                }, 100);
              }
            } else if (response.status === "error") {
              showAlert("inform");
              hideLoadingScreen();
            }
          }
        );
      }
    });
  }
}
function createUrl(extractedNumber) {
  console.log(
    "Creating URL for EML file with extracted number:",
    extractedNumber
  );
  const urlForEml = `https://email.gov.in/service/home/~/?auth=co&view=text&id=${extractedNumber}`;
  console.log("urlForEml", urlForEml);
  console.log("nicMessageId: ", nicMessageId, "emailId:", emailId);
  try {
    console.log("sending the data to background script");
    chrome.runtime.sendMessage({
      action: "sendNicData",
      nicMessageId,
      emailId,
      urlForEml,
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.FAILED_TO_SEND_EMAIL_CONTENT);
  }
}

function findEmailId() {
  // Try to extract email from the page source
  console.log("Finding email ID from page source");
  const pageSource = document.documentElement.innerHTML;
  const emailRegex = /zimbraPrefFromAddress":"([^"]+)"/;
  const match = pageSource.match(emailRegex);

  if (match && match[1]) {
    emailId = match[1];
    console.log("Found email:", emailId);
  }
  return null;
}
function blockEmailBody() {
  const element = document.getElementById("zv__CLV-main__CV_messages");
  if (element) {
    if (shouldApplyPointerEvents) {
      element.style.pointerEvents = "none";
    } else {
      element.style.pointerEvents = "all";
    }
  }
}
function disableButtonDiv() {
  const buttonDivs = document.querySelectorAll(".ZmMsgListExpand");
  if (buttonDivs && buttonDivs.length > 0) {
    buttonDivs.forEach((buttonDiv) => {
      buttonDiv.style.pointerEvents = "none";
      buttonDiv.style.opacity = "0.5";
      buttonDiv.style.cursor = "not-allowed";
    });
    console.log(`${buttonDivs.length} button divs have been disabled.`);
  } else {
    console.log("Button divs not found.");
  }
}
function pendingStatusCallForNic() {
  chrome.runtime.sendMessage({
    action: "pendingStatusNic",
    emailId: emailId,
    messageId: nicMessageId,
  });
}

let intervalId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === "nic") {
    messageReason = message.unsafeReason;
    if (message.action === "blockUrls") {
      console.log("Blocking URLs");
      clearInterval(intervalId);
      hideLoadingScreen();
      shouldApplyPointerEvents = true;
      showAlert("unsafe", messageReason);
    } else if (message.action === "unblock") {
      console.log("Unblocking URLs");
      clearInterval(intervalId);
      hideLoadingScreen();
      shouldApplyPointerEvents = false;
      showAlert("safe");
    } else if (message.action === "pending") {
      console.log("Pending status");
      hideLoadingScreen();
      shouldApplyPointerEvents = true;
      // showAlert("pending");
      // Clear any existing interval before setting a new one
      if (intervalId) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(() => {
        console.log("pendingStatusCallForNic()");
        pendingStatusCallForNic();
      }, 5000);
    }
    blockEmailBody();
    sendResponse({ status: "success" });
  }
});


// Add this with the other message listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "emailSizeCategory" && message.client === "nic") {
    handleEmailSizeCategory(message.sizeCategory);
  }
});

// Add this function to handle different size categories
function handleEmailSizeCategory(sizeCategory) {
  let sizeMessage = "";
  
  switch(sizeCategory) {
    case "underTwo":
      showAlert("pending", "underTwo")
      sizeMessage = "Email size is under 2 MB";
      break;
    case "underTen":
      showAlert("pending", "underTen")
      sizeMessage = "Email size is between 2-10 MB";
      break;
    case "underTwenty":
      showAlert("pending", "underTwenty")
      sizeMessage = "Email size is between 10-20 MB";
      break;
    case "overTwenty":
      showAlert("pending", "overTwenty")
      sizeMessage = "Email size is over 20 MB";
      break;
    default:
      showAlert("pending", "Some time")
      sizeMessage = "Email size unknown";
  }
  
}
