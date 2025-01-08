import { BASEPATH } from "/src/constant/basepath.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { createTable } from "/src/component/table/table.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";

// Load the table HTML component
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
    const headers = ["Name", "Age", "City"];
    table.setHeaders(headers);

    // Set data
    const data = [
      ["John Doe", "25", "New York"],
      ["Jane Smith", "30", "London"],
      ["Bob Johnson", "35", "Paris"],
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
