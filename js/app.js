/**
 * ==========================================================================
 * Gamida - Biblical Language Trainer (Hebraico & Grego Bíblico)
 * Script Principal da Aplicação
 * ==========================================================================
 */

/* ================= APP STATE & CONFIG ================= */
var APP_VERSION = (typeof window !== "undefined" && window.APP_VERSION)
  ? window.APP_VERSION
  : (typeof DataLoader !== "undefined" && DataLoader.VERSION) ? DataLoader.VERSION : "2.15.2";

var AppState = (typeof window !== "undefined" && window.AppState) ? window.AppState : {
  language: (typeof localStorage !== "undefined" && localStorage.getItem("gamida_language")) || "hebrew",
  chapters: [],
  currentChapter: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  exerciseMode: "typing",
  alphabetSubmode: "order",
  score: 0,
  streak: 0,
  totalAnswered: 0,
  correctCount: 0,
  roundMisses: [],
  previousRound: null,
  distractorCache: { words: [], sentences: [] },
  srs: {},
  mastery: {},
  survivalHighScore: 0,
  isPracticeCumulative: false,
  practiceCategory: "all",
  isVocabCumulative: false,
  vocabCategory: "all",
  selectedChapterIds: [],
  chapterOrder: "asc",
};

var WORD_CATEGORIES = (typeof window !== "undefined" && window.WORD_CATEGORIES)
  ? window.WORD_CATEGORIES
  : [
      { id: "substantivo", label: "Substantivos", match: /substantivo/i },
      { id: "verbo", label: "Verbos", match: /verbo/i },
      { id: "adjetivo", label: "Adjetivos", match: /adjetivo/i },
      { id: "preposicao", label: "Preposições", match: /preposi[cç][aã]o/i },
      { id: "pronome", label: "Pronomes", match: /pronome/i },
      { id: "adverbio", label: "Advérbios", match: /adv[eé]rbio/i },
      { id: "conjuncao", label: "Conjunções", match: /conjun[cç][aã]o/i },
      { id: "artigo", label: "Artigos", match: /artigo/i },
      { id: "particula", label: "Partículas", match: /part[ií]cula/i },
      { id: "numeral", label: "Numerais", match: /numeral/i },
      { id: "nome_proprio", label: "Nomes Próprios", match: /nome pr[oó]prio|nome divino/i },
      { id: "interjeicao", label: "Interjeições", match: /interjei[cç][aã]o/i },
    ];

function matchItemCategory(item, categoryId) {
  if (!categoryId || categoryId === "all") return true;
  const cat = WORD_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return true;
  return cat.match.test(item?.type || "");
}

var DOM = (typeof window !== "undefined" && window.DOM) ? window.DOM : {};


/* ================= CORE LOGIC & INITIALIZATION ================= */
function escapeHTML(str) {
  if (typeof window !== "undefined" && window.EvaluationModule && typeof window.EvaluationModule.escapeHTML === "function") {
    return window.EvaluationModule.escapeHTML(str);
  }
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.escapeHTML === "function") {
    return window.StateModule.escapeHTML(str);
  }
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTerm(item) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.getTerm === "function") {
    return window.StateModule.getTerm(item);
  }
  return item?.term || item?.hebrew || "";
}

function ensureDOM() {
  if (!DOM.qCategory) DOM.qCategory = document.getElementById("question-category");
  if (!DOM.qChapterBadge) DOM.qChapterBadge = document.getElementById("question-chapter-badge");
  if (!DOM.qProgress) DOM.qProgress = document.getElementById("question-progress");
  if (!DOM.hebPrompt) DOM.hebPrompt = document.getElementById("hebrew-prompt");
  if (!DOM.hintText) DOM.hintText = document.getElementById("hint-text");
  if (!DOM.btnHint) DOM.btnHint = document.getElementById("btn-show-hint");
  if (!DOM.banner) DOM.banner = document.getElementById("feedback-banner");
  if (!DOM.interfaces) {
    DOM.interfaces = {
      typing: document.getElementById("interface-typing"),
      choice: document.getElementById("interface-choice"),
      sentences: document.getElementById("interface-sentences"),
    };
  }
  if (!DOM.inputs) {
    DOM.inputs = {
      typing: document.getElementById("input-answer"),
      sentences: document.getElementById("input-sentence"),
    };
  }
  if (!DOM.btnPracticeAnalysis) DOM.btnPracticeAnalysis = document.getElementById("btn-practice-analysis");
  if (!DOM.btnFeedbackAnalysis) DOM.btnFeedbackAnalysis = document.getElementById("btn-feedback-analysis");
  if (!DOM.btnPracticeFav) DOM.btnPracticeFav = document.getElementById("btn-practice-fav");
  if (!DOM.btnNext) DOM.btnNext = document.getElementById("btn-next");
  if (!DOM.btnSubmitTyping) DOM.btnSubmitTyping = document.getElementById("btn-submit-typing");
  if (!DOM.btnSubmitSentence) DOM.btnSubmitSentence = document.getElementById("btn-submit-sentence");
}

async function initApp() {
  const versionDisplay = document.getElementById("app-version-display");
  if (versionDisplay) {
    versionDisplay.textContent = "v" + APP_VERSION;
  }
  const footerVersion = document.getElementById("footer-version-tag");
  if (footerVersion) {
    footerVersion.textContent = "v" + APP_VERSION;
  }

  ensureDOM();

  applyLanguageUI();
  await loadChapters();
  loadSRS();
  buildDistractorCache();
  setupGlobalChapterDropdown();
  updateStatsUI();
  updateParadigmsVisibility();
  updateTabsScrollIndicators();
}

if (typeof window !== "undefined") {
  window.initApp = initApp;
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}

async function loadChapters() {
  try {
    AppState.chapters = await DataLoader.loadChapters(AppState.language);
  } catch (e) {
    console.error("Falha ao carregar capítulos:", e);
    AppState.chapters = [];
  }
  AppState.currentChapter = AppState.chapters[0] || null;
}

function isValidChapter(chapter) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.isValidChapter === "function") {
    return window.StateModule.isValidChapter(chapter);
  }
  return false;
}

function hasUniqueChapterIds(chapters) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.hasUniqueChapterIds === "function") {
    return window.StateModule.hasUniqueChapterIds(chapters);
  }
  return false;
}

function saveChaptersToStorage() {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.saveChaptersToStorage === "function") {
    return window.StateModule.saveChaptersToStorage();
  }
  if (typeof DataLoader !== "undefined" && typeof DataLoader.saveChapters === "function") {
    return DataLoader.saveChapters(AppState.language, AppState.chapters);
  }
}

function buildDistractorCache() {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.buildDistractorCache === "function") {
    return window.StateModule.buildDistractorCache();
  }
  let w = [], s = [];
  (AppState.chapters || []).forEach((c) => {
    (c.items || []).forEach((i) => w.push(...(i.translations || [])));
    (c.sentences || []).forEach((st) => s.push(...(st.translations || [])));
  });
  AppState.distractorCache.words = [...new Set(w)];
  AppState.distractorCache.sentences = [...new Set(s)];
}

/* ================= UI NAVIGATION ================= */
function switchTab(tabName) {
  // Protege um simulado em andamento contra um toque acidental na navegação
  if (
    tabName !== "assessment" &&
    typeof window !== "undefined" &&
    typeof window.confirmLeaveActiveSession === "function" &&
    !window.confirmLeaveActiveSession()
  ) {
    return;
  }

  AppState.currentTab = tabName;

  if (tabName !== "assessment") {
    if (typeof resetToDashboard === "function") {
      try {
        resetToDashboard();
      } catch (e) {
        console.warn("Aviso ao resetar dashboard de avaliação:", e);
      }
    }
  }

  const tabs = ["practice", "assessment", "vocab", "manage", "paradigms"];
  tabs.forEach((t) => {
    const section = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`nav-btn-${t}`);

    if (section) section.classList.toggle("hidden", t !== tabName);
    if (btn) {
      btn.classList.toggle("is-active", t === tabName);
      if (t === tabName) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    }
  });
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") window.scrollTo(0, 0);
  if (tabName === "vocab" && typeof renderVocabTable === "function") renderVocabTable();
  if (tabName === "practice" && typeof updatePracticeChapterView === "function") updatePracticeChapterView();
  if (tabName === "paradigms") {
    if (typeof updateParadigmsVisibility === "function") updateParadigmsVisibility();
    if (typeof renderParadigmSkeleton === "function") renderParadigmSkeleton();
  }

  // No mobile, retrai o menu para foco total na lição
  if (typeof window !== "undefined" && window.innerWidth < 1024 && typeof toggleMobileMenu === "function") {
    toggleMobileMenu(false);
  }
}

// === FASE 3: SETUP DO SELETOR GLOBAL & MULTI-CAPÍTULOS ===
function getSelectedChapters(state = AppState, options = {}) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.getSelectedChapters === "function") {
    return window.StateModule.getSelectedChapters(state, options);
  }
  const chapters = Array.isArray(state?.chapters) ? state.chapters : [];
  const order = options.order || state?.chapterOrder || "asc";
  let result = [];
  if (Array.isArray(state?.selectedChapterIds) && state.selectedChapterIds.length > 0) {
    const selSet = new Set(state.selectedChapterIds);
    result = chapters.filter((c) => c && selSet.has(c.id));
    if (result.length > 1) result = result.filter((c) => !isAlphabetChapter(c));
  }
  if (result.length === 0) {
    result = state?.currentChapter ? [state.currentChapter] : (chapters[0] ? [chapters[0]] : []);
  }
  return order === "desc" && result.length > 1 ? [...result].reverse() : result;
}

function setSelectedChapters(chapterIds, state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.setSelectedChapters === "function") {
    return window.StateModule.setSelectedChapters(chapterIds, state);
  }
  state.selectedChapterIds = Array.isArray(chapterIds) ? [...chapterIds] : [];
  return getSelectedChapters(state);
}

function toggleChapterSelection(chapterId, state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.toggleChapterSelection === "function") {
    return window.StateModule.toggleChapterSelection(chapterId, state);
  }
  return getSelectedChapters(state);
}

function setChapterOrder(order, state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.setChapterOrder === "function") {
    return window.StateModule.setChapterOrder(order, state);
  }
  state.chapterOrder = order === "desc" ? "desc" : "asc";
  return state.chapterOrder;
}

// Não tira o foco de quem está marcando capítulos: no celular isso abriria o teclado
function focusAnswerInput(input) {
  setTimeout(() => {
    const active = document.activeElement;
    if (active && active.closest && active.closest("#chapter-dropdown-list")) return;
    input.focus();
  }, 100);
}

function setupGlobalChapterDropdown() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.setupGlobalChapterDropdown === "function") {
    return window.UIModule.setupGlobalChapterDropdown();
  }
}

function toggleDropdown(forceClose = false) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.toggleDropdown === "function") {
    return window.UIModule.toggleDropdown(forceClose);
  }
  const list = document.getElementById("chapter-dropdown-list");
  if (!list) return;
  if (forceClose) list.classList.add("hidden");
  else list.classList.toggle("hidden");
}

