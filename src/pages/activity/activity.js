// activity.js
import { COMPONENTS } from "/src/constant/component.js";
import { GET_GRAPH_DATA } from "/src/routes/api_route.js";
import { postData } from "/src/api/api_method.js";
import { displayError } from "/src/helper/display_error.js";
import {
  getCurrentEmail,
  getEmailIds,
} from "/src/helper/get_email_from_local_storage.js";
import { showLoader, hideLoader } from "/src/component/loader/loader.js";

/**
 * Calculates a "nice" rounded number that is greater than or equal to the input maximum value.
 * Nice numbers are considered to be 1, 2, 5, or 10 multiplied by powers of 10.
 * 
 * @param {number} max - The input maximum value to find a nice number for
 * @returns {number} A nice number that is >= the input max
 * 
 * @example
 * getNiceNumber(0)    // returns 10
 * getNiceNumber(3)    // returns 5
 * getNiceNumber(7)    // returns 10
 * getNiceNumber(42)   // returns 50
 * getNiceNumber(150)  // returns 200
 * getNiceNumber(800)  // returns 1000
 * 
 * The function works by:
 * 1. Finding the appropriate power of 10 for the scale of the input
 * 2. Normalizing the max value to between 0-10
 * 3. Selecting the next largest nice number (1, 2, 5, or 10)
 * 4. Scaling back up to the original magnitude
 */

function getNiceNumber(max) {
  if (max === 0) return 10;
  
  const pow10 = Math.floor(Math.log10(max));
  const unit = Math.pow(10, pow10);
  
  const niceNumbers = [1, 2, 5, 10];
  const normalizedMax = max / unit;
  
  for (const nice of niceNumbers) {
    if (normalizedMax <= nice) {
      return nice * unit;
    }
  }
  
  return 10 * unit;
}

