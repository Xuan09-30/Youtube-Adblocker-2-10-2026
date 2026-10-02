// Intercept JSON.parse to catch initial page load variables (like ytInitialPlayerResponse)
const originalParse = JSON.parse;
JSON.parse = function() {
    const parsed = originalParse.apply(this, arguments);
    if (parsed && typeof parsed === 'object') {
        // Strip ad data from the parsed JSON
        if (parsed.playerAds) delete parsed.playerAds;
        if (parsed.adPlacements) delete parsed.adPlacements;
    }
    return parsed;
};

// Intercept fetch to strip ad data from dynamic XHR/fetch requests
const originalFetch = window.fetch;
window.fetch = async function() {
    const response = await originalFetch.apply(this, arguments);
    
    // Check if this is a request to YouTube's player API
    if (response.url && response.url.includes('/youtubei/v1/player')) {
        const clonedResponse = response.clone();
        try {
            const data = await clonedResponse.json();
            
            // Remove the ad segments from the payload
            if (data.playerAds) delete data.playerAds;
            if (data.adPlacements) delete data.adPlacements;
            
            // Return a mocked response containing the cleaned data
            return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch (e) {
            // If parsing fails, just return the original response
            return response;
        }
    }
    return response;
};