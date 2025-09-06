// Simple popup script - text only, no chart

const MAX_DATA_LENGTH = 10;

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded, initializing popup...");
  await fetchAndDisplayGoldPrice();
});

const goldToggleBtn = document.querySelector("#gold-toggle-btn");

goldToggleBtn.addEventListener("click", () => {
  const goldSection = document.querySelector("#gold-section");

  goldSection.classList.toggle("chart-hidden");

  if (goldSection.classList.contains("chart-hidden")) {
    goldToggleBtn.textContent = "Show Chart";
  } else {
    goldToggleBtn.textContent = "Hide Chart";
  }
});

const checkTimeInterval = (checkTime, interval = 1000 * 30 * 60) => {
  const now = new Date();
  const timeDifference = now - checkTime;

  return timeDifference < interval;
};

async function fetchAndDisplayGoldPrice() {
  try {
    showLoading();

    const result = await chrome.storage.local.get(["goldPrices"]);

    if (result?.goldPrices?.length > 0) {
      const latestDataPoint = result.goldPrices[result.goldPrices.length - 1];
      const latestTime = new Date(latestDataPoint.date);

      if (checkTimeInterval(latestTime)) {
        updateCurrentPrice(latestDataPoint);
        displayPriceHistory(result.goldPrices);
        return;
      }
    }

    const response = await fetch("https://api.gold-api.com/price/XAU");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Extract current price
    const currentPrice = {
      price: parseFloat(data.price),
      timestamp: Date.now(),
      date: new Date().toISOString(),
    };

    updateCurrentPrice(currentPrice);

    let goldPrices = result.goldPrices || [];

    goldPrices.push(currentPrice);

    if (goldPrices.length > MAX_DATA_LENGTH) {
      goldPrices = goldPrices.slice(-MAX_DATA_LENGTH);
    }

    await chrome.storage.local.set({ goldPrices });

    displayPriceHistory(goldPrices);
  } catch (error) {
    console.error("Error fetching gold price:", error);
    showError(`Failed to fetch gold price: ${error.message}`);
  }
}

function updateCurrentPrice(priceData) {
  const currentPriceEl = document.getElementById("currentPrice");
  const lastUpdatedEl = document.getElementById("lastUpdated");

  if (!currentPriceEl || !lastUpdatedEl) {
    console.error("Price display elements not found");
    return;
  }

  // Format price
  const formattedPrice = `$${priceData.price.toFixed(2)}`;
  currentPriceEl.textContent = formattedPrice;

  const lastUpdated = new Date(priceData.timestamp);
  const timeString = lastUpdated.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  lastUpdatedEl.textContent = `Last updated: ${timeString}`;
}

function displayPriceHistory(goldPrices) {
  const ctx = document.querySelector("#priceChart");
  const comparePercentEl = document.getElementById("comparePercent");

  let labels = [];
  let prices = [];

  const currentDate = goldPrices[goldPrices?.length - 1].date.slice(0, 10);
  if (goldPrices) {
    const oldestPrice = goldPrices[0]?.price;
    const newestPrice = goldPrices[goldPrices?.length - 1].price;
    const performacePercent = Math.floor(
      ((newestPrice - oldestPrice) / oldestPrice) * 100
    );

    comparePercentEl.textContent = performacePercent + "%";
    comparePercentEl.classList.add(
      performacePercent > 0 ? "up-trend" : "down-trend"
    );
  }

  goldPrices.forEach((priceData) => {
    const dateObj = new Date(priceData.date);
    const localTime = dateObj.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    labels.push(localTime);
    prices.push(priceData.price);
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: currentDate,
          fill: false,
          data: prices,
          borderColor: "rgb(255, 255, 255)",
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "rgb(255,255,255)",
          },
        },
      },
      scales: {
        y: {
          ticks: {
            color: "rgb(255,255,255)",
          },
          beginAtZero: false,
        },
        x: {
          ticks: {
            color: "rgb(255,255,255)",
          },
        },
      },
    },
  });
}

function showLoading() {
  const currentPriceEl = document.getElementById("currentPrice");
  const lastUpdatedEl = document.getElementById("lastUpdated");

  if (currentPriceEl) currentPriceEl.textContent = "Loading...";
  if (lastUpdatedEl) lastUpdatedEl.textContent = "Fetching latest data...";
}

function showError(message) {
  const currentPriceEl = document.getElementById("currentPrice");
  const lastUpdatedEl = document.getElementById("lastUpdated");
  const chartContainer = document.querySelector(".chart-container");

  if (currentPriceEl) currentPriceEl.textContent = "Error";
  if (lastUpdatedEl) lastUpdatedEl.textContent = "";
  if (chartContainer) {
    chartContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}

function refreshData() {
  fetchAndDisplayGoldPrice();
}
