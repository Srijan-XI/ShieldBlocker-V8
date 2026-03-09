// Promisified storage helpers (Chrome 88+ supports storage.local as a promise API,
// but we wrap callbacks for maximum compatibility and to add error logging).
const store = {
  get: (keys) => new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (data) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(data);
    });
  }),
  set: (items) => new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve();
    });
  }),
};

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_1'] });
    const data = await store.get(['globalEnabled']);
    if (typeof data.globalEnabled !== 'boolean') {
      await store.set({ globalEnabled: true });
    }
  } catch (e) {
    console.error('[ShieldBlocker] onInstalled error:', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return; // ignore malformed messages

  switch (msg.type) {
    case 'TOGGLE_SITE': {
      (async () => {
        try {
          const data = await store.get(['allowlist']);
          const allowlist = data.allowlist || [];
          const index = allowlist.indexOf(msg.hostname);
          const wasAllowed = index > -1;
          if (wasAllowed) {
            allowlist.splice(index, 1);
          } else {
            allowlist.push(msg.hostname);
          }
          await store.set({ allowlist });
          // Sync network-level allow rule — now actually invoked.
          await refreshDomainRules(msg.hostname, !wasAllowed);
          sendResponse({ status: 'ok', allowlist });
        } catch (e) {
          console.error('[ShieldBlocker] TOGGLE_SITE error:', e);
          sendResponse({ status: 'error', error: e.message });
        }
      })();
      return true;
    }
    case 'TOGGLE_GLOBAL': {
      (async () => {
        try {
          const data = await store.get(['globalEnabled']);
          const current = typeof data.globalEnabled === 'boolean' ? data.globalEnabled : true;
          const next = !current;
          await store.set({ globalEnabled: next });
          sendResponse({ status: 'ok', globalEnabled: next });
        } catch (e) {
          console.error('[ShieldBlocker] TOGGLE_GLOBAL error:', e);
          sendResponse({ status: 'error', error: e.message });
        }
      })();
      return true;
    }
    case 'GET_STATE': {
      (async () => {
        try {
          const data = await store.get(['allowlist', 'globalEnabled']);
          sendResponse({
            status: 'ok',
            allowlist: data.allowlist || [],
            globalEnabled: typeof data.globalEnabled === 'boolean' ? data.globalEnabled : true,
          });
        } catch (e) {
          console.error('[ShieldBlocker] GET_STATE error:', e);
          sendResponse({ status: 'error', allowlist: [], globalEnabled: true });
        }
      })();
      return true;
    }
    default:
      break;
  }
});

/**
 * Returns a stable, persistent numeric rule ID for a given hostname.
 * Stores a hostname→id mapping in local storage to avoid collisions
 * between hostnames that happen to share the same string length.
 */
async function getOrCreateRuleId(hostname) {
  const data = await store.get(['hostnameRuleIds']);
  const map = data.hostnameRuleIds || {};
  if (map[hostname]) return map[hostname];
  // Assign the next available ID above the static ruleset range.
  const existing = Object.values(map);
  const nextId = existing.length ? Math.max(...existing) + 1 : 9000;
  map[hostname] = nextId;
  await store.set({ hostnameRuleIds: map });
  return nextId;
}

/**
 * Adds or removes a dynamic declarativeNetRequest allow rule for a hostname.
 * Called every time the allowlist is toggled so network-level bypassing is live.
 */
async function refreshDomainRules(hostname, shouldAllow) {
  try {
    const ruleId = await getOrCreateRuleId(hostname);
    const toAdd = [];
    if (shouldAllow) {
      toAdd.push({
        id: ruleId,
        priority: 2, // higher than static block rules (priority 1)
        action: { type: 'allow' },
        condition: {
          requestDomains: [hostname],
          resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'stylesheet', 'font', 'media', 'other'],
        },
      });
    }
    // Always remove the old rule first so we never leave a stale entry.
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: toAdd,
    });
  } catch (e) {
    console.error('[ShieldBlocker] refreshDomainRules error:', e);
  }
}