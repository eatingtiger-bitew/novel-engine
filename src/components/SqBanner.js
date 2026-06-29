import { S, activeGame, persist } from '../state/store.js';
import { esc, formatTime } from '../utils/escape.js';
import { generateStory } from '../engine/gameEngine.js';
import { renderQuestTab } from '../views/QuestView.js';

export function showSqBanner(sq, g) {
  S.rt.pendingSq = sq;
  const banner = document.getElementById('sq-banner');
  document.getElementById('sq-banner-title').textContent = sq.title;
  banner.style.display = 'flex';
  if (sq.timed) {
    let secs = sq.timerSecs || 300;
    document.getElementById('sq-banner-timer').textContent = formatTime(secs);
    if (S.rt.sqTimer) clearInterval(S.rt.sqTimer);
    S.rt.sqTimer = setInterval(() => {
      secs--;
      if (secs <= 0) {
        clearInterval(S.rt.sqTimer);
        banner.style.display = 'none';
        S.rt.pendingSq = null;
        return;
      }
      document.getElementById('sq-banner-timer').textContent = formatTime(secs);
    }, 1000);
  } else {
    document.getElementById('sq-banner-timer').textContent = '';
  }
}

export function showSqModal() {
  const sq = S.rt.pendingSq; if (!sq) return;
  const modal = document.getElementById('sq-modal');
  const badge = document.getElementById('sq-modal-badge');
  badge.textContent = sq.timed ? '⏱ 限時支線' : '◇ 支線任務';
  badge.className = 'modal-badge ' + (sq.timed ? 'badge-timed' : 'badge-side');
  document.getElementById('sq-modal-title').textContent = sq.title;
  document.getElementById('sq-modal-desc').textContent = sq.desc || '遭遇了新的支線任務。';
  const timerLine = document.getElementById('sq-modal-timer');
  timerLine.style.display = sq.timed ? '' : 'none';
  const rewardEl = document.getElementById('sq-modal-reward');
  if (sq.reward) { rewardEl.style.display = ''; document.getElementById('sq-modal-reward-text').textContent = sq.reward; }
  else rewardEl.style.display = 'none';
  modal.style.display = 'flex';
}

export function dismissSqModal() {
  document.getElementById('sq-modal').style.display = 'none';
}

export async function startSidequest() {
  const g = activeGame(); if (!g || !S.rt.pendingSq) return;
  dismissSqModal();
  document.getElementById('sq-banner').style.display = 'none';
  if (S.rt.sqTimer) { clearInterval(S.rt.sqTimer); S.rt.sqTimer = null; }
  g.savedMainState = { page: g.page, history: [...g.history], snapshot: { ...g.snapshot } };
  g.mode = 'side';
  const sq = S.rt.pendingSq;
  g.quests.push({ id: `q_${Date.now()}`, type: 'side', title: sq.title, desc: sq.desc, active: true, timed: false });
  S.rt.pendingSq = null;
  renderQuestTab(g);
  await generateStory(g, `[開始支線任務：${sq.title}] ${sq.desc}`);
}

export function returnToMain() {
  const g = (window._store && window._store.activeGame) ? window._store.activeGame() : null;
  if (g) g.mode = 'main';
  const renderGameScreen = window._views && window._views.renderGameScreen;
  if (renderGameScreen) renderGameScreen();
}
