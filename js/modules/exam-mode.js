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

const W = () => (typeof window !== "undefined" ? window : {});
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

const ExamMode = { CHAPTER_ID, openExamMode, refresh, maybeAlert };

if (typeof window !== "undefined") {
  window.ExamMode = ExamMode;
  window.openExamMode = openExamMode;
}
if (typeof module !== "undefined" && module.exports) module.exports = ExamMode;
})();
