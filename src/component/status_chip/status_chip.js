import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

/**
 * Creates a status chip element with the specified status
 * @param {string} status - The status text to display in the chip
 * @returns {HTMLSpanElement} A span element styled as a status chip
 *
 * @example
 * // Creates a status chip with "safe" status
 * const chip = createStatusChip("safe");
 * // Returns: <span class="status-chip safe">safe</span>
 */
export const createStatusChip = (status) => {
  const status_chip = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.STATUS_CHIP}/${COMPONENTS.STATUS_CHIP}`;
  loadCSS(`${status_chip}.css`);
  const chip = document.createElement("span");
  chip.className = `status-chip ${status}`;
  chip.textContent = status;
  return chip;
};