function togglePracticeChapterPicker(eventOrForceClose = false) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.togglePracticeChapterPicker === "function") {
    return window.UIModule.togglePracticeChapterPicker(eventOrForceClose);
  }
}

function changeGlobalChapter(chapterId) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.changeGlobalChapter === "function") {
    return window.UIModule.changeGlobalChapter(chapterId);
  }
}

function togglePracticeChapter(chapterId) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.togglePracticeChapter === "function") {
    return window.UIModule.togglePracticeChapter(chapterId);
  }
  toggleChapterSelection(chapterId, AppState);
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
}

function selectAllPracticeChapters() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.selectAllPracticeChapters === "function") {
    return window.UIModule.selectAllPracticeChapters();
  }
  const vocabIds = (AppState.chapters || []).filter((c) => c && !isAlphabetChapter(c)).map((c) => c.id);
  setSelectedChapters(vocabIds, AppState);
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
}

function setPracticeChapterOrder(order) {
  setChapterOrder(order, AppState);
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.renderChapterSelectorLists === "function") {
    window.UIModule.renderChapterSelectorLists();
  }
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updatePracticeOrderUI === "function") {
    window.UIModule.updatePracticeOrderUI();
  }
  AppState.currentQuestionIndex = 0;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
  lastRenderedVocabChapter = null;
  if (typeof renderVocabTable === "function") renderVocabTable();
  return AppState.chapterOrder;
}

function updatePracticeOrderUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updatePracticeOrderUI === "function") {
    return window.UIModule.updatePracticeOrderUI();
  }
}

function setExerciseMode(mode) {
  AppState.exerciseMode = mode;
  ["typing", "choice", "sentences", "favorites", "errors"].forEach((m) => {
    const btn = document.getElementById(`mode-${m}`);
    if (btn) {
      btn.className = m === mode ? "seg-btn is-active" : "seg-btn";
      btn.setAttribute("aria-pressed", m === mode ? "true" : "false");
    }
  });
  AppState.currentQuestionIndex = 0;
  resetStats();
  updatePracticeCategoryFilterUI();
  buildPracticeQueue();
  renderCurrentQuestion();
  if (typeof window !== "undefined" && typeof window.updatePracticeOptionsSummary === "function") {
    window.updatePracticeOptionsSummary();
  }
}

/* ================= UTILS & EVALUATION ================= */
function normalizeText(str) {
  if (typeof window !== "undefined" && window.EvaluationModule && typeof window.EvaluationModule.normalizeText === "function") {
    return window.EvaluationModule.normalizeText(str);
  }
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getEditDistance(a, b) {
  if (typeof window !== "undefined" && window.EvaluationModule && typeof window.EvaluationModule.getEditDistance === "function") {
    return window.EvaluationModule.getEditDistance(a, b);
  }
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1))
        matrix[i][j] = matrix[i - 1][j - 1];
      else
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
    }
  }
  return matrix[b.length][a.length];
}

function evaluateAnswer(userAnswer, acceptedList, options = {}) {
  if (typeof window !== "undefined" && window.EvaluationModule && typeof window.EvaluationModule.evaluateAnswer === "function") {
    return window.EvaluationModule.evaluateAnswer(userAnswer, acceptedList, options);
  }
  return { status: "incorrect", expected: Array.isArray(acceptedList) ? acceptedList.join(" / ") : "" };
}

function shuffleArray(arr) {
  if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.shuffleArray === "function") {
    return window.StateModule.shuffleArray(arr);
  }
  const newArr = [...(arr || [])];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/* ================= PRACTICE ENGINE ================= */
let practiceQueue = [];

function getAvailablePracticeCategories(state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && window.StateModule.getAvailablePracticeCategories) {
    return window.StateModule.getAvailablePracticeCategories(state);
  }
  let pool = [];
  const activeChapterId = state.currentChapter?.id;
  const chapters = state.chapters || [];
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);

  if (state.isPracticeCumulative) {
    let cumulativeChapters = chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : chapters.length,
    );
    if (activeIdx > 0) {
      cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
    }
    cumulativeChapters.forEach((chap) => {
      (chap.items || []).forEach((item) => pool.push(item));
    });
  } else {
    pool = [...(state.currentChapter?.items || [])];
  }

  pool = Array.from(new Map(pool.map((item) => [getTerm(item), item])).values());

  const available = [];
  WORD_CATEGORIES.forEach((cat) => {
    const count = pool.filter((item) => cat.match.test(item?.type || "")).length;
    if (count > 0) {
      available.push({ ...cat, count });
    }
  });

  return { total: pool.length, categories: available };
}

function getAvailableVocabCategories(state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && window.StateModule.getAvailableVocabCategories) {
    return window.StateModule.getAvailableVocabCategories(state);
  }
  let wordsPool = [];
  let sentencesPool = [];
  const activeChapterId = state.currentChapter?.id;
  const chapters = state.chapters || [];
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);

  if (state.isVocabCumulative) {
    let cumulativeChapters = chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : chapters.length,
    );
    if (activeIdx > 0) {
      cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
    }
    cumulativeChapters.forEach((chap) => {
      (chap.items || []).forEach((item) => wordsPool.push(item));
      (chap.sentences || []).forEach((s) => sentencesPool.push(s));
    });
  } else {
    wordsPool = [...(state.currentChapter?.items || [])];
    sentencesPool = [...(state.currentChapter?.sentences || [])];
  }

  // Deduplica palavras por termo único
  wordsPool = Array.from(new Map(wordsPool.map((item) => [getTerm(item), item])).values());
  // Deduplica frases por termo único
  sentencesPool = Array.from(new Map(sentencesPool.map((item) => [getTerm(item), item])).values());

  const categories = [];
  WORD_CATEGORIES.forEach((cat) => {
    const count = wordsPool.filter((item) => cat.match.test(item?.type || "")).length;
    if (count > 0) {
      categories.push({ ...cat, count });
    }
  });

  return {
    totalItems: wordsPool.length + sentencesPool.length,
    totalWords: wordsPool.length,
    totalSentences: sentencesPool.length,
    categories,
  };
}

function updatePracticeCategoryFilterUI() {
  if (typeof document === "undefined") return;
  const select = document.getElementById("practice-category-select");
  const container = document.getElementById("practice-category-container");
  if (!select) return;

  // Oculta o seletor se o exercício não for Digitação
  if (AppState.exerciseMode !== "typing") {
    if (container) container.classList.add("hidden");
    return;
  }
  if (container) container.classList.remove("hidden");

  const { total, categories } = getAvailablePracticeCategories();

  // Preserva a seleção se ainda estiver disponível, senão reseta para 'all'
  const currentVal = AppState.practiceCategory || "all";
  const isValidSelection = currentVal === "all" || categories.some((c) => c.id === currentVal);
  if (!isValidSelection) {
    AppState.practiceCategory = "all";
  }

  select.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = `Todas as palavras (${total})`;
  select.appendChild(optAll);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = `${cat.label} (${cat.count})`;
    select.appendChild(opt);
  });

  select.value = AppState.practiceCategory;
}

function setPracticeCategory(catId) {
  AppState.practiceCategory = catId || "all";
  AppState.currentQuestionIndex = 0;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
  if (typeof window !== "undefined" && typeof window.updatePracticeOptionsSummary === "function") {
    window.updatePracticeOptionsSummary();
  }
}

function setPracticeCumulative(isCumulative) {
  AppState.isPracticeCumulative = !!isCumulative;
  const chapters = AppState.chapters || [];
  if (chapters.length > 0 && AppState.currentChapter) {
    const activeIdx = chapters.findIndex((c) => c && c.id === AppState.currentChapter.id);
    if (isCumulative) {
      let cumul = chapters.slice(0, activeIdx >= 0 ? activeIdx + 1 : chapters.length);
      if (activeIdx > 0) cumul = cumul.filter((c) => !isAlphabetChapter(c));
      setSelectedChapters(cumul.map((c) => c.id), AppState);
    } else {
      setSelectedChapters([AppState.currentChapter.id], AppState);
    }
    if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.renderChapterSelectorLists === "function") {
      window.UIModule.renderChapterSelectorLists();
    }
  }
  updatePracticeScopeUI();
  updatePracticeCategoryFilterUI();
  AppState.currentQuestionIndex = 0;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
}

function updatePracticeScopeUI() {
  if (typeof document === "undefined") return;
  const btnSingle = document.getElementById("scope-single");
  const btnCumulative = document.getElementById("scope-cumulative");
  const btnAll = document.getElementById("scope-all");
  if (!btnSingle || !btnCumulative) return;

  const selectedChaps = getSelectedChapters(AppState, { forVocab: false });
  const totalVocabChaps = Array.isArray(AppState.chapters)
    ? AppState.chapters.filter((c) => c && !isAlphabetChapter(c)).length
    : 0;
  const isAll = totalVocabChaps > 1 && selectedChaps.length === totalVocabChaps;
  const isCumulative = AppState.isPracticeCumulative || selectedChaps.length > 1;

  const setActive = (btn, isActive) => {
    if (!btn) return;
    btn.className = isActive ? "seg-btn is-active" : "seg-btn";
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  };
  const showAll = !!(isAll && btnAll);
  setActive(btnAll, showAll);
  setActive(btnCumulative, !showAll && isCumulative);
  setActive(btnSingle, !showAll && !isCumulative);
}

/** Favoritas e Erros misturam palavras e frases na mesma fila */
function isMixedPracticeMode() {
  return AppState.exerciseMode === "favorites" || AppState.exerciseMode === "errors";
}

function buildPracticeQueue() {
  const selectedChapters = getSelectedChapters(AppState, {
    forVocab: false,
    order: AppState.chapterOrder || "asc",
  });

  if (!selectedChapters || selectedChapters.length === 0) {
    practiceQueue = [];
    return;
  }

  const orderedQueue = [];
  const seenTerms = new Set();

  selectedChapters.forEach((chap) => {
    if (!chap) return;
    let chapItems = [];

    if (AppState.exerciseMode === "favorites") {
      const favWords = (chap.items || []).filter((i) => !!i.favorite);
      const favSentences = (chap.sentences || []).filter((s) => !!s.favorite);
      chapItems = [...favWords, ...favSentences];
    } else if (AppState.exerciseMode === "errors") {
      chapItems = [...(chap.items || []), ...(chap.sentences || [])].filter(isItemInErrorList);
    } else if (AppState.exerciseMode === "sentences") {
      chapItems = (chap.sentences || []).length > 0 ? [...chap.sentences] : [];
    } else {
      chapItems = [...(chap.items || [])];
    }

    // Filtro por tipo de palavra (quando em Digitação e categoria diferente de 'all')
    if (AppState.exerciseMode === "typing" && AppState.practiceCategory && AppState.practiceCategory !== "all") {
      chapItems = chapItems.filter((item) => matchItemCategory(item, AppState.practiceCategory));
    }

    // Deduplica preservando o agrupamento e a ordem dos capítulos selecionados
    const uniqueChapItems = [];
    chapItems.forEach((item) => {
      const t = getTerm(item);
      if (!t || !seenTerms.has(t)) {
        if (t) seenTerms.add(t);
        try {
          Object.defineProperty(item, "_chapterId", { value: chap.id, writable: true, configurable: true, enumerable: false });
          Object.defineProperty(item, "_chapterTitle", { value: chap.title, writable: true, configurable: true, enumerable: false });
        } catch (_) {}
        uniqueChapItems.push(item);
      }
    });

    // Embaralha dentro de cada capítulo para manter dinamismo sem quebrar a ordem dos capítulos (Primeira ➔ Última ou Última ➔ Primeira)
    orderedQueue.push(...shuffleArray(uniqueChapItems));
  });

  // Fallback para vocabulário caso o modo frases esteja ativo em capítulos sem frases
  if (orderedQueue.length === 0 && AppState.exerciseMode === "sentences") {
    selectedChapters.forEach((chap) => {
      if (!chap) return;
      const fallbackItems = [];
      (chap.items || []).forEach((item) => {
        const t = getTerm(item);
        if (!t || !seenTerms.has(t)) {
          if (t) seenTerms.add(t);
          try {
            Object.defineProperty(item, "_chapterId", { value: chap.id, writable: true, configurable: true, enumerable: false });
            Object.defineProperty(item, "_chapterTitle", { value: chap.title, writable: true, configurable: true, enumerable: false });
          } catch (_) {}
          fallbackItems.push(item);
        }
      });
      orderedQueue.push(...shuffleArray(fallbackItems));
    });
  }

  practiceQueue = orderedQueue;
}

