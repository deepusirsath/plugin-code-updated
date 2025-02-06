export const showCustomAlert = (message, type = "success") => {
  const alertDiv = document.createElement("div");
  alertDiv.className = "custom-alert-overlay";

  const successIconSVG = `<svg class="alert-icon success-icon" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`;

  const limitIconSVG = `<svg class="alert-icon limit-icon" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>`;

  const btnColor = type === "success" ? "#4CAF50" : "#ff4757";
  const icon = type === "success" ? successIconSVG : limitIconSVG;
  const buttonText = type === "success" ? "close" : "close";

  alertDiv.innerHTML = `
    <div class="custom-alert-box ${type}">
      ${icon}
      <p>${message}</p>
      <button id="alertOkButton" style="--btnColor: ${btnColor};">
        ${buttonText}
      </button>
    </div>
  `;

  document.body.appendChild(alertDiv);

  const okButton = document.getElementById("alertOkButton");
  okButton.focus();

  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", escHandler);
      closeAlert();
    }
  });

  okButton.addEventListener("click", closeAlert);

  function closeAlert() {
    alertDiv.classList.add("fade-out");
    setTimeout(() => {
      alertDiv.remove();
      if (type === "success") {
        window.close();
      }
    }, 100);
  }
};
