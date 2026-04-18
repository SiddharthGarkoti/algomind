/**
 * background.js — AlgoMind Fair Play Extension
 * Service Worker (Manifest V3)
 *
 * Responsibilities:
 *  - Manage challenge state (active/inactive)
 *  - Heartbeat via chrome.alarms (every 4 seconds)
 *  - Tab/window event listeners for violation detection
 *  - 3-Strike forfeit enforcement
 *  - Persist state via chrome.storage.local (MV3 service-worker may sleep)
 */

// ─── Debug Mode ────────────────────────────────────────────────────────────────
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AlgoMind BG]', ...args);

// ─── Constants ─────────────────────────────────────────────────────────────────
const HEARTBEAT_ALARM   = 'algomind_heartbeat';
const HEARTBEAT_PERIOD  = 0.067;   // ~4 seconds in minutes (MV3 minimum is ~1min but alarms fire more often with periodInMinutes < 1 only in dev; use workaround below)
const MAX_STRIKES       = 3;
const HEARTBEAT_INTERVAL_MS = 4000;

const RESTRICTED_PATHS = {
  'leetcode.com': ['/solutions', '/discuss', '/explore'],
  'codeforces.com': ['/blog', '/tutorial', '/gym'],
};

// ─── Initial State ─────────────────────────────────────────────────────────────
let state = {
  active: false,
  partyCode: null,
  strikes: 0,
  algomindTabId: null,         // Tab hosting AlgoMind app
  challengeTabIds: new Set(),  // LeetCode / Codeforces tabs
  lastHeartbeat: null,
};

// ─── Persistence Helpers ───────────────────────────────────────────────────────
async function saveState() {
  await chrome.storage.local.set({
    algomind_state: {
      active: state.active,
      partyCode: state.partyCode,
      strikes: state.strikes,
      algomindTabId: state.algomindTabId,
      challengeTabIds: [...state.challengeTabIds],
      lastHeartbeat: state.lastHeartbeat,
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
    };
    log('State restored from storage:', state);
  }
}

// ─── Challenge Lifecycle ───────────────────────────────────────────────────────
async function startChallenge(partyCode, senderTabId) {
  state.active = true;
  state.partyCode = partyCode;
  state.strikes = 0;
  state.algomindTabId = senderTabId;
  state.challengeTabIds = new Set();
  state.lastHeartbeat = Date.now();

  await saveState();
  scheduleHeartbeat();
  log('Challenge started:', partyCode);
  notifyAlgomindTab({ type: 'ALGOMIND_EXTENSION_STATUS', active: true, strikes: 0 });
}

async function stopChallenge() {
  state.active = false;
  state.partyCode = null;
  state.strikes = 0;
  state.challengeTabIds = new Set();

  chrome.alarms.clear(HEARTBEAT_ALARM);
  await saveState();
  log('Challenge stopped.');
}

// ─── Heartbeat ─────────────────────────────────────────────────────────────────
function scheduleHeartbeat() {
  chrome.alarms.clear(HEARTBEAT_ALARM);
  // MV3 minimum is 1 minute for persistent alarms; use storage polling as fallback
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  // Also use a synthetic interval via repeated alarms workaround:
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
  state.strikes++;
  log(`Violation #${state.strikes}: ${reason}`);
  await saveState();

  notifyAlgomindTab({ type: 'ALGOMIND_VIOLATION', strikes: state.strikes, reason });

  if (state.strikes >= MAX_STRIKES) {
    triggerForfeit('3 Violations');
    return;
  }

  // Show Chrome notification
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

// ─── Message to AlgoMind Tab ───────────────────────────────────────────────────
function notifyAlgomindTab(payload) {
  if (!state.algomindTabId) return;
  chrome.tabs.sendMessage(state.algomindTabId, payload, (resp) => {
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

  // Allowed tabs: AlgoMind app tab or coding platform tabs
  const isAlgomind = tabId === state.algomindTabId;
  const isChallengePlatform = url.includes('leetcode.com') || url.includes('codeforces.com');

  if (!isAlgomind && !isChallengePlatform) {
    recordViolation('Switched to an unrelated tab');
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  if (!state.active) return;
  // New blank tab or tab created mid-challenge = violation
  recordViolation('Opened a new tab during challenge');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!state.active) return;
  if (changeInfo.status !== 'complete') return;
  const url = tab.url || '';

  // Track coding platform tabs
  if (url.includes('leetcode.com') || url.includes('codeforces.com')) {
    state.challengeTabIds.add(tabId);
    saveState();
  }

  // Check restricted paths
  for (const [domain, paths] of Object.entries(RESTRICTED_PATHS)) {
    if (url.includes(domain)) {
      for (const p of paths) {
        if (url.includes(p)) {
          recordViolation(`Visited restricted page: ${url}`);
          return;
        }
      }
    }
  }
});

// ─── Window Focus Monitoring ───────────────────────────────────────────────────
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (!state.active) return;
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    recordViolation('Left the browser window');
  }
});

// ─── Message Listener (from content scripts) ───────────────────────────────────
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
      // Extension-installed ping response
      sendResponse({ type: 'ALGOMIND_PONG', installed: true });
      break;

    case 'ALGOMIND_STATE_REQUEST':
      sendResponse({ state: { active: state.active, strikes: state.strikes } });
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
