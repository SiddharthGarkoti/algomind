/**
 * popup/popup.js — AlgoMind Extension Popup Logic
 * Reads state from chrome.storage.local and renders the UI.
 */

async function renderPopup() {
  const data = await chrome.storage.local.get('algomind_state');
  const state = data.algomind_state || { active: false, strikes: 0, maxStrikes: 3, partyCode: null };

  const badge            = document.getElementById('status-badge');
  const challengeSection = document.getElementById('challenge-section');
  const idleSection      = document.getElementById('idle-section');
  const partyCodeEl      = document.getElementById('party-code');
  const pctEl            = document.getElementById('strike-pct');
  const barEl            = document.getElementById('strike-progress-bar');
  const ratioEl          = document.getElementById('strike-ratio');
  const statusEl         = document.getElementById('strike-status-text');

  if (state.active) {
    badge.textContent = 'Active';
    badge.className   = 'badge badge--active';
    challengeSection.classList.remove('hidden');
    idleSection.classList.add('hidden');

    partyCodeEl.textContent = state.partyCode || '—';

    const maxStrikes = Math.max(1, state.maxStrikes || 3);
    const strikes = Math.min(state.strikes || 0, maxStrikes);
    const pct = Math.min(100, Math.round((strikes / maxStrikes) * 100));

    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) {
      barEl.style.width = `${pct}%`;
      if (pct === 0) {
        barEl.style.background = 'linear-gradient(90deg, #10B981, #34D399)';
        barEl.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
      } else if (pct < 60) {
        barEl.style.background = 'linear-gradient(90deg, #F59E0B, #FBBF24)';
        barEl.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.4)';
      } else if (pct < 100) {
        barEl.style.background = 'linear-gradient(90deg, #F97316, #EF4444)';
        barEl.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
      } else {
        barEl.style.background = '#EF4444';
        barEl.style.boxShadow = '0 0 14px rgba(239, 68, 68, 0.8)';
      }
    }
    if (ratioEl) ratioEl.textContent = `${strikes} / ${maxStrikes} Strikes`;
    if (statusEl) {
      if (pct === 0) {
        statusEl.textContent = 'Clean';
        statusEl.style.color = '#10B981';
      } else if (pct < 60) {
        statusEl.textContent = 'Warning';
        statusEl.style.color = '#F59E0B';
      } else if (pct < 100) {
        statusEl.textContent = 'High Alert';
        statusEl.style.color = '#F97316';
      } else {
        statusEl.textContent = 'Limit Hit (OUT)';
        statusEl.style.color = '#EF4444';
      }
    }
  } else {
    badge.textContent = 'Inactive';
    badge.className   = 'badge badge--inactive';
    challengeSection.classList.add('hidden');
    idleSection.classList.remove('hidden');
  }
}

renderPopup();

// Refresh every 3 seconds while popup is open
setInterval(renderPopup, 3000);

// Listen for real-time updates from background
chrome.storage.onChanged.addListener((changes) => {
  if (changes.algomind_state) renderPopup();
});
