export const createViewButton = (sender) => {
  const button = document.createElement("button");
  button.className = "view-button";
  button.textContent = "View";
  button.dataset.sender = sender;
  return button;
};
