import { S, persist } from '../state/store.js';
import { toast } from '../utils/toast.js';
import { goTo, goBack } from '../router/index.js';
import { PROMPT_SHORT, PROMPT_DEEP } from '../ai/promptBuilder.js';

export function renderSettings() {
  const s = S.settings;
  document.getElementById('gemini-key-input').value = s.geminiKey || '';
  document.getElementById('claude-key-input').value = s.claudeKey || '';
  updateApiBadges();
  document.querySelectorAll('.model-chip').forEach(c => c.classList.toggle('active', c.dataset.model === s.model));
  document.getElementById('interval-short').value = s.intervalShort;
  document.getElementById('interval-deep').value = s.intervalDeep;
  document.getElementById('prompt-short-preview').textContent = (s.promptShort || PROMPT_SHORT).slice(0, 140) + '…';
  document.getElementById('prompt-deep-preview').textContent = (s.promptDeep || PROMPT_DEEP).slice(0, 140) + '…';
}

export function onApiKeyChange() {
  S.settings.geminiKey = document.getElementById('gemini-key-input').value.trim();
  S.settings.claudeKey = document.getElementById('claude-key-input').value.trim();
  updateApiBadges();
}

export function updateApiBadges() {
  const gk = S.settings.geminiKey; const ck = S.settings.claudeKey;
  const gb = document.getElementById('gemini-key-badge');
  const cb = document.getElementById('claude-key-badge');
  gb.textContent = gk.length > 10 ? '✓ 已填入' : '未設定';
  gb.className = 'api-badge ' + (gk.length > 10 ? 'badge-ok' : 'badge-none');
  cb.textContent = ck.length > 10 ? '✓ 已填入' : '未設定';
  cb.className = 'api-badge ' + (ck.length > 10 ? 'badge-ok' : 'badge-none');
}

export function selectModel(el) {
  document.querySelectorAll('.model-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  S.settings.model = el.dataset.model;
}

export function editPrompt(type) {
  S.editPromptType = type;
  document.getElementById('prompt-editor-title').textContent = type === 'short' ? '短摘要 Prompt' : '深度歸檔 Prompt';
  document.getElementById('prompt-editor-ta').value = type === 'short'
    ? (S.settings.promptShort || PROMPT_SHORT)
    : (S.settings.promptDeep || PROMPT_DEEP);
  goTo('screen-prompt-editor');
}

export function savePrompt() {
  const val = document.getElementById('prompt-editor-ta').value.trim();
  if (S.editPromptType === 'short') S.settings.promptShort = val;
  else S.settings.promptDeep = val;
  goBack();
  toast('Prompt 已儲存');
}

export async function saveSettings() {
  S.settings.geminiKey = document.getElementById('gemini-key-input').value.trim();
  S.settings.claudeKey = document.getElementById('claude-key-input').value.trim();
  S.settings.intervalShort = parseInt(document.getElementById('interval-short').value) || 10;
  S.settings.intervalDeep = parseInt(document.getElementById('interval-deep').value) || 20;
  await persist();
  toast('設定已儲存');
}

export function exportCapsule() {
  const { activeGame } = window._store || {};
  const g = activeGame ? activeGame() : null;
  if (!g) { toast('請先進入一個遊戲'); return; }
  const blob = new Blob([JSON.stringify(g, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${g.name}-capsule.json`; a.click();
  URL.revokeObjectURL(url);
}

export function confirmClearAll() {
  if (confirm('確定要清除所有遊戲資料嗎？此動作無法復原。')) {
    S.games = []; persist(); toast('資料已清除');
    const { renderHome } = window._views || {};
    if (renderHome) renderHome();
  }
}
