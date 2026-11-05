/**
 * ==========================================================================
 * Gamida - Caminho do Domínio
 * ==========================================================================
 * Percorre os capítulos de vocabulário em ordem, com a mecânica do Praticar
 * (digitar a tradução e ver a correção). Só termos, sem frases.
 * Regra: o próximo capítulo só é liberado quando o aluno acerta TODOS os termos
 * do capítulo atual numa mesma tentativa. Um erro reinicia o capítulo, com os
 * termos embaralhados novamente.
 */

(function () {
const _stateModule = (typeof require !== "undefined") ? require("./state.js") : (typeof window !== "undefined" ? window : {});
const _evalModule = (typeof require !== "undefined") ? require("./evaluation.js") : (typeof window !== "undefined" ? window : {});

const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const evaluateAnswer = (typeof window !== "undefined" && window.evaluateAnswer) || _evalModule.evaluateAnswer;
const isAlphabetChapter = (typeof window !== "undefined" && window.isAlphabetChapter) || _stateModule.isAlphabetChapter;

/* ================= LÓGICA (sem DOM) ================= */

/** Capítulos que entram no caminho: com termos e fora do alfabeto, na ordem do livro */
function getPathChapters(chapters) {
  return (Array.isArray(chapters) ? chapters : []).filter(
    (c) => c && !isAlphabetChapter(c) && Array.isArray(c.items) && c.items.length > 0,
  );
}

/** Termos únicos do capítulo (sem frases) */
function getChapterTerms(chapter) {
  const seen = new Set();
  const terms = [];
  ((chapter && chapter.items) || []).forEach((item) => {
    const t = getTerm(item);
    if (!t || seen.has(t)) return;
    seen.add(t);
    terms.push(item);
  });
  return terms;
}

function storageKey(language) {
  return `gamida_${language}_mastery_path`;
}

/** Ids dos capítulos concluídos no idioma */
function loadCompleted(language) {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(language));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.completed) ? parsed.completed : [];
  } catch (_) {
    return [];
  }
}

function saveCompleted(language, completed) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(language), JSON.stringify({ completed }));
  } catch (err) {
    console.warn("Aviso ao salvar o Caminho do domínio:", err);
  }
}

/**
 * Une os capítulos concluídos de um backup aos deste dispositivo, sem perder nenhum lado
 * @returns {number} quantos capítulos foram acrescentados
 */
function mergeCompleted(language, incoming) {
  const completed = loadCompleted(language);
  const ids = Array.isArray(incoming) ? incoming : [];
  const added = ids.filter(
    (id, idx) => typeof id === "string" && id && !completed.includes(id) && ids.indexOf(id) === idx,
  );
  if (added.length > 0) saveCompleted(language, [...completed, ...added]);
  return added.length;
}

/**
 * Situação de cada capítulo no caminho.
 * O primeiro está sempre liberado; os demais, quando o anterior foi concluído.
 * @returns {Array<{chapter, status: 'done'|'open'|'locked', termCount}>}
 */
function getPathStatus(chapters, completedIds) {
  const done = new Set(completedIds || []);
  return getPathChapters(chapters).map((chapter, idx, list) => {
    let status;
    if (done.has(chapter.id)) status = "done";
    else if (idx === 0 || done.has(list[idx - 1].id)) status = "open";
    else status = "locked";
    return { chapter, status, termCount: getChapterTerms(chapter).length };
  });
}

/** Cria a sessão de um capítulo (primeira tentativa) */
function createSession(chapter) {
  return {
    chapter,
    terms: getChapterTerms(chapter),
    queue: shuffleArray(getChapterTerms(chapter)),
    index: 0,
    attempt: 1,
    answered: false,
    failed: false,
    completed: false,
    lastResult: null,
  };
}

/**
 * Avalia a resposta do termo atual. Erro de digitação conta como acerto,
 * como no Praticar; qualquer erro marca a tentativa como perdida.
 */
