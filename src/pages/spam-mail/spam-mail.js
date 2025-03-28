import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { postData } from "/src/api/api_method.js";
import { displayError } from "/src/helper/display_error.js";
import { createTable } from "/src/component/table/table.js";
import { createViewButton } from "/src/component/view_button/view_button.js";
import { createStatusChip } from "/src/component/status_chip/status_chip.js";
import { createViewDetail } from "/src/component/view_detail/view_detail.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import {
  getCurrentEmail,
  getEmailIds,
} from "/src/helper/get_email_from_local_storage.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { handleRefresh } from "/src/component/no_data_found/no_data_found.js";
import {
  SPAM_MAIL,
  GET_ACTION_VIEW_DETAIL,
  FILTER_SPAM_MAIL,
} from "/src/routes/api_route.js";

let globalTable = null;
let currentSearchQuery = "";

/**
 * Updates the current search query value used for filtering spam mails
 * @param {string} value - The search query text to set
 */
export const setCurrentSearchQuery = (value) => {
  currentSearchQuery = value;
};

/**
 * Displays a popup with detailed information about a specific spam mail message
 * @param {string} msg_id - The unique identifier of the spam mail message
 * @returns {void} Creates and displays the detail view popup
 */
const showPopup = async (msg_id) => {
  const viewDetailData = await getViewDetailOfSpamMail(msg_id);
  createViewDetail(viewDetailData);
};

/**
 * Fetches detailed information for a specific spam mail message
 * @param {string} msg_id - The unique identifier of the spam mail message
 * @returns {Promise<Object>} The detailed data of the spam mail message
 * @throws {Error} Displays error message if request fails
 */
const getViewDetailOfSpamMail = async (msg_id) => {
  const currentEmail = getCurrentEmail();

  if (currentEmail) {
    try {
      const requestData = {
        messageId: msg_id,
        email: currentEmail,
      };
      const response = await postData(`${GET_ACTION_VIEW_DETAIL}`, requestData);

      if (response && response.tokenExpired) {
        hideLoader();
        return response;
      }

      return response.data;
    } catch (error) {
      displayError();
    }
  }
};

const getAllSpamMail = async (page = 1) => {
  // Show loader immediately
  showLoader();
  // Create a promise that resolves after 1 second minimum
  const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 100));

  // Get the current email from chrome.storage
  const emailPromise = new Promise((resolve) => {
    chrome.storage.local.get(["currentMailId"], function (result) {
      if (result.currentMailId) {
        resolve(result.currentMailId);
      } else {
        // Wait a moment and try again
        setTimeout(() => {
          chrome.storage.local.get(["currentMailId"], function (retryResult) {
            resolve(retryResult.currentMailId || null);
          });
        }, 500);
      }
    });
  });

  try {
    // Wait for both the minimum loading time and email retrieval
    const [_, currentEmail] = await Promise.all([minLoadingTime, emailPromise]);

    if (!currentEmail) {
      hideLoader();
      return { results: [], count: 0 };
    }

    const requestData = {
      emailId: currentEmail,
      page: page,
    };

    const response = await postData(`${SPAM_MAIL}?page=${page}`, requestData);

    if (response && response.tokenExpired) {
      hideLoader();
      return response;
    }

    hideLoader();
    return response;
  } catch (error) {
    displayError();
    return { results: [], count: 0 }; // Return empty result set on error
  }
};

/**
 * Filters spam mails based on sender's email address with pagination
 * @param {string} searchQuery - The sender's email address to filter by
 * @param {number} [page=1] - The page number for pagination
 * @returns {Promise<Object>} Filtered and paginated spam mail data
 * @property {Array} response.results - List of filtered spam mails
 * @property {number} response.count - Total count of filtered results
 * @property {string} response.next - URL for next page
 * @property {string} response.previous - URL for previous page
 */
const filterSpamMails = async (searchQuery, page = 1) => {
  const currentEmail = getCurrentEmail();

  if (currentEmail) {
    showLoader();
    try {
      const requestData = {
        receiver_email: currentEmail,
        senders_email: searchQuery,
        page: page,
      };
      const response = await postData(
        `${FILTER_SPAM_MAIL}?page=${page}`,
        requestData
      );
      if (response && response.tokenExpired) {
        hideLoader();
        return response;
      }
      hideLoader();
      return response;
    } catch (error) {
      hideLoader();
    }
  }
};

/**
 * Sets up event handlers for the spam mail search functionality
 * Initializes search, clear, and input event listeners
 *
 * Features:
 * - Search button triggers filtered spam mail loading
 * - Clear button resets search and reloads all spam mails
 * - Maintains search input state across component updates
 * - Dynamic clear button visibility based on input state
 *
 * @returns {void} Sets up DOM event listeners for search functionality
 */
