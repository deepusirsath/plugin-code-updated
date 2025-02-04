import {
  IS_GMAIL,
  IS_OUTLOOK,
  IS_YAHOO,
} from "/src/constant/email_service.js";
import RegexLibrary from "/src/library/regex.lib.js";

/**
 * Checks if a specific Gmail email is opened by analyzing the URL structure.
 *
 * @param {string} url - The URL of the page you want to check.
 * @returns {boolean} - Returns true if the URL matches the structure of an opened Gmail email, false otherwise.
 */
export const isGmailMailOpened = (url) =>
  RegexLibrary.IS_GMAIL_MAIL_OPENED_REG_EX.test(url);

/**
 * Checks if the provided URL belongs to Gmail by verifying the presence of the Gmail domain.
 *
 * @param {string} url - The URL of the page you want to check.
 * @returns {boolean} - Returns true if the URL belongs to Gmail, false otherwise.
 */
export const isGmailPage = (url) => url.includes(IS_GMAIL);

/**
 * Checks if the provided URL belongs to Outlook Mail by verifying the presence of the Outlook domain.
 *
 * @param {string} url - The URL of the page you want to check.
 * @returns {boolean} - Returns true if the URL belongs to Outlook Mail, false otherwise.
 */
export const isOutlookPage = (url) => url.includes(IS_OUTLOOK);

/**
 * Checks if the provided URL belongs to Yahoo Mail by verifying the presence of the Yahoo Mail domain.
 *
 * @param {string} url - The URL of the page you want to check.
 * @returns {boolean} - Returns true if the URL belongs to Yahoo Mail, false otherwise.
 */
export const isYahooPage = (url) => url.includes(IS_YAHOO);
