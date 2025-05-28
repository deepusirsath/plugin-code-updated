const express = require("express");
const os = require("os");
const { execSync } = require("child_process");
const sudo = require("sudo-prompt");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dns = require("dns");
const app = express();
const cors = require("cors");
const PORT = 64321;
app.use(cors());

app.use(cors({
  origin: 'moz-extension://d57151fd-ddf5-4c29-9589-99da8f94c03e'
}));
const EXTENSIONS = {
  chrome: {
    id: "gnplmanhfinpdhmnnbnbkkejjmfcbaek",
    url: "https://clients2.google.com/service/update2/crx",
  },
  edge: {
    id: "hedbfimcgfjkikiknphlikdkfognccib",
    url: "https://edge.microsoft.com/extensionwebstorebase/v1/crx",
  },
  firefox: {
    id: "lakshit@ekvayu.com",
    url: "file:///C:/Program Files/Mozilla Firefox/extension.xpi",
  },
};

const FIREFOX_POLICY_DIR = "C:\\Program Files\\Mozilla Firefox\\distribution";
const FIREFOX_POLICY_FILE = path.join(FIREFOX_POLICY_DIR, "policies.json");
const LICENSE_VERIFICATION_URL ="http://3.109.178.115:8006/plugin/verify-mac/";

async function isInternetAvailable() {
  return new Promise((resolve) => {
    dns.lookup("google.com", (err) => {
      resolve(!err);
    });
  });
}

async function downloadFirefoxExtension() {
  return new Promise((resolve, reject) => {
    const downloadPath = "C:\\Program Files\\Mozilla Firefox\\extension.xpi";

    // Extract the file ID from the Google Drive link
    const fileId = "1UVJJClIVLe9BXKiuGcGwZf_LZ95jIpRu";

    // Use the direct download URL format for Google Drive
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const downloadCommand = `powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${downloadPath}' -UseBasicParsing"`;

    console.log(`Downloading Firefox extension from: ${downloadUrl}`);
    console.log(`Saving to: ${downloadPath}`);

    const { exec } = require("child_process");

    exec(downloadCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error downloading extension: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`⚠️ Stderr: ${stderr}`);
      }

      // Verify the file was downloaded
      if (fs.existsSync(downloadPath)) {
        console.log(`✅ Extension downloaded successfully to: ${downloadPath}`);
        resolve(downloadPath);
      } else {
        console.error("❌ Download appeared to succeed but file not found");
        reject(new Error("File not found after download"));
      }
    });
  });
}

function executeCommand(command) {
  try {
    return execSync(command).toString().trim();
  } catch (error) {
    console.warn(`Command failed: ${command}`);
    return null;
  }
}

