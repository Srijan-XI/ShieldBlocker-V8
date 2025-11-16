// Conditional ad hiding based on globalEnabled and allowlist membership.
(async function hideAdsConditionally() {
  try {
    const [{ allowlist, globalEnabled }] = await Promise.all([
      chrome.storage.local.get(['allowlist','globalEnabled'])
    ]);
    const isGlobalOn = typeof globalEnabled === 'boolean' ? globalEnabled : true;
    if (!isGlobalOn) return; // global paused

    const hostname = location.hostname;
    const list = allowlist || [];
    if (list.includes(hostname)) return; // site allowed

    const adSelectors = [
      '[id^="ad"]',
      '[class*="sponsored"]',
      '[class*="ads"]',
      '[class*="banner"]',
      'iframe[src*="ads"]',
      'div[class*="ad-"]'
    ];
    const style = document.createElement('style');
    style.textContent = `${adSelectors.join(',')} { display: none !important; }`;
    document.documentElement.appendChild(style);
  } catch (e) {
    // Fail silently; avoid breaking page scripts.
  }
})();