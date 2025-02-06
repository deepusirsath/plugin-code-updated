// Constants
const POPUP_DISPLAY_TIME = 2000;
const POPUP_MESSAGE =
  "This email content is currently blocked for your security";

// Styles
const popupStyles = `
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

const fadeAnimation = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

/**
 * Adds a fade animation to the document's first stylesheet
 * Injects the fadeAnimation keyframes rule that controls opacity transitions
 * from 0% to 100% over 2 seconds
 *
 * The animation sequence:
 * - Starts invisible (opacity 0)
 * - Fades in to full opacity at 15%
 * - Maintains full opacity until 85%
 * - Fades out to invisible at 100%
 *
 * @function addFadeAnimation
 * @returns {void}
 */
const addFadeAnimation = () => {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(fadeAnimation, styleSheet.cssRules.length);
};

/**
 * Creates and configures a popup element for displaying security block messages
 *
 * Creates a new div element with:
 * - Styles from popupStyles constant including positioning and appearance
 * - Security block message text from POPUP_MESSAGE constant
 * - Fade animation applied via CSS
 *
 * @function createPopupElement
 * @returns {HTMLDivElement} Configured popup div element ready to be added to DOM
 */
const createPopupElement = () => {
  const popup = document.createElement("div");
  popup.style.cssText = popupStyles;
  popup.textContent = POPUP_MESSAGE;
  return popup;
};

/**
 * Displays a temporary security block notification popup
 *
 * The function:
 * 1. Adds the fade animation to document styles
 * 2. Creates and configures the popup element
 * 3. Appends popup to document body
 * 4. Removes popup after POPUP_DISPLAY_TIME (2000ms)
 *
 * The popup appears with a fade-in animation, displays the security
 * message, then fades out and is removed from the DOM.
 *
 * @function showBlockedPopup
 * @returns {void}
 */
export const showBlockedPopup = () => {
  addFadeAnimation();
  const popup = createPopupElement();
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, POPUP_DISPLAY_TIME);
};
