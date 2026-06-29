import { S, activeGame } from '../state/store.js';
import { esc } from '../utils/escape.js';

export function setLogFilter(f) {
  S.rt.logFilter = f;
  ['all','main','side'].forEach(x => document.getElementById('chip-' + x)?.classList.toggle('active', x === f));
  renderLogList();
}

export function renderLogList() {
  const g = activeGame();
  const list = document.getElementById('log-list');
  if (!list) return;
  list.innerHTML = '';
  const q = document.getElementById('log-search')?.value.toLowerCase() || '';
  const f = S.rt.logFilter;
  const logs = (g?.logs || []).filter(l => {
    if (f !== 'all' && l.type !== f) return false;
    if (q && !l.title.toLowerCase().includes(q) && !(l.summary||'').toLowerCase().includes(q)) return false;
    return true;
  });
  const sub = document.getElementById('log-sub');
  if (sub) sub.textContent = logs.length + ' 筆記錄';
  if (!logs.length) {
    list.innerHTML = '<div style="padding:20px 0;font-family:var(--mono);font-size:11px;color:var(--text-dim);text-align:center">（暫無記錄）</div>';
    return;
  }
  logs.forEach(l => {
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (S.rt.openLogId === l.id ? ' open' : '');
    const tagsHtml = (l.tags||[]).map(t => '<span class="log-tag tag-' + esc(t) + '">' + esc(t) + '</span>').join('');
    const detailHtml = S.rt.openLogId === l.id
      ? '<div class="log-detail"><div class="detail-label">摘要</div><div class="detail-text">' + esc(l.summary||'—') + '</div></div>' : '';
    entry.innerHTML = '<div class="log-page">' + esc(l.page||'') + '</div>'
      + '<div class="log-title">' + esc(l.title) + '</div>'
      + '<div class="log-meta">' + esc(l.meta||'') + '</div>'
      + '<div class="log-tags">' + tagsHtml + '</div>' + detailHtml;
    entry.onclick = () => { S.rt.openLogId = S.rt.openLogId === l.id ? null : l.id; renderLogList(); };
    list.appendChild(entry);
  });
}
