/**
 * ==========================================================================
 * Gamida - Biblical Language Trainer (Hebraico & Grego Bíblico)
 * Script Principal da Aplicação
 * ==========================================================================
 */

/* ================= APP STATE & CONFIG ================= */
var APP_VERSION = (typeof window !== "undefined" && window.APP_VERSION)
  ? window.APP_VERSION
  : (typeof DataLoader !== "undefined" && DataLoader.VERSION) ? DataLoader.VERSION : "2.7.1";

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
  isNewRoundPending: false,
  distractorCache: { words: [], sentences: [] },
  srs: {},
  survivalHighScore: 0,
  isPracticeCumulative: false,
  practiceCategory: "all",
  isVocabCumulative: false,
  vocabCategory: "all",
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
  if (typeof localStorage === "undefined" && typeof DataLoader === "undefined") return;
  try {
    if (typeof DataLoader !== "undefined" && typeof DataLoader.saveChapters === "function") {
      DataLoader.saveChapters(AppState.language, AppState.chapters);
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `gamida_${AppState.language}_chapters`,
        JSON.stringify(AppState.chapters),
      );
      localStorage.setItem(
        `gamida_data_version_${AppState.language}`,
        APP_VERSION,
      );
    }
  } catch (err) {
    console.warn("Aviso ao salvar capítulos no storage:", err);
  }
}

function buildDistractorCache() {
  let w = [],
    s = [];
  AppState.chapters.forEach((c) => {
    (c.items || []).forEach((i) => w.push(...(i.translations || [])));
    (c.sentences || []).forEach((st) =>
      s.push(...(st.translations || [])),
    );
  });
  AppState.distractorCache.words = [...new Set(w)];
  AppState.distractorCache.sentences = [...new Set(s)];
}

/* ================= UI NAVIGATION ================= */
function switchTab(tabName) {
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
      if (t === tabName) {
        btn.className =
          "px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold bg-brand-600 text-white shadow-md transition hover:bg-brand-500 whitespace-nowrap shrink-0";
      } else {
        btn.className =
          "px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition whitespace-nowrap shrink-0";
      }
    }
  });
  if (tabName === "vocab" && typeof renderVocabTable === "function") renderVocabTable();
  if (tabName === "practice" && typeof updatePracticeChapterView === "function") updatePracticeChapterView();
  if (tabName === "paradigms") {
    if (typeof updateParadigmsVisibility === "function") updateParadigmsVisibility();
    if (typeof renderParadigmSkeleton === "function") renderParadigmSkeleton();
  }

  // No mobile, retrai o menu para foco total na lição
  if (typeof window !== "undefined" && window.innerWidth < 768 && typeof toggleMobileMenu === "function") {
    toggleMobileMenu(false);
  }
}

// === FASE 3: SETUP DO SELETOR GLOBAL (DROPDOWN PREMIUM) ===
function setupGlobalChapterDropdown() {
  const list = document.getElementById("chapter-dropdown-list");
  const btnText = document.getElementById("chapter-dropdown-text");
  if (!list || !btnText) return;

  list.innerHTML = "";

  // Constrói a lista bonita (ul/li)
  AppState.chapters.forEach((chap) => {
    const li = document.createElement("li");
    const isAlpha = isAlphabetChapter(chap);
    li.className = isAlpha
      ? "px-4 py-3.5 text-sm text-brand-300 font-semibold bg-indigo-950/20 hover:bg-slate-800 hover:text-white cursor-pointer transition border-l-4 border-indigo-500 hover:border-brand-400 flex items-center justify-between"
      : "px-4 py-3.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white hover:font-bold cursor-pointer transition border-l-4 border-transparent hover:border-brand-500";

    if (isAlpha) {
      li.innerHTML = `<span>${escapeHTML(chap.title)}</span><span class="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">🔤 Alfabeto</span>`;
    } else {
      li.textContent = chap.title;
    }

    // O que acontece quando clica numa opção
    li.onclick = () => {
      toggleDropdown(true); // Força fechar
      changeGlobalChapter(chap.id);
      if (window.innerWidth < 768 && typeof toggleMobileMenu === "function") {
        toggleMobileMenu(false); // Retrai o menu no mobile para focar na lição
      }
    };
    list.appendChild(li);
  });

  // Recupera a memória de idioma
  const savedChap = localStorage.getItem(
    `gamida_lastChap_${AppState.language}`,
  );
  const activeChap =
    AppState.chapters.find((c) => c.id === savedChap) ||
    AppState.chapters[0];

  if (activeChap) {
    changeGlobalChapter(activeChap.id);
  }
}

