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

export const setCurrentSearchQuery = (value) => {
  currentSearchQuery = value;
};

const showPopup = async (msg_id, currentPage) => {
  const viewDetailData = await getViewDetailOfSpamMail(msg_id);
  createViewDetail(viewDetailData, () => {});
};

const getViewDetailOfSpamMail = async (msg_id) => {
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

const getAllSpamMail = async (page = 1) => {
  const currentEmail = getCurrentEmail();
  if (currentEmail) {
    showLoader();
    try {
      const requestData = {
        emailId: currentEmail,
        page: page,
      };
      const response = await postData(`${SPAM_MAIL}?page=${page}`, requestData);
      hideLoader();
      return response;
    } catch (error) {
      displayError(error);
      hideLoader();
    }
    hideLoader();
  }
};

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

const attachViewButtonListeners = (currentPage) => {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => {
      showPopup(button.dataset.msg_id, currentPage);
    });
  });
};

const loadSpamMailComponent = async (page = 1, searchQuery = "") => {
  await getEmailIds();

  try {
    document.getElementById("noDataFound").innerHTML = "";
    const spamMailResponse =
      searchQuery.length > 0
        ? await filterSpamMails(searchQuery, page)
        : await getAllSpamMail(page);

    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    globalTable = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    globalTable.setHeaders(headers);

    initializeSearchHandlers();

    if (!spamMailResponse.results || spamMailResponse.results.length === 0) {
      document.getElementById("data-table").innerHTML = "";
      document.getElementById("pagination").innerHTML = "";
      await loadComponent({
        componentName: COMPONENTS.NO_DATA_FOUND,
        basePath: BASEPATH.COMPONENT,
        targetId: "noDataFound",
      });
      handleRefresh(() => loadSpamMailComponent(1));
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

    attachViewButtonListeners(page);
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent(1);
  }
});
