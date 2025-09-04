// Popup script for Gold Price Tracker

let chart = null;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadGoldPriceData();
});

async function loadGoldPriceData() {
  try {
    // Get stored gold price data
    const result = await chrome.storage.local.get(['goldPrices']);
    const goldPrices = result.goldPrices || [];
    
    if (goldPrices.length === 0) {
      showLoading();
      return;
    }
    
    // Display current price
    const latestPrice = goldPrices[goldPrices.length - 1];
    updateCurrentPrice(latestPrice);
    
    // Create chart
    createPriceChart(goldPrices);
    
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Failed to load price data');
  }
}

function updateCurrentPrice(priceData) {
  const currentPriceEl = document.getElementById('currentPrice');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  
  // Format price
  const formattedPrice = `$${priceData.price.toFixed(2)}`;
  currentPriceEl.textContent = formattedPrice;
  
  // Format last updated time
  const lastUpdated = new Date(priceData.timestamp);
  const timeString = lastUpdated.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  lastUpdatedEl.textContent = `Last updated: ${timeString}`;
}

function createPriceChart(goldPrices) {
  const canvas = document.getElementById('priceChart');
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }
  
  // Prepare data for chart
  const labels = goldPrices.map(entry => {
    const date = new Date(entry.timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  });
  
  const prices = goldPrices.map(entry => entry.price);
  
  // Calculate price trend for color
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isUp = lastPrice > firstPrice;
  
  const lineColor = isUp ? '#4CAF50' : '#F44336';
  const gradientColor = isUp ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, gradientColor);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
  
  // Chart configuration
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gold Price (USD)',
        data: prices,
        borderColor: lineColor,
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: lineColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: lineColor,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `$${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 10
            },
            maxTicksLimit: 6
          }
        },
        y: {
          display: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            font: {
              size: 10
            },
            callback: function(value) {
              return `$${value.toFixed(0)}`;
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  };
  
  // Create chart
  chart = new Chart(ctx, config);
}

function showLoading() {
  const currentPriceEl = document.getElementById('currentPrice');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const chartContainer = document.querySelector('.chart-container');
  
  currentPriceEl.textContent = 'Loading...';
  lastUpdatedEl.textContent = 'Fetching latest data...';
  chartContainer.innerHTML = '<div class="loading">Loading chart...</div>';
}

function showError(message) {
  const currentPriceEl = document.getElementById('currentPrice');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const chartContainer = document.querySelector('.chart-container');
  
  currentPriceEl.textContent = 'Error';
  lastUpdatedEl.textContent = '';
  chartContainer.innerHTML = `<div class="error">${message}</div>`;
}