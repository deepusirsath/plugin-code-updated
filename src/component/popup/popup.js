import {
  loadHTMLContent,
  loadScript,
} from "/src/helper/content_loader_helper.js";
import { COMPONENTS } from "/src/constant/constant.js";

const loadComponent = async (componentName) => {
  const fileName = `/src/component/${componentName}/${componentName}`;
  const htmlContent = await loadHTMLContent(`${fileName}.html`);
  document.getElementById(`${componentName}-container`).innerHTML = htmlContent;
  loadScript(`${fileName}.js`);
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([
      loadComponent(COMPONENTS.HEADER),
      loadComponent(COMPONENTS.SIDEBAR),
      loadComponent(COMPONENTS.FOOTER),
    ]);
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
});
