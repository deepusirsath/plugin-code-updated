import { GEN_ACCESS_TOKEN } from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";

document.addEventListener("DOMContentLoaded", () => {
  const refreshButton = document.getElementById("refresh-token");

  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      const result = await getAccessToken();
      console.log("Token refresh attempted", result);
    });
  } else {
    console.error("Refresh button not found in the DOM");
  }

  const getAccessToken = async () => {
    const { refresh_token } = await chrome.storage.local.get(["refresh_token"]);
    const { macAdress } = await chrome.storage.local.get(["macAdress"]);

    if (refresh_token && macAdress) {
      try {
        const requestData = {
          refresh_token,
          macAdress,
        };

        const response = await postData(`${GEN_ACCESS_TOKEN}`, requestData);
        console.log(response, "responsedfhsjkfhjlsdh");
        return response.data;
      } catch (error) {
        console.error("Error refreshing token:", error);
        displayError();
      }
    } else {
      console.error("Missing refresh_token or macAdress");
    }
  };
});
