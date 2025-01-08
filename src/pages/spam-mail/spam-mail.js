import { BASEPATH } from "/src/constant/basepath.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { createTable } from "/src/component/table/table.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";

const loadTableComponent = async () => {
  try {
    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    // After loading HTML, initialize the table
    const table = createTable("data-output");

    // Set headers
    const headers = ["Name", "Age", "City", "Status"];
    table.setHeaders(headers);

    // Set data with status chips
    const data = [
      ["John Doe", "25", "New York", { type: "status", value: "safe" }],
      ["Jane Smith", "30", "London", { type: "status", value: "pending" }],
      ["Bob Johnson", "35", "Paris", { type: "status", value: "unsafe" }],
    ];
    table.setData(data);
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  }
};

// Call the function to load the table component
loadTableComponent();
