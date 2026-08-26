/**
 * ==========================================================================
 * Gamida - Biblical Language Trainer (Hebraico & Grego Bíblico)
 * Script Principal da Aplicação
 * ==========================================================================
 */

/* ================= APP STATE & CONFIG ================= */
const APP_VERSION = "2.5.1";
const AppState = {
  language: localStorage.getItem("gamida_language") || "hebrew", // 'hebrew' ou 'greek'
  chapters: [],
  currentChapter: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  exerciseMode: "typing",
  score: 0,
  streak: 0,
  totalAnswered: 0,
  correctCount: 0,
  distractorCache: { words: [], sentences: [] },
  srs: {},
  survivalHighScore: 0,
};

const DOM = {};


/* ================= CORE LOGIC & INITIALIZATION ================= */
function getTerm(item) {
  return item.term || item.hebrew || "";
}

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("app-version-display").textContent =
    "v" + APP_VERSION;

  DOM.qCategory = document.getElementById("question-category");
  DOM.qProgress = document.getElementById("question-progress");
  DOM.hebPrompt = document.getElementById("hebrew-prompt");
  DOM.hintText = document.getElementById("hint-text");
  DOM.btnHint = document.getElementById("btn-show-hint");
  DOM.banner = document.getElementById("feedback-banner");
  DOM.interfaces = {
    typing: document.getElementById("interface-typing"),
    choice: document.getElementById("interface-choice"),
    sentences: document.getElementById("interface-sentences"),
  };
  DOM.inputs = {
    typing: document.getElementById("input-answer"),
    sentences: document.getElementById("input-sentence"),
  };

  applyLanguageUI();
  await loadChapters();
  loadSRS();
  buildDistractorCache();
  setupGlobalChapterDropdown();
  updateStatsUI();
  updateParadigmsVisibility();
  updateTabsScrollIndicators();
});

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
  if (!chapter || typeof chapter !== "object") return false;
  if (typeof chapter.id !== "string" || !chapter.id.trim()) return false;
  if (typeof chapter.title !== "string" || !chapter.title.trim())
    return false;
  const collections = [chapter.items, chapter.sentences].filter(
    Array.isArray,
  );
  if (collections.length === 0) return false;
  return collections.flat().every((item) => {
    const term = item && getTerm(item);
    return (
      item &&
      typeof term === "string" &&
      term.trim() &&
      Array.isArray(item.translations) &&
      item.translations.length > 0 &&
      item.translations.every(
        (translation) => typeof translation === "string",
      )
    );
  });
}

function hasUniqueChapterIds(chapters) {
  const ids = chapters.map((chapter) => chapter && chapter.id);
  return ids.every((id, index) => id && ids.indexOf(id) === index);
}

function saveChaptersToStorage() {
  localStorage.setItem(
    `gamida_${AppState.language}_chapters`,
    JSON.stringify(AppState.chapters),
  );
  localStorage.setItem(
    `gamida_data_version_${AppState.language}`,
    APP_VERSION,
  );
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
    if (assessTimerInterval) clearInterval(assessTimerInterval);
    resetToDashboard();
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
  if (tabName === "vocab") renderVocabTable();

  // No mobile, retrai o menu para foco total na lição
  if (window.innerWidth < 768 && typeof toggleMobileMenu === "function") {
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
    li.className =
      "px-4 py-3.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white hover:font-bold cursor-pointer transition border-l-4 border-transparent hover:border-brand-500";
    li.textContent = chap.title;

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

    // Atualiza o texto do botão
    const btnText = document.getElementById("chapter-dropdown-text");
    if (btnText) {
      btnText.textContent = found.title;
      btnText.title = found.title;
    }

    // Salva a preferência
    localStorage.setItem(
      `gamida_lastChap_${AppState.language}`,
      found.id,
    );

    // Melhoria do Cursor: Interrompe sessões que pertencem ao capítulo anterior.
    if (assessTimerInterval) clearInterval(assessTimerInterval);
    assessQuestions = [];
    assessIndex = 0;
    assessAnswersMap = {};
    ankiQueue = [];
    ankiCurrentCard = null;
    survQueue = [];
    survCurrent = null;
    resetToDashboard();

    // 1. Atualiza Praticar (Nossa correção: Sem IFs, atualiza sempre)
    AppState.currentQuestionIndex = 0;
    AppState.currentQuestion = null;
    resetStats();
    buildPracticeQueue();
    renderCurrentQuestion(); // <-- Atualização forçada nos bastidores

    // 2. Atualiza Dicionário (Nossa correção: Sem IFs, atualiza sempre)
    lastRenderedVocabChapter = null;
    renderVocabTable(); // <-- Atualização forçada nos bastidores

    // 3. Atualiza Paradigmas
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
    resetParadigmBoard();
  }
}

function setExerciseMode(mode) {
  AppState.exerciseMode = mode;
  ["typing", "choice", "sentences"].forEach((m) => {
    const btn = document.getElementById(`mode-${m}`);
    btn.className =
      m === mode
        ? "px-3 py-1.5 rounded-lg font-medium transition bg-brand-600 text-white"
        : "px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200";
  });
  AppState.currentQuestionIndex = 0;
  buildPracticeQueue();
  renderCurrentQuestion();
}

/* ================= UTILS & EVALUATION ================= */
function normalizeText(str) {
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
  // 1. Limpa qualquer parênteses da resposta do usuário também (por segurança)
  const cleanUser = userAnswer.replace(/\(.*?\)/g, "");
  const normUser = normalizeText(cleanUser);

  const allAccepted = acceptedList.join(" / ");
  if (!normUser) return { status: "incorrect", expected: allAccepted };

  let bestMatch = { status: "incorrect", expected: allAccepted };

  const sortWords = (str) =>
    str
      .split(" ")
      .filter((w) => w.length > 0)
      .sort()
      .join(" ");
  const userSortedWords = sortWords(normUser);

  const hasQuestionMark = (str) => str.includes("?");
  const hasExclamation = (str) => str.includes("!");

  for (let i = 0; i < acceptedList.length; i++) {
    const rawAccepted = acceptedList[i];

    // Versão A: Normalização Completa (considera o texto dentro do parênteses)
    const normAcceptedFull = normalizeText(rawAccepted);

    // Versão B: Normalização Limpa (arranca fora tudo que está entre parênteses)
    const cleanAccepted = rawAccepted.replace(/\(.*?\)/g, "");
    const normAcceptedStripped = normalizeText(cleanAccepted);

    const accentedVersion =
      acceptedList.find(
        (acc) =>
          normalizeText(acc) === normAcceptedFull &&
          acc !== normAcceptedFull,
      ) || rawAccepted;

    // Verifica se o aluno bate com a versão completa OU com a versão sem parênteses
    const isExactMatch =
      normUser === normAcceptedFull || normUser === normAcceptedStripped;
    const isInvertedMatch =
      userSortedWords === sortWords(normAcceptedFull) ||
      userSortedWords === sortWords(normAcceptedStripped);

    if (isExactMatch || isInvertedMatch) {
      const isPunctuationCorrect =
        hasQuestionMark(userAnswer) === hasQuestionMark(rawAccepted) &&
        hasExclamation(userAnswer) === hasExclamation(rawAccepted);

      if (isExactMatch && isPunctuationCorrect) {
        return { status: "correct", expected: accentedVersion };
      } else {
        if (bestMatch.status === "incorrect") {
          bestMatch = { status: "typo", expected: accentedVersion };
        }
        continue;
      }
    }

    // Avaliação de erro de digitação (Typo) usando a versão flexível (sem parênteses)
    if (
      normAcceptedStripped.length > 4 &&
      getEditDistance(normUser, normAcceptedStripped) <= 1
    ) {
      const lastCharUser = normUser.slice(-1);
      const lastCharAcc = normAcceptedStripped.slice(-1);
      const isGenderSwap =
        (lastCharAcc === "o" && lastCharUser === "a") ||
        (lastCharAcc === "a" && lastCharUser === "o");

      if (!isGenderSwap && bestMatch.status === "incorrect") {
        bestMatch = { status: "typo", expected: accentedVersion };
      }
    }
  }

  return bestMatch;
}

function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/* ================= PRACTICE ENGINE ================= */
let practiceQueue = [];

function buildPracticeQueue() {
  if (!AppState.currentChapter) {
    practiceQueue = [];
    return;
  }
  let baseList = [];
  if (AppState.exerciseMode === "sentences") {
    baseList = AppState.currentChapter.sentences?.length
      ? AppState.currentChapter.sentences
      : AppState.currentChapter.items;
  } else {
    baseList = AppState.currentChapter.items || [];
  }
  // Embaralha a lista e salva na fila de prática
  practiceQueue = shuffleArray(baseList);
}