/** Nova rodada em nova ordem, sem repetir de imediato o último item da rodada anterior */
function reshufflePracticeQueue() {
  const lastTerm = getTerm(practiceQueue[practiceQueue.length - 1]);
  buildPracticeQueue();
  if (practiceQueue.length > 1 && getTerm(practiceQueue[0]) === lastTerm) {
    [practiceQueue[0], practiceQueue[1]] = [practiceQueue[1], practiceQueue[0]];
  }
}

function resetPracticeActionButtons() {
  ensureDOM();
  AppState.isPracticeAnswered = false;

  const btnTyping = DOM.btnSubmitTyping || (typeof document !== "undefined" ? document.getElementById("btn-submit-typing") : null);
  if (btnTyping) {
    btnTyping.innerHTML = 'Verificar ➔';
    btnTyping.className = "answer-btn";
    btnTyping.disabled = false;
  }

  const btnSentence = DOM.btnSubmitSentence || (typeof document !== "undefined" ? document.getElementById("btn-submit-sentence") : null);
  if (btnSentence) {
    btnSentence.innerHTML = 'Verificar tradução ➔';
    btnSentence.className = "answer-btn";
    btnSentence.disabled = false;
  }

  const btnNext = DOM.btnNext || (typeof document !== "undefined" ? document.getElementById("btn-next") : null);
  if (btnNext) {
    btnNext.classList.add("hidden");
  }
}

function updatePracticeActionButtonToNext() {
  ensureDOM();
  AppState.isPracticeAnswered = true;

  const isTypingActive = DOM.interfaces?.typing && !DOM.interfaces.typing.classList.contains("hidden");
  const isSentenceActive = DOM.interfaces?.sentences && !DOM.interfaces.sentences.classList.contains("hidden");
  const isChoiceActive = DOM.interfaces?.choice && !DOM.interfaces.choice.classList.contains("hidden");
  const btnNext = DOM.btnNext || (typeof document !== "undefined" ? document.getElementById("btn-next") : null);

  const nextLabelHtml = `<span>Próxima<span class="hidden sm:inline"> questão</span> ➔</span> <kbd class="hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] bg-white/20 text-white rounded font-mono font-medium ml-1">Enter</kbd>`;

  if (isTypingActive) {
    const btnTyping = DOM.btnSubmitTyping || (typeof document !== "undefined" ? document.getElementById("btn-submit-typing") : null);
    if (btnTyping) {
      btnTyping.innerHTML = nextLabelHtml;
      btnTyping.className = "answer-btn animate-pulse-once";
      btnTyping.disabled = false;
    }
    if (btnNext) btnNext.classList.add("hidden");
  } else if (isSentenceActive) {
    const btnSentence = DOM.btnSubmitSentence || (typeof document !== "undefined" ? document.getElementById("btn-submit-sentence") : null);
    if (btnSentence) {
      btnSentence.innerHTML = nextLabelHtml;
      btnSentence.className = "answer-btn animate-pulse-once";
      btnSentence.disabled = false;
    }
    if (btnNext) btnNext.classList.add("hidden");
  } else if (isChoiceActive) {
    if (btnNext) {
      btnNext.innerHTML = nextLabelHtml;
      btnNext.className = "answer-btn flex-1 md:flex-none";
      btnNext.classList.remove("hidden");
    }
  }
}

/** Barra e contagem da rodada: verde para acertos, vermelho para erros */
function updateRoundProgress() {
  if (typeof document === "undefined") return;
  const total = practiceQueue.length;
  const correct = AppState.correctCount || 0;
  const wrong = (AppState.totalAnswered || 0) - correct;
  const percent = (value) => (total > 0 ? `${Math.min(100, (value / total) * 100)}%` : "0%");

  const correctFill = document.getElementById("practice-progress-fill");
  const wrongFill = document.getElementById("practice-progress-wrong");
  if (correctFill) correctFill.style.width = percent(correct);
  if (wrongFill) wrongFill.style.width = percent(wrong);

  const tally = document.getElementById("round-tally");
  const correctEl = document.getElementById("round-tally-correct");
  const wrongEl = document.getElementById("round-tally-wrong");
  if (tally) {
    tally.classList.toggle("hidden", total === 0);
    tally.setAttribute("aria-label", `${correct} ${correct === 1 ? "acerto" : "acertos"} e ${wrong} ${wrong === 1 ? "erro" : "erros"} nesta rodada`);
  }
  if (correctEl) correctEl.textContent = correct;
  if (wrongEl) wrongEl.textContent = wrong;
  const correctWord = document.getElementById("round-tally-correct-word");
  const wrongWord = document.getElementById("round-tally-wrong-word");
  if (correctWord) correctWord.textContent = correct === 1 ? "acerto" : "acertos";
  if (wrongWord) wrongWord.textContent = wrong === 1 ? "erro" : "erros";
}

function hideRoundSummary() {
  if (typeof document === "undefined") return;
  const panel = document.getElementById("standard-practice-panel");
  const summary = document.getElementById("round-summary");
  if (panel) panel.classList.remove("is-summary");
  if (summary) summary.classList.add("hidden");
}

function roundComparisonText(delta) {
  if (delta === null) return "";
  if (delta === 0) return "mesmo resultado da rodada anterior";
  const amount = Math.abs(delta);
  return `${amount} ${amount === 1 ? "acerto" : "acertos"} a ${delta > 0 ? "mais" : "menos"} que a rodada anterior`;
}

function showRoundSummary() {
  if (typeof document === "undefined") return;
  const summary = window.StateModule.getRoundSummary(AppState);
  const panel = document.getElementById("standard-practice-panel");
  const section = document.getElementById("round-summary");
  if (!panel || !section) return;

  AppState.currentQuestion = null;
  document.getElementById("round-summary-correct").textContent = summary.correct;
  document.getElementById("round-summary-total").textContent = summary.total;
  document.getElementById("round-summary-note").textContent = [
    summary.wrong === 0 ? "Nenhum erro nesta rodada" : `${summary.accuracy}% de precisão`,
    roundComparisonText(summary.delta),
  ].filter(Boolean).join(" · ");

  const list = document.getElementById("round-summary-list");
  list.innerHTML = "";
  summary.misses.forEach((item) => {
    const li = document.createElement("li");
    const term = document.createElement("span");
    term.className = `round-summary__term ${AppState.language === "greek" ? "greek-text" : "hebrew-text"}`;
    term.dir = "auto";
    term.textContent = getTerm(item);
    const meaning = document.createElement("span");
    meaning.className = "round-summary__meaning";
    meaning.textContent = (item.translations || []).join(", ");
    li.append(term, meaning);
    list.appendChild(li);
  });
  document.getElementById("round-summary-misses").classList.toggle("hidden", summary.misses.length === 0);
  document.getElementById("btn-round-errors").classList.toggle(
    "hidden",
    summary.misses.length === 0 || AppState.exerciseMode === "errors",
  );

  panel.classList.add("is-summary");
  section.classList.remove("hidden");
  setTimeout(() => {
    const restart = document.getElementById("btn-round-restart");
    if (restart && !section.classList.contains("hidden")) restart.focus();
  }, 100);
}

function restartPracticeRound() {
  window.StateModule.startNewRound(AppState);
  AppState.currentQuestionIndex = 0;
  reshufflePracticeQueue();
  renderCurrentQuestion();
  updateStatsUI();
}

function updateRemoveErrorButton() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("btn-practice-remove-error");
  if (btn) btn.classList.toggle("hidden", AppState.exerciseMode !== "errors" || practiceQueue.length === 0);
}

