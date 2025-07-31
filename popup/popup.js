const statusText = document.getElementById('status');
const toggleBtn = document.getElementById('toggle');

chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  const url = new URL(tab.url);
  const hostname = url.hostname;

  const { allowlist } = await chrome.storage.local.get('allowlist') || { allowlist: [] };
  const isAllowed = allowlist && allowlist.includes(hostname);

  statusText.textContent = isAllowed ? `Blocking is OFF on ${hostname}` : `Blocking is ON on ${hostname}`;
  toggleBtn.textContent = isAllowed ? 'Enable Blocking' : 'Disable Blocking';

  toggleBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SITE', hostname }, () => {
      location.reload();
    });
  });
});