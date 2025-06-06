import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";
import { VALIDATE_CDR_PASSWORD } from "/src/routes/api_route.js";
import config from "/config.js";
import { showCustomAlert } from "/src/component/custom_alert/custom_alert.js";
const baseUrl = config.BASE_URL;

const validateCdrPasswordUrl = `${baseUrl}${VALIDATE_CDR_PASSWORD}`;
/**
 * Common download handler for both CDR files and attachments
 * @param {Object} file - The file object containing download information
 * @param {string} file.file_name - Name of the file to be downloaded
 * @param {string} [file.download_url] - Primary URL for file download
 * @param {string} [file.file_url] - Fallback URL for file download
 * @param {boolean} [isCDR=false] - Whether this is a CDR file download
 */
const handleFileDownload = (file, isCDR = false) => {
  if (file.download_url || file.file_url) {
    browser.downloads.download({
      url: file.download_url || file.file_url,
      filename: isCDR ? `CDR_${file.file_name}` : file.file_name,
      conflictAction: "uniquify",
    });
  } else {
    showAlert("Download URL is not available.");
  }
};

/**
 * Processes and sanitizes HTML content for safe display
 * @param {string} htmlString - The raw HTML string to process
 * @returns {string} Sanitized HTML content with:
 * - Footer element removed (if present)
 * - All anchor tags disabled and grayed out
 * - Href attributes removed from links
 *
 * The function:
 * 1. Parses the HTML string into a DOM document
 * 2. Removes the footer element if it exists
 * 3. Modifies all anchor tags to be non-clickable and visually distinct
 * 4. Returns the processed HTML as a string
 */
const extractBodyContent = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  const footer = doc.querySelector(".footer");
  if (footer) {
    footer.remove();
  }

  const anchorTags = doc.querySelectorAll("a");
  anchorTags.forEach((anchor) => {
    anchor.style.pointerEvents = "none";
    anchor.style.color = "gray";
    anchor.removeAttribute("href");
  });

  return doc.body.innerHTML;
};

/**
 * Creates a container element for CDR download buttons
 * @returns {HTMLDivElement} A div element with class 'cdr-download-container'
 */
const createDownloadContainer = () => {
  const container = document.createElement("div");
  container.className = "cdr-download-container";
  return container;
};

/**
 * Creates a button element for downloading CDR processed files
 * @param {Object} file - The file object containing download information
 * @param {string} file.file_name - Name of the file to be downloaded
 * @param {string} [file.download_url] - Primary URL for file download
 * @param {string} [file.file_url] - Fallback URL for file download
 * @returns {HTMLButtonElement} A configured button element
 */
const createDownloadButton = (file) => {
  const button = document.createElement("button");
  button.className = "cdr-download-button";
  button.textContent = `CDR_${file.file_name}`;
  button.setAttribute("data-tooltip", `Click to download ${file.file_name}`);
  button.addEventListener("click", () => handleFileDownload(file, true));
  return button;
};

/**
 * Processes CDR files and creates a download interface
 * @param {Object} createViewDetail - The view detail configuration object
 * @param {Array} [createViewDetail.cdr_files=[]] - Array of CDR processed files
 */
const handleCDRFiles = (createViewDetail) => {
  const cdrFiles = createViewDetail?.cdr_files || [];
  if (cdrFiles.length === 0) return;

  const downloadContainer = createDownloadContainer();

  cdrFiles.forEach((file) => {
    const downloadButton = createDownloadButton(file);
    downloadContainer.appendChild(downloadButton);
  });

  document.getElementById("cdr-files-container").appendChild(downloadContainer);
};

/**
 * Processes password-protected files and creates an interface
 * @param {Object} createViewDetail - The view detail configuration object
 * @param {Array<Object>} [createViewDetail.password_protect_file=[]] - Array of password-protected files
 */
