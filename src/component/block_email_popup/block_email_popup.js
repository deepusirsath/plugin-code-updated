// Function to show the blocked popup
export function showBlockedPopup() {
  const popup = document.createElement("div");
  popup.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        animation: fadeInOut 2s forwards;
      `;

  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(
    `
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `,
    styleSheet.cssRules.length
  );

  popup.textContent =
    "This email content is currently blocked for your security";
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 2000);
}
