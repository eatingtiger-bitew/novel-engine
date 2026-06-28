import { S, resetNewGame, persist } from '../state/store.js';
import { esc } from '../utils/escape.js';
import { toast } from '../utils/toast.js';
import { goTo, goBack } from '../router/index.js';
import { callGemini } from '../ai/gemini.js';

export async function runAnalysis() {
  const name = document.getElementById('new-game-name').value.trim();
  const wv = document.getElementById('new-game-worldview').value.trim();
  if (!name) { toast('請先填入遊戲名稱'); return; }
  if (wv.length < 20) { toast('世界觀描述太短，請補充內容'); return; }
  if (!S.settings.geminiKey) { toast('請先在設定頁填入 Gemini API Key'); return; }

  const btn = document.getElementById('btn-analyze');
  btn.innerHTML = '<span class="spinner"></span>分析中…'; btn.disabled = true;
  S.newGame.name = name; S.newGame.worldview = wv;

  try {
    const res = await callGemini(
      `你是互動小說引擎的設定分析器。請分析以下內容，以純 JSON 輸出（從{開始，不要任何說明或markdown）：
{"worldTags":["標籤"],"fieldTags":["欄位"],"style":"敘事風格一句話","characters":[{"name":"姓名","role":"職業","relation":"NPC對玩家主角的關係","affinity":50,"notes":"特徵一句"}]}
worldTags：3-5個世界觀標籤。fieldTags：3-6個建議數值欄位。style：敘事風格。characters：如果內容中有角色卡資料請提取，沒有則給空陣列[]。
世界觀/設定文：
${wv}`
    );
    let p;
    try {
      const rc = res.replace(/\`\`\`json[\s\S]*?\`\`\`|\`\`\`/g, '').trim();
      const js = rc.indexOf('{'); const je = rc.lastIndexOf('}');
      if (js === -1 || je === -1) throw new Error('no json');
      p = JSON.parse(rc.slice(js, je + 1));
    } catch { throw new Error('AI 回傳格式錯誤，請再試一次'); }

    S.newGame.worldTags = p.worldTags || [];
    S.newGame.fieldTags = p.fieldTags || [];
    S.newGame.detectedStyle = p.style || '';
    if (p.characters && p.characters.length > 0) S.newGame.characters = p.characters;
    renderStep2();
    S.newGame.customFields = S.newGame.fieldTags.map(f => ({ name: f, value: '100' }));
    goTo('screen-new-step2');
  } catch(e) {
    const msg = e.message || '';
    const isQuota = msg.includes('Quota') || msg.includes('429');
    toast('分析失敗：' + (isQuota ? '免費額度用完，請換模型' : msg || '請確認 API Key'));
  } finally { btn.innerHTML = '自動分析 →'; btn.disabled = false; }
}

export function renderStep2() {
  renderTags('tags-world', S.newGame.worldTags, 'blue');
  renderTags('tags-fields', S.newGame.fieldTags, 'green');
  document.getElementById('detected-style').textContent = S.newGame.detectedStyle || '—';
  document.getElementById('style-supplement').value = S.newGame.styleSupp || '';
}

export function renderTags(cid, arr, cls) {
  const c = document.getElementById(cid); c.innerHTML = '';
  arr.forEach((t, i) => {
    const s = document.createElement('span'); s.className = `etag ${cls}`;
    s.innerHTML = esc(t) + `<button class="etag-x" onclick="window._removeTag('${cid}',${i})">✕</button>`;
    c.appendChild(s);
  });
  const add = document.createElement('button'); add.className = 'btn-tag-add'; add.textContent = '＋';
  add.onclick = () => { const v = prompt('新增 tag：'); if (v?.trim()) { arr.push(v.trim()); renderTags(cid, arr, cls); } };
  c.appendChild(add);
}

export function removeTag(cid, i) {
  if (cid === 'tags-world') { S.newGame.worldTags.splice(i, 1); renderTags(cid, S.newGame.worldTags, 'blue'); }
  else { S.newGame.fieldTags.splice(i, 1); renderTags(cid, S.newGame.fieldTags, 'green'); }
}

export async function parseCharCards() {
  const raw = document.getElementById('charcard-input').value.trim();
  if (raw.length < 10) { toast('請先貼入角色卡內容'); return; }
  if (!S.settings.geminiKey) { toast('請先設定 Gemini API Key'); return; }
  const btn = document.getElementById('btn-parse-char');
  btn.innerHTML = '<span class="spinner"></span>解析中…'; btn.disabled = true;
  try {
    const res = await callGemini(
      `你是角色卡解析器。將以下角色卡解析為 JSON 陣列（純 JSON，不要 markdown，從[開始）：
[{"name":"角色姓名","role":"職業或身份","relation":"這個NPC對玩家主角的關係定位，例如：同事、暗戀對象、競爭對手","affinity":50,"notes":"重要特徵或設定一兩句"}]
角色卡：
${raw}`
    );
    let chars;
    try {
      const rc = res.replace(/\`\`\`json[\s\S]*?\`\`\`|\`\`\`/g, '').trim();
      const js = rc.indexOf('[') !== -1 && rc.indexOf('[') < rc.indexOf('{') ? rc.indexOf('[') : rc.indexOf('{');
      const je = rc.lastIndexOf(']') > rc.lastIndexOf('}') ? rc.lastIndexOf(']') : rc.lastIndexOf('}');
      const parsed = JSON.parse(rc.slice(js, je + 1));
      chars = Array.isArray(parsed) ? parsed : [parsed];
    } catch { throw new Error('格式錯誤，請再試一次'); }
    S.newGame.characters = chars;
    renderParsedChars();
  } catch(e) { toast('解析失敗：' + (e.message || '請確認 API Key')); }
  finally { btn.innerHTML = '解析角色卡 →'; btn.disabled = false; }
}

export function renderParsedChars() {
  const area = document.getElementById('parsed-chars-area');
  const list = document.getElementById('parsed-chars-list');
  area.style.display = ''; list.innerHTML = '';
  S.newGame.characters.forEach((c, i) => {
    const d = document.createElement('div'); d.className = 'char-block';
    d.innerHTML = `<div class="char-block-header">${esc(c.name || '未命名')}<button class="btn-char-rm" onclick="window._removeChar(${i})">✕ 移除</button></div>
    <div class="char-parsed">
      <div class="char-row"><div class="char-key">職業</div><input class="char-input" value="${esc(c.role||'')}" oninput="S.newGame.characters[${i}].role=this.value"></div>
      <div class="char-row"><div class="char-key">關係</div><input class="char-input" value="${esc(c.relation||'')}" oninput="S.newGame.characters[${i}].relation=this.value"></div>
      <div class="char-row"><div class="char-key">好感初值</div><input type="number" min="0" max="100" class="char-input-sm" value="${c.affinity||50}" oninput="S.newGame.characters[${i}].affinity=+this.value"></div>
      <div class="char-row"><div class="char-key">備註</div><input class="char-input" value="${esc(c.notes||'')}" oninput="S.newGame.characters[${i}].notes=this.value"></div>
    </div>`;
    list.appendChild(d);
  });
}

export function removeChar(i) {
  S.newGame.characters.splice(i, 1);
  if (!S.newGame.characters.length) document.getElementById('parsed-chars-area').style.display = 'none';
  else renderParsedChars();
}

export function addBlankChar() {
  S.newGame.characters.push({ name: '新角色', role: '', relation: '', affinity: 50, notes: '' });
  document.getElementById('parsed-chars-area').style.display = '';
  renderParsedChars();
}

export function toggleSwitch(btn) {
  const on = btn.classList.contains('on');
  btn.classList.toggle('on', !on); btn.classList.toggle('off', on);
  const map = { 'toggle-sidequest': 'sidequest', 'toggle-combat': 'combat', 'toggle-affinity': 'affinity', 'toggle-money': 'money' };
  const key = map[btn.id]; if (key) S.newGame.modules[key] = !on;
}

export function addCustomField() {
  if (S.newGame.customFields.length >= 6) { toast('最多 6 個自訂欄位'); return; }
  S.newGame.customFields.push({ name: '', value: '' }); renderCustomFields();
}

export function renderCustomFields() {
  const list = document.getElementById('custom-fields-list'); list.innerHTML = '';
  S.newGame.customFields.forEach((f, i) => {
    const row = document.createElement('div'); row.className = 'custom-field-row';
    row.innerHTML = `<input class="input-field-name" placeholder="欄位名稱" value="${esc(f.name)}" oninput="S.newGame.customFields[${i}].name=this.value">
      <input class="input-field-val" placeholder="初始值" value="${esc(f.value)}" oninput="S.newGame.customFields[${i}].value=this.value">
      <button class="btn-del-field" onclick="window._delCustomField(${i})">×</button>`;
    list.appendChild(row);
  });
}

export function delCustomField(i) { S.newGame.customFields.splice(i, 1); renderCustomFields(); }

export function buildSummaryAndGoStep5() {
  S.newGame.styleSupp = document.getElementById('style-supplement').value.trim();
  const mods = S.newGame.modules;
  const activeMods = [mods.sidequest?'支線任務':null, mods.combat?'戰鬥':null, mods.affinity?'好感度':null, mods.money?'金錢':null].filter(Boolean);
  const fields = S.newGame.customFields.filter(f=>f.name).map(f=>`${f.name} ${f.value}`).join('・') || '（未設定）';
  const chars = S.newGame.characters.map(c=>c.name).join('、') || '（未設定）';
  document.getElementById('summary-box').innerHTML = `
    <div class="summary-row"><div class="summary-key">遊戲名稱</div><div class="summary-val">${esc(S.newGame.name)}</div></div>
    <div class="summary-row"><div class="summary-key">世界觀</div><div class="summary-val">${esc(S.newGame.worldTags.join(' · '))}</div></div>
    <div class="summary-row"><div class="summary-key">敘事風格</div><div class="summary-val">${esc(S.newGame.detectedStyle || '—')}</div></div>
    <div class="summary-row"><div class="summary-key">角色</div><div class="summary-val">${esc(chars)}</div></div>
    <div class="summary-row"><div class="summary-key">開啟模組</div><div class="summary-tags">${activeMods.map(m=>`<span class="stag">${m}</span>`).join('') || '（全部關閉）'}</div></div>
    <div class="summary-row"><div class="summary-key">自訂欄位</div><div class="summary-val">${esc(fields)}</div></div>
    <div class="summary-row"><div class="summary-key">模型</div><div class="summary-val">${esc(S.settings.model)}${S.settings.geminiKey?' · ✓':' · ⚠ 請先設定 API Key'}</div></div>`;
  goTo('screen-new-step5');
}

export async function startGame() {
  if (!S.settings.geminiKey) { toast('請先設定 Gemini API Key'); return; }
  if (!S.newGame.name) { toast('遊戲名稱不能為空'); return; }
  const btn = document.getElementById('btn-start-game');
  btn.innerHTML = '<span class="spinner"></span>建立中…'; btn.disabled = true;
  try {
    const id = Date.now().toString();
    const g = {
      id, name: S.newGame.name, icon: '📖',
      meta: 'Ch.01 · p.001 · 剛開始',
      worldview: S.newGame.worldview,
      worldTags: [...S.newGame.worldTags], fieldTags: [...S.newGame.fieldTags],
      detectedStyle: S.newGame.detectedStyle, styleSupp: S.newGame.styleSupp,
      characters: S.newGame.characters.map(c => ({ ...c })),
      modules: { ...S.newGame.modules },
      customFields: S.newGame.customFields.map(f => ({ ...f })),
      openingHint: document.getElementById('opening-hint').value.trim(),
      createdAt: Date.now(), page: 1, chapter: 1,
      summaries: [], history: [], logs: [], quests: [], snapshot: {},
      turnCount: 0, mode: 'main', savedMainState: null
    };
    g.customFields.forEach(f => { if (f.name) g.snapshot[f.name] = f.value; });
    g.characters.forEach(c => { if (c.name) g.snapshot[`好感_${c.name}`] = c.affinity; });
    g.quests.push({ id: 'q_main_1', type: 'main', title: 'Ch.01 主線', desc: '故事剛剛開始……', active: true, timed: false });
    S.games.push(g); S.activeGameId = id;
    await persist();
    resetNewGame();
    S.screenStack = ['screen-home'];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    goTo('screen-game');
    const { generateStory } = await import('../engine/gameEngine.js');
    await generateStory(g, g.openingHint || '請開始故事的第一幕。');
  } catch(e) { toast('建立失敗：' + (e.message || '未知錯誤')); }
  finally { btn.innerHTML = '✦ 開始遊戲'; btn.disabled = false; }
}
