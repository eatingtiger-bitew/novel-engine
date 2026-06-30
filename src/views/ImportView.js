import { S, activeGame, persist } from '../state/store.js';
import { esc } from '../utils/escape.js';
import { toast } from '../utils/toast.js';
import { goTo, goBack } from '../router/index.js';
import { callGemini } from '../ai/gemini.js';
import { generateStory } from '../engine/gameEngine.js';

let IMP = { name:'', fileText:'', world:'', style:'', characters:[], mainQuests:[], sideQuests:[], hooks:'', chapter:1, page:1 };

export function resetIMP() {
  IMP = { name:'', fileText:'', world:'', style:'', characters:[], mainQuests:[], sideQuests:[], hooks:'', chapter:1, page:1 };
}

export function onImpFileSelect(input) {
  const file = input.files[0]; if (!file) return;
  if (!file.name.endsWith('.txt')) { toast('請選擇 .txt 格式'); return; }
  document.getElementById('imp-filename').textContent = '✓ ' + file.name;
  document.getElementById('imp-drop-zone').style.borderColor = 'var(--green)';
  const reader = new FileReader();
  reader.onload = e => { IMP.fileText = e.target.result; };
  reader.readAsText(file, 'UTF-8');
}

async function callGeminiSafe(prompt) {
  return callGemini(prompt);
}

export async function runImpFileAnalysis() {
  const name = document.getElementById('imp-game-name').value.trim();
  if (!name) { toast('請先填入遅戲名稱'); return; }
  if (!IMP.fileText) { toast('請先上傳 .txt 檔案'); return; }
  if (!S.settings.geminiKey) { toast('請先設定 Gemini API Key'); return; }
  IMP.name = name;
  const btn = document.getElementById('btn-imp-upload');
  btn.innerHTML = '<span class="spinner"></span>分析中...'; btn.disabled = true;
  try {
    const truncated = IMP.fileText.slice(0, 12000);
    const prompt = '你是互動小說存檔分析器。請從以下對話記錄中提取所有資訊，輸出純JSON（從{開始）:\n'
      + '{"world":"世界觀300字","style":"敘事風格100字","characters":[{"name":"姓名","role":"職業","relation":"關係","affinity":50,"notes":"特徵"}],'
      + '"mainQuests":[{"title":"主線","status":"completed","desc":"一句話"}],"sideQuests":[{"title":"支線","status":"active","desc":"一句話"}],'
      + '"hooks":"伏筆150字","chapter":1,"page":1}\n\n對話記錄:\n' + truncated;
    const raw = await callGeminiSafe(prompt);
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
    toast('分析失敗:' + (isQ ? '額度用完請換模型' : e.message || '請再試'));
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
  IMP.characters.forEach((ch, i) => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-input);border:1px solid var(--border-md);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:6px';
    card.innerHTML = '<div style="display:flex;justify-content:space-between">'
      + '<div style="font-size:13px;color:var(--text-primary)">' + esc(ch.name) + '</div>'
      + '<button style="background:none;border:none;color:var(--red);cursor:pointer" onclick="window._impRemoveChar(' + i + ')">移除</button></div>'
      + '<div style="display:flex;gap:8px">'
      + '<input class="char-input" placeholder="職業" value="' + esc(ch.role||'') + '" oninput="window._IMP.characters[' + i + '].role=this.value" style="flex:1">'
      + '<input class="char-input" placeholder="關係" value="' + esc(ch.relation||'') + '" oninput="window._IMP.characters[' + i + '].relation=this.value" style="flex:1"></div>'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + '<div style="font-family:var(--mono);font-size:9px;color:var(--text-dim);width:36px">好感</div>'
      + '<input type="number" min="0" max="100" value="' + (ch.affinity||50) + '" oninput="window._IMP.characters[' + i + '].affinity=+this.value" class="char-input-sm">'
      + '<input class="char-input" placeholder="備註" value="' + esc(ch.notes||'') + '" oninput="window._IMP.characters[' + i + '].notes=this.value" style="flex:1"></div>';
    c.appendChild(card);
  });
}

export function addImpChar() {
  IMP.characters.push({ name: '新角色', role: '', relation: '', affinity: 50, notes: '' });
  renderImpCharsList();
}