// Função auxiliar para abrir/fechar a lista
function toggleDropdown(forceClose = false) {
  const list = document.getElementById("chapter-dropdown-list");
  if (!list) return;
  if (forceClose) {
    list.classList.add("hidden");
  } else {
    list.classList.toggle("hidden");
  }
}

// Evento para fechar o dropdown se o usuário clicar fora dele
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("custom-chapter-selector");
  if (dropdown && !dropdown.contains(e.target)) {
    toggleDropdown(true);
  }
});

// === FASE 3: O COMANDO CENTRAL ===
function changeGlobalChapter(chapterId) {
  if (!chapterId) return;

  const found = AppState.chapters.find((c) => c.id === chapterId);
  if (found) {
    AppState.currentChapter = found;
    AppState.activeChapterId = found.id;

    // Atualiza o texto do botão
    const btnText = document.getElementById("chapter-dropdown-text");
    if (btnText) {
      btnText.textContent = found.title;
      btnText.title = found.title;
    }

    // Salva a preferência
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          `gamida_lastChap_${AppState.language}`,
          found.id,
        );
      } catch (err) {
        console.warn("Aviso ao salvar último capítulo no localStorage:", err);
      }
    }

    // Interrompe sessões que pertencem ao capítulo anterior.
    if (typeof resetToDashboard === "function") {
      try {
        resetToDashboard();
      } catch (e) {
        console.warn("Aviso ao resetar sessões anteriores:", e);
      }
    }

    // 1. Atualiza Praticar
    AppState.currentQuestionIndex = 0;
    AppState.currentQuestion = null;
    if (typeof resetStats === "function") resetStats();
    if (typeof updatePracticeChapterView === "function") updatePracticeChapterView();
    if (typeof updatePracticeCategoryFilterUI === "function") updatePracticeCategoryFilterUI();
    if (typeof buildPracticeQueue === "function") buildPracticeQueue();
    if (typeof renderCurrentQuestion === "function") renderCurrentQuestion();

    // 2. Atualiza Dicionário
    lastRenderedVocabChapter = null;
    if (typeof renderVocabTable === "function") renderVocabTable();

    // 3. Atualiza Paradigmas
    if (typeof updateParadigmsVisibility === "function") updateParadigmsVisibility();
    const parSelect = document.getElementById("paradigm-select");
    if (parSelect) {
      parSelect.innerHTML =
        '<option value="">Selecione o Esquema / Tabela...</option>';
      if (found.paradigms && found.paradigms.length > 0) {
        found.paradigms.forEach((par, idx) => {
          const opt = document.createElement("option");
          opt.value = idx;
          opt.textContent = par.title;
          parSelect.appendChild(opt);
        });
      }
    }
    if (typeof resetParadigmBoard === "function") resetParadigmBoard();
  }
}