function renderCurrentQuestion() {
  if (practiceQueue.length === 0) {
    AppState.currentQuestion = null;
    DOM.hebPrompt.textContent = "Sem itens disponíveis.";
    DOM.qCategory.textContent = "Sem conteúdo";
    DOM.qProgress.textContent = "Nenhum item disponível";
    DOM.hintText.textContent = "";
    DOM.hintText.classList.add("hidden");
    DOM.btnHint.classList.add("hidden");
    DOM.banner.classList.add("hidden");
    Object.values(DOM.interfaces).forEach((i) =>
      i.classList.add("hidden"),
    );
    return;
  }

  if (AppState.currentQuestionIndex >= practiceQueue.length)
    AppState.currentQuestionIndex = 0;

  AppState.currentQuestion = practiceQueue[AppState.currentQuestionIndex];

  DOM.qCategory.textContent = AppState.currentQuestion.type || "Geral";
  DOM.qProgress.textContent = `Item ${AppState.currentQuestionIndex + 1} de ${practiceQueue.length}`;
  DOM.hebPrompt.textContent = getTerm(AppState.currentQuestion);

  DOM.hintText.textContent = `Transliteração: [ ${AppState.currentQuestion.transliteration || "N/A"} ]`;
  DOM.hintText.classList.add("hidden");
  DOM.btnHint.classList.remove("hidden");
  DOM.banner.classList.add("hidden");

  Object.values(DOM.interfaces).forEach((i) => i.classList.add("hidden"));

  if (AppState.exerciseMode === "typing") {
    DOM.inputs.typing.value = "";
    DOM.inputs.typing.disabled = false;
    DOM.interfaces.typing.classList.remove("hidden");
    setTimeout(() => DOM.inputs.typing.focus(), 100);
  } else if (AppState.exerciseMode === "choice") {
    renderChoiceInterface();
    DOM.interfaces.choice.classList.remove("hidden");
  } else if (AppState.exerciseMode === "sentences") {
    DOM.inputs.sentences.value = "";
    DOM.inputs.sentences.disabled = false;
    DOM.interfaces.sentences.classList.remove("hidden");
    setTimeout(() => DOM.inputs.sentences.focus(), 100);
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
  updateStatsUI();
}

function nextQuestion() {
  AppState.currentQuestionIndex++;
  renderCurrentQuestion();
}

function resetStats() {
  AppState.score = 0;
  AppState.streak = 0;
  AppState.totalAnswered = 0;
  AppState.correctCount = 0;
  updateStatsUI();
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
function loadSRS() {
  const stored = localStorage.getItem(`gamida_${AppState.language}_srs`);
  if (stored) {
    try {
      AppState.srs = JSON.parse(stored);
    } catch (e) {
      AppState.srs = {};
    }
  } else {
    AppState.srs = {};
  }

  AppState.survivalHighScore = localStorage.getItem(
    `gamida_${AppState.language}_survival_high`,
  )
    ? parseInt(
      localStorage.getItem(`gamida_${AppState.language}_survival_high`),
    )
    : 0;
}

function saveSRS() {
  localStorage.setItem(
    `gamida_${AppState.language}_srs`,
    JSON.stringify(AppState.srs),
  );
}

function recordSRSError(termStr) {
  if (!AppState.srs[termStr]) {
    AppState.srs[termStr] = {
      interval: 0,
      ef: 2.5,
      nextReview: 0,
      fails: 0,
    };
  }
  AppState.srs[termStr].fails = (AppState.srs[termStr].fails || 0) + 1;
  AppState.srs[termStr].nextReview = Date.now();
  saveSRS();
}

/* ================= LANGUAGE SWITCH ENGINE ================= */
async function toggleLanguage() {
  AppState.language = AppState.language === "hebrew" ? "greek" : "hebrew";

  updateParadigmsVisibility();

  localStorage.setItem("gamida_language", AppState.language);

  resetStats();
  lastRenderedVocabChapter = null;
  applyLanguageUI();
  await loadChapters();
  loadSRS();
  buildDistractorCache();
  setupGlobalChapterDropdown();
  switchTab("practice");
}

function updateParadigmsVisibility() {
  const btnParadigms = document.getElementById("nav-btn-paradigms");
  if (!btnParadigms) return;

  if (AppState.language === "hebrew") {
    btnParadigms.style.display = "none"; // Força o bloqueio visual

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
    document.getElementById("assess-hebrew"),
    document.getElementById("anki-hebrew"),
    document.getElementById("survival-hebrew"),
    document.getElementById("surv-last-heb"),
  ];

  if (AppState.language === "hebrew") {
    logo.textContent = "א";
    logo.className =
      "w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-2xl font-bold text-white cursor-pointer hover:scale-105 transition-transform duration-300";
    subtitle.textContent = "Treinador de Hebraico Autônomo";

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
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(AppState.chapters, null, 2));
  const fileName =
    AppState.language === "hebrew"
      ? "gamida_hebraico_capitulos.json"
      : "gamida_grego_capitulos.json";
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
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
    const parsed = JSON.parse(jsonText);
    const newChap = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!isValidChapter(newChap)) throw new Error("Formato inválido.");
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

function renderVocabTable() {
  const tbody = document.getElementById("vocab-table-body");
  if (!tbody || !AppState.currentChapter) return;

  if (lastRenderedVocabChapter === AppState.currentChapter.id) return;

  tbody.innerHTML = "";

  const allItems = [
    ...(AppState.currentChapter.items || []),
    ...(AppState.currentChapter.sentences || []),
  ];

  // 1. Renderiza a lista de vocabulário e frases
  allItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-800/40 transition";

    const isSentence = item.type === "Frase" || item.type === "Expressão";
    const termText = getTerm(item);
    const translitText = item.transliteration || "-";
    const typeText = item.type || "Geral";
    let translationsText = Array.isArray(item.translations)
      ? item.translations.join(" / ")
      : item.translations || "Tradução ausente";

    const textClass = AppState.language === "hebrew"
      ? "hebrew-text text-2xl md:text-3xl"
      : "greek-text text-lg md:text-xl";

    tr.innerHTML = `
            <td class="px-6 py-4 ${textClass} font-bold text-white">${termText}</td>
            <td class="px-6 py-4 font-mono text-xs text-amber-400">${translitText}</td>
            <td class="px-6 py-4 font-medium text-slate-200">${translationsText}</td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 rounded-full ${isSentence ? "bg-indigo-900/60 border-indigo-700 text-indigo-300" : "bg-slate-800 border-slate-700 text-slate-400"} border text-[10px] font-mono">
                ${typeText}
              </span>
            </td>
          `;
    tbody.appendChild(tr);
  });

  // === 2. INJEÇÃO DOS PARADIGMAS NO FINAL DA LISTA ===
  if (
    AppState.currentChapter.paradigms &&
    AppState.currentChapter.paradigms.length > 0
  ) {
    AppState.currentChapter.paradigms.forEach((paradigm) => {
      const trParadigm = document.createElement("tr");
      trParadigm.className = "bg-slate-900/10";

      const tdParadigm = document.createElement("td");
      tdParadigm.colSpan = 4; // Ocupa a largura total da tabela
      tdParadigm.className = "p-2 md:p-6 border-t border-slate-800/80";

      // Identifica o tipo e chama a função correta
      if (paradigm.type === "table") {
        tdParadigm.innerHTML = getStaticParadigmTableHTML(paradigm);
      } else if (paradigm.type === "diagram") {
        tdParadigm.innerHTML = getStaticDiagramHTML(paradigm);
      }

      trParadigm.appendChild(tdParadigm);
      tbody.appendChild(trParadigm);
    });
  }
  // === FIM DA INJEÇÃO DOS PARADIGMAS ===

  lastRenderedVocabChapter = AppState.currentChapter.id;
}

function filterVocabTable() {
  const searchInput = document.getElementById("vocab-search");
  if (!searchInput) return;
  const query = normalizeText(searchInput.value);
  document.querySelectorAll("#vocab-table-body tr").forEach((tr) => {
    tr.style.display = normalizeText(tr.textContent).includes(query)
      ? ""
      : "none";
  });
}

/* ================= CUMULATIVE ASSESSMENT LOGIC ================= */
const SimConfig = { amount: 25, time: 0, focus: "mixed" };
let assessQuestions = [];
let assessIndex = 0;
let assessAnswersMap = {};
let assessTimerInterval = null;
let assessTimeCount = 0;

function resetToDashboard() {
  if (assessTimerInterval) clearInterval(assessTimerInterval);
  document.getElementById("assess-config").classList.add("hidden");
  document.getElementById("assessment-active").classList.add("hidden");
  document.getElementById("assessment-results").classList.add("hidden");
  document.getElementById("anki-active").classList.add("hidden");
  document.getElementById("anki-results").classList.add("hidden");
  document.getElementById("survival-active").classList.add("hidden");
  document.getElementById("survival-results").classList.add("hidden");
  document.getElementById("assess-dashboard").classList.remove("hidden");
}

