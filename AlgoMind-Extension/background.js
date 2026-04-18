/**
 * background.js — AlgoMind Fair Play Extension
 * Service Worker (Manifest V3)
 *
 * Key guarantees:
 *  - max_strikes is synced from the backend challenge start payload
 *  - Every strike triggers a Chrome notification (not just the last)
 *  - 1500ms debounce prevents cascading events (onFocusChanged + onActivated
 *    + onCreated firing together) from registering multiple strikes
 *  - windowBlurred flag: only 1 strike for leaving browser, 0 for returning
 *  - 2s grace period for new tabs so opening LC/CF doesn't count as violation
 *  - Extension-disabled mid-challenge: if heartbeat misses 3 loops (~15s), forfeit
 */

const DEBUG = false;
const log   = (...a) => DEBUG && console.log('[AlgoMind BG]', ...a);

// ─── Constants ─────────────────────────────────────────────────────────────────
const HEARTBEAT_ALARM       = 'algomind_heartbeat';
const HEARTBEAT_INTERVAL_MS = 4000;
const NEW_TAB_GRACE_MS      = 2500;
const VIOLATION_DEBOUNCE_MS = 1500;   // Ignore a 2nd violation inside this window

// Whitelisted domains — switching to these is NEVER a violation
const WHITELISTED_DOMAINS = [
  'leetcode.com',
  'codeforces.com',
  'atcoder.jp',
];

// Paths restricted even on whitelisted platforms
const RESTRICTED_PATHS = {
  'leetcode.com':   ['/solutions', '/discuss', '/explore', '/companies'],
  'codeforces.com': ['/blog', '/tutorial'],
};

// ─── State ─────────────────────────────────────────────────────────────────────
let state = {
  active:          false,
  partyCode:       null,
  strikes:         0,
  maxStrikes:      3,          // overridden from challenge start payload
  algomindTabId:   null,
  challengeTabIds: new Set(),
  lastHeartbeat:   null,
  windowBlurred:   false,      // true = browser already flagged once for this blur
  pendingTabIds:   new Set(),  // tabs in grace period
  lastViolationAt: 0,          // timestamp of last recorded violation (for debounce)
};

// ─── Persistence ───────────────────────────────────────────────────────────────
async function saveState() {
  await chrome.storage.local.set({
    algomind_state: {
      active:          state.active,
      partyCode:       state.partyCode,
      strikes:         state.strikes,
      maxStrikes:      state.maxStrikes,
      algomindTabId:   state.algomindTabId,
      challengeTabIds: [...state.challengeTabIds],
      lastHeartbeat:   state.lastHeartbeat,
      windowBlurred:   state.windowBlurred,
      lastViolationAt: state.lastViolationAt,
    },
  });
}

async function loadState() {
  const data = await chrome.storage.local.get('algomind_state');
  if (data.algomind_state) {
    const s = data.algomind_state;
    state = {
      ...s,
      challengeTabIds: new Set(s.challengeTabIds || []),
      pendingTabIds:   new Set(),
    };
    log('State restored:', state);
  }
}

// ─── Challenge Lifecycle ───────────────────────────────────────────────────────
async function startChallenge(partyCode, maxStrikes, senderTabId) {
  state.active          = true;
  state.partyCode       = partyCode;
  state.strikes         = 0;
  state.maxStrikes      = maxStrikes || 3;
  state.algomindTabId   = senderTabId;
  state.challengeTabIds = new Set();
  state.lastHeartbeat   = Date.now();
  state.windowBlurred   = false;
  state.pendingTabIds   = new Set();
  state.lastViolationAt = 0;
  await saveState();
  scheduleHeartbeat();
  log('Challenge started:', partyCode, 'maxStrikes:', state.maxStrikes);
  notifyAlgomindTab({ type: 'ALGOMIND_EXTENSION_STATUS', active: true, strikes: 0 });
}

async function stopChallenge() {
  state.active          = false;
  state.partyCode       = null;
  state.strikes         = 0;
  state.challengeTabIds = new Set();
  state.windowBlurred   = false;
  state.pendingTabIds   = new Set();
  state.lastViolationAt = 0;
  chrome.alarms.clear(HEARTBEAT_ALARM);
  if (heartbeatTimer) { clearTimeout(heartbeatTimer); heartbeatTimer = null; }
  await saveState();
  log('Challenge stopped.');
}

