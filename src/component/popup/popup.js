import {
  loadHTMLContent,
  loadScript,
} from "/src/helper/content_loader_helper.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  try {
    const headerHtml = await loadHTMLContent(
      "/src/component/header/header.html"
    );
    document.getElementById("header-container").innerHTML = headerHtml;
    loadScript("/src/component/header/header.js");

    const sidebarHtml = await loadHTMLContent(
      "/src/component/sidebar/sidebar.html"
    );
    document.getElementById("sidebar-container").innerHTML = sidebarHtml;
    loadScript("/src/component/sidebar/sidebar.js");

    const footerHtml = await loadHTMLContent(
      "/src/component/footer/footer.html"
    );
    document.getElementById("footer-container").innerHTML = footerHtml;
    loadScript("/src/component/footer/footer.js");
  } catch (error) {
    document.getElementById(
      "errorDisplay"
    ).innerHTML = `Loading error: ${error.message}`;
  } finally {
    loader.style.display = "none";
  }
});