function openSimuladoConfig() {
  document.getElementById("assess-dashboard").classList.add("hidden");
  document.getElementById("assess-config").classList.remove("hidden");
}

function closeSimuladoConfig() {
  resetToDashboard();
}

function setSimConfig(type, value) {
  SimConfig[type] = value;
  document.querySelectorAll(`.cfg-${type}`).forEach((btn) => {
    if (btn.id === `cfg-${type}-${value}`) {
      btn.classList.replace("bg-slate-800", "bg-brand-600");
      btn.classList.replace("text-slate-300", "text-white");
      btn.classList.remove("hover:bg-slate-700");
    } else {
      btn.classList.replace("bg-brand-600", "bg-slate-800");
      btn.classList.replace("text-white", "text-slate-300");
      btn.classList.add("hover:bg-slate-700");
    }
  });
}

function startSimulado() {
  const activeChapterId = AppState.currentChapter?.id;
  if (!activeChapterId) {
    alert("Não há capítulos disponíveis para gerar o simulado.");
    return;
  }
  const activeIdx = AppState.chapters.findIndex(
    (c) => c.id === activeChapterId,
  );
  const cumulativeChapters = AppState.chapters.slice(
    0,
    activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
  );

  let currentChapWords = [],
    otherChapWords = [];
  let currentChapSentences = [],
    otherChapSentences = [];

  cumulativeChapters.forEach((chap) => {
    const isCurrent = chap.id === activeChapterId;
    (chap.items || []).forEach((item) => {
      const entry = {
        ...item,
        chapterId: chap.id,
        chapterTitle: chap.title,
        kind: "word",
      };
      if (isCurrent) currentChapWords.push(entry);
      else otherChapWords.push(entry);
    });
    (chap.sentences || []).forEach((sent) => {
      const entry = {
        ...sent,
        chapterId: chap.id,
        chapterTitle: chap.title,
        kind: "sentence",
      };
      if (isCurrent) currentChapSentences.push(entry);
      else otherChapSentences.push(entry);
    });
  });

  currentChapWords = Array.from(
    new Map(currentChapWords.map((w) => [getTerm(w), w])).values(),
  );
  otherChapWords = Array.from(
    new Map(otherChapWords.map((w) => [getTerm(w), w])).values(),
  );
  currentChapSentences = Array.from(
    new Map(currentChapSentences.map((s) => [getTerm(s), s])).values(),
  );
  otherChapSentences = Array.from(
    new Map(otherChapSentences.map((s) => [getTerm(s), s])).values(),
  );

  const allWords = [...currentChapWords, ...otherChapWords];
  const allSentences = [...currentChapSentences, ...otherChapSentences];

  let targetWords = 0;
  let targetSentences = 0;
  let totalAmount =
    SimConfig.amount === "max"
      ? allWords.length + allSentences.length
      : SimConfig.amount;

  if (SimConfig.focus === "words") {
    targetWords = Math.min(totalAmount, allWords.length);
  } else if (SimConfig.focus === "sentences") {
    targetSentences = Math.min(totalAmount, allSentences.length);
  } else {
    targetSentences = Math.min(
      Math.max(1, Math.round(totalAmount * 0.2)),
      allSentences.length,
    );
    targetWords = Math.min(
      totalAmount - targetSentences,
      allWords.length,
    );
    if (
      targetWords + targetSentences < totalAmount &&
      allSentences.length > targetSentences
    ) {
      targetSentences = Math.min(
        totalAmount - targetWords,
        allSentences.length,
      );
    }
  }

  function pickItems(targetCount, currentPool, otherPool) {
    let selected = [];
    let targetCurrent = Math.min(
      Math.round(targetCount * 0.5),
      currentPool.length,
    );
    selected.push(
      ...[...currentPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, targetCurrent),
    );
    let remaining = targetCount - selected.length;
    selected.push(
      ...[...otherPool]
        .sort(() => 0.5 - Math.random())
        .slice(0, remaining),
    );
    if (selected.length < targetCount) {
      let combined = [...currentPool, ...otherPool]
        .filter((i) => !selected.some((s) => getTerm(s) === getTerm(i)))
        .sort(() => 0.5 - Math.random());
      selected.push(...combined.slice(0, targetCount - selected.length));
    }
    return selected;
  }

  let finalPool = [
    ...pickItems(targetWords, currentChapWords, otherChapWords),
    ...pickItems(
      targetSentences,
      currentChapSentences,
      otherChapSentences,
    ),
  ];
  assessQuestions = finalPool.sort(() => 0.5 - Math.random());
  assessIndex = 0;
  assessAnswersMap = {};

  if (assessQuestions.length === 0) {
    alert(
      "Não há conteúdo suficiente neste capítulo para gerar o simulado.",
    );
    return;
  }

  document.getElementById("assess-config").classList.add("hidden");
  document.getElementById("assessment-active").classList.remove("hidden");

  assessTimeCount = SimConfig.time > 0 ? SimConfig.time * 60 : 0;
  document.getElementById("assessment-timer-icon").textContent =
    SimConfig.time > 0 ? "⏳" : "⏱️";

  startAssessmentTimer();
  initAssessmentTracker();
  renderAssessmentQuestion();
}

function startAssessmentTimer() {
  if (assessTimerInterval) clearInterval(assessTimerInterval);
  const isCountdown = SimConfig.time > 0;

  assessTimerInterval = setInterval(() => {
    if (isCountdown) {
      assessTimeCount--;
      if (assessTimeCount <= 0) {
        clearInterval(assessTimerInterval);
        alert("O tempo limite do simulado acabou!");
        finishAssessment();
        return;
      }
    } else {
      assessTimeCount++;
    }
    const mins = Math.floor(assessTimeCount / 60);
    const secs = assessTimeCount % 60;
    document.getElementById("assessment-timer").textContent =
      `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, 1000);
}

function saveCurrentInputDraft() {
  const inputEl = document.getElementById("assess-user-input");
  if (inputEl) {
    assessAnswersMap[assessIndex] = inputEl.value;
    updateTrackerPillState(assessIndex);
  }
}

function renderAssessmentQuestion() {
  const q = assessQuestions[assessIndex];
  document.getElementById("assessment-counter").textContent =
    `Questão ${assessIndex + 1} de ${assessQuestions.length}`;
  document.getElementById("assessment-type-tag").textContent =
    q.kind === "word" ? "Palavra" : "Frase";
  document.getElementById("assess-hebrew").textContent = getTerm(q);

  const input = document.getElementById("assess-user-input");
  input.value = assessAnswersMap[assessIndex] || "";
  document.getElementById("assess-btn-prev").style.visibility =
    assessIndex === 0 ? "hidden" : "visible";

  const actionContainer = document.getElementById(
    "assess-action-container",
  );
  if (assessIndex === assessQuestions.length - 1) {
    actionContainer.innerHTML = `<button type="button" onclick="confirmFinishAssessmentPrompt()" class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30">🏁 Submeter Prova</button>`;
  } else {
    actionContainer.innerHTML = `<button type="button" onclick="navigateAssessment(1)" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-brand-600/30">Próxima ➔</button>`;
  }

  updateAllTrackerPills();
  setTimeout(() => input.focus(), 50);
}

function navigateAssessment(direction) {
  saveCurrentInputDraft();
  if (
    assessIndex + direction >= 0 &&
    assessIndex + direction < assessQuestions.length
  ) {
    assessIndex += direction;
    renderAssessmentQuestion();
  }
}

function jumpToAssessmentQuestion(idx) {
  saveCurrentInputDraft();
  assessIndex = idx;
  renderAssessmentQuestion();
}

function initAssessmentTracker() {
  const trackerEl = document.getElementById("assessment-tracker");
  trackerEl.innerHTML = "";
  assessQuestions.forEach((_, idx) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.textContent = idx + 1;
    pill.onclick = () => jumpToAssessmentQuestion(idx);
    trackerEl.appendChild(pill);
  });
  updateAllTrackerPills();
}

function updateAllTrackerPills() {
  const trackerEl = document.getElementById("assessment-tracker");
  for (let i = 0; i < trackerEl.children.length; i++)
    updateTrackerPillState(i);
}

function updateTrackerPillState(idx) {
  const pill =
    document.getElementById("assessment-tracker").children[idx];
  if (!pill) return;
  const hasAnswered =
    assessAnswersMap[idx] && assessAnswersMap[idx].trim().length > 0;
  let baseClass =
    "w-8 h-8 rounded-xl font-mono text-xs font-semibold flex items-center justify-center transition border ";
  if (idx === assessIndex)
    baseClass +=
      "bg-brand-600 text-white border-brand-400 ring-2 ring-brand-500/40 shadow-md";
  else if (hasAnswered)
    baseClass +=
      "bg-slate-800 text-emerald-400 border-emerald-600/50 hover:bg-slate-700";
  else
    baseClass +=
      "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300";
  pill.className = baseClass;
}