function getBrowserVersions() {
  const browsers = {
    chrome: { installed: false, version: null },
    firefox: { installed: false, version: null },
    edge: { installed: false, version: null },
  };

  try {
    // Check Chrome version
    const chromeRegCommand =
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve';
    try {
      execSync(chromeRegCommand);
      const chromeVersion = execSync(
        "wmic datafile where name='C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe' get Version /value"
      ).toString();
      browsers.chrome = {
        installed: true,
        version: chromeVersion.match(/Version=(.+)/)?.[1]?.trim() || "Unknown",
      };
    } catch {
      browsers.chrome.installed = false;
    }

    // Check Firefox version
    const firefoxRegCommand =
      'reg query "HKLM\\SOFTWARE\\Mozilla\\Mozilla Firefox" /v CurrentVersion';
    try {
      const firefoxVersion = execSync(firefoxRegCommand).toString();
      browsers.firefox = {
        installed: true,
        version:
          firefoxVersion.match(/CurrentVersion\s+REG_SZ\s+(.+)/)?.[1]?.trim() ||
          "Unknown",
      };
    } catch {
      browsers.firefox.installed = false;
    }

    // Check Edge version (AppX and Classic)
    try {
      let edgeVersion = null;

      // Try multiple methods to detect Edge version
      const edgePaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      ];

      // Method 1: Check executable paths
      for (const edgePath of edgePaths) {
        if (fs.existsSync(edgePath)) {
          try {
            const edgeExeVersion = execSync(
              `wmic datafile where name='${edgePath.replace(
                /\\/g,
                "\\\\"
              )}' get Version /value`
            ).toString();
            edgeVersion = edgeExeVersion.match(/Version=(.+)/)?.[1]?.trim();
            if (edgeVersion) break;
          } catch (e) {
            console.warn(`Failed to get version from ${edgePath}`);
          }
        }
      }

      // Method 2: Try PowerShell AppX method if no version found
      if (!edgeVersion) {
        try {
          edgeVersion = execSync(
            'powershell -command "(Get-AppxPackage Microsoft.Edge).Version"'
          )
            .toString()
            .trim();
        } catch (e) {
          console.warn("AppX version detection failed");
        }
      }

      // Method 3: Try registry as last resort
      if (!edgeVersion) {
        try {
          const edgeRegPaths = [
            "HKLM\\SOFTWARE\\Microsoft\\Edge\\BLBeacon",
            "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Edge\\BLBeacon",
          ];

          for (const regPath of edgeRegPaths) {
            try {
              const edgeRegOutput = execSync(
                `reg query "${regPath}" /v version`
              ).toString();
              edgeVersion = edgeRegOutput
                .match(/version\s+REG_SZ\s+(.+)/)?.[1]
                ?.trim();
              if (edgeVersion) break;
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          console.warn("Registry version detection failed");
        }
      }

      browsers.edge = {
        installed: Boolean(edgeVersion),
        version: edgeVersion || "Unknown",
      };
    } catch (e) {
      console.warn("Edge detection failed completely");
      browsers.edge = {
        installed: false,
        version: "Unknown",
      };
    }
  } catch (error) {
    console.error("Error detecting browser versions:", error);
  }

  console.log("Browser Details:", browsers);
  return browsers;
}

function getMacAddress() {
  return (
    Object.values(os.networkInterfaces())
      .flat()
      .find((iface) => iface.family === "IPv4" && !iface.internal)?.mac ||
    "00:00:00:00:00:00"
  );
}

function getSerialNumber() {
  return (
    executeCommand("wmic bios get serialnumber")?.split("\n")[1]?.trim() ||
    "Unknown"
  );
}

function getFullUUID() {
  return (
    executeCommand("wmic csproduct get uuid")?.split("\n")[1]?.trim() ||
    "Unknown"
  );
}

async function getDeviceIdentifiers() {
  return {
    uuid: getFullUUID(),
    macAdress: getMacAddress(),
    serialNumber: getSerialNumber(),
    osType: os.type(),
    osPlatform: os.platform(),
    osRelease: os.release(),
    hostName: os.hostname(),
    architecture: os.arch(),
    current_version: "1.0.0",
    browsers: getBrowserVersions(),
  };
}

async function checkLicenseValidity() {
  try {
    const deviceDetails = await getDeviceIdentifiers();
    console.log("Verifying License for Device:", deviceDetails.macAdress);

    const { data } = await axios.post(LICENSE_VERIFICATION_URL, deviceDetails, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("License Response:", data);

    if (data?.STATUS === "Success" && data?.Code === 1) {
      const revoke = data.data?.revoke;

      return {
        isValid: data.data?.valid_status || false,
        licenseId: data.data?.license_id || "Unknown",
        validTill: data.data?.valid_till || "Unknown",
        revoke: revoke || "Not Revoked", // Show the date or "Not Revoked"
        validFrom: data.data?.valid_from || "Unknown",
        revoke_status: revoke ? true : false, // Use underscore in the key name
        access_token: data.data?.access_token || false,
        refresh_token: data.data?.refresh_token || false,
        agent_version: data.data?.agent_version || "Unknown",
      };
    }

    return {
      isValid: false,
      licenseId: "Unknown",
      validTill: null,
      revoke: null,
      validFrom: null,
      revoke_status: false, // Use underscore in the fallback response
      access_token: false,
      refresh_token: false,
      agent_version: "Unknown",
    };
  } catch (error) {
    console.error("License Verification Failed:", error.message);
    return {
      isValid: false,
      licenseId: "Unknown",
      validTill: null,
      revoke: null,
      validFrom: null,
      revoke_status: false, // Use underscore in the error response
      access_token: false,
      refresh_token: false,
      agent_version: "Unknown",
    };
  }
}

function deleteExtensions() {
  try {
    console.log("Starting Extension Removal...");

    // Delete Firefox profile extensions
    const firefoxCommand =
      'for /d %u in (C:\\Users\\*) do for /d %p in ("%u\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\*") do if exist "%p\\extensions\\lakshit@ekvayu.com.xpi" del /f /q "%p\\extensions\\lakshit@ekvayu.com.xpi"';
    execSync(firefoxCommand, { shell: "cmd.exe" });
    console.log("Firefox Extension Removed from Profiles");

    // Delete downloaded extension file
    const downloadedExtension =
      "C:\\Program Files\\Mozilla Firefox\\extension.xpi";
    if (fs.existsSync(downloadedExtension)) {
      execSync(`del /f /q "${downloadedExtension}"`, { shell: "cmd.exe" });
      console.log("Downloaded Firefox Extension Removed");
    }

    // Delete policy file
    if (fs.existsSync(FIREFOX_POLICY_FILE)) {
      execSync(`del /f /q "${FIREFOX_POLICY_FILE}"`, { shell: "cmd.exe" });
      console.log("Firefox Policy File Removed");
    }

    // Remove Chrome and Edge registry entries
    execSync(
      'reg delete "HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" /f'
    );
    execSync(
      'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\\ExtensionInstallForcelist" /f'
    );
    console.log("Chrome and Edge Registry Entries Removed");
  } catch (err) {
    console.error("Extension Removal Error:", err);
  }
}

// Define the missing deleteServiceFile function
function deleteServiceFile() {
  try {
    console.log("Attempting to delete service file...");
    // Add your service file deletion logic here if needed
    return true;
  } catch (error) {
    console.error("Error deleting service file:", error);
    return false;
  }
}

async function addBrowserRegistryEntries() {
  const options = { name: "Local" };
  console.log("Adding Browser Registry Entries...");

  // Add Chrome and Edge registry entries
  sudo.exec(
    `reg add "HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" /v "1" /t REG_SZ /d "${EXTENSIONS.chrome.id};${EXTENSIONS.chrome.url}" /f`,
    options
  );
  sudo.exec(
    `reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\\ExtensionInstallForcelist" /v "1" /t REG_SZ /d "${EXTENSIONS.edge.id};${EXTENSIONS.edge.url}" /f`,
    options
  );

  // Also install Firefox extension
  await createFirefoxPolicyFile();
}

async function createFirefoxPolicyFile() {
  console.log("Creating Firefox Policy...");

  try {
    // First download the extension
    const extensionPath = await downloadFirefoxExtension();

    // Create the distribution directory if it doesn't exist
    if (!fs.existsSync(FIREFOX_POLICY_DIR)) {
      try {
        fs.mkdirSync(FIREFOX_POLICY_DIR, { recursive: true });
        console.log(`Created directory: ${FIREFOX_POLICY_DIR}`);
      } catch (err) {
        console.error(`Failed to create directory: ${err.message}`);
        // Try with elevated permissions
        const mkdirCommand = `powershell -Command "New-Item -Path '${FIREFOX_POLICY_DIR}' -ItemType Directory -Force"`;
        sudo.exec(mkdirCommand, { name: "Create Firefox Policy Directory" });
      }
    }

    // Create the policy content
    const policyContent = {
      policies: {
        ExtensionSettings: {
          [EXTENSIONS.firefox.id]: {
            installation_mode: "force_installed",
            install_url: EXTENSIONS.firefox.url,
            incognito: "spanning",
            allowed_in_private_browsing: true,
          },
        },
      },
    };

    // Write the policy file
    try {
      fs.writeFileSync(
        FIREFOX_POLICY_FILE,
        JSON.stringify(policyContent, null, 2)
      );
      console.log("Firefox policy file created successfully");
    } catch (err) {
      console.error(`Failed to write policy file: ${err.message}`);
      // Try with elevated permissions
      const policyJson = JSON.stringify(policyContent, null, 2).replace(
        /"/g,
        '\\"'
      );
      const writeCommand = `powershell -Command "Set-Content -Path '${FIREFOX_POLICY_FILE}' -Value '${policyJson}'"`;
      sudo.exec(writeCommand, { name: "Write Firefox Policy File" });
    }
  } catch (error) {
    console.error("Failed to create Firefox policy:", error);
  }
}
async function periodicCheck() {
  const NORMAL_INTERVAL = 12000000; // 2 minutes
  const RETRY_INTERVAL = 30000; // 30 seconds

  while (true) {
    console.log("\n=== Starting License Check ===");

    // Check for internet connection
    while (!(await isInternetAvailable())) {
      console.log("No internet connection. Retrying in 30 seconds...");
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }

    try {
      const deviceDetails = await getDeviceIdentifiers();
      const response = await axios.post(
        LICENSE_VERIFICATION_URL,
        deviceDetails,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      if (response.data.STATUS === "Success" && response.data.Code === 1) {
        console.log("✅ License check successful");

        const licenseData = response.data.data;

        const isValid = licenseData?.valid_status === true;
        const revokeStatus = licenseData?.revoke ? true : false; // true if date, false if null

        console.log(`License Status: ${isValid ? "Valid" : "Invalid"}`);
        console.log(
          `Revoke Status: ${revokeStatus ? "Revoked" : "Not Revoked"}`
        );

        // 🛠️ Uninstall and delete service if revoked
        if (revokeStatus) {
          console.log(
            "❌ Revoke is TRUE - Uninstalling and deleting service..."
          );
          // await deleteExtensions();
          // await deleteServiceFile();
        }
        // ✅ If valid and revoke is false, install
        else if (isValid && !revokeStatus) {
          console.log(
            "✅ License is valid and not revoked - Installing extensions..."
          );
          // await addBrowserRegistryEntries();
        }
        // ❌ If invalid and revoke is false, uninstall only
        else if (!isValid && !revokeStatus) {
          console.log(
            "❌ License invalid and not revoked - Uninstalling extensions only..."
          );
          // await deleteExtensions();
        }
        // ❌ If valid but revoked, uninstall and delete service
        else if (isValid && revokeStatus) {
          console.log(
            "❌ License valid but revoked - Uninstalling and deleting service..."
          );
          // await deleteExtensions();
          // await deleteServiceFile();
        }

        console.log(`Next check in ${NORMAL_INTERVAL / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, NORMAL_INTERVAL));
      } else {
        throw new Error("Invalid license response");
      }
    } catch (error) {
      console.error("❗ Server check failed:", error.message);
      console.log(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
}

app.get("/deviceIdentifiers", async (req, res) => {
  const deviceDetails = await getDeviceIdentifiers();
  const licenseStatus = await checkLicenseValidity();
  res.json({ deviceDetails, licenseStatus });
});
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  periodicCheck();
});
