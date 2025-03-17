/**
 * This library holdes all the regex we will be using in this project
 * @class RegexLibrary
 */
export class RegexLibrary {
  static GMAIL_INBOX_REG_EX =
    /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|label|snoozed||drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+$/;

  static IS_GMAIL_MAIL_OPENED_REG_EX =
    /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|label|drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+\/?$/;

  /** Deny Instanciation of this Class */
  constructor() {
    throw new Error(
      "Cannot instanciate this Class, please use only for static members"
    );
  }
}

export default RegexLibrary;
