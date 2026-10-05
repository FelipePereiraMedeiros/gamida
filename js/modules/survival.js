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
let survQueue = [];
let survCurrent = null;

function safeToggle(id, isVisible) {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(id);
  if (!el) return null;
  if (isVisible) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
  return el;
}

/**
 * Inicia o desafio de sobrevivência com vocabulário cumulativo até o capítulo ativo
 */
function startSurvival() {
  const activeChapterId = AppState.currentChapter?.id;
  if (!activeChapterId) {
    alert("Não há capítulos disponíveis para iniciar o modo de sobrevivência.");
    return;
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
    alert("Não há palavras suficientes acumuladas para iniciar o Morte Súbita.");
    return;
  }

  survQueue = shuffleArray([...allWords]);
  survLives = 3;
  survStreak = 0;

  if (typeof document !== "undefined") {
    safeToggle("assess-dashboard", false);
    safeToggle("survival-active", true);
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
  if (streakEl) streakEl.textContent = survStreak;
  if (heartsEl) {
    heartsEl.textContent = "❤️".repeat(survLives) + "🖤".repeat(3 - survLives);
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
    updateSurvivalUI();

    if (flash) {
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
    }

    nextSurvivalQuestion();
  } else {
    survLives--;
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
      setTimeout(
        () => flash.classList.replace("opacity-100", "opacity-0"),
        300,
      );
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

  if (survStreak > (AppState.survivalHighScore || 0)) {
    AppState.survivalHighScore = survStreak;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `gamida_${AppState.language}_survival_high`,
        AppState.survivalHighScore,
      );
    }
  }

  const resStreak = document.getElementById("surv-res-streak");
  if (resStreak) resStreak.textContent = survStreak;
  const resHigh = document.getElementById("surv-res-high");
  if (resHigh) resHigh.textContent = AppState.survivalHighScore || 0;

  if (surrendered) {
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
  window.SurvivalModule = {
    startSurvival,
    updateSurvivalUI,
    nextSurvivalQuestion,
    submitSurvivalAnswer,
    finishSurvival,
  };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    startSurvival,
    updateSurvivalUI,
    nextSurvivalQuestion,
    submitSurvivalAnswer,
    finishSurvival,
  };
}
})();
