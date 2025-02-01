import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";

/**
 * Configuration object for sidebar navigation and components
 * @constant
 * @type {Object.<string, {buttonId: string, component: string}>}
 * @property {Object} details - Configuration for details section
 * @property {string} details.buttonId - HTML ID for details button ("details-btn")
 * @property {string} details.component - Component name from COMPONENTS constant
 * @property {Object} disputeMail - Configuration for dispute mail section
 * @property {string} disputeMail.buttonId - HTML ID for dispute mail button ("dispute-mail")
 * @property {string} disputeMail.component - Component name from COMPONENTS constant
 * @property {Object} spamMails - Configuration for spam mails section
 * @property {string} spamMails.buttonId - HTML ID for spam mails button ("spam-mails")
 * @property {string} spamMails.component - Component name from COMPONENTS constant
 * @property {Object} activity - Configuration for activity section
 * @property {string} activity.buttonId - HTML ID for activity button ("activity-btn")
 * @property {string} activity.component - Component name from COMPONENTS constant
 * @property {Object} dispute - Configuration for dispute section
 * @property {string} dispute.buttonId - HTML ID for dispute button ("dispute-btn")
 * @property {string} dispute.component - Component name from COMPONENTS constant
 */
export const SIDEBAR_CONFIG = {
  details: {
    buttonId: TARGET_ID.DETAILS_BTN,
    component: COMPONENTS.DETAILS,
  },
  disputeMail: {
    buttonId: TARGET_ID.DISPUTE_MAIL,
    component: COMPONENTS.DISPUTE_MAIL,
  },
  spamMails: {
    buttonId: TARGET_ID.SPAM_MAIL,
    component: COMPONENTS.SPAM_MAIL,
  },
  activity: {
    buttonId: TARGET_ID.ACTIVITY_BTN,
    component: COMPONENTS.ACTIVITY,
  },
  dispute: {
    buttonId: TARGET_ID.DISPUTE_BTN,
    component: COMPONENTS.DISPUTE,
  },
};
