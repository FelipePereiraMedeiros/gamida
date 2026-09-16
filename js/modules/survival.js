/**
 * ==========================================================================
 * Gamida - Motor do Modo Sobrevivência (Morte Súbita)
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof window !== "undefined" && window.AppState) ? window : (typeof require !== "undefined" ? require("./state.js") : {});
const _evalModule = (typeof window !== "undefined" && window.evaluateAnswer) ? window : (typeof require !== "undefined" ? require("./evaluation.js") : {});
const _srsModule = (typeof window !== "undefined" && window.recordSRSError) ? window : (typeof require !== "undefined" ? require("./srs.js") : {});

const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const evaluateAnswer = (typeof window !== "undefined" && window.evaluateAnswer) || _evalModule.evaluateAnswer;
const recordSRSError = (typeof window !== "undefined" && window.recordSRSError) || _srsModule.recordSRSError;

let survLives = 3;
let survStreak = 0;
let survQueue = [];
let survCurrent = null;

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
  const cumulativeChapters = AppState.chapters.slice(
    0,
    activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
  );

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
    document.getElementById("assess-dashboard").classList.add("hidden");
    document.getElementById("survival-active").classList.remove("hidden");
    document.getElementById("surv-correction-box").classList.add("hidden");
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
    const cumulativeChapters = AppState.chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : AppState.chapters.length,
    );
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

  if (hebPrompt) hebPrompt.textContent = getTerm(survCurrent);
  if (input) {
    input.value = "";
    input.disabled = false;
    setTimeout(() => input.focus(), 50);
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

    document.getElementById("surv-last-heb").textContent =
      getTerm(survCurrent);
    document.getElementById("surv-last-cor").textContent =
      survCurrent.translations.join(" / ");
    document
      .getElementById("surv-correction-box")
      .classList.remove("hidden");

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
  document.getElementById("survival-active").classList.add("hidden");
  document.getElementById("survival-results").classList.remove("hidden");

  if (survStreak > AppState.survivalHighScore) {
    AppState.survivalHighScore = survStreak;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `gamida_${AppState.language}_survival_high`,
        AppState.survivalHighScore,
      );
    }
  }

  document.getElementById("surv-res-streak").textContent = survStreak;
  document.getElementById("surv-res-high").textContent =
    AppState.survivalHighScore;

  if (surrendered) {
    document
      .getElementById("surv-correction-box")
      .classList.add("hidden");
  }
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.startSurvival = startSurvival;
  window.updateSurvivalUI = updateSurvivalUI;
  window.nextSurvivalQuestion = nextSurvivalQuestion;
  window.submitSurvivalAnswer = submitSurvivalAnswer;
  window.finishSurvival = finishSurvival;
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
