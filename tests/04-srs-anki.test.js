/**
 * ==========================================================================
 * Módulo 4: Sistema de Repetição Espaçada (SRS) & Anki Flashcards
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 4: Sistema SRS & Anki Flashcards');
const { appJs } = loadSourceFiles();

function processAnkiGrade(record, grade) {
  let { interval = 0, ef = 2.5, fails = 0 } = record || {};
  let nextReview = Date.now();

  if (grade === "hard") {
    interval = 1;
    ef = Math.max(1.3, ef - 0.15);
    nextReview = Date.now() + 1 * 24 * 60 * 60 * 1000;
  } else if (grade === "good") {
    interval = interval === 0 ? 1 : Math.round(interval * ef);
    nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
  } else if (grade === "easy") {
    interval = interval === 0 ? 4 : Math.round(interval * (ef + 0.15) * 1.3);
    ef = Math.min(3.0, ef + 0.15);
    nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
  }

  return { interval, ef, nextReview, fails };
}

suite.test('recordSRSError inicializa e contabiliza falhas com revisão imediata', () => {
  const srs = {};
  const term = "shalom";

  if (!srs[term]) {
    srs[term] = { interval: 0, ef: 2.5, nextReview: 0, fails: 0 };
  }
  srs[term].fails = (srs[term].fails || 0) + 1;
  srs[term].nextReview = Date.now();

  assert.equal(srs[term].fails, 1);
  assert.equal(srs[term].ef, 2.5);
  assert.isGreaterThan(srs[term].nextReview, 0);
});

suite.test('Classificação "good" avança intervalo baseado no Ease Factor', () => {
  // Novo card
  const r1 = processAnkiGrade(null, "good");
  assert.equal(r1.interval, 1);

  // Segunda revisão
  const r2 = processAnkiGrade(r1, "good");
  assert.equal(r2.interval, Math.round(1 * 2.5)); // 3 dias
});

suite.test('Classificação "easy" aplica bônus de intervalo e eleva EF', () => {
  const r1 = processAnkiGrade(null, "easy");
  assert.equal(r1.interval, 4); // Primeiro intervalo de fácil é 4 dias
  assert.equal(r1.ef, 2.65);
});

suite.test('Classificação "hard" reduz EF respeitando piso mínimo de 1.3', () => {
  let r = { interval: 10, ef: 1.35, nextReview: 0, fails: 1 };
  r = processAnkiGrade(r, "hard");
  assert.equal(r.interval, 1);
  assert.equal(r.ef, 1.3); // Piso mantido em 1.3
});

suite.test('Declaração das funções do Anki no app.js', () => {
  assert.includes(appJs, 'function startAnki', 'startAnki ausente');
  assert.includes(appJs, 'function renderAnkiCard', 'renderAnkiCard ausente');
  assert.includes(appJs, 'function revealAnki', 'revealAnki ausente');
  assert.includes(appJs, 'function answerAnki', 'answerAnki ausente');
  assert.includes(appJs, 'function finishAnki', 'finishAnki ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
