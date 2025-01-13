import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { loadCSS } from "/src/helper/content_loader_helper.js";

export const createViewButton = (sender) => {
  const view_button = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_BUTTON}/${COMPONENTS.VIEW_BUTTON}`;
  loadCSS(`${view_button}.css`);
  const button = document.createElement("button");
  button.className = "view-button";
  button.textContent = "View";
  button.dataset.msg_id = sender;
  return button;
};
