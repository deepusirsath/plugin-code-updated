export function showLoadingScreen() {
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";

  Object.assign(loadingScreen.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(120deg, rgba(22, 22, 28, 0.9), rgba(12, 12, 18, 0.9))",
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
    gap: "40px"
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

export const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen && loadingScreen.parentNode) {
    // Get the main container
    const mainContainer = loadingScreen.querySelector('[style*="background: rgba(255, 255, 255, 0.03)"]');
    const waveContainer = loadingScreen.querySelector('[style*="overflow: hidden"]');
    const loadingText = document.getElementById('loading-text');
    
    // Fade out waves and text
    waveContainer.style.transition = 'opacity 0.3s ease-out';
    waveContainer.style.opacity = '0';
    loadingText.style.opacity = '0';
    
    // Create success checkmark animation
    const successMark = document.createElement('div');
    Object.assign(successMark.style, {
      width: '60px',
      height: '60px',
      border: '3px solid #4CAF50',
      borderRadius: '50%',
      position: 'relative',
      animation: 'successScale 0.3s ease-in-out forwards'
    });

    // Add checkmark inside circle
    const check = document.createElement('div');
    Object.assign(check.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '30px',
      color: '#4CAF50'
    });
    check.textContent = '✓';

    // Add "Done!" text
    const doneText = document.createElement('div');
    Object.assign(doneText.style, {
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: '500',
      marginTop: '15px',
      opacity: '0',
      animation: 'fadeIn 0.3s ease-out 0.2s forwards'
    });
    doneText.textContent = 'Done!';

    // Add keyframes
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
      @keyframes successScale {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `, styleSheet.cssRules.length);
    
    styleSheet.insertRule(`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `, styleSheet.cssRules.length);

    // Replace content
    setTimeout(() => {
      mainContainer.innerHTML = '';
      successMark.appendChild(check);
      mainContainer.appendChild(successMark);
      mainContainer.appendChild(doneText);
      
      // Final fade out and remove
      setTimeout(() => {
        loadingScreen.style.transition = 'opacity 0.5s ease-out';
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 500);
      }, 1000);
    }, 300);
  }
};
