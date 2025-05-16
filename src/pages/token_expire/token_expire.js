import { GEN_ACCESS_TOKEN } from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";
import { fetchDeviceDataToSend } from "/src/helper/devide_data_helper.js";
import { TARGET_ID } from "/src/constant/target_id.js";

const refreshTokenButton = document.getElementById("refreshTokenButton");

const getAccessToken = async () => {
  try {
    showLoader();

    const { refresh_token } = await chrome.storage.local.get(["refresh_token"]);
    const { mac_address } = await chrome.storage.local.get(["mac_address"]);

    if (!refresh_token || !mac_address) {
      hideLoader();
      return;
    }

    const requestData = {
      macAddress: mac_address,
      refreshToken: refresh_token,
    };

    const response = await postData(`${GEN_ACCESS_TOKEN}`, requestData);

    if (response?.tokenExpired) {
      await fetchDeviceDataToSend();
      window.close();
    }

    if (response?.data?.access_token) {
      await chrome.storage.local.set({ registration: true });
      await chrome.storage.local.set({
        access_token: response?.data?.access_token,
      });
      window.close();
    }
    hideLoader();
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
};

refreshTokenButton &&
  refreshTokenButton.addEventListener("click", getAccessToken);
