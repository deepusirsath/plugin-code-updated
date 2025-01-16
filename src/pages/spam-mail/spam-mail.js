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
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { handleRefresh } from "/src/component/no_data_found/no_data_found.js";
import {
  SPAM_MAIL,
  GET_ACTION_VIEW_DETAIL,
  FILTER_SPAM_MAIL,
} from "/src/routes/api_route.js";

const showPopup = async (msg_id, currentPage) => {
  showLoader();
  const viewDetailData = await getViewDetailOfSpamMail(msg_id);
  hideLoader();
  createViewDetail(viewDetailData, () => loadSpamMailComponent(currentPage));
};

const getViewDetailOfSpamMail = async (msg_id) => {
  try {
    const requestData = {
      messageId: msg_id,
      email: "ekvayu123@outlook.com",
    };
    const response = await postData(`${GET_ACTION_VIEW_DETAIL}`, requestData);
    return response.data;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const getAllSpamMail = async (page = 1, searchQuery) => {
  try {
    const requestData = {
      emailId: "ekvayu123@outlook.com",
      page: page,
    };
    const response = await postData(`${SPAM_MAIL}?page=${page}`, requestData);
    return response;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const filterSpamMails = async (searchQuery, page = 1) => {
  try {
    const requestData = {
      receiver_email: "ekvayu123@outlook.com",
      senders_email: searchQuery,
      page: page,
    };
    const response = await postData(
      `${FILTER_SPAM_MAIL}?page=${page}`,
      requestData
    );
    return response;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const handleSearch = (value) => {
  loadSpamMailComponent(1, value);
};

const loadSpamMailComponent = async (page = 1, searchQuery = "") => {
  try {
    showLoader();
    const spamMailResponse = searchQuery
      ? await filterSpamMails(searchQuery, page)
      : await getAllSpamMail(page);

    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    const table = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    table.setHeaders(headers);

    if (!spamMailResponse.results || spamMailResponse.results.length === 0) {
      await loadComponent({
        componentName: COMPONENTS.NO_DATA_FOUND,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.DATA_OUTPUT,
      });
      handleRefresh(() => loadSpamMailComponent(1, searchQuery));
      hideLoader();
      return;
    }

    const handlePageChange = async (newPage) => {
      showLoader();
      const newData = searchQuery
        ? await filterSpamMails(searchQuery, newPage)
        : await getAllSpamMail(newPage);

      const newFormattedData = newData.results.map((item) => [
        item.senders_email,
        createStatusChip(item.status).outerHTML,
        createViewButton(item.msg_id).outerHTML,
      ]);

      table.updateData(newFormattedData, {
        totalItems: newData.count,
        currentPage: newPage,
        hasNext: !!newData.next,
        hasPrevious: !!newData.previous,
        onPageChange: handlePageChange,
      });
      hideLoader();

      attachViewButtonListeners(newPage);
    };

    const attachViewButtonListeners = (currentPage) => {
      document.querySelectorAll(".view-button").forEach((button) => {
        button.addEventListener("click", () => {
          showPopup(button.dataset.msg_id, currentPage);
        });
      });
    };

    const formattedData = spamMailResponse.results.map((item) => [
      item.senders_email,
      createStatusChip(item.status).outerHTML,
      createViewButton(item.msg_id).outerHTML,
    ]);

    table.setData(formattedData, {
      totalItems: spamMailResponse.count,
      currentPage: page,
      hasNext: !!spamMailResponse.next,
      hasPrevious: !!spamMailResponse.previous,
      onPageChange: handlePageChange,
      onSearch: handleSearch,
    });

    attachViewButtonListeners(page);
    hideLoader();
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

// Add event listener for search button
document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent(1);

    // const searchButton = document.getElementById("searchButton");
    // if (searchButton) {
    //   searchButton.addEventListener("click", handleSearch);
    // }
  }
});

loadSpamMailComponent();
