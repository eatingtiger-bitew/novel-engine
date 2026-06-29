import { dbSet, dbGet } from './db.js';

export const S = {
  settings: {
    geminiKey: '', claudeKey: '',
    model: 'gemini-2.5-flash',
    intervalShort: 10, intervalDeep: 20,
    promptShort: '', promptDeep: ''
  },
  games: [],
  activeGameId: null,
  newGame: {
    name: '', worldview: '', worldTags: [], fieldTags: [],
    detectedStyle: '', styleSupp: '', characters: [],
    modules: { sidequest: true, combat: false, affinity: true, money: false },
    customFields: []
  },
  editPromptType: null,
  screenStack: ['screen-home'],
  rt: {
    tab: 'story', logFilter: 'all', charFilter: 'all',
    openLogId: null, sqTimer: null, pendingSq: null, currentNpc: null
  }
};

export function activeGame() {
  return S.games.find(g => g.id === S.activeGameId);
}

export async function persist() {
  await dbSet('settings', S.settings);
  await dbSet('games', S.games);
}

export async function load() {
  const s = await dbGet('settings');
  if (s) S.settings = { ...S.settings, ...s };
  const g = await dbGet('games');
  if (g) S.games = g;
}

export function resetNewGame() {
  S.newGame = {
    name: '', worldview: '', worldTags: [], fieldTags: [],
    detectedStyle: '', styleSupp: '', characters: [],
    modules: { sidequest: true, combat: false, affinity: true, money: false },
    customFields: []
  };
  ['new-game-name','new-game-worldview','charcard-input','style-supplement','opening-hint'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const pca = document.getElementById('parsed-chars-area'); if (pca) pca.style.display = 'none';
  const pcl = document.getElementById('parsed-chars-list'); if (pcl) pcl.innerHTML = '';
  const cfl = document.getElementById('custom-fields-list'); if (cfl) cfl.innerHTML = '';
  const toggleMap = { 'toggle-sidequest': true, 'toggle-combat': false, 'toggle-affinity': true, 'toggle-money': false };
  Object.entries(toggleMap).forEach(([id, on]) => {
    const el = document.getElementById(id);
    if (el) { el.classList.toggle('on', on); el.classList.toggle('off', !on); }
  });
}
