let enabled = true;
let blockedCount = 0;

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  if (!enabled) return;

  blockedCount++;
  chrome.storage.local.set({ blockedCount });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["block_ads"]
  });
  chrome.storage.local.set({ blockedCount: 0 });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.toggle !== undefined) {
    enabled = message.toggle;
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enabled ? ["block_ads"] : [],
      disableRulesetIds: enabled ? [] : ["block_ads"]
    });
  } else if (message.requestBlockedCount) {
    chrome.storage.local.get('blockedCount', (data) => {
      sendResponse({ blockedCount: data.blockedCount ?? 0 });
    });
    return true; 
  }
});
