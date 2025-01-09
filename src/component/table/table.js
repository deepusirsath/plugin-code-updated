export const createTable = () => {
  let currentPage = 1;
  const rowsPerPage = 5;
  let totalData = [];
  let filteredData = [];

  // Initialize search functionality
  const initializeSearch = () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const clearButton = document.getElementById("clearButton");

    const performSearch = () => {
      const searchTerm = searchInput.value.toLowerCase();
      filteredData = totalData.filter((row) =>
        row.some(
          (cell) =>
            typeof cell === "string" && cell.toLowerCase().includes(searchTerm)
        )
      );
      currentPage = 1;
      renderPage();
    };

    const clearSearch = () => {
      searchInput.value = "";
      filteredData = [];
      currentPage = 1;
      renderPage();
    };

    searchButton.addEventListener("click", performSearch);
    clearButton.addEventListener("click", clearSearch);
  };

  const setHeaders = (headers) => {
    const headerRow = document.getElementById("tableHeader");
    const headerHTML = `
      <tr>
        ${headers.map((header) => `<th>${header}</th>`).join("")}
      </tr>
    `;
    headerRow.innerHTML = headerHTML;
    initializeSearch();
  };

  const setData = (data) => {
    totalData = data;
    filteredData = [];
    renderPage();
  };

  const updatePaginationControls = () => {
    const dataToUse = filteredData.length > 0 ? filteredData : totalData;
    const totalPages = Math.ceil(dataToUse.length / rowsPerPage);
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevButton.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    };

    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
      }
    };
  };

  const renderPage = () => {
    const dataToUse = filteredData.length > 0 ? filteredData : totalData;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = dataToUse.slice(start, end);
    renderData(pageData);
    updatePaginationControls();
  };

  const renderData = (data) => {
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