// ─── Heartbeat ─────────────────────────────────────────────────────────────────
function scheduleHeartbeat() {
  chrome.alarms.clear(HEARTBEAT_ALARM);
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  runHeartbeatLoop();
}

let heartbeatTimer     = null;
let heartbeatMissCount = 0;
const MAX_MISSED_BEATS = 3;   // 3 × 4s = 12s with no heartbeat → extension was killed

function runHeartbeatLoop() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer);
  if (!state.active) return;

  state.lastHeartbeat  = Date.now();
  heartbeatMissCount   = 0;   // reset: we are running, not dead
  saveState();
  notifyAlgomindTab({ type: 'ALGOMIND_HEARTBEAT', timestamp: state.lastHeartbeat });
  log('Heartbeat:', state.lastHeartbeat);

  heartbeatTimer = setTimeout(runHeartbeatLoop, HEARTBEAT_INTERVAL_MS);
}

// The extension being killed/disabled means the service worker dies — it can't
// detect its own death. Instead the FRONTEND useExtensionPulse hook detects
// missed pulse responses and calls /party/<code>/strike/ directly.
// However, if the alarm fires but the service worker wakes up and the challenge
// is still marked active but heartbeats have been missed, we know time has passed.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEARTBEAT_ALARM && state.active) {
    runHeartbeatLoop();
  }
});

// ─── Violation / Strike System ─────────────────────────────────────────────────
async function recordViolation(reason) {
  if (!state.active) return;
  if (state.strikes >= state.maxStrikes) return;

  // Debounce — ignore rapid duplicate events (e.g., focus+activated+created)
  const now = Date.now();
  if (now - state.lastViolationAt < VIOLATION_DEBOUNCE_MS) {
    log('Violation debounced:', reason);
    return;
  }
  state.lastViolationAt = now;
  state.strikes++;
  log(`Violation #${state.strikes}/${state.maxStrikes}: ${reason}`);
  await saveState();

  // Notify React app so it can call /party/<code>/strike/ and refresh UI
  notifyAlgomindTab({ type: 'ALGOMIND_VIOLATION', strikes: state.strikes, reason });

  // Auto-forfeit when max reached
  if (state.strikes >= state.maxStrikes) {
    setTimeout(() => triggerForfeit(`${state.maxStrikes} violations — fair play forfeited`), 600);
    return;
  }

  // Chrome notification for EVERY strike
  const remaining = state.maxStrikes - state.strikes;
  chrome.notifications.create(`strike_${now}`, {
    type:     'basic',
    iconUrl:  'icons/icon48.png',
    title:    `⚠️ AlgoMind Strike ${state.strikes}/${state.maxStrikes}`,
    message:  remaining === 1
      ? `Final warning! ${reason}. Next violation = auto-forfeit.`
      : `${reason}. ${remaining} violation${remaining > 1 ? 's' : ''} left before forfeit.`,
    priority: 2,
  });
}

async function triggerForfeit(reason) {
  if (!state.active) return;
  log('Auto-forfeit:', reason);
  notifyAlgomindTab({ type: 'ALGOMIND_TRIGGER_FORFEIT', reason });
  chrome.notifications.create(`forfeit_${Date.now()}`, {
    type:     'basic',
    iconUrl:  'icons/icon48.png',
    title:    '❌ AlgoMind — Auto Forfeited',
    message:  `Auto-forfeited. Reason: ${reason}`,
    priority: 2,
  });
  await stopChallenge();
}

// ─── URL Helpers ───────────────────────────────────────────────────────────────
function isWhitelistedUrl(url) {
  if (!url) return false;
  return WHITELISTED_DOMAINS.some(d => url.includes(d));
}

function isRestrictedUrl(url) {
  if (!url) return false;
  for (const [domain, paths] of Object.entries(RESTRICTED_PATHS)) {
    if (url.includes(domain)) {
      if (paths.some(p => url.includes(p))) return true;
    }
  }
  return false;
}

function isAlgomindUrl(url) {
  if (!url) return false;
  // localhost dev or deployed Render URL
  return url.includes('localhost') || url.includes('algomind') || url.includes('onrender.com');
}

// ─── Send to AlgoMind Tab ──────────────────────────────────────────────────────
function notifyAlgomindTab(payload) {
  if (!state.algomindTabId) return;
  chrome.tabs.sendMessage(state.algomindTabId, payload, () => {
    if (chrome.runtime.lastError) log('Tab msg fail:', chrome.runtime.lastError.message);
  });
}

