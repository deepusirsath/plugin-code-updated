export const createTable = () => {

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
                ${row.map((cell) => `<td>${cell}</td>`).join("")}
            </tr>
        `
      )
      .join("");
    tableBody.innerHTML = rowsHTML;
  };

  return {
    setHeaders,
    setData,
  };
};
