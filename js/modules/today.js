/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Painel "Hoje"
 * ==========================================================================
 * No topo da tela inicial, um único próximo passo para o aluno, nesta ordem:
 *   1. revisar o que venceu na repetição espaçada ou o que errou;
 *   2. avançar no Caminho do domínio (o próximo capítulo liberado);
 *   3. jogar o próximo capítulo das Crônicas do Escriba.
 * Os outros passos ficam logo abaixo, a um toque, com a meta do dia.
 * O painel pode ser ocultado até o dia seguinte.
 */

(function () {
const HIDE_KEY = "gamida_today_hidden";

const dayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const W = () => (typeof window !== "undefined" ? window : {});

/** Os passos possíveis de hoje, já na ordem de prioridade */
function computeSteps(state) {
  const steps = [];
  const { due = 0, errors = 0, path = null, scribe = null } = state;
  if (due > 0) {
    steps.push({ id: "due", title: `Revisar ${due} ${due === 1 ? "palavra vencida" : "palavras vencidas"}`, text: "A repetição espaçada separou o que está na hora de rever.", cta: "Revisar agora" });
  } else if (errors > 0) {
    steps.push({ id: "errors", title: `Rever ${errors} ${errors === 1 ? "palavra errada" : "palavras erradas"}`, text: "Os erros de todos os modos e jogos ficam reunidos aqui.", cta: "Rever erros" });
  }
  if (path) {
    steps.push({ id: "path", title: `Caminho do domínio: ${path.title}`, text: `${path.terms} termos. Acerte todos para liberar o próximo capítulo.`, cta: "Continuar o caminho", chapterId: path.id });
  }
  if (scribe) {
    steps.push({ id: "scribe", title: `Crônicas do Escriba: capítulo ${scribe.number} · ${scribe.city}`, text: "Revise jogando: criaturas-palavra e o guardião de frases do capítulo.", cta: "Jogar o capítulo" });
  }
  return steps;
}

/** Lê o estado do aluno no idioma atual */
function readState() {
  const w = W();
  const state = {};
  try {
    state.due = typeof w.getDueCards === "function" ? w.getDueCards().length : 0;
    state.errors = typeof w.getErrorCards === "function" ? w.getErrorCards().length : 0;
  } catch (_) {}
  const AppState = w.AppState;
  if (AppState && w.MasteryPathModule) {
    const status = w.MasteryPathModule.getPathStatus(AppState.chapters, w.MasteryPathModule.loadCompleted(AppState.language));
    const next = status.find((s) => s.status === "open");
    if (next) state.path = { id: next.chapter.id, title: next.chapter.title, terms: next.termCount };
  }
  if (AppState && w.ScribeModule) {
    const campaign = w.ScribeModule.buildCampaign(AppState.chapters, AppState.language);
    const progress = w.ScribeModule.loadProgress(AppState.language);
    const idx = campaign.findIndex((c) => !progress.done[c.chapter.id]);
    if (idx >= 0) state.scribe = { number: idx + 1, city: campaign[idx].meta.city };
  }
  state.activity = w.ActivityModule ? w.ActivityModule.getActivitySummary() : null;
  return state;
}

function run(step) {
  const w = W();
  if (typeof w.switchTab === "function") w.switchTab(step.id === "scribe" ? "play" : "review");
  if (step.id === "due" || step.id === "errors") w.startAnki(step.id);
  else if (step.id === "path") {
    w.openMasteryPath();
    w.startMasteryPathChapter(step.chapterId);
  } else if (step.id === "scribe") w.openScribeChronicles();
}

function hiddenToday() {
  try {
    return localStorage.getItem(HIDE_KEY) === dayKey();
  } catch (_) {
    return false;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Desenha (ou esconde) o painel. Chamado ao abrir o app e ao voltar à tela inicial. */
function render() {
  if (typeof document === "undefined") return;
  const root = document.getElementById("today-panel");
  if (!root) return;
  root.textContent = "";
  if (hiddenToday()) {
    root.classList.add("hidden");
    return;
  }
  const state = readState();
  const steps = computeSteps(state);
  root.classList.remove("hidden");

  const head = el("div", "today__head");
  head.appendChild(el("h2", "today__title", "Hoje"));
  const a = state.activity;
  if (a) {
    head.appendChild(el("span", "today__goal", `${Math.min(a.today, a.goal)} de ${a.goal} respostas${a.streak ? ` · ${a.streak} ${a.streak === 1 ? "dia seguido" : "dias seguidos"}` : ""}`));
  }
  const hide = el("button", "today__hide", "Ocultar hoje");
  hide.type = "button";
  hide.addEventListener("click", () => {
    try {
      localStorage.setItem(HIDE_KEY, dayKey());
    } catch (_) {}
    render();
  });
  head.appendChild(hide);
  root.appendChild(head);

  if (a) {
    const bar = el("div", "today__bar");
    const fill = el("i");
    fill.style.width = `${Math.min(100, (a.today / Math.max(1, a.goal)) * 100)}%`;
    bar.appendChild(fill);
    root.appendChild(bar);
  }

  if (!steps.length) {
    root.appendChild(el("p", "today__done", a && a.goalMet
      ? "Meta de hoje cumprida e nada pendente. Bom trabalho!"
      : "Nada pendente na revisão, no caminho ou nas Crônicas. Pratique abaixo para completar a meta."));
    return;
  }
  const [main, ...rest] = steps;
  const card = el("div", "today__main");
  const body = el("div", "today__body");
  body.appendChild(el("b", "today__step", main.title));
  body.appendChild(el("span", "today__text", main.text));
  card.appendChild(body);
  const go = el("button", "answer-btn today__go", main.cta);
  go.type = "button";
  go.id = "today-go";
  go.addEventListener("click", () => run(main));
  card.appendChild(go);
  root.appendChild(card);
  if (rest.length) {
    const more = el("div", "today__more");
    more.appendChild(el("span", "today__more-label", "Depois:"));
    rest.forEach((step) => {
      const link = el("button", "today__link", step.title);
      link.type = "button";
      link.addEventListener("click", () => run(step));
      more.appendChild(link);
    });
    root.appendChild(more);
  }
}

const TodayModule = { computeSteps, readState, render };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.TodayModule = TodayModule;
  // A meta do dia muda a cada resposta: o painel acompanha quando o aluno volta a ele
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") render();
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = TodayModule;
}
})();
