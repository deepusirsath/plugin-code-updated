export function showLoadingScreen() {
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";

  // Professional Dark Glass Background
  Object.assign(loadingScreen.style, {
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.6)", // Same opacity
    backdropFilter: "blur(12px)", // Glass effect
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    zIndex: "2147483647",
    fontFamily: "Segoe UI, sans-serif",
    textAlign: "center",
  });

  // Circular Loader (Professional)
  const loader = document.createElement("div");
  Object.assign(loader.style, {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255, 255, 255, 0.2)", // Light outline
    borderTop: "4px solid #0078d4", // Professional blue color
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  });

  // Loading Text (Minimal & Elegant)
  const loadingText = document.createElement("p");
  loadingText.innerText = "Processing...";
  Object.assign(loadingText.style, {
    marginTop: "15px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#ddd",
  });

  // Subtle Progress Bar
  const progressBar = document.createElement("div");
  Object.assign(progressBar.style, {
    marginTop: "20px",
    width: "120px",
    height: "4px",
    borderRadius: "50px",
    background: "rgba(255, 255, 255, 0.1)", // Light transparency
    position: "relative",
    overflow: "hidden",
  });

  // Animated Fill for Progress Bar
  const progressFill = document.createElement("div");
  Object.assign(progressFill.style, {
    width: "40%",
    height: "100%",
    background: "#0078d4", // Professional blue
    position: "absolute",
    left: "-40%",
    animation: "progressMove 1.5s infinite ease-in-out",
  });

  progressBar.appendChild(progressFill);
  loadingScreen.appendChild(loader);
  loadingScreen.appendChild(loadingText);
  loadingScreen.appendChild(progressBar);
  document.body.appendChild(loadingScreen);

  // Adding keyframes for smooth animations
  const styleSheet = document.styleSheets[0];

  const spinKeyframes = `@keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }`;

  const progressKeyframes = `@keyframes progressMove {
        0% { left: -40%; }
        100% { left: 100%; }
      }`;

  styleSheet.insertRule(spinKeyframes, styleSheet.cssRules.length);
  styleSheet.insertRule(progressKeyframes, styleSheet.cssRules.length);
}
