// Function to show the alert to the user
export function showAlert(key, messageReason = " ") {
    // Create the alert container
    const alertContainer = document.createElement("div");
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
          
          <!-- Shield outline with pulsing effect -->
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
          
          <!-- Checkmark with dynamic animation -->
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
        message.innerHTML = `
      <div style="font-family: 'Segoe UI', sans-serif;">
          <div style="font-size: 16px; color: #333;font-weight : bolder">
              Security Notice: This email has been identified as unsafe.
          </div>
          <hr style="border: 0; height: 1px; background: #e0e0e0; margin: 8px 0;"/>
          <div style="color: #dc3545; font-size: 16px; font-weight : bold">${messageReason}</div>
      </div>`;
  
        alertContainer.style.width = "360px"; // Slightly wider for better text flow
        alertContainer.style.padding = "24px"; // Increased padding
        alertContainer.style.background =
          "linear-gradient(135deg, #ffffff, #fafafa)"; // Diagonal gradient
        alertContainer.style.border = "1px solid rgba(220, 53, 69, 0.2)"; // Subtle border all around
        alertContainer.style.borderLeft = "6px solid #dc3545"; // Thicker left border
        alertContainer.style.boxShadow =
          "0 6px 16px rgba(220, 53, 69, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12)"; // Multi-layered shadow
        alertContainer.style.borderRadius = "8px"; // Increased border radius
  
        // Enhanced SVG with more dynamic animations
        iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
      <defs>
          <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#dc3545" flood-opacity="0.25"/>
          </filter>
      </defs>
      
      <!-- Shield outline with pulsing effect -->
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
      
      <!-- Enhanced alert mark -->
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
          "System maintenance in progress - Your security is our priority";
  
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
              
              <!-- Outer rotating circle -->
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
      
              <!-- Inner rotating circle -->
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
      
              <!-- Center pulsing dot -->
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
        message.innerText =
          "We're processing your request.... Please wait for the procedure to be finished.";
  
        alertContainer.style.background =
          "linear-gradient(145deg, #ffffff, #f0f8ff)";
        alertContainer.style.border = "1px solid rgba(0, 123, 255, 0.15)";
        alertContainer.style.borderLeft = "6px solid #007bff";
        alertContainer.style.boxShadow =
          "0 8px 20px rgba(0, 123, 255, 0.06), 0 4px 8px rgba(0, 0, 0, 0.08)";
        alertContainer.style.borderRadius = "12px";
  
        iconHtml = `<svg width="52" height="52" viewBox="0 0 48 48">
              <defs>
                  <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#007bff;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#0056b3;stop-opacity:1" />
                  </linearGradient>
              </defs>
              
              <!-- Outer rotating circle -->
              <circle cx="24" cy="24" r="20" 
                      stroke="url(#pendingGradient)" 
                      stroke-width="3" 
                      fill="none" 
                      stroke-dasharray="31.4 31.4">
                  <animateTransform 
                      attributeName="transform"
                      type="rotate"
                      from="0 24 24"
                      to="360 24 24"
                      dur="2.5s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"/>
              </circle>
              
              <!-- Inner pulsing dots -->
              <g fill="#007bff">
                  <circle cx="24" cy="24" r="2">
                      <animate attributeName="opacity"
                          values="0.3;1;0.3" dur="1.5s"
                          repeatCount="indefinite" begin="0s"/>
                  </circle>
                  <circle cx="32" cy="24" r="2">
                      <animate attributeName="opacity"
                          values="0.3;1;0.3" dur="1.5s"
                          repeatCount="indefinite" begin="0.5s"/>
                  </circle>
                  <circle cx="16" cy="24" r="2">
                      <animate attributeName="opacity"
                          values="0.3;1;0.3" dur="1.5s"
                          repeatCount="indefinite" begin="1s"/>
                  </circle>
              </g>
          </svg>`;
        break;
      default:
        console.log("Invalid key for showAlert");
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
  
    const observer = new MutationObserver(() => {
      const elements = document.getElementsByClassName("nH a98 iY");
      if (!elements || elements.length === 0) {
        if (alertContainer && alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
        observer.disconnect();
      }
    });
  
    // Start observing the document for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  
    document.addEventListener("click", dismissOnOutsideClick, true);
    button.addEventListener("click", removeAlert);
  }
