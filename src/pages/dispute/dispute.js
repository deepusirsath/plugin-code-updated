const reasonTextarea = document.getElementById("reason");
const submitButton = document.getElementById("submit");

/**
 * Calculates the word count of a given text.
 * @param {string} text - The input text to count words from.
 * @returns {number} The count of words in the text.
 */
function getWordCount(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 0).length;
}

/**
 * Enables the submit button by adding the "enabled" class and setting
 * the disabled property to false.
 */
function enableSubmitButton() {
  submitButton.classList.add("enabled");
  submitButton.disabled = false;
}

/**
 * Disables the submit button by removing the "enabled" class and setting
 * the disabled property to true.
 */
function disableSubmitButton() {
  submitButton.classList.remove("enabled");
  submitButton.disabled = true;
}

/**
 * Checks if the word count in the reason textarea meets the required count.
 * Enables or disables the submit button based on the result.
 * @param {number} count - The minimum word count required to enable the button.
 */
function checkWordCount(count) {
  const reasonText = reasonTextarea.value;
  const wordCount = getWordCount(reasonText);

  if (wordCount >= count) {
    enableSubmitButton();
  } else {
    disableSubmitButton();
  }
}

// Event listener to validate word count in the reason textarea
reasonTextarea.addEventListener("input", (event) => {
  event.preventDefault();
  console.log(event);
  checkWordCount(5);
});

const data = new Promise((resolve) => {
  chrome.storage.local.get("dispute_count", function (data) {
    resolve(data);
  });
});

const email_status = new Promise((resolve) => {
  chrome.storage.local.get("email_status", function (data) {
    resolve(data);
  });
});

/**
 * Gathers user input data and initiates the dispute process when the submit button is clicked.
 */
submitButton.addEventListener("click", async () => {
  // Get the current dispute count from chrome storage
  const disputeData = await data;
  const disputeCount = disputeData?.dispute_count || 0;
  if (disputeCount < 3 && disputeCount >= 0) {
    const reasonText = reasonTextarea.value.trim();
    const messageId = document.getElementById("messageId").textContent;
    const receiver_email = await chrome.storage.local.get("receiver_email");

    // Send reason and message ID back to the background script
    sendDispute(reasonText, messageId, receiver_email?.receiver_email);
  } else {
    // Display "limit reached" message and disable button functionality
    alert("Dispute limit reached. You cannot submit more disputes.");
    window.close();
    disableSubmitButton(); // Disable the submit button
  }
});

/**
 * Sends a dispute request with the given reason, messageId, and emailId.
 * @param {string} reason - The reason text provided by the user.
 * @param {string} messageId - The ID of the message being disputed.
 * @param {string} emailId - The email ID associated with the message.
 */
function sendDispute(reason, messageId, emailId) {
  chrome.runtime.sendMessage(
    { action: "dispute", reason, messageId, emailId },
    handleResponse
  );
}

/**
 * Handles the response from the background script after a dispute attempt.
 * Alerts the user if the dispute fails and closes the popup window.
 * @param {Object} response - The response object from the background script.
 * @param {boolean} response - Indicates if the dispute was successful.
 */
function handleResponse(response) {
  if (!response?.error) {
    alert("Dispute sent successfully. Please wait for admin action.");
    window.close();
  } else {
    alert(response?.error);
  }
}

document.getElementById("reload").addEventListener("click", async () => {
  const messageId = document.getElementById("messageId").textContent;
  const email = await chrome.storage.local.get("receiver_email");
  const emailId = email.receiver_email;
  const client = emailId.match(/@(\w+)\./);

  chrome.runtime.sendMessage(
    { action: "reload", messageId, emailId, client: client },
    (response) => {
      document.querySelector(".status").textContent =
        response.disputeStatus.status;
      document.getElementById("adminRemark").textContent =
        response.adminComment.adminRemark;
    }
  );
});
