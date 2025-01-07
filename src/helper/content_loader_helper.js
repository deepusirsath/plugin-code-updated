export const loadHTMLContent = async (url) => {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error("Error loading HTML content:", error);
  }
};

export const loadScript = (scriptUrl) => {
  const script = document.createElement("script");
  script.src = scriptUrl;
  document.body.appendChild(script);
};