function renderCurrentQuestion() {
  ensureDOM();
  resetPracticeActionButtons();
  updateRemoveErrorButton();
  hideRoundSummary();
  if (DOM.hebPrompt) DOM.hebPrompt.classList.remove("is-long", "is-message");

  if (practiceQueue.length === 0) {
    AppState.currentQuestion = null;
    updateRoundProgress();
    if (DOM.hebPrompt) DOM.hebPrompt.classList.add("is-message");
    if (DOM.btnPracticeFav) {
      DOM.btnPracticeFav.classList.add("hidden");
    }
    if (AppState.exerciseMode === "errors") {
      const elsewhere = typeof window !== "undefined" && typeof window.getErrorCards === "function"
        ? window.getErrorCards().length
        : 0;
      if (DOM.hebPrompt) DOM.hebPrompt.textContent = "Nenhum erro por aqui";
      if (DOM.qCategory) DOM.qCategory.textContent = "Modo Erros";
      if (DOM.qProgress) DOM.qProgress.textContent = "0 de 0 itens";
      if (DOM.hintText) {
        const scope = AppState.isPracticeCumulative ? "nos capítulos marcados" : "neste capítulo";
        DOM.hintText.textContent = elsewhere > 0
          ? `Não há termos errados ${scope}, mas outros capítulos têm ${elsewhere === 1 ? "1 termo" : `${elsewhere} termos`} na lista.`
          : `Os termos que você errar ${scope} aparecem aqui para praticar quantas vezes quiser.`;
        DOM.hintText.classList.remove("hidden");
      }
      if (DOM.btnHint) DOM.btnHint.classList.add("hidden");
      if (DOM.banner) DOM.banner.classList.add("hidden");
      if (DOM.btnPracticeAnalysis) DOM.btnPracticeAnalysis.classList.add("hidden");
      if (DOM.interfaces) {
        Object.values(DOM.interfaces).forEach((i) => {
          if (i) i.classList.add("hidden");
        });
      }
      return;
    }

    if (AppState.exerciseMode === "favorites") {
      if (DOM.hebPrompt) DOM.hebPrompt.textContent = "Nenhuma favorita ainda";
      if (DOM.qCategory) DOM.qCategory.textContent = "Modo Favoritas";
      if (DOM.qProgress) DOM.qProgress.textContent = "0 de 0 itens";
      if (DOM.hintText) {
        DOM.hintText.innerHTML = `
          <span class="block text-slate-300 text-xs md:text-sm leading-relaxed mb-3">
            Você ainda não marcou nenhuma frase ou palavra como favorita ${AppState.isPracticeCumulative ? "nas lições acumuladas" : "neste capítulo"}.
          </span>
          <button
            type="button"
            onclick="switchTab('vocab')"
            class="answer-btn font-sans"
          >
            Ir para o Dicionário e favoritar itens
          </button>
        `;
        DOM.hintText.classList.remove("hidden");
      }
      if (DOM.btnHint) DOM.btnHint.classList.add("hidden");
      if (DOM.banner) DOM.banner.classList.add("hidden");
      if (DOM.btnPracticeAnalysis) DOM.btnPracticeAnalysis.classList.add("hidden");
      if (DOM.interfaces) {
        Object.values(DOM.interfaces).forEach((i) => {
          if (i) i.classList.add("hidden");
        });
      }
      return;
    }

    if (DOM.hebPrompt) DOM.hebPrompt.textContent = "Sem itens disponíveis.";
    if (DOM.qCategory) DOM.qCategory.textContent = "Sem conteúdo";
    if (DOM.qProgress) DOM.qProgress.textContent = "Nenhum item disponível";
    if (DOM.hintText) {
      DOM.hintText.textContent = "";
      DOM.hintText.classList.add("hidden");
    }
    if (DOM.btnHint) DOM.btnHint.classList.add("hidden");
    if (DOM.banner) DOM.banner.classList.add("hidden");
    if (DOM.interfaces) {
      Object.values(DOM.interfaces).forEach((i) => {
        if (i) i.classList.add("hidden");
      });
    }
    return;
  }

  if (AppState.currentQuestionIndex >= practiceQueue.length) {
    if (AppState.totalAnswered > 0) {
      showRoundSummary();
      return;
    }
    AppState.currentQuestionIndex = 0;
    reshufflePracticeQueue();
  }

  AppState.currentQuestion = practiceQueue[AppState.currentQuestionIndex];

  const isQuestionFavorite = !!AppState.currentQuestion?.favorite;
  const btnPracticeFav = DOM.btnPracticeFav || (typeof document !== "undefined" ? document.getElementById("btn-practice-fav") : null);
  if (btnPracticeFav) {
    btnPracticeFav.classList.remove("hidden");
    btnPracticeFav.innerHTML = isQuestionFavorite ? "⭐" : "☆";
    btnPracticeFav.className = `fav-btn${isQuestionFavorite ? " is-on" : ""}`;
    btnPracticeFav.title = isQuestionFavorite ? "Remover dos favoritos" : "Marcar como favorito";
  }

  const isSentenceQuestion =
    AppState.currentQuestion.type === "Frase" ||
    AppState.currentQuestion.type === "Expressão" ||
    (Array.isArray(AppState.currentQuestion.tokens) && AppState.currentQuestion.tokens.length > 0) ||
    AppState.exerciseMode === "sentences";

  if (DOM.qCategory) {
    const catLabel = AppState.currentQuestion.type || "Geral";
    DOM.qCategory.textContent = AppState.exerciseMode === "favorites" ? `${catLabel} ⭐` : catLabel;
  }
  const qChapterBadge = DOM.qChapterBadge || (typeof document !== "undefined" ? document.getElementById("question-chapter-badge") : null);
  if (qChapterBadge) {
    const chapTitle = AppState.currentQuestion._chapterTitle || AppState.currentChapter?.title || "";
    // Com um único capítulo o contexto já está no painel; o selo só informa em sessões combinadas
    const isCombinedSession = (AppState.selectedChapterIds || []).length > 1;
    if (chapTitle && isCombinedSession) {
      qChapterBadge.textContent = chapTitle;
      qChapterBadge.title = chapTitle;
      qChapterBadge.classList.remove("hidden");
    } else {
      qChapterBadge.classList.add("hidden");
    }
  }
  if (DOM.qProgress) {
    DOM.qProgress.textContent = `Item ${AppState.currentQuestionIndex + 1} de ${practiceQueue.length}`;
  }
  updateRoundProgress();
  if (DOM.hebPrompt) {
    const promptText = getTerm(AppState.currentQuestion);
    DOM.hebPrompt.textContent = promptText;
    // Frases longas usam corpo menor para caber sem rolagem e sem quebrar a leitura
    if (String(promptText).length > 22) DOM.hebPrompt.classList.add("is-long");
  }

  if (DOM.hintText) {
    DOM.hintText.textContent = AppState.currentQuestion.transliteration || "Sem transliteração para este item";
    DOM.hintText.classList.add("hidden");
  }
  if (DOM.btnHint) DOM.btnHint.classList.remove("hidden");
  if (DOM.banner) DOM.banner.classList.add("hidden");

  const isSentenceWithAnalysis = AppState.currentQuestion &&
    (AppState.language === "hebrew" || AppState.language === "greek") &&
    ((AppState.currentQuestion.tokens && AppState.currentQuestion.tokens.length > 0) ||
      AppState.currentQuestion.type === "Frase" ||
      AppState.exerciseMode === "sentences");

  const btnPracticeAnalysis = DOM.btnPracticeAnalysis || (typeof document !== "undefined" ? document.getElementById("btn-practice-analysis") : null);
  if (btnPracticeAnalysis) {
    if (isSentenceWithAnalysis) {
      btnPracticeAnalysis.classList.remove("hidden");
    } else {
      btnPracticeAnalysis.classList.add("hidden");
    }
  }

  if (DOM.interfaces) {
    Object.values(DOM.interfaces).forEach((i) => {
      if (i) i.classList.add("hidden");
    });
  }

  if (AppState.exerciseMode === "typing") {
    if (DOM.inputs && DOM.inputs.typing) {
      DOM.inputs.typing.value = "";
      DOM.inputs.typing.disabled = false;
      if (typeof DOM.inputs.typing.focus === "function") {
        focusAnswerInput(DOM.inputs.typing);
      }
    }
    if (DOM.interfaces && DOM.interfaces.typing) {
      DOM.interfaces.typing.classList.remove("hidden");
    }
  } else if (AppState.exerciseMode === "choice") {
    renderChoiceInterface();
    if (DOM.interfaces && DOM.interfaces.choice) {
      DOM.interfaces.choice.classList.remove("hidden");
    }
  } else if (AppState.exerciseMode === "sentences") {
    if (DOM.inputs && DOM.inputs.sentences) {
      DOM.inputs.sentences.value = "";
      DOM.inputs.sentences.disabled = false;
      if (typeof DOM.inputs.sentences.focus === "function") {
        focusAnswerInput(DOM.inputs.sentences);
      }
    }
    if (DOM.interfaces && DOM.interfaces.sentences) {
      DOM.interfaces.sentences.classList.remove("hidden");
    }
  } else if (isMixedPracticeMode()) {
    if (isSentenceQuestion) {
      if (DOM.inputs && DOM.inputs.sentences) {
        DOM.inputs.sentences.value = "";
        DOM.inputs.sentences.disabled = false;
        if (typeof DOM.inputs.sentences.focus === "function") {
          focusAnswerInput(DOM.inputs.sentences);
        }
      }
      if (DOM.interfaces && DOM.interfaces.sentences) {
        DOM.interfaces.sentences.classList.remove("hidden");
      }
    } else {
      if (DOM.inputs && DOM.inputs.typing) {
        DOM.inputs.typing.value = "";
        DOM.inputs.typing.disabled = false;
        if (typeof DOM.inputs.typing.focus === "function") {
          focusAnswerInput(DOM.inputs.typing);
        }
      }
      if (DOM.interfaces && DOM.interfaces.typing) {
        DOM.interfaces.typing.classList.remove("hidden");
      }
    }
  }
}

function toggleHint() {
  DOM.hintText.classList.toggle("hidden");
  DOM.btnHint.classList.toggle("hidden");
}

function renderChoiceInterface() {
  DOM.interfaces.choice.innerHTML = "";
  const correctAnswer = AppState.currentQuestion.translations[0];

  let pool =
    AppState.exerciseMode === "sentences"
      ? AppState.distractorCache.sentences
      : AppState.distractorCache.words;
  let distractorPool = pool.filter((o) => o !== correctAnswer);
  distractorPool = shuffleArray(distractorPool).slice(0, 3);

  const options = shuffleArray([correctAnswer, ...distractorPool]);
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn hover:border-brand-500 active:scale-[0.99]";
    btn.setAttribute("data-key", String(idx + 1));
    btn.textContent = opt;
    btn.onclick = () => {
      if (AppState.isPracticeAnswered) {
        nextQuestion();
        return;
      }
      checkPracticeAnswer(opt);
    };
    DOM.interfaces.choice.appendChild(btn);
  });
}

function submitAnswer(e) {
  if (e) e.preventDefault();
  if (AppState.isPracticeAnswered) {
    nextQuestion();
    return;
  }
  checkPracticeAnswer(DOM.inputs.typing.value);
}

function submitSentenceAnswer(e) {
  if (e) e.preventDefault();
  if (AppState.isPracticeAnswered) {
    nextQuestion();
    return;
  }
  checkPracticeAnswer(DOM.inputs.sentences.value);
}

function showAssimilationTip(question) {
  const tipEl = document.getElementById("feedback-tip");
  const tipText = document.getElementById("feedback-tip-text");
  if (!tipEl || !tipText) return;
  const tip = typeof window !== "undefined" && window.AssimilationModule
    ? window.AssimilationModule.getAssimilationTip(question, AppState.language)
    : null;
  tipText.textContent = tip ? tip.text : "";
  tipEl.classList.toggle("hidden", !tip);
}

/** Reconhecer entre opções é mais fácil que lembrar: Escolha não conta para o domínio */
function registerMasteryHit() {
  return AppState.exerciseMode !== "choice" && recordMasteryHit(AppState.currentQuestion);
}

function correctAnswerTitle(justMastered) {
  if (justMastered) return "Termo dominado!";
  if (AppState.streak > 0 && AppState.streak % 5 === 0) return `${AppState.streak} seguidas!`;
  return "Excelente! Tradução Correta!";
}

