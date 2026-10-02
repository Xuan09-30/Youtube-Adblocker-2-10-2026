// 1. Inject the network interceptor
const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

// 2. Load dynamic rules from storage
let rules = { skipSelectors: [".ytp-skip-ad-button"], adPlayerClasses: [".ad-showing"] };
chrome.storage.local.get(["rules"], (res) => {
  if (res.rules) rules = res.rules;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.rules) rules = changes.rules.newValue;
});

// 3. Listen for network intercepts from inject.js
window.addEventListener("message", (event) => {
  if (event.source === window && event.data?.type === "YT_AD_INTERCEPTED") {
    chrome.runtime.sendMessage({ action: "AD_BLOCKED" }).catch(() => {});
  }
});

// 4. Auto-skip DOM logic
let isHandling = false;

function handleAds() {
  // Grab the specific YouTube video player rather than just 'video' to avoid stale previews
  const video = document.querySelector(".html5-main-video");
  if (!video) return;

  const isAdShowing = rules.adPlayerClasses.some(cls => document.querySelector(cls));

  if (isAdShowing) {
    if (!isHandling) {
      isHandling = true;
      chrome.runtime.sendMessage({ action: "AD_BLOCKED" }).catch(() => {});
    }

    // Aggressive fast-forward: Mute it, speed it up to 16x, and jump to the end
    video.muted = true;
    video.playbackRate = 16;
    if (isFinite(video.duration) && video.duration > 0) {
      video.currentTime = video.duration - 0.1;
    }

    // Try clicking every skip button defined in your remote rules.json
    const skipSelectors = rules.skipSelectors.join(', ');
    const skipBtns = document.querySelectorAll(skipSelectors);
    skipBtns.forEach(btn => btn.click());
    
  } else {
    isHandling = false; 
  }
}

// 5. robust initialization: Observer + Interval + SPA Event
const observer = new MutationObserver(() => handleAds());
if (document.body) observer.observe(document.body, { childList: true, subtree: true });

// Fallback interval catches anything the observer misses
setInterval(handleAds, 500);

// Listen to YouTube's internal navigation event to reset state
window.addEventListener('yt-navigate-finish', () => {
    isHandling = false;
    handleAds();
});