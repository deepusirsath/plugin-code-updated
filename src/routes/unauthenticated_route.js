import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";

export const UnauthenticatedRoute = [
  {
    componentName: COMPONENTS.HEADER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.HEADER,
  },
  {
    componentName: COMPONENTS.REGISTRATION,
    basePath: BASEPATH.PAGES,
    targetId: TARGET_ID.DATA_OUTPUT,
  },
  {
    componentName: COMPONENTS.FOOTER,
    basePath: BASEPATH.COMPONENT,
    targetId: TARGET_ID.FOOTER,
  },
];
