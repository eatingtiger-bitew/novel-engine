// === 故事引擎 main.js ===
import { openDB } from './state/db.js';
import { S, load, persist, activeGame, resetNewGame } from './state/store.js';
import { goTo, goBack, goToHome } from './router/index.js';
import { toggleTheme, applyStoredTheme } from './utils/theme.js';
import { toast } from './utils/toast.js';
import { esc } from './utils/escape.js';

import { renderHome, deleteGame } from './views/HomeView.js';
import {
  renderSettings, onApiKeyChange, selectModel,
  editPrompt, savePrompt, saveSettings, exportCapsule, confirmClearAll
} from './views/SettingsView.js';
import {
  runAnalysis, removeTag, parseCharCards, renderParsedChars,
  removeChar, addBlankChar, toggleSwitch, addCustomField,
  renderCustomFields, delCustomField, buildSummaryAndGoStep5, startGame
} from './views/NewGameView.js';
import { renderGameScreen, switchTab } from './views/GameView.js';
import { renderQuestTab } from './views/QuestView.js';
import { renderLogList, setLogFilter } from './views/LogView.js';
import { renderCharList, setCharFilter } from './views/CharView.js';
import { openStatsPanel, closeStatsPanel } from './components/StatsPanel.js';
import { showSqModal, dismissSqModal, startSidequest, returnToMain } from './components/SqBanner.js';
import {
  onImpFileSelect, runImpFileAnalysis, renderImpCharsList,
  addImpChar, renderImpQuestList, addImpQuest, delImpQuest,
  buildImpConfirmAndGoStep3, startImportedGame, IMP
} from './views/ImportView.js';
import { generateStory } from './engine/gameEngine.js';

// ── 把 view render 函數注入 router ──
window._views = {
  renderHome, renderSettings, renderGameScreen,
  renderParsedChars, renderQuestTab, renderLogList, renderCharList
};

// ── 把 store 物件掛到 window 供 HTML oninput 使用 ──
window.S = S;
window._IMP = IMP;
window._store = { activeGame, persist };

// ── 全域函數（HTML onclick 需要） ──
// 注意：resetNewGame 和 toast 都需要掛上去
Object.assign(window, {
  // utils
  toast,
  esc,
  // router
  goTo,
  goBack,
  goToHome,
  // theme
  toggleTheme,
  // home
  renderHome,
  deleteGame,
  // settings
  renderSettings,
  onApiKeyChange,
  selectModel,
  editPrompt,
  savePrompt,
  saveSettings,
  exportCapsule,
  confirmClearAll,
  // new game wizard
  resetNewGame,
  runAnalysis,
  removeTag,
  parseCharCards,
  removeChar,
  addBlankChar,
  toggleSwitch,
  addCustomField,
  renderCustomFields,
  delCustomField,
  buildSummaryAndGoStep5,
  startGame,
  // game
  switchTab,
  generateStory,
  // tabs
  setLogFilter,
  setCharFilter,
  // stats panel
  openStatsPanel,
  closeStatsPanel,
  // sidequest
  showSqModal,
  dismissSqModal,
  startSidequest,
  returnToMain,
  // import
  onImpFileSelect,
  runImpFileAnalysis,
  addImpChar,
  addImpQuest,
  delImpQuest,
  buildImpConfirmAndGoStep3,
  startImportedGame,
  // helpers for dynamic HTML onclick
  _removeTag: removeTag,
  _removeChar: removeChar,
  _delCustomField: delCustomField,
  _deleteGame: deleteGame,
  _impRemoveChar: (i) => { IMP.characters.splice(i, 1); renderImpCharsList(); },
  _delImpQuest: delImpQuest,
});

// ── 初始化 ──
async function init() {
  await openDB();
  await load();
  applyStoredTheme();
  renderHome();
  renderSettings();
}

init()
  .then(() => { console.log('[故事引擎] 初始化完成'); })
  .catch(e => {
    console.error('[故事引擎] 初始化失敗:', e);
    if (window.debugLog) window.debugLog('init() 失敗: ' + (e && e.message ? e.message : String(e)));
  });
