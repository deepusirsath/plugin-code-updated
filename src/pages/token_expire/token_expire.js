import { GEN_ACCESS_TOKEN } from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { handleRegisteredUser } from "/src/component/popup/popup.js";
import { loadCommonComponents } from "/src/routes/common_route.js";
import { TARGET_ID } from "/src/constant/target_id.js";
import { initializeSidebarNavigation } from "/src/component/sidebar/sidebar.js";

const refreshTokenButton = document.getElementById("refreshTokenButton");

const getAccessToken = async () => {
  try {
    showLoader();

    const { refresh_token } = await chrome.storage.local.get(["refresh_token"]);
    const { mac_address } = await chrome.storage.local.get(["mac_address"]);
    const sidebarElement = document.getElementById(TARGET_ID.SIDEBAR);

    if (!refresh_token || !mac_address) {
      console.error("Missing refresh_token or macAddress");
      hideLoader();
      return;
    }

    const requestData = {
      macAddress: mac_address,
      refreshToken: refresh_token,
    };

    const response = await postData(`${GEN_ACCESS_TOKEN}`, requestData);

    if (response?.data?.access_token) {
      await chrome.storage.local.set({
        access_token: response?.data?.access_token,
      });
      await loadCommonComponents();
      await handleRegisteredUser();
      if (sidebarElement) {
        sidebarElement.style.display = "block";
      }
      initializeSidebarNavigation();
    }
    hideLoader();
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
};

refreshTokenButton.addEventListener("click", getAccessToken);
