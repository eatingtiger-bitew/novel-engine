// === 故事引擎 main.js ===
import { openDB } from './state/db.js';
import { S, load, persist, activeGame, resetNewGame } from './state/store.js';
import { goTo, goBack, goToHome } from './router/index.js';
import { toggleTheme, applyStoredTheme } from './utils/theme.js';
import { toast } from './utils/toast.js';
import { esc } from './utils/escape.js';

import { renderHome, deleteGame } from './views/HomeView.js';
import { renderSettings, onApiKeyChange, selectModel, editPrompt, savePrompt, saveSettings, exportCapsule, confirmClearAll } from './views/SettingsView.js';
import { runAnalysis, renderStep2, renderTags, removeTag, parseCharCards, renderParsedChars, removeChar, addBlankChar, toggleSwitch, addCustomField, renderCustomFields, delCustomField, buildSummaryAndGoStep5, startGame } from './views/NewGameView.js';
import { renderGameScreen, switchTab } from './views/GameView.js';
import { renderQuestTab } from './views/QuestView.js';
import { renderLogList, setLogFilter } from './views/LogView.js';
import { renderCharList, setCharFilter } from './views/CharView.js';
import { openStatsPanel, closeStatsPanel } from './components/StatsPanel.js';
import { showSqModal, dismissSqModal, startSidequest } from './components/SqBanner.js';
import { onImpFileSelect, runImpFileAnalysis, renderImpCharsList, addImpChar, renderImpQuestList, addImpQuest, delImpQuest, buildImpConfirmAndGoStep3, startImportedGame, IMP } from './views/ImportView.js';
import { generateStory } from './engine/gameEngine.js';

// ── 把 view render 函數注入 router ──
window._views = {
  renderHome, renderSettings, renderGameScreen,
  renderParsedChars, renderQuestTab, renderLogList, renderCharList
};

// ── 把常用物件掛到 window 供 HTML oninput/onclick 使用 ──
window.S = S;
window._IMP = IMP;
window._store = { activeGame, persist };
window._toast = toast;

// ── 全域函數（HTML onclick 需要） ──
Object.assign(window, {
  // router
  goTo, goBack, goToHome,
  // theme
  toggleTheme,
  // home
  renderHome, deleteGame,
  // settings
  renderSettings, onApiKeyChange, selectModel, editPrompt, savePrompt, saveSettings, exportCapsule, confirmClearAll,
  // new game wizard
  runAnalysis, removeTag, parseCharCards, removeChar, addBlankChar,
  toggleSwitch, addCustomField, delCustomField, buildSummaryAndGoStep5, startGame,
  // game
  switchTab, generateStory,
  // quest/log/char
  setLogFilter, setCharFilter,
  // stats panel
  openStatsPanel, closeStatsPanel,
  // sidequest
  showSqModal, dismissSqModal, startSidequest,
  // import
  onImpFileSelect, runImpFileAnalysis, addImpChar, addImpQuest, delImpQuest, buildImpConfirmAndGoStep3, startImportedGame,
  // helpers exposed to html template strings in views
  _removeTag: removeTag,
  _removeChar: removeChar,
  _delCustomField: delCustomField,
  _deleteGame: deleteGame,
  _impRemoveChar: (i) => { IMP.characters.splice(i,1); renderImpCharsList(); },
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

init().catch(console.error);
