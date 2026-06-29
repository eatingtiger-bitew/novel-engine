import { esc } from '../utils/escape.js';

export function openStatsPanel(g) {
  const g2 = g;
  if (!g2) return;
  const content = document.getElementById('stats-panel-content');
  content.innerHTML = '';

  const chars = g2.characters.filter(c => c.name);
  if (chars.length) {
    const hdr = document.createElement('div');
    hdr.style.cssText = 'font-family:var(--mono);font-size:9px;color:var(--text-dim);letter-spacing:.15em;margin-bottom:8px;text-transform:uppercase';
    hdr.textContent = '▸ 角色好感度';
    content.appendChild(hdr);
    chars.forEach(c => {
      const aff = g2.snapshot['好感_' + c.name] != null ? g2.snapshot['好感_' + c.name] : (c.affinity || 50);
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = '<div><div class="stat-row-key">' + esc(c.name)
        + '<span style="font-size:9px;color:var(--text-dim);margin-left:6px">' + esc(c.relation || '') + '</span></div>'
        + '<div class="stat-affinity-bar"><div class="stat-affinity-fill" style="width:' + Math.max(0, Math.min(100, aff)) + '%"></div></div></div>'
        + '<div class="stat-row-val">' + aff + '</div>';
      content.appendChild(row);
    });
  }

  const others = Object.entries(g2.snapshot).filter(([k]) => !k.startsWith('好感_'));
  if (others.length) {
    const hdr2 = document.createElement('div');
    hdr2.style.cssText = 'font-family:var(--mono);font-size:9px;color:var(--text-dim);letter-spacing:.15em;margin:14px 0 8px;text-transform:uppercase';
    hdr2.textContent = '▸ 狀態數值';
    content.appendChild(hdr2);
    others.forEach(([k, v]) => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = '<div class="stat-row-key">' + esc(k) + '</div><div class="stat-row-val">' + esc(String(v)) + '</div>';
      content.appendChild(row);
    });
  }
  document.getElementById('stats-overlay').style.display = 'flex';
}

export function closeStatsPanel(e) {
  if (!e || e.target === document.getElementById('stats-overlay'))
    document.getElementById('stats-overlay').style.display = 'none';
}
