/**
 * ==========================================================================
 * Módulo 5: Motor de Avaliação Cumulativa & Simulados
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 5: Avaliação Cumulativa & Simulados');
const { appJs, hebrewData } = loadSourceFiles();

// Importações diretas dos módulos de produção
const { getTerm, SimConfig, isAlphabetChapter } = require('../js/modules/state.js');

function generateSimuladoPool(chapters, activeChapterId, config) {
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);
  let cumulativeChapters = chapters.slice(
    0,
    activeIdx >= 0 ? activeIdx + 1 : chapters.length,
  );
  if (activeIdx > 0) {
    cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
  }

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

  return { targetWords, targetSentences, cumulativeCount: cumulativeChapters.length, cumulativeChapters, allWords };
}

suite.test('Simulado inclui o alfabeto quando o capítulo ativo é a Lição 1', () => {
  const activeId = hebrewData[0].id;
  const result = generateSimuladoPool(hebrewData, activeId, { amount: 20, focus: "mixed" });
  assert.equal(result.cumulativeCount, 1, 'Lição 1 deve ser o único capítulo incluído');
  assert.isTrue(result.cumulativeChapters.some((c) => isAlphabetChapter(c)), 'Deve incluir lição de alfabeto');
});

suite.test('Simulado exclui a lição do alfabeto no Hebraico quando o capítulo ativo não for o primeiro', () => {
  const activeId = hebrewData[1].id;
  const result = generateSimuladoPool(hebrewData, activeId, { amount: 20, focus: "mixed" });
  assert.equal(result.cumulativeCount, 1, 'Deve excluir a Lição 1 (alfabeto), mantendo apenas lições posteriores');
  assert.isFalse(result.cumulativeChapters.some((c) => isAlphabetChapter(c)), 'Não deve conter capítulo de alfabeto');
  // Garante que nenhuma consoante de letra isolada está presente no banco
  assert.isFalse(result.allWords.some((w) => (w.type || '').includes('Begadkefat')), 'Não deve conter letras do alfabeto');
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

suite.test('openSimuladoConfig atualiza sim-scope-info e abre painel sem exceções', () => {
  const elementsById = {};
  const mockClassList = (el) => ({
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); },
  });

  const createMockEl = (id) => {
    const el = {
      id,
      textContent: '',
      classList: null,
      children: [],
      appendChild(c) { this.children.push(c); },
    };
    el.classList = mockClassList(el);
    elementsById[id] = el;
    return el;
  };

  createMockEl('sim-scope-info');
  createMockEl('cfg-focus-sentences');
  createMockEl('assess-dashboard');
  createMockEl('assess-config');

  const oldDoc = global.document;
  const oldWindow = global.window;
  const oldAlert = global.alert;

  global.document = {
    getElementById: (id) => elementsById[id] || null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  global.window = {
    AppState: {
      chapters: hebrewData,
      currentChapter: hebrewData[0],
    },
    SimConfig,
    isAlphabetChapter,
  };
  global.alert = () => {};

  const assessmentModule = require('../js/modules/assessment.js');

  assessmentModule.openSimuladoConfig();

  assert.isTrue(
    elementsById['assess-dashboard'].classList.contains('hidden'),
    'assess-dashboard deve ficar oculto',
  );
  assert.isFalse(
    elementsById['assess-config'].classList.contains('hidden'),
    'assess-config deve ficar visível',
  );
  assert.isTrue(
    elementsById['sim-scope-info'].textContent.includes('Lição 1'),
    'sim-scope-info deve conter informação do escopo da lição',
  );

  // Limpeza limpa
  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
  if (oldWindow === undefined) delete global.window; else global.window = oldWindow;
  if (oldAlert === undefined) delete global.alert; else global.alert = oldAlert;
});

suite.test('openSimuladoConfig e resetToDashboard são resilientes a elementos nulos no DOM', () => {
  const oldDoc = global.document;
  const oldWindow = global.window;
  const oldAlert = global.alert;

  // DOM vazio retornando null para tudo
  global.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  global.window = {
    AppState: {
      chapters: hebrewData,
      currentChapter: hebrewData[1],
    },
    SimConfig,
    isAlphabetChapter,
  };
  global.alert = () => {};

  const assessmentModule = require('../js/modules/assessment.js');

  let errOpen = null;
  try {
    assessmentModule.openSimuladoConfig();
  } catch (e) {
    errOpen = e;
  }
  assert.equal(errOpen, null, 'openSimuladoConfig não deve quebrar com elementos ausentes');

  let errReset = null;
  try {
    assessmentModule.resetToDashboard();
  } catch (e) {
    errReset = e;
  }
  assert.equal(errReset, null, 'resetToDashboard não deve quebrar com elementos ausentes');

  // Limpeza limpa
  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
  if (oldWindow === undefined) delete global.window; else global.window = oldWindow;
  if (oldAlert === undefined) delete global.alert; else global.alert = oldAlert;
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}

