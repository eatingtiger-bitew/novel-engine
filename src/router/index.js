import { S } from '../state/store.js';

// Views 在 main.js 初始化後透過 window._views 提供
function getView(name) {
  return window._views && window._views[name];
}

export function goTo(id) {
  const prev = S.screenStack[S.screenStack.length - 1];
  document.getElementById(prev)?.classList.remove('active');
  document.getElementById(id)?.classList.add('active');
  S.screenStack.push(id);

  if (id === 'screen-home') getView('renderHome')?.();
  if (id === 'screen-settings') getView('renderSettings')?.();
  if (id === 'screen-game') getView('renderGameScreen')?.();
  if (id === 'screen-new-step3') {
    if (S.newGame.characters.length > 0) {
      const area = document.getElementById('parsed-chars-area');
      if (area) area.style.display = '';
      getView('renderParsedChars')?.();
      const desc = document.querySelector('#screen-new-step3 .step-desc');
      if (desc) desc.textContent = 'AI 已從世界觀設定中自動提取到以下角色，請確認或補充。';
    }
  }
}

export function goBack() {
  if (S.screenStack.length <= 1) return;
  const cur = S.screenStack.pop();
  document.getElementById(cur)?.classList.remove('active');
  const prev = S.screenStack[S.screenStack.length - 1];
  document.getElementById(prev)?.classList.add('active');
  if (prev === 'screen-home') getView('renderHome')?.();
  if (prev === 'screen-settings') getView('renderSettings')?.();
  if (prev === 'screen-game') getView('renderGameScreen')?.();
}

export function goToHome() {
  if (!confirm('確定回到首頁？當前遅戲進度已自動儲存。')) return;
  S.screenStack = ['screen-home'];
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
  ['quest','log','char'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = 'none';
  });
  getView('renderHome')?.();
}
