import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

function extractBodyContent(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove the footer inside the email body
  const footer = doc.querySelector('.footer');
  if (footer) {
      footer.remove();
  }

  // Disable all anchor tags inside the parsed HTML
  const anchorTags = doc.querySelectorAll('a');
  anchorTags.forEach(anchor => {
      anchor.style.pointerEvents = 'none'; // Disable clicking
      anchor.style.color = 'gray'; // Optional: Change color to indicate disabled state
      anchor.removeAttribute('href'); // Optional: Remove href attribute
  });

  return doc.body.innerHTML; // Return the modified body content
}



// function extractBodyContent(htmlString) {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(htmlString, 'text/html');

//   // Remove the footer inside the email body
//   const footer = doc.querySelector('.footer');
//   if (footer) {
//       footer.remove();
//   }

//   return doc.body.innerHTML; // Return only the cleaned body content
// }

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
      </div>
    </div>
  `;

  popup.querySelector(".close-popup").addEventListener("click", () => {
    popup.remove();
    onClose();
  });

  document.body.appendChild(popup);
  return popup;
};
