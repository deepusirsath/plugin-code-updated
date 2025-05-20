const EMAIL_PAGES = [
  "Gmail",
  "Outlook",
  "OpenedGmail",
  "OpenedOutlook",
  "Yahoo",
  "OpenedYahoo",
  "Nic",
  "OpenedNic",
];


/**
 * Checks if a given page name is part of the email-related pages
 * 
 * @param {string} pageName - The name of the page to check
 * @returns {boolean} True if the page is an email page, false otherwise
 * 
 * @example
 * const isEmail = isEmailPage('OpenedGmail');  // returns true if 'OpenedGmail' is in EMAIL_PAGES
 * const isEmail = isEmailPage('settings'); // returns false if 'settings' is not in EMAIL_PAGES
 */
export const isEmailPage = (pageName) => {
  return EMAIL_PAGES.includes(pageName);
};
