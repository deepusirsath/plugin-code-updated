import { ERROR_MESSAGES } from "/src/constant/error_message.js";

let outLookEmailId = null;
let gmailEmailId = null;
let yahooEmailid = null;

/**
 * Retrieves email IDs from chrome storage for Gmail, Outlook and Yahoo
 *
 * @returns {Promise<Object>} Object containing email IDs for different providers
 * @property {string} gmailEmailId - Gmail email address
 * @property {string} outLookEmailId - Outlook email address
 * @property {string} yahooEmailid - Yahoo email address
 *
 * @example
 * const emails = await getEmailIds();
 */
export const getEmailIds = async () => {
  try {
    const gmailResult = await browser.storage.local.get(["gmail_email"]);
    const outlookResult = await browser.storage.local.get(["outlook_email"]);
    const yahooResult = await browser.storage.local.get(["yahoo_email"]);

    if (gmailResult.gmail_email) {
      gmailEmailId = gmailResult.gmail_email;
    }

    if (outlookResult.outlook_email) {
      outLookEmailId = outlookResult.outlook_email;
    }

    if (yahooResult.yahoo_email) {
      yahooEmailid = yahooResult.yahoo_email;
    }
  } catch (error) {
    console.log(ERROR_MESSAGES.EMAIL_ID_NOT_FOUND);
  }

  return {
    gmailEmailId,
    outLookEmailId,
    yahooEmailid,
  };
};

/**
 * Gets the currently active email ID from any of the email providers
 *
 * @returns {string} First available email ID in order: Gmail > Outlook > Yahoo
 *
 * @example
 * const currentEmail = getCurrentEmail();
 */
export const getCurrentEmail = () => {
  return gmailEmailId || outLookEmailId || yahooEmailid;
};
