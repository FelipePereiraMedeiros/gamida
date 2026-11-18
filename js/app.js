/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Biblical Language Trainer (Hebraico & Grego Bíblico)
 * Script Principal da Aplicação
 * ==========================================================================
 */

/*
 * As telas ficam em js/screens/ (practice, review, consult, manage), carregadas
 * antes deste arquivo. Aqui: estado, início, navegação, utilidades, SRS, troca
 * de idioma, alfabeto e o menu do celular.
 */

/* ================= APP STATE & CONFIG ================= */
var APP_VERSION = (typeof window !== "undefined" && window.APP_VERSION)
  ? window.APP_VERSION
  : (typeof DataLoader !== "undefined" && DataLoader.VERSION) ? DataLoader.VERSION : "2.47.0";

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
  return ((typeof window !== "undefined" && window.GamidaHTML) || require("./modules/html.js")).escapeHTML(str);
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

  loadChoiceDirection();
  applyLanguageUI();
  await loadChapters();
  loadSRS();
  buildDistractorCache();
  setupGlobalChapterDropdown();
  updateChoiceDirectionUI();
  if (typeof window !== "undefined" && window.ActivityModule) window.ActivityModule.updateActivityUI();
  if (typeof window !== "undefined" && window.ProfilesModule) window.ProfilesModule.updateProfileBadge();
  if (typeof window !== "undefined" && window.TodayModule) window.TodayModule.render();
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
/**
 * Navegação: Estudar (practice), Revisar (review), Jogar (play), Consultar
 * (vocab e paradigms) e Perfil (profile e manage).
 * Revisar e Jogar são os dois lados do mesmo painel (#tab-assessment): o lado
 * escolhe quais grupos de modos aparecem. "assessment" vale como Revisar.
 */
const TAB_SECTIONS = ["practice", "assessment", "vocab", "manage", "paradigms", "profile"];
const NAV_ITEMS = ["practice", "review", "play", "consult", "profile"];

function navItemFor(section, hub) {
  if (section === "assessment") return hub === "play" ? "play" : "review";
  if (section === "vocab" || section === "paradigms") return "consult";
  if (section === "manage") return "profile";
  return section;
}

/** Mostra só os grupos de modos do lado escolhido (Revisar ou Jogar) */
function applyAssessHub(hub) {
  if (typeof document === "undefined") return;
  document.querySelectorAll("#assess-dashboard [data-hub]").forEach((group) => {
    group.classList.toggle("hidden", group.dataset.hub !== hub);
  });
  const title = document.getElementById("assess-title");
  const text = document.getElementById("assess-text");
  if (title) title.textContent = hub === "play" ? "Jogar" : "Revisar";
  if (text) {
    text.textContent = hub === "play"
      ? "Revise jogando, com as palavras das lições. As respostas digitadas certas também contam para o domínio."
      : "Fixe o que já estudou e meça o que já sabe.";
  }
}

function switchTab(tabName) {
  const section = tabName === "review" || tabName === "play" ? "assessment" : tabName;
  const hub = tabName === "play" ? "play" : section === "assessment" ? "review" : AppState.assessHub;
  const sameHub = section === "assessment" && AppState.currentTab === "assessment" && hub === AppState.assessHub;
  // Protege um simulado em andamento contra um toque acidental na navegação
  if (
    !sameHub &&
    AppState.currentTab === "assessment" &&
    typeof window !== "undefined" &&
    typeof window.confirmLeaveActiveSession === "function" &&
    !window.confirmLeaveActiveSession()
  ) {
    return;
  }

  // Trocar de aba (ou de lado do painel) fecha o modo aberto e volta aos cartões
  if (!sameHub && typeof resetToDashboard === "function") {
    try {
      resetToDashboard();
    } catch (e) {
      console.warn("Aviso ao resetar dashboard de avaliação:", e);
    }
  }

  AppState.currentTab = section;
  if (section === "assessment") {
    AppState.assessHub = hub;
    applyAssessHub(hub);
  }

  TAB_SECTIONS.forEach((t) => {
    const el = document.getElementById(`tab-${t}`);
    if (el) el.classList.toggle("hidden", t !== section);
  });
  const active = navItemFor(section, hub);
  NAV_ITEMS.forEach((item) => {
    const btn = document.getElementById(`nav-btn-${item}`);
    if (!btn) return;
    btn.classList.toggle("is-active", item === active);
    if (item === active) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
  // Chave Dicionário | Tabelas, só dentro de Consultar
  const consult = document.getElementById("consult-switch");
  if (consult) consult.classList.toggle("hidden", active !== "consult");
  ["vocab", "paradigms"].forEach((t) => {
    const btn = document.getElementById(`nav-btn-${t}`);
    if (!btn) return;
    btn.classList.toggle("is-active", t === section);
    btn.setAttribute("aria-pressed", String(t === section));
  });
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") window.scrollTo(0, 0);
  if (section === "vocab" && typeof renderVocabTable === "function") renderVocabTable();
  if (section === "practice" && typeof window !== "undefined" && window.TodayModule) window.TodayModule.render();
  if (section === "profile" && typeof window !== "undefined" && window.ProfilesModule) window.ProfilesModule.renderProfileTab();
  if (section === "assessment" && typeof window !== "undefined" && window.MasteryPathModule) {
    window.MasteryPathModule.updatePathDashboardStat();
  }
  if (section === "assessment" && typeof window !== "undefined") {
    const stonesBest = document.getElementById("stones-card-best");
    if (stonesBest && window.StoneRainModule) stonesBest.textContent = window.StoneRainModule.getBest();
    if (window.ScribeModule) window.ScribeModule.updateScribeCardStat();
  }
  if (section === "practice" && typeof updatePracticeChapterView === "function") updatePracticeChapterView();
  if (section === "paradigms") {
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
  // Escolher uma ordem desliga a mistura das lições
  if (AppState.mixChapters) setMixChapters(false, AppState);
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

/** Prática com as lições misturadas: os itens de todas as lições selecionadas num só embaralhamento */
function setPracticeChapterMix(on) {
  setMixChapters(on, AppState);
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updatePracticeOrderUI === "function") {
    window.UIModule.updatePracticeOrderUI();
  }
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updatePracticeOptionsSummary === "function") {
    window.UIModule.updatePracticeOptionsSummary();
  }
  AppState.currentQuestionIndex = 0;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
  return AppState.mixChapters;
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
  updateChoiceDirectionUI();
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
  updateChoiceDirectionUI();
  updateParadigmsVisibility();
  switchTab("practice");
}

/** Tabelas e grafos ficam apagados (com o motivo) quando o capítulo não tem tabelas */
function setParadigmsAvailable(btn, available) {
  btn.disabled = !available;
  btn.title = available ? "Tabelas e grafos do capítulo atual" : "Este capítulo não tem tabelas e grafos";
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

  setParadigmsAvailable(btnParadigms, hasParadigms);
  if (!hasParadigms && AppState.currentTab === "paradigms") switchTab("vocab");
  setTimeout(updateTabsScrollIndicators, 50);
}

function applyLanguageUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.applyLanguageUI === "function") {
    return window.UIModule.applyLanguageUI();
  }
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
  window.setPracticeChapterMix = setPracticeChapterMix;
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




