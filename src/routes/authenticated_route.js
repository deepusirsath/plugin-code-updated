import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";

export const authenticatedRoutes = [
  {
    componentName: COMPONENTS.HEADER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.HEADER,
  },
  {
    componentName: COMPONENTS.SIDEBAR,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.SIDEBAR,
  },
  {
    componentName: COMPONENTS.FOOTER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.FOOTER,
  },
  {
    componentName: COMPONENTS.DETAILS,
    basePath: BASEPATH.PAGES,
    targetId: TARGET_ID.DATA_OUTPUT,
  },
];