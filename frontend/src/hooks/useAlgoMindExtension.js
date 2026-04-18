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

import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const PING_TIMEOUT_MS   = 1500;   // Wait up to 1.5s for pong
const PULSE_INTERVAL_MS = 5000;   // Send backend pulse every 5s

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

/**
 * useExtensionPulse — sends a heartbeat POST to the backend every 5 seconds
 * during an active ranked challenge to confirm the extension is alive.
 *
 * If the pulse response returns { alive: false } (extension off / challenge ended),
 * calls onExtensionOff() so the caller can auto-forfeit.
 *
 * Usage:
 *   useExtensionPulse(partyCode, isRanked && view === 'room', handleForfeit);
 */
export function useExtensionPulse(partyCode, enabled, onExtensionOff) {
  const intervalRef = useRef(null);
  const missedRef   = useRef(0);       // consecutive missed pulses
  const MAX_MISSED  = 3;               // 3 × 5s = 15s without pulse → forfeit

  useEffect(() => {
    if (!enabled || !partyCode) return;

    async function sendPulse() {
      try {
        const res = await api.post(`/challenges/party/${partyCode}/pulse/`, {});
        if (res.alive === false) {
          // Challenge already ended server-side
          clearInterval(intervalRef.current);
          return;
        }
        missedRef.current = 0; // Reset on successful pulse
      } catch {
        // Network error or 4xx — count as missed
        missedRef.current++;
        if (missedRef.current >= MAX_MISSED && onExtensionOff) {
          clearInterval(intervalRef.current);
          onExtensionOff('Extension disconnected — pulse timeout');
        }
      }
    }

    // Send immediately, then on interval
    sendPulse();
    intervalRef.current = setInterval(sendPulse, PULSE_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [enabled, partyCode]); // eslint-disable-line react-hooks/exhaustive-deps
}
