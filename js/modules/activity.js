/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Constância de Estudo (dias seguidos e meta diária)
 * ==========================================================================
 * Conta as respostas dadas por dia, em qualquer exercício e nos dois idiomas.
 * A constância vale mais que sessões longas: o painel mostra os dias seguidos
 * de estudo e quanto falta para a meta de hoje.
 */

(function () {
const STORAGE_KEY = "gamida_activity";
const GOAL_KEY = "gamida_daily_goal";
// Respostas por dia para a meta contar como cumprida, até o aluno definir a própria
const DAILY_GOAL = 20;
const MIN_GOAL = 1;
const MAX_GOAL = 500;
// Dias guardados: o bastante para a sequência, sem crescer para sempre
const MAX_DAYS_KEPT = 400;

/**
 * Data local no formato AAAA-MM-DD (o dia vira à meia-noite do aluno, não em UTC)
 * @param {Date|number} [when]
 * @returns {string}
 */
function dayKey(when = new Date()) {
  const d = when instanceof Date ? when : new Date(when);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function previousDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

/** Aceita só pares data → contagem positiva; qualquer outra coisa é descartada */
function sanitizeDays(raw) {
  const days = {};
  if (!raw || typeof raw !== "object") return days;
  Object.entries(raw).forEach(([key, count]) => {
    const n = Math.floor(Number(count));
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(n) && n > 0) days[key] = n;
  });
  return days;
}

/**
 * Converte um valor qualquer numa meta válida; devolve null se não for um número utilizável
 * @param {*} value
 * @returns {number|null}
 */
function parseGoal(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return null;
  return Math.min(MAX_GOAL, Math.max(MIN_GOAL, n));
}

/** Meta diária do aluno, ou a padrão enquanto ele não definir a sua */
function getDailyGoal() {
  if (typeof localStorage === "undefined") return DAILY_GOAL;
  try {
    return parseGoal(localStorage.getItem(GOAL_KEY)) || DAILY_GOAL;
  } catch (_) {
    return DAILY_GOAL;
  }
}

/**
 * Define a meta diária de respostas
 * @param {*} value
 * @returns {number|null} a meta gravada (ajustada aos limites) ou null se o valor for inválido
 */
function setDailyGoal(value) {
  const goal = parseGoal(value);
  if (goal === null) return null;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(GOAL_KEY, String(goal));
    } catch (err) {
      console.warn("Aviso ao salvar a meta diária no localStorage:", err);
    }
  }
  updateActivityUI();
  return goal;
}

/**
 * Adota a meta de um backup só quando o aluno ainda não definiu uma neste aparelho
 * @param {*} value
 */
function adoptDailyGoal(value) {
  if (typeof localStorage === "undefined") return;
  try {
    if (parseGoal(localStorage.getItem(GOAL_KEY)) === null) setDailyGoal(value);
  } catch (_) {}
}