function confirmFinishAssessmentPrompt() {
  saveCurrentInputDraft();
  const unanswered = assessQuestions.filter(
    (_, idx) => !assessAnswersMap[idx] || !assessAnswersMap[idx].trim(),
  ).length;
  if (
    confirm(
      unanswered > 0
        ? `Você tem ${unanswered} questão(ões) em branco. Deseja submeter mesmo assim?`
        : "Deseja finalizar a avaliação?",
    )
  ) {
    finishAssessment();
  }
}

document.addEventListener("keydown", (e) => {
  const assessActive = document.getElementById("assessment-active");
  if (
    assessActive &&
    !assessActive.classList.contains("hidden") &&
    e.key === "Enter"
  ) {
    const input = document.getElementById("assess-user-input");
    if (document.activeElement === input) {
      e.preventDefault();
      if (assessIndex === assessQuestions.length - 1)
        confirmFinishAssessmentPrompt();
      else navigateAssessment(1);
    }
  }
});

function finishAssessment() {
  if (assessTimerInterval) clearInterval(assessTimerInterval);
  document.getElementById("assessment-active").classList.add("hidden");
  document
    .getElementById("assessment-results")
    .classList.remove("hidden");

  const evaluated = assessQuestions.map((q, idx) => {
    const userVal = (assessAnswersMap[idx] || "").trim() || "(Em branco)";
    return {
      question: q,
      userAnswer: userVal,
      evalResult: evaluateAnswer(userVal, q.translations),
    };
  });

  const totalQ = assessQuestions.length;
  const correctQ = evaluated.filter(
    (a) => a.evalResult.status !== "incorrect",
  ).length;

  let timeSecs = 0;
  if (SimConfig.time > 0)
    timeSecs = SimConfig.time * 60 - assessTimeCount;
  else timeSecs = assessTimeCount;

  document.getElementById("res-grade").textContent =
    `${totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0}%`;
  document.getElementById("res-correct").textContent =
    `${correctQ} / ${totalQ}`;
  document.getElementById("res-time").textContent = `${Math.floor(
    timeSecs / 60,
  )
    .toString()
    .padStart(2, "0")}:${(timeSecs % 60).toString().padStart(2, "0")}`;

  const chapterErrors = {};
  evaluated.forEach((ans) => {
    const cid = ans.question.chapterId;
    if (!chapterErrors[cid])
      chapterErrors[cid] = {
        title: ans.question.chapterTitle,
        total: 0,
        errors: 0,
      };
    chapterErrors[cid].total++;

    if (ans.evalResult.status === "incorrect") {
      chapterErrors[cid].errors++;
      recordSRSError(getTerm(ans.question)); // Anki
    }
  });

  const diagList = document.getElementById("diagnostic-list");
  diagList.innerHTML = "";
  Object.values(chapterErrors)
    .sort((a, b) => b.errors / b.total - a.errors / a.total)
    .forEach((ch) => {
      const rate = Math.round((ch.errors / ch.total) * 100);
      const badge =
        rate > 50
          ? "bg-rose-950/60 text-rose-400 border-rose-800/60"
          : rate > 20
            ? "bg-amber-950/60 text-amber-400 border-amber-800/60"
            : "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
      const status =
        rate > 50
          ? "Revisão Urgente"
          : rate > 20
            ? "Revisão Recomendada"
            : "Excelente";

      const div = document.createElement("div");
      div.className =
        "flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-950/50 text-xs";
      div.innerHTML = `<div><div class="font-semibold text-white text-sm">${ch.title}</div><div class="text-slate-400 mt-0.5">${ch.errors} erro(s) em ${ch.total} questão(ões)</div></div><span class="px-3 py-1 rounded-full font-medium border ${badge}">${status} (${rate}%)</span>`;
      diagList.appendChild(div);
    });

  const correctionList = document.getElementById("correction-list");
  correctionList.innerHTML = "";
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  evaluated.forEach((ans, idx) => {
    const st = ans.evalResult.status;

    let boxColors = "bg-emerald-950/20 border-emerald-800/40";
    let badgeTag = `<span class="px-2.5 py-0.5 rounded-full font-bold bg-emerald-900/60 text-emerald-300">Correto ✓</span>`;
    let userTextCol = "text-emerald-400";

    if (st === "incorrect") {
      boxColors = "bg-rose-950/20 border-rose-800/40";
      badgeTag = `<span class="px-2.5 py-0.5 rounded-full font-bold bg-rose-900/60 text-rose-300">Incorreto ✗</span>`;
      userTextCol = "text-rose-400";
    } else if (st === "typo") {
      boxColors = "bg-amber-950/20 border-amber-800/40";
      badgeTag = `<span class="px-2.5 py-0.5 rounded-full font-bold bg-amber-900/60 text-amber-300">Atenção ⚠️</span>`;
      userTextCol = "text-amber-400";
    }

    const box = document.createElement("div");
    box.className = `p-4 rounded-2xl border ${boxColors} space-y-2 text-xs`;
    box.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="font-mono text-slate-400 font-semibold">Questão ${idx + 1} (${ans.question.kind === "word" ? "Palavra" : "Frase"})</span>
              ${badgeTag}
            </div>
            <div class="${textClass} text-2xl text-white font-bold py-1">${getTerm(ans.question)}</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Sua Resposta:</span>
                <span class="${userTextCol} font-medium">${ans.userAnswer}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tradução Esperada:</span>
                <span class="text-emerald-400 font-medium">${ans.evalResult.expected || ans.question.translations.join(" / ")}</span>
              </div>
            </div>`;
    correctionList.appendChild(box);
  });
}

/* ================= LÓGICA DO ANKI (FLASHCARDS) ================= */
let ankiQueue = [];
let ankiCurrentCard = null;
let ankiStats = { hard: 0, good: 0, easy: 0 };
let ankiTotalCards = 0;

function startAnki() {
  const now = Date.now();
  let dueCards = [];
  let newCards = [];

  const activeChapterId = AppState.currentChapter?.id;
  if (!activeChapterId) {
    alert("Não há capítulos disponíveis para iniciar a revisão.");
    return;
  }

  AppState.chapters.forEach((chap) => {
    const isCurrent = chap.id === activeChapterId;
    const processItem = (it, kind) => {
      const entry = {
        ...it,
        chapterId: chap.id,
        chapterTitle: chap.title,
        kind,
      };
      const record = AppState.srs[getTerm(it)];
      if (record && record.nextReview <= now) dueCards.push(entry);
      else if (!record && isCurrent) newCards.push(entry);
    };
    (chap.items || []).forEach((i) => processItem(i, "word"));
    (chap.sentences || []).forEach((s) => processItem(s, "sentence"));
  });

  dueCards = Array.from(
    new Map(dueCards.map((w) => [getTerm(w), w])).values(),
  );
  newCards = Array.from(
    new Map(newCards.map((w) => [getTerm(w), w])).values(),
  );

  dueCards.sort(() => 0.5 - Math.random());
  newCards.sort(() => 0.5 - Math.random());

  ankiQueue = [...dueCards.slice(0, 20), ...newCards.slice(0, 10)];

  if (ankiQueue.length === 0) {
    alert(
      "🎉 Você não tem revisões pendentes nem palavras novas neste capítulo no momento. Excelente trabalho!",
    );
    return;
  }

  ankiTotalCards = ankiQueue.length;
  ankiStats = { hard: 0, good: 0, easy: 0 };

  document.getElementById("assess-dashboard").classList.add("hidden");
  document.getElementById("anki-active").classList.remove("hidden");

  renderAnkiCard();
}

function renderAnkiCard() {
  if (ankiQueue.length === 0) {
    finishAnki();
    return;
  }

  ankiCurrentCard = ankiQueue[0];

  document.getElementById("anki-counter").textContent =
    `Cartão ${ankiTotalCards - ankiQueue.length + 1} de ${ankiTotalCards}`;
  document.getElementById("anki-type-tag").textContent =
    ankiCurrentCard.kind === "word" ? "Palavra" : "Frase";

  document.getElementById("anki-hebrew").textContent =
    getTerm(ankiCurrentCard);
  document.getElementById("anki-translit").textContent =
    ankiCurrentCard.transliteration
      ? `(${ankiCurrentCard.transliteration})`
      : "";
  document.getElementById("anki-translation").textContent =
    ankiCurrentCard.translations.join(" / ");

  let record = AppState.srs[getTerm(ankiCurrentCard)] || {
    interval: 0,
    ef: 2.5,
    nextReview: 0,
  };
  const goodInt =
    record.interval === 0 ? 1 : Math.round(record.interval * record.ef);
  const easyInt =
    record.interval === 0
      ? 4
      : Math.round(record.interval * (record.ef + 0.15) * 1.3);

  document.getElementById("anki-next-good").textContent =
    goodInt + (goodInt === 1 ? " dia" : " dias");
  document.getElementById("anki-next-easy").textContent =
    easyInt + (easyInt === 1 ? " dia" : " dias");

  document.getElementById("anki-back").classList.add("hidden");
  document
    .getElementById("anki-reveal-container")
    .classList.remove("hidden");
}

function revealAnki() {
  document
    .getElementById("anki-reveal-container")
    .classList.add("hidden");
  document.getElementById("anki-back").classList.remove("hidden");
}

function answerAnki(grade) {
  ankiStats[grade]++;
  let record = AppState.srs[getTerm(ankiCurrentCard)] || {
    interval: 0,
    ef: 2.5,
    nextReview: 0,
    fails: 0,
  };

  if (grade === "hard") {
    record.interval = 0;
    record.ef = Math.max(1.3, record.ef - 0.2);
    record.nextReview = Date.now() + 60 * 1000;
    ankiQueue.push(ankiCurrentCard); // Volta pro fim da fila
    ankiTotalCards++;
  } else if (grade === "good") {
    record.interval =
      record.interval === 0 ? 1 : Math.round(record.interval * record.ef);
    record.nextReview =
      Date.now() + record.interval * 24 * 60 * 60 * 1000;
  } else if (grade === "easy") {
    record.ef += 0.15;
    record.interval =
      record.interval === 0
        ? 4
        : Math.round(record.interval * record.ef * 1.3);
    record.nextReview =
      Date.now() + record.interval * 24 * 60 * 60 * 1000;
  }

  AppState.srs[getTerm(ankiCurrentCard)] = record;
  saveSRS();

  ankiQueue.shift();
  renderAnkiCard();
}

function finishAnki() {
  document.getElementById("anki-active").classList.add("hidden");
  document.getElementById("anki-results").classList.remove("hidden");
  document.getElementById("anki-res-hard").textContent = ankiStats.hard;
  document.getElementById("anki-res-good").textContent = ankiStats.good;
  document.getElementById("anki-res-easy").textContent = ankiStats.easy;
}

/* ================= FASE 3: LÓGICA DE SOBREVIVÊNCIA (MORTE SÚBITA) ================= */
let survLives = 3;
let survStreak = 0;
let survQueue = [];
let survCurrent = null;

function startSurvival() {
  // Coleta apenas palavras (não frases) de todos os capítulos até o atual
  const activeChapterId = AppState.currentChapter?.id;
  if (!activeChapterId) {
    alert(
      "Não há capítulos disponíveis para iniciar o modo de sobrevivência.",
    );
    return;
  }
  const activeIdx = AppState.chapters.findIndex(
    (c) => c.id === activeChapterId,
  );
  const cumulativeChapters = AppState.chapters.slice(
    0,
    activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
  );

  let allWords = [];
  cumulativeChapters.forEach((chap) => {
    (chap.items || []).forEach((i) => allWords.push(i));
  });

  // Remove duplicatas exatas
  allWords = Array.from(
    new Map(allWords.map((w) => [getTerm(w), w])).values(),
  );

  if (allWords.length === 0) {
    alert(
      "Não há palavras suficientes acumuladas para iniciar o Morte Súbita.",
    );
    return;
  }

  // Preenche a fila e embaralha
  survQueue = [...allWords].sort(() => 0.5 - Math.random());
  survLives = 3;
  survStreak = 0;

  document.getElementById("assess-dashboard").classList.add("hidden");
  document.getElementById("survival-active").classList.remove("hidden");
  document.getElementById("surv-correction-box").classList.add("hidden"); // Reseta o card de erro

  updateSurvivalUI();
  nextSurvivalQuestion();
}

function updateSurvivalUI() {
  document.getElementById("survival-streak").textContent = survStreak;
  document.getElementById("survival-hearts").textContent =
    "❤️".repeat(survLives) + "🖤".repeat(3 - survLives);
}

function nextSurvivalQuestion() {
  // Se esvaziar a fila, a gente recarrega com o mesmo vocabulário e embaralha (jogo infinito)
  if (survQueue.length === 0) {
    let activeIdx = AppState.chapters.findIndex(
      (c) => c.id === AppState.currentChapter?.id,
    );
    let cumulativeChapters = AppState.chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
    );
    let refill = [];
    cumulativeChapters.forEach((chap) =>
      (chap.items || []).forEach((i) => refill.push(i)),
    );
    survQueue = Array.from(
      new Map(refill.map((w) => [getTerm(w), w])).values(),
    ).sort(() => 0.5 - Math.random());
  }

  survCurrent = survQueue.pop();
  document.getElementById("survival-hebrew").textContent =
    getTerm(survCurrent);

  const input = document.getElementById("survival-input");
  input.value = "";
  input.disabled = false;
  setTimeout(() => input.focus(), 50);
}

function submitSurvivalAnswer() {
  const input = document.getElementById("survival-input");
  if (input.disabled) return;

  const evalResult = evaluateAnswer(
    input.value,
    survCurrent.translations,
  );
  const flash = document.getElementById("survival-flash");

  if (evalResult.status === "correct" || evalResult.status === "typo") {
    survStreak++;
    updateSurvivalUI();

    // Pisca verde se foi exato, amarelo se foi erro de digitação
    if (evalResult.status === "typo") {
      flash.className =
        "absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none bg-amber-500/20 opacity-100";
    } else {
      flash.className =
        "absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none bg-emerald-500/20 opacity-100";
    }
    setTimeout(
      () => flash.classList.replace("opacity-100", "opacity-0"),
      300,
    );

    nextSurvivalQuestion();
  } else {
    survLives--;
    updateSurvivalUI();
    recordSRSError(getTerm(survCurrent));

    document.getElementById("surv-last-heb").textContent =
      getTerm(survCurrent);
    document.getElementById("surv-last-cor").textContent =
      survCurrent.translations.join(" / ");
    document
      .getElementById("surv-correction-box")
      .classList.remove("hidden");

    flash.className =
      "absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none bg-rose-500/30 opacity-100";
    setTimeout(
      () => flash.classList.replace("opacity-100", "opacity-0"),
      300,
    );

    if (survLives <= 0) {
      input.disabled = true;
      setTimeout(() => finishSurvival(false), 600);
    } else {
      nextSurvivalQuestion();
    }
  }
}

function finishSurvival(surrendered = false) {
  document.getElementById("survival-active").classList.add("hidden");
  document.getElementById("survival-results").classList.remove("hidden");

  // Trata o Recorde Máximo
  if (survStreak > AppState.survivalHighScore) {
    AppState.survivalHighScore = survStreak;
    localStorage.setItem(
      `gamida_${AppState.language}_survival_high`,
      AppState.survivalHighScore,
    );
  }

  document.getElementById("surv-res-streak").textContent = survStreak;
  document.getElementById("surv-res-high").textContent =
    AppState.survivalHighScore;

  if (surrendered) {
    document
      .getElementById("surv-correction-box")
      .classList.add("hidden");
  }
}

// Adiciona interceptador do ENTER também pro survival
document.addEventListener("keydown", (e) => {
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

/* ================= TAB 5: MOTOR DE PARADIGMAS & ARRASTAR ================= */
let activeParadigm = null;
let draggedElement = null;

// 3. Renderiza o esqueleto principal
function renderParadigmSkeleton() {
  const chap = AppState.currentChapter;
  const parIdx = document.getElementById("paradigm-select").value;

  // Se não tiver capítulo ativo ou não selecionou um paradigma, limpa a mesa
  if (!chap || parIdx === "") {
    resetParadigmBoard();
    return;
  }

  activeParadigm = chap.paradigms[parIdx];

  document.getElementById("paradigm-header").classList.remove("hidden");
  document.getElementById("paradigm-title").textContent = activeParadigm.title;

  const board = document.getElementById("paradigm-board");
  board.innerHTML = "";

  if (activeParadigm.type === "table") {
    renderTableView(activeParadigm, board);
  } else if (activeParadigm.type === "diagram") {
    renderDiagramView(activeParadigm, board);
  }
}

// 4. Constrói a tabela, as zonas de soltar e o deck de fichas
function renderTableView(paradigm, container) {
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";
  const table = document.createElement("table");
  table.className =
    "w-full max-w-3xl text-left border-collapse mx-auto shadow-lg bg-slate-950/40 rounded-xl overflow-hidden";

  // Cabeçalho
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  paradigm.headers.forEach((h) => {
    const th = document.createElement("th");
    th.className =
      "px-4 py-4 bg-slate-900 border-b border-slate-700 text-brand-400 text-xs font-bold uppercase tracking-wider text-center";
    th.textContent = h;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Corpo e coleta de fichas
  const tbody = document.createElement("tbody");
  let allAnswers = [];

  paradigm.rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className =
      "divide-x divide-slate-800 border-b border-slate-800/60";

    row.forEach((cellText, cellIdx) => {
      const td = document.createElement("td");
      td.className = "p-1.5 text-center align-middle"; // Padding reduzido

      if (cellIdx === 0) {
        td.innerHTML = `<span class="font-bold text-slate-300 text-[11px] uppercase tracking-wider">${cellText}</span>`;
        td.className += " bg-slate-900/50 w-20";
      } else {
        allAnswers.push(cellText);
        // Altura mínima reduzida para 40px e texto levemente menor
        td.innerHTML = `
                  <div class="drop-zone w-full min-h-[40px] rounded-lg bg-slate-900/30 border-2 border-dashed border-slate-700 flex items-center justify-center transition-all cursor-pointer"
                       data-answer="${cellText}"
                       ondragover="onDragOver(event)"
                       ondragleave="onDragLeave(event)"
                       ondrop="onDropToZone(event)"
                       onclick="onZoneClick(event)">
                  </div>`;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Renderiza o botão de verificação
  const btnContainer = document.createElement("div");
  btnContainer.className = "mt-6 text-center w-full";
  btnContainer.innerHTML = `
          <button type="button" onclick="checkParadigmAnswers()" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg">Verificar Respostas ✓</button>
          <p id="paradigm-feedback" class="mt-4 text-sm font-bold hidden"></p>
        `;
  container.appendChild(btnContainer);

  // Renderiza o deck de fichas
  const deck = document.getElementById("paradigm-deck");
  deck.classList.remove("hidden");
  deck.innerHTML = "";

  // Permite soltar fichas de volta no deck
  deck.ondragover = onDragOver;
  deck.ondragleave = onDragLeave;
  deck.ondrop = onDropToDeck;

  // Embaralha e cria as fichas
  allAnswers = shuffleArray(allAnswers);
  allAnswers.forEach((ans, i) => {
    const chip = document.createElement("div");
    // As classes inline-flex e w-fit criam o comportamento de cartas lado a lado
    chip.className = `drag-chip ${textClass} inline-flex items-center justify-center w-fit cursor-grab bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-1.5 px-4 text-sm rounded-lg shadow-sm transition-transform active:scale-95 select-none`;
    chip.draggable = true;
    chip.id = `chip-${i}`;
    chip.textContent = ans;
    chip.ondragstart = onDragStart;
    chip.ondragend = onDragEnd;
    chip.onclick = onChipClick;
    deck.appendChild(chip);
  });
}

// 6. Desenha o mapa de preposições (Diagrama)
function renderDiagramView(paradigm, container) {
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  const wrapper = document.createElement("div");
  wrapper.className =
    "w-full max-w-4xl mx-auto flex flex-col items-center";

  // Título estilizado interno
  const conceptTitle = document.createElement("h4");
  conceptTitle.className =
    "text-brand-400 font-bold text-sm uppercase tracking-widest mb-6";
  conceptTitle.textContent = paradigm.concept;
  wrapper.appendChild(conceptTitle);

  // O Palco SVG e as Zonas de Soltar
  const stage = document.createElement("div");
  stage.className =
    "relative w-full pb-[75%] md:pb-[60%] bg-slate-950 rounded-2xl shadow-inner border border-slate-800/80 overflow-hidden mb-8";

  // Coordenadas absolutas X e Y para cada preposição flutuar em cima das setas
  const layoutMap = {
    ἐν: { x: 50, y: 50 },
    εἰς: { x: 28, y: 50 },
    ἐκ: { x: 72, y: 50 },
    διά: { x: 50, y: 66 },
    ὑπέρ: { x: 50, y: 14 },
    ὑπό: { x: 50, y: 86 },
    ἐπί: { x: 50, y: 31 },
    ἀνά: { x: 14, y: 35 },
    κατά: { x: 86, y: 75 },
    πρός: { x: 38, y: 32 },
    ἀπό: { x: 62, y: 68 },
    πρό: { x: 8, y: 50 },
    ἀντί: { x: 14, y: 66 },
    σύν: { x: 86, y: 15 },
    μετά: { x: 88, y: 44 },
    περί: { x: 66, y: 28 },
  };

  // Desenho Vetorial (SVG)
  let innerStage = `
          <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
              </marker>
            </defs>
            
            <!-- Referência central do diagrama -->
            <circle cx="400" cy="300" r="90" fill="#1e293b" stroke="#334155" stroke-width="4" stroke-dasharray="10 5"/>
            
            <!-- εἰς (Para dentro) -->
            <path d="M 150 300 L 350 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
            
            <!-- ἐκ (Para fora) -->
            <path d="M 450 300 L 650 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
            
            <!-- διά (Através) -->
            <path d="M 250 400 L 550 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" stroke-dasharray="4 4" />
            
            <!-- ὑπέρ (Acima) -->
            <path d="M 250 80 L 550 80" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            
            <!-- ὑπό (Debaixo) -->
            <path d="M 250 520 L 550 520" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            
            <!-- ἐπί (Sobre) -->
            <circle cx="400" cy="210" r="8" fill="#3b82f6" />
            <path d="M 400 130 L 400 200" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
            
            <!-- ἀνά (Para cima) -->
            <path d="M 110 450 L 110 150" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            
            <!-- κατά (Para baixo) -->
            <path d="M 690 150 L 690 450" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            
            <!-- πρός (Em direção a) -->
            <path d="M 260 160 L 330 230" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
            
            <!-- ἀπό (Afastando-se) -->
            <path d="M 470 370 L 540 440" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
            
            <!-- πρό (Diante) -->
            <rect x="70" y="285" width="10" height="30" fill="#64748b" />
            <circle cx="50" cy="300" r="8" fill="#3b82f6" />
            
            <!-- ἀντί (Oposição) -->
            <path d="M 50 400 L 100 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            <path d="M 170 400 L 120 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            
            <!-- σύν (Junto de) -->
            <circle cx="680" cy="90" r="8" fill="#3b82f6" />
            <circle cx="705" cy="90" r="8" fill="#3b82f6" />
            
            <!-- μετά (Com) -->
            <path d="M 680 260 L 740 260" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
            <circle cx="660" cy="260" r="8" fill="#3b82f6" />
            
            <!-- περί (Ao redor) -->
            <path d="M 320 210 A 130 130 0 1 1 270 370" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          </svg>
        `;

  let allAnswers = [];

  // Geração dinâmica das Zonas de Soltar baseadas nas coordenadas
  paradigm.elements.forEach((el, i) => {
    allAnswers.push(el.term);
    const pos = layoutMap[el.term] || { x: 10, y: 10 };

    // NOVA VERSÃO COM TOOLTIP (HOVER)
    innerStage += `
             <div class="group absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style="left: ${pos.x}%; top: ${pos.y}%;">
                <!-- Relação espacial exibida como tooltip ao passar o mouse -->
                <span class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-[11px] text-slate-200 font-bold bg-slate-800/95 px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap pointer-events-none border border-slate-600">${el.spatial_relation}</span>
                
                <div class="drop-zone w-[72px] h-[38px] rounded-lg bg-slate-950/80 border-2 border-dashed border-slate-600 flex items-center justify-center transition-all hover:border-brand-500/50 cursor-pointer"
                     data-answer="${el.term}"
                     ondragover="onDragOver(event)"
                     ondragleave="onDragLeave(event)"
                     ondrop="onDropToZone(event)"
                     onclick="onZoneClick(event)">
                </div>
             </div>
           `;
  });

  stage.innerHTML = innerStage;
  wrapper.appendChild(stage);

  // Botão de verificação
  const btnContainer = document.createElement("div");
  btnContainer.className = "text-center w-full";
  btnContainer.innerHTML = `
          <button type="button" onclick="checkParadigmAnswers()" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg">Verificar Mapa ✓</button>
          <p id="paradigm-feedback" class="mt-4 text-sm font-bold hidden"></p>
        `;
  wrapper.appendChild(btnContainer);

  container.appendChild(wrapper);

  // Renderiza o deck de fichas
  const deck = document.getElementById("paradigm-deck");
  deck.classList.remove("hidden");
  deck.innerHTML = "";

  deck.ondragover = onDragOver;
  deck.ondragleave = onDragLeave;
  deck.ondrop = onDropToDeck;

  // Embaralha e cria as fichas na parte inferior
  allAnswers = shuffleArray(allAnswers);
  allAnswers.forEach((ans, i) => {
    const chip = document.createElement("div");
    chip.className = `drag-chip ${textClass} inline-flex items-center justify-center w-fit cursor-grab bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-1.5 px-4 text-sm rounded-lg shadow-sm transition-transform active:scale-95 select-none`;
    chip.draggable = true;
    chip.id = `chip-diag-${i}`;
    chip.textContent = ans;
    chip.ondragstart = onDragStart;
    chip.ondragend = onDragEnd;
    chip.onclick = onChipClick;
    deck.appendChild(chip);
  });
}

/* --- EVENTOS DE DRAG AND DROP --- */
function onDragStart(e) {
  draggedElement = e.target;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => e.target.classList.add("opacity-30"), 0);
}

function onDragEnd(e) {
  e.target.classList.remove("opacity-30");
  draggedElement = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const zone = e.currentTarget;
  if (zone.id === "paradigm-deck") {
    zone.classList.add("bg-slate-800/30");
  } else {
    zone.classList.add("border-brand-500", "bg-brand-900/20");
  }
}

function onDragLeave(e) {
  const zone = e.currentTarget;
  zone.classList.remove(
    "border-brand-500",
    "bg-brand-900/20",
    "bg-slate-800/30",
  );
}

function onDropToZone(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove("border-brand-500", "bg-brand-900/20");

  if (draggedElement) {
    // Se a zona já tiver uma ficha, devolve a ficha antiga para o deck
    if (zone.children.length > 0) {
      document
        .getElementById("paradigm-deck")
        .appendChild(zone.children[0]);
    }
    zone.appendChild(draggedElement);
    zone.classList.remove(
      "border-dashed",
      "border-rose-500",
      "bg-rose-900/20",
      "border-emerald-500",
      "bg-emerald-900/20",
    );
    zone.classList.add("border-solid", "border-slate-600");
  }
}

function onDropToDeck(e) {
  e.preventDefault();
  const deck = e.currentTarget;
  deck.classList.remove("bg-slate-800/30");

  if (draggedElement) {
    deck.appendChild(draggedElement);
  }
}

/* --- EVENTOS DE CLIQUE / TOQUE (SUPORTE MOBILE) --- */
let selectedChip = null;

function onChipClick(e) {
  e.stopPropagation(); // Evita que o clique vaze para a zona de fundo
  const chip = e.currentTarget;

  // Se a ficha já está encaixada na tabela/mapa, um toque a devolve pro deck
  if (chip.parentElement.classList.contains("drop-zone")) {
    const zone = chip.parentElement;
    document.getElementById("paradigm-deck").appendChild(chip);

    // Restaura o visual de espaço vazio da zona
    zone.classList.remove(
      "border-solid",
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
      "border-slate-600",
    );
    zone.classList.add("border-dashed", "border-slate-700");

    if (selectedChip === chip) clearChipSelection();
    return;
  }

  // Se a ficha está no deck: seleciona ou desmarca
  if (selectedChip === chip) {
    clearChipSelection();
  } else {
    clearChipSelection();
    selectedChip = chip;
    chip.classList.add("ring-4", "ring-brand-500", "scale-110", "z-50");
  }
}

function clearChipSelection() {
  if (selectedChip) {
    selectedChip.classList.remove(
      "ring-4",
      "ring-brand-500",
      "scale-110",
      "z-50",
    );
    selectedChip = null;
  }
}

function onZoneClick(e) {
  e.preventDefault();
  const zone = e.currentTarget;

  // Se o usuário tocou na zona e tem uma ficha selecionada aguardando
  if (selectedChip) {
    // Se a zona já estiver ocupada, devolve a ficha antiga pro deck
    if (zone.children.length > 0) {
      document
        .getElementById("paradigm-deck")
        .appendChild(zone.children[0]);
    }
    zone.appendChild(selectedChip);
    zone.classList.remove(
      "border-dashed",
      "border-rose-500",
      "bg-rose-900/20",
      "border-emerald-500",
      "bg-emerald-900/20",
    );
    zone.classList.add("border-solid", "border-slate-600");
    clearChipSelection();
  }
}

/* --- VERIFICAÇÃO DO EXERCÍCIO --- */
function checkParadigmAnswers() {
  const zones = document.querySelectorAll(".drop-zone");
  let allCorrect = true;
  let filledCount = 0;

  zones.forEach((zone) => {
    const expected = zone.getAttribute("data-answer");
    const chip = zone.children[0];

    // Reseta estilos visuais da zona
    zone.classList.remove(
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
      "border-slate-600",
    );

    if (chip) {
      filledCount++;
      if (chip.textContent === expected) {
        zone.classList.add(
          "border-emerald-500",
          "bg-emerald-900/20",
          "border-solid",
        );
      } else {
        zone.classList.add(
          "border-rose-500",
          "bg-rose-900/20",
          "border-solid",
        );
        allCorrect = false;
      }
    } else {
      zone.classList.add("border-dashed", "border-slate-700");
      allCorrect = false;
    }
  });

  const feedback = document.getElementById("paradigm-feedback");
  feedback.classList.remove("hidden");

  if (filledCount < zones.length) {
    feedback.textContent =
      "⚠️ Preencha todos os espaços antes de verificar!";
    feedback.className = "mt-4 text-sm font-bold text-amber-400";
  } else if (allCorrect) {
    feedback.textContent =
      "🎉 Perfeito! Você completou a tabela corretamente.";
    feedback.className = "mt-4 text-sm font-bold text-emerald-400";
  } else {
    feedback.textContent =
      "❌ Ainda há erros. Tente reposicionar as fichas destacadas em vermelho!";
    feedback.className = "mt-4 text-sm font-bold text-rose-400";
  }
}

// 5. Restaura a tela inicial do modo
function resetParadigmBoard() {
  document.getElementById("paradigm-header").classList.add("hidden");
  document.getElementById("paradigm-deck").classList.add("hidden");
  const board = document.getElementById("paradigm-board");

  // Verifica se o capítulo atual possui paradigmas
  const hasParadigms =
    AppState.currentChapter &&
    AppState.currentChapter.paradigms &&
    AppState.currentChapter.paradigms.length > 0;

  board.innerHTML = `
           <div class="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center text-3xl mb-2">🧩</div>
           <h3 class="text-xl font-bold text-white">Laboratório Estrutural</h3>
           <p class="text-sm text-slate-400 max-w-md mx-auto">
             ${hasParadigms
      ? "Neste modo você treina o reconhecimento visual das terminações e regras. Selecione um paradigma acima para iniciar."
      : "Nenhuma estrutura ou paradigma disponível para este módulo ainda."
    }
           </p>
        `;
}

// Retorna o HTML do diagrama espacial preenchido para uso no Dicionário
function getStaticDiagramHTML(paradigm) {
  const layoutMap = {
    ἐν: { x: 50, y: 50, desc: "Dentro" },
    εἰς: { x: 28, y: 50, desc: "Para dentro" },
    ἐκ: { x: 72, y: 50, desc: "Para fora" },
    διά: { x: 50, y: 66, desc: "Através" },
    ὑπέρ: { x: 50, y: 14, desc: "Acima / Sobre (sem contato)" },
    ὑπό: { x: 50, y: 86, desc: "Debaixo / Sob" },
    ἐπί: { x: 50, y: 31, desc: "Sobre (com contato)" },
    ἀνά: { x: 14, y: 35, desc: "Para cima" },
    κατά: { x: 86, y: 75, desc: "Para baixo" },
    πρός: { x: 38, y: 32, desc: "Em direção a" },
    ἀπό: { x: 62, y: 68, desc: "Afastando-se" },
    πρό: { x: 8, y: 50, desc: "Na frente" },
    ἀντί: { x: 14, y: 66, desc: "Em oposição" },
    σύν: { x: 86, y: 15, desc: "Junto de / Companhia" },
    μετά: { x: 88, y: 44, desc: "Com / Associação" },
    περί: { x: 66, y: 28, desc: "Ao redor" },
  };

  let html = `
          <div class="w-full max-w-4xl mx-auto flex flex-col items-center my-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <h4 class="text-slate-300 font-bold text-sm uppercase tracking-widest mb-6">${paradigm.title}</h4>
            <div class="relative w-full pb-[75%] md:pb-[60%] bg-slate-950 rounded-2xl shadow-inner border border-slate-800/80 overflow-hidden">
              <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="static-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                  </marker>
                  <marker id="static-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                  </marker>
                </defs>
                
                <!-- Referência central do diagrama -->
                <circle cx="400" cy="300" r="90" fill="#1e293b" stroke="#334155" stroke-width="4" stroke-dasharray="10 5"/>
                
                <path d="M 150 300 L 350 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
                <path d="M 450 300 L 650 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
                <path d="M 250 400 L 550 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" stroke-dasharray="4 4" />
                <path d="M 250 80 L 550 80" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <path d="M 250 520 L 550 520" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <circle cx="400" cy="210" r="8" fill="#3b82f6" />
                <path d="M 400 130 L 400 200" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
                <path d="M 110 450 L 110 150" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <path d="M 690 150 L 690 450" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <path d="M 260 160 L 330 230" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
                <path d="M 470 370 L 540 440" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
                <rect x="70" y="285" width="10" height="30" fill="#64748b" />
                <circle cx="50" cy="300" r="8" fill="#3b82f6" />
                <path d="M 50 400 L 100 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <path d="M 170 400 L 120 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <circle cx="680" cy="90" r="8" fill="#3b82f6" />
                <circle cx="705" cy="90" r="8" fill="#3b82f6" />
                <path d="M 680 260 L 740 260" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
                <circle cx="660" cy="260" r="8" fill="#3b82f6" />
                <path d="M 320 210 A 130 130 0 1 1 270 370" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
              </svg>
        `;

  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  for (const [term, data] of Object.entries(layoutMap)) {
    html += `
             <div class="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style="left: ${data.x}%; top: ${data.y}%;">
                <span class="text-[10px] text-slate-400 font-bold mb-1 bg-slate-900/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-700/50">${data.desc}</span>
                <div class="${textClass} flex items-center justify-center min-w-[50px] px-3 h-[32px] rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-bold text-sm shadow-md">
                     ${term}
                </div>
             </div>
           `;
  }

  html += `</div></div>`;
  return html;
}

// Retorna o HTML de uma tabela de paradigma preenchida para uso no Dicionário
function getStaticParadigmTableHTML(paradigm) {
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";
  let html = `
          <div class="w-full max-w-4xl mx-auto flex flex-col items-center my-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg">
            <h4 class="text-slate-300 font-bold text-sm uppercase tracking-widest mb-6 text-center">${paradigm.title}</h4>
            <div class="w-full overflow-x-auto rounded-xl border border-slate-700/50">
              <table class="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr class="bg-slate-950">
        `;

  paradigm.headers.forEach((h) => {
    html += `<th class="px-4 py-4 border-b border-slate-700 text-brand-400 text-xs font-bold uppercase tracking-wider text-center">${h}</th>`;
  });

  html += `
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 bg-slate-900/50">
        `;

  paradigm.rows.forEach((row) => {
    html += `<tr class="hover:bg-slate-800/40 transition">`;
    row.forEach((cellText, cellIdx) => {
      if (cellIdx === 0) {
        html += `<td class="p-3 text-center align-middle bg-slate-950/40 w-24 border-r border-slate-800/60"><span class="font-bold text-slate-400 text-[11px] uppercase tracking-wider">${cellText}</span></td>`;
      } else {
        html += `<td class="p-3 text-center align-middle ${textClass} text-lg font-bold text-slate-100">${cellText}</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `
                </tbody>
              </table>
            </div>
          </div>
        `;
  return html;
}

/* ================= COFFEE & PIX DONATION ================= */
let coffeeButtonTimeout = null;

function copyPixCoffee(btn) {
  const pixKey = "10971140669";
  const button = btn || document.getElementById("btn-coffee");

  // Copiar chave PIX para a área de transferência
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(pixKey).catch(() => fallbackCopyPix(pixKey));
  } else {
    fallbackCopyPix(pixKey);
  }

  function fallbackCopyPix(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Falha ao copiar PIX via execCommand:", err);
    }
    document.body.removeChild(textArea);
  }

  if (!button) return;

  // Limpar temporizador anterior se já estiver ativo
  if (coffeeButtonTimeout) {
    clearTimeout(coffeeButtonTimeout);
  }

  // Animação de pop/pulso
  button.classList.remove("animate-copied-pop", "coffee-btn-glow");
  void button.offsetWidth; // Força reflow para reiniciar animação
  button.classList.add("animate-copied-pop");

  // Altera texto e disposição interna estruturada
  button.innerHTML = `
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300 shadow-sm">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex flex-col text-left leading-tight min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">Pix:</span>
              <span class="font-bold text-xs text-white font-mono tracking-wide select-all">10971140669</span>
              <span class="text-[9px] bg-emerald-400/30 text-emerald-100 border border-emerald-300/50 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0">Copiado!</span>
            </div>
            <div class="text-[10px] text-emerald-100/90 font-medium truncate flex items-center gap-1.5 mt-0.5">
              <span class="truncate">Felipe Pereira Medeiros</span>
              <span class="text-emerald-400/60">•</span>
              <span class="text-emerald-200 font-semibold shrink-0">NuBank</span>
            </div>
          </div>
        `;

  button.className =
    "w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition-all duration-300 flex items-center justify-center sm:justify-start gap-2.5 cursor-pointer animate-copied-pop shrink-0";
  button.title = "Chave PIX copiada para a área de transferência! Clique novamente para recopiar.";

  // Restaura o botão após 8 segundos
  coffeeButtonTimeout = setTimeout(() => {
    resetCoffeeButton(button);
  }, 8000);
}

