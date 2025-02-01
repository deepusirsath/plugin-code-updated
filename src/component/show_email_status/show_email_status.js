chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showAlert") {
      const { status, reason } = request;
      const alertContainer = document.createElement("div");
      alertContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;
  
      const alerts = {
        safe: { message: "This email has been verified as safe", color: "#4CAF50" },
        unsafe: { message: `This email has been marked as unsafe.\nReason: ${reason}`, color: "#f44336" },
        pending: { message: "Email verification in progress...", color: "#ff9800" },
        inform: { message: "Unable to verify email. Please try again later.", color: "#2196F3" }
      };
  
      const alert = alerts[status];
      alertContainer.style.backgroundColor = alert.color;
      alertContainer.style.color = "white";
      alertContainer.textContent = alert.message;
      document.body.appendChild(alertContainer);
    }
  });
  