/**
 * Generates a bar chart displaying processed mail statistics.
 * 
 * This function dynamically creates a bar chart using DOM elements and styles it accordingly. 
 * It calculates the maximum values, sets up the Y-axis labels, and creates bars for processed mail, spam mail, 
 * and dispute mail. Tooltips are added to display additional information on hover or touch events.
 * 
 * @param {Object} data - The data used to generate the bar chart.
 * @param {number} data.totalMail - The total number of processed mails.
 * @param {number} data.totalSpamMail - The total number of spam mails.
 * @param {number} data.totalDisputeMail - The total number of dispute mails.
 */
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function createBarChart(data) {
  const dataOutput = document.getElementById("data-output");
  if (!dataOutput) return;

  dataOutput.innerHTML = '';

  const totalMail = data.totalMail || 0;
  const totalSpamMail = data.totalSpamMail || 0;
  const totalDisputeMail = data.totalDisputeMail || 0;

  const maxValue = Math.max(totalMail, totalSpamMail, totalDisputeMail);
  const niceMaxValue = getNiceNumber(maxValue * 1.2);
  const chartHeight = 400;
  const barMaxHeight = chartHeight - 60;

  const chartWrapper = document.createElement("div");
  chartWrapper.classList.add("chart-wrapper");

  const yAxisContainer = document.createElement("div");
  yAxisContainer.classList.add("y-axis-container");

  const numLabels = 5;
  for (let i = numLabels; i >= 0; i--) {
    const labelValue = Math.round((niceMaxValue / numLabels) * i);
    const label = document.createElement("span");
    label.classList.add("y-axis-label");
    label.textContent = formatNumber(labelValue);
    yAxisContainer.appendChild(label);
  }

  const chartContainer = document.createElement("div");
  chartContainer.classList.add("chart-container");

  function createBar(value, label, color, gradient, hoverGradient) {
    const barContainer = document.createElement("div");
    barContainer.classList.add("bar-container");

    const barHeight = value === 0 ? 0.5 : (value / niceMaxValue) * barMaxHeight;

    const valueDisplay = document.createElement("span");
    valueDisplay.classList.add("bar-value");
    valueDisplay.textContent = formatNumber(value);

    const barLabel = document.createElement("span");
    barLabel.classList.add("bar-label");
    barLabel.textContent = label;

    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${barHeight}px`;
    bar.style.background = gradient;
    bar.style.border = `2px solid ${color}`;
    bar.style.boxShadow = `0 4px 8px ${color}66`;

    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    
    const percentage = totalMail > 0 ? ((value / totalMail) * 100).toFixed(1) : '0.0';
    
    tooltip.innerHTML = `
        <div class="tooltip-label">${label}</div>
        <div class="tooltip-row">
            <span>Count:</span>
            <span class="tooltip-value">${formatNumber(value)}</span>
        </div>
        <div class="tooltip-row">
            <span>Percentage:</span>
            <span class="tooltip-value">${percentage}%</span>
        </div>
        <div class="tooltip-row">
            <span>Total Processed:</span>
            <span class="tooltip-value">${formatNumber(totalMail)}</span>
        </div>
    `;
    
    barContainer.appendChild(tooltip);

    // Update tooltip positioning logic
    bar.addEventListener('mouseenter', (e) => {
        tooltip.classList.add('show');
        const rect = bar.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const chartRect = chartContainer.getBoundingClientRect();
        
        // Calculate the left position
        let leftPos = -(tooltipRect.width / 2) + (rect.width / 2);
        
        // Check if tooltip goes beyond right edge
        if (rect.left + leftPos + tooltipRect.width > chartRect.right) {
            leftPos = -(tooltipRect.width - rect.width);
        }
        
        // Check if tooltip goes beyond left edge
        if (rect.left + leftPos < chartRect.left) {
            leftPos = 0;
        }
        
        tooltip.style.left = `${leftPos}px`;
        tooltip.style.bottom = `${rect.height + 15}px`;
        bar.style.background = hoverGradient;
    });

    bar.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        bar.style.background = gradient;
    });

    // Touch events for mobile
    bar.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = bar.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const chartRect = chartContainer.getBoundingClientRect();
        
        let leftPos = -(tooltipRect.width / 2) + (rect.width / 2);
        
        if (rect.left + leftPos + tooltipRect.width > chartRect.right) {
            leftPos = -(tooltipRect.width - rect.width);
        }
        
        if (rect.left + leftPos < chartRect.left) {
            leftPos = 0;
        }
        
        tooltip.style.left = `${leftPos}px`;
        tooltip.style.bottom = `${rect.height + 15}px`;
        tooltip.classList.add('show');
        bar.style.background = hoverGradient;
    });

    bar.addEventListener('touchend', () => {
        tooltip.classList.remove('show');
        bar.style.background = gradient;
    });

    barContainer.appendChild(valueDisplay);
    barContainer.appendChild(bar);
    barContainer.appendChild(barLabel);

    return barContainer;
}

  const bars = [
    {
      value: totalMail,
      label: "Processed Mail",
      color: "#3498db",
      gradient: "linear-gradient(to top, #3498db, #5dade2)",
      hoverGradient: "linear-gradient(to top, #2980b9, #3498db)"
    },
    {
      value: totalSpamMail,
      label: "Spam Mail",
      color: "#e74c3c",
      gradient: "linear-gradient(to top, #e74c3c, #f1948a)",
      hoverGradient: "linear-gradient(to top, #c0392b, #e74c3c)"
    },
    {
      value: totalDisputeMail,
      label: "Dispute Mail",
      color: "#f1c40f",
      gradient: "linear-gradient(to top, #f1c40f, #f9e79f)",
      hoverGradient: "linear-gradient(to top, #f39c12, #f1c40f)"
    }
  ];

  bars.forEach(bar => {
    chartContainer.appendChild(
      createBar(bar.value, bar.label, bar.color, bar.gradient, bar.hoverGradient)
    );
  });

  chartWrapper.appendChild(yAxisContainer);
  chartWrapper.appendChild(chartContainer);
  dataOutput.appendChild(chartWrapper);
}

const getGraphData = async () => {
  try {
    showLoader();
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 0));
    const emailPromise = new Promise((resolve) => {
      chrome.storage.local.get(["currentMailId"], function (result) {
        if (result.currentMailId) {
          resolve(result.currentMailId);
        } else {
          setTimeout(() => {
            chrome.storage.local.get(["currentMailId"], function (retryResult) {
              resolve(retryResult.currentMailId || null);
            });
          }, 500);
        }
      });
    });
    
    const [_, currentEmail] = await Promise.all([minLoadingTime, emailPromise]);
    
    if (!currentEmail) {
      throw new Error("Failed to retrieve email ID");
    }
    
    const response = await postData(GET_GRAPH_DATA, { emailId: currentEmail });
    
    if (!response || !response.data) {
      throw new Error("Invalid response data");
    }

    const chartData = {
      totalMail: response.data.total_processed_emails || 0,
      totalSpamMail: response.data.total_spam_emails || 0,
      totalDisputeMail: response.data.total_disputes || 0
    };

    createBarChart(chartData);
  } catch (error) {
    displayError();
  } finally {
    hideLoader();
  }
};

document.addEventListener("componentLoaded", (event) => {
  if (event.detail.componentName === COMPONENTS.ACTIVITY) {
    getGraphData();
  }
});

getGraphData();