function checkPracticeAnswer(userAnswer) {
  const isSentenceQuestion =
    AppState.exerciseMode === "sentences" ||
    AppState.currentQuestion?.type === "Frase" ||
    AppState.currentQuestion?.type === "Expressão" ||
    (Array.isArray(AppState.currentQuestion?.tokens) && AppState.currentQuestion.tokens.length > 0);
  const evalResult = evaluateAnswer(
    userAnswer,
    AppState.currentQuestion.translations,
    { isSentence: isSentenceQuestion },
  );
  AppState.totalAnswered++;

  const icon = document.getElementById("feedback-icon");
  const title = document.getElementById("feedback-title");
  const detail = document.getElementById("feedback-detail");

  DOM.banner.classList.remove(
    "hidden",
    "bg-emerald-950/80",
    "border-emerald-500/50",
    "bg-rose-950/80",
    "border-rose-500/50",
    "bg-amber-950/80",
    "border-amber-500/50",
  );

  if (evalResult.status === "correct") {
    AppState.correctCount++;
    AppState.streak++;
    DOM.banner.classList.add(
      "bg-emerald-950/80",
      "border-emerald-500/50",
    );
    icon.textContent = "✅";
    title.textContent = correctAnswerTitle(registerMasteryHit());
    title.className = "font-bold text-sm text-emerald-400";
    detail.textContent = `Tradução esperada: "${AppState.currentQuestion.translations.join('" / "')}"`;
  } else if (evalResult.status === "typo") {
    AppState.correctCount++; // Pontua como acerto
    AppState.streak++;
    registerMasteryHit();
    DOM.banner.classList.add("bg-amber-950/80", "border-amber-500/50");
    icon.textContent = "⚠️";
    title.textContent = "Atenção: Erro de Digitação ou Pontuação?";
    title.className = "font-bold text-sm text-amber-400";
    detail.textContent = `Sua resposta foi aceita, mas o ideal é: "${evalResult.expected}". (Você digitou: "${userAnswer}")`;
  } else {
    AppState.streak = 0;
    AppState.roundMisses.push(AppState.currentQuestion);
    recordSRSError(getTerm(AppState.currentQuestion)); // Manda pro Anki
    DOM.banner.classList.add("bg-rose-950/80", "border-rose-500/50");
    icon.textContent = "❌";
    title.textContent = "Incorreto";
    title.className = "font-bold text-sm text-rose-400";
    // Agora mostra TODAS as traduções possíveis!
    detail.textContent = `Traduções aceitas: "${evalResult.expected}" (Você respondeu: "${userAnswer || "em branco"}")`;
  }

  showAssimilationTip(AppState.currentQuestion);
  updateRoundProgress();

  DOM.inputs.typing.disabled = true;
  DOM.inputs.sentences.disabled = true;

  // Desabilita e estiliza botões de múltipla escolha se estiverem presentes
  if (DOM.interfaces && DOM.interfaces.choice) {
    const choiceButtons = DOM.interfaces.choice.querySelectorAll("button");
    choiceButtons.forEach((b) => {
      b.disabled = true;
      b.classList.remove("hover:border-brand-500", "active:scale-[0.99]");
      if (
        b.textContent === evalResult.expected ||
        (AppState.currentQuestion?.translations &&
          AppState.currentQuestion.translations.includes(b.textContent))
      ) {
        b.classList.add("border-emerald-500", "bg-emerald-950/40", "text-emerald-200");
      } else if (b.textContent === userAnswer && evalResult.status !== "correct") {
        b.classList.add("border-rose-500", "bg-rose-950/40", "text-rose-200");
      } else {
        b.classList.add("opacity-50");
      }
    });
  }

  // Transforma o botão "Verificar" em "Próxima Questão" e ajusta estado
  updatePracticeActionButtonToNext();

  const isSentenceWithAnalysis = AppState.currentQuestion &&
    (AppState.language === "hebrew" || AppState.language === "greek") &&
    ((AppState.currentQuestion.tokens && AppState.currentQuestion.tokens.length > 0) ||
      AppState.currentQuestion.type === "Frase" ||
      AppState.exerciseMode === "sentences");

  const btnFeedbackAnalysis = DOM.btnFeedbackAnalysis || (typeof document !== "undefined" ? document.getElementById("btn-feedback-analysis") : null);
  if (btnFeedbackAnalysis) {
    if (isSentenceWithAnalysis) {
      btnFeedbackAnalysis.classList.remove("hidden");
    } else {
      btnFeedbackAnalysis.classList.add("hidden");
    }
  }

  updateStatsUI();
}

function nextQuestion() {
  AppState.currentQuestionIndex++;
  renderCurrentQuestion();
}

function openCurrentPracticeSentenceAnalysis() {
  if (!AppState.currentQuestion) return;
  if (typeof openSentenceAnalysisModal === "function") {
    openSentenceAnalysisModal(AppState.currentQuestion);
  } else if (typeof window !== "undefined" && window.SentenceAnalysisModule && typeof window.SentenceAnalysisModule.openSentenceAnalysisModal === "function") {
    window.SentenceAnalysisModule.openSentenceAnalysisModal(AppState.currentQuestion);
  }
}

function toggleCurrentPracticeFavorite() {
  if (!AppState.currentQuestion) return;
  if (typeof toggleItemFavorite === "function") {
    toggleItemFavorite(AppState.currentQuestion);
  } else if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.toggleItemFavorite === "function") {
    window.UIModule.toggleItemFavorite(AppState.currentQuestion);
  }
  const isFav = !!AppState.currentQuestion.favorite;
  const btn = document.getElementById("btn-practice-fav");
  if (btn) {
    btn.innerHTML = isFav ? "⭐" : "☆";
    btn.className = `fav-btn${isFav ? " is-on" : ""}`;
    btn.title = isFav ? "Remover dos favoritos" : "Marcar como favorito";
  }
}

/** Tira o termo atual da lista de erros e segue para o próximo */
function removeCurrentPracticeError() {
  if (!AppState.currentQuestion || AppState.exerciseMode !== "errors") return;
  removeFromErrorList(AppState.currentQuestion);
  practiceQueue.splice(AppState.currentQuestionIndex, 1);
  renderCurrentQuestion();
}

function resetStats() {
  AppState.score = 0;
  AppState.streak = 0;
  AppState.totalAnswered = 0;
  AppState.correctCount = 0;
  AppState.roundMisses = [];
  AppState.previousRound = null;
  AppState.isPracticeAnswered = false;
  updateStatsUI();

  if (typeof document !== "undefined") {
    const alphaScore = document.getElementById("alphabet-score-indicator");
    const alphaProgress = document.getElementById("alphabet-progress-indicator");
    const alphaCombo = document.getElementById("alphabet-combo-badge");
    if (alphaScore) alphaScore.textContent = "⭐ Pontos: 0";
    if (alphaProgress) alphaProgress.textContent = "Streak: 0";
    if (alphaCombo) alphaCombo.classList.add("hidden");
  }
}

function updateStatsUI() {
  document.getElementById("stat-streak").textContent = AppState.streak;
  document.getElementById("stat-score").textContent = AppState.score;
  // Sem respostas ainda não há precisão a mostrar: "100%" sugeriria um resultado que não existe
  document.getElementById("stat-accuracy").textContent =
    AppState.totalAnswered > 0
      ? `${Math.round((AppState.correctCount / AppState.totalAnswered) * 100)}%`
      : "—";
  if (typeof window !== "undefined" && typeof window.updateReviewDueBadge === "function") {
    window.updateReviewDueBadge();
  }
}

/* ================= SISTEMA DE MEMORIZAÇÃO (SRS) ================= */
// Persistência e agendamento delegados para js/modules/srs.js (SRSModule)
function loadSRS() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.loadSRS === "function") {
    return window.SRSModule.loadSRS();
  }
  return null;
}

function saveSRS() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.saveSRS === "function") {
    return window.SRSModule.saveSRS();
  }
  return null;
}

function isItemInErrorList(item) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.isItemInErrorList === "function") {
    return window.SRSModule.isItemInErrorList(item);
  }
  return false;
}

function removeFromErrorList(item) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.removeFromErrorList === "function") {
    return window.SRSModule.removeFromErrorList(item);
  }
  return false;
}

function recordMasteryHit(item) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.recordMasteryHit === "function") {
    return window.SRSModule.recordMasteryHit(item);
  }
  return false;
}

function recordSRSError(termStr) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.recordSRSError === "function") {
    return window.SRSModule.recordSRSError(termStr);
  }
  return null;
}

/* ================= LANGUAGE SWITCH ENGINE ================= */
async function toggleLanguage(targetLang = null) {
  if (typeof window !== "undefined" && typeof window.confirmLeaveActiveSession === "function" && !window.confirmLeaveActiveSession()) {
    return;
  }

  if (targetLang === "hebrew" || targetLang === "greek") {
    AppState.language = targetLang;
  } else {
    AppState.language = AppState.language === "hebrew" ? "greek" : "hebrew";
  }

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("gamida_language", AppState.language);
    } catch (err) {
      console.warn("Aviso ao salvar idioma no localStorage:", err);
    }
  }

  resetStats();
  AppState.practiceCategory = "all";
  AppState.isPracticeCumulative = false;
  lastRenderedVocabChapter = null;
  applyLanguageUI();
  await loadChapters();
  loadSRS();
  buildDistractorCache();
  setupGlobalChapterDropdown();
  updateParadigmsVisibility();
  switchTab("practice");
}

function updateParadigmsVisibility() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.updateParadigmsVisibility === "function") {
    return window.ParadigmsModule.updateParadigmsVisibility();
  }
  const btnParadigms = document.getElementById("nav-btn-paradigms");
  if (!btnParadigms) return;

  const hasParadigms =
    AppState.currentChapter &&
    Array.isArray(AppState.currentChapter.paradigms) &&
    AppState.currentChapter.paradigms.length > 0;

  if (!hasParadigms) {
    btnParadigms.style.display = "none";
    if (AppState.currentTab === "paradigms") {
      switchTab("practice");
    }
  } else {
    btnParadigms.style.display = "";
  }
  setTimeout(updateTabsScrollIndicators, 50);
}

function applyLanguageUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.applyLanguageUI === "function") {
    return window.UIModule.applyLanguageUI();
  }
}

/* ================= DATA MANAGEMENT ================= */
async function resetDefaultChapters() {
  if (!confirm("Deseja restaurar o vocabulário original desta língua? Quaisquer alterações locais serão perdidas.")) {
    return;
  }
  try {
    if (typeof DataLoader.resetChapters === "function") {
      await DataLoader.resetChapters(AppState.language);
    } else if (DataLoader.storage && typeof DataLoader.storage.removeItem === "function") {
      await DataLoader.storage.removeItem(`gamida_${AppState.language}_chapters`);
      await DataLoader.storage.removeItem(`gamida_data_version_${AppState.language}`);
      await DataLoader.storage.removeItem(`gamida_lastChap_${AppState.language}`);
      await DataLoader.storage.removeItem(`gamida_selectedChaps_${AppState.language}`);
      await DataLoader.storage.removeItem(`gamida_chapOrder_${AppState.language}`);
    }
    const defaults = await DataLoader.fetchDefaultChapters(AppState.language);
    AppState.chapters = JSON.parse(JSON.stringify(defaults));
    AppState.selectedChapterIds = [];
    await DataLoader.saveChapters(AppState.language, AppState.chapters);
    buildDistractorCache();
    setupGlobalChapterDropdown();
    switchTab("practice");
    alert("Capítulos padrão restaurados com sucesso!");
  } catch (e) {
    alert("Erro ao carregar capítulos padrão do arquivo JSON: " + e.message);
  }
}

