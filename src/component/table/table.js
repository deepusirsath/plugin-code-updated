export const createTable = () => {
  let totalData = [];
  let filteredData = [];
  let currentPage = 1;
  const rowsPerPage = 5;

  // DOM Elements
  const elements = {
    searchInput: document.getElementById("searchInput"),
    searchButton: document.getElementById("searchButton"),
    clearButton: document.getElementById("clearButton"),
    headerRow: document.getElementById("tableHeader"),
    tableBody: document.getElementById("tableBody"),
    prevButton: document.getElementById("prevPage"),
    nextButton: document.getElementById("nextPage"),
    pageInfo: document.getElementById("pageInfo"),
  };

  const updateSearchResults = () => {
    const searchTerm = elements.searchInput.value.toLowerCase();
    filteredData = totalData.filter((row) =>
      row.some(
        (cell) =>
          typeof cell === "string" && cell.toLowerCase().includes(searchTerm)
      )
    );
    currentPage = 1;
    renderPage();
    
  };

  const clearSearchResults = () => {
    elements.searchInput.value = "";
    filteredData = [];
    currentPage = 1;
    renderPage();
    
  };

  const attachSearchListeners = () => {
    elements.searchButton.addEventListener("click", updateSearchResults);
    elements.clearButton.addEventListener("click", clearSearchResults);
  };

  const renderHeaders = (headers) => {
    elements.headerRow.innerHTML = headers
      .map((header) => `<th>${header}</th>`)
      .join("");
    attachSearchListeners();
  };

  const updatePaginationControls = () => {
    const dataToUse = filteredData.length ? filteredData : totalData;
    const totalPages = Math.ceil(dataToUse.length / rowsPerPage);

    elements.prevButton.disabled = currentPage === 1;
    elements.nextButton.disabled = currentPage === totalPages;
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    elements.prevButton.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    };

    elements.nextButton.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
      }
    };
  };

  const renderData = (data) => {
    elements.tableBody.innerHTML = data
      .map(
        (row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
      )
      .join("");
     

  };

  const renderPage = () => {
    const dataToUse = filteredData.length ? filteredData : totalData;
    const start = (currentPage - 1) * rowsPerPage;
    const pageData = dataToUse.slice(start, start + rowsPerPage);
    renderData(pageData);
    updatePaginationControls();
  };

  const setData = (data) => {
    totalData = data;
    filteredData = [];
    renderPage();
  };

  return {
    setHeaders: renderHeaders,
    setData,
  };
};
