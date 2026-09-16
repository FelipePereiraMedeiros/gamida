/**
 * ==========================================================================
 * Gamida - Motor de Avaliação Cumulativa & Simulados Diagnósticos
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof window !== "undefined" && window.AppState) ? window : (typeof require !== "undefined" ? require("./state.js") : {});
const _evalModule = (typeof window !== "undefined" && window.evaluateAnswer) ? window : (typeof require !== "undefined" ? require("./evaluation.js") : {});
const _srsModule = (typeof window !== "undefined" && window.recordSRSError) ? window : (typeof require !== "undefined" ? require("./srs.js") : {});

const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const SimConfig = (typeof window !== "undefined" && window.SimConfig) || _stateModule.SimConfig;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const escapeHTML = (typeof window !== "undefined" && window.escapeHTML) || _evalModule.escapeHTML;
const evaluateAnswer = (typeof window !== "undefined" && window.evaluateAnswer) || _evalModule.evaluateAnswer;
const recordSRSError = (typeof window !== "undefined" && window.recordSRSError) || _srsModule.recordSRSError;

let assessQuestions = [];
let assessIndex = 0;
let assessAnswersMap = {};
let assessTimerInterval = null;
let assessTimeCount = 0;

/**
 * Restaura o painel inicial do simulado
 */
function resetToDashboard() {
  if (typeof document === "undefined") return;
  if (assessTimerInterval) clearInterval(assessTimerInterval);
  document.getElementById("assess-dashboard").classList.remove("hidden");
  document.getElementById("assess-config").classList.add("hidden");
  document.getElementById("assessment-active").classList.add("hidden");
  document.getElementById("assessment-results").classList.add("hidden");
  document.getElementById("anki-active").classList.add("hidden");
  document.getElementById("anki-results").classList.add("hidden");
  document.getElementById("survival-active").classList.add("hidden");
  document.getElementById("survival-results").classList.add("hidden");
}

/**
 * Abre o modal de configuração de parâmetros do simulado
 */
function openSimuladoConfig() {
  if (typeof document === "undefined") return;
  const activeChapterId = AppState.currentChapter?.id;
  if (!activeChapterId) {
    alert("Nenhum capítulo ativo para gerar o simulado.");
    return;
  }
  const activeIdx = AppState.chapters.findIndex(
    (c) => c.id === activeChapterId,
  );
  const cumulativeCount =
    activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length;

  document.getElementById("sim-scope-info").textContent =
    `Questões acumuladas das Lições 1 até a ${cumulativeCount} (${AppState.currentChapter.title}).`;

  const hasSentences = AppState.chapters
    .slice(0, cumulativeCount)
    .some((c) => (c.sentences || []).length > 0);
  const btnSentences = document.getElementById("cfg-focus-sentences");
  if (btnSentences) {
    if (!hasSentences) {
      btnSentences.classList.add("hidden");
      if (SimConfig.focus === "sentences") {
        setSimConfig("focus", "words");
      }
    } else {
      btnSentences.classList.remove("hidden");
    }
  }

  document.getElementById("assess-dashboard").classList.add("hidden");
  document.getElementById("assess-config").classList.remove("hidden");
}

/**
 * Fecha a configuração do simulado e retorna ao painel principal
 */
function closeSimuladoConfig() {
  resetToDashboard();
}

/**
 * Altera um parâmetro de configuração do simulado e atualiza estilos dos botões
 * @param {'amount'|'time'|'focus'} type
 * @param {*} value
 */
function setSimConfig(type, value) {
  SimConfig[type] = value;
  if (typeof document === "undefined") return;
  document.querySelectorAll(`.cfg-${type}`).forEach((btn) => {
    btn.className =
      "cfg-btn cfg-" +
      type +
      " bg-slate-800 text-slate-300 font-bold py-2 rounded-xl hover:bg-slate-700";
  });
  const selectedBtn = document.getElementById(`cfg-${type}-${value}`);
  if (selectedBtn) {
    selectedBtn.className =
      "cfg-btn cfg-" +
      type +
      " bg-brand-600 text-white font-bold py-2 rounded-xl";
  }
}