function exportChaptersJSON() {
  const backupData = {
    version: APP_VERSION,
    language: AppState.language,
    exportedAt: new Date().toISOString(),
    chapters: AppState.chapters,
    srs: AppState.srs,
    mastery: AppState.mastery,
    survivalHighScore: AppState.survivalHighScore,
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const fileName =
    AppState.language === "hebrew"
      ? "gamida_hebraico_capitulos.json"
      : "gamida_grego_capitulos.json";
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  setTimeout(() => {
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }, 100);
}


/* ================= EDITOR VISUAL & GERENCIADOR DE CAPÍTULOS ================= */

function loadCurrentChapterIntoEditor() {
  const inputEl = document.getElementById("json-input");
  const statusEl = document.getElementById("json-status");
  if (!inputEl) return;

  if (!AppState.currentChapter) {
    if (statusEl) {
      statusEl.textContent = "⚠️ Nenhum capítulo selecionado atualmente.";
      statusEl.className = "text-xs font-mono text-amber-400";
    }
    return;
  }

  // Clona o capítulo atual omitindo propriedades internas transitórias
  const chapData = JSON.parse(JSON.stringify(AppState.currentChapter));
  delete chapData._userModified;

  inputEl.value = JSON.stringify(chapData, null, 2);
  validateChapterJSONInput();

  if (statusEl) {
    statusEl.textContent = `📝 Capítulo "${chapData.title || chapData.id}" carregado!`;
    statusEl.className = "text-xs font-mono text-brand-400";
  }
}

function validateChapterJSONInput() {
  const inputEl = document.getElementById("json-input");
  const statusEl = document.getElementById("json-status");
  const feedbackEl = document.getElementById("json-schema-feedback");
  if (!inputEl) return;

  const raw = inputEl.value.trim();
  if (!raw) {
    if (statusEl) {
      statusEl.textContent = "Pronto";
      statusEl.className = "text-xs font-mono text-slate-500";
    }
    if (feedbackEl) {
      feedbackEl.classList.add("hidden");
      feedbackEl.innerHTML = "";
    }
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    // 1. Caso seja backup completo estruturado
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.chapters)) {
      if (statusEl) {
        statusEl.textContent = "Backup Estruturado";
        statusEl.className = "text-xs font-mono text-indigo-400";
      }
      if (feedbackEl) {
        feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-indigo-950/40 border-indigo-700/50 text-indigo-300";
        feedbackEl.innerHTML = `
          <span>📦 <strong>Backup Completo</strong> (${parsed.chapters.length} capítulos)</span>
          <span class="text-[11px] text-indigo-400 font-sans">Idioma: ${escapeHTML(parsed.language || "Todos")}</span>
        `;
      }
      return;
    }

    // 2. Caso seja array de capítulos
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error("O array JSON de capítulos está vazio.");
      }
      const invalidIdx = parsed.findIndex((c) => !isValidChapter(c));
      if (invalidIdx >= 0) {
        throw new Error(`Capítulo na posição [${invalidIdx}] possui schema incompleto ou inválido.`);
      }
      if (statusEl) {
        statusEl.textContent = `${parsed.length} capítulos válidos`;
        statusEl.className = "text-xs font-mono text-emerald-400";
      }
      if (feedbackEl) {
        feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-emerald-950/40 border-emerald-700/50 text-emerald-300";
        feedbackEl.innerHTML = `
          <span>✅ <strong>Coleção Válida</strong> (${parsed.length} capítulos)</span>
          <span class="text-[11px] text-emerald-400 font-sans">IDs únicos confirmados</span>
        `;
      }
      return;
    }

    // 3. Caso seja um único capítulo
    if (parsed && typeof parsed === "object") {
      if (!parsed.id || typeof parsed.id !== "string" || !parsed.id.trim()) {
        throw new Error("Campo obrigatório 'id' ausente ou vazio.");
      }
      if (!parsed.title || typeof parsed.title !== "string" || !parsed.title.trim()) {
        throw new Error("Campo obrigatório 'title' ausente ou vazio.");
      }
      const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.vocabulary) ? parsed.vocabulary : null);
      if (!items && !Array.isArray(parsed.sentences)) {
        throw new Error("O capítulo precisa conter a coleção 'items' (ou 'vocabulary') ou 'sentences'.");
      }
      if (items && items.length > 0) {
        const itemInvalid = items.find((it) => {
          const t = it && (it.hebrew || it.greek || it.term);
          return !t || !Array.isArray(it.translations) || it.translations.length === 0;
        });
        if (itemInvalid) {
          throw new Error("Um ou mais vocábulos não possuem termo principal ou traduções válidas.");
        }
      }

      const totalItems = (items || []).length;
      const totalSents = (parsed.sentences || []).length;

      if (statusEl) {
        statusEl.textContent = "Schema Válido";
        statusEl.className = "text-xs font-mono text-emerald-400";
      }
      if (feedbackEl) {
        feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-emerald-950/40 border-emerald-700/50 text-emerald-300";
        feedbackEl.innerHTML = `
          <span>✅ <strong>${escapeHTML(parsed.title)}</strong> (<code>${escapeHTML(parsed.id)}</code>)</span>
          <span class="text-[11px] text-emerald-400 font-sans">${totalItems} vocábulo(s) • ${totalSents} frase(s)</span>
        `;
      }
      return;
    }

    throw new Error("O formato JSON deve ser um objeto de capítulo, array de capítulos ou backup estruturado.");
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = "Schema Inválido";
      statusEl.className = "text-xs font-mono text-rose-400";
    }
    if (feedbackEl) {
      feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-rose-950/40 border-rose-700/50 text-rose-300";
      feedbackEl.innerHTML = `
        <span>⚠️ <strong>Atenção:</strong></span>
        <span class="text-[11px] text-rose-300 font-sans truncate">${escapeHTML(err.message)}</span>
      `;
    }
  }
}

async function deleteCurrentCustomChapter() {
  if (!AppState.currentChapter) {
    alert("Nenhum capítulo selecionado para exclusão.");
    return;
  }
  if (!AppState.chapters || AppState.chapters.length <= 1) {
    alert("Não é possível excluir o único capítulo restante da coleção.");
    return;
  }

  const target = AppState.currentChapter;
  const isConfirmed = confirm(
    `Deseja realmente excluir o capítulo:\n"${target.title}" (ID: ${target.id})?\nEsta ação removerá o capítulo desta sessão local.`
  );
  if (!isConfirmed) return;

  AppState.chapters = AppState.chapters.filter((c) => c.id !== target.id);
  if (Array.isArray(AppState.selectedChapterIds)) {
    AppState.selectedChapterIds = AppState.selectedChapterIds.filter((id) => id !== target.id);
  }

  saveChaptersToStorage();
  buildDistractorCache();
  setupGlobalChapterDropdown();

  if (AppState.chapters.length > 0) {
    changeGlobalChapter(AppState.chapters[0].id);
  }

  const inputEl = document.getElementById("json-input");
  if (inputEl) inputEl.value = "";
  const statusEl = document.getElementById("json-status");
  if (statusEl) {
    statusEl.textContent = `Capítulo "${target.title}" excluído`;
    statusEl.className = "text-xs font-mono text-amber-400";
  }
  const feedbackEl = document.getElementById("json-schema-feedback");
  if (feedbackEl) {
    feedbackEl.classList.add("hidden");
    feedbackEl.innerHTML = "";
  }
}

function saveChapterFromJSON() {
  const jsonText = document.getElementById("json-input").value.trim();
  const statusEl = document.getElementById("json-status");
  if (!jsonText) {
    statusEl.textContent = "⚠️ O campo JSON está vazio.";
    statusEl.className = "text-xs font-mono text-amber-400";
    return;
  }
  try {
    let parsed = JSON.parse(jsonText);

    // Suporte para backup completo estruturado: { chapters: [...], srs: {...}, survivalHighScore: N, language: "hebrew"|"greek" }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.chapters)) {
      if (parsed.language && parsed.language !== AppState.language) {
        const langTarget = parsed.language === "greek" ? "Grego" : "Hebraico";
        const langCurrent = AppState.language === "greek" ? "Grego" : "Hebraico";
        throw new Error(`Este backup pertence ao idioma '${langTarget}', mas o sistema está atualmente em '${langCurrent}'. Alterne o idioma antes de importar.`);
      }
      if (parsed.srs && typeof parsed.srs === "object") {
        AppState.srs = { ...AppState.srs, ...parsed.srs };
        saveSRS();
      }
      if (parsed.mastery && typeof parsed.mastery === "object") {
        AppState.mastery = { ...AppState.mastery, ...parsed.mastery };
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(`gamida_${AppState.language}_mastery`, JSON.stringify(AppState.mastery));
          } catch (storageErr) {
            console.warn("Aviso ao salvar domínio no localStorage:", storageErr);
          }
        }
      }
      if (typeof parsed.survivalHighScore === "number" && parsed.survivalHighScore > AppState.survivalHighScore) {
        AppState.survivalHighScore = parsed.survivalHighScore;
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(`gamida_${AppState.language}_survival_high`, AppState.survivalHighScore);
          } catch (storageErr) {
            console.warn("Aviso ao salvar recorde de sobrevivência no localStorage:", storageErr);
          }
        }
      }
      parsed = parsed.chapters;
    }

    // Suporte para importação de backup completo com múltiplos capítulos
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) throw new Error("O array JSON está vazio.");
      if (AppState.language === "hebrew" && parsed.every((c) => c && typeof c.id === "string" && c.id.startsWith("bergmann_"))) {
        throw new Error("Estes capítulos pertencem ao curso de Grego (Bergmann). Alterne o idioma para Grego antes de importar.");
      }
      if (AppState.language === "greek" && parsed.every((c) => c && typeof c.id === "string" && c.id.startsWith("kelley_"))) {
        throw new Error("Estes capítulos pertencem ao curso de Hebraico (Kelley). Alterne o idioma para Hebraico antes de importar.");
      }
      if (!parsed.every(isValidChapter)) {
        throw new Error("Um ou mais capítulos no array possuem formato inválido.");
      }
      if (!hasUniqueChapterIds(parsed)) {
        throw new Error("Existem capítulos com IDs duplicados no arquivo informado.");
      }

      const updatedChapters = [...AppState.chapters];
      parsed.forEach((incomingChap) => {
        if (incomingChap && typeof incomingChap === "object") {
          incomingChap._userModified = true;
        }
        const existingIdx = updatedChapters.findIndex((c) => c.id === incomingChap.id);
        if (existingIdx >= 0) {
          updatedChapters[existingIdx] = incomingChap;
        } else {
          updatedChapters.push(incomingChap);
        }
      });

      if (!hasUniqueChapterIds(updatedChapters)) {
        throw new Error("Conflito de IDs únicos com capítulos já existentes.");
      }

      AppState.chapters = updatedChapters;
      saveChaptersToStorage();
      buildDistractorCache();
      setupGlobalChapterDropdown();
      changeGlobalChapter(parsed[0].id);

      statusEl.textContent = `✅ ${parsed.length} capítulo(s) importado(s) com sucesso!`;
      statusEl.className = "text-xs font-mono text-emerald-400";
      return;
    }

    const newChap = parsed;
    if (AppState.language === "hebrew" && newChap && typeof newChap.id === "string" && newChap.id.startsWith("bergmann_")) {
      throw new Error("Este capítulo pertence ao curso de Grego (Bergmann). Alterne o idioma para Grego antes de importar.");
    }
    if (AppState.language === "greek" && newChap && typeof newChap.id === "string" && newChap.id.startsWith("kelley_")) {
      throw new Error("Este capítulo pertence ao curso de Hebraico (Kelley). Alterne o idioma para Hebraico antes de importar.");
    }
    if (!isValidChapter(newChap)) throw new Error("Formato inválido.");
    if (newChap && typeof newChap === "object") {
      newChap._userModified = true;
    }
    const existingIdx = AppState.chapters.findIndex(
      (c) => c.id === newChap.id,
    );
    const updatedChapters = [...AppState.chapters];
    if (existingIdx >= 0) updatedChapters[existingIdx] = newChap;
    else updatedChapters.push(newChap);

    if (!hasUniqueChapterIds(updatedChapters)) {
      throw new Error("Já existe um capítulo com este ID.");
    }

    AppState.chapters = updatedChapters;

    saveChaptersToStorage();
    buildDistractorCache();
    setupGlobalChapterDropdown();
    changeGlobalChapter(newChap.id);

    statusEl.textContent = "✅ Salvo com sucesso!";
    statusEl.className = "text-xs font-mono text-emerald-400";
  } catch (err) {
    statusEl.textContent = `❌ Erro: ${err.message}`;
    statusEl.className = "text-xs font-mono text-rose-400";
  }
}

