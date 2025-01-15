// Function to create the URL for the EML file
export function createUrl(url, messageId) {
    console.log("createUrs called");
    let prefixUrl = url.substr(0, url.search("/#"));
    console.log("prefixUrl", prefixUrl);
    let eml_Url = `${prefixUrl}?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`;
    console.log("Gmail EML Url ", eml_Url);
    try {
      chrome.runtime.sendMessage({
        action: "sendGmailData",
        messageId,
        emailId,
        eml_Url,
      });
    } catch (error) {
      console.error("Error sending email content to background script:", error);
    }
  }