function setExerciseMode(mode) {
  AppState.exerciseMode = mode;
  ["typing", "choice", "sentences"].forEach((m) => {
    const btn = document.getElementById(`mode-${m}`);
    if (btn) {
      btn.className =
        m === mode
          ? "px-3 py-1.5 rounded-lg font-medium transition bg-brand-600 text-white"
          : "px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200";
    }
  });
  AppState.currentQuestionIndex = 0;
  AppState.isNewRoundPending = false;
  resetStats();
  updatePracticeCategoryFilterUI();
  buildPracticeQueue();
  renderCurrentQuestion();
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

function evaluateAnswer(userAnswer, acceptedList) {
  if (typeof window !== "undefined" && window.EvaluationModule && typeof window.EvaluationModule.evaluateAnswer === "function") {
    return window.EvaluationModule.evaluateAnswer(userAnswer, acceptedList);
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
  AppState.isNewRoundPending = false;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
}

function setPracticeCumulative(isCumulative) {
  AppState.isPracticeCumulative = !!isCumulative;
  updatePracticeScopeUI();
  updatePracticeCategoryFilterUI();
  AppState.currentQuestionIndex = 0;
  AppState.isNewRoundPending = false;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
}

function updatePracticeScopeUI() {
  if (typeof document === "undefined") return;
  const btnSingle = document.getElementById("scope-single");
  const btnCumulative = document.getElementById("scope-cumulative");
  if (!btnSingle || !btnCumulative) return;

  if (AppState.isPracticeCumulative) {
    btnCumulative.className = "px-3 py-1.5 rounded-lg font-medium transition bg-brand-600 text-white flex items-center gap-1";
    btnSingle.className = "px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200";
  } else {
    btnSingle.className = "px-3 py-1.5 rounded-lg font-medium transition bg-brand-600 text-white";
    btnCumulative.className = "px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200 flex items-center gap-1";
  }
}

function buildPracticeQueue() {
  if (!AppState.currentChapter) {
    practiceQueue = [];
    return;
  }

  let baseList = [];
  const activeChapterId = AppState.currentChapter.id;
  const activeIdx = AppState.chapters.findIndex((c) => c.id === activeChapterId);

  if (AppState.isPracticeCumulative) {
    let cumulativeChapters = AppState.chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
    );
    if (activeIdx > 0) {
      cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
    }

    if (AppState.exerciseMode === "sentences") {
      cumulativeChapters.forEach((chap) => {
        (chap.sentences || []).forEach((s) => baseList.push(s));
      });
      if (baseList.length === 0) {
        cumulativeChapters.forEach((chap) => {
          (chap.items || []).forEach((i) => baseList.push(i));
        });
      }
    } else {
      cumulativeChapters.forEach((chap) => {
        (chap.items || []).forEach((i) => baseList.push(i));
      });
    }

    // Deduplica itens por termo
    baseList = Array.from(new Map(baseList.map((item) => [getTerm(item), item])).values());
  } else {
    if (AppState.exerciseMode === "sentences") {
      baseList = AppState.currentChapter.sentences?.length
        ? AppState.currentChapter.sentences
        : AppState.currentChapter.items || [];
    } else {
      baseList = AppState.currentChapter.items || [];
    }
  }

  // Filtro por tipo de palavra (quando em Digitação e categoria diferente de 'all')
  if (AppState.exerciseMode === "typing" && AppState.practiceCategory && AppState.practiceCategory !== "all") {
    baseList = baseList.filter((item) => matchItemCategory(item, AppState.practiceCategory));
  }

  // Embaralha a lista e salva na fila de prática
  practiceQueue = shuffleArray(baseList);
}

function renderCurrentQuestion() {
  ensureDOM();

  if (practiceQueue.length === 0) {
    AppState.currentQuestion = null;
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
    AppState.currentQuestionIndex = 0;
    // O ciclo completou uma rodada e voltou para a primeira palavra.
    // Mantém os dados da rodada anterior até que o aluno responda novamente.
    AppState.isNewRoundPending = true;
  }

  AppState.currentQuestion = practiceQueue[AppState.currentQuestionIndex];

  if (DOM.qCategory) DOM.qCategory.textContent = AppState.currentQuestion.type || "Geral";
  if (DOM.qProgress) DOM.qProgress.textContent = `Item ${AppState.currentQuestionIndex + 1} de ${practiceQueue.length}`;
  if (DOM.hebPrompt) DOM.hebPrompt.textContent = getTerm(AppState.currentQuestion);

  if (DOM.hintText) {
    DOM.hintText.textContent = `Transliteração: [ ${AppState.currentQuestion.transliteration || "N/A"} ]`;
    DOM.hintText.classList.add("hidden");
  }
  if (DOM.btnHint) DOM.btnHint.classList.remove("hidden");
  if (DOM.banner) DOM.banner.classList.add("hidden");

  const isSentenceWithAnalysis = AppState.currentQuestion &&
    AppState.language === "hebrew" &&
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
        setTimeout(() => DOM.inputs.typing.focus(), 100);
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
        setTimeout(() => DOM.inputs.sentences.focus(), 100);
      }
    }
    if (DOM.interfaces && DOM.interfaces.sentences) {
      DOM.interfaces.sentences.classList.remove("hidden");
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
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-brand-500 font-medium text-sm text-slate-200 transition active:scale-[0.99]";
    btn.textContent = opt;
    btn.onclick = () => checkPracticeAnswer(opt);
    DOM.interfaces.choice.appendChild(btn);
  });
}