/* ================= VOCABULARY DICTIONARY TABLE ================= */
let lastRenderedVocabChapter = null;

function setVocabCumulative(isCumulative) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.setVocabCumulative === "function") {
    return window.UIModule.setVocabCumulative(isCumulative);
  }
  return null;
}

function setVocabCategory(catId) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.setVocabCategory === "function") {
    return window.UIModule.setVocabCategory(catId);
  }
  return null;
}

function updateVocabScopeUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updateVocabScopeUI === "function") {
    return window.UIModule.updateVocabScopeUI();
  }
  return null;
}

function updateVocabCategoryFilterUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updateVocabCategoryFilterUI === "function") {
    return window.UIModule.updateVocabCategoryFilterUI();
  }
  return null;
}

function renderVocabTable() {
  // === INJEÇÃO DOS PARADIGMAS NO FINAL DA LISTA ===
  // Delegado para o UIModule utilizando getStaticParadigmTableHTML
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.renderVocabTable === "function") {
    return window.UIModule.renderVocabTable();
  }
  return null;
}

function filterVocabTable() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.filterVocabTable === "function") {
    return window.UIModule.filterVocabTable();
  }
  return null;
}

function toggleItemFavorite(item) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.toggleItemFavorite === "function") {
    return window.UIModule.toggleItemFavorite(item);
  }
  return null;
}

/* ================= CUMULATIVE ASSESSMENT LOGIC ================= */
// Lógica de Avaliação Cumulativa & Simulados Diagnósticos (AssessmentModule)
// Lógica principal e diagnóstico implementados em js/modules/assessment.js
var SimConfig = (typeof window !== "undefined" && window.SimConfig)
  ? window.SimConfig
  : { amount: 25, time: 0, focus: "mixed" };
var assessQuestions = (typeof window !== "undefined" && window.assessQuestions) ? window.assessQuestions : [];
var assessIndex = 0;
var assessAnswersMap = {};
let assessTimerInterval = null;
let assessTimeCount = 0;

function resetToDashboard() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.resetToDashboard === "function") {
    return window.AssessmentModule.resetToDashboard();
  }
  return null;
}

function openSimuladoConfig() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.openSimuladoConfig === "function") {
    return window.AssessmentModule.openSimuladoConfig();
  }
  return null;
}

function closeSimuladoConfig() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.closeSimuladoConfig === "function") {
    return window.AssessmentModule.closeSimuladoConfig();
  }
  return null;
}

function setSimConfig(type, value) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.setSimConfig === "function") {
    return window.AssessmentModule.setSimConfig(type, value);
  }
  return null;
}

function startSimulado() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.startSimulado === "function") {
    return window.AssessmentModule.startSimulado();
  }
  return null;
}

function startAssessmentTimer() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.startAssessmentTimer === "function") {
    return window.AssessmentModule.startAssessmentTimer();
  }
  return null;
}

function saveCurrentInputDraft() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.saveCurrentInputDraft === "function") {
    return window.AssessmentModule.saveCurrentInputDraft();
  }
  return null;
}

function renderAssessmentQuestion() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.renderAssessmentQuestion === "function") {
    return window.AssessmentModule.renderAssessmentQuestion();
  }
  return null;
}

function navigateAssessment(direction) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.navigateAssessment === "function") {
    return window.AssessmentModule.navigateAssessment(direction);
  }
  return null;
}

function jumpToAssessmentQuestion(index) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.jumpToAssessmentQuestion === "function") {
    return window.AssessmentModule.jumpToAssessmentQuestion(index);
  }
  return null;
}

function initAssessmentTracker() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.initAssessmentTracker === "function") {
    return window.AssessmentModule.initAssessmentTracker();
  }
  return null;
}

function updateAllTrackerPills() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.updateAllTrackerPills === "function") {
    return window.AssessmentModule.updateAllTrackerPills();
  }
  return null;
}

function updateTrackerPillState(idx) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.updateTrackerPillState === "function") {
    return window.AssessmentModule.updateTrackerPillState(idx);
  }
  return null;
}

function confirmFinishAssessmentPrompt() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.confirmFinishAssessmentPrompt === "function") {
    return window.AssessmentModule.confirmFinishAssessmentPrompt();
  }
  return null;
}

function finishAssessment() {
  // Diagnóstico implementado em js/modules/assessment.js:
  // const chapterErrors = {};
  // Classificação: 'Revisão Urgente', 'Revisão Recomendada', 'Excelente Domínio'
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.finishAssessment === "function") {
    return window.AssessmentModule.finishAssessment();
  }
  return null;
}

/* ================= LÓGICA DO ANKI (FLASHCARDS) ================= */
// Lógica de Flashcards SRS delegada para js/modules/srs.js (SRSModule)
let ankiQueue = [];
let ankiCurrentCard = null;
let ankiStats = { hard: 0, good: 0, easy: 0 };
let ankiTotalCards = 0;

function startAnki(mode) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.startAnki === "function") {
    return window.SRSModule.startAnki(mode);
  }
  return null;
}

function renderAnkiCard() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.renderAnkiCard === "function") {
    return window.SRSModule.renderAnkiCard();
  }
  return null;
}

function revealAnki() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.revealAnki === "function") {
    return window.SRSModule.revealAnki();
  }
  return null;
}

function answerAnki(grade) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.answerAnki === "function") {
    return window.SRSModule.answerAnki(grade);
  }
  return null;
}

function finishAnki() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.finishAnki === "function") {
    return window.SRSModule.finishAnki();
  }
  return null;
}

function openCurrentAnkiSentenceAnalysis() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.openCurrentAnkiSentenceAnalysis === "function") {
    return window.SRSModule.openCurrentAnkiSentenceAnalysis();
  }
  return null;
}

/* ================= FASE 3: LÓGICA DE SOBREVIVÊNCIA (MORTE SÚBITA) ================= */
// Lógica do Modo Sobrevivência delegada para js/modules/survival.js (SurvivalModule)
let survLives = 3;
let survStreak = 0;
let survQueue = [];
let survCurrent = null;

function startSurvival() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.startSurvival === "function") {
    return window.SurvivalModule.startSurvival();
  }
  return null;
}

function updateSurvivalUI() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.updateSurvivalUI === "function") {
    return window.SurvivalModule.updateSurvivalUI();
  }
  return null;
}

function nextSurvivalQuestion() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.nextSurvivalQuestion === "function") {
    return window.SurvivalModule.nextSurvivalQuestion();
  }
  return null;
}

function submitSurvivalAnswer() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.submitSurvivalAnswer === "function") {
    return window.SurvivalModule.submitSurvivalAnswer();
  }
  return null;
}

function finishSurvival(surrendered = false) {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.finishSurvival === "function") {
    return window.SurvivalModule.finishSurvival(surrendered);
  }
  return null;
}

function resetSurvival() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.resetSurvival === "function") {
    return window.SurvivalModule.resetSurvival();
  }
  return null;
}

function updateSurvivalDashboardRecord() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.updateSurvivalDashboardRecord === "function") {
    return window.SurvivalModule.updateSurvivalDashboardRecord();
  }
  return null;
}

// Interceptador global da tecla ENTER (Modo Sobrevivência e Modo de Prática)
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented) return;
    const modal = document.getElementById("sentence-analysis-modal");
    if (modal && !modal.classList.contains("hidden")) return;

    // 1. Modo Sobrevivência
    const survActive = document.getElementById("survival-active");
    if (
      survActive &&
      !survActive.classList.contains("hidden") &&
      e.key === "Enter"
    ) {
      const input = document.getElementById("survival-input");
      if (document.activeElement === input) {
        e.preventDefault();
        submitSurvivalAnswer();
      }
      return;
    }

    const typingTarget = document.activeElement;
    const isTypingField =
      typingTarget &&
      (typingTarget.tagName === "INPUT" || typingTarget.tagName === "TEXTAREA" || typingTarget.tagName === "SELECT");

    // Revisão: Espaço revela o cartão; 1, 2 e 3 classificam a lembrança
    const ankiActive = document.getElementById("anki-active");
    if (ankiActive && !ankiActive.classList.contains("hidden") && !isTypingField) {
      const ankiBack = document.getElementById("anki-back");
      const isRevealed = ankiBack && !ankiBack.classList.contains("hidden");
      if (!isRevealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        revealAnki();
      } else if (isRevealed && ["1", "2", "3"].includes(e.key)) {
        e.preventDefault();
        answerAnki({ 1: "hard", 2: "good", 3: "easy" }[e.key]);
      }
      return;
    }

    // 2. Modo de Prática Padrão
    const tabPractice = document.getElementById("tab-practice");
    const stdPanel = document.getElementById("standard-practice-panel");
    const isPracticeVisible = tabPractice && !tabPractice.classList.contains("hidden");
    const isStdPanelVisible = stdPanel && !stdPanel.classList.contains("hidden");

    // Múltipla escolha: teclas 1 a 4 respondem sem o mouse
    if (isPracticeVisible && isStdPanelVisible && !isTypingField && !AppState.isPracticeAnswered && /^[1-4]$/.test(e.key)) {
      const choicePanel = DOM.interfaces && DOM.interfaces.choice;
      if (choicePanel && !choicePanel.classList.contains("hidden")) {
        const option = choicePanel.querySelector(`[data-key="${e.key}"]`);
        if (option) {
          e.preventDefault();
          option.click();
        }
      }
      return;
    }

    if (isPracticeVisible && isStdPanelVisible && e.key === "Enter") {
      // Enter em um botão de ação do feedback aciona o botão, não a próxima questão
      if (document.activeElement && document.activeElement.id === "btn-feedback-analysis") return;

      // Se a resposta já foi verificada, QUALQUER tecla Enter avança imediatamente para a próxima questão
      if (AppState.isPracticeAnswered) {
        e.preventDefault();
        nextQuestion();
        return;
      }

      // Se ainda não foi verificada e o usuário está no textarea de frases:
      // Enter sem Shift submete a tradução (Shift+Enter permite quebra de linha)
      if (
        DOM.inputs &&
        DOM.inputs.sentences &&
        document.activeElement === DOM.inputs.sentences
      ) {
        if (!e.shiftKey) {
          e.preventDefault();
          submitSentenceAnswer();
          return;
        }
      }
    }
  });
}

