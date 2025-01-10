import { BASEPATH } from "/src/constant/basepath.js";
import { COMPONENTS } from "/src/constant/component.js";
import { createTable } from "/src/component/table/table.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { createViewButton } from "/src/component/view_button/view_button.js";
import { createStatusChip } from "/src/component/status_chip/status_chip.js";
import { createViewDetail } from "/src/component/view_detail/view_detail.js";
import { loadComponent, loadCSS } from "/src/helper/content_loader_helper.js";
import { postData } from "/src/api/api_method.js";
import { SPAM_MAIL, GET_ACTION_VIEW_DETAIL } from "/src/routes/api_route.js";

const status_chip = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.STATUS_CHIP}/${COMPONENTS.STATUS_CHIP}`;
const view_button = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_BUTTON}/${COMPONENTS.VIEW_BUTTON}`;
const view_detail = `/src/${BASEPATH.COMPONENT}/${COMPONENTS.VIEW_DETAIL}/${COMPONENTS.VIEW_DETAIL}`;

const showPopup = async (msg_id) => {
  const viewDetailData = await getViewDetailOfSpamMail(msg_id);
  createViewDetail(viewDetailData, loadSpamMailComponent);
};

const loadSpamMailComponent = async () => {
  try {
    // Load table component
    await loadComponent({
      componentName: COMPONENTS.TABLE,
      basePath: BASEPATH.COMPONENT,
      targetId: TARGET_ID.DATA_OUTPUT,
    });

    // Load required CSS
    loadCSS(`${status_chip}.css`);
    loadCSS(`${view_button}.css`);

    const table = createTable("data-output");
    const headers = ["Sender", "Status", "Action"];
    table.setHeaders(headers);

    // Fetch spam mail data
    const spamMailData = await getAllSpamMail(1);

    // Format the API data for table display
    const formattedData = spamMailData.map((item) => [
      item.senders_email,
      createStatusChip(item.status).outerHTML,
      createViewButton(item.msg_id).outerHTML,
    ]);

    // Set formatted data to table
    table.setData(formattedData);

    // Add click handlers for view buttons
    document.querySelectorAll(".view-button").forEach((button) => {
      console.log(button);
      button.addEventListener("click", () => {
        loadCSS(`${view_detail}.css`);
        showPopup(button.dataset.msg_id);
      });
    });
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
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
    console.log(error);
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
    console.log(error);
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.SPAM_MAIL) {
    loadSpamMailComponent();
  }
});

loadSpamMailComponent();