export function renderImpQuestList(cid, quests) {
  const c = document.getElementById(cid); c.innerHTML = '';
  quests.forEach((q, i) => {
    const isMain = cid === 'imp-result-main-list';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center';
    row.innerHTML = '<div style="font-family:var(--mono);font-size:9px;width:40px;flex-shrink:0;color:' + (q.status==='active'?'var(--green)':'var(--text-muted)') + '">'
      + (q.status==='active'?'▶ 進行':'✓ 完成') + '</div>'
      + '<input class="input-text" style="flex:1;padding:7px 10px;font-size:11px" value="' + esc(q.title) + '" oninput="window._IMP.' + (isMain?'mainQuests':'sideQuests') + '[' + i + '].title=this.value">'
      + '<button class="btn-del-field" onclick="window._delImpQuest(\'' + cid + '\',' + i + ')">x</button>';
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
  const chars = IMP.characters.map(c => c.name).join('、') || '（未設定）';
  const mDone = IMP.mainQuests.filter(q => q.status === 'completed').length;
  const sActive = IMP.sideQuests.filter(q => q.status === 'active').length;
  const warns = [];
  if (!IMP.world) warns.push('世界觀');
  if (!IMP.characters.length) warns.push('角色卡');
  if (warns.length && !confirm('以下欄位仍未填入:' + warns.join('、') + '。確定繼續?')) return;
  document.getElementById('imp-summary-box').innerHTML =
    '<div class="summary-row"><div class="summary-key">遅戲名稱</div><div class="summary-val">' + esc(IMP.name) + '</div></div>'
    + '<div class="summary-row"><div class="summary-key">當前進度</div><div class="summary-val">Ch.' + IMP.chapter + ' p.' + IMP.page + '</div></div>'
    + '<div class="summary-row"><div class="summary-key">角色</div><div class="summary-val">' + esc(chars) + '</div></div>'
    + '<div class="summary-row"><div class="summary-key">主線</div><div class="summary-val">' + mDone + ' 條已完成</div></div>'
    + '<div class="summary-row"><div class="summary-key">支線</div><div class="summary-val">進行中 ' + sActive + ' 條</div></div>'
    + '<div class="summary-row"><div class="summary-key">模型</div><div class="summary-val">' + esc(S.settings.model) + '</div></div>';
  goTo('screen-import-step3');
}

export async function startImportedGame() {
  if (!S.settings.geminiKey) { toast('請先設定 Gemini API Key'); return; }
  const btn = document.getElementById('btn-imp-start');
  btn.innerHTML = '<span class="spinner"></span>匯入中...'; btn.disabled = true;
  try {
    const id = Date.now().toString();
    const snapshot = {};
    IMP.characters.forEach(c => { if (c.name) snapshot['好感_' + c.name] = c.affinity || 50; });
    const quests = [{ id:'q_main_imp', type:'main', title:'Ch.'+IMP.chapter+'主線', desc:'從匯入進度繼續', active:true, timed:false }]
      .concat(IMP.sideQuests.filter(q=>q.status==='active').map((q,i)=>({id:'q_s'+i, type:'side', title:q.title, desc:q.desc||'', active:true, timed:false})));
    const logs = IMP.mainQuests.map((q,i)=>({id:'imp_m'+i, type:'main', page:'p.'+(i+1).toString().padStart(3,'0'), title:q.title, meta:'匯入記錄', tags:['main'], summary:q.desc||q.title}))
      .concat(IMP.sideQuests.map((q,i)=>({id:'imp_s'+i, type:'side', page:'p.'+(i+1).toString().padStart(3,'0'), title:q.title, meta:'匯入記錄', tags:['side'], summary:q.desc||q.title})));
    const extraHint = document.getElementById('imp-extra-hint').value.trim();
    const g = {
      id, name:IMP.name, icon:'📖',
      meta:'Ch.'+IMP.chapter+' p.'+IMP.page+' 匯入存檔',
      worldview:IMP.world, worldTags:[], fieldTags:[],
      detectedStyle:IMP.style, styleSupp:'',
      characters:IMP.characters.map(c=>Object.assign({},c)),
      modules:{sidequest:true, combat:false, affinity:true, money:false},
      customFields:[], openingHint:extraHint,
      createdAt:Date.now(), page:IMP.page, chapter:IMP.chapter,
      summaries:[IMP.world+(IMP.hooks?'\n\n伏筆:\n'+IMP.hooks:'')],
      history:[], logs, quests, snapshot, turnCount:0, mode:'main', savedMainState:null
    };
    S.games.push(g); S.activeGameId = id; await persist();
    resetIMP();
    S.screenStack = ['screen-home'];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    goTo('screen-game');
    const openMsg = '匯入存檔，從當前進度繼續\n\n世界觀:' + g.summaries[0].slice(0,300)
      + '\n\n' + (extraHint?'補充:'+extraHint+'\n\n':'') + '請從 Ch.'+g.chapter+' p.'+g.page+' 繼續故事。';
    await generateStory(g, openMsg);
  } catch(e) { toast('匯入失敗:'+(e.message||'未知錯誤')); }
  finally { btn.innerHTML = '繼續故事'; btn.disabled = false; }
}

export { IMP };
