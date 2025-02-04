import {
  DISPUTES_RAISE,
  PLUGIN_COUNTER,
  UPDATE_EMAIL_STATUS,
} from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";

/**
 * Initializes and manages a dispute form interface with validation and submission handling
 *
 * @param {Object} disputeData - Data object containing dispute information
 * @param {string} disputeData.messageId - Unique identifier for the User email
 * @param {string} disputeData.status - Current status of the mail
 * @param {string} disputeData.senderEmail - Email address of the sender
 * @param {number} disputeData.countRaise - Number of times dispute has been raised
 * @param {string} disputeData.adminRemark - Administrative remarks on the dispute
 *
 * Features:
 * - Sets up form fields with dispute data
 * - Implements word count validation (minimum 5 words required)
 * - Manages submit button state based on validation
 * - Handles dispute submission with count limits (0-2 allowed)
 * - Provides real-time status updates via reload functionality
 * - Integrates with Chrome storage and messaging systems
 *
 * @example
 * initializeDisputeForm({
 *   messageId: "msg123",
 *   status: "pending",
 *   senderEmail: "user@example.com",
 *   countRaise: 1,
 *   adminRemark: "Under review"
 * });
 */
export const initializeDisputeForm = (disputeData) => {
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
  const getWordCount = (text) => {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((word) => word.length > 0).length;
  };

  /**
   * Enables the submit button by adding the "enabled" class and setting
   * the disabled property to false.
   */
  const enableSubmitButton = () => {
    submitButton.classList.add("enabled");
    submitButton.disabled = false;
  };

  /**
   * Disables the submit button by removing the "enabled" class and setting
   * the disabled property to true.
   */
  const disableSubmitButton = () => {
    submitButton.classList.remove("enabled");
    submitButton.disabled = true;
  };

  /**
   * Checks if the word count in the reason textarea meets the required count.
   * Enables or disables the submit button based on the result.
   * @param {number} count - The minimum word count required to enable the button.
   */
  const checkWordCount = (count) => {
    const reasonText = reasonTextarea.value;
    const wordCount = getWordCount(reasonText);

    if (wordCount >= count) {
      enableSubmitButton();
    } else {
      disableSubmitButton();
    }
  };

  /**
   * Validates the word count in the reason textarea on user input
   * - Prevents default input behavior
   * - Checks if text meets minimum 5 word requirement
   * - Enables/disables submit button based on word count
   */
  reasonTextarea.addEventListener("input", (event) => {
    event.preventDefault();
    checkWordCount(5);
  });

  /**
   * Handles the dispute form submission
   * Validates dispute count limits and processes the submission
   * - Disables submit button during processing
   * - Checks if dispute count is within allowed limit (0-2)
   * - Collects form data: reason text, message ID, and receiver email
   * - Sends dispute if within limits
   * - Shows alert and closes window if limit exceeded
   */
  submitButton.addEventListener("click", async () => {
    disableSubmitButton();
    const disputeCount = disputeData.countRaise || 0;
    if (disputeCount < 3 && disputeCount >= 0) {
      const reasonText = reasonTextarea.value.trim();
      const messageId = document.getElementById("messageId").textContent;
      const receiver_email = await chrome.storage.local.get("receiver_email");
      sendDispute(reasonText, messageId, receiver_email?.receiver_email);
    } else {
      disableSubmitButton();
      alert("Dispute limit reached. You cannot submit more disputes.");
      window.close();
    }
  });

  /**
   * Sends a dispute request with the given reason, messageId, and emailId.
   * @param {string} reason - The reason text provided by the user.
   * @param {string} messageId - The ID of the message being disputed.
   * @param {string} emailId - The email ID associated with the message.
   */
  const sendDispute = (reason, messageId, emailId) => {
    chrome.runtime.sendMessage(
      { action: "dispute", reason, messageId, emailId },
      handleResponse
    );
  };

  /**
   * Handles the response from the background script after a dispute attempt.
   * Alerts the user if the dispute fails and closes the popup window.
   * @param {Object} response - The response object from the background script.
   * @param {boolean} response - Indicates if the dispute was successful.
   */
  const handleResponse = (response) => {
    if (!response?.error) {
      alert("Dispute sent successfully. Please wait for admin action.");
      window.close();
    } else {
      alert(response?.error);
    }
  };

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
};

/**
 * Retrieves admin comments for a specific message and email combination
 * @param {string} messageId - ID of the User's mail
 * @param {string} email - Email address associated with the message
 * @returns {Promise<string|null>} Admin comment if found, null otherwise
 * @throws {Error} Logs error to console and returns null if request fails
 */
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

/**
 * Sends a dispute request to the server and updates local storage status
 * @param {string} reason - User's dispute reason/comment
 * @param {string} email - User's email address
 * @param {string} messageId - User's email messageId
 * @returns {Promise<Object>} Server response data
 * @throws {Error} Logs error to console if request fails
 */
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

/**
 * Retrieves and stores the dispute count for a specific mail
 * @param {string} messageId - The ID of the message to check disputes for
 * @returns {Promise<Object>} Object containing the dispute_count
 * @throws {Error} Logs error to console if request fails
 */
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