/**
 * Inicia o simulado cumulativo selecionando e equilibrando o banco de questões
 */
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

  let currentChapWords = [], otherChapWords = [];
  let currentChapSentences = [], otherChapSentences = [];

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
  const totalAmount =
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
    const targetCurrent = Math.min(
      Math.round(targetCount * 0.5),
      currentPool.length,
    );
    selected.push(
      ...shuffleArray([...currentPool]).slice(0, targetCurrent),
    );
    const remaining = targetCount - selected.length;
    selected.push(
      ...shuffleArray([...otherPool]).slice(0, remaining),
    );
    if (selected.length < targetCount) {
      const combined = shuffleArray(
        [...currentPool, ...otherPool].filter(
          (i) => !selected.some((s) => getTerm(s) === getTerm(i)),
        ),
      );
      selected.push(...combined.slice(0, targetCount - selected.length));
    }
    return selected;
  }

  const finalPool = [
    ...pickItems(targetWords, currentChapWords, otherChapWords),
    ...pickItems(
      targetSentences,
      currentChapSentences,
      otherChapSentences,
    ),
  ];
  assessQuestions = shuffleArray(finalPool);
  assessIndex = 0;
  assessAnswersMap = {};

  if (assessQuestions.length === 0) {
    alert("Não há conteúdo suficiente neste capítulo para gerar o simulado.");
    return;
  }

  if (typeof document !== "undefined") {
    document.getElementById("assess-config").classList.add("hidden");
    document.getElementById("assessment-active").classList.remove("hidden");
    document.getElementById("assessment-timer-icon").textContent =
      SimConfig.time > 0 ? "⏳" : "⏱️";
  }

  assessTimeCount = SimConfig.time > 0 ? SimConfig.time * 60 : 0;

  startAssessmentTimer();
  initAssessmentTracker();
  renderAssessmentQuestion();
}

/**
 * Inicializa o cronômetro do simulado (progressivo ou regressivo)
 */
function startAssessmentTimer() {
  if (assessTimerInterval) clearInterval(assessTimerInterval);
  const isCountdown = SimConfig.time > 0;

  assessTimerInterval = setInterval(() => {
    if (isCountdown) {
      assessTimeCount--;
      if (assessTimeCount <= 0) {
        clearInterval(assessTimerInterval);
        alert("O tempo do simulado expirou!");
        finishAssessment();
        return;
      }
    } else {
      assessTimeCount++;
    }

    if (typeof document !== "undefined") {
      const timerEl = document.getElementById("assessment-timer");
      if (timerEl) {
        const mins = Math.floor(assessTimeCount / 60)
          .toString()
          .padStart(2, "0");
        const secs = (assessTimeCount % 60).toString().padStart(2, "0");
        timerEl.textContent = `${mins}:${secs}`;
      }
    }
  }, 1000);
}

/**
 * Salva o rascunho de resposta da questão atual
 */
function saveCurrentInputDraft() {
  if (typeof document === "undefined") return;
  const input = document.getElementById("assess-user-input");
  if (input) {
    assessAnswersMap[assessIndex] = input.value;
    updateTrackerPillState(assessIndex);
  }
}

/**
 * Renderiza a questão ativa do simulado
 */
function renderAssessmentQuestion() {
  if (assessQuestions.length === 0 || typeof document === "undefined") return;
  const q = assessQuestions[assessIndex];

  document.getElementById("assessment-counter").textContent =
    `Questão ${assessIndex + 1} de ${assessQuestions.length}`;
  document.getElementById("assessment-type-tag").textContent =
    q.kind === "word" ? "Palavra" : "Frase";

  const promptEl = document.getElementById("assess-hebrew");
  promptEl.textContent = getTerm(q);
  promptEl.className = `${AppState.language === "hebrew" ? "hebrew-text" : "greek-text"} text-4xl md:text-6xl font-bold text-white tracking-wide`;

  const input = document.getElementById("assess-user-input");
  input.value = assessAnswersMap[assessIndex] || "";
  setTimeout(() => input.focus(), 50);

  const prevBtn = document.getElementById("assess-btn-prev");
  prevBtn.disabled = assessIndex === 0;
  prevBtn.className =
    assessIndex === 0
      ? "text-xs font-medium text-slate-600 px-4 py-2 cursor-not-allowed"
      : "text-xs font-medium text-slate-400 hover:text-slate-100 px-4 py-2 transition";

  const actionContainer = document.getElementById("assess-action-container");
  if (assessIndex === assessQuestions.length - 1) {
    actionContainer.innerHTML = `<button type="button" onclick="confirmFinishAssessmentPrompt()" class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30">🏁 Submeter Prova</button>`;
  } else {
    actionContainer.innerHTML = `<button type="button" onclick="navigateAssessment(1)" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-brand-600/30">Próxima ➔</button>`;
  }

  updateAllTrackerPills();
}

/**
 * Navega entre questões do simulado
 * @param {number} direction (-1 ou 1)
 */
function navigateAssessment(direction) {
  saveCurrentInputDraft();
  const nextIdx = assessIndex + direction;
  if (nextIdx >= 0 && nextIdx < assessQuestions.length) {
    assessIndex = nextIdx;
    renderAssessmentQuestion();
  }
}

/**
 * Salta diretamente para uma questão informada pelo índice
 * @param {number} idx
 */
function jumpToAssessmentQuestion(idx) {
  saveCurrentInputDraft();
  assessIndex = idx;
  renderAssessmentQuestion();
}

/**
 * Inicializa os botões/pílulas de navegação rápida do simulado
 */
