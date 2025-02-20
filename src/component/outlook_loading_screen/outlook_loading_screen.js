/**
 * Displays a full-screen loading screen with a smooth animated wave effect.
 *
 * The loading screen consists of:
 * - A semi-transparent background with a blur effect to indicate processing.
 * - A pulsating wave animation to visualize loading progress.
 * - A status text that updates dynamically during processing.
 * - A warning message prompting the user to keep the tab open.
 *
 * The function executes the following steps:
 * 1. Creates and styles a full-page overlay (`loading-screen`).
 * 2. Adds an animated wave effect to indicate ongoing processing.
 * 3. Displays a status message that changes over time.
 * 4. Shows a warning message advising users not to close the tab.
 * 5. Automatically removes the loading screen after 2 minutes.
 *
 * Notes:
 * - The function ensures a smooth visual experience using CSS animations.
 * - Updates in status text occur at specific intervals.
 * - The screen is removed smoothly with a fade-out effect.
 */
export function showLoadingScreen() {
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";

  Object.assign(loadingScreen.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(120deg, rgba(22, 22, 28, 0.9), rgba(12, 12, 18, 0.9))",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2147483647,
    pointerEvents: "all",
    userSelect: "none",
    cursor: "wait",
  });

  // Main content wrapper
  const contentWrapper = document.createElement("div");
  Object.assign(contentWrapper.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "400px",
    width: "100%",
    gap: "40px",
  });

  // Wave animation container
  const waveContainer = document.createElement("div");
  Object.assign(waveContainer.style, {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    width: "120px",
    height: "50px",
    overflow: "hidden",
  });

  // Generate soft pulsing waves
  for (let i = 0; i < 5; i++) {
    const wave = document.createElement("div");
    Object.assign(wave.style, {
      width: "15px",
      height: "50px",
      margin: "0 3px",
      borderRadius: "8px",
      background: "rgba(150, 150, 255, 0.7)",
      animation: `wavePulse 1.5s ease-in-out infinite ${i * 0.2}s`,
    });
    waveContainer.appendChild(wave);
  }

  // Main container for loading animation
  const mainContainer = document.createElement("div");
  Object.assign(mainContainer.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.03)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
    transform: "scale(0.95)",
    transition: "transform 0.3s ease-in-out",
  });

  // Status text
  const statusText = document.createElement("p");
  statusText.id = "loading-text";
  statusText.innerText = "Processing Email...";
  Object.assign(statusText.style, {
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    fontSize: "16px",
    fontWeight: "500",
    marginTop: "25px",
    opacity: 0.9,
    textAlign: "center",
    letterSpacing: "0.5px",
  });

  // Warning container
  const warningContainer = document.createElement("div");
  Object.assign(warningContainer.style, {
    padding: "15px 25px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    maxWidth: "300px",
  });

  // Warning icon
  const warningIcon = document.createElement("span");
  warningIcon.innerHTML = "⚠️";
  Object.assign(warningIcon.style, {
    fontSize: "14px",
    marginRight: "8px",
  });

  // Warning text
  const warningText = document.createElement("span");
  warningText.innerText = "Please keep this tab open during processing";
  Object.assign(warningText.style, {
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
    fontWeight: "400",
    opacity: 0.8,
  });

  // Keyframe animations
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(
    `@keyframes wavePulse {
      0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
      50% { transform: scaleY(1); opacity: 1; }
    }`,
    styleSheet.cssRules.length
  );

  // Assembly
  mainContainer.appendChild(waveContainer);
  mainContainer.appendChild(statusText);
  warningContainer.appendChild(warningIcon);
  warningContainer.appendChild(warningText);
  contentWrapper.appendChild(mainContainer);
  contentWrapper.appendChild(warningContainer);
  loadingScreen.appendChild(contentWrapper);
  document.body.appendChild(loadingScreen);

  // Animated text updates
  const updates = [
    { delay: 5000, text: "Verifying Security..." },
    { delay: 15000, text: "Completing Analysis..." },
  ];

  updates.forEach(({ delay, text }) => {
    setTimeout(() => {
      const element = document.getElementById("loading-text");
      if (element) {
        element.style.opacity = "0";
        setTimeout(() => {
          element.innerText = text;
          element.style.opacity = "0.9";
        }, 400);
      }
    }, delay);
  });

  // Remove loading screen smoothly
  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => loadingScreen.remove(), 500);
  }, 120000);
}

let isRemovalInProgress = false;
let debounceTimer;

export const hideLoadingScreen = () => {
  // Clear any existing timer
  clearTimeout(debounceTimer);

  // Set new debounce timer
  debounceTimer = setTimeout(() => {
    if (isRemovalInProgress) {
      return;
    }

    const loadingScreen = document.getElementById("loading-screen");

    if (loadingScreen) {
      isRemovalInProgress = true;

      const mainContainer = loadingScreen.querySelector(
        '[style*="background: rgba(255, 255, 255, 0.03)"]'
      );
      const waveContainer = loadingScreen.querySelector(
        '[style*="overflow: hidden"]'
      );
      const loadingText = document.getElementById("loading-text");

      if (waveContainer) {
        waveContainer.style.transition = "opacity 0.3s ease-out";
        waveContainer.style.opacity = "0";
      }

      if (loadingText) {
        loadingText.style.transition = "opacity 0.3s ease-out";
        loadingText.style.opacity = "0";
      }

      if (mainContainer) {
        mainContainer.innerHTML = "";

        const successMark = document.createElement("div");
        Object.assign(successMark.style, {
          width: "60px",
          height: "60px",
          border: "3px solid #4CAF50",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "30px",
          color: "#4CAF50",
          animation: "successScale 0.3s ease-in-out forwards",
        });
        successMark.textContent = "✓";

        const doneText = document.createElement("div");
        Object.assign(doneText.style, {
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontSize: "18px",
          fontWeight: "500",
          marginTop: "15px",
          opacity: "0",
          transition: "opacity 0.3s ease-in-out",
        });
        doneText.textContent = "Done!";

        mainContainer.appendChild(successMark);
        mainContainer.appendChild(doneText);

        setTimeout(() => {
          doneText.style.opacity = "1";
          setTimeout(() => {
            loadingScreen.remove();
            isRemovalInProgress = false;
          }, 1000);
        }, 300);
      }
    } else {
    }
  }, 1000);
};
