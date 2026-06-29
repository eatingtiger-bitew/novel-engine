import { S, activeGame, persist } from '../state/store.js';
import { callGeminiChat, callGemini } from '../ai/gemini.js';
import { buildSystemPrompt } from '../ai/promptBuilder.js';
import { parseStoryResponse } from '../ai/responseParser.js';
import { esc } from '../utils/escape.js';
import { toast } from '../utils/toast.js';
import { renderStatStrip } from '../components/StatStrip.js';
import { showSqBanner } from '../components/SqBanner.js';

export function disableChoices() {
  document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
  const sc = document.getElementById('story-content');
  if (sc) sc.innerHTML = '<div class="story-thinking"><span class="spinner"></span>故事生成中……</div>';
}

export async function generateStory(g, playerInput) {
  const storyContent = document.getElementById('story-content');
  const choicesArea = document.getElementById('choices-area');
  storyContent.innerHTML = '<div class="story-thinking"><span class="spinner"></span>故事生成中……</div>';
  choicesArea.innerHTML = '';

  const recentHistory = g.history.slice(-20);
  const messages = [...recentHistory, { role: 'user', parts: [{ text: playerInput }] }];

  try {
    const raw = await callGeminiChat(buildSystemPrompt(g), messages);
    g.turnCount = (g.turnCount || 0) + 1;
    g.page++;
    g.history.push(
      { role: 'user', parts: [{ text: playerInput }] },
      { role: 'model', parts: [{ text: raw }] }
    );
    parseAndRenderStory(raw, g);
    g.meta = `Ch.${g.chapter} · p.${g.page} · 剛更新`;
    document.getElementById('game-chapter-tag').textContent =
      `Ch.${g.chapter.toString().padStart(2,'0')} · p.${g.page.toString().padStart(3,'0')}`;
    renderStatStrip(g);
    if (g.turnCount % (S.settings.intervalShort || 10) === 0) autoSummarize(g, 'short');
    await persist();
  } catch(e) {
    const msg = e.message || '未知錯誤';
    const isQuota = msg.includes('Quota') || msg.includes('429');
    storyContent.innerHTML = `<div class="story-thinking" style="color:var(--red)">
      生成失敗：${esc(msg)}<br><br>
      ${isQuota ? '免費額度可能用完，請至設定頁換模型。' : '請確認 API Key 是否正確。'}
    </div>`;
    choicesArea.innerHTML = '';
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn-primary';
    retryBtn.style.margin = '8px 0';
    retryBtn.textContent = '↺ 重新生成';
    retryBtn.onclick = () => {
      const ag = activeGame();
      if (ag) {
        const lastUser = ag.history.filter(m => m.role === 'user').slice(-1)[0];
        const lastInput = lastUser?.parts?.[0]?.text || '請繼續故事。';
        if (ag.history.length >= 2) ag.history = ag.history.slice(0, -2);
        generateStory(ag, lastInput);
      }
    };
    choicesArea.appendChild(retryBtn);
  }
}

export function parseAndRenderStory(raw, g) {
  const storyContent = document.getElementById('story-content');
  const choicesArea = document.getElementById('choices-area');
  storyContent.innerHTML = '';

  const { storyText, choices, sqTrigger, affinityChanges } = parseStoryResponse(raw);

  // 套用好感度變化
  affinityChanges.forEach(a => {
    const match = a.raw.match(/^(.+?)([+-]\d+)$/);
    if (match) {
      const name = match[1].trim();
      const delta = parseInt(match[2]);
      const key = `好感_${name}`;
      g.snapshot[key] = Math.max(0, Math.min(100, (parseInt(g.snapshot[key]) || 0) + delta));
      S.rt.currentNpc = name;
    }
  });

  // 渲染劇情文字
  if (storyText) {
    const div = document.createElement('div');
    div.className = 'story-text';
    div.innerHTML = storyText.split('\n\n').map(p => `<p>${esc(p.trim())}</p>`).join('');
    storyContent.appendChild(div);
  }

  // 捲回頂部
  const sa = document.getElementById('story-area');
  if (sa) setTimeout(() => { sa.scrollTop = 0; }, 50);

  // 渲染選項
  choicesArea.innerHTML = '';
  const labels = ['A','B','C','D'];
  choices.forEach((txt, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-label">${labels[i] || i+1}</span><span>${esc(txt)}</span>`;
    btn.onclick = () => { disableChoices(); generateStory(g, txt); };
    choicesArea.appendChild(btn);
  });

  // 自訂輸入
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn-custom-toggle';
  toggleBtn.textContent = '✦ 自訂行動';
  const inputWrap = document.createElement('div');
  inputWrap.className = 'custom-input-wrap';
  const ta = document.createElement('textarea');
  ta.className = 'custom-input';
  ta.rows = 1;
  ta.placeholder = '輸入你的行動或對話……';
  ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  const sendBtn = document.createElement('button');
  sendBtn.className = 'btn-custom-send';
  sendBtn.textContent = '↑';
  sendBtn.onclick = () => {
    const v = ta.value.trim();
    if (v) { const ag = activeGame(); if (ag) { disableChoices(); generateStory(ag, v); } }
  };
  inputWrap.appendChild(ta);
  inputWrap.appendChild(sendBtn);
  toggleBtn.onclick = () => {
    toggleBtn.classList.toggle('open');
    inputWrap.classList.toggle('open');
    if (inputWrap.classList.contains('open')) ta.focus();
  };
  choicesArea.appendChild(toggleBtn);
  choicesArea.appendChild(inputWrap);

  // 支線觸發
  if (sqTrigger && g.modules.sidequest) showSqBanner(sqTrigger, g);

  // 日誌記錄
  g.logs.unshift({
    id: `log_${Date.now()}`, type: 'main',
    page: `p.${(g.page - 1).toString().padStart(3, '0')}`,
    title: storyText.slice(0, 30) + '…',
    meta: new Date().toLocaleDateString('zh-TW'),
    tags: ['main'], summary: storyText.slice(0, 120)
  });
}

export async function autoSummarize(g, type) {
  try {
    const n = S.settings.intervalShort || 10;
    const recentHistory = g.history.slice(-(n * 2));
    const histText = recentHistory.map(m =>
      (m.role === 'user' ? '玩家：' : 'AI：') + (m.parts?.[0]?.text || '')
    ).join('\n');
    const prompt = (type === 'short' ? S.settings.promptShort : S.settings.promptDeep);
    const summary = await callGemini(prompt + '\n\n以下是對話內容：\n' + histText);
    g.summaries.push(summary);
    if (g.history.length > n * 4) g.history = g.history.slice(-(n * 2));
    await persist();
  } catch(e) { /* silent */ }
}
