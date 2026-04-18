/**
 * content/platforms.js — AlgoMind Platform Monitor
 *
 * Runs on LeetCode & Codeforces tabs.
 * Responsibilities:
 *  - Monitor navigation to restricted sections via MutationObserver + URL checks.
 *  - Inject in-page warning overlays when a violation is about to happen.
 *  - Relay violation details to the background service worker.
 */

const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AlgoMind Platform]', ...args);

// ─── Restricted Path Definitions ───────────────────────────────────────────────
const RESTRICTED = {
  'leetcode.com': ['/solutions', '/discuss', '/explore'],
  'codeforces.com': ['/blog', '/tutorial', '/gym'],
};

// ─── Determine Current Platform ────────────────────────────────────────────────
function currentPlatform() {
  const host = window.location.hostname;
  if (host.includes('leetcode.com')) return 'leetcode.com';
  if (host.includes('codeforces.com')) return 'codeforces.com';
  return null;
}

// ─── Check if Current URL is Restricted ────────────────────────────────────────
function isRestrictedPath(platform) {
  const path = window.location.pathname;
  return (RESTRICTED[platform] || []).some((r) => path.startsWith(r));
}

// ─── Overlay UI ────────────────────────────────────────────────────────────────
let overlayEl = null;

function showWarningOverlay(message) {
  if (overlayEl) return; // Don't duplicate
  overlayEl = document.createElement('div');
  overlayEl.id = 'algomind-violation-overlay';
  overlayEl.innerHTML = `
    <div class="algomind-overlay-inner">
      <div class="algomind-logo">⚠️ AlgoMind Fair Play</div>
      <div class="algomind-message">${message}</div>
      <div class="algomind-sub">Return to the problem tab immediately to avoid a strike.</div>
    </div>
  `;
  document.body.appendChild(overlayEl);
  log('Warning overlay shown.');
}

function hideWarningOverlay() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

// ─── Notify Background of Violation ────────────────────────────────────────────
function reportViolation(reason) {
  log('Reporting violation to BG:', reason);
  chrome.runtime.sendMessage({ type: 'ALGOMIND_PLATFORM_VIOLATION', reason });
}

// ─── Main Check Logic ───────────────────────────────────────────────────────────
function runCheck() {
  const platform = currentPlatform();
  if (!platform) return;

  if (isRestrictedPath(platform)) {
    const message = `🚫 This page (${window.location.pathname}) is restricted during an AlgoMind challenge.`;
    showWarningOverlay(message);
    reportViolation(`Visited restricted page: ${window.location.href}`);
  } else {
    hideWarningOverlay();
  }
}

// ─── URL Change Observer (SPA-safe) ────────────────────────────────────────────
let lastUrl = window.location.href;

// Monitor DOM mutations for SPA navigation changes
const observer = new MutationObserver(() => {
  const current = window.location.href;
  if (current !== lastUrl) {
    lastUrl = current;
    log('URL changed to:', current);
    runCheck();
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Also handle browser history API changes
window.addEventListener('popstate', runCheck);

// Override pushState/replaceState to catch programmatic navigation
const _push = history.pushState.bind(history);
const _replace = history.replaceState.bind(history);
history.pushState = (...args) => { _push(...args); runCheck(); };
history.replaceState = (...args) => { _replace(...args); runCheck(); };

// ─── Listen for Violation Count Updates from Background ────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ALGOMIND_VIOLATION') {
    const banner = document.createElement('div');
    banner.id = `algomind-strike-banner-${Date.now()}`;
    banner.className = 'algomind-strike-banner';
    banner.textContent = `⚡ AlgoMind Strike ${msg.strikes}/3 — ${msg.reason}`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
  }
});

// ─── Initial Check ─────────────────────────────────────────────────────────────
runCheck();
log('Platform monitor active on:', window.location.hostname);
