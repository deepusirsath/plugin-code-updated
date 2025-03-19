import {
  DISPUTES_RAISE,
  PLUGIN_COUNTER,
  UPDATE_EMAIL_STATUS,
} from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";
import { showCustomAlert } from "/src/component/custom_alert/custom_alert.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { displayError } from "/src/helper/display_error.js";

let isSubmitting = false;
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
  const reloadIcon = document.getElementById("reload");

  document.getElementById("messageId").innerHTML = disputeData.messageId;
  document.querySelector(".status").textContent = disputeData.status;
  document.getElementById("emailId").textContent = disputeData.senderEmail;
  document.getElementById("countRaise").textContent = disputeData.countRaise;
  document.getElementById("adminRemark").textContent =
    disputeData.adminRemark || " - ";

  const updateReloadIconVisibility = (status) => {
    reloadIcon.style.display = status === "Dispute" ? "inline-block" : "none";
  };

  // Initial visibility setup
  updateReloadIconVisibility(disputeData.status);

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
   * Handles the dispute form submission process
   *
   * Event listener for the submit button that:
   * - Disables the submit button during processing
   * - Validates if dispute count is within allowed limit (0-2)
   * - Extracts form data including:
   *   - User's reason text
   *   - Message ID
   *   - Receiver's email from Chrome storage
   * - Sends dispute if count is within limits (0-2)
   * - Shows alert and disables submission if:
   *   - Previous dispute is pending
   *   - Maximum limit (3) reached
   *
   * @listens {click}
   * @async
   * @fires sendDispute - When dispute count is valid
   * @fires showCustomAlert - When dispute limit is reached
   */

  submitButton.addEventListener("click", async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      disableSubmitButton();
      const disputeCount = disputeData.countRaise || 0;
      const currentStatus = disputeData.status;

      const existingAlerts = document.querySelectorAll(".custom-alert-overlay");
      existingAlerts.forEach((alert) => alert.remove());

      if (disputeData.status === "pending") {
        showCustomAlert(
          "You can not raise dispute on pending email status.",
          "warning"
        );
        return;
      }
      // Check if previous dispute is still pending admin response
      if (currentStatus === "Dispute" && disputeCount < 3) {
        showCustomAlert(
          "Please wait for admin response before raising another dispute.",
          "warning"
        );
        enableSubmitButton();
        return;
      }

      // Check dispute count limit
      if (disputeCount < 3 && disputeCount >= 0) {
        const reasonText = reasonTextarea.value.trim();
        const messageId = document.getElementById("messageId").textContent;
        const receiver_email = await chrome.storage.local.get("receiver_email");
        sendDispute(reasonText, messageId, receiver_email?.receiver_email);
      } else {
        disableSubmitButton();
        showCustomAlert(
          "You have reached the maximum limit for disputes. Each email can be disputed a maximum of three times.",
          "error"
        );
      }
    } finally {
      isSubmitting = false;
      enableSubmitButton();
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
   * Handles the response from a dispute submission and manages alert display
   *
   * @param {Object} response - The response object from the dispute submission
   * @param {string} [response.error] - Error message if dispute submission failed
   *
   * Features:
   * - Uses a flag (window.disputeAlertShown) to prevent multiple alerts
   * - Shows success message and closes window on successful submission
   * - Displays error message if submission fails
   * - Resets alert flag on error to allow retrying
   *
   * @example
   * handleResponse({ error: null }); // Shows success message and closes window
   * handleResponse({ error: "Invalid request" }); // Shows error message
   */
  const handleResponse = (response) => {
    // Add a flag to track if alert was shown
    if (window.disputeAlertShown) {
      return;
    }
    window.disputeAlertShown = true;

    if (!response?.error) {
      showCustomAlert(
        "Your dispute has been successfully submitted. Please wait for the admin's response.",
        "success"
      );
    } else {
      showCustomAlert(response?.error);
      window.disputeAlertShown = false;
    }
  };

  document.getElementById("reload").addEventListener("click", async () => {
    reloadIcon.innerHTML = "";
    showLoader();
    const messageId = document.getElementById("messageId").textContent;
    const email = await chrome.storage.local.get("receiver_email");
    const emailId = email.receiver_email;
    const client = emailId.match(/@(\w+)\./);

    chrome.runtime.sendMessage(
      { action: "reload", messageId, emailId, client: client },
      (response) => {
        hideLoader();
        reloadIcon.innerHTML =
          '<img src="/src/icons/reload.png" alt="reload icon">';
        if (response.adminComment !== null) {
          const newStatus = response.disputeStatus;
          document.querySelector(".status").textContent = newStatus;
          document.getElementById("adminRemark").textContent =
            response.adminComment;
          updateReloadIconVisibility(newStatus);
        } else {
          document.querySelector(".status").textContent = "Dispute";
        }
      }
    );
  });
};

/**
 * Retrieves admin comments for a specific message and email combination
 * @param {string} messageId - ID of the User's mail
 * @param {string} email - Email address associated with the message
 * @returns {Promise<string|null>} Admin comment if found, null otherwise
 */
export const checkAdminComment = async (messageId, email) => {
  try {
    const data = await postData(UPDATE_EMAIL_STATUS, {
      messageId,
      email,
    });
    return data?.data[0]?.admin_comment || null;
  } catch (err) {
    displayError();
  }
};

/**
 * Sends a dispute request to the server and updates local storage status
 * @param {string} reason - User's dispute reason/comment
 * @param {string} email - User's email address
 * @param {string} messageId - User's email messageId
 * @returns {Promise<Object>} Server response data
 */
export const sendDisputeToServer = async (reason, email, messageId) => {
  //add a submission lock to prevent multiple submissions
  if (isSubmitting) return;
  isSubmitting = true;

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
    displayError();
  } finally {
    isSubmitting = false;
  }
};

/**
 * Retrieves and stores the dispute count for a specific mail
 * @param {string} messageId - The ID of the message to check disputes for
 * @returns {Promise<Object>} Object containing the dispute_count
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
    displayError();
  }
};
