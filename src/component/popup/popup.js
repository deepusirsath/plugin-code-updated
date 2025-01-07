// const baseUrl = "http://192.168.0.2:10101/plugin";

// document.addEventListener("DOMContentLoaded", () => {
//   console.log("DOM fully loaded and parsed");
//   const buttonContainer = document.querySelector(".button-container");
//   loadDisplayActivity(buttonContainer);
// });


// async function loadDisplayActivity(buttonContainer) {
//   try {
//     const html = await loadHTMLContent("/src/pages/app/app.html");
//     buttonContainer.innerHTML = html;
//   } catch (error) {
//     console.error("Error loading Display Activity:", error);
//   }
// }


async function loadHTMLContent(url) {
  console.log(`Loading ${url}`);
  const response = await fetch(url);
  console.log(`Loading ${url}:`, response.status);
  
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`);
  }
  
  return await response.text();
}

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  try {
    const headerHtml = await loadHTMLContent("../../component/header/header.html");
    document.getElementById("header-container").innerHTML = headerHtml;

    const sidebarHtml = await loadHTMLContent("../../component/sidebar/sidebar.html");
    document.getElementById("sidebar-container").innerHTML = sidebarHtml;

    const footerHtml = await loadHTMLContent("../../component/footer/footer.html");
    document.getElementById("footer-container").innerHTML = footerHtml;
  } catch (error) {
    console.error("Error loading components:", error);
    document.getElementById("errorDisplay").innerHTML = `Loading error: ${error.message}`;
  } finally {
    loader.style.display = "none";
  }
});