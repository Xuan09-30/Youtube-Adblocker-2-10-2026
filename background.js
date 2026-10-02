// Default fallback rules in case the user has no internet on first launch
const DEFAULT_RULES = {
  skipSelectors: [".ytp-skip-ad-button", ".ytp-ad-skip-button-modern", "button[class*='skip']"],
  adPlayerClasses: [".ad-showing", ".ad-interrupting"]
};

// Function to fetch the latest rules from your GitHub repo
async function fetchRemoteRules() {
  try {
    // REPLACE this URL with the RAW url of your rules.json file on GitHub
    const response = await fetch("https://raw.githubusercontent.com/Xuan09-30/rules.json/refs/heads/main/rules.json");
    if (response.ok) {
      const rules = await response.json();
      chrome.storage.local.set({ rules: rules });
      console.log("YT Ad Skipper: Rules updated from GitHub", rules);
    }
  } catch (error) {
    console.log("YT Ad Skipper: Failed to fetch remote rules, using cached/defaults.");
  }
}

// Setup on install and browser startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["blockedCount", "rules"], (res) => {
    if (res.blockedCount === undefined) chrome.storage.local.set({ blockedCount: 0 });
    if (res.rules === undefined) chrome.storage.local.set({ rules: DEFAULT_RULES });
  });
  fetchRemoteRules();
});

chrome.runtime.onStartup.addListener(fetchRemoteRules);

// Keep the badge text updated
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedCount) {
    const count = changes.blockedCount.newValue || 0;
    const badgeText = count > 0 ? String(count) : "";
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  }
});

// Listen for intercepted ads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "AD_BLOCKED") {
    chrome.storage.local.get(["blockedCount"], (res) => {
      chrome.storage.local.set({ blockedCount: (res.blockedCount || 0) + 1 });
    });
  }
});