function resetCoffeeButton(button) {
  if (!button) button = document.getElementById("btn-coffee");
  if (!button) return;

  button.innerHTML = `
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-amber-100 shadow-sm">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div class="flex flex-col text-left leading-tight min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-xs text-white tracking-wide">Pague-me um café!</span>
              <span class="text-[9px] bg-amber-400/25 text-amber-100 border border-amber-300/30 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">Pix</span>
            </div>
            <span class="text-[10px] text-amber-100/80 font-normal">Apoie o desenvolvedor</span>
          </div>
        `;

  button.className =
    "w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 border border-amber-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center sm:justify-start gap-2.5 cursor-pointer coffee-btn-glow shrink-0";
  button.title = "Apoie o desenvolvedor com um café via Pix! Clique para copiar a chave.";
}

/* ================= MOBILE MENU RETRACT / REVEAL ================= */
let isMobileMenuExpanded = false;

function toggleMobileMenu(forceState) {
  if (typeof forceState === "boolean") {
    isMobileMenuExpanded = forceState;
  } else {
    isMobileMenuExpanded = !isMobileMenuExpanded;
  }

  const targets = document.querySelectorAll(".mobile-collapsible-target");
  const toggleIcon = document.getElementById("mobile-menu-toggle-icon");
  const toggleLabel = document.getElementById("mobile-menu-toggle-label");
  const toggleBtn = document.getElementById("mobile-menu-toggle-btn");

  targets.forEach((el) => {
    if (isMobileMenuExpanded) {
      el.classList.remove("hidden");
      el.classList.add("animate-fadeIn");
    } else {
      el.classList.add("hidden");
      el.classList.remove("animate-fadeIn");
    }
  });

  if (toggleIcon) {
    if (isMobileMenuExpanded) {
      toggleIcon.classList.add("rotate-180");
    } else {
      toggleIcon.classList.remove("rotate-180");
    }
  }

  if (toggleLabel) {
    toggleLabel.textContent = isMobileMenuExpanded ? "Recolher" : "Menu";
  }

  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", isMobileMenuExpanded ? "true" : "false");
    toggleBtn.title = isMobileMenuExpanded
      ? "Clique para recolher o menu e focar na lição"
      : "Puxe para baixo para revelar o menu";
    if (isMobileMenuExpanded) {
      toggleBtn.classList.remove("animate-pull-indicator");
    } else {
      toggleBtn.classList.add("animate-pull-indicator");
    }
  }

  if (isMobileMenuExpanded) {
    setTimeout(updateTabsScrollIndicators, 60);
  }
}

