/**
 * ==========================================================================
 * Gamida - Motor do Modo Sobrevivência (Morte Súbita)
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof require !== "undefined") ? require("./state.js") : (typeof window !== "undefined" ? window : {});
const _evalModule = (typeof require !== "undefined") ? require("./evaluation.js") : (typeof window !== "undefined" ? window : {});
const _srsModule = (typeof require !== "undefined") ? require("./srs.js") : (typeof window !== "undefined" ? window : {});

const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const evaluateAnswer = (typeof window !== "undefined" && window.evaluateAnswer) || _evalModule.evaluateAnswer;
const recordSRSError = (typeof window !== "undefined" && window.recordSRSError) || _srsModule.recordSRSError;
const isAlphabetChapter = (typeof window !== "undefined" && window.isAlphabetChapter) || _stateModule.isAlphabetChapter;

let survLives = 3;
let survStreak = 0;
let survMaxStreak = 0;
let survQueue = [];
let survCurrent = null;

/**
 * Lê o recorde de sobrevivência do localStorage para o idioma atual
 * @returns {number}
 */
function loadSurvivalHighScore() {
  if (typeof localStorage === "undefined") return AppState.survivalHighScore || 0;
  try {
    const high = localStorage.getItem(`gamida_${AppState.language}_survival_high`);
    const parsedHigh = high ? parseInt(high, 10) : 0;
    if (Number.isFinite(parsedHigh) && parsedHigh > (AppState.survivalHighScore || 0)) {
      AppState.survivalHighScore = parsedHigh;
    }
  } catch (err) {
    console.warn("Aviso ao ler recorde de sobrevivência do localStorage:", err);
  }
  return AppState.survivalHighScore || 0;
}

/**
 * Persiste o recorde de sobrevivência no localStorage
 */
function saveSurvivalHighScore() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      `gamida_${AppState.language}_survival_high`,
      AppState.survivalHighScore || 0,
    );
  } catch (err) {
    console.warn("Aviso ao salvar recorde de sobrevivência no localStorage:", err);
  }
}

/**
 * Atualiza indicadores de recorde na interface (dashboard e barra superior)
 */
function updateSurvivalDashboardRecord() {
  if (typeof document === "undefined") return;
  const cardHigh = document.getElementById("surv-card-high");
  if (cardHigh) {
    cardHigh.textContent = AppState.survivalHighScore || 0;
  }
  const topHigh = document.getElementById("survival-top-high");
  if (topHigh) {
    topHigh.textContent = AppState.survivalHighScore || 0;
  }
}

const safeToggle = (typeof window !== "undefined" && window.safeToggle) || _stateModule.safeToggle || function safeToggle(id, isVisible) {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(id);
  if (!el) return null;
  if (isVisible) el.classList.remove("hidden"); else el.classList.add("hidden");
  return el;
};

const safeAlert = (typeof window !== "undefined" && window.safeAlert) || _stateModule.safeAlert || function safeAlert(msg) {
  if (typeof window !== "undefined" && typeof window.alert === "function") window.alert(msg);
  else if (typeof alert === "function") alert(msg);
  else console.warn("[Gamida Alert]:", msg);
};

/**
 * Inicia o desafio de sobrevivência com vocabulário cumulativo até o capítulo ativo
 */
