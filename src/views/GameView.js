import { S, activeGame } from '../state/store.js';
import { renderStatStrip } from '../components/StatStrip.js';
import { renderQuestTab } from './QuestView.js';
import { renderLogList } from './LogView.js';
import { renderCharList } from './CharView.js';

export function renderGameScreen() {
  const g = activeGame(); if (!g) return;
  const tag = document.getElementById('game-chapter-tag');
  if (tag) tag.textContent = 'Ch.' + g.chapter.toString().padStart(2,'0') + ' · p.' + g.page.toString().padStart(3,'0');
  renderStatStrip(g);
  renderQuestTab(g);
  renderLogList();
  renderCharList();
}

export function switchTab(tab) {
  const g = activeGame(); if (!g) return;
  S.rt.tab = tab;
  ['story','quest','log','char'].forEach(t => {
    document.getElementById('tab-btn-' + t)?.classList.toggle('active', t === tab);
  });
  ['quest','log','char'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === tab ? 'flex' : 'none';
  });
  const storyEls = ['story-area','choices-area','sq-banner','game-top','game-stat-strip','stats-popup-btn'];
  storyEls.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = tab === 'story' ? '' : 'none'; });
  const mainNav = document.querySelector('#screen-game > .bottom-nav');
  if (mainNav) mainNav.style.display = tab === 'story' ? '' : 'none';
  if (tab === 'story') renderGameScreen();
  if (tab === 'quest') renderQuestTab(g);
  if (tab === 'log') renderLogList();
  if (tab === 'char') renderCharList();
}
