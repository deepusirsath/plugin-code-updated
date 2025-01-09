import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { createTable } from "/src/component/table/table.js";
import { loadComponent, loadCSS } from "/src/helper/content_loader_helper.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { createStatusChip } from "/src/component/status_chip/status_chip.js";

const status_chip = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.STATUS_CHIP}/${COMPONENTS.STATUS_CHIP}`;

const loadSpamMailComponent = async () => {
  try {
    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    loadCSS(`${status_chip}.css`);

    const table = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    table.setHeaders(headers);

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

    const formattedData = data.map((item) => [
      item.sender,
      createStatusChip(item.status).outerHTML,
      `<button class="view-btn">View</button>`,
    ]);

    table.setData(formattedData);
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
};

// Add event listener for when this component is loaded
document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent();
  }
});

// Call the function to load the table component
loadSpamMailComponent();
