/**
 * ==========================================================================
 * Módulo 2: Motor de Avaliação Linguística & Normalização de Texto
 * ==========================================================================
 */

const { TestSuite, assert } = require('./test-utils');

const suite = new TestSuite('Módulo 2: Motor de Avaliação Linguística');

// Funções puras idênticas às de js/app.js
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

function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1))
        matrix[i][j] = matrix[i - 1][j - 1];
      else
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
    }
  }
  return matrix[b.length][a.length];
}

function evaluateAnswer(userAnswer, acceptedList) {
  const cleanUser = (userAnswer || "").replace(/\(.*?\)/g, "");
  const normUser = normalizeText(cleanUser);

  const allAccepted = acceptedList.join(" / ");
  if (!normUser) return { status: "incorrect", expected: allAccepted };

  let bestMatch = { status: "incorrect", expected: allAccepted };

  const sortWords = (str) =>
    str
      .split(" ")
      .filter((w) => w.length > 0)
      .sort()
      .join(" ");
  const userSortedWords = sortWords(normUser);

  const hasQuestionMark = (str) => str.includes("?");
  const hasExclamation = (str) => str.includes("!");

  for (let i = 0; i < acceptedList.length; i++) {
    const rawAccepted = acceptedList[i];
    const normAcceptedFull = normalizeText(rawAccepted);
    const cleanAccepted = rawAccepted.replace(/\(.*?\)/g, "");
    const normAcceptedStripped = normalizeText(cleanAccepted);

    const accentedVersion =
      acceptedList.find(
        (acc) =>
          normalizeText(acc) === normAcceptedFull &&
          acc !== normAcceptedFull,
      ) || rawAccepted;

    const isExactMatch =
      normUser === normAcceptedFull || normUser === normAcceptedStripped;
    const isInvertedMatch =
      userSortedWords === sortWords(normAcceptedFull) ||
      userSortedWords === sortWords(normAcceptedStripped);

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

// Testes Unitários do Módulo 2
suite.test('normalizeText remove acentos, pontuação e espaços redundantes', () => {
  assert.equal(normalizeText('Coração, Alma!'), 'coracao alma');
  assert.equal(normalizeText('   EM    PAZ...   '), 'em paz');
  assert.equal(normalizeText('ágape (amor)'), 'agape amor');
  assert.equal(normalizeText(''), '');
});

suite.test('getEditDistance calcula a distância de Levenshtein corretamente', () => {
  assert.equal(getEditDistance('casa', 'casa'), 0);
  assert.equal(getEditDistance('casa', 'caza'), 1);
  assert.equal(getEditDistance('livro', 'livros'), 1);
  assert.equal(getEditDistance('homem', 'mulher'), 5);
});

suite.test('evaluateAnswer valida correspondência exata', () => {
  const result = evaluateAnswer('rei', ['rei', 'o rei']);
  assert.equal(result.status, 'correct');
});

suite.test('evaluateAnswer tolera insensibilidade a maiúsculas e acentos', () => {
  const result = evaluateAnswer('Graca', ['graça']);
  assert.equal(result.status, 'correct');
});

suite.test('evaluateAnswer lida com opções opcionais entre parênteses', () => {
  // Se a tradução cadastrada for "(ele) disse" ou "falou (com)"
  const res1 = evaluateAnswer('disse', ['(ele) disse']);
  assert.equal(res1.status, 'correct');

  const res2 = evaluateAnswer('ele disse', ['(ele) disse']);
  assert.equal(res2.status, 'correct');
});

suite.test('evaluateAnswer detecta inversão de palavras como aceitável com aviso de typo', () => {
  const res = evaluateAnswer('Deus de paz', ['paz de Deus']);
  assert.equal(res.status, 'typo');
});

suite.test('evaluateAnswer tolera pequenos erros de digitação (1 caractere)', () => {
  const res = evaluateAnswer('palvra', ['palavra']);
  assert.equal(res.status, 'typo');
});

suite.test('evaluateAnswer rejeita respostas incorretas ou vazias', () => {
  const resEmpty = evaluateAnswer('', ['rei']);
  assert.equal(resEmpty.status, 'incorrect');

  const resWrong = evaluateAnswer('montanha', ['rio', 'mar']);
  assert.equal(resWrong.status, 'incorrect');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
