import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

function extractBodyContent(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Remove the footer inside the email body
  const footer = doc.querySelector(".footer");
  if (footer) {
    footer.remove();
  }

  // Disable all anchor tags inside the parsed HTML
  const anchorTags = doc.querySelectorAll("a");
  anchorTags.forEach((anchor) => {
    anchor.style.pointerEvents = "none";
    anchor.style.color = "gray";
    anchor.removeAttribute("href");
  });

  return doc.body.innerHTML;
}

export const createViewDetail = (createViewDetail, onClose) => {
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
          <div id="email-body">${extractBodyContent(createViewDetail.body)}</div>                        
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

  /** Handle CDR Files */
  const cdrFiles = createViewDetail?.cdr_files || [];
  if (cdrFiles.length > 0) {
    const downloadContainer = document.createElement("div");
    downloadContainer.style.marginTop = "15px";
    downloadContainer.style.display = "flex";
    downloadContainer.style.flexDirection = "column";
    downloadContainer.style.gap = "10px";

    // Avoid adding duplicate styles
    if (!document.getElementById("cdr-tooltip-style")) {
      const style = document.createElement("style");
      style.id = "cdr-tooltip-style";
      style.textContent = `
        [data-tooltip] {
          position: relative;
        }
        [data-tooltip]:hover:after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 5px 9px;
          border-radius: 4px;
          font-size: 13px;
          white-space: nowrap;
          margin-bottom: 8px;
          z-index: 1000;
          opacity: 0;
          animation: tooltipFade 0.3s ease-in-out forwards;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        @keyframes tooltipFade {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    cdrFiles.forEach((file) => {
      const downloadButton = document.createElement("button");
      downloadButton.textContent = `CDR_${file.file_name}`;
      downloadButton.setAttribute(
        "data-tooltip",
        `Click to download ${file.file_name}`
      );
      downloadButton.style.padding = "8px 16px";
      downloadButton.style.backgroundColor = "#28a745";
      downloadButton.style.color = "#ffffff";
      downloadButton.style.border = "none";
      downloadButton.style.borderRadius = "4px";
      downloadButton.style.cursor = "pointer";
      downloadButton.style.transition = "background-color 0.3s";

      downloadButton.addEventListener("mouseover", () => {
        downloadButton.style.backgroundColor = "#218838";
      });

      downloadButton.addEventListener("mouseout", () => {
        downloadButton.style.backgroundColor = "#28a745";
      });

      downloadButton.addEventListener("click", () => {
        if (file.download_url || file.file_url) {
          const fileName = `CDR_${file.file_name}`;
          chrome.downloads.download({
            url: file.download_url || file.file_url,
            filename: fileName,
            conflictAction: "uniquify",
          });
        } else {
          alert("Download URL is not available.");
        }
      });

      downloadContainer.appendChild(downloadButton);
    });

    document.getElementById("cdr-files-container").appendChild(downloadContainer);
  }

  return popup;
};

