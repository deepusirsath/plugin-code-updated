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
import { SPAM_MAIL, GET_ACTION_VIEW_DETAIL } from "/src/routes/api_route.js";

const showPopup = async (msg_id) => {
  showLoader();
  const viewDetailData = await getViewDetailOfSpamMail(msg_id);
  hideLoader();
  createViewDetail(viewDetailData, loadSpamMailComponent);
};

const loadSpamMailComponent = async () => {
  try {
    showLoader();
    const spamMailData = await getAllSpamMail(1);
    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    const table = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    table.setHeaders(headers);

    if (!spamMailData || spamMailData.length === 0) {
      await loadComponent({
        componentName: COMPONENTS.NO_DATA_FOUND,
        basePath: BASEPATH.COMPONENT,
        targetId: TARGET_ID.DATA_OUTPUT,
      });
      handleRefresh(loadSpamMailComponent);
      hideLoader();
      return;
    }

    // Format and display data
    const formattedData = spamMailData.map((item) => [
      item.senders_email,
      createStatusChip(item.status).outerHTML,
      createViewButton(item.msg_id).outerHTML,
    ]);

    table.setData(formattedData);

    // Add click handlers for view buttons
    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", () => {
        showPopup(button.dataset.msg_id);
      });
    });

    hideLoader();
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const getAllSpamMail = async (page = 1) => {
  try {
    const requestData = {
      emailId: "deepali@ekvayu.com",
      page: page,
    };
    const response = await postData(`${SPAM_MAIL}?page=${page}`, requestData);
    return response.results;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

const getViewDetailOfSpamMail = async (msg_id) => {
  try {
    const requestData = {
      messageId: msg_id,
      email: "deepali@ekvayu.com",
    };
    const response = await postData(`${GET_ACTION_VIEW_DETAIL}`, requestData);
    return response.data;
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent();
  }
});

loadSpamMailComponent();
