(function hideAds() {
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
})();