function answerSession(session, userAnswer) {
  if (!session || session.answered || session.completed) return null;
  const item = session.queue[session.index];
  const result = evaluateAnswer(userAnswer, item.translations || []);
  session.answered = true;
  session.lastResult = result;
  if (result.status === "incorrect") session.failed = true;
  return result;
}

/**
 * Avança após a correção. Retorna o que aconteceu:
 * 'next' (próximo termo), 'restart' (errou: recomeça embaralhado) ou 'completed'.
 */
function advanceSession(session) {
  if (!session || !session.answered) return null;
  session.answered = false;
  session.lastResult = null;
  if (session.failed) {
    session.failed = false;
    session.attempt += 1;
    session.index = 0;
    session.queue = reshuffle(session.terms, session.queue);
    return "restart";
  }
  session.index += 1;
  if (session.index >= session.queue.length) {
    session.completed = true;
    return "completed";
  }
  return "next";
}

/** Nova ordem que, havendo mais de um termo, não repete a ordem anterior */
function reshuffle(terms, previous) {
  let next = shuffleArray([...terms]);
  if (terms.length > 1) {
    const prevOrder = (previous || []).map(getTerm).join("|");
    for (let i = 0; i < 5 && next.map(getTerm).join("|") === prevOrder; i++) {
      next = shuffleArray([...terms]);
    }
    // Garante uma ordem diferente mesmo se o sorteio repetir a anterior
    if (next.map(getTerm).join("|") === prevOrder) {
      [next[0], next[1]] = [next[1], next[0]];
    }
  }
  return next;
}

/** Registra o capítulo concluído e devolve o próximo capítulo do caminho (ou null) */
function markCompleted(language, chapters, chapterId) {
  const completed = loadCompleted(language);
  if (!completed.includes(chapterId)) {
    completed.push(chapterId);
    saveCompleted(language, completed);
  }
  const list = getPathChapters(chapters);
  const idx = list.findIndex((c) => c.id === chapterId);
  return idx >= 0 && idx + 1 < list.length ? list[idx + 1] : null;
}

/* ================= INTERFACE ================= */

let session = null;

function el(id) {
  return typeof document !== "undefined" ? document.getElementById(id) : null;
}

function show(id, visible) {
  const node = el(id);
  if (node) node.classList.toggle("hidden", !visible);
  return node;
}

function langTextClass() {
  return AppState.language === "greek" ? "greek-text" : "hebrew-text";
}

function updatePathDashboardStat() {
  const stat = el("path-card-stat");
  if (!stat) return;
  const status = getPathStatus(AppState.chapters, loadCompleted(AppState.language));
  const done = status.filter((s) => s.status === "done").length;
  stat.textContent = `${done} de ${status.length} capítulos dominados`;
}

function openMasteryPath() {
  if (typeof document === "undefined") return;
  session = null;
  show("assess-dashboard", false);
  show("path-active", false);
  show("path-complete", false);
  show("path-overview", true);
  renderPathOverview();
}

