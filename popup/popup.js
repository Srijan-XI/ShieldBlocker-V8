const els = {
  globalStatus: document.getElementById('global-status'),
  siteStatus: document.getElementById('site-status'),
  siteToggle: document.getElementById('site-toggle'),
  globalToggle: document.getElementById('global-toggle'),
  allowlist: document.getElementById('allowlist'),
  errorBanner: document.getElementById('error-banner'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showError(msg) {
  if (!els.errorBanner) return;
  els.errorBanner.textContent = msg;
  els.errorBanner.hidden = false;
}

function setBadge(el, state) {
  el.classList.remove('off', 'paused');
  switch (state) {
    case 'on':     el.textContent = 'ACTIVE'; break;
    case 'off':    el.textContent = 'OFF';    el.classList.add('off'); break;
    case 'paused': el.textContent = 'PAUSED'; el.classList.add('paused'); break;
    default: el.textContent = state;
  }
}

/** Send a single message to the background service worker; rejects on error. */
function sendMsg(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (!resp || resp.status === 'error') {
        return reject(new Error((resp && resp.error) || 'Unknown background error'));
      }
      resolve(resp);
    });
  });
}

const fetchState  = ()         => sendMsg({ type: 'GET_STATE' });
const toggleSite  = (hostname) => sendMsg({ type: 'TOGGLE_SITE', hostname });
const toggleGlobal = ()        => sendMsg({ type: 'TOGGLE_GLOBAL' });

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderAllowlist(list, currentHost) {
  els.allowlist.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No sites yet';
    els.allowlist.appendChild(empty);
    return;
  }
  list.forEach(host => {
    const li   = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = host;
    span.className = 'host';
    span.title = host;
    li.appendChild(span);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = host === currentHost ? 'Remove (This)' : 'Remove';
    btn.addEventListener('click', () => handleRemove(host));
    li.appendChild(btn);
    els.allowlist.appendChild(li);
  });
}

/**
 * Render the full popup state from a single `state` object.
 * All UI updates go through here so there is one source of truth.
 */
function renderState(state, hostname) {
  const { allowlist, globalEnabled } = state;
  const siteAllowed = allowlist.includes(hostname);

  setBadge(els.globalStatus, globalEnabled ? 'on' : 'off');
  els.globalToggle.setAttribute('aria-pressed', String(!globalEnabled));
  els.globalToggle.textContent = globalEnabled ? 'Pause Global' : 'Resume Global';

  if (!globalEnabled) {
    els.siteStatus.textContent = 'Blocking paused globally';
  } else {
    els.siteStatus.textContent = siteAllowed
      ? `Blocking is OFF on ${hostname}`
      : `Blocking is ON on ${hostname}`;
  }

  els.siteToggle.textContent = siteAllowed ? 'Enable Blocking Here' : 'Disable Blocking Here';
  els.siteToggle.setAttribute('aria-pressed', String(siteAllowed));

  renderAllowlist(allowlist, hostname);
}

// ---------------------------------------------------------------------------
// Event handlers (declared at module scope so they can reference `state`)
// ---------------------------------------------------------------------------
let _hostname = '';

// Mutable state object — handlers mutate this in place so every handler
// always sees the latest values (fixes the stale-closure bug on globalToggle).
const state = { allowlist: [], globalEnabled: true };

async function handleToggleSite() {
  try {
    const resp = await toggleSite(_hostname);
    state.allowlist = resp.allowlist || [];
    renderState(state, _hostname);
  } catch (e) {
    showError('Failed to toggle site blocking: ' + e.message);
  }
}

async function handleToggleGlobal() {
  try {
    const resp = await toggleGlobal();
    state.globalEnabled = resp.globalEnabled;
    renderState(state, _hostname);
  } catch (e) {
    showError('Failed to toggle global blocking: ' + e.message);
  }
}

// Removing from the allowlist list is the same as toggling the site back on.
async function handleRemove(host) {
  try {
    const resp = await toggleSite(host);
    state.allowlist = resp.allowlist || [];
    renderState(state, _hostname);
  } catch (e) {
    showError('Failed to remove site: ' + e.message);
  }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

async function init() {
  try {
    const [tab] = await new Promise(resolve =>
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    );

    // Disable site toggle on pages where content scripts cannot run.
    if (!tab || !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      els.siteStatus.textContent = 'Not available on this page.';
      els.siteToggle.disabled = true;
      return;
    }

    _hostname = new URL(tab.url).hostname;

    const resp = await fetchState();
    state.allowlist    = resp.allowlist    || [];
    state.globalEnabled = resp.globalEnabled ?? true;

    renderState(state, _hostname);

    els.siteToggle.addEventListener('click', handleToggleSite);
    els.globalToggle.addEventListener('click', handleToggleGlobal);

  } catch (e) {
    showError('Could not connect to the extension. Try refreshing the page.');
    console.error('[ShieldBlocker] init error:', e);
  }
}

init();