function loadDays() {
  if (typeof localStorage === "undefined") return {};
  try {
    return sanitizeDays(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch (_) {
    return {};
  }
}

function saveDays(days) {
  if (typeof localStorage === "undefined") return;
  const kept = {};
  Object.keys(days).sort().slice(-MAX_DAYS_KEPT).forEach((key) => { kept[key] = days[key]; });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch (err) {
    console.warn("Aviso ao salvar a constância de estudo no localStorage:", err);
  }
}

/**
 * Resume a constância a partir do registro diário
 * @param {Object<string, number>} days
 * @param {Date|number} [now]
 * @param {number} [goal] meta diária de respostas
 * @returns {{today: number, goal: number, goalMet: boolean, streak: number, studiedToday: boolean, best: number}}
 *   streak: dias seguidos de estudo; ontem ainda sustenta a sequência até o fim de hoje
 */
function summarize(days, now = new Date(), goal = DAILY_GOAL) {
  const dailyGoal = parseGoal(goal) || DAILY_GOAL;
  const safeDays = sanitizeDays(days);
  const todayKey = dayKey(now);
  const today = safeDays[todayKey] || 0;

  let streak = 0;
  let cursor = today > 0 ? todayKey : previousDayKey(todayKey);
  while (safeDays[cursor] > 0) {
    streak++;
    cursor = previousDayKey(cursor);
  }

  let best = 0;
  let run = 0;
  let previous = null;
  Object.keys(safeDays).sort().forEach((key) => {
    run = previous && previousDayKey(key) === previous ? run + 1 : 1;
    if (run > best) best = run;
    previous = key;
  });

  return { today, goal: dailyGoal, goalMet: today >= dailyGoal, streak, studiedToday: today > 0, best };
}

function getActivitySummary(now = new Date()) {
  return summarize(loadDays(), now, getDailyGoal());
}

/**
 * Soma respostas ao dia de hoje e atualiza o painel
 * @param {number} [count]
 * @returns {{today: number, goal: number, goalMet: boolean, streak: number, studiedToday: boolean, best: number}}
 */
function recordActivity(count = 1) {
  const n = Math.floor(Number(count));
  const days = loadDays();
  if (Number.isFinite(n) && n > 0) {
    const key = dayKey();
    days[key] = (days[key] || 0) + n;
    saveDays(days);
  }
  updateActivityUI();
  return summarize(days, new Date(), getDailyGoal());
}

/**
 * Une o registro de um backup ao local: em cada dia vale a maior contagem,
 * para importar o mesmo backup duas vezes não dobrar o estudo
 * @param {Object<string, number>} incoming
 */
function mergeActivity(incoming) {
  const days = loadDays();
  Object.entries(sanitizeDays(incoming)).forEach(([key, count]) => {
    days[key] = Math.max(days[key] || 0, count);
  });
  saveDays(days);
  updateActivityUI();
}

function exportActivity() {
  return loadDays();
}

function updateActivityUI() {
  if (typeof document === "undefined") return;
  const valueEl = document.getElementById("stat-days");
  const boxEl = document.getElementById("stat-days-box");
  if (!valueEl) return;
  const { today, goal, goalMet, streak, studiedToday, best } = getActivitySummary();
  valueEl.textContent = String(streak);
  if (!boxEl) return;
  boxEl.classList.toggle("is-goal-met", goalMet);
  boxEl.classList.toggle("is-at-risk", streak > 0 && !studiedToday);
  const dayWord = (n) => (n === 1 ? "1 dia seguido" : `${n} dias seguidos`);
  const todayLine = goalMet
    ? `Meta de hoje cumprida: ${today} respostas.`
    : `Hoje: ${today} de ${goal} respostas da meta diária.`;
  const streakLine = streak === 0
    ? "Responda a uma questão para começar uma sequência."
    : studiedToday
      ? `${dayWord(streak)} de estudo.`
      : `${dayWord(streak)} de estudo. Estude hoje para não perder a sequência.`;
  boxEl.title = `${streakLine} ${todayLine}${best > streak ? ` Recorde: ${dayWord(best)}.` : ""} Clique para ajustar a meta.`;

  // Painel "Meta de estudo" em Gerenciar
  const progressEl = document.getElementById("goal-progress-text");
  if (progressEl) {
    const recordNote = best > streak ? ` Recorde: ${dayWord(best)}.` : "";
    progressEl.textContent = `${todayLine} ${streakLine}${recordNote}`;
  }
  const fillEl = document.getElementById("goal-progress-fill");
  if (fillEl) fillEl.style.width = `${Math.min(100, Math.round((today / goal) * 100))}%`;
  const barEl = document.getElementById("goal-progress-bar");
  if (barEl) {
    barEl.classList.toggle("is-goal-met", goalMet);
    barEl.setAttribute("aria-valuenow", String(Math.min(today, goal)));
    barEl.setAttribute("aria-valuemax", String(goal));
  }
  const inputEl = document.getElementById("daily-goal-input");
  if (inputEl && document.activeElement !== inputEl) inputEl.value = String(goal);
}

/** Lê o campo da meta em Gerenciar, grava e confirma ao aluno */
function saveDailyGoalFromInput(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  if (typeof document === "undefined") return;
  const inputEl = document.getElementById("daily-goal-input");
  const statusEl = document.getElementById("daily-goal-status");
  if (!inputEl) return;
  const goal = setDailyGoal(inputEl.value);
  if (statusEl) {
    statusEl.classList.toggle("text-rose-400", goal === null);
    statusEl.classList.toggle("text-emerald-400", goal !== null);
  }
  if (goal === null) {
    if (statusEl) statusEl.textContent = `Informe um número de ${MIN_GOAL} a ${MAX_GOAL}.`;
    return;
  }
  inputEl.value = String(goal);
  if (statusEl) statusEl.textContent = `Meta salva: ${goal === 1 ? "1 resposta" : `${goal} respostas`} por dia.`;
}

/** Leva o aluno ao ajuste da meta a partir do indicador "Dias seguidos" */
function openDailyGoalSettings() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof window.switchTab === "function") window.switchTab("manage");
  const inputEl = document.getElementById("daily-goal-input");
  if (!inputEl) return;
  if (typeof inputEl.scrollIntoView === "function") inputEl.scrollIntoView({ block: "center" });
  inputEl.focus();
  inputEl.select();
}

const api = {
  DAILY_GOAL,
  MIN_GOAL,
  MAX_GOAL,
  parseGoal,
  getDailyGoal,
  setDailyGoal,
  adoptDailyGoal,
  saveDailyGoalFromInput,
  openDailyGoalSettings,
  dayKey,
  summarize,
  getActivitySummary,
  recordActivity,
  mergeActivity,
  exportActivity,
  updateActivityUI,
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ActivityModule = api;
  window.recordActivity = recordActivity;
  window.saveDailyGoalFromInput = saveDailyGoalFromInput;
  window.openDailyGoalSettings = openDailyGoalSettings;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
})();
