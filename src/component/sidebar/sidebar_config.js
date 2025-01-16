import { COMPONENTS } from "/src/constant/component.js";

/**
 * Sidebar navigation configuration mapping button IDs to their components
 * @type {Object.<string, {component: string}>}
 */
export const SIDEBAR_CONFIG = {
    details: {
      buttonId: "details-btn",
      component: COMPONENTS.DETAILS,
    },
    disputeMail: {
      buttonId: "dispute-mail",
      component: COMPONENTS.DISPUTE_MAIL,
    },
    spamMails: {
      buttonId: "spam-mails",
      component: COMPONENTS.SPAM_MAIL,
    },
    activity: {
      buttonId: "activity-btn",
      component: COMPONENTS.ACTIVITY,
    },
    dispute: {
      buttonId: "dispute-btn",
      component: COMPONENTS.DISPUTE,
    },
  };