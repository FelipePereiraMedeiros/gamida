/**
 * ==========================================================================
 * Gamida - Sistema de Repetição Espaçada (SRS) & Anki Flashcards
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof window !== "undefined" && window.AppState) ? window : (typeof require !== "undefined" ? require("./state.js") : {});
const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;

let ankiQueue = [];
let ankiCurrentCard = null;
let ankiStats = { hard: 0, good: 0, easy: 0 };
let ankiTotalCards = 0;

/**
 * Carrega os registros de SRS e pontuação máxima do localStorage
 */
function loadSRS() {
  if (typeof localStorage === "undefined") return;
  const stored = localStorage.getItem(`gamida_${AppState.language}_srs`);
  if (stored) {
    try {
      AppState.srs = JSON.parse(stored);
    } catch (e) {
      AppState.srs = {};
    }
  } else {
    AppState.srs = {};
  }

  const high = localStorage.getItem(`gamida_${AppState.language}_survival_high`);
  AppState.survivalHighScore = high ? parseInt(high, 10) : 0;
}

/**
 * Salva os registros de SRS no localStorage
 */
function saveSRS() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    `gamida_${AppState.language}_srs`,
    JSON.stringify(AppState.srs),
  );
}

/**
 * Registra uma falha de retenção no termo e agenda revisão prioritária
 * @param {string} termStr
 */
function recordSRSError(termStr) {
  if (!termStr) return;
  if (!AppState.srs[termStr]) {
    AppState.srs[termStr] = {
      interval: 0,
      ef: 2.5,
      nextReview: 0,
      fails: 0,
    };
  }
  AppState.srs[termStr].fails = (AppState.srs[termStr].fails || 0) + 1;
  AppState.srs[termStr].nextReview = Date.now();
  saveSRS();
}

/**
 * Inicia a sessão de revisão de Flashcards (Anki)
 */
function startAnki() {
  const now = Date.now();
  let dueCards = [];
  let newCards = [];

  const activeChapterId = AppState.currentChapter?.id;
  if (!activeChapterId) {
    alert("Não há capítulos disponíveis para iniciar a revisão.");
    return;
  }

  AppState.chapters.forEach((chap) => {
    const isCurrent = chap.id === activeChapterId;
    const processItem = (it, kind) => {
      const entry = {
        ...it,
        chapterId: chap.id,
        chapterTitle: chap.title,
        kind,
      };
      const record = AppState.srs[getTerm(it)];
      if (record && record.nextReview <= now) dueCards.push(entry);
      else if (!record && isCurrent) newCards.push(entry);
    };
    (chap.items || []).forEach((i) => processItem(i, "word"));
    (chap.sentences || []).forEach((s) => processItem(s, "sentence"));
  });

  dueCards = Array.from(
    new Map(dueCards.map((w) => [getTerm(w), w])).values(),
  );
  newCards = Array.from(
    new Map(newCards.map((w) => [getTerm(w), w])).values(),
  );

  dueCards = shuffleArray(dueCards);
  newCards = shuffleArray(newCards);

  ankiQueue = [...dueCards.slice(0, 20), ...newCards.slice(0, 10)];

  if (ankiQueue.length === 0) {
    alert(
      "🎉 Você não tem revisões pendentes nem palavras novas neste capítulo no momento. Excelente trabalho!",
    );
    return;
  }

  ankiTotalCards = ankiQueue.length;
  ankiStats = { hard: 0, good: 0, easy: 0 };

  if (typeof document !== "undefined") {
    document.getElementById("assess-dashboard").classList.add("hidden");
    document.getElementById("anki-active").classList.remove("hidden");
  }

  renderAnkiCard();
}

/**
 * Renderiza o cartão da fila atual
 */