const handlePasswordProtectedFiles = (createViewDetail) => {
  const passwordProtectedFiles = createViewDetail?.password_protect_file || [];
  if (passwordProtectedFiles.length === 0) return;

  const passwordContainer = document.createElement("div");
  passwordContainer.className = "password-protect-container";

  // Add the title at the top of the container
  const title = document.createElement("h3");
  title.textContent =
    "These files are protected with a password. Please enter the password to generate CDR.";
  title.style.marginBottom = "10px";
  passwordContainer.appendChild(title);

  passwordProtectedFiles.forEach((file) => {
    const fileRow = document.createElement("div");
    fileRow.className = "password-protect-row";
    fileRow.innerHTML = `
      <span>${file.file_name}</span>
      <button class="password-protect-button" data-row-id="${file.row_id}">Enter Password</button>
    `;

    fileRow
      .querySelector(".password-protect-button")
      .addEventListener("click", () => {
        handlePasswordProtectedFile(file);
      });

    passwordContainer.appendChild(fileRow);
  });

  document
    .getElementById("password-protect-container")
    .appendChild(passwordContainer);
};

/**
 * Handles password-protected file download by opening a password input popup
 * @param {Object} file - The file object containing information
 * @param {string} file.file_name - Name of the file
 * @param {number} file.row_id - Row ID for the file
 */
const handlePasswordProtectedFile = (file) => {
  // Create the background overlay
  const overlay = document.createElement("div");
  overlay.className = "password-popup-overlay";

  // Create the password input popup
  const passwordPopup = document.createElement("div");
  passwordPopup.className = "password-popup";
  passwordPopup.innerHTML = `
    <div class="password-popup-content">
      <h3>This file (${file.file_name}) is protected by a password. Please enter the password to continue.</h3>
      <div class="password-input-container">
        <input type="password" id="password-input" placeholder="Enter the password" />
        <span id="toggle-password-visibility" class="toggle-password">🔒</span>
      </div>
      <div class="password-popup-actions">
        <button id="submit-password">Submit</button>
        <button id="cancel-password-popup">Cancel</button>
      </div>
    </div>
  `;

  // Add event listener to toggle password visibility
  const togglePasswordVisibility = passwordPopup.querySelector(
    "#toggle-password-visibility"
  );
  const passwordInput = passwordPopup.querySelector("#password-input");

  togglePasswordVisibility.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordVisibility.textContent = "🔓"; // Open lock icon for visible password
    } else {
      passwordInput.type = "password";
      togglePasswordVisibility.textContent = "🔒"; // Closed lock icon for hidden password
    }
  });

  // Add event listeners for submit and cancel buttons
  passwordPopup
    .querySelector("#submit-password")
    .addEventListener("click", async () => {
      const password = passwordInput.value;
      if (!password) {
        showAlert("Please enter a password.");
        return;
      }
      try {
        const response = await fetch(validateCdrPasswordUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            row_id: file.row_id,
            password: password,
          }),
        });

        const result = await response.json();
        if (result.STATUS === "Success") {
          showAlert(result.message);
        } 
        else {
          showAlert("Please re-enter the password.");
        }
      } catch (error) {
        showAlert(
          "An error occurred while validating the password. Please re-enter the password after some time."
        );
      }
      // Close the popup
      overlay.remove();
    });

  passwordPopup
    .querySelector("#cancel-password-popup")
    .addEventListener("click", () => {
      overlay.remove();
    });

  // Close the popup if the user clicks outside of it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Append the popup and overlay to the document body
  overlay.appendChild(passwordPopup);
  document.body.appendChild(overlay);
};

/**
 * Creates and renders a detailed email view popup
 * @param {Object} createViewDetail - The email details configuration object
 * @param {string} createViewDetail.sender - Email sender address
 * @param {string} createViewDetail.subject - Email subject line
 * @param {string} createViewDetail.body - Email body content (HTML)
 * @param {Array<string>} [createViewDetail.all_reasons] - List of security remarks/reasons
 * @param {Array<Object>} [createViewDetail.attachments] - List of email attachments
 * @param {Array<Object>} [createViewDetail.cdr_files] - List of CDR processed files
 * @returns {HTMLDivElement} The created popup element
 *
 * - Email header with close button
 * - Security remarks section
 * - Email details (sender, subject, body)
 * - Attachment list
 * - CDR files download section
 *
 * The function:
 * 1. Loads required CSS styles
 * 2. Creates a popup with email information
 * 3. Processes and displays security remarks
 * 4. Sanitizes and renders email body content
 * 5. Shows attachments if present
 * 6. Integrates CDR file download functionality
 * 7. Handles popup closure
 */