function startSurvival() {
  loadSurvivalHighScore();
  updateSurvivalDashboardRecord();

  const activeChapterId = AppState.currentChapter?.id || AppState.activeChapterId;
  if (!activeChapterId) {
    safeAlert("Não há capítulos disponíveis para iniciar o modo de sobrevivência.");
    return;
  }
  if (!AppState.currentChapter && activeChapterId && Array.isArray(AppState.chapters)) {
    AppState.currentChapter = AppState.chapters.find((c) => c.id === activeChapterId) || null;
  }
  const activeIdx = AppState.chapters.findIndex(
    (c) => c.id === activeChapterId,
  );
  let cumulativeChapters = AppState.chapters.slice(
    0,
    activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
  );
  if (activeIdx > 0) {
    cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
  }

  let allWords = [];
  cumulativeChapters.forEach((chap) => {
    (chap.items || []).forEach((i) => allWords.push(i));
  });

  allWords = Array.from(
    new Map(allWords.map((w) => [getTerm(w), w])).values(),
  );

  if (allWords.length === 0) {
    safeAlert("Não há palavras suficientes acumuladas para iniciar o Morte Súbita.");
    return;
  }

  survQueue = shuffleArray([...allWords]);
  survLives = 3;
  survStreak = 0;
  survMaxStreak = 0;

  if (typeof document !== "undefined") {
    safeToggle("assess-dashboard", false);
    safeToggle("survival-active", true);
    safeToggle("survival-results", false);
    safeToggle("surv-correction-box", false);
  }

  updateSurvivalUI();
  nextSurvivalQuestion();
}

/**
 * Atualiza o contador de corações e sequência na UI
 */
function updateSurvivalUI() {
  if (typeof document === "undefined") return;
  const streakEl = document.getElementById("survival-streak");
  const heartsEl = document.getElementById("survival-hearts");
  const topHighEl = document.getElementById("survival-top-high");
  if (streakEl) streakEl.textContent = survStreak;
  if (heartsEl) {
    heartsEl.textContent = "❤️".repeat(Math.max(0, survLives)) + "🖤".repeat(Math.max(0, 3 - survLives));
  }
  if (topHighEl) {
    topHighEl.textContent = AppState.survivalHighScore || 0;
  }
}

/**
 * Avança para a próxima palavra na fila de sobrevivência
 */
function nextSurvivalQuestion() {
  if (survQueue.length === 0) {
    const activeIdx = AppState.chapters.findIndex(
      (c) => c.id === AppState.currentChapter?.id,
    );
    let cumulativeChapters = AppState.chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
    );
    if (activeIdx > 0) {
      cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
    }
    let refill = [];
    cumulativeChapters.forEach((chap) =>
      (chap.items || []).forEach((i) => refill.push(i)),
    );
    survQueue = shuffleArray(
      Array.from(
        new Map(refill.map((w) => [getTerm(w), w])).values(),
      ),
    );
  }

  survCurrent = survQueue.pop();

  if (typeof document === "undefined") return;
  const hebPrompt = document.getElementById("survival-hebrew");
  const input = document.getElementById("survival-input");

  if (hebPrompt) {
    hebPrompt.textContent = getTerm(survCurrent);
    hebPrompt.className = `${AppState.language === "hebrew" ? "hebrew-text" : "greek-text"} text-5xl md:text-7xl font-bold text-white tracking-wide`;
  }
  if (input) {
    input.value = "";
    input.disabled = false;
    setTimeout(() => {
      if (input && typeof input.focus === "function") input.focus();
    }, 50);
  }
}

/**
 * Avalia a resposta submetida no modo sobrevivência
 */
function submitSurvivalAnswer() {
  if (typeof document === "undefined") return;
  const input = document.getElementById("survival-input");
  if (!input || input.disabled || !survCurrent) return;

  const evalResult = evaluateAnswer(
    input.value,
    survCurrent.translations,
  );
  const flash = document.getElementById("survival-flash");

  if (evalResult.status === "correct" || evalResult.status === "typo") {
    survStreak++;
    if (survStreak > survMaxStreak) {
      survMaxStreak = survStreak;
    }
    if (survStreak > (AppState.survivalHighScore || 0)) {
      AppState.survivalHighScore = survStreak;
      saveSurvivalHighScore();
      updateSurvivalDashboardRecord();
    }
    updateSurvivalUI();

    if (flash) {
      if (evalResult.status === "typo") {
        flash.className =
          "absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none bg-amber-500/20 opacity-100";
      } else {
        flash.className =
          "absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none bg-emerald-500/20 opacity-100";
      }
      setTimeout(() => {
        if (flash && flash.classList) {
          flash.classList.remove("opacity-100");
          flash.classList.add("opacity-0");
        }
      }, 300);
    }

    nextSurvivalQuestion();
  } else {
    if (survStreak > survMaxStreak) {
      survMaxStreak = survStreak;
    }
    survLives--;
    survStreak = 0;
    updateSurvivalUI();
    recordSRSError(getTerm(survCurrent));

    const lastHeb = document.getElementById("surv-last-heb");
    if (lastHeb) lastHeb.textContent = getTerm(survCurrent);
    const lastCor = document.getElementById("surv-last-cor");
    if (lastCor) lastCor.textContent = survCurrent.translations.join(" / ");
    safeToggle("surv-correction-box", true);

    if (flash) {
      flash.className =
        "absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none bg-rose-500/30 opacity-100";
      setTimeout(() => {
        if (flash && flash.classList) {
          flash.classList.remove("opacity-100");
          flash.classList.add("opacity-0");
        }
      }, 300);
    }

    if (survLives <= 0) {
      input.disabled = true;
      setTimeout(() => finishSurvival(false), 600);
    } else {
      nextSurvivalQuestion();
    }
  }
}

