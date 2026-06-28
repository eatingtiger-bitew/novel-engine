import { S } from '../state/store.js';
import { esc } from '../utils/escape.js';
import { openStatsPanel } from './StatsPanel.js';

export function renderStatStrip(g) {
  const strip = document.getElementById('game-stat-strip');
  if (!strip) return;
  strip.innerHTML = '';

  const panelBtn = document.createElement('button');
  panelBtn.id = 'stats-popup-btn';
  panelBtn.style.cssText = 'flex-shrink:0;width:28px;height:28px;border-radius:8px;background:var(--bg-hover);border:1px solid var(--border-md);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;color:var(--accent-light);-webkit-appearance:none;';
  panelBtn.textContent = '⊞';
  panelBtn.onclick = () => openStatsPanel(g);
  strip.appendChild(panelBtn);

  const dotCls = ['dot-blue','dot-pink','dot-amber','dot-amber','dot-blue'];
  Object.entries(g.snapshot).filter(([k]) => !k.startsWith('好感_')).forEach(([k,v], i) => {
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = `<span class="stat-dot ${dotCls[i % dotCls.length]}"></span>${esc(k)} ${esc(String(v))}`;
    strip.appendChild(pill);
  });

  if (S.rt.currentNpc) {
    const affVal = g.snapshot[`好感_${S.rt.currentNpc}`] ?? '—';
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = `<span class="stat-dot dot-pink"></span>[${esc(S.rt.currentNpc)}] 好感 ${esc(String(affVal))}`;
    strip.appendChild(pill);
  }
}
