export const handleRefresh = (callback) => {
  const refreshButton = document.getElementById("refresh-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      if (typeof callback === "function") {
        callback();
      }
    });
  }
};
