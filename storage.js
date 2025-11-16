const storage = {
  getAllowlist: async () => {
    const result = await chrome.storage.local.get(['allowlist']);
    return result.allowlist || [];
  },

  getGlobalEnabled: async () => {
    const result = await chrome.storage.local.get(['globalEnabled']);
    // default true if unset
    return typeof result.globalEnabled === 'boolean' ? result.globalEnabled : true;
  },

  setGlobalEnabled: async (flag) => {
    await chrome.storage.local.set({ globalEnabled: !!flag });
  },

  toggleGlobal: async () => {
    const current = await storage.getGlobalEnabled();
    await storage.setGlobalEnabled(!current);
    return !current;
  },

  toggleSite: async (hostname) => {
    const allowlist = await storage.getAllowlist();
    const index = allowlist.indexOf(hostname);
    if (index > -1) {
      allowlist.splice(index, 1);
    } else {
      allowlist.push(hostname);
    }
    await chrome.storage.local.set({ allowlist });
    return allowlist;
  },

  isAllowed: async (hostname) => {
    const allowlist = await storage.getAllowlist();
    return allowlist.includes(hostname);
  }
};

if (typeof module !== 'undefined') module.exports = storage;
