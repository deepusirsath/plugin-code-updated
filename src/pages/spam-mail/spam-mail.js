import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { createTable } from "/src/component/table/table.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { createViewButton } from "/src/component/view_button/view_button.js";
import { createStatusChip } from "/src/component/status_chip/status_chip.js";
import { createViewDetail } from "/src/component/view_detail/view_detail.js";
import { loadComponent, loadCSS } from "/src/helper/content_loader_helper.js";

const status_chip = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.STATUS_CHIP}/${COMPONENTS.STATUS_CHIP}`;
const view_button = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_BUTTON}/${COMPONENTS.VIEW_BUTTON}`;
const view_detail = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_DETAIL}/${COMPONENTS.VIEW_DETAIL}`;

const data = [
  {
    sender: "john.doe@example.com",
    status: "safe",
    action: "view",
  },
  {
    sender: "jane.smith@example.com",
    status: "pending",
    action: "view",
  },
  {
    sender: "bob@example.com",
    status: "unsafe",
    action: "view",
  },
];

const showPopup = (sender) => {
  createViewDetail(sender, loadSpamMailComponent);
};

const loadSpamMailComponent = async () => {
  try {
    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    loadCSS(`${status_chip}.css`);
    loadCSS(`${view_button}.css`);

    const table = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    table.setHeaders(headers);

    const formattedData = data.map((item) => [
      item.sender,
      createStatusChip(item.status).outerHTML,
      createViewButton(item.sender).outerHTML,
    ]);

    table.setData(formattedData);

    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", () => {
        loadCSS(`${view_detail}.css`);
        showPopup(button.dataset.sender);
      });
    });
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent();
  }
});

loadSpamMailComponent();