export const createViewDetail = (createViewDetail) => {
  const view_detail = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_DETAIL}/${COMPONENTS.VIEW_DETAIL}`;
  loadCSS(`${view_detail}.css`);

  const popup = document.createElement("div");
  popup.className = "popup-test";
  popup.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h3>Email Details</h3>
        <button class="close-popup">×</button>
      </div>
      <div class="remarks-detail">
        ${
          createViewDetail?.all_reasons?.length > 0
            ? createViewDetail.all_reasons
                .map((reason) => `<div>${reason}</div>`)
                .join("")
            : "No Remarks"
        }
      </div>
      <div class="popup-body">
        <div class="detail-row">
          <label>Sender:</label>
          <span id="sender-email">${createViewDetail.sender}</span>
        </div>
        <div class="detail-row">
          <label>Subject:</label>
          <span id="email-subject">${createViewDetail.subject}</span>
        </div>
        <div class="detail-row">
          <label>Body:</label>
          <div class="email-body">
            ${extractBodyContent(createViewDetail.body)}
            ${
              createViewDetail?.attachments &&
              createViewDetail?.attachments
                .map(
                  (attachment) =>
                    `<div class="attachment-row">
                    <span>${attachment.file_name}</span>
                       <div class="download-button-container">
                      <img 
                        src="/src/icons/download.png"
                        alt="download-btn"
                        class="download-button"
                        data-url="${
                          attachment.download_url || attachment.file_url
                        }"
                        data-filename="${attachment.file_name}"
                        title="Download"
                      />
                    </div>
                  </div> `
                )
                .join("")
            }
          </div>
        </div>
        <div id="cdr-files-container"></div>
        <div id="password-protect-container"></div>
      </div>
    </div>
  `;

  popup.querySelector(".close-popup").addEventListener("click", () => {
    popup.remove();
  });

  popup.addEventListener("click", (e) => {
    const downloadImg = e.target.closest(".download-button");
    if (downloadImg) {
      const url = downloadImg.getAttribute("data-url");
      const filename = downloadImg.getAttribute("data-filename");

      handleFileDownload(
        {
          download_url: url,
          file_name: filename,
        },
        false
      );
    }
  });

  document.body.appendChild(popup);
  handleCDRFiles(createViewDetail);
  handlePasswordProtectedFiles(createViewDetail);

  return popup;
};

export const showAlert = (message) => {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "simple-alert-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "10000";

  // Create alert box
  const alertBox = document.createElement("div");
  alertBox.className = "simple-alert";
  alertBox.style.backgroundColor = "#ffffff";
  alertBox.style.borderRadius = "5px";
  alertBox.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
  alertBox.style.padding = "30px"; // Increased padding for more height
  alertBox.style.width = "50%"; // Set width to 50%
  alertBox.style.minHeight = "100px"; // Added minimum height
  alertBox.style.display = "flex";
  alertBox.style.flexDirection = "column";
  alertBox.style.justifyContent = "space-between";
  alertBox.style.textAlign = "center";

  // Add message and close button
  alertBox.innerHTML = `
    <div style="margin-bottom: 20px; font-size: 16px; flex-grow: 1; display: flex; align-items: center; justify-content: center; font-weight: bold;">${message}</div>
    <div>
      <button class="simple-alert-close" style="
        padding: 10px 20px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;">Close</button>
    </div>
  `;

  // Add close functionality
  const closeButton = alertBox.querySelector(".simple-alert-close");
  closeButton.addEventListener("click", () => {
    overlay.remove();
  });

  // Close when clicking outside the alert box
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Append to DOM
  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);

  return overlay;
};
