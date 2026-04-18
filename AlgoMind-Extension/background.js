/**
 * background.js — AlgoMind Fair Play Extension
 * Service Worker (Manifest V3)
 *
 * Responsibilities:
 *  - Manage challenge state (active/inactive)
 *  - Heartbeat via self-rescheduling setTimeout (MV3 workaround)
 *  - Tab/window event listeners for violation detection
 *  - 3-Strike forfeit enforcement
 *  - Persist state via chrome.storage.local (MV3 service-worker may sleep)
 */

// ─── Debug Mode ────────────────────────────────────────────────────────────────
const DEBUG = false; // Set to true for local development
const log = (...args) => DEBUG && console.log('[AlgoMind BG]', ...args);

// ─── Constants ─────────────────────────────────────────────────────────────────
const HEARTBEAT_ALARM       = 'algomind_heartbeat';
const MAX_STRIKES           = 3;
const HEARTBEAT_INTERVAL_MS = 4000;

// Whitelisted domains — switching to these tabs is NEVER a violation
const WHITELISTED_DOMAINS = ['leetcode.com', 'codeforces.com'];

// Paths that ARE restricted even on whitelisted domains
const RESTRICTED_PATHS = {
  'leetcode.com':   ['/solutions', '/discuss', '/explore'],
  'codeforces.com': ['/blog', '/tutorial', '/gym'],
};

// Grace period (ms) for newly created tabs — gives the browser time to navigate
// to a platform URL before we decide it's a "random tab"
const NEW_TAB_GRACE_MS = 2000;

// ─── Initial State ─────────────────────────────────────────────────────────────
let state = {
  active:           false,
  partyCode:        null,
  strikes:          0,
  algomindTabId:    null,          // Tab hosting AlgoMind app
  challengeTabIds:  new Set(),     // LeetCode / Codeforces tabs
  lastHeartbeat:    null,
  windowBlurred:    false,         // FIX: track blur state to prevent double-strike
  pendingTabIds:    new Set(),     // FIX: tabs in grace period (just created, URL loading)
};

// ─── Persistence Helpers ───────────────────────────────────────────────────────
async function saveState() {
  await chrome.storage.local.set({
    algomind_state: {
      active:          state.active,
      partyCode:       state.partyCode,
      strikes:         state.strikes,
      algomindTabId:   state.algomindTabId,
      challengeTabIds: [...state.challengeTabIds],
      lastHeartbeat:   state.lastHeartbeat,
      windowBlurred:   state.windowBlurred,
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
      windowBlurred:   s.windowBlurred || false,
      pendingTabIds:   new Set(),
    };
    log('State restored from storage:', state);
  }
}

// ─── Challenge Lifecycle ───────────────────────────────────────────────────────
async function startChallenge(partyCode, senderTabId) {
  state.active          = true;
  state.partyCode       = partyCode;
  state.strikes         = 0;          // Always reset to 0 on start — never pre-populate
  state.algomindTabId   = senderTabId;
  state.challengeTabIds = new Set();
  state.lastHeartbeat   = Date.now();
  state.windowBlurred   = false;
  state.pendingTabIds   = new Set();

  await saveState();
  scheduleHeartbeat();
  log('Challenge started:', partyCode);
  notifyAlgomindTab({ type: 'ALGOMIND_EXTENSION_STATUS', active: true, strikes: 0 });
}

async function stopChallenge() {
  state.active        = false;
  state.partyCode     = null;
  state.strikes       = 0;
  state.challengeTabIds = new Set();
  state.windowBlurred   = false;
  state.pendingTabIds   = new Set();

  chrome.alarms.clear(HEARTBEAT_ALARM);
  await saveState();
  log('Challenge stopped.');
}

// ─── Heartbeat ─────────────────────────────────────────────────────────────────
function scheduleHeartbeat() {
  chrome.alarms.clear(HEARTBEAT_ALARM);
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  runHeartbeatLoop();
}

let heartbeatTimer = null;
function runHeartbeatLoop() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer);
  if (!state.active) return;

  state.lastHeartbeat = Date.now();
  saveState();
  notifyAlgomindTab({ type: 'ALGOMIND_HEARTBEAT', timestamp: state.lastHeartbeat });
  log('Heartbeat sent:', state.lastHeartbeat);

  heartbeatTimer = setTimeout(runHeartbeatLoop, HEARTBEAT_INTERVAL_MS);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEARTBEAT_ALARM && state.active) {
    runHeartbeatLoop();
  }
});

