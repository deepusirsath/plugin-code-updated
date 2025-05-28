export const fetchDeviceDataToSend = async () => {
  try {
    const response = await fetch("http://localhost:64321/deviceIdentifiers");

    if (response.ok) {
      const data = await response.json();
      await browser.storage.local.set({ registration: true });

      await browser.storage.local.set({
        access_token: data?.licenseStatus?.access_token,
      });
      await browser.storage.local.set({
        revoke_status: data?.licenseStatus?.revoke_status,
      });
      await browser.storage.local.set({
        refresh_token: data?.licenseStatus?.refresh_token,
      });
      await browser.storage.local.set({
        validFrom: data?.licenseStatus?.validFrom,
      });
      await browser.storage.local.set({
        validTill: data?.licenseStatus?.validTill,
      });
      await browser.storage.local.set({
        mac_address: data?.deviceDetails?.macAdress,
      });
      await browser.storage.local.set({
        allocation_date: data?.licenseStatus?.allocation_date,
      });
      await browser.storage.local.set({
        licenseId: data?.licenseStatus?.licenseId,
      });
      await browser.storage.local.set({
        browsers: data?.deviceDetails?.browsers,
      });
    }
  } catch (error) {
    console.error("Error fetching device data:", error);
  }
};
