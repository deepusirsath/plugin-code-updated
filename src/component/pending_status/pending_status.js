function showPending() {
  // Create the pending container
  const pendingContainer = document.createElement("div");
  pendingContainer.style.position = "fixed";
  pendingContainer.style.top = "50%";
  pendingContainer.style.left = "50%";
  pendingContainer.style.transform = "translate(-50%, -50%)";
  pendingContainer.style.zIndex = "1000";
  pendingContainer.style.width = "400px";
  pendingContainer.style.padding = "30px";
  pendingContainer.style.borderRadius = "12px";
  pendingContainer.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.2)";
  pendingContainer.style.backgroundColor = "#ffffff";
  pendingContainer.style.textAlign = "center";
  pendingContainer.style.fontFamily = "Arial, sans-serif";
  pendingContainer.style.color = "#333";

  // Add a larger spinner
  const spinner = document.createElement("div");
  spinner.style.width = "60px";
  spinner.style.height = "60px";
  spinner.style.border = "6px solid #e0e0e0";
  spinner.style.borderTop = "6px solid #007bff";
  spinner.style.borderRadius = "50%";
  spinner.style.margin = "0 auto 20px";
  spinner.style.animation = "spin 1s linear infinite";

  // Add keyframes for spinner animation
  const styleSheet = document.styleSheets[0];
  const spinnerKeyframes = `@keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }`;
  styleSheet.insertRule(spinnerKeyframes, styleSheet.cssRules.length);

  // Add a larger message
  const message = document.createElement("p");
  message.innerText = "Your mail is under process... Please wait.";
  message.style.margin = "0";
  message.style.fontSize = "18px";
  message.style.fontWeight = "bold";

  // Append elements to the container
  pendingContainer.appendChild(spinner);
  pendingContainer.appendChild(message);
  document.body.appendChild(pendingContainer);

  // Remove the pending container after 5 seconds
  setTimeout(() => {
    if (pendingContainer && pendingContainer.parentNode) {
      document.body.removeChild(pendingContainer);
    }
  }, 5000);
}
