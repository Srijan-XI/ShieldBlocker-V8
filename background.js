chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_1'] });
  chrome.storage.local.get(['globalEnabled'], (data) => {
    if (typeof data.globalEnabled !== 'boolean') {
      chrome.storage.local.set({ globalEnabled: true });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return; // ignore malformed messages

  switch (msg.type) {
    case 'TOGGLE_SITE': {
      chrome.storage.local.get('allowlist', (data) => {
        const allowlist = data.allowlist || [];
        const index = allowlist.indexOf(msg.hostname);
        if (index > -1) allowlist.splice(index, 1); else allowlist.push(msg.hostname);
        chrome.storage.local.set({ allowlist }, () => sendResponse({ status: 'ok', allowlist }));
      });
      return true;
    }
    case 'TOGGLE_GLOBAL': {
      chrome.storage.local.get('globalEnabled', (data) => {
        const current = typeof data.globalEnabled === 'boolean' ? data.globalEnabled : true;
        const next = !current;
        chrome.storage.local.set({ globalEnabled: next }, () => sendResponse({ status: 'ok', globalEnabled: next }));
      });
      return true;
    }
    case 'GET_STATE': {
      chrome.storage.local.get(['allowlist','globalEnabled'], (data) => {
        sendResponse({
          status: 'ok',
          allowlist: data.allowlist || [],
          globalEnabled: typeof data.globalEnabled === 'boolean' ? data.globalEnabled : true
        });
      });
      return true;
    }
    default:
      break;
  }
});

async function refreshDomainRules(hostname, allowed) {
  const toRemove = [];
  const toAdd = [];
  if (allowed) {
    // Add an allow rule
    toAdd.push({
      id: 5000 + hostname.length, // deterministic but better: hash
      priority: 1,
      action: { type: 'allow' },
      condition: { domains: [hostname] }
    });
  } else {
    // Remove allow rule if exists
    // Determine id logic (store mapping in storage)
    toRemove.push(5000 + hostname.length);
  }
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: toRemove, addRules: toAdd });
}