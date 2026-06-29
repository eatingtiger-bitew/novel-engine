import { esc } from '../utils/escape.js';
import { toast } from '../utils/toast.js';

export function renderQuestTab(g) {
  const list = document.getElementById('quest-active-list');
  if (!list) return;
  list.innerHTML = '';
  const active = g.quests.filter(q => q.active);
  const sub = document.getElementById('quest-sub');
  if (sub) sub.textContent = '主線 ' + active.filter(q=>q.type==='main').length + ' 條 · 支線 ' + active.filter(q=>q.type!=='main').length + ' 條';
  if (!active.length) {
    list.innerHTML = '<div style="padding:14px 0;font-family:var(--mono);font-size:11px;color:var(--text-dim)">（暫無進行中任務）</div>';
    return;
  }
  active.forEach(q => {
    const card = document.createElement('div');
    const cls = q.type === 'main' ? 'qmain' : q.timed ? 'qtimed' : 'qside';
    card.className = 'quest-card ' + cls;
    card.innerHTML = '<div class="quest-type">' + (q.type==='main'?'◈ 主線':q.timed?'⏱ 限時支線':'◇ 支線') + '</div>'
      + '<div class="quest-title">' + esc(q.title) + '</div>'
      + '<div class="quest-desc">' + esc(q.desc||'') + '</div>'
      + '<div class="quest-footer"><span></span><button class="btn-quest-go" onclick="window._toast('繼續劇情請切回劇情頁')">詳情 →</button></div>';
    list.appendChild(card);
  });
}
