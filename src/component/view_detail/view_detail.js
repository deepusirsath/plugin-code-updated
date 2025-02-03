import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

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
 *
 * This function creates a dedicated container for organizing
 * and displaying CDR (Content Disarm and Reconstruction) file
 * download buttons in the view detail popup
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
 * @returns {HTMLButtonElement} A configured button element with:
 * - CDR-specific styling class
 * - Download tooltip
 * - Click event handler for file download
 * - Button text prefixed with 'CDR_'
 */
const createDownloadButton = (file) => {
  const button = document.createElement("button");
  button.className = "cdr-download-button";
  button.textContent = `CDR_${file.file_name}`;
  button.setAttribute("data-tooltip", `Click to download ${file.file_name}`);
  button.addEventListener("click", () => handleDownload(file));
  return button;
};

/**
 * Initiates the download of a CDR processed file using Chrome's download API
 * @param {Object} file - The file object containing download information
 * @param {string} file.file_name - Name of the file to be downloaded
 * @param {string} [file.download_url] - Primary URL for file download
 * @param {string} [file.file_url] - Fallback URL for file download
 *
 * The function:
 * - Uses chrome.downloads.download API to handle file downloads
 * - Prefixes downloaded files with 'CDR_'
 * - Handles URL fallback logic (download_url → file_url)
 * - Shows alert if no download URL is available
 * - Automatically handles filename conflicts with 'uniquify' option
 */
const handleDownload = (file) => {
  if (file.download_url || file.file_url) {
    chrome.downloads.download({
      url: file.download_url || file.file_url,
      filename: `CDR_${file.file_name}`,
      conflictAction: "uniquify",
    });
  } else {
    alert("Download URL is not available.");
  }
};

/**
 * Processes CDR files and creates a download interface in the view detail popup
 * @param {Object} createViewDetail - The view detail configuration object
 * @param {Array} [createViewDetail.cdr_files=[]] - Array of CDR processed files
 *
 * The function:
 * - Creates a container for CDR download buttons
 * - Generates download buttons for each CDR file
 * - Appends the download interface to the designated container
 * - Handles empty CDR files array gracefully
 * - Integrates with the existing DOM structure via 'cdr-files-container'
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
 * @param {Array} [createViewDetail.unsafe_reasons] - List of security remarks
 * @param {Array} [createViewDetail.cdr_files] - List of CDR processed files
 * @returns {HTMLDivElement} The created popup element
 *
 * The function:
 * - Loads required CSS styles
 * - Creates a popup with email details including sender, subject, and body
 * - Displays security remarks if available
 * - Integrates CDR file download functionality
 * - Handles popup closure
 * - Sanitizes email body content for safe display
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
        ${createViewDetail?.unsafe_reasons?.[0] || "No Remarks"}
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
          <div id="email-body">${extractBodyContent(
            createViewDetail.body
          )}</div>                        
        </div>
        <div id="cdr-files-container"></div>
      </div>
    </div>
  `;

  popup.querySelector(".close-popup").addEventListener("click", () => {
    popup.remove();
    onClose();
  });

  document.body.appendChild(popup);
  handleCDRFiles(createViewDetail);

  return popup;
};