function renderAnkiCard() {
  if (ankiQueue.length === 0) {
    finishAnki();
    return;
  }

  ankiCurrentCard = ankiQueue[0];

  if (typeof document === "undefined") return;
  document.getElementById("anki-counter").textContent =
    `Cartão ${ankiTotalCards - ankiQueue.length + 1} de ${ankiTotalCards}`;
  document.getElementById("anki-type-tag").textContent =
    ankiCurrentCard.kind === "word" ? "Palavra" : "Frase";

  document.getElementById("anki-hebrew").textContent =
    getTerm(ankiCurrentCard);
  document.getElementById("anki-translit").textContent =
    ankiCurrentCard.transliteration
      ? `(${ankiCurrentCard.transliteration})`
      : "";
  document.getElementById("anki-translation").textContent =
    ankiCurrentCard.translations.join(" / ");

  const record = AppState.srs[getTerm(ankiCurrentCard)] || {
    interval: 0,
    ef: 2.5,
    nextReview: 0,
  };
  const goodInt =
    record.interval === 0 ? 1 : Math.round(record.interval * record.ef);
  const easyInt =
    record.interval === 0
      ? 4
      : Math.round(record.interval * (record.ef + 0.15) * 1.3);

  document.getElementById("anki-next-good").textContent =
    goodInt + (goodInt === 1 ? " dia" : " dias");
  document.getElementById("anki-next-easy").textContent =
    easyInt + (easyInt === 1 ? " dia" : " dias");

  document.getElementById("anki-back").classList.add("hidden");
  document
    .getElementById("anki-reveal-container")
    .classList.remove("hidden");
}

/**
 * Revela a resposta do cartão atual
 */
function revealAnki() {
  if (typeof document === "undefined") return;
  document
    .getElementById("anki-reveal-container")
    .classList.add("hidden");
  document.getElementById("anki-back").classList.remove("hidden");
}

/**
 * Registra a avaliação do usuário sobre o cartão e recalcula o agendamento
 * @param {'hard'|'good'|'easy'} grade
 */
function answerAnki(grade) {
  if (!ankiCurrentCard) return;
  ankiStats[grade]++;
  const record = AppState.srs[getTerm(ankiCurrentCard)] || {
    interval: 0,
    ef: 2.5,
    nextReview: 0,
    fails: 0,
  };

  if (grade === "hard") {
    record.interval = 0;
    record.ef = Math.max(1.3, record.ef - 0.2);
    record.nextReview = Date.now() + 60 * 1000;
    ankiQueue.push(ankiCurrentCard);
    ankiTotalCards++;
  } else if (grade === "good") {
    record.interval =
      record.interval === 0 ? 1 : Math.round(record.interval * record.ef);
    record.nextReview =
      Date.now() + record.interval * 24 * 60 * 60 * 1000;
  } else if (grade === "easy") {
    record.ef += 0.15;
    record.interval =
      record.interval === 0
        ? 4
        : Math.round(record.interval * record.ef * 1.3);
    record.nextReview =
      Date.now() + record.interval * 24 * 60 * 60 * 1000;
  }

  AppState.srs[getTerm(ankiCurrentCard)] = record;
  saveSRS();

  ankiQueue.shift();
  renderAnkiCard();
}

/**
 * Finaliza a sessão de flashcards e exibe o resumo de acertos
 */
function finishAnki() {
  if (typeof document === "undefined") return;
  document.getElementById("anki-active").classList.add("hidden");
  document.getElementById("anki-results").classList.remove("hidden");
  document.getElementById("anki-res-hard").textContent = ankiStats.hard;
  document.getElementById("anki-res-good").textContent = ankiStats.good;
  document.getElementById("anki-res-easy").textContent = ankiStats.easy;
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.loadSRS = loadSRS;
  window.saveSRS = saveSRS;
  window.recordSRSError = recordSRSError;
  window.startAnki = startAnki;
  window.renderAnkiCard = renderAnkiCard;
  window.revealAnki = revealAnki;
  window.answerAnki = answerAnki;
  window.finishAnki = finishAnki;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadSRS,
    saveSRS,
    recordSRSError,
    startAnki,
    renderAnkiCard,
    revealAnki,
    answerAnki,
    finishAnki,
  };
}
})();
