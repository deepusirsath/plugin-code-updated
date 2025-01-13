import { loadComponent } from "/src/helper/content_loader_helper.js";
import { COMPONENTS } from "/src/constant/component.js";
import { BASEPATH } from "/src/constant/basepath.js";
import { TARGET_ID } from "/src/constant/target_id.js";

export const showLoader = () => {
  loadComponent({
    componentName: COMPONENTS.LOADER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.LOADER_CONTAINER,
  });
};

export const hideLoader = () => {
  document.getElementById(TARGET_ID.LOADER_CONTAINER).innerHTML = "";
};
