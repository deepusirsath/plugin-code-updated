import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

export const createStatusChip = (status) => {
  const status_chip = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.STATUS_CHIP}/${COMPONENTS.STATUS_CHIP}`;

  loadCSS(`${status_chip}.css`);

  const chip = document.createElement("span");
  chip.className = `status-chip ${status}`;
  chip.textContent = status;
  return chip;
};

// Initialize component when loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Status chip component loaded");
});
