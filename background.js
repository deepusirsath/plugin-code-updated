import { fetchDeviceDataToSend } from "./background/background_helper";

chrome.runtime.onStartup.addListener(() => {
  fetchDeviceDataToSend();
});

chrome.runtime.onInstalled.addListener(() => {
  fetchDeviceDataToSend();
});
