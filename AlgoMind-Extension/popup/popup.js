/**
 * popup/popup.js — AlgoMind Extension Popup Logic
 * Reads state from chrome.storage.local and renders the UI.
 */

async function renderPopup() {
  const data = await chrome.storage.local.get('algomind_state');
  const state = data.algomind_state || { active: false, strikes: 0, partyCode: null };

  const badge          = document.getElementById('status-badge');
  const challengeSection = document.getElementById('challenge-section');
  const idleSection    = document.getElementById('idle-section');
  const partyCodeEl    = document.getElementById('party-code');
  const strikeEls      = document.querySelectorAll('.strike');

  if (state.active) {
    badge.textContent = 'Active';
    badge.className   = 'badge badge--active';
    challengeSection.classList.remove('hidden');
    idleSection.classList.add('hidden');

    partyCodeEl.textContent = state.partyCode || '—';

    strikeEls.forEach((el, i) => {
      el.classList.toggle('strike--active', i < state.strikes);
    });
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
