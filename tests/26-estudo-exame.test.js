/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 26: "Estudo para exame" (modo temporário): integridade dos dados
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert } = require('./test-utils');

const suite = new TestSuite('Módulo 26: Estudo para exame');
const read = (lang) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', `${lang}_chapters.json`), 'utf8'));
const exam = (lang) => read(lang).find((c) => c.id === 'estudo_exame');
const nfc = (s) => String(s || '').normalize('NFC');

suite.test('As duas línguas têm a lição do exame, marcada como especial e no fim', () => {
  ['hebrew', 'greek'].forEach((lang) => {
    const data = read(lang);
    const chap = exam(lang);
    assert.isTrue(!!chap, `${lang}: sem a lição do exame`);
    assert.equal(chap.special, 'exam');
    assert.equal(data[data.length - 1].id, 'estudo_exame', `${lang}: a lição do exame não está no fim`);
  });
});

suite.test('Hebraico: as 18 frases das provas (8 + 10), com tradução, chave, referência e análise', () => {
  const s = exam('hebrew').sentences;
  assert.equal(s.length, 18);
  assert.equal(s.filter((x) => x.group === 'prova1').length, 8);
  assert.equal(s.filter((x) => x.group === 'prova2').length, 10);
  s.forEach((x) => {
    assert.isTrue(x.translations.length > 0 && !!x.key && /^Prova [12] · \d+$/.test(x.label), `${x.hebrew}: falta tradução, chave ou rótulo`);
    assert.isTrue(Array.isArray(x.tokens) && x.tokens.length > 0, `${x.hebrew}: sem análise`);
    x.tokens.forEach((t) => {
      if (t.parts) assert.equal(nfc(t.parts.map((p) => p.segment).join('')), nfc(t.text), `${x.hebrew}: as partes não formam ${t.text}`);
      assert.isTrue(!!t.lemma && !!t.syntax_role, `${x.hebrew}: ${t.text} sem lema ou função`);
    });
  });
  assert.isTrue(exam('hebrew').items.length >= 30, 'o vocabulário das frases ficou pequeno');
});

suite.test('Grego: 40 palavras (20 + 20) com a resposta do gabarito primeiro', () => {
  const items = exam('greek').items.filter((i) => i.kind === 'vocab');
  assert.equal(items.length, 40);
  assert.equal(items.filter((i) => i.group === 'prova1').length, 20);
  assert.equal(items.filter((i) => i.group === 'prova2').length, 20);
  const logos = items.find((i) => i.term.startsWith('λόγος'));
  assert.deepEqual(logos.translations.slice(0, 2), ['palavra', 'verbo']);
  const eis = items.find((i) => i.term.startsWith('εἷς'));
  assert.equal(eis.translations[0], 'um', 'εἷς confundido com a preposição εἰς');
});

suite.test('Grego: a tabela de análise traz classificação e chave; as frases têm tradução, chave e análise', () => {
  const chap = exam('greek');
  const table = chap.items.filter((i) => i.kind === 'tabela');
  assert.isTrue(table.length >= 30);
  table.forEach((i) => assert.isTrue(/—/.test(i.type) && !!i.key && !!i.label, `${i.term}: falta classificação ou chave`));
  chap.sentences.forEach((x) => {
    assert.isTrue(x.translations.length > 0 && !!x.key && !!x.group, `${x.term}: falta tradução, chave ou prova`);
    assert.isTrue(Array.isArray(x.tokens) && x.tokens.length > 0, `${x.term}: sem análise`);
  });
  assert.isTrue(chap.sentences.some((x) => x.ref === 'Jo 6.26'), 'faltou Jo 6.26');
});

module.exports = suite;

if (require.main === module) {
  suite.run();
}