// ─── Tab Listeners ─────────────────────────────────────────────────────────────

// onActivated fires when user switches to a tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!state.active) return;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;

  const url = tab.url || '';
  log('Tab activated:', tabId, url);

  // AlgoMind tab itself — always fine
  if (tabId === state.algomindTabId) return;
  if (isAlgomindUrl(url)) return;

  // Whitelisted coding platforms — never a violation unless restricted path
  if (isWhitelistedUrl(url)) {
    if (isRestrictedUrl(url)) recordViolation(`Restricted page opened: ${new URL(url).pathname}`);
    return;
  }

  // Tab is in grace period (just created — may navigate to LC/CF soon)
  if (state.pendingTabIds.has(tabId)) return;

  // Empty/new-tab/chrome:// pages — ignore
  if (!url || url.startsWith('chrome://') || url === 'about:blank') return;

  recordViolation('Switched to unrelated tab');
});

// onCreated: new tab opened
chrome.tabs.onCreated.addListener((tab) => {
  if (!state.active) return;

  // Add to grace period
  state.pendingTabIds.add(tab.id);
  log('New tab grace:', tab.id);

  setTimeout(async () => {
    if (!state.pendingTabIds.has(tab.id)) return;
    state.pendingTabIds.delete(tab.id);

    const fresh = await chrome.tabs.get(tab.id).catch(() => null);
    if (!fresh) return;

    const url = fresh.url || '';
    if (isAlgomindUrl(url)) return;
    if (isWhitelistedUrl(url)) return;
    if (!url || url.startsWith('chrome://') || url === 'about:blank') return;

    recordViolation('Opened unrelated tab during challenge');
  }, NEW_TAB_GRACE_MS);
});

// onUpdated: track when a pending tab resolves its URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!state.active) return;
  if (changeInfo.status !== 'complete') return;

  const url = tab.url || '';

  // If the pending tab navigated to a platform, clear it from grace
  if (state.pendingTabIds.has(tabId) && isWhitelistedUrl(url)) {
    state.pendingTabIds.delete(tabId);
    state.challengeTabIds.add(tabId);
    saveState();
    log('Pending tab resolved to platform:', tabId, url);
    return;
  }

  // Track coding platform tabs
  if (isWhitelistedUrl(url)) {
    state.challengeTabIds.add(tabId);
    saveState();
  }

  // Navigated to restricted path on a platform
  if (isRestrictedUrl(url)) {
    recordViolation(`Restricted page: ${url}`);
  }
});

// ─── Window Focus ───────────────────────────────────────────────────────────────
// FIX: windowBlurred flag guarantees exactly 1 strike for losing focus,
// and 0 additional strikes for regaining it.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (!state.active) return;

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (!state.windowBlurred) {
      state.windowBlurred = true;
      saveState();
      recordViolation('Left the browser window');
    }
  } else {
    // Focus regained — clear flag, no penalty
    if (state.windowBlurred) {
      state.windowBlurred = false;
      saveState();
      log('Window focus regained — no strike.');
    }
  }
});

// ─── Message Listener ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  log('Message:', msg.type);

  switch (msg.type) {
    case 'ALGOMIND_CHALLENGE_START':
      startChallenge(
        msg.partyCode,
        msg.maxStrikes || 3,
        sender.tab?.id,
      );
      sendResponse({ status: 'ok' });
      break;

    case 'ALGOMIND_CHALLENGE_END':
      stopChallenge();
      sendResponse({ status: 'ok' });
      break;

    case 'ALGOMIND_PING':
      sendResponse({ type: 'ALGOMIND_PONG', installed: true });
      break;

    case 'ALGOMIND_STATE_REQUEST':
      sendResponse({ state: { active: state.active, strikes: state.strikes, maxStrikes: state.maxStrikes } });
      break;

    case 'ALGOMIND_PULSE_ACK':
      sendResponse({ alive: state.active });
      break;

    default:
      break;
  }
  return true;
});

// ─── Startup ───────────────────────────────────────────────────────────────────
(async () => {
  await loadState();
  if (state.active) {
    log('Resuming active challenge after service worker restart.');
    runHeartbeatLoop();
  }
})();