/**
 * Encerra a partida de sobrevivência e atualiza recorde se superado
 * @param {boolean} surrendered
 */
function finishSurvival(surrendered = false) {
  if (typeof document === "undefined") return;
  safeToggle("survival-active", false);
  safeToggle("survival-results", true);

  const sessionScore = Math.max(survMaxStreak, survStreak);

  if (sessionScore > (AppState.survivalHighScore || 0)) {
    AppState.survivalHighScore = sessionScore;
    saveSurvivalHighScore();
  } else if (!AppState.survivalHighScore) {
    loadSurvivalHighScore();
  }

  const resStreak = document.getElementById("surv-res-streak");
  if (resStreak) resStreak.textContent = sessionScore;
  const resHigh = document.getElementById("surv-res-high");
  if (resHigh) resHigh.textContent = AppState.survivalHighScore || 0;

  updateSurvivalDashboardRecord();

  if (surrendered) {
    safeToggle("surv-correction-box", false);
  }
}

function resetSurvival() {
  survLives = 3;
  survStreak = 0;
  survMaxStreak = 0;
  survQueue = [];
  survCurrent = null;
  if (typeof document !== "undefined") {
    safeToggle("survival-active", false);
    safeToggle("survival-results", false);
    safeToggle("surv-correction-box", false);
  }
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.startSurvival = startSurvival;
  window.updateSurvivalUI = updateSurvivalUI;
  window.nextSurvivalQuestion = nextSurvivalQuestion;
  window.submitSurvivalAnswer = submitSurvivalAnswer;
  window.finishSurvival = finishSurvival;
  window.resetSurvival = resetSurvival;
  window.loadSurvivalHighScore = loadSurvivalHighScore;
  window.saveSurvivalHighScore = saveSurvivalHighScore;
  window.updateSurvivalDashboardRecord = updateSurvivalDashboardRecord;
  window.SurvivalModule = {
    startSurvival,
    updateSurvivalUI,
    nextSurvivalQuestion,
    submitSurvivalAnswer,
    finishSurvival,
    resetSurvival,
    loadSurvivalHighScore,
    saveSurvivalHighScore,
    updateSurvivalDashboardRecord,
    getSurvLives: () => survLives,
    getSurvStreak: () => survStreak,
    getSurvMaxStreak: () => survMaxStreak,
    getSurvQueue: () => survQueue,
    getSurvCurrent: () => survCurrent,
  };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    startSurvival,
    updateSurvivalUI,
    nextSurvivalQuestion,
    submitSurvivalAnswer,
    finishSurvival,
    resetSurvival,
    loadSurvivalHighScore,
    saveSurvivalHighScore,
    updateSurvivalDashboardRecord,
    getSurvLives: () => survLives,
    getSurvStreak: () => survStreak,
    getSurvMaxStreak: () => survMaxStreak,
    getSurvQueue: () => survQueue,
    getSurvCurrent: () => survCurrent,
  };
}
})();
