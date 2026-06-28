import { S, activeGame } from '../state/store.js';
import { esc } from '../utils/escape.js';

export function setCharFilter(f) {
  S.rt.charFilter = f;
  ['all','ally','threat'].forEach(x => document.getElementById('chip-char-' + x)?.classList.toggle('active', x === f));
  renderCharList();
}

export function renderCharList() {
  const g = activeGame();
  const list = document.getElementById('char-list');
  if (!list) return;
  list.innerHTML = '';
  const q = document.getElementById('char-search')?.value.toLowerCase() || '';
  const f = S.rt.charFilter;
  const chars = (g?.characters || []).filter(c => {
    if (f === 'threat' && c.relation !== '威脅') return false;
    if (f === 'ally' && c.relation === '威脅') return false;
    if (q && !c.name.toLowerCase().includes(q)) return false;
    return true;
  });
  const sub = document.getElementById('char-sub');
  if (sub) sub.textContent = '已認識 ' + (g?.characters?.length||0) + ' 人';
  if (!chars.length) {
    list.innerHTML = '<div style="padding:20px;font-family:var(--mono);font-size:11px;color:var(--text-dim);text-align:center">（暫無角色）</div>';
    return;
  }
  chars.forEach(c => {
    const aff = g.snapshot['好感_' + c.name] != null ? g.snapshot['好感_' + c.name] : (c.affinity || 50);
    const isThreat = c.relation === '威脅';
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = '<div class="char-header">'
      + '<div class="char-avatar" style="font-size:18px;display:flex;align-items:center;justify-content:center">&#128100;</div>'
      + '<div style="flex:1;min-width:0"><div class="char-name">' + esc(c.name) + '</div><div class="char-role">' + esc(c.role||'') + '</div></div>'
      + '<div class="char-relation-tag ' + (isThreat?'threat':'') + '">' + esc(c.relation||'未知') + '</div>'
      + '</div>'
      + '<div class="affinity-row"><span>好感度</span><span>' + aff + ' / 100</span></div>'
      + '<div class="bar-track"><div class="bar-fill ' + (isThreat?'threat':'') + '" style="width:' + Math.max(0,Math.min(100,aff)) + '%"></div></div>'
      + (c.notes ? '<div class="char-note">' + esc(c.notes) + '</div>' : '');
    list.appendChild(card);
  });
}