/* ================= CAROUSEL TABS HORIZONTAL SCROLL INDICATORS ================= */
function scrollTabs(direction) {
  const container = document.getElementById("navbar-tabs-container");
  if (!container) return;
  const scrollAmount = direction === "right" ? 160 : -160;
  container.scrollBy({ left: scrollAmount, behavior: "smooth" });
}

function updateTabsScrollIndicators() {
  const container = document.getElementById("navbar-tabs-container");
  const leftBtn = document.getElementById("tabs-scroll-left-btn");
  const rightBtn = document.getElementById("tabs-scroll-right-btn");
  const leftFade = document.getElementById("tabs-fade-left");
  const rightFade = document.getElementById("tabs-fade-right");

  if (!container) return;

  // Tolerância de 4px para lidar com arredondamentos de subpixel
  const hasOverflow = container.scrollWidth > container.clientWidth + 4;
  const isScrolledToStart = container.scrollLeft <= 4;
  const isScrolledToEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 6;

  const showLeft = hasOverflow && !isScrolledToStart;
  const showRight = hasOverflow && !isScrolledToEnd;

  if (leftBtn) {
    if (showLeft) {
      leftBtn.classList.remove("hidden");
      leftBtn.classList.add("flex");
    } else {
      leftBtn.classList.add("hidden");
      leftBtn.classList.remove("flex");
    }
  }
  if (leftFade) {
    if (showLeft) {
      leftFade.classList.remove("hidden");
    } else {
      leftFade.classList.add("hidden");
    }
  }

  if (rightBtn) {
    if (showRight) {
      rightBtn.classList.remove("hidden");
      rightBtn.classList.add("flex");
    } else {
      rightBtn.classList.add("hidden");
      rightBtn.classList.remove("flex");
    }
  }
  if (rightFade) {
    if (showRight) {
      rightFade.classList.remove("hidden");
    } else {
      rightFade.classList.add("hidden");
    }
  }
}

window.addEventListener("resize", () => {
  updateTabsScrollIndicators();
});




