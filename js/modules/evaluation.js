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
 * Traduções para exibir: omite a grafia sem acento ("ceu") quando a acentuada ("céu")
 * também está cadastrada. As duas continuam aceitas na correção.
 * @param {Array<string>} acceptedList
 * @returns {Array<string>}
 */
function getDisplayTranslations(acceptedList) {
  const list = (Array.isArray(acceptedList) ? acceptedList : []).filter((t) => typeof t === "string");
  const stripAccents = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const shown = list.filter((t, idx) => {
    const bare = stripAccents(t);
    const isBare = bare === t.normalize("NFD");
    const hasAccentedTwin = list.some((other) => other !== t && stripAccents(other).toLowerCase() === bare.toLowerCase() && stripAccents(other) !== other.normalize("NFD"));
    const isRepeat = list.findIndex((other) => other.toLowerCase() === t.toLowerCase()) !== idx;
    return !isRepeat && !(isBare && hasAccentedTwin);
  });
  return shown.length > 0 ? shown : list;
}

/** Pronomes-sujeito que o português dispensa ("ele guardou" = "guardou") */
const SUBJECT_PRONOUN_RE = /^(ele|ela|eles|elas|eu|tu|nos|vos) (?=\S)/;
/** Preposições de regência que fecham uma glosa ("fora de", "estar prestes a") */
const TRAILING_PREPOSITION_RE = /(?<=\S) (de|a|em|com|para|por|sobre)$/;

/**
 * Uniformiza a posição do pronome "se": "se ajoelhou" e "ajoelhou-se" viram a mesma forma.
 * Espera texto já normalizado (sem hífen, por isso "ajoelhou-se" chega como "ajoelhouse").
 * @param {string} norm
 * @returns {string}
 */
function unifyReflexive(norm) {
  return norm.replace(/^((?:ele|ela|eles|elas|eu|tu|nos|vos) )?se (\S+)/, "$1$2se");
}

/**
 * Formas reduzidas igualmente corretas de uma tradução cadastrada: sem o pronome-sujeito
 * inicial e/ou sem a preposição de regência final. Só a tradução cadastrada é reduzida,
 * nunca a resposta do aluno, para "ela guardou" não passar por "ele guardou".
 * @param {string} normAccepted tradução já normalizada
 * @returns {Array<string>}
 */
function getLooseForms(normAccepted) {
  const base = unifyReflexive(normAccepted);
  const forms = new Set([base]);
  const noPronoun = unifyReflexive(normAccepted.replace(SUBJECT_PRONOUN_RE, ""));
  forms.add(noPronoun);
  [base, noPronoun].forEach((f) => forms.add(f.replace(TRAILING_PREPOSITION_RE, "")));
  forms.delete("");
  return Array.from(forms);
}

/** Troca de gênero (menino/menina) não é erro de digitação: muda o sentido */
function isGenderSwapPair(a, b) {
  const strip = (w) => w.replace(/s$/, "");
  const x = strip(a);
  const y = strip(b);
  if ((x === "ele" && y === "ela") || (x === "ela" && y === "ele")) return true;
  const lastX = x.slice(-1);
  const lastY = y.slice(-1);
  return x.slice(0, -1) === y.slice(0, -1) &&
    ((lastX === "o" && lastY === "a") || (lastX === "a" && lastY === "o"));
}

/**
 * Em frases, tolera até dois deslizes de digitação em palavras longas distintas.
 * A distância da frase inteira só cobre um deslize, pouco para uma oração completa.
 * @param {string} normUser
 * @param {string} normAccepted
 * @returns {boolean}
 */
function isSentenceTypoMatch(normUser, normAccepted) {
  const userWords = normUser.split(" ");
  const accWords = normAccepted.split(" ");
  if (accWords.length < 3 || userWords.length !== accWords.length) return false;
  let slips = 0;
  for (let i = 0; i < accWords.length; i++) {
    if (userWords[i] === accWords[i]) continue;
    if (accWords[i].length < 5) return false;
    if (getEditDistance(userWords[i], accWords[i]) > 1) return false;
    if (isGenderSwapPair(userWords[i], accWords[i])) return false;
    slips++;
    if (slips > 2) return false;
  }
  return slips > 0;
}

/**
 * Compara, palavra a palavra, a resposta com a tradução aceita mais próxima.
 * Serve ao retorno das frases: mostra o que bateu, o que faltou e o que sobrou.
 * @param {string} userAnswer
 * @param {Array<string>} acceptedList
 * @returns {{expected: string, expectedWords: Array<{text: string, matched: boolean}>, userWords: Array<{text: string, matched: boolean}>, ratio: number}|null}
 */
