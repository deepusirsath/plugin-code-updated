import {
  DISPUTES_RAISE,
  PLUGIN_COUNTER,
  UPDATE_EMAIL_STATUS,
} from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";

export function initializeDisputeForm(disputeData) {
  const reasonTextarea = document.getElementById("reason");
  const submitButton = document.getElementById("submit");
  document.getElementById("messageId").innerHTML = disputeData.messageId;
  document.querySelector(".status").textContent = disputeData.status;
  document.getElementById("emailId").textContent = disputeData.senderEmail;
  document.getElementById("countRaise").textContent = disputeData.countRaise;
  document.getElementById("adminRemark").textContent =
    disputeData.adminRemark || " - ";

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
    checkWordCount(5);
  });

  /**
   * Gathers user input data and initiates the dispute process when the submit button is clicked.
   */
  submitButton.addEventListener("click", async () => {
    const disputeCount = disputeData.countRaise || 0;
    if (disputeCount < 3 && disputeCount >= 0) {
      const reasonText = reasonTextarea.value.trim();
      const messageId = document.getElementById("messageId").textContent;
      const receiver_email = await chrome.storage.local.get("receiver_email");
      sendDispute(reasonText, messageId, receiver_email?.receiver_email);
      disableSubmitButton();
    } else {
      alert("Dispute limit reached. You cannot submit more disputes.");
      window.close();
      disableSubmitButton();
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
}

export const checkAdminComment = async (messageId, email) => {
  try {
    const data = await postData(UPDATE_EMAIL_STATUS, {
      messageId,
      email,
    });
    return data?.data[0]?.admin_comment || null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const sendDisputeToServer = async (reason, email, messageId) => {
  try {
    const data = await postData(DISPUTES_RAISE, {
      userComment: reason,
      email,
      msgId: messageId,
    });

    if (data) {
      chrome.storage.local.set({ email_status: "Dispute" });
    }

    return data;
  } catch (error) {
    console.error("Error sending dispute to server:", error);
  }
};

export const checkDisputeCount = async (messageId) => {
  try {
    const data = await postData(PLUGIN_COUNTER, { messageId });
    const dispute_count = data.counter || 0;

    if (dispute_count) {
      chrome.storage.local.set({
        dispute_count: data.counter || 0,
      });
    }

    return { dispute_count };
  } catch (err) {
    console.error(err);
  }
};
