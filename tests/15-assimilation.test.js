/**
 * ==========================================================================
 * Módulo 15: Dicas de Assimilação nas Respostas da Prática
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');
const { getAssimilationTip, getHeadword, HOOKS } = require('../js/modules/assimilation.js');

const suite = new TestSuite('Módulo 15: Dicas de Assimilação');
const { html, appJs, hebrewData, greekData } = loadSourceFiles();

const allItems = (data) => data.flatMap((chapter) => chapter.items || []);
const allSentences = (data) => data.flatMap((chapter) => chapter.sentences || []);
const tipFor = (term, language, extra = {}) => {
  const key = language === 'greek' ? 'term' : 'hebrew';
  return getAssimilationTip({ [key]: term, type: 'Substantivo', ...extra }, language);
};

suite.test('Todo item e toda frase dos dois idiomas recebem uma dica', () => {
  [[hebrewData, 'hebrew'], [greekData, 'greek']].forEach(([data, language]) => {
    [...allItems(data), ...allSentences(data)].forEach((item) => {
      const tip = getAssimilationTip(item, language);
      assert.isTrue(!!tip && tip.text.length > 0, `Sem dica para ${item.hebrew || item.term}`);
    });
  });
});

suite.test('Toda âncora de memória aponta para um termo real do vocabulário', () => {
  [[hebrewData, 'hebrew'], [greekData, 'greek']].forEach(([data, language]) => {
    const heads = new Set(allItems(data).map((item) => getHeadword(String(item.hebrew || item.term).normalize('NFC').trim())));
    Object.keys(HOOKS[language]).forEach((key) => {
      assert.isTrue(heads.has(key), `Âncora sem termo no vocabulário: ${key}`);
    });
  });
});

suite.test('Homógrafos não compartilham a dica um do outro', () => {
  assert.includes(tipFor('אֵל', 'hebrew').text, 'Emanuel');
  assert.isFalse(tipFor('אֶל', 'hebrew', { type: 'Preposição', transliteration: 'el' }).text.includes('Emanuel'));
  assert.includes(tipFor('עָבַד', 'hebrew', { type: 'Verbo' }).text, 'Obadias');
  assert.isFalse(tipFor('אָבַד', 'hebrew', { type: 'Verbo' }).text.includes('Obadias'));
});

suite.test('Verbete grego é localizado pela forma principal', () => {
  assert.equal(getHeadword('θεός, -οῦ, ὁ'), 'θεός');
  assert.equal(getHeadword('οὐ (οὐκ, οὐχ, οὔ)'), 'οὐ');
  assert.equal(getHeadword('σῴζω [σῳδ-]'), 'σῴζω');
  assert.includes(tipFor('θεός, -οῦ, ὁ', 'greek').text, 'teologia');
});

suite.test('Regras do hebraico seguem Kelley', () => {
  assert.includes(tipFor('מֶלֶךְ', 'hebrew').text, '§25', 'Segolado');
  assert.includes(tipFor('שָׁנָה', 'hebrew', { type: 'Substantivo (f)' }).text, '§18.2', 'Feminino em ָה');
  assert.includes(tipFor('בְּרִית', 'hebrew', { type: 'Substantivo (f)' }).text, '§18.2', 'Feminino em ת');
  assert.includes(tipFor('כָּתַב', 'hebrew', { type: 'Verbo' }).text, 'כתב', 'Raiz do Qal');
  assert.includes(tipFor('קוּם', 'hebrew', { type: 'Verbo' }).text, '§74', 'Ayin Vav');
  assert.includes(tipFor('בָּנָה', 'hebrew', { type: 'Verbo' }).text, '§72', 'Lamed He');
  assert.includes(
    tipFor('דִּבֶּר', 'hebrew', { type: "Verbo (Pi'el) — Kelley: [דבר]" }).text,
    'ativo intensivo ou causativo',
  );
});

suite.test('Regras do grego seguem Bergmann', () => {
  const rule = (term, type = 'Substantivo') => tipFor(term, 'greek', { type }).text;
  assert.includes(rule('ἄνθρωπος, -ου, ὁ'), '§5.5', '2ª declinação');
  assert.includes(rule('ὁδός, -οῦ, ἡ'), 'feminino', 'Exceção feminina');
  assert.includes(rule('ἔργον, -ου, τό'), 'neutros', 'Neutro');
  assert.includes(rule('καρδία, -ας, ἡ'), '§6.1', '1ª declinação');
  assert.includes(rule('προφήτης, -ου, ὁ'), 'Masculino da 1ª', '1ª declinação masculina');
  assert.includes(rule('σῶμα, -ατος, τό'), '§13.1', '3ª declinação');
  assert.includes(rule('πόλις, -εως, ἡ'), '§13.1', '3ª declinação em -εως');
  assert.includes(rule('ἀγαπάω', 'Verbo'), '§20.1', 'Contraído');
  assert.includes(rule('ἔρχομαι', 'Verbo'), '§10.4', 'Depoente');
  assert.includes(rule('δίδωμι', 'Verbo'), '§20.4', 'Verbo em -μι');
  assert.includes(rule('βάλλω', 'Verbo (2º Aoristo: βαλ-)'), 'βαλ-', '2º aoristo');
});

suite.test('Letras trazem sua particularidade gráfica', () => {
  const kaf = getAssimilationTip({ hebrew: 'כ', type: 'Consoante (11 - Sofit: ך)' }, 'hebrew');
  assert.includes(kaf.text, 'ך');
  const sigma = getAssimilationTip({ term: 'σ', type: 'Consoante (18 - Final: ς)' }, 'greek');
  assert.includes(sigma.text, 'ς');
});

suite.test('Frase usa a palavra-chave do lema, com prioridade para palavras de conteúdo', () => {
  const tip = getAssimilationTip({
    term: 'ἐν ἀρχῇ',
    tokens: [
      { text: 'ἐν', lemma: 'ἐν', word_class: 'Preposição' },
      { text: 'ἀρχῇ', lemma: 'ἀρχή', word_class: 'Substantivo' },
    ],
  }, 'greek');
  assert.equal(tip.kind, 'frase');
  assert.includes(tip.text, 'ἀρχή');
  assert.includes(tip.text, 'arqueologia');
});

suite.test('Item vazio não gera dica', () => {
  assert.equal(getAssimilationTip(null, 'hebrew'), null);
  assert.equal(getAssimilationTip({}, 'greek'), null);
});

suite.test('A dica está ligada à resposta da prática', () => {
  assert.includes(html, 'id="feedback-tip"', 'Elemento da dica ausente');
  assert.includes(html, 'js/modules/assimilation.js', 'Script do módulo ausente');
  assert.includes(appJs, 'showAssimilationTip(AppState.currentQuestion);', 'checkPracticeAnswer não exibe a dica');
});

module.exports = suite;

if (require.main === module) {
  suite.run();
}