// ─── Violation / Strike System ─────────────────────────────────────────────────
async function recordViolation(reason) {
  if (!state.active) return;

  // FIX: Hard-cap strikes at MAX_STRIKES — never allow skipping
  if (state.strikes >= MAX_STRIKES) return;

  state.strikes++;
  log(`Violation #${state.strikes}: ${reason}`);
  await saveState();

  notifyAlgomindTab({ type: 'ALGOMIND_VIOLATION', strikes: state.strikes, reason });

  if (state.strikes >= MAX_STRIKES) {
    // Give a brief moment for the violation notification to be received before forfeit
    setTimeout(() => triggerForfeit('3 Violations — Fair Play Enforcement'), 500);
    return;
  }

  // Show Chrome notification for strike 1 and 2
  chrome.notifications.create(`strike_${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: `⚠️ AlgoMind Warning — Strike ${state.strikes}/${MAX_STRIKES}`,
    message:
      state.strikes === 1
        ? `Warning! ${reason}. Two more violations will forfeit you.`
        : `Final Warning! ${reason}. Next violation forfeits you automatically.`,
    priority: 2,
  });
}

async function triggerForfeit(reason) {
  if (!state.active) return; // Guard against double-trigger
  log('Auto-forfeit triggered:', reason);
  notifyAlgomindTab({ type: 'ALGOMIND_TRIGGER_FORFEIT', reason });
  chrome.notifications.create(`forfeit_${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '❌ AlgoMind — Auto Forfeited',
    message: `You have been auto-forfeited. Reason: ${reason}`,
    priority: 2,
  });
  await stopChallenge();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function isWhitelistedUrl(url) {
  return WHITELISTED_DOMAINS.some(d => url.includes(d));
}

function isRestrictedUrl(url) {
  for (const [domain, paths] of Object.entries(RESTRICTED_PATHS)) {
    if (url.includes(domain)) {
      for (const p of paths) {
        if (url.includes(p)) return true;
      }
    }
  }
  return false;
}

// ─── Message to AlgoMind Tab ───────────────────────────────────────────────────
function notifyAlgomindTab(payload) {
  if (!state.algomindTabId) return;
  chrome.tabs.sendMessage(state.algomindTabId, payload, () => {
    if (chrome.runtime.lastError) {
      log('Could not reach AlgoMind tab:', chrome.runtime.lastError.message);
    }
  });
}

// ─── Tab Monitoring ────────────────────────────────────────────────────────────
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!state.active) return;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;

  const url = tab.url || '';

  // AlgoMind tab itself — always allowed
  if (tabId === state.algomindTabId) return;

  // Whitelisted: LeetCode/Codeforces — always allowed (user is solving problems)
  if (isWhitelistedUrl(url)) {
    // But check for restricted paths within the platform
    if (isRestrictedUrl(url)) {
      recordViolation(`Visited restricted page on ${url}`);
    }
    return;
  }

  // FIX: Tab in grace period (just created, URL still loading) — don't penalise yet
  if (state.pendingTabIds.has(tabId)) return;

  // All other tabs = violation
  recordViolation('Switched to an unrelated tab');
});

chrome.tabs.onCreated.addListener((tab) => {
  if (!state.active) return;

  // FIX: Add to grace period. Give the tab 2 seconds to navigate to a platform URL.
  // If after 2 seconds the tab isn't on a platform, THEN record the violation.
  state.pendingTabIds.add(tab.id);
  setTimeout(async () => {
    if (!state.pendingTabIds.has(tab.id)) return; // Already resolved
    state.pendingTabIds.delete(tab.id);

    const freshTab = await chrome.tabs.get(tab.id).catch(() => null);
    if (!freshTab) return; // Tab was closed

    const url = freshTab.url || '';
    const isAlgomind = freshTab.id === state.algomindTabId;
    const isPlatform = isWhitelistedUrl(url);

    if (!isAlgomind && !isPlatform) {
      recordViolation('Opened an unrelated new tab during challenge');
    }
  }, NEW_TAB_GRACE_MS);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!state.active) return;
  if (changeInfo.status !== 'complete') return;
  const url = tab.url || '';

  // If a pending tab navigated to a platform, clear it from grace-period
  if (state.pendingTabIds.has(tabId) && isWhitelistedUrl(url)) {
    state.pendingTabIds.delete(tabId);
  }

  // Track coding platform tabs
  if (isWhitelistedUrl(url)) {
    state.challengeTabIds.add(tabId);
    saveState();
  }

  // Check restricted paths on platform tabs
  if (isRestrictedUrl(url)) {
    recordViolation(`Visited restricted page: ${url}`);
  }
});

// ─── Window Focus Monitoring ───────────────────────────────────────────────────
// FIX: Use a blurred-flag so we record exactly 1 strike when leaving the window,
// and 0 strikes when returning to it.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (!state.active) return;

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus entirely — record one strike
    if (!state.windowBlurred) {
      state.windowBlurred = true;
      saveState();
      recordViolation('Left the browser window');
    }
  } else {
    // Browser regained focus — clear blur flag, NO additional strike
    state.windowBlurred = false;
    saveState();
    log('Window focus regained — no strike.');
  }
});

// ─── Message Listener (from content scripts + React frontend) ──────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  log('Message received:', msg);

  switch (msg.type) {
    case 'ALGOMIND_CHALLENGE_START':
      startChallenge(msg.partyCode, sender.tab?.id);
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
      sendResponse({ state: { active: state.active, strikes: state.strikes } });
      break;

    // Backend heartbeat pulse ACK — frontend sends this every 5s to confirm
    // the extension is still alive. The frontend is responsible for calling
    // the backend /party/<code>/pulse/ endpoint. This message is the extension
    // confirming it is still active so the frontend knows to send the pulse.
    case 'ALGOMIND_PULSE_ACK':
      sendResponse({ alive: state.active });
      break;

    default:
      break;
  }

  return true; // Keep message channel open for async responses
});

// ─── Startup: Restore State ────────────────────────────────────────────────────
(async () => {
  await loadState();
  if (state.active) {
    log('Challenge was active before sleep. Resuming heartbeat.');
    runHeartbeatLoop();
  }
})();
