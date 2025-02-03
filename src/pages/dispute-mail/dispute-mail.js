import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { MAIL_STATUS } from "/src/constant/mail_status.js";
import { postData } from "/src/api/api_method.js";
import { displayError } from "/src/helper/display_error.js";
import { loadComponent } from "/src/helper/content_loader_helper.js";
import { createTable } from "/src/component/table/table.js";
import { createViewButton } from "/src/component/view_button/view_button.js";
import { createStatusChip } from "/src/component/status_chip/status_chip.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { createViewDetail } from "/src/component/view_detail/view_detail.js";
import { handleRefresh } from "/src/component/no_data_found/no_data_found.js";
import {
  getCurrentEmail,
  getEmailIds,
} from "/src/helper/get_email_from_local_storage.js";
import {
  GET_DISPUTE_RAISE_DATA,
  GET_ACTION_VIEW_DETAIL,
  FILTER_DISPUTE_MAIL,
} from "/src/routes/api_route.js";

let globalTable = null;
let currentSearchQuery = "";

/**
 * Sets the current search query value for dispute mail filtering
 * @param {string} value - The search query text to set
 * @function setCurrentSearchQuery
 * @returns {void}
 */
export const setCurrentSearchQuery = (value) => {
  currentSearchQuery = value;
};

/**
 * Displays a popup with detailed information for a specific dispute mail
 * @function showPopup
 * @param {string} msg_id - The message ID of the dispute mail to show details for
 * @returns {Promise<void>}
 */
const showPopup = async (msg_id) => {
  const viewDetailData = await getViewDetailOfDisputeMail(msg_id);
  createViewDetail(viewDetailData);
};

/**
 * Fetches detailed information for a specific dispute mail
 * @function getViewDetailOfDisputeMail
 * @param {string} msg_id - The message ID to retrieve details for
 * @returns {Promise<Object>} The detailed data for the dispute mail
 * @throws {Error} Displays error if the API request fails
 */
const getViewDetailOfDisputeMail = async (msg_id) => {
  const currentEmail = getCurrentEmail();

  if (currentEmail) {
    try {
      const requestData = {
        messageId: msg_id,
        email: currentEmail,
      };
      const response = await postData(`${GET_ACTION_VIEW_DETAIL}`, requestData);
      return response.data;
    } catch (error) {
      displayError(error);
    }
  }
};

/**
 * Retrieves paginated dispute mail data for the current user
 * @function getAllDisputeMail
 * @param {number} [page=1] - The page number to fetch (defaults to 1)
 * @returns {Promise<Object>} Paginated response containing dispute mail data
 */
const getAllDisputeMail = async (page = 1) => {
  const currentEmail = getCurrentEmail();

  if (currentEmail) {
    showLoader();
    try {
      const requestData = {
        emailId: currentEmail,
        page: page,
      };
      const response = await postData(
        `${GET_DISPUTE_RAISE_DATA}?page=${page}`,
        requestData
      );
      hideLoader();
      return response;
    } catch (error) {
      hideLoader();
      displayError(error);
    }
    hideLoader();
  }
};

/**
 * Filters dispute mails based on sender's email with pagination
 * @function filterDisputeMails
 * @param {number} [page=1] - The page number to fetch (defaults to 1)
 * @param {string} searchQuery - The sender's email to filter by
 * @returns {Promise<Object>} Filtered and paginated dispute mail data
 */
const filterDisputeMails = async (page = 1, searchQuery) => {
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
        `${FILTER_DISPUTE_MAIL}?page=${page}`,
        requestData
      );
      hideLoader();
      return response;
    } catch (error) {
      hideLoader();
      displayError(error);
    }
    hideLoader();
  }
};

/**
 * Sets up event handlers for the dispute mail search functionality
 * @function initializeSearchHandlers
 *
 * Initializes:
 * - Search button click handler to filter dispute mails
 * - Clear button to reset search
 * - Clear button visibility management
 * - Search input state persistence
 */
const initializeSearchHandlers = () => {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("searchButton");
  const clearButton = document.getElementById("clearButton");

  if (searchButton && searchInput && clearButton) {
    // Search button handler
    searchButton.onclick = () => {
      currentSearchQuery = searchInput.value.trim();
      loadDisputeMailComponent(1, currentSearchQuery);
    };

    // Clear button handler
    if (clearButton) {
      clearButton.onclick = async () => {
        searchInput.value = "";
        currentSearchQuery = "";
        loadDisputeMailComponent(1);
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
 * Attaches click event listeners to all view buttons in the dispute mail table
 * @function attachViewButtonListeners
 *
 * Each view button, when clicked:
 * - Retrieves the message ID from the button's data attribute
 * - Triggers the showPopup function to display detailed mail information
 */
const attachViewButtonListeners = () => {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => {
      showPopup(button.dataset.msg_id);
    });
  });
};

/**
 * Loads and renders the dispute mail component with pagination and search functionality
 * @param {number} [page=1] - The page number to load (defaults to 1)
 * @param {string} [searchQuery=""] - Search query for filtering dispute mails (defaults to empty string)
 * @function loadDisputeMailComponent
 * @async
 *
 * The function:
 * 1. Fetches email IDs and dispute mail data
 * 2. Loads and initializes the table component
 * 3. Handles empty data states
 * 4. Formats and displays dispute mail data with status chips
 * 5. Sets up pagination
 * 6. Attaches view button listeners
 *
 * @throws {Error} Displays error if component loading or data fetching fails
 */
const loadDisputeMailComponent = async (page = 1, searchQuery = "") => {
  try {
    await getEmailIds();
    document.getElementById("noDataFound").innerHTML = "";
    const disputeMailResponse =
      searchQuery.length > 0
        ? await filterDisputeMails(page, searchQuery)
        : await getAllDisputeMail(page);

    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    globalTable = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    globalTable.setHeaders(headers);

    initializeSearchHandlers();

    if (
      !disputeMailResponse ||
      !disputeMailResponse.results ||
      !disputeMailResponse.results.data ||
      disputeMailResponse.results.data.length === 0
    ) {
      document.getElementById("data-table").innerHTML = "";
      document.getElementById("pagination").innerHTML = "";
      await loadComponent({
        componentName: COMPONENTS.NO_DATA_FOUND,
        basePath: BASEPATH.COMPONENT,
        targetId: "noDataFound",
      });
      handleRefresh(() => loadDisputeMailComponent(1));
      return;
    }

    const formattedData = disputeMailResponse?.results?.data?.map((item) => [
      item.sender_email,
      createStatusChip(
        item.status === 1
          ? MAIL_STATUS.SAFE
          : item.status === 2
          ? MAIL_STATUS.UNSAFE
          : MAIL_STATUS.PENDING
      ).outerHTML,
      createViewButton(item.msg_id, item.status).outerHTML,
    ]);

    globalTable.setData(formattedData, {
      totalItems: disputeMailResponse.count,
      currentPage: page,
      hasNext: !!disputeMailResponse.next,
      hasPrevious: !!disputeMailResponse.previous,
      onPageChange: (newPage) =>
        loadDisputeMailComponent(newPage, currentSearchQuery),
    });

    attachViewButtonListeners();
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

/**
 * Event listener and initial load setup for dispute mail component
 *
 * Handles two initialization scenarios:
 * 1. Component loaded event - Triggers when dispute mail component is dynamically loaded
 * 2. Direct initialization - Ensures component loads on page load
 *
 * @listens {Event} componentLoaded - Custom event fired when components are loaded
 */
document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.DISPUTE_MAIL) {
    loadDisputeMailComponent(1);
  }
});

loadDisputeMailComponent(1);
