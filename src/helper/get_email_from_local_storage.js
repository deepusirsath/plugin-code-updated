let outLookEmailId = null;
let gmailEmailId = null;
let yahooEmailid = null;

export const getEmailIds = async () => {
  try {
    const gmailResult = await chrome.storage.local.get(["gmail_email"]);
    if (gmailResult.gmail_email) {
      gmailEmailId = gmailResult.gmail_email;
    }

    const outlookResult = await chrome.storage.local.get(["outlook_email"]);
    if (outlookResult.outlook_email) {
      outLookEmailId = outlookResult.outlook_email;
    }

    const yahooResult = await chrome.storage.local.get(["yahoo_email"]);
    if (yahooResult.yahoo_email) {
      yahooEmailid = yahooResult.yahoo_email;
    }
  } catch (error) {
    console.log("Error fetching email IDs:", error);
  }

  return {
    gmailEmailId,
    outLookEmailId,
    yahooEmailid,
  };
};

export const getCurrentEmail = () => {
  return gmailEmailId || outLookEmailId || yahooEmailid;
};