const initializeSearchHandlers = () => {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("searchButton");
  const clearButton = document.getElementById("clearButton");

  if (searchButton && searchInput && clearButton) {
    //Search button handler
    searchButton.onclick = () => {
      currentSearchQuery = searchInput.value.trim();
      loadSpamMailComponent(1, currentSearchQuery);
    };

    // Clear button handler
    if (clearButton) {
      clearButton.onclick = async () => {
        searchInput.value = "";
        currentSearchQuery = "";
        loadSpamMailComponent(1);
      };
    }

    // Keep clear button visible after search
    if (currentSearchQuery) {
      searchInput.value = currentSearchQuery;
      clearButton.style.display = "block";
    }

    // Show clear button when input has value
    searchInput.addEventListener("input", () => {
      clearButton.style.display = "block";
    });
  }
};

/**
 * Attaches click event listeners to all view buttons in the spam mail table
 * Each button triggers a popup showing detailed message information
 *
 * @listens {click} Listens for clicks on elements with .view-button class
 * @fires showPopup Using the message ID stored in data-msg_id attribute
 */
const attachViewButtonListeners = () => {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => {
      showPopup(button.dataset.msg_id);
    });
  });
};

/**
 * Loads and renders the spam mail component with pagination and search functionality
 * @param {number} [page=1] - The page number to load
 * @param {string} [searchQuery=""] - Search query to filter spam mails
 * @async
 *
 * Component Flow:
 * 1. Fetches email IDs and spam mail data
 * 2. Loads table component
 * 3. Sets up table headers and search handlers
 * 4. Handles empty data scenarios
 * 5. Formats and displays spam mail data with status and actions
 * 6. Configures pagination
 *
 * @returns {void} Renders the spam mail table component
 * @throws {Error} Displays error message if component loading fails
 */
const loadSpamMailComponent = async (page = 1, searchQuery = "") => {
  try {
    await getEmailIds();
    const noDataFoundElement = document.getElementById("noDataFound");
    if (noDataFoundElement) {
      noDataFoundElement.innerHTML = "";
    }
    const spamMailResponse =
      searchQuery.length > 0
        ? await filterSpamMails(searchQuery, page)
        : await getAllSpamMail(page);

    if (spamMailResponse && spamMailResponse.tokenExpired) {
      return;
    }

    if (spamMailResponse) {
      await loadComponent({
        componentName: COMPONENTS.TABLE,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.DATA_OUTPUT,
      });

      globalTable = createTable("data-output");
      const headers = ["Sender", "Status", "Action"];
      globalTable.setHeaders(headers);

      initializeSearchHandlers();
    }

    if (!spamMailResponse.results || spamMailResponse.results.length === 0) {
      const SearchElement = document.getElementById("search-container");
      if (SearchElement) {
        SearchElement.innerHTML = "";
      }
      await loadComponent({
        componentName: COMPONENTS.NO_DATA_FOUND,
        basePath: BASEPATH.COMPONENT,
        targetId: "noDataFound",
      });

      const dataTableElement = document.getElementById("data-table");
      if (dataTableElement) {
        dataTableElement.innerHTML = "";
      }

      const paginationElement = document.getElementById("pagination");
      if (paginationElement) {
        paginationElement.innerHTML = "";
      }

      handleRefresh(() => {
        const searchInput = document.getElementById("search-input");
        const clearButton = document.getElementById("clearButton");
        if (searchInput) {
          searchInput.value = "";
          currentSearchQuery = "";
        }
        if (clearButton) {
          clearButton.style.display = "none";
        }
        loadSpamMailComponent(1);
      });
      return;
    }

    const formattedData = spamMailResponse.results.map((item) => [
      item.senders_email,
      createStatusChip(item.status).outerHTML,
      createViewButton(item.msg_id, item.status).outerHTML,
    ]);

    globalTable.setData(formattedData, {
      totalItems: spamMailResponse.count,
      currentPage: page,
      hasNext: !!spamMailResponse.next,
      hasPrevious: !!spamMailResponse.previous,
      onPageChange: (newPage) =>
        loadSpamMailComponent(newPage, currentSearchQuery),
    });

    attachViewButtonListeners();
  } catch (error) {
    hideLoader();
    displayError();
  }
};

/**
 * Event listener for component loading completion
 * Initializes the spam mail component when SPAM_MAIL component is loaded
 *
 * @listens {Event} componentLoaded
 * @param {CustomEvent} event - Component loaded event with component details
 * @property {Object} event.detail - Contains component information
 * @property {string} event.detail.componentName - Name of the loaded component
 */
document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent(1);
  }
});