function renderPathOverview() {
  const list = el("path-chapter-list");
  if (!list) return;
  const status = getPathStatus(AppState.chapters, loadCompleted(AppState.language));
  const done = status.filter((s) => s.status === "done").length;
  const summary = el("path-overview-summary");
  if (summary) summary.textContent = `${done} de ${status.length} capítulos dominados`;

  list.innerHTML = "";
  if (status.length === 0) {
    const li = document.createElement("li");
    li.className = "path-step is-locked";
    li.textContent = "Nenhum capítulo com termos disponível.";
    list.appendChild(li);
    return;
  }
  status.forEach(({ chapter, status: st, termCount }, idx) => {
    const li = document.createElement("li");
    li.className = `path-step is-${st}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "path-step__btn";
    btn.disabled = st === "locked";
    const marker = st === "done" ? "✓" : st === "open" ? String(idx + 1) : "🔒";
    const label = st === "done" ? "Dominado · praticar de novo" : st === "open" ? "Liberado" : "Bloqueado";
    btn.innerHTML = `
      <span class="path-step__marker" aria-hidden="true"></span>
      <span class="path-step__body">
        <span class="path-step__title"></span>
        <span class="path-step__meta"></span>
      </span>`;
    btn.querySelector(".path-step__marker").textContent = marker;
    btn.querySelector(".path-step__title").textContent = chapter.title;
    btn.querySelector(".path-step__meta").textContent = `${termCount} termos · ${label}`;
    btn.setAttribute("aria-label", `${chapter.title}: ${label}`);
    if (st !== "locked") btn.onclick = () => startMasteryPathChapter(chapter.id);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function startMasteryPathChapter(chapterId) {
  const status = getPathStatus(AppState.chapters, loadCompleted(AppState.language));
  const entry = status.find((s) => s.chapter.id === chapterId);
  if (!entry || entry.status === "locked") return;
  session = createSession(entry.chapter);
  show("assess-dashboard", false);
  show("path-overview", false);
  show("path-complete", false);
  show("path-active", true);
  renderPathQuestion();
}

function renderPathQuestion(notice) {
  if (!session || typeof document === "undefined") return;
  const item = session.queue[session.index];
  const total = session.queue.length;

  const title = el("path-chapter-title");
  if (title) title.textContent = session.chapter.title;
  const attempt = el("path-attempt");
  if (attempt) attempt.textContent = `Tentativa ${session.attempt}`;
  const progress = el("path-progress");
  if (progress) progress.textContent = `Termo ${session.index + 1} de ${total}`;
  const fill = el("path-progress-fill");
  if (fill) fill.style.width = `${Math.round((session.index / total) * 100)}%`;

  const prompt = el("path-prompt");
  if (prompt) {
    prompt.textContent = getTerm(item);
    const isLong = String(getTerm(item)).length > 22;
    prompt.className = `exercise-prompt__text ${langTextClass()}${isLong ? " is-long" : ""}`;
  }
  const hint = el("path-hint");
  if (hint) {
    hint.textContent = item.transliteration || "Sem transliteração para este item";
    hint.classList.add("hidden");
  }
  show("path-btn-hint", true);

  const restartNote = el("path-restart-note");
  if (restartNote) {
    restartNote.textContent = notice || "";
    restartNote.classList.toggle("hidden", !notice);
  }

  show("path-feedback", false);
  const input = el("path-input");
  if (input) {
    input.value = "";
    input.disabled = false;
    setTimeout(() => {
      if (typeof input.focus === "function") input.focus();
    }, 50);
  }
  const submitBtn = el("path-btn-submit");
  if (submitBtn) submitBtn.disabled = false;
}

function togglePathHint() {
  const hint = el("path-hint");
  if (hint) hint.classList.toggle("hidden");
  const btn = el("path-btn-hint");
  if (btn) btn.classList.toggle("hidden");
}

function submitMasteryPathAnswer(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  if (!session) return;
  if (session.answered) {
    continueMasteryPath();
    return;
  }
  const input = el("path-input");
  const userAnswer = input ? input.value : "";
  const item = session.queue[session.index];
  const result = answerSession(session, userAnswer);
  if (!result) return;

  if (input) input.disabled = true;
  const submitBtn = el("path-btn-submit");
  if (submitBtn) submitBtn.disabled = true;

  const banner = show("path-feedback", true);
  const icon = el("path-feedback-icon");
  const titleEl = el("path-feedback-title");
  const detail = el("path-feedback-detail");
  const nextBtn = el("path-btn-next");
  const accepted = (item.translations || []).join('" / "');
  const isLast = session.index === session.queue.length - 1;

  if (banner) banner.className = `path-feedback is-${result.status}`;
  if (result.status === "correct") {
    if (icon) icon.textContent = "✅";
    if (titleEl) titleEl.textContent = "Correto!";
    if (detail) detail.textContent = `Tradução esperada: "${accepted}"`;
    if (nextBtn) nextBtn.textContent = isLast ? "Concluir capítulo ➔" : "Próximo termo ➔";
  } else if (result.status === "typo") {
    if (icon) icon.textContent = "⚠️";
    if (titleEl) titleEl.textContent = "Aceito, com erro de digitação";
    if (detail) detail.textContent = `O ideal é: "${result.expected}". (Você digitou: "${userAnswer}")`;
    if (nextBtn) nextBtn.textContent = isLast ? "Concluir capítulo ➔" : "Próximo termo ➔";
  } else {
    if (icon) icon.textContent = "❌";
    if (titleEl) titleEl.textContent = "Incorreto: o capítulo recomeça";
    if (detail) detail.textContent = `Traduções aceitas: "${accepted}" (Você respondeu: "${userAnswer || "em branco"}")`;
    if (nextBtn) nextBtn.textContent = "Recomeçar o capítulo ➔";
  }
  if (nextBtn) setTimeout(() => nextBtn.focus && nextBtn.focus(), 50);
}

function continueMasteryPath() {
  if (!session) return;
  const outcome = advanceSession(session);
  if (outcome === "restart") {
    renderPathQuestion(`Tentativa ${session.attempt}: os termos foram embaralhados. Acerte todos para avançar.`);
  } else if (outcome === "next") {
    renderPathQuestion();
  } else if (outcome === "completed") {
    showPathComplete();
  }
}

function showPathComplete() {
  const finished = session.chapter;
  const attempts = session.attempt;
  const next = markCompleted(AppState.language, AppState.chapters, finished.id);
  updatePathDashboardStat();
  show("path-active", false);
  show("path-complete", true);
  const title = el("path-complete-title");
  if (title) title.textContent = `${finished.title} dominado!`;
  const note = el("path-complete-note");
  if (note) {
    note.textContent = `Você acertou os ${session.queue.length} termos ${attempts === 1 ? "de primeira" : `na tentativa ${attempts}`}.` +
      (next ? ` Próximo capítulo liberado: ${next.title}.` : " Você concluiu todo o caminho!");
  }
  const nextBtn = el("path-btn-next-chapter");
  if (nextBtn) {
    nextBtn.classList.toggle("hidden", !next);
    nextBtn.onclick = next ? () => startMasteryPathChapter(next.id) : null;
    if (next) setTimeout(() => nextBtn.focus && nextBtn.focus(), 50);
  }
  session = null;
}

/** Sai do capítulo atual (o progresso da tentativa é perdido) */
function exitMasteryPathChapter() {
  if (session && session.index > 0 && typeof window !== "undefined" && typeof window.confirm === "function") {
    if (!window.confirm("Sair do capítulo agora? Esta tentativa será perdida.")) return;
  }
  openMasteryPath();
}

function isMasteryPathActive() {
  const active = el("path-active");
  return !!(session && session.index > 0 && active && !active.classList.contains("hidden"));
}

function resetMasteryPathView() {
  session = null;
  show("path-overview", false);
  show("path-active", false);
  show("path-complete", false);
  updatePathDashboardStat();
}

const api = {
  getPathChapters,
  getChapterTerms,
  getPathStatus,
  loadCompleted,
  saveCompleted,
  mergeCompleted,
  createSession,
  answerSession,
  advanceSession,
  markCompleted,
  openMasteryPath,
  renderPathOverview,
  startMasteryPathChapter,
  submitMasteryPathAnswer,
  continueMasteryPath,
  togglePathHint,
  exitMasteryPathChapter,
  isMasteryPathActive,
  resetMasteryPathView,
  updatePathDashboardStat,
  getSession: () => session,
};

if (typeof window !== "undefined") {
  window.MasteryPathModule = api;
  window.openMasteryPath = openMasteryPath;
  window.startMasteryPathChapter = startMasteryPathChapter;
  window.submitMasteryPathAnswer = submitMasteryPathAnswer;
  window.continueMasteryPath = continueMasteryPath;
  window.togglePathHint = togglePathHint;
  window.exitMasteryPathChapter = exitMasteryPathChapter;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
})();
