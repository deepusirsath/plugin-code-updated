import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadComponent({
      componentName: COMPONENTS.HEADER,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.HEADER,
    }),
      await loadComponent({
        componentName: COMPONENTS.SIDEBAR,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.SIDEBAR,
      }),
      await loadComponent({
        componentName: COMPONENTS.FOOTER,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.FOOTER,
      });
    await loadComponent({
      componentName: COMPONENTS.DETAILS,
      basePath: BASEPATH.PAGES,
      targetId: TARGET_ID.DATA_OUTPUT,
    });
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
});
