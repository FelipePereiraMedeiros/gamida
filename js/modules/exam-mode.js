/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - "Estudo para exame" (MODO TEMPORÁRIO, hebraico e grego)
 * ==========================================================================
 * Revisão para os exames a partir das Provas 1 e 2 de cada língua, com o
 * gabarito. Sai depois dos exames: o roteiro de remoção está em
 * docs/desenvolvimento.md.
 *
 * Cada idioma tem uma lição especial (id "estudo_exame", "special": "exam"):
 * - hebraico: as 18 frases das provas (tradução, chave, análise palavra por
 *   palavra) e o vocabulário delas;
 * - grego: as 40 palavras do vocabulário (respostas do gabarito), as formas da
 *   tabela de análise ("kind": "tabela", com a classificação e a chave) e as
 *   frases das provas com análise.
 * Itens e frases têm "group": "prova1", "prova2" (ou "ambas").
 *
 * Este módulo: botão no menu, aviso, barra com atalhos, filtros ("O que
 * treinar" e "Frases"), sorteios no formato do exame, a chave depois da
 * resposta e a colinha de cada idioma.
 */

(function () {
const CHAPTER_ID = "estudo_exame";
// Muda quando o modo ganha conteúdo novo, para o aviso aparecer de novo uma vez
const SEEN_KEY = "gamida_exam_alert_seen_estudo_exame_2";

const WORDS_KEY = "gamida_exam_words";
const WORDS = ["all", "prova1", "prova2", "sorteio", "tabela"];
const PHRASE_KEY = "gamida_exam_phrases";
const PHRASES = ["all", "prova1", "prova2", "simulado"];
// Sorteios no formato dos exames
const SORTEIO_WORDS = 20;
const SIMULADO = { hebrew: 10, greek: 5 };

const W = () => (typeof window !== "undefined" ? window : {});
const lang = () => (W().AppState && W().AppState.language === "greek" ? "greek" : "hebrew");
const storeKey = (key) => `${key}_${lang()}`;
const read = (key, list) => {
  try {
    const v = localStorage.getItem(storeKey(key));
    return list.includes(v) ? v : "all";
  } catch (_) {
    return "all";
  }
};
const write = (key, v) => {
  try {
    localStorage.setItem(storeKey(key), v);
  } catch (_) {}
};

const getWords = () => {
  const v = read(WORDS_KEY, WORDS);
  return v === "tabela" && lang() !== "greek" ? "all" : v;
};
const getPhrases = () => read(PHRASE_KEY, PHRASES);

const examChapter = () => {
  const AppState = W().AppState;
  return AppState && (AppState.chapters || []).find((c) => c && c.id === CHAPTER_ID);
};
const isExamOpen = () => {
  const AppState = W().AppState;
  return !!examChapter() && !!AppState.currentChapter && AppState.currentChapter.id === CHAPTER_ID;
};
const isSentence = (item) => !!item && (item.type === "Frase" || Array.isArray(item.tokens));
const inProva = (item, prova) => item.group === prova || item.group === "ambas";

function shuffle(list) {
  const fn = W().shuffleArray;
  return typeof fn === "function" ? fn([...list]) : [...list].sort(() => Math.random() - 0.5);
}

const WORD_LABEL = { prova1: "Palavras da Prova 1", prova2: "Palavras da Prova 2", sorteio: `Sorteio de ${SORTEIO_WORDS} palavras`, tabela: "Tabela de análise" };
const PHRASE_LABEL = { prova1: "Frases da Prova 1", prova2: "Frases da Prova 2", simulado: "Simulado de frases" };

/** Palavras: as das provas, um sorteio de 20 (como no exame de grego) ou a tabela de análise */
function filterWords(items, which = getWords()) {
  const words = items.filter((i) => !isSentence(i));
  if (which === "all") return items;
  if (which === "tabela") return words.filter((i) => i.kind === "tabela");
  const vocab = words.filter((i) => i.kind !== "tabela");
  if (which === "sorteio") return shuffle(vocab).slice(0, SORTEIO_WORDS);
  return vocab.filter((i) => inProva(i, which));
}

/** Frases: as de cada prova ou um simulado sorteado */
function filterSentences(items, which = getPhrases()) {
  if (which === "all") return items;
  if (which === "simulado") return shuffle(items).slice(0, SIMULADO[lang()]);
  return items.filter((i) => inProva(i, which));
}

/** Filtros do exame; fora da lição do exame não mexe em nada */
function filterItems(chapter, items, mode) {
  if (!chapter || chapter.id !== CHAPTER_ID) return items;
  return mode === "sentences" ? filterSentences(items) : filterWords(items);
}

/* ---------------- interface ---------------- */

function paintSeg(prefix, list, current) {
  list.forEach((v) => {
    const btn = document.getElementById(`${prefix}-${v}`);
    if (!btn) return;
    btn.className = v === current ? "seg-btn is-active" : "seg-btn";
    btn.setAttribute("aria-pressed", String(v === current));
  });
}

function updateFormUI() {
  if (typeof document === "undefined") return;
  const AppState = W().AppState || {};
  const open = isExamOpen();
  const sentences = AppState.exerciseMode === "sentences";
  const greek = lang() === "greek";
  const words = document.getElementById("practice-form-container");
  const phrases = document.getElementById("practice-phrases-container");
  if (words) words.classList.toggle("hidden", !open || sentences);
  if (phrases) phrases.classList.toggle("hidden", !open || !sentences);
  const tabela = document.getElementById("exam-words-tabela");
  if (tabela) tabela.classList.toggle("hidden", !greek);
  paintSeg("exam-words", WORDS, getWords());
  paintSeg("exam-phrases", PHRASES, getPhrases());
  const bar = document.getElementById("exam-cheatsheet");
  if (bar) bar.classList.toggle("hidden", !open || AppState.currentTab !== "practice");
  document.querySelectorAll("[data-exam-lang]").forEach((el) => {
    el.classList.toggle("hidden", el.getAttribute("data-exam-lang") !== lang());
  });
}

function restartRound() {
  const w = W();
  updateFormUI();
  if (w.AppState) w.AppState.currentQuestionIndex = 0;
  if (typeof w.resetStats === "function") w.resetStats();
  if (typeof w.buildPracticeQueue === "function") w.buildPracticeQueue();
  if (typeof w.renderCurrentQuestion === "function") w.renderCurrentQuestion();
  if (w.UIModule && typeof w.UIModule.updatePracticeOptionsSummary === "function") w.UIModule.updatePracticeOptionsSummary();
}

/** Leva à lição do exame e ao modo pedido (Digitação ou Frases) */
function ensureMode(mode) {
  const w = W();
  if (!isExamOpen()) openExamMode();
  if (w.AppState && w.AppState.exerciseMode !== mode && typeof w.setExerciseMode === "function") {
    w.setExerciseMode(mode);
    return true;
  }
  return false;
}

/** "O que treinar": todas, Prova 1, Prova 2, sorteio de 20 ou tabela de análise (grego) */
function setExamWords(which) {
  if (!WORDS.includes(which)) return;
  write(WORDS_KEY, which);
  const AppState = W().AppState || {};
  if (AppState.exerciseMode === "sentences") {
    if (ensureMode("typing")) return;
  }
  restartRound();
}

/** "Frases": todas, Prova 1, Prova 2 ou simulado; já leva ao modo Frases */
function setExamPhrases(which) {
  if (!PHRASES.includes(which)) return;
  write(PHRASE_KEY, which);
  if (ensureMode("sentences")) return;
  restartRound();
}

/** Atalhos da barra */
function startExamSimulado() {
  if (!examChapter()) return;
  if (lang() === "greek") {
    // Exame de grego: 20 palavras sorteadas das 40
    write(WORDS_KEY, "sorteio");
    if (!ensureMode("typing")) restartRound();
  } else {
    write(PHRASE_KEY, "simulado");
    if (!ensureMode("sentences")) restartRound();
  }
}
function trainExamWords() {
  write(WORDS_KEY, "all");
  if (!ensureMode("typing")) restartRound();
}
function trainExamPhrases() {
  write(PHRASE_KEY, "all");
  if (!ensureMode("sentences")) restartRound();
}
function trainExamTable() {
  write(WORDS_KEY, "tabela");
  if (!ensureMode("typing")) restartRound();
}

/** Mago da Morfologia já com a lição do exame (grego) */
function openExamMorphDrill() {
  const w = W();
  try {
    const key = "gamida_morph_drill_prefs";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    prefs.chapterIds = [CHAPTER_ID];
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch (_) {}
  if (typeof w.switchTab === "function") w.switchTab("review");
  if (typeof w.openMorphDrill === "function") w.openMorphDrill();
}

/** Texto curto para o resumo das opções, ou "" */
function formSummary() {
  const AppState = W().AppState;
  if (!isExamOpen()) return "";
  if (AppState.exerciseMode === "sentences") return PHRASE_LABEL[getPhrases()] || "";
  return WORD_LABEL[getWords()] || "";
}

/* ---------------- chave do gabarito ---------------- */

function hideKey() {
  if (typeof document === "undefined") return;
  const box = document.getElementById("feedback-key");
  if (box) box.classList.add("hidden");
}

/** Depois da resposta: a chave do gabarito, a prova e a referência */
function showKey(question) {
  if (typeof document === "undefined") return;
  const box = document.getElementById("feedback-key");
  const text = document.getElementById("feedback-key-text");
  if (!box || !text) return;
  if (!isExamOpen() || !question || (!question.key && !question.label && !question.ref)) {
    box.classList.add("hidden");
    return;
  }
  const head = [question.label, question.ref].filter(Boolean).join(" · ");
  text.textContent = [head, question.key].filter(Boolean).join(" — ");
  box.classList.remove("hidden");
}

/* ---------------- navegação e aviso ---------------- */

function openExamMode() {
  const w = W();
  if (!examChapter()) return;
  closeAlert();
  if (typeof w.setSelectedChapters === "function") w.setSelectedChapters([CHAPTER_ID]);
  if (typeof w.changeGlobalChapter === "function") w.changeGlobalChapter(CHAPTER_ID);
  if (typeof w.switchTab === "function") w.switchTab("practice");
  refresh();
}

/** Botão do menu (enquanto a lição existir), filtros e barra */
function refresh() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("nav-btn-exam");
  if (!btn) return;
  btn.classList.toggle("hidden", !examChapter());
  const AppState = W().AppState;
  btn.classList.toggle("is-exam-on", isExamOpen() && AppState.currentTab === "practice");
  updateFormUI();
}

function closeAlert() {
  if (typeof document === "undefined") return;
  const box = document.getElementById("exam-alert");
  if (box) box.remove();
}

/** Aviso, uma vez por aparelho */
function maybeAlert() {
  if (typeof document === "undefined" || !examChapter() || document.getElementById("exam-alert")) return;
  try {
    if (localStorage.getItem(SEEN_KEY)) return;
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch (_) {}
  const greek = lang() === "greek";
  const box = document.createElement("div");
  box.id = "exam-alert";
  box.className = "exam-alert";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "exam-alert-title");
  box.innerHTML = `<div class="exam-alert__box">
    <h2 id="exam-alert-title" class="exam-alert__title">Novo: Estudo para exame</h2>
    <p class="exam-alert__text">Revisão das <b>Provas 1 e 2</b>, com o gabarito, no <b>hebraico</b> e no <b>grego</b>:</p>
    <ul class="exam-alert__list">
      <li><b>Frases das provas</b> com tradução, chave e análise palavra por palavra.</li>
      <li><b>Vocabulário</b> (no grego, as 40 palavras e o <b>sorteio de 20</b> como no exame).</li>
      <li>No grego, a <b>tabela de análise</b> e o Mago da Morfologia com as frases das provas.</li>
      <li>A <b>colinha</b> com as regras e os lembretes de cada língua.</li>
      <li>Nas <b>Crônicas do Escriba</b>: batalhas com as provas, à parte da aventura (menu inicial do jogo).</li>
    </ul>
    <p class="exam-alert__text exam-alert__text--soft">Fica no menu, abaixo de Perfil, nas duas línguas. Bons estudos!</p>
    <div class="exam-alert__row">
      <button type="button" class="answer-btn" id="exam-alert-go">Abrir o ${greek ? "grego" : "hebraico"}</button>
      <button type="button" class="link-btn" id="exam-alert-later">Agora não</button>
    </div>
  </div>`;
  document.body.appendChild(box);
  box.querySelector("#exam-alert-go").addEventListener("click", openExamMode);
  box.querySelector("#exam-alert-later").addEventListener("click", closeAlert);
  box.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAlert();
  });
  box.querySelector("#exam-alert-go").focus();
}

const ExamMode = {
  CHAPTER_ID, SORTEIO_WORDS, SIMULADO,
  openExamMode, refresh, maybeAlert, updateFormUI,
  getWords, getPhrases, filterWords, filterSentences, filterItems, formSummary,
  setExamWords, setExamPhrases, startExamSimulado, trainExamWords, trainExamPhrases, trainExamTable, openExamMorphDrill,
  showKey, hideKey,
};

if (typeof window !== "undefined") {
  window.ExamMode = ExamMode;
  window.openExamMode = openExamMode;
  window.setExamWords = setExamWords;
  window.setExamPhrases = setExamPhrases;
  window.startExamSimulado = startExamSimulado;
  window.trainExamWords = trainExamWords;
  window.trainExamPhrases = trainExamPhrases;
  window.trainExamTable = trainExamTable;
  window.openExamMorphDrill = openExamMorphDrill;
}
if (typeof module !== "undefined" && module.exports) module.exports = ExamMode;
})();
