/**
 * ==========================================================================
 * Módulo 17: Exercício de Análise Morfológica com Caixas de Seleção (Grego)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');
const M = require('../js/modules/morph-drill.js');

const suite = new TestSuite('Módulo 17: Análise Morfológica com Caixas de Seleção');
const { html, greekData } = loadSourceFiles();

const tok = (word_class, inflection, syntax_role = '') => ({ text: 'x', word_class, inflection, syntax_role });

suite.test('Todas as lições de grego com frases geram questões', () => {
  greekData.filter((c) => (c.sentences || []).length > 0).forEach((chap) => {
    const qs = M.buildQuestions([chap]);
    assert.isGreaterThan(qs.length, 10, `Poucas questões em ${chap.id}`);
  });
  assert.isGreaterThan(M.buildQuestions(greekData).length, 1000);
});

suite.test('Filtra por lições e por palavras invariáveis', () => {
  const only = M.buildQuestions(greekData, { chapterIds: ['bergmann_05'] });
  assert.isTrue(only.every((q) => q.chapterId === 'bergmann_05'));
  const withInv = M.buildQuestions(greekData, { chapterIds: ['bergmann_05'], includeInvariable: true });
  assert.isGreaterThan(withInv.length, only.length);
});

suite.test('Toda questão tem classe e ao menos uma categoria corrigível', () => {
  M.buildQuestions(greekData).forEach((q) => {
    assert.isTrue(Array.isArray(q.expected.classe) && q.expected.classe.length > 0, `Sem classe: ${q.id}`);
    const morph = M.FIELDS.slice(1).some((f) => Array.isArray(q.expected[f.key]) && q.expected[f.key][0] !== M.NA);
    assert.isTrue(morph, `Sem morfologia: ${q.id}`);
  });
});

suite.test('Substantivo: caso, gênero e número; verbo não se aplica', () => {
  const e = M.extractGreekMorphology(tok('Substantivo (1ª declinação)', 'Genitivo feminino singular'));
  assert.deepEqual(e.classe, ['Substantivo']);
  assert.deepEqual(e.caso, ['Genitivo']);
  assert.deepEqual(e.genero, ['Feminino']);
  assert.deepEqual(e.numero, ['Singular']);
  assert.deepEqual(e.tempo, [M.NA]);
  assert.deepEqual(e.pessoa, [M.NA]);
});

suite.test('Verbo finito: tempo, modo, voz, pessoa e número', () => {
  const e = M.extractGreekMorphology(tok('Verbo (2º Aoristo)', '2º aoristo do indicativo ativo, 3ª pessoa singular'));
  assert.deepEqual(e.tempo, ['Aoristo']);
  assert.deepEqual(e.modo, ['Indicativo']);
  assert.deepEqual(e.voz, ['Ativa']);
  assert.deepEqual(e.pessoa, ['3ª']);
  assert.deepEqual(e.numero, ['Singular']);
  assert.deepEqual(e.caso, [M.NA]);
});

suite.test('Lê a morfologia do papel sintático quando falta a flexão', () => {
  const v = M.extractGreekMorphology(tok('Verbo depoente', '', "Núcleo do predicado. Futuro do indicativo médio (depoente), 1ª pessoa plural ('iremos')."));
  assert.deepEqual(v.tempo, ['Futuro']);
  assert.deepEqual(v.voz, ['Média']);
  assert.deepEqual(v.pessoa, ['1ª']);
  assert.deepEqual(v.numero, ['Plural']);
  const p = M.extractGreekMorphology(tok('Pronome pessoal enclítico', '', "Objeto direto (acusativo de 1ª pessoa singular: 'me')."));
  assert.deepEqual(p.caso, ['Acusativo']);
  assert.deepEqual(p.pessoa, ['1ª']);
  assert.deepEqual(p.genero, [M.NA], 'ἐγώ e σύ não têm gênero');
});

suite.test('Particípio declina; infinitivo não tem pessoa nem caso', () => {
  const pt = M.extractGreekMorphology(tok('Verbo (Particípio)', 'Particípio presente ativo, nominativo masculino singular'));
  assert.deepEqual(pt.modo, ['Particípio']);
  assert.deepEqual(pt.caso, ['Nominativo']);
  assert.deepEqual(pt.pessoa, [M.NA]);
  const inf = M.extractGreekMorphology(tok('Infinitivo verbal', 'Presente infinitivo ativo'));
  assert.deepEqual(inf.modo, ['Infinitivo']);
  assert.deepEqual(inf.tempo, ['Presente']);
  assert.deepEqual(inf.caso, [M.NA]);
  assert.deepEqual(inf.numero, [M.NA]);
});

suite.test('Imperfeito e imperativo não são confundidos com perfeito e ativo', () => {
  const e = M.extractGreekMorphology(tok('Verbo', 'Imperfeito do indicativo ativo, 3ª pessoa plural'));
  assert.deepEqual(e.tempo, ['Imperfeito']);
  const i = M.extractGreekMorphology(tok('Verbo', '1º aoristo do imperativo passivo, 2ª pessoa singular'));
  assert.deepEqual(i.modo, ['Imperativo']);
  assert.deepEqual(i.voz, ['Passiva']);
  const mp = M.extractGreekMorphology(tok('Verbo', 'Perfeito do indicativo médio-passivo, 3ª pessoa singular'));
  assert.deepEqual(mp.voz, ['Média', 'Passiva']);
});

suite.test('Correção: em branco quando não se aplica e formas ambíguas', () => {
  const e = M.extractGreekMorphology(tok('Artigo definido', 'Nominativo/Acusativo neutro singular'));
  const ok = M.checkAnswer(e, { classe: ['Artigo'], caso: ['Acusativo'], genero: ['Neutro'], numero: ['Singular'] });
  assert.isTrue(ok.allCorrect, 'Uma leitura possível basta');
  const bad = M.checkAnswer(e, { classe: ['Artigo'], caso: ['Acusativo'], genero: ['Neutro'], numero: ['Singular'], tempo: ['Presente'] });
  assert.equal(bad.fields.tempo.status, 'wrong', 'Marcar categoria que não se aplica é erro');
  const wrongClass = M.checkAnswer(e, { classe: ['Artigo', 'Pronome'] });
  assert.equal(wrongClass.fields.classe.status, 'wrong', 'Classe aceita só uma caixa');
});

suite.test('Categoria não informada não é corrigida', () => {
  const e = M.extractGreekMorphology(tok('Pronome pessoal', 'Genitivo masculino plural'));
  assert.equal(e.pessoa, null);
  const r = M.checkAnswer(e, { classe: ['Pronome'], caso: ['Genitivo'], genero: ['Masculino'], numero: ['Plural'], pessoa: ['1ª'] });
  assert.equal(r.fields.pessoa.status, 'skip');
  assert.isTrue(r.allCorrect);
});

suite.test('Resumo calcula o acerto por categoria', () => {
  const e = M.extractGreekMorphology(tok('Substantivo', 'Dativo masculino plural'));
  const r1 = M.checkAnswer(e, { classe: ['Substantivo'], caso: ['Dativo'], genero: ['Masculino'], numero: ['Plural'] });
  const r2 = M.checkAnswer(e, { classe: ['Substantivo'], caso: ['Genitivo'], genero: ['Masculino'], numero: ['Plural'] });
  const s = M.summarize([r1, r2]);
  assert.equal(s.words, 2);
  assert.equal(s.wordsCorrect, 1);
  assert.equal(s.perField.caso.ok, 1);
  assert.equal(s.perField.caso.total, 2);
});

suite.test('Interface: cartão, telas e script registrados no index.html', () => {
  ['morph-mode-card', 'morph-config', 'morph-active', 'morph-results', 'morph-chapter-list', 'morph-question', 'morph-action'].forEach((id) => {
    assert.includes(html, `id="${id}"`, `Falta #${id}`);
  });
  assert.includes(html, 'js/modules/morph-drill.js');
});

module.exports = suite;
