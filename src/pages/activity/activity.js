import { COMPONENTS } from "/src/constant/component.js";

function createBarChart(data) {
  const totalMail = data.totalMail || 0;
  const totalSpamMail = data.totalSpamMail || 0;
  const totalDisputeMail = data.totalDisputeMail || 0;

  const maxValue = Math.max(totalMail, totalSpamMail, totalDisputeMail) * 1.35;
  const chartHeight = 350;
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
    // bar.textContent = value; // Display value inside the bar
    // const barLabel = document.createElement("span");
    // barLabel.classList.add("bar-label");
    // barLabel.textContent = label;

    barContainer.appendChild(valueDisplay);
    barContainer.appendChild(barLabel);
    barContainer.appendChild(bar);
    // barContainer.appendChild(barLabel);
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

// Example data
const data = {
  totalMail: 120,
  totalSpamMail: 80,
  totalDisputeMail: 50,
};

createBarChart(data);

// Add event listener for when this component is loaded
document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.ACTIVITY) {
    const data = {
      totalMail: 120,
      totalSpamMail: 80,
      totalDisputeMail: 50,
    };
    createBarChart(data);
  }
});
