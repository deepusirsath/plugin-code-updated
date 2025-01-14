export const fetchDeviceDataToSend = async () => {
  try {
    const response = await fetch("http://localhost:3000/deviceIdentifiers");
    if (response.ok) {
      const data = await response.json();

      // Store the device data in Chrome local storage
      chrome.storage.local.set({ deviceData: data }, () => {
        console.log("Device data stored successfully in local storage");
      });
    }
  } catch (error) {
    console.error("Error fetching device data:", error);
  }
};


