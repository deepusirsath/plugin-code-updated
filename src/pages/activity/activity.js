import { COMPONENTS } from "/src/constant/component.js";
import { GET_GRAPH_DATA } from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";
import { displayError } from "/src/helper/display_error.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";

/**
 * Creates a bar chart visualization for email statistics
 * @param {Object} data - The data object containing email statistics
 * @param {number} data.totalMail - Total number of processed emails
 * @param {number} data.totalSpamMail - Total number of spam emails
 * @param {number} data.totalDisputeMail - Total number of disputed emails
 *
 * @description
 * This function creates an interactive bar chart with the following features:
 * - Displays three bars for processed, spam and dispute emails
 * - Shows value labels on top of each bar
 * - Includes a Y-axis with 5 evenly spaced value labels
 * - Uses different colors for each category:
 *   - Processed Mail: Blue (#3498db)
 *   - Spam Mail: Red (#e74c3c)
 *   - Dispute Mail: Yellow (#f1c40f)
 * - Automatically scales based on maximum value
 * - Responsive layout with wrapper and container elements
 *
 * @example
 * const data = {
 *   totalMail: 100,
 *   totalSpamMail: 20,
 *   totalDisputeMail: 5
 * };
 * createBarChart(data);
 */

function createBarChart(data) {
  const totalMail = data.totalMail || 0;
  const totalSpamMail = data.totalSpamMail || 0;
  const totalDisputeMail = data.totalDisputeMail || 0;

  const maxValue = Math.max(totalMail, totalSpamMail, totalDisputeMail) * 1.35;
  const chartHeight = 400;
  const barMaxHeight = chartHeight - 60;

  // Wrapper for chart
  const chartWrapper = document.createElement("div");
  chartWrapper.classList.add("chart-wrapper");

  // Y-axis container
  const yAxisContainer = document.createElement("div");
  yAxisContainer.classList.add("y-axis-container");

  // Generate y-axis labels
  const numLabels = 5;
  for (let i = numLabels; i >= 0; i--) {
    const labelValue = Math.round((maxValue / numLabels) * i);
    const label = document.createElement("span");
    label.textContent = labelValue;
    yAxisContainer.appendChild(label);
  }

  // Chart container
  const chartContainer = document.createElement("div");
  chartContainer.classList.add("chart-container");

  // Function to create each bar
  function createBar(value, label, color) {
    const barContainer = document.createElement("div");
    barContainer.classList.add("bar-container");
    const barHeight = value === 0 ? 0.5 : (value / maxValue) * barMaxHeight;

    // Create value display at top
    const valueDisplay = document.createElement("span");
    valueDisplay.classList.add("bar-value");
    valueDisplay.textContent = value;
    valueDisplay.style.position = "absolute";
    valueDisplay.style.top = "0";
    valueDisplay.style.width = "100%";
    valueDisplay.style.textAlign = "center";

    //label for bar
    const barLabel = document.createElement("span");
    barLabel.classList.add("bar-label");
    barLabel.textContent = label;

    //create bar
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${barHeight}px`;
    bar.style.backgroundColor = color;

    barContainer.appendChild(valueDisplay);
    barContainer.appendChild(barLabel);
    barContainer.appendChild(bar);
    return barContainer;
  }

  // Add bars to chart
  chartContainer.appendChild(createBar(totalMail, "Processed Mail", "#3498db"));
  chartContainer.appendChild(createBar(totalSpamMail, "Spam Mail", "#e74c3c"));
  chartContainer.appendChild(
    createBar(totalDisputeMail, "Dispute Mail", "#f1c40f")
  );

  // Append y-axis and chart to wrapper
  chartWrapper.appendChild(yAxisContainer);
  chartWrapper.appendChild(chartContainer);

  // Append wrapper to output div
  dataOutput.appendChild(chartWrapper);
}

/**
 * Fetches and displays graph data for email statistics
 * @async
 * @function getGraphData
 *
 * @description
 * This function performs the following operations:
 * - Shows a loading indicator while fetching data
 * - Makes an API call to GET_GRAPH_DATA endpoint with user email
 * - Transforms the API response into chart-compatible format
 * - Creates a bar chart visualization using the data
 * - Handles errors and displays them if they occur
 *
 * The function expects the API response to contain:
 * - total_processed_emails: Number of all processed emails
 * - total_spam_emails: Number of detected spam emails
 * - total_disputes: Number of disputed emails
 *
 * @example
 * // Call the function to fetch and display graph data
 * await getGraphData();
 *
 * @throws {Error} Displays error message if API call fails
 */

const getGraphData = async () => {
  showLoader();
  try {
    const requestData = {
      emailId: "neerajgupta@ekvayu.com",
    };
    const response = await postData(`${GET_GRAPH_DATA}`, requestData);
    const chartData = {
      totalMail: response.data.total_processed_emails,
      totalSpamMail: response.data.total_spam_emails,
      totalDisputeMail: response.data.total_disputes,
    };
    createBarChart(chartData);
    hideLoader();
  } catch (error) {
    hideLoader();
    displayError(error);
  }
};

// Add event listener for when this component is loaded
document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.ACTIVITY) {
    getGraphData();
  }
});

getGraphData();
