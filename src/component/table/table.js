/**
 * Creates and manages a paginated table component with search functionality
 *
 * @returns {Object} Table control methods
 * - setHeaders: Function to set table column headers
 * - setData: Function to set table data and pagination info
 * - updateData: Function to update table data and pagination state
 *
 * The table features:
 * - Pagination controls (prev/next) with page info
 * - Configurable rows per page (default 5)
 * - Search functionality
 * - Dynamic header and data rendering
 *
 * Usage:
 * const table = createTable();
 * table.setHeaders(['Col1', 'Col2']);
 * table.setData(tableData, {
 *   totalItems: 100,
 *   currentPage: 1,
 *   hasNext: true,
 *   hasPrevious: false,
 *   onPageChange: (page) => {...},
 *   onSearch: (term) => {...}
 * });
 *
 * Required DOM elements with IDs:
 * - search-input: Search input field
 * - searchButton: Search trigger button
 * - clearButton: Clear search button
 * - tableHeader: Table header row
 * - tableBody: Table body container
 * - prevPage: Previous page button
 * - nextPage: Next page button
 * - pageInfo: Pagination info display
 */
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

  /**
   * Renders the table headers by mapping each header text to a <th> element
   *
   * @param {string[]} headers - Array of header text strings to display
   *
   * Example:
   * renderHeaders(['Name', 'Email', 'Status'])
   * // Generates: <th>Name</th><th>Email</th><th>Status</th>
   *
   * The function:
   * - Takes an array of header strings
   * - Maps each string to a <th> element
   * - Joins them into a single HTML string
   * - Sets the innerHTML of the headerRow element
   */
  const renderHeaders = (headers) => {
    elements.headerRow.innerHTML = headers
      .map((header) => `<th>${header}</th>`)
      .join("");
  };

  /**
   * Updates the pagination controls state and event handlers
   *
   * This function manages:
   * - Calculation of total pages based on items and page size
   * - Previous/Next button enabled/disabled states
   * - Page information display (current page / total pages)
   * - Click handlers for pagination navigation
   *
   * State management:
   * - Disables prev button when on first page
   * - Disables next button when on last page
   * - Updates page counter display
   *
   * Event handling:
   * - Prev button: Decrements page when available
   * - Next button: Increments page when available
   * - Triggers onPageChange callback with new page number
   *
   * Dependencies:
   * - totalItems: Total number of items in dataset
   * - rowsPerPage: Number of items per page
   * - currentPage: Current active page number
   * - hasNext/hasPrevious: Pagination boundary flags
   * - onPageChange: Callback for page navigation
   */
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

  /**
   * Renders table data by transforming a 2D array into HTML table rows and cells
   *
   * @param {Array<Array>} data - 2D array where each inner array represents a row of cells
   *
   * Example:
   * renderData([
   *   ['John', 'john@email.com', 'safe'],
   *   ['Jane', 'jane@email.com', 'unsafe']
   * ])
   * // Generates:
   * // <tr><td>John</td><td>john@email.com</td><td>safe</td></tr>
   * // <tr><td>Jane</td><td>jane@email.com</td><td>unsafe</td></tr>
   *
   * The function:
   * - Takes a 2D array of data
   * - Maps outer array to table rows (<tr>)
   * - Maps inner arrays to table cells (<td>)
   * - Joins all elements into a single HTML string
   * - Updates tableBody innerHTML with the result
   */
  const renderData = (data) => {
    elements.tableBody.innerHTML = data
      .map(
        (row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
      )
      .join("");
  };

  /**
   * Sets table data and updates pagination state
   *
   * @param {Array<Array>} data - 2D array of table data
   * @param {Object} paginationInfo - Pagination state and callbacks
   * @param {number} paginationInfo.totalItems - Total number of items in dataset
   * @param {number} paginationInfo.currentPage - Current page number
   * @param {boolean} paginationInfo.hasNext - Whether next page exists
   * @param {boolean} paginationInfo.hasPrevious - Whether previous page exists
   * @param {Function} paginationInfo.onPageChange - Page change callback
   * @param {Function} paginationInfo.onSearch - Search callback
   *
   * The function:
   * 1. Updates pagination state if info provided
   * 2. Renders table data
   * 3. Updates pagination controls
   *
   * Example:
   * setData(tableData, {
   *   totalItems: 100,
   *   currentPage: 1,
   *   hasNext: true,
   *   hasPrevious: false,
   *   onPageChange: (page) => fetchPage(page),
   *   onSearch: (term) => searchData(term)
   * });
   */
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

  /**
   * Updates table data and pagination state using setData
   *
   * @param {Array<Array>} data - 2D array of table data
   * @param {Object} paginationInfo - Pagination configuration object
   *
   * This is a convenience wrapper around setData() that maintains
   * a consistent interface for updating table state.
   *
   * Example:
   * updateData(newData, {
   *   totalItems: 100,
   *   currentPage: 2,
   *   hasNext: true,
   *   hasPrevious: true,
   *   onPageChange: handlePageChange,
   *   onSearch: handleSearch
   * });
   */
  const updateData = (data, paginationInfo) => {
    setData(data, paginationInfo);
  };

  return {
    setHeaders: renderHeaders,
    setData,
    updateData,
  };
};
