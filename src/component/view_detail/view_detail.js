import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

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
    chrome.downloads.download({
      url: file.download_url || file.file_url,
      filename: isCDR ? `CDR_${file.file_name}` : file.file_name,
      conflictAction: "uniquify",
    });
  } else {
    alert("Download URL is not available.");
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

  return popup;
};
