// Simple popup script - text only, no chart

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing popup...');
  await fetchAndDisplayGoldPrice();
});

async function fetchAndDisplayGoldPrice() {
  try {
    showLoading();
    
    // DIRECT API CALL from popup
    console.log('Fetching gold price from API...');
    const response = await fetch('https://api.gold-api.com/price/XAU');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract current price
    const currentPrice = {
      price: parseFloat(data.price),
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    
    console.log('Current gold price:', currentPrice);
    
    // Display current price
    updateCurrentPrice(currentPrice);
    
    // Get historical data from storage (if any)
    const result = await chrome.storage.local.get(['goldPrices']);
    let goldPrices = result.goldPrices || [];
    
    // Add current price to history
    goldPrices.push(currentPrice);
    
    // Keep only last 50 entries
    if (goldPrices.length > 50) {
      goldPrices = goldPrices.slice(-50);
    }
    
    // Save updated data back to storage
    await chrome.storage.local.set({ goldPrices });
    
    // Show price history as text
    displayPriceHistory(goldPrices);
    
  } catch (error) {
    console.error('Error fetching gold price:', error);
    showError(`Failed to fetch gold price: ${error.message}`);
  }
}

function updateCurrentPrice(priceData) {
  const currentPriceEl = document.getElementById('currentPrice');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  
  if (!currentPriceEl || !lastUpdatedEl) {
    console.error('Price display elements not found');
    return;
  }
  
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

function displayPriceHistory(goldPrices) {
  const chartContainer = document.querySelector('.chart-container');
  if (!chartContainer) return;
  
  // Clear any loading messages
  chartContainer.innerHTML = '';
  
  if (goldPrices.length === 0) {
    chartContainer.innerHTML = '<div class="no-data">No price history available</div>';
    return;
  }
  
  // Show last 10 prices as text
  const recentPrices = goldPrices.slice(-10);
  const historyHtml = recentPrices.map(entry => {
    const date = new Date(entry.timestamp);
    const timeString = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `<div class="price-entry">
      <span class="price-time">${timeString}</span>
      <span class="price-value">$${entry.price.toFixed(2)}</span>
    </div>`;
  }).join('');
  
  chartContainer.innerHTML = `
    <div class="price-history">
      <h3>Recent Prices</h3>
      ${historyHtml}
    </div>
  `;
}

function showLoading() {
  const currentPriceEl = document.getElementById('currentPrice');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const chartContainer = document.querySelector('.chart-container');
  
  if (currentPriceEl) currentPriceEl.textContent = 'Loading...';
  if (lastUpdatedEl) lastUpdatedEl.textContent = 'Fetching latest data...';
  if (chartContainer) {
    chartContainer.innerHTML = '<div class="loading">Loading price data...</div>';
  }
}

function showError(message) {
  const currentPriceEl = document.getElementById('currentPrice');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const chartContainer = document.querySelector('.chart-container');
  
  if (currentPriceEl) currentPriceEl.textContent = 'Error';
  if (lastUpdatedEl) lastUpdatedEl.textContent = '';
  if (chartContainer) {
    chartContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Optional: Add refresh button functionality
function refreshData() {
  fetchAndDisplayGoldPrice();
}