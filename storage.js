const storage = {
  getAllowlist: async () => {
    const result = await chrome.storage.local.get('allowlist');
    return result.allowlist || [];
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
  },

  isAllowed: async (hostname) => {
    const allowlist = await storage.getAllowlist();
    return allowlist.includes(hostname);
  }
};

if (typeof module !== 'undefined') module.exports = storage;
