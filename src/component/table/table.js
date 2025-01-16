export const createTable = () => {
  let totalItems = 0;
  let currentPage = 1;
  let hasNext = false;
  let hasPrevious = false;
  let onSearch = null;
  let onPageChange = null;
  const rowsPerPage = 5;

  // DOM Elements
  const elements = {
    searchInput: document.getElementById("search-input"),
    searchButton: document.getElementById("searchButton"),
    clearButton: document.getElementById("clearButton"),
    headerRow: document.getElementById("tableHeader"),
    tableBody: document.getElementById("tableBody"),
    prevButton: document.getElementById("prevPage"),
    nextButton: document.getElementById("nextPage"),
    pageInfo: document.getElementById("pageInfo"),
  };

  // Initially hide clear button
  elements.clearButton.style.display = "none";

  // Search button click handler
  elements.searchButton.addEventListener("click", () => {
    const searchQuery = elements.searchInput.value.trim();
    onSearch(searchQuery);
  });

  // Clear button click handler
  elements.clearButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.clearButton.style.display = "none";
    if (onPageChange) {
      onPageChange(1, ""); 
    }
  });

  const renderHeaders = (headers) => {
    elements.headerRow.innerHTML = headers
      .map((header) => `<th>${header}</th>`)
      .join("");
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
      onSearch = paginationInfo.onSearch;
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
