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
  GET_DISPUTE_RAISE_DATA,
  GET_ACTION_VIEW_DETAIL,FILTER_DISPUTE_MAIL 
} from "/src/routes/api_route.js";


const showPopup = async (msg_id, currentPage) => {
  showLoader();
  const viewDetailData = await getViewDetailOfDisputeMail(msg_id);
  hideLoader();
  createViewDetail(viewDetailData, loadDisputeComponent(currentPage));
};

const getViewDetailOfDisputeMail = async (msg_id) => {
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

const getAllDisputeMail = async ( page = 1, searchQuery) => {
  try {
    const requestData = {
      emailId: "ekvayu123@outlook.com",
      page: page,
    };
    const response = await postData(
      `${GET_DISPUTE_RAISE_DATA}?page=${page}`,
      requestData
    );
    return response.results;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const filterDisputeMails = async (searchQuery, page = 1) => {
  try {
    const requestData = {
      receiver_email: "ekvayu123@outlook.com",
      senders_email: searchQuery,
      page: page,
    };
    const response = await postData(
      `${FILTER_DISPUTE_MAIL}?page=${page}`,
      requestData
    );
    return response;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const handleSearch = (value) => {
  loadDisputeComponent(1, value);
};

const loadDisputeComponent = async (page = 1, searchQuery = "") => {
  try {
    showLoader();

    const disputeMailResponse = searchQuery
      ? await filterDisputeMails(searchQuery, page)
      : await getAllDisputeMail(page);
    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    const table = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    table.setHeaders(headers);

    if (!disputeMailResponse.data || disputeMailResponse.data.length === 0) {
      await loadComponent({
        componentName: COMPONENTS.NO_DATA_FOUND,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.DATA_OUTPUT,
      });
      handleRefresh(() => loadDisputeComponent(1, searchQuery));
      hideLoader();
      return;
    }

    const handlePageChange = async (newPage) => {
      showLoader();
      const newData = searchQuery
        ? await filterDisputeMails(searchQuery, newPage)
        : await getAllDisputeMail(newPage);

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

    // Format and display data
    const formattedData = disputeMailResponse.data.map((item) => [
      item.sender_email,
      createStatusChip(
        item.status === 1 ? "safe" : item.status === 2 ? "unsafe" : "pending"
      ).outerHTML,
      createViewButton(item.msg_id).outerHTML,
    ]);

    table.setData(formattedData, {
      totalItems: disputeMailResponse.count,
      currentPage: page,
      hasNext: !!disputeMailResponse.next,
      hasPrevious: !!disputeMailResponse.previous,
      onPageChange: handlePageChange,
      onSearch: handleSearch,
    });

    // Add click handlers for view buttons
    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", () => {
        showPopup(button.dataset.msg_id);
      });
    });

    attachViewButtonListeners(page);
    hideLoader();
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.DISPUTE_MAIL) {
    loadDisputeComponent();
  }
});

loadDisputeComponent();