function submitAnswer(e) {
  if (e) e.preventDefault();
  checkPracticeAnswer(DOM.inputs.typing.value);
}

function submitSentenceAnswer(e) {
  if (e) e.preventDefault();
  checkPracticeAnswer(DOM.inputs.sentences.value);
}

function checkPracticeAnswer(userAnswer) {
  // Se o ciclo havia voltado para o início, reseta a análise no momento da primeira resposta da nova rodada
  if (AppState.isNewRoundPending) {
    resetStats();
    AppState.isNewRoundPending = false;
  }

  const evalResult = evaluateAnswer(
    userAnswer,
    AppState.currentQuestion.translations,
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
    AppState.score += AppState.exerciseMode === "sentences" ? 20 : 10;
    AppState.streak++;
    DOM.banner.classList.add(
      "bg-emerald-950/80",
      "border-emerald-500/50",
    );
    icon.textContent = "✅";
    title.textContent = "Excelente! Tradução Correta!";
    title.className = "font-bold text-sm text-emerald-400";
    detail.textContent = `Tradução esperada: "${AppState.currentQuestion.translations.join('" / "')}"`;
  } else if (evalResult.status === "typo") {
    AppState.correctCount++; // Pontua como acerto
    AppState.score += AppState.exerciseMode === "sentences" ? 20 : 10;
    AppState.streak++;
    DOM.banner.classList.add("bg-amber-950/80", "border-amber-500/50");
    icon.textContent = "⚠️";
    title.textContent = "Atenção: Erro de Digitação ou Pontuação?";
    title.className = "font-bold text-sm text-amber-400";
    detail.textContent = `Sua resposta foi aceita, mas o ideal é: "${evalResult.expected}". (Você digitou: "${userAnswer}")`;
  } else {
    AppState.streak = 0;
    recordSRSError(getTerm(AppState.currentQuestion)); // Manda pro Anki
    DOM.banner.classList.add("bg-rose-950/80", "border-rose-500/50");
    icon.textContent = "❌";
    title.textContent = "Incorreto";
    title.className = "font-bold text-sm text-rose-400";
    // Agora mostra TODAS as traduções possíveis!
    detail.textContent = `Traduções aceitas: "${evalResult.expected}" (Você respondeu: "${userAnswer || "em branco"}")`;
  }

  DOM.inputs.typing.disabled = true;
  DOM.inputs.sentences.disabled = true;

  const isSentenceWithAnalysis = AppState.currentQuestion &&
    AppState.language === "hebrew" &&
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

function resetStats() {
  AppState.score = 0;
  AppState.streak = 0;
  AppState.totalAnswered = 0;
  AppState.correctCount = 0;
  AppState.isNewRoundPending = false;
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
  const accuracy =
    AppState.totalAnswered > 0
      ? Math.round((AppState.correctCount / AppState.totalAnswered) * 100)
      : 100;
  document.getElementById("stat-accuracy").textContent = `${accuracy}%`;
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

function recordSRSError(termStr) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.recordSRSError === "function") {
    return window.SRSModule.recordSRSError(termStr);
  }
  return null;
}

/* ================= LANGUAGE SWITCH ENGINE ================= */
async function toggleLanguage() {
  AppState.language = AppState.language === "hebrew" ? "greek" : "hebrew";

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
  const btnParadigms = document.getElementById("nav-btn-paradigms");
  if (!btnParadigms) return;

  const hasParadigms =
    AppState.currentChapter &&
    Array.isArray(AppState.currentChapter.paradigms) &&
    AppState.currentChapter.paradigms.length > 0;

  if (AppState.language === "hebrew" || !hasParadigms) {
    btnParadigms.style.display = "none"; // Força o bloqueio visual quando não há paradigmas ou em hebraico

    if (AppState.currentTab === "paradigms") {
      switchTab("practice");
    }
  } else {
    btnParadigms.style.display = ""; // Devolve ao controle do CSS (Tailwind)
  }
  setTimeout(updateTabsScrollIndicators, 50);
}

