/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - "Prova de amanhã" (modo de revisão para a prova, só no hebraico)
 * ==========================================================================
 * As palavras da revisão das lições IX–XIV ficam numa lição especial
 * (data/hebrew_chapters.json, id "prova_amanha", "special": "exam"), com o
 * plural e o plural construto dos substantivos como palavras do vocabulário.
 * Toda a prática funciona nela (digitação, escolha, favoritas, erros).
 *
 * Este módulo mostra o botão no menu (abaixo de Perfil) e, uma vez por
 * aparelho, o aviso de que o modo existe, com o botão que leva até ele.
 * Para retirar o modo depois da prova: apague a lição do JSON; o botão e o
 * aviso somem sozinhos.
 */

(function () {
const CHAPTER_ID = "prova_amanha";
// Muda quando o modo ganha conteúdo novo, para o aviso aparecer de novo uma vez
const SEEN_KEY = "gamida_exam_alert_seen_prova2_frases";

const FORM_KEY = "gamida_exam_form";
const FORMS = ["all", "root", "plural", "construct"];
const FORM_LABEL = { root: "Só a raiz", plural: "Só o plural", construct: "Só o construto" };

const W = () => (typeof window !== "undefined" ? window : {});

/** Forma escolhida no filtro da prova: tudo, raiz, plural ou construto */
function getForm() {
  try {
    const v = localStorage.getItem(FORM_KEY);
    return FORMS.includes(v) ? v : "all";
  } catch (_) {
    return "all";
  }
}

/**
 * O item entra no filtro? Raiz = palavra da lista (sem "singular");
 * plural e construto pelo tipo. קוֹל e תּוֹרָה têm plural e construto iguais: entram nos dois.
 * Frases só entram em "Tudo".
 */
function matchesForm(item, form = getForm()) {
  if (form === "all") return true;
  if (!item || item.type === "Frase" || Array.isArray(item.tokens)) return false;
  const type = String(item.type || "");
  if (form === "root") return !item.singular;
  if (!item.singular) return false;
  const same = /iguais/.test(type);
  if (form === "construct") return same || /construto/.test(type);
  return same || !/construto/.test(type);
}

/** O filtro só vale na lição da prova */
function filterItems(chapter, items) {
  if (!chapter || chapter.id !== CHAPTER_ID) return items;
  const form = getForm();
  return form === "all" ? items : items.filter((i) => matchesForm(i, form));
}

function updateFormUI() {
  if (typeof document === "undefined") return;
  const box = document.getElementById("practice-form-container");
  if (!box) return;
  const AppState = W().AppState;
  const active = !!examChapter() && AppState.currentChapter && AppState.currentChapter.id === CHAPTER_ID;
  box.classList.toggle("hidden", !active || AppState.exerciseMode === "sentences");
  const form = getForm();
  FORMS.forEach((f) => {
    const btn = document.getElementById(`exam-form-${f}`);
    if (!btn) return;
    btn.className = f === form ? "seg-btn is-active" : "seg-btn";
    btn.setAttribute("aria-pressed", String(f === form));
  });
}

/** Troca a forma e recomeça a rodada com as palavras filtradas */
function setExamForm(form) {
  if (!FORMS.includes(form)) return;
  try {
    localStorage.setItem(FORM_KEY, form);
  } catch (_) {}
  const w = W();
  updateFormUI();
  if (w.AppState) w.AppState.currentQuestionIndex = 0;
  if (typeof w.resetStats === "function") w.resetStats();
  if (typeof w.buildPracticeQueue === "function") w.buildPracticeQueue();
  if (typeof w.renderCurrentQuestion === "function") w.renderCurrentQuestion();
  if (w.UIModule && typeof w.UIModule.updatePracticeOptionsSummary === "function") w.UIModule.updatePracticeOptionsSummary();
}

/** Texto curto para o resumo das opções ("Só o plural"), ou "" */
function formSummary() {
  const AppState = W().AppState;
  if (!AppState || !AppState.currentChapter || AppState.currentChapter.id !== CHAPTER_ID || AppState.exerciseMode === "sentences") return "";
  return FORM_LABEL[getForm()] || "";
}
const examChapter = () => {
  const AppState = W().AppState;
  return AppState && AppState.language === "hebrew" && (AppState.chapters || []).find((c) => c && c.id === CHAPTER_ID);
};

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
  const prompt = document.getElementById("practice-std-panel") || document.getElementById("tab-practice");
  if (prompt && typeof prompt.scrollIntoView === "function") prompt.scrollIntoView({ block: "start" });
}

/** Botão do menu: só no hebraico e enquanto a lição existir; aceso quando ela está aberta */
function refresh() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("nav-btn-exam");
  if (!btn) return;
  const chap = examChapter();
  btn.classList.toggle("hidden", !chap);
  const AppState = W().AppState;
  const on = !!chap && AppState.currentChapter && AppState.currentChapter.id === CHAPTER_ID && AppState.currentTab === "practice";
  btn.classList.toggle("is-exam-on", on);
  updateFormUI();
}

function closeAlert() {
  const box = document.getElementById("exam-alert");
  if (box) box.remove();
}

/** Aviso, uma vez por aparelho: o modo existe, com o botão que leva até ele */
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
    <h2 id="exam-alert-title" class="exam-alert__title">Novo: Prova de amanhã</h2>
    <p class="exam-alert__text">As 36 palavras da revisão das lições IX–XIV, com o <b>plural</b> e o <b>plural construto</b> dos substantivos, e 89 frases dos exercícios do Kelley com essas palavras (modo Frases).</p>
    <p class="exam-alert__text exam-alert__text--soft">Fica no menu, abaixo de Perfil.</p>
    <div class="exam-alert__row">
      <button type="button" class="answer-btn" id="exam-alert-go">Treinar agora</button>
      <button type="button" class="btn-secondary" id="exam-alert-later">Agora não</button>
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

const ExamMode = { CHAPTER_ID, openExamMode, refresh, maybeAlert, getForm, matchesForm, filterItems, setExamForm, formSummary, updateFormUI };

if (typeof window !== "undefined") {
  window.ExamMode = ExamMode;
  window.openExamMode = openExamMode;
  window.setExamForm = setExamForm;
}
if (typeof module !== "undefined" && module.exports) module.exports = ExamMode;
})();
