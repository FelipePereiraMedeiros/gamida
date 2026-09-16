/**
 * ==========================================================================
 * Gamida - Gerenciamento Centralizado de Estado da Aplicação
 * ==========================================================================
 */

const APP_VERSION =
  typeof window !== "undefined" && window.DataLoader && window.DataLoader.VERSION
    ? window.DataLoader.VERSION
    : "2.6.0";

const AppState = {
  language:
    typeof localStorage !== "undefined"
      ? localStorage.getItem("gamida_language") || "hebrew"
      : "hebrew", // 'hebrew' ou 'greek'
  chapters: [],
  currentChapter: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  exerciseMode: "typing", // 'typing', 'choice', 'sentences'
  alphabetSubmode: "order", // 'order', 'impostors', 'shapes', 'classic'
  score: 0,
  streak: 0,
  totalAnswered: 0,
  correctCount: 0,
  distractorCache: { words: [], sentences: [] },
  srs: {},
  survivalHighScore: 0,
  currentTab: "practice",
};

const SimConfig = {
  amount: 25,
  time: 0,
  focus: "mixed", // 'mixed', 'words', 'sentences'
};

/**
 * Extrai o termo ou glifo de um item linguístico (suporta hebraico e grego)
 * @param {Object} item
 * @returns {string}
 */
function getTerm(item) {
  if (!item) return "";
  return item.term || item.hebrew || "";
}

/**
 * Valida a integridade estrutural de um capítulo
 * @param {Object} chapter
 * @returns {boolean}
 */
function isValidChapter(chapter) {
  if (!chapter || typeof chapter !== "object") return false;
  if (typeof chapter.id !== "string" || !chapter.id.trim()) return false;
  if (typeof chapter.title !== "string" || !chapter.title.trim()) return false;
  const collections = [chapter.items, chapter.sentences].filter(Array.isArray);
  if (collections.length === 0) return false;
  const allItems = collections.flat();
  if (allItems.length === 0) return false; // Impede capítulos vazios sem vocabulário
  return allItems.every((item) => {
    const term = item && getTerm(item);
    return (
      item &&
      typeof term === "string" &&
      term.trim() &&
      Array.isArray(item.translations) &&
      item.translations.length > 0 &&
      item.translations.every((translation) => typeof translation === "string")
    );
  });
}

/**
 * Valida se todos os capítulos de uma lista possuem IDs únicos
 * @param {Array} chapters
 * @returns {boolean}
 */
function hasUniqueChapterIds(chapters) {
  if (!Array.isArray(chapters)) return false;
  const ids = chapters.map((chapter) => chapter && chapter.id);
  return ids.every((id, index) => id && ids.indexOf(id) === index);
}

/**
 * Verifica se um capítulo corresponde à Lição do Alfabeto
 * @param {Object|string} chapter
 * @returns {boolean}
 */
function isAlphabetChapter(chapter) {
  if (!chapter) return false;
  if (typeof chapter === "string") {
    return chapter === "kelley_01" || chapter === "bergmann_01";
  }
  return (
    chapter.id === "kelley_01" ||
    chapter.id === "bergmann_01" ||
    (typeof chapter.title === "string" && chapter.title.toLowerCase().includes("alfabeto"))
  );
}

/**
 * Embaralha um array de forma estatisticamente uniforme via algoritmo Fisher-Yates
 * @param {Array} arr
 * @returns {Array} Novo array embaralhado
 */
function shuffleArray(arr) {
  if (!Array.isArray(arr)) return [];
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/**
 * Salva a coleção de capítulos do idioma atual no localStorage
 */
function saveChaptersToStorage() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    `gamida_${AppState.language}_chapters`,
    JSON.stringify(AppState.chapters),
  );
  localStorage.setItem(
    `gamida_data_version_${AppState.language}`,
    APP_VERSION,
  );
}

/**
 * Constrói o cache de distratores para as questões de múltipla escolha
 */
function buildDistractorCache() {
  let w = [], s = [];
  AppState.chapters.forEach((c) => {
    (c.items || []).forEach((i) => w.push(...(i.translations || [])));
    (c.sentences || []).forEach((st) => s.push(...(st.translations || [])));
  });
  AppState.distractorCache.words = [...new Set(w)];
  AppState.distractorCache.sentences = [...new Set(s)];
}

/**
 * Zera as estatísticas da sessão atual
 */
function resetStats() {
  AppState.score = 0;
  AppState.streak = 0;
  AppState.totalAnswered = 0;
  AppState.correctCount = 0;
  updateStatsUI();
}

/**
 * Atualiza os indicadores de pontuação, sequência e precisão na barra superior
 */
function updateStatsUI() {
  if (typeof document === "undefined") return;
  const streakEl = document.getElementById("stat-streak");
  const scoreEl = document.getElementById("stat-score");
  const accEl = document.getElementById("stat-accuracy");

  if (streakEl) streakEl.textContent = AppState.streak;
  if (scoreEl) scoreEl.textContent = AppState.score;
  if (accEl) {
    const acc =
      AppState.totalAnswered > 0
        ? Math.round((AppState.correctCount / AppState.totalAnswered) * 100)
        : 100;
    accEl.textContent = `${acc}%`;
  }
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.APP_VERSION = APP_VERSION;
  window.AppState = AppState;
  window.SimConfig = SimConfig;
  window.getTerm = getTerm;
  window.isValidChapter = isValidChapter;
  window.hasUniqueChapterIds = hasUniqueChapterIds;
  window.isAlphabetChapter = isAlphabetChapter;
  window.shuffleArray = shuffleArray;
  window.saveChaptersToStorage = saveChaptersToStorage;
  window.buildDistractorCache = buildDistractorCache;
  window.resetStats = resetStats;
  window.updateStatsUI = updateStatsUI;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    APP_VERSION,
    AppState,
    SimConfig,
    getTerm,
    isValidChapter,
    hasUniqueChapterIds,
    isAlphabetChapter,
    shuffleArray,
    saveChaptersToStorage,
    buildDistractorCache,
    resetStats,
    updateStatsUI,
  };
}
