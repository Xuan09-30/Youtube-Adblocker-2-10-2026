const countElem = document.getElementById("blocked-count");
const resetBtn = document.getElementById("reset-btn");

function updateDisplay() {
  chrome.storage.local.get(["blockedCount"], (res) => {
    countElem.textContent = res.blockedCount || 0;
  });
}

// Initial load
updateDisplay();

// Listen for updates while popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedCount) {
    countElem.textContent = changes.blockedCount.newValue;
  }
});

// Reset count
resetBtn.addEventListener("click", () => {
  chrome.storage.local.set({ blockedCount: 0 });
});