/* ================= TAB 5: MOTOR DE PARADIGMAS & ARRASTAR ================= */
// Motor de paradigmas gramaticais delegado para js/modules/paradigms.js (ParadigmsModule)
let activeParadigm = null;
let draggedElement = null;
let selectedChip = null;

function renderParadigmSkeleton() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.renderParadigmSkeleton === "function") {
    return window.ParadigmsModule.renderParadigmSkeleton();
  }
  return null;
}

function renderTableView(paradigm, container) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.renderTableView === "function") {
    return window.ParadigmsModule.renderTableView(paradigm, container);
  }
  return null;
}

function renderDiagramView(paradigm, container) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.renderDiagramView === "function") {
    return window.ParadigmsModule.renderDiagramView(paradigm, container);
  }
  return null;
}

function onDragStart(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragStart === "function") {
    return window.ParadigmsModule.onDragStart(e);
  }
  return null;
}

function onDragEnd(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragEnd === "function") {
    return window.ParadigmsModule.onDragEnd(e);
  }
  return null;
}

function onDragOver(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragOver === "function") {
    return window.ParadigmsModule.onDragOver(e);
  }
  return null;
}

function onDragLeave(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragLeave === "function") {
    return window.ParadigmsModule.onDragLeave(e);
  }
  return null;
}

function onDropToZone(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDropToZone === "function") {
    return window.ParadigmsModule.onDropToZone(e);
  }
  return null;
}

function onDropToDeck(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDropToDeck === "function") {
    return window.ParadigmsModule.onDropToDeck(e);
  }
  return null;
}

function onChipClick(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onChipClick === "function") {
    return window.ParadigmsModule.onChipClick(e);
  }
  return null;
}

function clearChipSelection() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.clearChipSelection === "function") {
    return window.ParadigmsModule.clearChipSelection();
  }
  return null;
}

function onZoneClick(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onZoneClick === "function") {
    return window.ParadigmsModule.onZoneClick(e);
  }
  return null;
}

function checkParadigmAnswers() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.checkParadigmAnswers === "function") {
    return window.ParadigmsModule.checkParadigmAnswers();
  }
  return null;
}

function resetParadigmBoard() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.resetParadigmBoard === "function") {
    return window.ParadigmsModule.resetParadigmBoard();
  }
  return null;
}

function getStaticDiagramHTML(paradigm) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.getStaticDiagramHTML === "function") {
    return window.ParadigmsModule.getStaticDiagramHTML(paradigm);
  }
  return "";
}

function getStaticParadigmTableHTML(paradigm) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.getStaticParadigmTableHTML === "function") {
    return window.ParadigmsModule.getStaticParadigmTableHTML(paradigm);
  }
  return "";
}

/* ================= COFFEE & PIX DONATION ================= */
// Apoio ao desenvolvedor: chave PIX '9e6c4330-9897-4f94-b4b4-e5a81dafe219' (Felipe Pereira Medeiros - NuBank)
// Feedback estruturado com badge 'Copiado!' e fallback via document.execCommand("copy")
function copyPixCoffee(btn) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.copyPixCoffee === "function") {
    return window.UIModule.copyPixCoffee(btn);
  }
  return null;
}

function fallbackCopyPix(text) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.fallbackCopyPix === "function") {
    return window.UIModule.fallbackCopyPix(text);
  }
  // Fallback legível: document.execCommand("copy")
  return null;
}

function resetCoffeeButton(button) {
  // Restaura o estado e o rótulo: 'Pague-me um café!'
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.resetCoffeeButton === "function") {
    return window.UIModule.resetCoffeeButton(button);
  }
  return null;
}

/* ================= ALPHABET GAMIFIED ENGINE ================= */
// Motor gamificado do alfabeto delegado para js/modules/alphabet.js (AlphabetGameEngine)
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

function updatePracticeChapterView() {
  // Filtro contextual de visibilidade do modo Frases e Paradigmas:
  // if (!hasSentences) btnSentences.classList.add("hidden");
  // if (!hasParadigms) btnParadigms.style.display = "none";
  const engine = typeof window !== "undefined" && (window.AlphabetModule || window.AlphabetGameEngine);
  if (engine && typeof engine.updatePracticeChapterView === "function") {
    return engine.updatePracticeChapterView();
  }
}

function setAlphabetSubmode(submode) {
  resetStats();
  // Submodos suportados com botões alpha-mode-: "order", "impostors", "shapes", "classic"
  const engine = typeof window !== "undefined" && (window.AlphabetModule || window.AlphabetGameEngine);
  if (engine && typeof engine.setAlphabetSubmode === "function") {
    return engine.setAlphabetSubmode(submode);
  }
}

function nextAlphabetChallenge() {
  // Elementos do motor: alphabet-feedback-banner, alphabet-combo-badge, alphabet-score-indicator
  // Detector de impostores: targetGlyph: "⚖️", t !== group.target, alternativas únicas com new Set
  const engine = typeof window !== "undefined" && (window.AlphabetModule || window.AlphabetGameEngine);
  if (engine && typeof engine.nextAlphabetChallenge === "function") {
    return engine.nextAlphabetChallenge();
  }
}

var AlphabetGameEngine = (typeof window !== "undefined" && window.AlphabetGameEngine) 
  ? window.AlphabetGameEngine 
  : {};

/* ================= MOBILE MENU RETRACT / REVEAL ================= */
// Menu retrátil mobile delegado para js/modules/ui.js (UIModule)
let isMobileMenuExpanded = false;

function toggleMobileMenu(forceState) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.toggleMobileMenu === "function") {
    return window.UIModule.toggleMobileMenu(forceState);
  }
  return null;
}

/* ================= CAROUSEL TABS HORIZONTAL SCROLL INDICATORS ================= */
// Navegação do carrossel de abas delegada para js/modules/ui.js (UIModule)
function scrollTabs(direction) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.scrollTabs === "function") {
    return window.UIModule.scrollTabs(direction);
  }
  return null;
}

function updateTabsScrollIndicators() {
  // Verificação de transbordamento de abas: container.scrollWidth > container.clientWidth
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updateTabsScrollIndicators === "function") {
    return window.UIModule.updateTabsScrollIndicators();
  }
  return null;
}

if (typeof window !== "undefined") {
  if (!window._tabsResizeListenerBound) {
    window._tabsResizeListenerBound = true;
    window.addEventListener("resize", () => {
      if (typeof window.UIModule !== "undefined" && typeof window.UIModule.scheduleUpdateTabsScrollIndicators === "function") {
        window.UIModule.scheduleUpdateTabsScrollIndicators();
      } else {
        updateTabsScrollIndicators();
      }
    });
  }
  window.changeGlobalChapter = changeGlobalChapter;
  window.togglePracticeChapter = togglePracticeChapter;
  window.selectAllPracticeChapters = selectAllPracticeChapters;
  window.setPracticeChapterOrder = setPracticeChapterOrder;
  window.updatePracticeOrderUI = updatePracticeOrderUI;
  window.togglePracticeChapterPicker = togglePracticeChapterPicker;
  window.getSelectedChapters = getSelectedChapters;
  window.setSelectedChapters = setSelectedChapters;
  window.toggleChapterSelection = toggleChapterSelection;
  window.setChapterOrder = setChapterOrder;
  window.buildPracticeQueue = buildPracticeQueue;
  window.renderCurrentQuestion = renderCurrentQuestion;
  window.setPracticeCumulative = setPracticeCumulative;
  window.setPracticeCategory = setPracticeCategory;
  window.getAvailablePracticeCategories = getAvailablePracticeCategories;
  window.updatePracticeCategoryFilterUI = updatePracticeCategoryFilterUI;
  window.updatePracticeScopeUI = updatePracticeScopeUI;
  window.setVocabCumulative = setVocabCumulative;
  window.setVocabCategory = setVocabCategory;
  window.getAvailableVocabCategories = getAvailableVocabCategories;
  window.updateVocabScopeUI = updateVocabScopeUI;
  window.updateVocabCategoryFilterUI = updateVocabCategoryFilterUI;
  window.renderVocabTable = renderVocabTable;
  window.filterVocabTable = filterVocabTable;
  window.toggleItemFavorite = toggleItemFavorite;
  window.toggleCurrentPracticeFavorite = toggleCurrentPracticeFavorite;
  window.removeCurrentPracticeError = removeCurrentPracticeError;
  window.restartPracticeRound = restartPracticeRound;
  window.WORD_CATEGORIES = WORD_CATEGORIES;
  window.matchItemCategory = matchItemCategory;
  window.openCurrentPracticeSentenceAnalysis = openCurrentPracticeSentenceAnalysis;
  window.resetPracticeActionButtons = resetPracticeActionButtons;
  window.updatePracticeActionButtonToNext = updatePracticeActionButtonToNext;
  window.loadCurrentChapterIntoEditor = loadCurrentChapterIntoEditor;
  window.validateChapterJSONInput = validateChapterJSONInput;
  window.deleteCurrentCustomChapter = deleteCurrentCustomChapter;
  window.saveChapterFromJSON = saveChapterFromJSON;
  if (typeof openSentenceAnalysisModal !== "undefined") {
    window.openSentenceAnalysisModal = openSentenceAnalysisModal;
  }
  if (typeof closeSentenceAnalysisModal !== "undefined") {
    window.closeSentenceAnalysisModal = closeSentenceAnalysisModal;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    changeGlobalChapter,
    togglePracticeChapter,
    selectAllPracticeChapters,
    setPracticeChapterOrder,
    updatePracticeOrderUI,
    togglePracticeChapterPicker,
    getSelectedChapters,
    setSelectedChapters,
    toggleChapterSelection,
    setChapterOrder,
    setPracticeCumulative,
    setPracticeCategory,
    getAvailablePracticeCategories,
    updatePracticeCategoryFilterUI,
    updatePracticeScopeUI,
    setVocabCumulative,
    setVocabCategory,
    getAvailableVocabCategories,
    updateVocabScopeUI,
    updateVocabCategoryFilterUI,
    renderVocabTable,
    filterVocabTable,
    toggleItemFavorite,
    toggleCurrentPracticeFavorite,
    removeCurrentPracticeError,
    restartPracticeRound,
    WORD_CATEGORIES,
    matchItemCategory,
    openCurrentPracticeSentenceAnalysis,
    resetPracticeActionButtons,
    updatePracticeActionButtonToNext,
    loadCurrentChapterIntoEditor,
    validateChapterJSONInput,
    deleteCurrentCustomChapter,
    saveChapterFromJSON,
  };
}




