export const displayError = (message) => {
  document.getElementById("data-output").innerHTML = "";
  document.getElementById(
    "errorDisplay"
  ).innerHTML = `Loading error: ${message}`;
};
