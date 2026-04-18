/**
 * hooks/useAlgoMindExtension.js
 *
 * React hook to detect if the AlgoMind Fair Play extension is installed.
 *
 * Detection strategy (two methods, whichever responds first):
 *  1. DOM Sentinel — content script injects a hidden div with id="__algomind_extension_installed__"
 *  2. postMessage Ping — sends ALGOMIND_PING and awaits ALGOMIND_PONG response
 *
 * Usage:
 *   const { extensionInstalled, checking } = useAlgoMindExtension();
 */

import { useState, useEffect } from 'react';

const PING_TIMEOUT_MS = 1500; // Wait up to 1.5s for pong

export function useAlgoMindExtension() {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let resolved = false;
    let timer;

    function resolve(installed) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      setExtensionInstalled(installed);
      setChecking(false);
      window.removeEventListener('message', onMessage);
    }

    // Method 1: DOM Sentinel check (instant if content script already ran)
    const sentinel = document.getElementById('__algomind_extension_installed__');
    if (sentinel) {
      resolve(true);
      return;
    }

    // Method 2: postMessage ping
    function onMessage(event) {
      if (event.source !== window) return;
      if (event.data?.type === 'ALGOMIND_PONG') {
        resolve(true);
      }
    }

    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'ALGOMIND_PING' }, '*');

    // Timeout fallback — extension not detected
    timer = setTimeout(() => resolve(false), PING_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, []);

  return { extensionInstalled, checking };
}

/**
 * Dispatch challenge lifecycle events to the extension.
 */
export function dispatchChallengeStart(partyCode) {
  window.postMessage({ type: 'ALGOMIND_CHALLENGE_START', partyCode }, '*');
}

export function dispatchChallengeEnd() {
  window.postMessage({ type: 'ALGOMIND_CHALLENGE_END' }, '*');
}

/**
 * Listen for extension events sent to the React app.
 * Returns a cleanup function.
 *
 * Supported event types:
 *  - ALGOMIND_HEARTBEAT      → { timestamp }
 *  - ALGOMIND_VIOLATION      → { strikes, reason }
 *  - ALGOMIND_TRIGGER_FORFEIT → { reason }
 *  - ALGOMIND_EXTENSION_STATUS → { active, strikes }
 */
export function listenToExtension(callback) {
  function handler(event) {
    if (event.source !== window) return;
    const { type } = event.data || {};
    if (!type || !type.startsWith('ALGOMIND_')) return;
    callback(event.data);
  }
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
