export const fetchDeviceDataToSend = async () => {
  try {
    const response = await fetch("http://localhost:3000/deviceIdentifiers");
    if (response.ok) {
      const data = await response.json();
      await chrome.storage.local.set({
        access_token: data?.licenseStatus?.access_token,
      });
      await chrome.storage.local.set({
        revoke_status: data?.licenseStatus?.revoke_status,
      });
      await chrome.storage.local.set({
        refresh_token: data?.licenseStatus?.refresh_token,
      });
      await chrome.storage.local.set({
        validFrom: data?.licenseStatus?.validFrom,
      });
      await chrome.storage.local.set({
        validTill: data?.licenseStatus?.validTill,
      });
      await chrome.storage.local.set({
        mac_address: data?.deviceDetails?.macAdress,
      });
    }
  } catch (error) {
    console.error("Error fetching device data:", error);
  }
};
