/**
 * ==========================================================================
 * Módulo 5: Motor de Avaliação Cumulativa & Simulados
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 5: Avaliação Cumulativa & Simulados');
const { appJs, hebrewData } = loadSourceFiles();

function getTerm(item) {
  return item.term || item.hebrew || '';
}

function generateSimuladoPool(chapters, activeChapterId, config) {
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);
  const cumulativeChapters = chapters.slice(
    0,
    activeIdx >= 0 ? activeIdx + 1 : chapters.length,
  );

  let currentChapWords = [], otherChapWords = [];
  let currentChapSentences = [], otherChapSentences = [];

  cumulativeChapters.forEach((chap) => {
    const isCurrent = chap.id === activeChapterId;
    (chap.items || []).forEach((item) => {
      const entry = { ...item, chapterId: chap.id, chapterTitle: chap.title, kind: "word" };
      if (isCurrent) currentChapWords.push(entry);
      else otherChapWords.push(entry);
    });
    (chap.sentences || []).forEach((sent) => {
      const entry = { ...sent, chapterId: chap.id, chapterTitle: chap.title, kind: "sentence" };
      if (isCurrent) currentChapSentences.push(entry);
      else otherChapSentences.push(entry);
    });
  });

  const allWords = [...currentChapWords, ...otherChapWords];
  const allSentences = [...currentChapSentences, ...otherChapSentences];

  let targetWords = 0;
  let targetSentences = 0;
  let totalAmount = config.amount === "max" ? allWords.length + allSentences.length : config.amount;

  if (config.focus === "words") {
    targetWords = Math.min(totalAmount, allWords.length);
  } else if (config.focus === "sentences") {
    targetSentences = Math.min(totalAmount, allSentences.length);
  } else {
    targetSentences = Math.min(
      Math.max(1, Math.round(totalAmount * 0.2)),
      allSentences.length,
    );
    targetWords = Math.min(totalAmount - targetSentences, allWords.length);
  }

  return { targetWords, targetSentences, cumulativeCount: cumulativeChapters.length };
}

suite.test('Simulado seleciona apenas capítulos até o capítulo ativo (cumulativo)', () => {
  const activeId = hebrewData[1] ? hebrewData[1].id : hebrewData[0].id;
  const result = generateSimuladoPool(hebrewData, activeId, { amount: 20, focus: "mixed" });
  assert.equal(result.cumulativeCount, hebrewData[1] ? 2 : 1);
});

suite.test('Distribuição mista (mixed) inclui palavras e frases', () => {
  const activeId = hebrewData[hebrewData.length - 1].id;
  const result = generateSimuladoPool(hebrewData, activeId, { amount: 25, focus: "mixed" });
  assert.isGreaterThan(result.targetWords, 0, 'Deve incluir palavras');
  assert.isGreaterThan(result.targetSentences, 0, 'Deve incluir frases quando disponíveis');
});

suite.test('Declaração das funções de avaliação no app.js', () => {
  assert.includes(appJs, 'function openSimuladoConfig', 'openSimuladoConfig ausente');
  assert.includes(appJs, 'function startSimulado', 'startSimulado ausente');
  assert.includes(appJs, 'function finishAssessment', 'finishAssessment ausente');
  assert.includes(appJs, 'function resetToDashboard', 'resetToDashboard ausente');
});

suite.test('Geração do relatório de diagnóstico com agrupamento por capítulo', () => {
  assert.includes(appJs, 'const chapterErrors = {};', 'Agrupamento de erros por capítulo ausente');
  assert.includes(appJs, 'Revisão Urgente', 'Classificação de diagnóstico ausente');
  assert.includes(appJs, 'Revisão Recomendada', 'Classificação de diagnóstico ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
