/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - "Prova de amanhã" (MODO EMERGENCIAL, só no hebraico)
 * ==========================================================================
 * Revisão para a Prova 2 de Hebraico 2 (lições IX–XIV). Sai depois da prova:
 * o roteiro de remoção está em docs/desenvolvimento.md.
 *
 * A lição especial (data/hebrew_chapters.json, id "prova_amanha") traz:
 * - as 36 palavras da revisão, com o plural e o plural construto dos substantivos;
 * - as formas gramaticais dos slides (pronomes, demonstrativos, sufixos,
 *   perfeito Qal, troncos), com "group": "gramatica";
 * - as 217 frases da lista do professor (kind "nominal" ou "verbal"), com a
 *   tradução, a chave do gabarito ("key") e a referência ("ref");
 * - as frases dos exercícios do Kelley que usam as palavras (kind "kelley").
 *
 * Este módulo: botão no menu, aviso, filtros ("O que treinar" e "Frases",
 * com o simulado de 10 frases no formato da prova), a chave depois da
 * resposta, a colinha da revisão e o atalho para o vocabulário das lições I–XIV.
 */

(function () {
const CHAPTER_ID = "prova_amanha";
// Muda quando o modo ganha conteúdo novo, para o aviso aparecer de novo uma vez
const SEEN_KEY = "gamida_exam_alert_seen_prova2_completo";

const FORM_KEY = "gamida_exam_form";
const FORMS = ["all", "root", "plural", "construct", "grammar"];
const FORM_LABEL = { root: "Só a raiz", plural: "Só o plural", construct: "Só o construto", grammar: "Gramática" };

const PHRASE_KEY = "gamida_exam_phrases";
const PHRASES = ["all", "nominal", "verbal", "kelley", "simulado"];
const PHRASE_LABEL = { nominal: "Frases nominais", verbal: "Frases verbais", kelley: "Exercícios do Kelley", simulado: "Simulado: 5 nominais + 5 verbais" };
const SIMULADO_EACH = 5;

const W = () => (typeof window !== "undefined" ? window : {});
const read = (key, list) => {
  try {
    const v = localStorage.getItem(key);
    return list.includes(v) ? v : "all";
  } catch (_) {
    return "all";
  }
};
const write = (key, v) => {
  try {
    localStorage.setItem(key, v);
  } catch (_) {}
};

const getForm = () => read(FORM_KEY, FORMS);
const getPhrases = () => read(PHRASE_KEY, PHRASES);

const examChapter = () => {
  const AppState = W().AppState;
  return AppState && AppState.language === "hebrew" && (AppState.chapters || []).find((c) => c && c.id === CHAPTER_ID);
};
const isExamOpen = () => {
  const AppState = W().AppState;
  return !!examChapter() && !!AppState.currentChapter && AppState.currentChapter.id === CHAPTER_ID;
};
const isSentence = (item) => !!item && (item.type === "Frase" || Array.isArray(item.tokens));

/**
 * O item entra no filtro "O que treinar"? Raiz = palavras da lista; plural e
 * construto pelo tipo (קוֹל e תּוֹרָה têm os dois iguais e entram nos dois);
 * Gramática = formas dos slides. Frases só entram em "Tudo".
 */
function matchesForm(item, form = getForm()) {
  if (form === "all") return true;
  if (!item || isSentence(item)) return false;
  if (form === "grammar") return item.group === "gramatica";
  if (item.group === "gramatica") return false;
  if (form === "root") return !item.singular;
  if (!item.singular) return false;
  const type = String(item.type || "");
  const same = /iguais/.test(type);
  if (form === "construct") return same || /construto/.test(type);
  return same || !/construto/.test(type);
}

function shuffle(list) {
  const fn = W().shuffleArray;
  return typeof fn === "function" ? fn([...list]) : [...list].sort(() => Math.random() - 0.5);
}

/** Frases do filtro "Frases"; o simulado sorteia 5 nominais e 5 verbais, como na prova */
function filterSentences(items, which = getPhrases()) {
  if (which === "all") return items;
  if (which === "simulado") {
    const pick = (kind) => shuffle(items.filter((i) => i.kind === kind)).slice(0, SIMULADO_EACH);
    return [...pick("nominal"), ...pick("verbal")];
  }
  return items.filter((i) => i.kind === which);
}

/** Filtros da prova; fora da lição da prova não mexe em nada */
function filterItems(chapter, items, mode) {
  if (!chapter || chapter.id !== CHAPTER_ID) return items;
  if (mode === "sentences") return filterSentences(items);
  const form = getForm();
  return form === "all" ? items : items.filter((i) => matchesForm(i, form));
}

/* ---------------- interface: botão, filtros, colinha ---------------- */

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
  const form = document.getElementById("practice-form-container");
  const phrases = document.getElementById("practice-phrases-container");
  if (form) form.classList.toggle("hidden", !open || sentences);
  if (phrases) phrases.classList.toggle("hidden", !open || !sentences);
  paintSeg("exam-form", FORMS, getForm());
  paintSeg("exam-phrases", PHRASES, getPhrases());
  const cheat = document.getElementById("exam-cheatsheet");
  if (cheat) cheat.classList.toggle("hidden", !open || AppState.currentTab !== "practice");
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

/** "O que treinar": tudo, raiz, plural, construto ou gramática */
function setExamForm(form) {
  if (!FORMS.includes(form)) return;
  write(FORM_KEY, form);
  restartRound();
}

/** "Frases": todas, nominais, verbais, Kelley ou simulado; já leva ao modo Frases */
function setExamPhrases(which) {
  if (!PHRASES.includes(which)) return;
  write(PHRASE_KEY, which);
  const w = W();
  if (w.AppState && w.AppState.exerciseMode !== "sentences" && typeof w.setExerciseMode === "function") {
    w.setExerciseMode("sentences");
    return;
  }
  restartRound();
}

/** Simulado da prova: 10 frases sorteadas (5 nominais + 5 verbais) */
function startSimulado() {
  if (!examChapter()) return;
  if (!isExamOpen()) openExamMode();
  setExamPhrases("simulado");
  restartRound();
}

/** Texto curto para o resumo das opções, ou "" */
function formSummary() {
  const AppState = W().AppState;
  if (!isExamOpen()) return "";
  if (AppState.exerciseMode === "sentences") return PHRASE_LABEL[getPhrases()] || "";
  return FORM_LABEL[getForm()] || "";
}

/* ---------------- chave do gabarito depois da resposta ---------------- */

function hideKey() {
  if (typeof document === "undefined") return;
  const box = document.getElementById("feedback-key");
  if (box) box.classList.add("hidden");
}

/** Depois da resposta: a chave do gabarito e a referência da frase */
function showKey(question) {
  if (typeof document === "undefined") return;
  const box = document.getElementById("feedback-key");
  const text = document.getElementById("feedback-key-text");
  if (!box || !text) return;
  const key = question && question.key;
  const ref = question && question.ref;
  const label = question && question.label;
  if (!key && !ref && !label) {
    box.classList.add("hidden");
    return;
  }
  const body = [key, ref ? `(${ref})` : ""].filter(Boolean).join(" ") || "Frase da lista do professor (sem chave no gabarito).";
  text.textContent = label ? `${label} · ${body}` : body;
  box.classList.remove("hidden");
}

/* ---------------- navegação ---------------- */

/** Abre a prática na lição da prova */
function openExamMode() {
  const w = W();
  const chap = examChapter();
  if (!chap) return;
  closeAlert();
  if (typeof w.setSelectedChapters === "function") w.setSelectedChapters([CHAPTER_ID]);
  if (typeof w.changeGlobalChapter === "function") w.changeGlobalChapter(CHAPTER_ID);
  if (typeof w.switchTab === "function") w.switchTab("practice");
  refresh();
}

/** Todo o vocabulário das lições I–XIV (o que cai na prova), numa sessão só */
function openFullVocab() {
  const w = W();
  const AppState = w.AppState;
  if (!AppState) return;
  const chapters = AppState.chapters || [];
  const last = chapters.findIndex((c) => c && c.id === "kelley_14");
  if (last < 0) return;
  const ids = chapters.slice(0, last + 1).filter((c) => c && !c.special).map((c) => c.id);
  closeAlert();
  if (typeof w.changeGlobalChapter === "function") w.changeGlobalChapter("kelley_14");
  if (typeof w.setSelectedChapters === "function") w.setSelectedChapters(ids);
  if (typeof w.switchTab === "function") w.switchTab("practice");
  if (typeof w.setExerciseMode === "function") w.setExerciseMode("typing");
  if (w.UIModule && typeof w.UIModule.renderChapterSelectorLists === "function") w.UIModule.renderChapterSelectorLists();
  refresh();
}

/** Botão do menu (só no hebraico e enquanto a lição existir), filtros e colinha */
function refresh() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("nav-btn-exam");
  if (!btn) return;
  const chap = examChapter();
  btn.classList.toggle("hidden", !chap);
  const AppState = W().AppState;
  btn.classList.toggle("is-exam-on", isExamOpen() && AppState.currentTab === "practice");
  updateFormUI();
}

/* ---------------- aviso ---------------- */

function closeAlert() {
  if (typeof document === "undefined") return;
  const box = document.getElementById("exam-alert");
  if (box) box.remove();
}

/** Aviso, uma vez por aparelho (de novo quando o modo ganha conteúdo novo) */
function maybeAlert() {
  if (typeof document === "undefined" || !examChapter() || document.getElementById("exam-alert")) return;
  try {
    if (localStorage.getItem(SEEN_KEY)) return;
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch (_) {}
  const box = document.createElement("div");
  box.id = "exam-alert";
  box.className = "exam-alert";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "exam-alert-title");
  box.innerHTML = `<div class="exam-alert__box">
    <h2 id="exam-alert-title" class="exam-alert__title">Prova de amanhã: revisão completa</h2>
    <ul class="exam-alert__list">
      <li>As <b>217 frases</b> da lista do professor, com <b>gabarito e chave</b> depois de cada resposta.</li>
      <li><b>Simulado</b> no formato da prova: 10 frases, 5 nominais e 5 verbais.</li>
      <li>As 36 palavras com <b>plural e construto</b>, e as formas dos slides: <b>sufixos, perfeito, troncos, pronomes</b>.</li>
      <li>A <b>colinha</b> da revisão: método, quadros e lembretes.</li>
    </ul>
    <p class="exam-alert__text exam-alert__text--soft">Fica no menu, abaixo de Perfil. Boa prova!</p>
    <div class="exam-alert__row">
      <button type="button" class="answer-btn" id="exam-alert-go">Treinar agora</button>
      <button type="button" class="btn-secondary" id="exam-alert-sim">Fazer o simulado</button>
      <button type="button" class="link-btn" id="exam-alert-later">Agora não</button>
    </div>
  </div>`;
  document.body.appendChild(box);
  box.querySelector("#exam-alert-go").addEventListener("click", openExamMode);
  box.querySelector("#exam-alert-sim").addEventListener("click", () => {
    closeAlert();
    startSimulado();
  });
  box.querySelector("#exam-alert-later").addEventListener("click", closeAlert);
  box.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAlert();
  });
  box.querySelector("#exam-alert-go").focus();
}

const ExamMode = {
  CHAPTER_ID, SIMULADO_EACH,
  openExamMode, openFullVocab, startSimulado, refresh, maybeAlert,
  getForm, getPhrases, matchesForm, filterSentences, filterItems,
  setExamForm, setExamPhrases, formSummary, updateFormUI, showKey, hideKey,
};

if (typeof window !== "undefined") {
  window.ExamMode = ExamMode;
  window.openExamMode = openExamMode;
  window.openExamFullVocab = openFullVocab;
  window.startExamSimulado = startSimulado;
  window.setExamForm = setExamForm;
  window.setExamPhrases = setExamPhrases;
}
if (typeof module !== "undefined" && module.exports) module.exports = ExamMode;
})();
