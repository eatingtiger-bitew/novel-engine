import { S, activeGame, persist, resetNewGame } from '../state/store.js';
import { esc } from '../utils/escape.js';
import { toast } from '../utils/toast.js';
import { goTo } from '../router/index.js';

export function renderHome() {
  const list = document.getElementById('game-list');
  const label = document.getElementById('home-list-label');
  list.innerHTML = '';

  if (!S.games.length) {
    label.style.display = 'none';
    list.innerHTML = '<div class="home-empty">還沒有任何遊戲<br>點下方「✦ 新遊戲」開始你的第一個世界</div>';
    return;
  }
  label.style.display = '';
  S.games.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'game-card';
    btn.innerHTML = `
      <div class="game-icon">${g.icon || '📖'}</div>
      <div class="game-info">
        <div class="game-name">${esc(g.name)}</div>
        <div class="game-meta">${esc(g.meta || '尚未開始')}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="game-arrow">›</div>
        <button style="background:none;border:1px solid #442222;border-radius:6px;color:#884444;font-size:11px;padding:4px 8px;cursor:pointer;-webkit-appearance:none;flex-shrink:0"
          onclick="event.stopPropagation();window._deleteGame('${g.id}')">✕</button>
      </div>`;
    btn.onclick = () => { S.activeGameId = g.id; goTo('screen-game'); };
    list.appendChild(btn);
  });
}

export function deleteGame(id) {
  if (!confirm('確定要刪除這個遊戲嗎？此動作無法復原。')) return;
  S.games = S.games.filter(g => g.id !== id);
  if (S.activeGameId === id) S.activeGameId = null;
  persist();
  renderHome();
  toast('遊戲已刪除');
}
