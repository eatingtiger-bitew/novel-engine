import { S, persist } from '../state/store.js';
import { esc } from '../utils/escape.js';
import { toast } from '../utils/toast.js';
import { goTo } from '../router/index.js';
import { callGemini } from '../ai/gemini.js';
import { generateStory } from '../engine/gameEngine.js';

let IMP = { name:'', fileText:'', world:'', style:'', characters:[], mainQuests:[], sideQuests:[], hooks:'', chapter:1, page:1 };

export function resetIMP() {
  IMP = { name:'', fileText:'', world:'', style:'', characters:[], mainQuests:[], sideQuests:[], hooks:'', chapter:1, page:1 };
}

export { IMP };

export function onImpFileSelect(input) {
  const file = input.files[0]; if (!file) return;
  if (!file.name.endsWith('.txt')) { toast('請選擇 .txt 格式'); return; }
  document.getElementById('imp-filename').textContent = '✓ ' + file.name;
  document.getElementById('imp-drop-zone').style.borderColor = 'var(--green)';
  const reader = new FileReader();
  reader.onload = e => { IMP.fileText = e.target.result; };
  reader.readAsText(file, 'UTF-8');
}

export async function runImpFileAnalysis() {
  const name = document.getElementById('imp-game-name').value.trim();
  if (!name) { toast('請先填入遊戲名稱'); return; }
  if (!IMP.fileText) { toast('請先上傳 .txt 檔案'); return; }
  if (!S.settings.geminiKey) { toast('請先設定 Gemini API Key'); return; }
  IMP.name = name;
  const btn = document.getElementById('btn-imp-upload');
  btn.innerHTML = '<span class="spinner"></span>分析中…'; btn.disabled = true;
  try {
    const truncated = IMP.fileText.slice(0, 12000);
    // 使用陣列 join 避免字串裡有換行符號導致語法錯誤
    const promptParts = [
      '你是互動小說存檔分析器。請從以下對話記錄中提取所有資訊，輸出純JSON（從{開始，不要任何說明）：',
      '{"world":"世界觀設定摘要300字以內","style":"敘事風格規範100字",',
      '"characters":[{"name":"姓名","role":"職業","relation":"NPC對玩家的關係","affinity":50,"notes":"特徵一句"}],',
      '"mainQuests":[{"title":"主線事件","status":"completed","desc":"一句話"}],',
      '"sideQuests":[{"title":"支線任務","status":"active","desc":"一句話"}],',
      '"hooks":"當前伏筆150字","chapter":1,"page":1}',
      '\n\n對話記錄：\n'
    ];
    const prompt = promptParts.join('') + truncated;
    const raw = await callGemini(prompt);
    const rc = raw.replace(/```json[\s\S]*?```|```/g, '').trim();
    const js = rc.indexOf('{'); const je = rc.lastIndexOf('}');
    if (js === -1 || je === -1) throw new Error('格式錯誤');
    const p = JSON.parse(rc.slice(js, je + 1));
    IMP.world = p.world || ''; IMP.style = p.style || '';
    IMP.characters = p.characters || []; IMP.mainQuests = p.mainQuests || [];
    IMP.sideQuests = p.sideQuests || []; IMP.hooks = p.hooks || '';
    IMP.chapter = p.chapter || 1; IMP.page = p.page || 1;
    renderImpStep2();
    goTo('screen-import-step2');
  } catch(e) {
    const isQ = e.message && (e.message.includes('Quota') || e.message.includes('429'));
    toast('分析失敗：' + (isQ ? '免費額度用完，請換模型' : (e.message || '請再試一次')));
  } finally { btn.innerHTML = 'AI 分析 →'; btn.disabled = false; }
}

export function renderImpStep2() {
  document.getElementById('imp-result-world').value = IMP.world;
  document.getElementById('imp-world-warn').style.display = IMP.world ? 'none' : '';
  document.getElementById('imp-result-style').value = IMP.style;
  document.getElementById('imp-style-warn').style.display = IMP.style ? 'none' : '';
  document.getElementById('imp-result-hooks').value = IMP.hooks;
  document.getElementById('imp-hooks-warn').style.display = IMP.hooks ? 'none' : '';
  document.getElementById('imp-chapter').value = IMP.chapter;
  document.getElementById('imp-page').value = IMP.page;
  document.getElementById('imp-chars-warn').style.display = IMP.characters.length ? 'none' : '';
  renderImpCharsList();
  renderImpQuestList('imp-result-main-list', IMP.mainQuests);
  renderImpQuestList('imp-result-side-list', IMP.sideQuests);
}

export function renderImpCharsList() {
  const c = document.getElementById('imp-result-chars-list'); c.innerHTML = '';
  IMP.characters.forEach(function(ch, i) {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-input);border:1px solid var(--border-md);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:6px';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'font-size:13px;color:var(--text-primary)';
    nameDiv.textContent = ch.name;
    const rmBtn = document.createElement('button');
    rmBtn.style.cssText = 'background:none;border:none;color:var(--red);font-size:11px;cursor:pointer';
    rmBtn.textContent = '移除';
    rmBtn.onclick = function() { IMP.characters.splice(i, 1); renderImpCharsList(); };
    header.appendChild(nameDiv); header.appendChild(rmBtn);

    const row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;gap:8px';
    const roleInput = document.createElement('input');
    roleInput.className = 'char-input'; roleInput.placeholder = '職業'; roleInput.value = ch.role || ''; roleInput.style.flex = '1';
    roleInput.oninput = function() { IMP.characters[i].role = this.value; };
    const relInput = document.createElement('input');
    relInput.className = 'char-input'; relInput.placeholder = '對玩家的關係'; relInput.value = ch.relation || ''; relInput.style.flex = '1';
    relInput.oninput = function() { IMP.characters[i].relation = this.value; };
    row1.appendChild(roleInput); row1.appendChild(relInput);

    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;align-items:center';
    const affLabel = document.createElement('div');
    affLabel.style.cssText = 'font-family:var(--mono);font-size:9px;color:var(--text-dim);width:36px';
    affLabel.textContent = '好感';
    const affInput = document.createElement('input');
    affInput.type = 'number'; affInput.min = '0'; affInput.max = '100';
    affInput.value = ch.affinity || 50; affInput.className = 'char-input-sm';
    affInput.oninput = function() { IMP.characters[i].affinity = +this.value; };
    const notesInput = document.createElement('input');
    notesInput.className = 'char-input'; notesInput.placeholder = '備註'; notesInput.value = ch.notes || ''; notesInput.style.flex = '1';
    notesInput.oninput = function() { IMP.characters[i].notes = this.value; };
    row2.appendChild(affLabel); row2.appendChild(affInput); row2.appendChild(notesInput);

    card.appendChild(header); card.appendChild(row1); card.appendChild(row2);
    c.appendChild(card);
  });
}

export function addImpChar() {
  IMP.characters.push({ name: '新角色', role: '', relation: '', affinity: 50, notes: '' });
  renderImpCharsList();
}

export function renderImpQuestList(cid, quests) {
  const c = document.getElementById(cid); c.innerHTML = '';
  quests.forEach(function(q, i) {
    const isMain = cid === 'imp-result-main-list';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center';

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'font-family:var(--mono);font-size:9px;width:40px;flex-shrink:0;color:' + (q.status === 'active' ? 'var(--green)' : 'var(--text-muted)');
    statusDiv.textContent = q.status === 'active' ? '▶ 進行' : '✓ 完成';

    const titleInput = document.createElement('input');
    titleInput.className = 'input-text';
    titleInput.style.cssText = 'flex:1;padding:7px 10px;font-size:11px';
    titleInput.value = q.title;
    titleInput.oninput = function() { (isMain ? IMP.mainQuests : IMP.sideQuests)[i].title = this.value; };

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-field'; delBtn.textContent = '×';
    delBtn.onclick = function() { delImpQuest(cid, i); };

    row.appendChild(statusDiv); row.appendChild(titleInput); row.appendChild(delBtn);
    c.appendChild(row);
  });
}

export function addImpQuest(type) {
  if (type === 'main') IMP.mainQuests.push({ title: '新主線', status: 'completed', desc: '' });
  else IMP.sideQuests.push({ title: '新支線', status: 'completed', desc: '' });
  renderImpQuestList(type === 'main' ? 'imp-result-main-list' : 'imp-result-side-list', type === 'main' ? IMP.mainQuests : IMP.sideQuests);
}

export function delImpQuest(cid, i) {
  if (cid === 'imp-result-main-list') IMP.mainQuests.splice(i, 1);
  else IMP.sideQuests.splice(i, 1);
  renderImpQuestList(cid, cid === 'imp-result-main-list' ? IMP.mainQuests : IMP.sideQuests);
}

export function buildImpConfirmAndGoStep3() {
  IMP.world = document.getElementById('imp-result-world').value.trim();
  IMP.style = document.getElementById('imp-result-style').value.trim();
  IMP.hooks = document.getElementById('imp-result-hooks').value.trim();
  IMP.chapter = parseInt(document.getElementById('imp-chapter').value) || 1;
  IMP.page = parseInt(document.getElementById('imp-page').value) || 1;
  const chars = IMP.characters.map(function(c) { return c.name; }).join('、') || '（未設定）';
  const mDone = IMP.mainQuests.filter(function(q) { return q.status === 'completed'; }).length;
  const sActive = IMP.sideQuests.filter(function(q) { return q.status === 'active'; }).length;
  const warns = [];
  if (!IMP.world) warns.push('世界觀');
  if (!IMP.characters.length) warns.push('角色卡');
  if (warns.length && !confirm('以下欄位仍未填入：' + warns.join('、') + '。確定繼續？')) return;
  document.getElementById('imp-summary-box').innerHTML =
    '<div class="summary-row"><div class="summary-key">遊戲名稱</div><div class="summary-val">' + esc(IMP.name) + '</div></div>'
    + '<div class="summary-row"><div class="summary-key">當前進度</div><div class="summary-val">Ch.' + IMP.chapter + ' · p.' + IMP.page + '</div></div>'
    + '<div class="summary-row"><div class="summary-key">角色</div><div class="summary-val">' + esc(chars) + '</div></div>'
    + '<div class="summary-row"><div class="summary-key">主線</div><div class="summary-val">' + mDone + ' 條已完成</div></div>'
    + '<div class="summary-row"><div class="summary-key">支線</div><div class="summary-val">進行中 ' + sActive + ' 條</div></div>'
    + '<div class="summary-row"><div class="summary-key">模型</div><div class="summary-val">' + esc(S.settings.model) + '</div></div>';
  goTo('screen-import-step3');
}

export async function startImportedGame() {
  if (!S.settings.geminiKey) { toast('請先設定 Gemini API Key'); return; }
  const btn = document.getElementById('btn-imp-start');
  btn.innerHTML = '<span class="spinner"></span>匯入中…'; btn.disabled = true;
  try {
    const id = Date.now().toString();
    const snapshot = {};
    IMP.characters.forEach(function(c) { if (c.name) snapshot['好感_' + c.name] = c.affinity || 50; });
    const quests = [{ id:'q_main_imp', type:'main', title:'Ch.'+IMP.chapter+' 主線', desc:'從匯入進度繼續', active:true, timed:false }]
      .concat(IMP.sideQuests.filter(function(q){return q.status==='active';}).map(function(q,i){return {id:'q_s'+i,type:'side',title:q.title,desc:q.desc||'',active:true,timed:false};}));
    const logs = IMP.mainQuests.map(function(q,i){return {id:'imp_m'+i,type:'main',page:'p.'+(i+1).toString().padStart(3,'0'),title:q.title,meta:'匯入記錄',tags:['main'],summary:q.desc||q.title};})
      .concat(IMP.sideQuests.map(function(q,i){return {id:'imp_s'+i,type:'side',page:'p.'+(i+1).toString().padStart(3,'0'),title:q.title,meta:'匯入記錄',tags:['side'],summary:q.desc||q.title};}));
    const extraHint = document.getElementById('imp-extra-hint').value.trim();
    const hooksNote = IMP.hooks ? ('\n\n【當前伏筆】\n' + IMP.hooks) : '';
    const g = {
      id, name:IMP.name, icon:'📖',
      meta:'Ch.'+IMP.chapter+' · p.'+IMP.page+' · 匯入存檔',
      worldview:IMP.world, worldTags:[], fieldTags:[],
      detectedStyle:IMP.style, styleSupp:'',
      characters:IMP.characters.map(function(c){return Object.assign({},c);}),
      modules:{sidequest:true,combat:false,affinity:true,money:false},
      customFields:[], openingHint:extraHint,
      createdAt:Date.now(), page:IMP.page, chapter:IMP.chapter,
      summaries:[IMP.world + hooksNote],
      history:[], logs:logs, quests:quests, snapshot:snapshot,
      turnCount:0, mode:'main', savedMainState:null
    };
    S.games.push(g); S.activeGameId = id; await persist();
    resetIMP();
    S.screenStack = ['screen-home'];
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    goTo('screen-game');
    const openParts = ['【匯入存檔，從當前進度繼續】', '世界觀摘要：' + g.summaries[0].slice(0,300), extraHint ? '補充說明：' + extraHint : '', '請從 Ch.' + g.chapter + ' p.' + g.page + ' 之後繼續推進故事。'];
    const openMsg = openParts.filter(function(s){return s;}).join('\n\n');
    await generateStory(g, openMsg);
  } catch(e) { toast('匯入失敗：' + (e.message || '未知錯誤')); }
  finally { btn.innerHTML = '✦ 繼續故事'; btn.disabled = false; }
}
