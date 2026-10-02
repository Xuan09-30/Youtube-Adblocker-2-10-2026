let interceptCooldown = false;

function reportAdStripped() {
  // Only report one ad stripped per 2 seconds to keep the counter accurate
  if (!interceptCooldown) {
    window.postMessage({ type: "YT_AD_INTERCEPTED" }, "*");
    interceptCooldown = true;
    setTimeout(() => { interceptCooldown = false; }, 2000); 
  }
}

const originalParse = JSON.parse;
JSON.parse = function() {
  const parsed = originalParse.apply(this, arguments);
  if (parsed && typeof parsed === "object") {
    if (parsed.playerAds || parsed.adPlacements) {
      delete parsed.playerAds;
      delete parsed.adPlacements;
      reportAdStripped();
    }
  }
  return parsed;
};

const originalFetch = window.fetch;
window.fetch = async function() {
  const response = await originalFetch.apply(this, arguments);

  if (response.url && response.url.includes("/youtubei/v1/player")) {
    const clonedResponse = response.clone();
    try {
      const data = await clonedResponse.json();
      if (data.playerAds || data.adPlacements) {
        delete data.playerAds;
        delete data.adPlacements;
        reportAdStripped();
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (e) {
      return response;
    }
  }
  return response;
};