import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";

const notEmailPageRoutes = [
  {
    componentName: COMPONENTS.HEADER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.HEADER,
  },

  {
    componentName: COMPONENTS.FOOTER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.FOOTER,
  },

  {
    componentName: COMPONENTS.EMAIL_PAGE_NOT_FOUND,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.DATA_OUTPUT,
  },
];

export const loadNotEmailPageComponents = async () => {
  await Promise.all(notEmailPageRoutes.map((config) => loadComponent(config)));
};
