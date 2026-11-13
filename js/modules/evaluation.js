/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Motor de Avaliação Linguística & Utilitários de Texto
 * ==========================================================================
 */

(function () {
/**
 * Sanitiza strings para exibição segura em contextos HTML (prevenção de XSS)
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normaliza textos removendo acentuação, pontuação supérflua e espaços múltiplos
 * @param {string} str
 * @returns {string}
 */
function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula a distância de Levenshtein entre duas cadeias de caracteres
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Indica se a lista de traduções descreve uma partícula sem tradução direta
 * (ex.: μέν, ἄν), cujas "traduções" são apenas descrições gramaticais
 * como "partícula usada correlativamente".
 * @param {Array<string>} acceptedList
 * @returns {boolean}
 */
function isUntranslatableParticle(acceptedList) {
  if (!Array.isArray(acceptedList) || acceptedList.length === 0) return false;
  return acceptedList.some((acc) => /^particula\b/.test(normalizeText(acc)));
}

/**
 * Avalia a resposta do usuário contra a lista de traduções aceitas
 * Suporta correspondência exata, inversão de palavras (em termos curtos), parênteses opcionais e detecção de typos.
 * @param {string} userAnswer
 * @param {Array<string>} acceptedList
 * @param {Object} [options]
 * @returns {{status: 'correct'|'typo'|'incorrect', expected: string}}
 */
function evaluateSingleAnswer(userAnswer, acceptedList, options = {}) {
  const safeList = Array.isArray(acceptedList) ? acceptedList : [];
  const cleanUser = (userAnswer || "").replace(/\(.*?\)/g, "");
  const normUser = normalizeText(cleanUser);

  const allAccepted = safeList.join(" / ");
  if (!normUser) {
    // Partículas sem tradução direta (μέν, ἄν...) aceitam resposta vazia como correta
    const allowEmpty =
      (options && options.allowEmpty === true) ||
      isUntranslatableParticle(safeList);
    return { status: allowEmpty ? "correct" : "incorrect", expected: allAccepted };
  }

  let bestMatch = { status: "incorrect", expected: allAccepted };

  const userWords = normUser.split(" ").filter((w) => w.length > 0);
  const sortWords = (str) =>
    str
      .split(" ")
      .filter((w) => w.length > 0)
      .sort()
      .join(" ");
  const userSortedWords = sortWords(normUser);
  const allowWordInversion =
    !(options && options.isSentence) && userWords.length <= 3;

  const hasQuestionMark = (str) => String(str || "").includes("?");
  const hasExclamation = (str) => String(str || "").includes("!");

  for (let i = 0; i < safeList.length; i++) {
    const rawAccepted = safeList[i];
    const normAcceptedFull = normalizeText(rawAccepted);
    const cleanAccepted = rawAccepted.replace(/\(.*?\)/g, "");
    const normAcceptedStripped = normalizeText(cleanAccepted);

    const accentedVersion =
      safeList.find(
        (acc) =>
          normalizeText(acc) === normAcceptedFull &&
          acc !== normAcceptedFull,
      ) || rawAccepted;

    const isExactMatch =
      normUser === normAcceptedFull || normUser === normAcceptedStripped;
    const isInvertedMatch =
      allowWordInversion &&
      (userSortedWords === sortWords(normAcceptedFull) ||
        userSortedWords === sortWords(normAcceptedStripped));

    if (isExactMatch || isInvertedMatch) {
      const isPunctuationCorrect =
        hasQuestionMark(userAnswer) === hasQuestionMark(rawAccepted) &&
        hasExclamation(userAnswer) === hasExclamation(rawAccepted);

      if (isExactMatch && isPunctuationCorrect) {
        return { status: "correct", expected: accentedVersion };
      } else {
        if (bestMatch.status === "incorrect") {
          bestMatch = { status: "typo", expected: accentedVersion };
        }
        continue;
      }
    }

    if (
      normAcceptedStripped.length > 4 &&
      getEditDistance(normUser, normAcceptedStripped) <= 1
    ) {
      const lastCharUser = normUser.slice(-1);
      const lastCharAcc = normAcceptedStripped.slice(-1);
      const isGenderSwap =
        (lastCharAcc === "o" && lastCharUser === "a") ||
        (lastCharAcc === "a" && lastCharUser === "o");

      if (!isGenderSwap && bestMatch.status === "incorrect") {
        bestMatch = { status: "typo", expected: accentedVersion };
      }
    }
  }

  return bestMatch;
}

/**
 * Avalia a resposta do usuário contra a lista de traduções aceitas.
 * Primeiro avalia a resposta inteira (preserva traduções cadastradas que contêm vírgula,
 * como "Senhor, a quem iremos?"). Se falhar e o aluno tiver informado múltiplas traduções
 * separadas por vírgula, ponto-e-vírgula ou barra (ex.: "casa, lar"), cada parte é avaliada
 * individualmente: a resposta só é aceita se TODAS as partes forem traduções válidas.
 * @param {string} userAnswer
 * @param {Array<string>} acceptedList
 * @param {Object} [options]
 * @returns {{status: 'correct'|'typo'|'incorrect', expected: string}}
 */
function evaluateAnswer(userAnswer, acceptedList, options = {}) {
  const fullResult = evaluateSingleAnswer(userAnswer, acceptedList, options);
  if (fullResult.status === "correct") return fullResult;

  const parts = String(userAnswer || "")
    .split(/[,;\/]/)
    .map((p) => p.trim())
    .filter((p) => normalizeText(p.replace(/\(.*?\)/g, "")).length > 0);
  if (parts.length < 2) return fullResult;

  const partResults = parts.map((p) =>
    evaluateSingleAnswer(p, acceptedList, options),
  );
  if (partResults.some((r) => r.status === "incorrect")) return fullResult;

  const status = partResults.every((r) => r.status === "correct")
    ? "correct"
    : "typo";
  // Um acerto pleno por partes prevalece sobre um "typo" da resposta inteira
  if (status === "typo" && fullResult.status === "typo") return fullResult;

  const expected = partResults
    .map((r) => r.expected)
    .filter((e, idx, arr) => arr.indexOf(e) === idx)
    .join(" / ");
  return { status, expected };
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.escapeHTML = escapeHTML;
  window.normalizeText = normalizeText;
  window.getEditDistance = getEditDistance;
  window.evaluateAnswer = evaluateAnswer;
  window.isUntranslatableParticle = isUntranslatableParticle;
  window.EvaluationModule = { escapeHTML, normalizeText, getEditDistance, isUntranslatableParticle, evaluateAnswer };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { escapeHTML, normalizeText, getEditDistance, isUntranslatableParticle, evaluateAnswer };
}
})();
