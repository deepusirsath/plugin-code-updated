import { createChip } from "../status_chip/status_chip.js";

export const createTable = () => {
  const chip = createChip();

  const setHeaders = (headers) => {
    const headerRow = document.getElementById("tableHeader");
    const headerHTML = `
            <tr>
                ${headers.map((header) => `<th>${header}</th>`).join("")}
            </tr>
        `;
    headerRow.innerHTML = headerHTML;
  };

  const setData = (data) => {
    const tableBody = document.getElementById("tableBody");
    const rowsHTML = data
      .map(
        (row) => `
            <tr>
                ${row
                  .map((cell) => {
                    if (typeof cell === "object" && cell.type === "status") {
                      return `<td><div id="status-chip" class="chip">${cell.value}</div></td>`;
                    }
                    return `<td>${cell}</td>`;
                  })
                  .join("")}
            </tr>
        `
      )
      .join("");
    tableBody.innerHTML = rowsHTML;

    // Initialize status chips after rendering
    data.forEach((row) => {
      row.forEach((cell) => {
        if (typeof cell === "object" && cell.type === "status") {
          chip.render(cell.value);
        }
      });
    });
  };

  return {
    setHeaders,
    setData,
  };
};
