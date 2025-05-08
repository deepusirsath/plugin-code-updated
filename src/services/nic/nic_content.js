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
// import component
Promise.all([
    importComponent("/src/component/email_status/email_status.js"),
    importComponent("/src/component/block_email_popup/block_email_popup.js"),
    importComponent(
        "/src/component/outlook_loading_screen/outlook_loading_screen.js"
    ),
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
                setTimeout(() => { }, 500);
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

/** function handleNicMailCheck(message, sendResponse) {
    if (
        message.action == "checkYahoomail" ||
        message.action == "fetchDisputeMessageId"
    ) {
        const emailBodySearch = document.getElementById(
            "zv__CLV-main__CV_messages"
        );

        const scripts = Array.from(document.querySelectorAll("script[nonce]"));
        // Regular expression to find "unsafeEmail" values
        const regex = /"unsafeEmail":"(.*?)"/;

        chrome.storage.local.remove(["gmail_email", "outlook_email"], () => { });

        if (emailBodySearch) {
            sendResponse({
                emailBodyExists: true,
                messageId: sendMessageId,
                emailId: sendUserEmail,
                senderEmail: senderElementForDispute,
            });
        } else {
            sendResponse({
                emailBodyExists: false,
                error: "did't get the messasge Id",
            });
        }
    }
} */


/** chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleNicMailCheck(message, sendResponse);
    return true; // Keeps the message channel open for async sendResponse
}); */


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
                    console.log("Mail info found lets extract the funcrtion");
                    ExtractIDForEMLFile();
                }, 1500); // Increased from 1000 to 2000ms
            }
        }
    });
};

let data = {};

function ExtractIDForEMLFile() {
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
    data = {
        latestDate: latest.date.toString(),
        elementId: latest.id,
        extractedNumber: latest.number,
        userName: "Ekvayu",
    };
    generateUniqueId(latest.date.toString(), latest.id, latest.number, emailId);
    console.log("Data extracted for EML file:", data);
}

function generateUniqueId(latestDate, elementId, extractedNumber, userName) {
    console.log(
        "Generating unique ID for EML file with data:",
        latestDate,
        elementId,
        extractedNumber,
        userName
    );
    const date = new Date(latestDate);
    const formattedDate =
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, "0") +
        String(date.getDate()).padStart(2, "0") +
        String(date.getHours()).padStart(2, "0") +
        String(date.getMinutes()).padStart(2, "0") +
        String(date.getSeconds()).padStart(2, "0");
    const safeUser = userName.replace(/\W+/g, "").toLowerCase();
    nicMessageId = `uid_${safeUser}_${extractedNumber}_${formattedDate}`;
    console.log(nicMessageId);
    if (nicMessageId) {
        chrome.storage.local.get("messages", function (result) {
            let messages = JSON.parse(result.messages || "{}");

            if (messages[nicMessageId]) {
                const status = messages[nicMessageId].status;
                const unsafeReason = messages[nicMessageId].unsafeReason;

                if (status === "safe") {
                    clearInterval(intervalId);
                    shouldApplyPointerEvents = false;
                    blockEmailBody();
                    hideLoadingScreen();
                    showAlert("safe", unsafeReason);
                } else if (status === "unsafe") {
                    clearInterval(intervalId);
                    showAlert("unsafe", unsafeReason);
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                    hideLoadingScreen();
                } else if (status === "pending") {
                    hideLoadingScreen();
                    showAlert("pending", "Some time");
                    chrome.storage.local.get("outlook_email", (data) => {
                        chrome.runtime.sendMessage({
                            action: "pendingStatusOutlook",
                            emailId: data.outlook_email,
                            messageId: nicMessageId,
                        });
                        shouldApplyPointerEvents = true;
                        blockEmailBody();
                    });
                } else {
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                }
            } 
            else {
                shouldApplyPointerEvents = true;
                blockEmailBody();
                chrome.runtime
                    .sendMessage(
                        {
                            client: "nicMail",
                            action: "firstCheckForEmail",
                            messageId: nicMessageId,
                            email: emailId,
                        },
                        (response) => {
                            let error = response.status;
                            if (response.IsResponseRecieved === "success") {
                                if (response.data.code === 200) {
                                    const serverData = response.data.data;
                                    const resStatus =
                                        serverData.eml_status || serverData.email_status;
                                    const messId =
                                        serverData.messageId || serverData.msg_id;
                                    const unsafeReason =
                                        serverData.unsafe_reasons || " ";

                                    if (
                                        ["safe", "unsafe", "pending"].includes(resStatus)
                                    ) {
                                        chrome.storage.local.get(
                                            "messages",
                                            function (result) {
                                                let messages = JSON.parse(
                                                    result.messages || "{}"
                                                );
                                                messages[messId] = {
                                                    status: resStatus,
                                                    unsafeReason: unsafeReason,
                                                };

                                                chrome.storage.local.set(
                                                    {
                                                        messages: JSON.stringify(messages),
                                                    },
                                                    () => {
                                                        if (resStatus === "pending") {
                                                            handlePendingStatus();
                                                        } else {
                                                            shouldApplyPointerEvents =
                                                                resStatus !== "safe";
                                                            blockEmailBody();
                                                            showAlert(resStatus, unsafeReason);
                                                        }
                                                    }
                                                );
                                            }
                                        );
                                    }

                                    // Function to handle "pending" status
                                    function handlePendingStatus() {
                                        hideLoadingScreen();
                                        shouldApplyPointerEvents = true;
                                        // showAlert("pending");
                                        // Clear any existing interval before starting a new one
                                        if (intervalId) {
                                            clearInterval(intervalId);
                                        }

                                        intervalId = setInterval(() => {
                                            // console.log("pendingStatusCallForOutlook()");
                                            pendingStatusCallForOutlook();
                                        }, 5000);
                                    }
                                } else {
                                    shouldApplyPointerEvents = true;
                                    blockEmailBody();
                                    setTimeout(() => {
                                        if (!isExtractionInProgress) {
                                            executeWithLoadingScreenAndExtraction();
                                        } else {
                                            // console.log("Skipping extraction request as one is already in progress");
                                        }
                                    }, 100);
                                }
                            } else if (response.status === "error") {
                                showAlert("inform");
                                hideLoadingScreen();
                            }
                        }
                    )
                    .catch((error) => {
                        showAlert("inform");
                        hideLoadingScreen();
                    });
            }
        });
    }
    // const urlForEml = `https://email.gov.in/service/home/~/?auth=co&view=text&id=${extractedNumber}`;
    // console.log("urlForEml", urlForEml)
    // sendDataToBackground(nicMessageId, extractedNumber, emailId, urlForEml)
}

function sendDataToBackground(nicMessageId, extractedNumber, emailId, urlForEml) {
    chrome.runtime.sendMessage({
        action: "sendNicData",
        nicMessageId: nicMessageId,
        extractedNumber: extractedNumber,
        emailId: emailId,
        url: urlForEml
    })
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
