// 1. Inject the interceptor script into the page's main world context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    this.remove(); // Clean up the script tag after it loads
};
(document.head || document.documentElement).appendChild(script);

// 2. DOM Manipulation: Auto-skip and fast-forward
function handleAds() {
    const video = document.querySelector('video');
    if (!video) return;

    // YouTube typically adds 'ad-showing' or 'ad-interrupting' to the player container
    const isAdShowing = document.querySelector('.ad-showing') || document.querySelector('.ad-interrupting');

    if (isAdShowing) {
        // Fast-forward the video to the end
        if (video.duration && !isNaN(video.duration)) {
            video.currentTime = video.duration;
        }
        
        // Auto-click the skip button if it is available in the DOM
        const skipButton = document.querySelector('.ytp-skip-ad-button');
        if (skipButton) {
            skipButton.click();
        }
    }
}

// 3. Set up the observer to watch for DOM changes (like a new ad loading)
const observer = new MutationObserver(() => {
    handleAds();
});

// Start observing once the document body is ready
function init() {
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        requestAnimationFrame(init);
    }
}

init();