// Runs at document_start — injects ad-hiding CSS before the page renders,
// preventing ad flash. A MutationObserver guards against pages that strip
// injected styles (common on some SPAs). CSS selectors apply to all current
// AND future matching elements automatically, so dynamic ads are covered.
(async function hideAdsConditionally() {
  try {
    const { allowlist, globalEnabled } = await chrome.storage.local.get(['allowlist', 'globalEnabled']);
    const isGlobalOn = typeof globalEnabled === 'boolean' ? globalEnabled : true;
    if (!isGlobalOn) return; // global blocking paused

    const hostname = location.hostname;
    if ((allowlist || []).includes(hostname)) return; // site is on allowlist

    // Targeted selectors — avoid over-broad patterns like [class*="banner"]
    // that hit legitimate site content (nav bars, news banners, etc.).
    const adSelectors = [
      // Google / network ad slots
      'ins.adsbygoogle',
      '[data-ad-slot]',
      '[data-ad-unit]',
      '[data-google-query-id]',
      '[id^="div-gpt-ad"]',
      '[id^="google_ads"]',
      // Generic ad container IDs/classes
      '[id^="ad-"]', '[id^="ad_"]', '#ad',
      '.ad-banner', '.ad-container', '.ad-wrapper',
      '.ad-block', '.ad-unit', '.ad-placement',
      '.advertisement', '.advertising',
      // Network-specific iframes
      'iframe[src*="doubleclick.net"]',
      'iframe[src*="googlesyndication.com"]',
      'iframe[src*="adnxs.com"]',
      // Sponsored content widgets
      '[class*="sponsored-content"]',
      '[class*="sponsored_content"]',
      '[data-testid*="sponsored"]',
    ];

    const css = `${adSelectors.join(',\n')} { display: none !important; }`;
    const STYLE_ID = 'shieldblocker-css';

    function injectStyle() {
      if (document.getElementById(STYLE_ID)) return; // already present
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
      // At document_start, documentElement is available; head may not be yet.
      (document.head || document.documentElement).appendChild(style);
    }

    // Inject immediately (before page DOM is parsed).
    injectStyle();

    // Guard: some pages remove injected styles. Re-inject if our tag disappears.
    const observer = new MutationObserver(injectStyle);
    const startObserver = () => {
      const target = document.head || document.documentElement;
      if (target) observer.observe(target, { childList: true });
    };

    if (document.head) {
      startObserver();
    } else {
      document.addEventListener('DOMContentLoaded', startObserver, { once: true });
    }
  } catch (_e) {
    // Fail silently — never break page scripts.
  }
})();