function applyLanguageUI() {
  const logo = document.getElementById("app-logo-btn");
  const subtitle = document.getElementById("app-subtitle");

  const textElements = [
    DOM.hebPrompt,
    document.getElementById("alphabet-target-glyph"),
    document.getElementById("assess-hebrew"),
    document.getElementById("anki-hebrew"),
    document.getElementById("survival-hebrew"),
    document.getElementById("surv-last-heb"),
  ];

  const footnoteEl = document.getElementById("app-grammar-footnote");

  if (AppState.language === "hebrew") {
    logo.textContent = "א";
    logo.className =
      "w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-2xl font-bold text-white cursor-pointer hover:scale-105 transition-transform duration-300";
    subtitle.textContent = "Treinador de Hebraico Autônomo";

    if (footnoteEl) {
      footnoteEl.innerHTML =
        'Este sistema é uma ferramenta complementar de estudo e prática que segue a <strong class="text-white font-semibold">"Gramática do Hebraico Bíblico"</strong> de <strong class="text-white font-semibold">Page H. Kelley</strong> (Editora Sinodal)';
    }

    textElements.forEach((el) => {
      if (el) {
        el.classList.remove("greek-text");
        el.classList.add("hebrew-text");
      }
    });
  } else {
    logo.textContent = "α";
    logo.className =
      "w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-2xl font-bold text-white cursor-pointer hover:scale-105 transition-transform duration-300";
    subtitle.textContent = "Treinador de Grego Autônomo";

    if (footnoteEl) {
      footnoteEl.innerHTML =
        'Este sistema é uma ferramenta complementar de estudo e prática que segue a gramática <strong class="text-white font-semibold">"Introdução ao Grego Bíblico"</strong> do autor <strong class="text-white font-semibold">Johannes Bergmann</strong> da editora <strong class="text-white font-semibold">Thomas Nelson</strong>.';
    }

    textElements.forEach((el) => {
      if (el) {
        el.classList.remove("hebrew-text");
        el.classList.add("greek-text");
      }
    });
  }
}

/* ================= DATA MANAGEMENT ================= */
async function resetDefaultChapters() {
  if (!confirm("Deseja restaurar o vocabulário original desta língua? Quaisquer alterações locais serão perdidas.")) {
    return;
  }
  try {
    if (typeof DataLoader.clearCache === "function") {
      DataLoader.clearCache(AppState.language);
    }
    localStorage.removeItem(`gamida_${AppState.language}_chapters`);
    localStorage.removeItem(`gamida_data_version_${AppState.language}`);
    localStorage.removeItem(`gamida_lastChap_${AppState.language}`);
    const defaults = await DataLoader.fetchDefaultChapters(AppState.language);
    AppState.chapters = JSON.parse(JSON.stringify(defaults));
    saveChaptersToStorage();
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

function startAnki() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.startAnki === "function") {
    return window.SRSModule.startAnki();
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

// Interceptador da tecla ENTER no input do Modo Sobrevivência
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented) return;
    const modal = document.getElementById("sentence-analysis-modal");
    if (modal && !modal.classList.contains("hidden")) return;
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
// Apoio ao desenvolvedor: chave PIX '10971140669' (Felipe Pereira Medeiros - NuBank)
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
  window.WORD_CATEGORIES = WORD_CATEGORIES;
  window.matchItemCategory = matchItemCategory;
  window.openCurrentPracticeSentenceAnalysis = openCurrentPracticeSentenceAnalysis;
  if (typeof openSentenceAnalysisModal !== "undefined") {
    window.openSentenceAnalysisModal = openSentenceAnalysisModal;
  }
  if (typeof closeSentenceAnalysisModal !== "undefined") {
    window.closeSentenceAnalysisModal = closeSentenceAnalysisModal;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
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
    WORD_CATEGORIES,
    matchItemCategory,
    openCurrentPracticeSentenceAnalysis,
  };
}




