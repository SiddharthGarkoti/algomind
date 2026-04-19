/**
 * content/algomind.js — AlgoMind Bridge Content Script
 *
 * Runs on the AlgoMind web app domain.
 * Bridges postMessage events from the React app ↔ extension background service worker.
 * Also injects a hidden DOM sentinel so the React app can detect extension presence.
 */

const DEBUG = false; // Set to true for local development
const log = (...args) => DEBUG && console.log('[AlgoMind CS]', ...args);

// ─── 1. Inject Extension Sentinel (for React detection) ────────────────────────
const sentinel = document.createElement('div');
sentinel.id = '__algomind_extension_installed__';
sentinel.style.display = 'none';
sentinel.setAttribute('data-version', '1.0.0');
document.documentElement.appendChild(sentinel);
log('Sentinel injected for React detection.');

// ─── 2. Listen for postMessage from React App ──────────────────────────────────
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin
  if (event.source !== window) return;

  const { type } = event.data || {};
  if (!type || !type.startsWith('ALGOMIND_')) return;

  log('Received postMessage from app:', event.data);

  switch (type) {
    case 'ALGOMIND_CHALLENGE_START':
      chrome.runtime.sendMessage(
        { type: 'ALGOMIND_CHALLENGE_START', partyCode: event.data.partyCode, maxStrikes: event.data.maxStrikes },
        (response) => log('BG response (start):', response)
      );
      break;

    case 'ALGOMIND_CHALLENGE_END':
      chrome.runtime.sendMessage(
        { type: 'ALGOMIND_CHALLENGE_END' },
        (response) => log('BG response (end):', response)
      );
      break;

    case 'ALGOMIND_PING':
      // React app is checking if the extension is installed — respond immediately via postMessage
      window.postMessage({ type: 'ALGOMIND_PONG', installed: true }, '*');
      break;

    default:
      break;
  }
});

// ─── 3. Forward Background → React App Messages ────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  log('Forwarding BG message to React:', msg);
  // Relay to the web app via postMessage
  window.postMessage(msg, '*');
});

// ─── 4. Respond to direct runtime pings (for popup) ───────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'ALGOMIND_PING') {
    sendResponse({ type: 'ALGOMIND_PONG', installed: true });
  }
});

log('AlgoMind bridge content script ready.');
