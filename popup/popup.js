const els = {
  globalStatus: document.getElementById('global-status'),
  siteStatus: document.getElementById('site-status'),
  siteToggle: document.getElementById('site-toggle'),
  globalToggle: document.getElementById('global-toggle'),
  allowlist: document.getElementById('allowlist')
};

function setBadge(el, state) {
  el.classList.remove('off','paused');
  switch (state) {
    case 'on': el.textContent = 'ACTIVE'; break;
    case 'off': el.textContent = 'OFF'; el.classList.add('off'); break;
    case 'paused': el.textContent = 'PAUSED'; el.classList.add('paused'); break;
    default: el.textContent = state;
  }
}

async function fetchState() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (resp) => {
      resolve(resp || { allowlist: [], globalEnabled: true });
    });
  });
}

function renderAllowlist(list, currentHost) {
  els.allowlist.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No sites yet';
    els.allowlist.appendChild(empty);
    return;
  }
  list.forEach(host => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = host;
    span.className = 'host';
    li.appendChild(span);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = host === currentHost ? 'Remove (This)' : 'Remove';
    btn.addEventListener('click', () => toggleSite(host));
    li.appendChild(btn);
    els.allowlist.appendChild(li);
  });
}

async function toggleSite(hostname) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SITE', hostname }, (resp) => {
      resolve(resp);
    });
  });
}

async function toggleGlobal() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_GLOBAL' }, (resp) => {
      resolve(resp);
    });
  });
}

async function init() {
  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    const state = await fetchState();
    const { allowlist, globalEnabled } = state;
    const siteAllowed = allowlist.includes(hostname);

    // Global badge
    setBadge(els.globalStatus, globalEnabled ? 'on' : 'off');
    els.globalToggle.setAttribute('aria-pressed', (!globalEnabled).toString());
    els.globalToggle.textContent = globalEnabled ? 'Pause Global' : 'Resume Global';

    // Site status
    if (!globalEnabled) {
      els.siteStatus.textContent = `Blocking paused globally`;
    } else {
      els.siteStatus.textContent = siteAllowed ? `Blocking is OFF on ${hostname}` : `Blocking is ON on ${hostname}`;
    }
    els.siteToggle.textContent = siteAllowed ? 'Enable Blocking Here' : 'Disable Blocking Here';
    els.siteToggle.setAttribute('aria-pressed', siteAllowed.toString());

    renderAllowlist(allowlist, hostname);

    els.siteToggle.onclick = async () => {
      const resp = await toggleSite(hostname);
      const updatedList = resp.allowlist || [];
      const nowAllowed = updatedList.includes(hostname);
      els.siteStatus.textContent = !globalEnabled ? `Blocking paused globally` : (nowAllowed ? `Blocking is OFF on ${hostname}` : `Blocking is ON on ${hostname}`);
      els.siteToggle.textContent = nowAllowed ? 'Enable Blocking Here' : 'Disable Blocking Here';
      els.siteToggle.setAttribute('aria-pressed', nowAllowed.toString());
      renderAllowlist(updatedList, hostname);
    };

    els.globalToggle.onclick = async () => {
      const resp = await toggleGlobal();
      const enabled = resp.globalEnabled;
      setBadge(els.globalStatus, enabled ? 'on' : 'off');
      els.globalToggle.textContent = enabled ? 'Pause Global' : 'Resume Global';
      els.globalToggle.setAttribute('aria-pressed', (!enabled).toString());
      // Update site status to reflect global change
      const siteAllowedNow = allowlist.includes(hostname);
      els.siteStatus.textContent = !enabled ? `Blocking paused globally` : (siteAllowedNow ? `Blocking is OFF on ${hostname}` : `Blocking is ON on ${hostname}`);
    };
  });
}

init();