function initAssessmentTracker() {
  if (typeof document === "undefined") return;
  const trackerEl = document.getElementById("assessment-tracker");
  trackerEl.innerHTML = "";
  assessQuestions.forEach((_, idx) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.id = `tracker-pill-${idx}`;
    pill.textContent = idx + 1;
    pill.onclick = () => jumpToAssessmentQuestion(idx);
    trackerEl.appendChild(pill);
  });
  updateAllTrackerPills();
}

function updateAllTrackerPills() {
  assessQuestions.forEach((_, idx) => updateTrackerPillState(idx));
}

function updateTrackerPillState(idx) {
  if (typeof document === "undefined") return;
  const pill = document.getElementById(`tracker-pill-${idx}`);
  if (!pill) return;
  const isCurrent = idx === assessIndex;
  const hasAnswered = !!(
    assessAnswersMap[idx] && assessAnswersMap[idx].trim()
  );

  let baseClass =
    "w-7 h-7 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center border ";
  if (isCurrent) {
    baseClass +=
      "bg-brand-600 text-white border-brand-400 ring-2 ring-brand-500/40 shadow-md";
  } else if (hasAnswered) {
    baseClass +=
      "bg-slate-800 text-emerald-400 border-emerald-600/50 hover:bg-slate-700";
  } else {
    baseClass +=
      "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300";
  }
  pill.className = baseClass;
}

/**
 * Exibe confirmação antes de finalizar a prova
 */
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

/**
 * Submete a prova, calcula notas, diagnóstico por capítulo e gera gabarito
 */
function finishAssessment() {
  if (typeof document === "undefined") return;
  if (assessTimerInterval) clearInterval(assessTimerInterval);
  document.getElementById("assessment-active").classList.add("hidden");
  document.getElementById("assessment-results").classList.remove("hidden");

  const evaluated = assessQuestions.map((q, idx) => {
    const rawVal = (assessAnswersMap[idx] || "").trim();
    const userVal = rawVal || "(Em branco)";
    return {
      question: q,
      userAnswer: userVal,
      evalResult: evaluateAnswer(rawVal, q.translations),
    };
  });

  const totalQ = assessQuestions.length;
  const correctQ = evaluated.filter(
    (a) => a.evalResult.status !== "incorrect",
  ).length;

  let timeSecs = 0;
  if (SimConfig.time > 0) {
    timeSecs = SimConfig.time * 60 - assessTimeCount;
  } else {
    timeSecs = assessTimeCount;
  }

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
    if (!chapterErrors[cid]) {
      chapterErrors[cid] = {
        title: ans.question.chapterTitle,
        total: 0,
        errors: 0,
      };
    }
    chapterErrors[cid].total++;

    if (ans.evalResult.status === "incorrect") {
      chapterErrors[cid].errors++;
      recordSRSError(getTerm(ans.question));
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
      div.innerHTML = `<div><div class="font-semibold text-white text-sm">${escapeHTML(ch.title)}</div><div class="text-slate-400 mt-0.5">${ch.errors} erro(s) em ${ch.total} questão(ões)</div></div><span class="px-3 py-1 rounded-full font-medium border ${badge}">${status} (${rate}%)</span>`;
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
            <div class="${textClass} text-2xl text-white font-bold py-1">${escapeHTML(getTerm(ans.question))}</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Sua Resposta:</span>
                <span class="${userTextCol} font-medium">${escapeHTML(ans.userAnswer)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tradução Esperada:</span>
                <span class="text-emerald-400 font-medium">${escapeHTML(ans.evalResult.expected || ans.question.translations.join(" / "))}</span>
              </div>
            </div>`;
    correctionList.appendChild(box);
  });
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.resetToDashboard = resetToDashboard;
  window.openSimuladoConfig = openSimuladoConfig;
  window.closeSimuladoConfig = closeSimuladoConfig;
  window.setSimConfig = setSimConfig;
  window.startSimulado = startSimulado;
  window.startAssessmentTimer = startAssessmentTimer;
  window.saveCurrentInputDraft = saveCurrentInputDraft;
  window.renderAssessmentQuestion = renderAssessmentQuestion;
  window.navigateAssessment = navigateAssessment;
  window.jumpToAssessmentQuestion = jumpToAssessmentQuestion;
  window.initAssessmentTracker = initAssessmentTracker;
  window.updateAllTrackerPills = updateAllTrackerPills;
  window.updateTrackerPillState = updateTrackerPillState;
  window.confirmFinishAssessmentPrompt = confirmFinishAssessmentPrompt;
  window.finishAssessment = finishAssessment;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    resetToDashboard,
    openSimuladoConfig,
    closeSimuladoConfig,
    setSimConfig,
    startSimulado,
    startAssessmentTimer,
    saveCurrentInputDraft,
    renderAssessmentQuestion,
    navigateAssessment,
    jumpToAssessmentQuestion,
    initAssessmentTracker,
    updateAllTrackerPills,
    updateTrackerPillState,
    confirmFinishAssessmentPrompt,
    finishAssessment,
  };
}
})();
