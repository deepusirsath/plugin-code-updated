import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { MAIL_STATUS } from "/src/constant/mail_status.js";
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
  GET_DISPUTE_RAISE_DATA,
  GET_ACTION_VIEW_DETAIL,
  FILTER_DISPUTE_MAIL,
} from "/src/routes/api_route.js";

let globalTable = null;
let currentSearchQuery = "";

export const setCurrentSearchQuery = (value) => {
  currentSearchQuery = value;
};

const showPopup = async (msg_id, currentPage) => {
  const viewDetailData = await getViewDetailOfDisputeMail(msg_id);
  createViewDetail(viewDetailData, () => {});
};

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

const attachViewButtonListeners = (currentPage) => {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => {
      showPopup(button.dataset.msg_id, currentPage);
    });
  });
};

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

    attachViewButtonListeners(page);
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.DISPUTE_MAIL) {
    loadDisputeMailComponent(1);
  }
});

loadDisputeMailComponent(1);
