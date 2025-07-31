chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ['ruleset_1']
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOGGLE_SITE') {
    chrome.storage.local.get('allowlist', (data) => {
      const allowlist = data.allowlist || [];
      const index = allowlist.indexOf(msg.hostname);
      if (index > -1) allowlist.splice(index, 1);
      else allowlist.push(msg.hostname);
      chrome.storage.local.set({ allowlist }, () => sendResponse({ status: 'ok' }));
    });
    return true;
  }
});