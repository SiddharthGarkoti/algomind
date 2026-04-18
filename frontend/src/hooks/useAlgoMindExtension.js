/**
 * hooks/useAlgoMindExtension.js
 *
 * Extension detection, challenge lifecycle dispatchers, and the backend
 * pulse/strike hooks.
 */

import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const PING_TIMEOUT_MS   = 1500;
const PULSE_INTERVAL_MS = 5000;

// ── Extension detection ───────────────────────────────────────────────────────
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

    // Method 1: DOM sentinel (instant if content script already ran)
    if (document.getElementById('__algomind_extension_installed__')) {
      resolve(true);
      return;
    }

    // Method 2: postMessage ping
    function onMessage(event) {
      if (event.source !== window) return;
      if (event.data?.type === 'ALGOMIND_PONG') resolve(true);
    }

    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'ALGOMIND_PING' }, '*');
    timer = setTimeout(() => resolve(false), PING_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, []);

  return { extensionInstalled, checking };
}

// ── Lifecycle dispatchers ──────────────────────────────────────────────────────
export function dispatchChallengeStart(partyCode, maxStrikes = 3) {
  window.postMessage({ type: 'ALGOMIND_CHALLENGE_START', partyCode, maxStrikes }, '*');
}

export function dispatchChallengeEnd() {
  window.postMessage({ type: 'ALGOMIND_CHALLENGE_END' }, '*');
}

// ── Extension event listener ───────────────────────────────────────────────────
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

// ── Backend pulse (extension alive check) ─────────────────────────────────────
// Sends POST /party/<code>/pulse/ every 5s while in ranked room.
// After 3 consecutive failures → calls onExtensionOff (auto-forfeit).
export function useExtensionPulse(partyCode, enabled, onExtensionOff) {
  const intervalRef = useRef(null);
  const missedRef   = useRef(0);
  const MAX_MISSED  = 3;

  useEffect(() => {
    if (!enabled || !partyCode) return;

    async function sendPulse() {
      try {
        const res = await api.post(`/challenges/party/${partyCode}/pulse/`, {});
        if (res.alive === false) { clearInterval(intervalRef.current); return; }
        missedRef.current = 0;
      } catch {
        missedRef.current++;
        if (missedRef.current >= MAX_MISSED && onExtensionOff) {
          clearInterval(intervalRef.current);
          onExtensionOff('Extension disconnected — pulse timeout');
        }
      }
    }

    sendPulse();
    intervalRef.current = setInterval(sendPulse, PULSE_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [enabled, partyCode]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Backend strike reporter ────────────────────────────────────────────────────
// Called by ChallengesPage when it receives ALGOMIND_VIOLATION from the extension.
// Posts the strike to the backend so all participants see it in real-time.
// Returns { forfeited: bool, strikes: number }.
export async function reportStrikeToBackend(partyCode, reason) {
  try {
    return await api.post(`/challenges/party/${partyCode}/strike/`, { reason });
  } catch {
    return null;
  }
}
