let hideLoadingScreen = null;
Promise.all([
  importComponent(
    "/src/component/outlook_loading_screen/outlook_loading_screen.js"
  ),
]).then(([loadingScreen]) => {
  hideLoadingScreen = loadingScreen.hideLoadingScreen;
});

export function showAlert(key, messageReason = " ") {
  hideLoadingScreen();

  // Check if an alert is already present and remove it
  const existingAlert = document.querySelector(".pending-alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  // Check if the pending alert already exists using a unique class
  if (key === "pending") {
    const pendingAlert = document.querySelector(".pending-alert");
    if (pendingAlert) {
      return;
    }
  }

  // Detect the email platform
  const GmailElements = document.getElementsByClassName("nH a98 iY");
  const OutlookElement = document.querySelector(
    "#ConversationReadingPaneContainer"
  );
  const OutlookjunkBox = document.querySelector("#ItemReadingPaneContainer");
  const Yahooelement = document.querySelector(
    'div[data-test-id="message-group-view-scroller"]'
  );

  // If no supported email platform is found, exit
  if (
    !(GmailElements.length || OutlookElement || OutlookjunkBox || Yahooelement)
  ) {
    return;
  }

  const isOutlook = window.location.href.includes("outlook");
  const isYahoo = window.location.href.includes("yahoo");
  const isGmail = window.location.href.includes("mail.google");

  // Create the alert container
  const alertContainer = document.createElement("div");
  alertContainer.classList.add("pending-alert"); // Add a unique class
  alertContainer.style.position = "fixed";
  alertContainer.style.top = "50%";
  alertContainer.style.left = "50%";
  alertContainer.style.transform = "translate(-50%, -50%)";
  alertContainer.style.zIndex = "1000";
  alertContainer.style.width = "360px";
  alertContainer.style.padding = "20px";
  alertContainer.style.borderRadius = "12px";
  alertContainer.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.3)";
  alertContainer.style.display = "flex";
  alertContainer.style.flexDirection = "column";
  alertContainer.style.alignItems = "center";
  alertContainer.style.backgroundColor = "#fff";

  // Create the message and button
  const message = document.createElement("p");
  message.style.margin = "10px 0 15px";
  message.style.fontSize = "18px";
  message.style.textAlign = "center";

  const button = document.createElement("button");
  button.innerText = "Close";

  Object.assign(button.style, {
    padding: "8px 20px",
    border: "1px solid #4C9ED9",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "#4C9ED9",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxShadow: "0 1px 2px rgba(76, 158, 217, 0.15)",
  });

  button.addEventListener("mouseover", () => {
    Object.assign(button.style, {
      backgroundColor: "#3989c2",
      transform: "translateY(-1px)",
    });
  });

  button.addEventListener("mouseout", () => {
    Object.assign(button.style, {
      backgroundColor: "#4C9ED9",
      transform: "translateY(0)",
    });
  });

  let iconHtml = "";
  switch (key) {
    case "safe":
      message.innerText = "Security verification complete - Safe to proceed";
      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #f8fff8)";
      alertContainer.style.border = "1px solid rgba(40, 167, 69, 0.2)";
      alertContainer.style.borderLeft = "6px solid #28a745";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(40, 167, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
      alertContainer.style.borderRadius = "8px";

      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
        <defs>
            <filter id="shadow-success">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#28a745" flood-opacity="0.25"/>
            </filter>
        </defs>
        <path d="M24 4 L42 12 V24 C42 34 34 41 24 44 C14 41 6 34 6 24 V12 L24 4Z"
              fill="none"
              stroke="#28a745"
              stroke-width="2.5"
              filter="url(#shadow-success)">
            <animate attributeName="stroke-dasharray"
                     values="0,150;150,0"
                     dur="2s"
                     repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity"
                     values="0.6;1;0.6"
                     dur="2s"
                     repeatCount="indefinite"/>
        </path>
        <path d="M16 24 L22 30 L32 18"
              stroke="#28a745"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round">
            <animate attributeName="stroke-dasharray"
                     values="0,40;40,0"
                     dur="1.5s"
                     repeatCount="indefinite"/>
            <animate attributeName="stroke-width"
                     values="2.5;3;2.5"
                     dur="1.5s"
                     repeatCount="indefinite"/>
        </path>
    </svg>`;
      break;

    case "unsafe":
      const reasonText = String(messageReason || "");
      const reasonParts = reasonText.includes(":")
        ? reasonText.split(":")
        : ["", "", ""];
      const headerChecks = reasonParts[2]?.includes(",")
        ? reasonParts[2].split(",").map((item) => item.trim())
        : [];

      message.innerHTML = `
    <div style="font-family: 'Segoe UI', sans-serif; text-align: center;">
        <div style="font-size: 16px; color: #333; font-weight: bolder">
            Security Notice: This email has been identified as unsafe.
        </div>
        <hr style="border: 0; height: 1px; background: #e0e0e0; margin: 8px 0;"/>
        <div style="color: #dc3545; font-size: 16px;">
            ${
              headerChecks.length > 0
                ? `
                <ul style="margin: 0 auto; padding: 0; list-style-type: none; text-align: center; display: inline-block;">
                    ${headerChecks
                      .map(
                        (check) => `
                        <li style="margin-bottom: 2px; line-height: 1.2; text-align: left;">
                            <span style="display: inline-block; width: 1em; margin-right: 0.5em;">•</span>${check}
                        </li>
                    `
                      )
                      .join("")}
                </ul>
            `
                : reasonText
            }
        </div>
    </div>`;

      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #fafafa)";
      alertContainer.style.border = "1px solid rgba(220, 53, 69, 0.2)";
      alertContainer.style.borderLeft = "6px solid #dc3545";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(220, 53, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
      alertContainer.style.borderRadius = "8px";

      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
    <defs>
        <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#dc3545" flood-opacity="0.25"/>
        </filter>
    </defs>
    <path d="M24 4 L42 12 V24 C42 34 34 41 24 44 C14 41 6 34 6 24 V12 L24 4Z"
          fill="none"
          stroke="#dc3545"
          stroke-width="2.5"
          filter="url(#shadow)">
        <animate attributeName="stroke-dasharray"
                 values="0,150;150,0"
                 dur="2s"
                 repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity"
                 values="0.6;1;0.6"
                 dur="2s"
                 repeatCount="indefinite"/>
    </path>
    <g transform="translate(24,24)">
        <line x1="0" y1="-10" x2="0" y2="4"
              stroke="#dc3545"
              stroke-width="3"
              stroke-linecap="round">
            <animate attributeName="opacity"
                     values="0.7;1;0.7"
                     dur="1.5s"
                     repeatCount="indefinite"/>
            <animate attributeName="stroke-width"
                     values="2.5;3;2.5"
                     dur="1.5s"
                     repeatCount="indefinite"/>
        </line>
        <circle cx="0" cy="8" r="2.2"
                fill="#dc3545">
            <animate attributeName="r"
                     values="2;2.4;2"
                     dur="1.5s"
                     repeatCount="indefinite"/>
            <animate attributeName="opacity"
                     values="0.7;1;0.7"
                     dur="1.5s"
                     repeatCount="indefinite"/>
        </circle>
        </g>
      </svg>`;
      break;

    case "inform":
      message.innerText =
        "System maintenance in progress, please refresh the page after some time";

      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #fff8f0)";
      alertContainer.style.border = "1px solid rgba(255, 153, 0, 0.2)";
      alertContainer.style.borderLeft = "6px solid #ff9900";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(255, 153, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
      alertContainer.style.borderRadius = "8px";

      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
            <defs>
                <filter id="shadow-warning">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#ff9900" flood-opacity="0.25"/>
                </filter>
            </defs>
            <circle cx="24" cy="24" r="20"
                    stroke="#ff9900"
                    stroke-width="2.5"
                    fill="none"
                    stroke-dasharray="31.4 31.4"
                    filter="url(#shadow-warning)">
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 24 24"
                    to="360 24 24"
                    dur="3s"
                    repeatCount="indefinite"/>
            </circle>
            <circle cx="24" cy="24" r="15"
                    stroke="#ff9900"
                    stroke-width="2.5"
                    fill="none"
                    stroke-dasharray="23.5 23.5"
                    filter="url(#shadow-warning)">
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="360 24 24"
                    to="0 24 24"
                    dur="2s"
                    repeatCount="indefinite"/>
            </circle>
            <circle cx="24" cy="24" r="4"
                    fill="#ff9900">
                <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="1s"
                    repeatCount="indefinite"/>
                <animate
                    attributeName="fill-opacity"
                    values="0.7;1;0.7"
                    dur="1s"
                    repeatCount="indefinite"/>
            </circle>
        </svg>`;
      break;

    case "pending":
      // Dynamic message based on the messageReason parameter
      let waitTime = "a moment";
      let sizeInfo = "";

      switch (messageReason) {
        case "underTwo":
          waitTime = "approximately 10-15 seconds";
          sizeInfo = "Email size is under 2 MB";
          break;
        case "underTen":
          waitTime = "approximately 30-45 seconds";
          sizeInfo = "Email size is between 2-10 MB";
          break;
        case "underTwenty":
          waitTime = "approximately 1-2 minutes";
          sizeInfo = "Email size is between 10-20 MB";
          break;
        case "overTwenty":
          waitTime = "approximately 2-3 minutes";
          sizeInfo = "Email size is over 20 MB";
          break;
        default:
          waitTime = "some time";
          sizeInfo = "";
      }

      message.innerHTML = `
          <div style="font-family: 'Segoe UI', sans-serif; text-align: center;">
            <div style="font-size: 16px; color: #0056b3; font-weight: bold; margin-bottom: 8px;">
              AI Security Analysis in Progress
            </div>
            <div style="color: #333; font-size: 14px; line-height: 1.4;">
              Please wait ${waitTime} while our AI analyzes this email for security threats.
            </div>
          </div>`;

      alertContainer.style.background =
        "linear-gradient(145deg, #ffffff, #f0f8ff)";
      alertContainer.style.border = "1px solid rgba(0, 123, 255, 0.15)";
      alertContainer.style.borderLeft = "6px solid #007bff";
      alertContainer.style.boxShadow =
        "0 8px 20px rgba(0, 123, 255, 0.06), 0 4px 8px rgba(0, 0, 0, 0.08)";
      alertContainer.style.borderRadius = "12px";

      // Timer-style animation with progress indicator
      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
          <defs>
            <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#007bff;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0056b3;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- Outer circle -->
          <circle cx="24" cy="24" r="22" fill="none" stroke="#e6f0ff" stroke-width="4" />
          
          <!-- Progress circle -->
          <circle cx="24" cy="24" r="22" 
                  fill="none" 
                  stroke="url(#pendingGradient)" 
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-dasharray="138.2"
                  stroke-dashoffset="138.2">
            <animate attributeName="stroke-dashoffset"
                     values="138.2;0"
                     dur="${
                       messageReason === "underTwo"
                         ? "15s"
                         : messageReason === "underTen"
                         ? "45s"
                         : messageReason === "underTwenty"
                         ? "120s"
                         : messageReason === "overTwenty"
                         ? "180s"
                         : "60s"
                     }"
                     repeatCount="1"
                     fill="freeze"
                     calcMode="linear" />
          </circle>
          
          <!-- Center timer display -->
          <g transform="translate(24, 24)">
            <!-- Hourglass shape -->
            <path d="M-8,-8 L8,-8 L8,-7 L0,0 L8,7 L8,8 L-8,8 L-8,7 L0,0 L-8,-7 Z" 
                  fill="url(#pendingGradient)" 
                  opacity="0.9">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 0 0"
                to="180 0 0"
                dur="2s"
                repeatCount="indefinite" />
            </path>
            
            <!-- Flowing sand particles -->
            <circle cx="0" cy="0" r="1" fill="#007bff">
              <animate attributeName="cy" values="-3;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="-1" cy="-2" r="0.7" fill="#007bff">
              <animate attributeName="cy" values="-4;4" dur="2s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="2s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="1" cy="-1" r="0.7" fill="#007bff">
              <animate attributeName="cy" values="-4;4" dur="2s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>`;
      break;
      
    case "badRequest":
      message.innerText =
        "An error occurred while processing your request. Multiple attempts failed. Check your input and retry. If the problem continues, contact support.";

      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #f8f0ff)";
      alertContainer.style.border = "1px solid rgba(128, 0, 128, 0.2)";
      alertContainer.style.borderLeft = "6px solid #800080";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(128, 0, 128, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
      alertContainer.style.borderRadius = "8px";

      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
          <defs>
            <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#800080;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#4B0082;stop-opacity:0.8" />
            </linearGradient>
          </defs>
          <g transform="translate(4, 4)">
            <!-- Loading Bar Background -->
            <rect x="4" y="18" width="40" height="8" rx="4" fill="#ddd" />
      
            <!-- Loading Bar -->
            <rect x="4" y="18" width="0" height="8" rx="4" fill="url(#loadingGradient)">
              <animate attributeName="width" values="0;40;0" dur="2s" repeatCount="3" />
              <animate attributeName="fill" values="url(#loadingGradient); #dc3545" dur="6s" fill="freeze" />
            </rect>
          </g>
        </svg>`;
      break;

    case "networkError":
      message.innerText =
        "Network issue. Please try reloading the page or checking your connection.";
      alertContainer.style.width = "360px";
      alertContainer.style.padding = "24px";
      alertContainer.style.background =
        "linear-gradient(135deg, #ffffff, #f5f5f5)";
      alertContainer.style.border = "1px solid rgba(108, 117, 125, 0.2)";
      alertContainer.style.borderLeft = "6px solid #6c757d";
      alertContainer.style.boxShadow =
        "0 6px 16px rgba(108, 117, 125, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)";
      alertContainer.style.borderRadius = "8px";

      iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
          <defs>
            <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6c757d;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#495057;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow-network">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#6c757d" flood-opacity="0.15"/>
            </filter>
          </defs>
          
          <!-- Simplified Wi-Fi Signal with Connection Issues -->
          <g filter="url(#shadow-network)" transform="translate(24,32)">
            <!-- Signal arcs with staggered animation -->
            <path d="M-16,0 A16,16 0 0 1 16,0" fill="none" stroke="url(#networkGradient)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 100" opacity="0.7">
              <animate attributeName="stroke-dasharray" values="0 100;50 50;0 100" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M-12,6 A12,12 0 0 1 12,6" fill="none" stroke="url(#networkGradient)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 100" opacity="0.7">
              <animate attributeName="stroke-dasharray" values="0 100;50 50;0 100" dur="2s" begin="0.2s" repeatCount="indefinite"/>
            </path>
            <path d="M-8,12 A8,8 0 0 1 8,12" fill="none" stroke="url(#networkGradient)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 100" opacity="0.7">
              <animate attributeName="stroke-dasharray" values="0 100;50 50;0 100" dur="2s" begin="0.4s" repeatCount="indefinite"/>
            </path>
            
            <!-- Connection dot with pulsing animation -->
            <circle cx="0" cy="18" r="3" fill="#e74c3c">
              <animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="fill-opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Brief connection lines that appear/disappear -->
            <line x1="-4" y1="18" x2="4" y2="18" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-dasharray="8 0">
              <animate attributeName="stroke-dasharray" values="0 8;8 0;0 8" dur="3s" repeatCount="indefinite"/>
            </line>
          </g>
        </svg>`;
      break;
    default:
      return;
  }

  const iconContainer = document.createElement("div");
  iconContainer.innerHTML = iconHtml;
  iconContainer.style.marginBottom = "15px";

  alertContainer.appendChild(iconContainer);
  alertContainer.appendChild(message);
  alertContainer.appendChild(button);
  document.body.appendChild(alertContainer);

  const removeAlert = () => {
    if (alertContainer && alertContainer.parentNode) {
      document.body.removeChild(alertContainer);
      document.removeEventListener("click", dismissOnOutsideClick);
      window.removeEventListener("keydown", handleEnterKey);
    }
  };

  const handleEnterKey = (event) => {
    if (event.key === "Enter") {
      removeAlert();
    }
  };

  window.addEventListener("keydown", handleEnterKey);

  const dismissOnOutsideClick = (event) => {
    if (!alertContainer.contains(event.target)) {
      removeAlert();
    }
  };

  document.addEventListener("click", dismissOnOutsideClick, true);
  button.addEventListener("click", removeAlert);

  // Platform-specific logic
  if (isYahoo) {
    const observer = new MutationObserver(() => {
      const elements = document.querySelector(
        'div[data-test-id="message-group-view-scroller"]'
      );
      if (!elements || elements.length === 0) {
        if (alertContainer && alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else if (isGmail) {
    const observer = new MutationObserver(() => {
      const elements = document.getElementsByClassName("nH a98 iY");
      if (!elements || elements.length === 0) {
        if (alertContainer && alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else if (isOutlook) {
    let currentUrl = window.location.href;

    const urlObserver = new MutationObserver(() => {
      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        const alertContainer = document.querySelector(
          'div[style*="position: fixed"][style*="top: 50%"]'
        );
        if (alertContainer) {
          alertContainer.remove();
        }
      }
    });
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}
