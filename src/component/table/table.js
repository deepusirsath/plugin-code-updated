export const createTable = () => {
  let totalItems = 0;
  let currentPage = 1;
  let hasNext = false;
  let hasPrevious = false;
  const rowsPerPage = 5;
  let onPageChange = null;

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
    const searchTerm = elements.searchInput.value.toLowerCase().trim();

    // Only perform search if searchTerm is not empty
    if (searchTerm) {
      filteredData = totalData.filter((row) =>
        row.some(
          (cell) =>
            typeof cell === "string" && cell.toLowerCase().includes(searchTerm)
        )
      );
      currentPage = 1;
      elements.clearButton.style.display = "inline-block";
      renderPage();
    }
  };

  const clearSearchResults = () => {
    elements.searchInput.value = "";
    filteredData = [];
    currentPage = 1;
    renderPage();

    // Hide clear button and show search button after clearing
    elements.clearButton.style.display = "none";
    elements.searchButton.style.display = "inline-block";
  };

  const attachSearchListeners = () => {
    // Initially hide clear button
    elements.clearButton.style.display = "none";
    elements.searchButton.style.display = "inline-block";
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
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    elements.prevButton.disabled = !hasPrevious;
    elements.nextButton.disabled = !hasNext;
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    elements.prevButton.onclick = () => {
      if (hasPrevious && onPageChange) {
        onPageChange(currentPage - 1);
      }
    };

    elements.nextButton.onclick = () => {
      if (hasNext && onPageChange) {
        onPageChange(currentPage + 1);
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

  const setData = (data, paginationInfo) => {
    if (paginationInfo) {
      totalItems = paginationInfo.totalItems;
      currentPage = paginationInfo.currentPage;
      hasNext = paginationInfo.hasNext;
      hasPrevious = paginationInfo.hasPrevious;
      onPageChange = paginationInfo.onPageChange;
    }
    renderData(data);
    updatePaginationControls();
  };

  const updateData = (data, paginationInfo) => {
    setData(data, paginationInfo);
  };

  return {
    setHeaders: renderHeaders,
    setData,
    updateData,
  };
};
