export const createViewDetail = (sender, onClose) => {
  console.log("createViewDetail called", sender);
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h3>Email Details</h3>
        <button class="close-popup">×</button>
      </div>
      <div class="popup-body">
        <div class="detail-row">
          <label>Sender:</label>
          <span id="sender-email"></span>
        </div>
        <div class="detail-row">
          <label>Subject:</label>
          <span id="email-subject"></span>
        </div>
        <div class="detail-row">
          <label>Body:</label>
          <div id="email-body"></div>
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
