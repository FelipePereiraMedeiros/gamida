/**
 * ==========================================================================
 * Módulo 16: Radicais do 2º Aoristo (tabela, dicionário e prática)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, loadSourceFiles } = require('./test-utils');
const SecondAorist = require('../js/modules/second-aorist.js');
const { evaluateAnswer } = require('../js/modules/evaluation.js');

const suite = new TestSuite('Módulo 16: Radicais do 2º Aoristo');
const { appJs } = loadSourceFiles();
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const greekData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'greek_chapters.json'), 'utf8'));

suite.test('Todo verbete traz lema, aoristo, radical, infinitivo e tradução', () => {
  const verbs = SecondAorist.getSecondAoristVerbs();
  assert.equal(verbs.length, 18, 'A tabela segue os 18 verbos do vocabulário da Lição 11');
  verbs.forEach((v) => {
    ['lemma', 'aorist', 'stem', 'infinitive', 'lemmaTranslit', 'aoristTranslit', 'infinitiveTranslit'].forEach((k) => {
      assert.isTrue(typeof v[k] === 'string' && v[k].length > 0, `${v.lemma}: campo ${k} vazio`);
    });
    assert.isTrue(v.stem.endsWith('-'), `${v.lemma}: radical deve terminar com hífen`);
    assert.isGreaterThan(v.translations.length, 0, `${v.lemma}: sem tradução`);
  });
  const lemmas = verbs.map((v) => v.lemma);
  assert.equal(new Set(lemmas).size, lemmas.length, 'Lemas duplicados');
});

suite.test('Radicais coincidem com os cadastrados no vocabulário grego', () => {
  const vocab = {};
  greekData.forEach((c) => (c.items || []).forEach((i) => {
    const m = String(i.type || '').match(/2º Aoristo: ([^)]+)\)/);
    if (m) vocab[i.term] = m[1].trim();
  }));
  const verbs = SecondAorist.getSecondAoristVerbs();
  assert.deepEqual(verbs.map((v) => v.lemma).sort(), Object.keys(vocab).sort(), 'A tabela deve conter exatamente os verbos de 2º aoristo do vocabulário');
  verbs.forEach((v) => {
    assert.equal(v.stem, vocab[v.lemma], `${v.lemma}: radical divergente do vocabulário`);
    assert.isGreaterThan(v.frequency, 0, `${v.lemma}: sem número de ocorrências`);
  });
});

suite.test('Questões da prática mostram o aoristo e aceitam infinitivo ou passado', () => {
  const qs = SecondAorist.buildSecondAoristQuestions();
  const labon = qs.find((q) => q.term === 'ἔλαβον');
  assert.isTrue(!!labon, 'ἔλαβον deve estar na prática');
  assert.equal(evaluateAnswer('receber', labon.translations).status, 'correct');
  assert.equal(evaluateAnswer('tomei', labon.translations).status, 'correct');
  assert.equal(evaluateAnswer('tomar, receber', labon.translations).status, 'correct');
  assert.equal(evaluateAnswer('comer', labon.translations).status, 'incorrect');
  assert.includes(SecondAorist.describeSecondAorist(labon), 'λαμβάνω');
});

suite.test('Tabela HTML escapa conteúdo e filtra por busca', () => {
  const all = SecondAorist.renderSecondAoristTableHTML();
  assert.includes(all, 'λαβεῖν');
  const filtered = SecondAorist.renderSecondAoristTableHTML('comer');
  assert.includes(filtered, 'φαγεῖν');
  assert.isTrue(!filtered.includes('λαβεῖν'), 'Filtro deve excluir outros verbos');
  assert.includes(SecondAorist.renderSecondAoristTableHTML('xyz-inexistente'), 'Nenhum verbo encontrado');
});

suite.test('Dicionário tem atalho para a tabela e o Praticar tem sessão própria', () => {
  assert.includes(indexHtml, 'id="btn-second-aorist-table"');
  assert.includes(indexHtml, 'id="second-aorist-table-body"');
  assert.includes(indexHtml, 'id="mode-aorist2"');
  assert.includes(indexHtml, 'js/modules/second-aorist.js');
  assert.includes(appJs, 'function toggleSecondAoristTable');
  assert.includes(appJs, 'function startSecondAoristPractice');
  assert.includes(appJs, 'buildSecondAoristQuestions');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