function compareSentenceWords(userAnswer, acceptedList) {
  const safeList = (Array.isArray(acceptedList) ? acceptedList : []).filter((a) => typeof a === "string" && a.trim());
  const splitRaw = (str) => String(str || "").split(/\s+/).filter((w) => normalizeText(w).length > 0);
  const userRaw = splitRaw(userAnswer);
  if (safeList.length === 0 || userRaw.length === 0) return null;
  const userNorm = userRaw.map(normalizeText);

  let best = null;
  safeList.forEach((accepted) => {
    const accRaw = splitRaw(accepted);
    const accNorm = accRaw.map(normalizeText);
    // Maior subsequência comum: respeita a ordem das palavras
    const rows = accNorm.length + 1;
    const cols = userNorm.length + 1;
    const lcs = Array.from({ length: rows }, () => new Array(cols).fill(0));
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        lcs[i][j] = accNorm[i - 1] === userNorm[j - 1]
          ? lcs[i - 1][j - 1] + 1
          : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
    const accMatched = new Array(accNorm.length).fill(false);
    const userMatched = new Array(userNorm.length).fill(false);
    let i = accNorm.length;
    let j = userNorm.length;
    while (i > 0 && j > 0) {
      if (accNorm[i - 1] === userNorm[j - 1]) {
        accMatched[i - 1] = true;
        userMatched[j - 1] = true;
        i--;
        j--;
      } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    const common = lcs[accNorm.length][userNorm.length];
    const ratio = (2 * common) / (accNorm.length + userNorm.length);
    if (!best || ratio > best.ratio) {
      best = {
        expected: accepted,
        expectedWords: accRaw.map((text, idx) => ({ text, matched: accMatched[idx] })),
        userWords: userRaw.map((text, idx) => ({ text, matched: userMatched[idx] })),
        ratio,
      };
    }
  });
  return best;
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

  const allAccepted = getDisplayTranslations(safeList).join(" / ");
  if (!normUser) {
    // Partículas sem tradução direta (μέν, ἄν...) aceitam resposta vazia como correta
    const allowEmpty =
      (options && options.allowEmpty === true) ||
      isUntranslatableParticle(safeList);
    return { status: allowEmpty ? "correct" : "incorrect", expected: allAccepted };
  }

  let bestMatch = { status: "incorrect", expected: allAccepted };

  const looseUser = unifyReflexive(normUser);
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

    // Pronome-sujeito e preposição de regência são opcionais; "se" vale antes ou depois do verbo
    const isLooseMatch =
      getLooseForms(normAcceptedFull).includes(looseUser) ||
      getLooseForms(normAcceptedStripped).includes(looseUser);
    if (isLooseMatch) {
      const isPunctuationCorrect =
        hasQuestionMark(userAnswer) === hasQuestionMark(rawAccepted) &&
        hasExclamation(userAnswer) === hasExclamation(rawAccepted);
      if (isPunctuationCorrect) {
        return { status: "correct", expected: accentedVersion };
      }
      if (bestMatch.status === "incorrect") {
        bestMatch = { status: "typo", expected: accentedVersion };
      }
      continue;
    }

    if (
      normAcceptedStripped.length > 4 &&
      getEditDistance(normUser, normAcceptedStripped) <= 1
    ) {
      // O deslize pode estar em qualquer palavra: "ela guardou" não é erro de digitação de "ele guardou"
      const accWordList = normAcceptedStripped.split(" ");
      const isGenderSwap =
        isGenderSwapPair(normUser, normAcceptedStripped) ||
        (userWords.length === accWordList.length &&
          userWords.some((w, idx) => w !== accWordList[idx] && isGenderSwapPair(w, accWordList[idx])));

      if (!isGenderSwap && bestMatch.status === "incorrect") {
        bestMatch = { status: "typo", expected: accentedVersion };
      }
    } else if (
      options && options.isSentence &&
      bestMatch.status === "incorrect" &&
      (isSentenceTypoMatch(normUser, normAcceptedStripped) ||
        isSentenceTypoMatch(normUser, normAcceptedFull))
    ) {
      bestMatch = { status: "typo", expected: accentedVersion };
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
  window.compareSentenceWords = compareSentenceWords;
  window.EvaluationModule = { escapeHTML, normalizeText, getEditDistance, isUntranslatableParticle, compareSentenceWords, getDisplayTranslations, evaluateAnswer };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { escapeHTML, normalizeText, getEditDistance, isUntranslatableParticle, compareSentenceWords, getDisplayTranslations, evaluateAnswer };
}
})();
