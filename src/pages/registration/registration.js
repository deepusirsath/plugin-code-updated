const apiBaseUrl = "http://192.168.0.2:10101/plugin";
const licenseUrl = `${apiBaseUrl}/verify-license/`;
const registerButton = `${apiBaseUrl}/register-plugin/`;

document
  .getElementById("licenseId")
  .addEventListener("input", async function () {
    const licenseId = this.value.trim();
    const errorDisplay = document.getElementById("errorDisplay");
    if (licenseId.length === 64) {
      console.log("Hitting backend for data");
      errorDisplay.textContent = "";
      try {
        const response = await fetch(licenseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ licenseId }),
        });
        if (response.ok) {
          const data = await response.json();
          document.getElementById("email").value = data.data.email;
          errorDisplay.textContent = "";
          chrome.storage.local.set({ license_Id: licenseId });
        } else {
          const errorData = await response.json();
          console.error("Error response from server:", errorData);
          errorDisplay.textContent =
            errorData.message || "License ID is not correct";
        }
      } catch (error) {
        console.error("Error:", error);
        errorDisplay.textContent =
          "Error fetching data. Please try again later.";
      }
    } else {
      errorDisplay.textContent =
        "License ID must be exactly 64 characters long";
    }
  });

document.getElementById("name").addEventListener("input", function () {
  const name = this.value.trim();
  const errorDisplayName = document.getElementById("errorDisplayName");

  if (!name) {
    errorDisplayName.textContent = "Name cannot be empty.";
  } else if (name.length > 50) {
    errorDisplayName.textContent = "Name cannot exceed 50 characters.";
  } else if (
    !/^[a-zA-Z\s']+$/.test(name) || // Allow letters, spaces, and apostrophes
    !name.split(" ").every((word) => /^[A-Z][a-zA-Z']*$/.test(word)) // Allow apostrophes in each word
  ) {
    errorDisplayName.textContent =
      "Name must only contain letters, spaces, and apostrophes, with each word starting with a capital letter.";
  } else {
    errorDisplayName.textContent = "";
  }
});

// document.getElementById("name").addEventListener("input", function () {
//   const name = this.value.trim();
//   const errorDisplayName = document.getElementById("errorDisplayName");
//   if (!name) {
//     errorDisplayName.textContent = "Name cannot be empty.";
//   } else if (
//     !/^[a-zA-Z\s]+$/.test(name) ||
//     !name.split(" ").every((word) => /^[A-Z][a-z]*$/.test(word))
//   ) {
//     errorDisplayName.textContent =
//       "Name must only contain letters and spaces, with each word starting with a capital letter.";
//   } else {
//     errorDisplayName.textContent = "";
//   }
// });

document.getElementById("mobile").addEventListener("input", function () {
  const mobile = this.value.trim();
  const errorDisplayMobile = document.getElementById("errorDisplayMobile");
  const mobilePattern = /^\d{10}$/;
  if (!mobile) {
    errorDisplayMobile.textContent = "Mobile number cannot be empty.";
  } else if (!mobilePattern.test(mobile)) {
    errorDisplayMobile.textContent = "Invalid Mobile Number Must Be 10 Digits.";
  } else {
    errorDisplayMobile.textContent = "";
  }
});

document.getElementById("email").addEventListener("input", function () {
  const email = this.value.trim();
  const errorDisplayEmail = document.getElementById("errorDisplayEmail");
  if (!email) {
    errorDisplayEmail.textContent = "Email cannot be empty.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorDisplayEmail.textContent = "Invalid Email format.";
  } else {
    errorDisplayEmail.textContent = "";
  }
});

document.getElementById("submit").addEventListener("click", async function () {
  console.log("Hitting submit button");
  const licenseId = document.getElementById("licenseId").value;
  const pluginId = document.getElementById("pluginId").value;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const mobile = document.getElementById("mobile").value;
  const ipAddress = document.getElementById("ipAddress").value;
  const chrome = document.getElementById("chrome").value;
  const errorDisplay = document.getElementById("errorDisplay");
  errorDisplay.textContent = ""; // Clear previous errors
  const errorDisplayName = document.getElementById("errorDisplayName");
  errorDisplayName.textContent = ""; // Clear previous errors
  const errorDisplayMobile = document.getElementById("errorDisplayMobile");
  errorDisplayMobile.textContent = ""; // Clear previous errors
  const mobilePattern = /^\d{10}$/;

  // Validate fields
  if (licenseId.length !== 64) {
    errorDisplay.textContent = "License ID must be exactly 64 characters long";
    return;
  }
  if (!name) {
    errorDisplayName.textContent = "Please fill in all the required fields";
    return;
  }
  const trimmedName = name?.trim();
  if (
    !trimmedName ||
    trimmedName.length > 50 || // Check if name exceeds 50 characters
    !/^[a-zA-Z\s']+$/.test(trimmedName) || // Allow apostrophes
    !trimmedName.split(" ").every((word) => /^[A-Z][a-zA-Z']*$/.test(word)) // Allow apostrophes in each word
  ) {
    errorDisplayName.textContent =
      "Name must only contain letters, spaces, and apostrophes, with each word starting with a capital letter, and cannot exceed 50 characters.";
    return;
  }
  if (!mobile) {
    errorDisplayMobile.textContent = "Please fill in all the required fields";
    return;
  }
  if (!mobilePattern.test(mobile)) {
    errorDisplayMobile.textContent = "Invalid Mobile Number Must Be 10 Digits";
    return;
  }

  chrome.storage.local.get(["deviceData"], async (result) => {
    console.log("Hitting backend for data", result);
    if (result?.deviceData) {
      const {
        arch,
        hostname,
        macAddress,
        osPlatform,
        osRelease,
        osType,
        serialNumber,
        uid,
      } = result.deviceData;
      try {
        const response = await fetch(registerButton, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            licenseId,
            pluginId,
            name,
            email,
            mobile,
            ipAddress,
            chrome,
            macAddress,
            serialNumber,
            osType,
            osPlatform,
            osRelease,
            hostName: hostname,
            architecture: arch,
            uuid: uid,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Server response:", data);
          alert("Form submitted successfully");

          // Store registration status with retries
          const storeRegistrationStatus = (retryCount = 3) => {
            chrome.storage.local.set({ registration: true }, function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error storing registration status:",
                  chrome.runtime.lastError
                );
                if (retryCount > 0) {
                  console.log("Retrying to store registration status...");
                  storeRegistrationStatus(retryCount - 1);
                } else {
                  alert(
                    "Failed to store registration status after multiple attempts."
                  );
                }
              } else {
                console.log("Registration status stored");
                chrome.runtime.sendMessage(
                  { action: "reloadPage" },
                  function (response) {
                    if (response.success) {
                      window.close();
                    } else {
                      console.error("Failed to reload the page");
                    }
                  }
                );
              }
            });
          };
          storeRegistrationStatus();
        } else {
          const errorData = await response.json();
          console.error("Error response from server:", errorData);
          alert(errorData.message || "Failed to submit form");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error submitting form");
      }
    }
  });
});

document.getElementById("reset").addEventListener("click", function () {
  console.log("Hitting reset button");
  document.getElementById("licenseId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("mobile").value = "";
});
