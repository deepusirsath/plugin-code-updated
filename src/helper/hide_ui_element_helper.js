import { TARGET_ID } from "/src/constant/target_id.js";

export const hideUiElement = () => {
  const dataOutputElement = document.getElementById(TARGET_ID.DATA_OUTPUT);
  if (dataOutputElement) {
    dataOutputElement.innerHTML = "";
  }

  const sidebarElement = document.getElementById(TARGET_ID.SIDEBAR);
  if (sidebarElement) {
    sidebarElement.style.display = "none";
  }

  const headerElement = document.getElementById(TARGET_ID.HEADER);
  if (headerElement) {
    headerElement.style.display = "none";
  }

  const footerElement = document.getElementById(TARGET_ID.FOOTER);
  if (footerElement) {
    footerElement.style.display = "none";
  }
};
