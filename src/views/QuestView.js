import { esc } from '../utils/escape.js';

export function renderQuestTab(g) {
  const list = document.getElementById('quest-active-list');
  if (!list) return;
  list.innerHTML = '';
  const active = g.quests.filter(q => q.active);
  const sub = document.getElementById('quest-sub');
  if (sub) sub.textContent = '主線 ' + active.filter(q => q.type === 'main').length + ' 條 · 支線 ' + active.filter(q => q.type !== 'main').length + ' 條';
  if (!active.length) {
    list.innerHTML = '<div style="padding:14px 0;font-family:var(--mono);font-size:11px;color:var(--text-dim)">（暫無進行中任務）</div>';
    return;
  }
  active.forEach(q => {
    const card = document.createElement('div');
    const cls = q.type === 'main' ? 'qmain' : q.timed ? 'qtimed' : 'qside';
    const typeLabel = q.type === 'main' ? '◈ 主線' : q.timed ? '⏱ 限時支線' : '◇ 支線';
    card.className = 'quest-card ' + cls;

    const title = document.createElement('div');
    title.className = 'quest-type';
    title.textContent = typeLabel;

    const qtitle = document.createElement('div');
    qtitle.className = 'quest-title';
    qtitle.textContent = q.title;

    const qdesc = document.createElement('div');
    qdesc.className = 'quest-desc';
    qdesc.textContent = q.desc || '';

    const footer = document.createElement('div');
    footer.className = 'quest-footer';

    const goBtn = document.createElement('button');
    goBtn.className = 'btn-quest-go';
    goBtn.textContent = '詳情 →';
    goBtn.onclick = () => {
      if (window.toast) window.toast('繼續劇情請切回劇情頁');
    };

    footer.appendChild(document.createElement('span'));
    footer.appendChild(goBtn);
    card.appendChild(title);
    card.appendChild(qtitle);
    card.appendChild(qdesc);
    card.appendChild(footer);
    list.appendChild(card);
  });
}
