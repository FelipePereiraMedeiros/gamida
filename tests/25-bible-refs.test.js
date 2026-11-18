/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 25: Referências bíblicas do vocabulário
 * ==========================================================================
 * Cada palavra do hebraico pode trazer "refs": versículos onde ela aparece,
 * no formato OSIS ("Gen.2.24"), para a futura seção de leitura da Bíblia.
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert } = require('./test-utils');

const suite = new TestSuite('Módulo 25: Referências bíblicas');
const read = (lang) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', `${lang}_chapters.json`), 'utf8'));

// Livros do Antigo Testamento (códigos OSIS) e quantos capítulos cada um tem nas Bíblias em português
const OT = {
  Gen: 50, Exod: 40, Lev: 27, Num: 36, Deut: 34, Josh: 24, Judg: 21, Ruth: 4, '1Sam': 31, '2Sam': 24, '1Kgs': 22, '2Kgs': 25,
  '1Chr': 29, '2Chr': 36, Ezra: 10, Neh: 13, Esth: 10, Job: 42, Ps: 150, Prov: 31, Eccl: 12, Song: 8, Isa: 66, Jer: 52, Lam: 5,
  Ezek: 48, Dan: 12, Hos: 14, Joel: 3, Amos: 9, Obad: 1, Jonah: 4, Mic: 7, Nah: 3, Hab: 3, Zeph: 3, Hag: 2, Zech: 14, Mal: 4,
};

const hebrew = read('hebrew');
const withRefs = hebrew.flatMap((c) => (c.items || []).filter((i) => i.refs));

suite.test('Mais de 500 palavras do hebraico trazem referência bíblica', () => {
  assert.isTrue(withRefs.length >= 500, `só ${withRefs.length} palavras com referência`);
});

suite.test('Toda referência está no formato OSIS, num livro do Antigo Testamento e num capítulo que existe', () => {
  const bad = [];
  withRefs.forEach((item) => {
    assert.isTrue(Array.isArray(item.refs) && item.refs.length > 0, `${item.hebrew}: refs vazio`);
    item.refs.forEach((ref) => {
      const m = /^([1-2]?[A-Z][a-z]+)\.(\d+)\.(\d+)$/.exec(ref);
      if (!m || !OT[m[1]] || Number(m[2]) < 1 || Number(m[2]) > OT[m[1]] || Number(m[3]) < 1) bad.push(`${item.hebrew}: ${ref}`);
    });
    assert.equal(new Set(item.refs).size, item.refs.length, `${item.hebrew}: referência repetida`);
  });
  assert.deepEqual(bad, [], `referências inválidas: ${bad.join(', ')}`);
});

suite.test('Referências conhecidas estão na palavra certa', () => {
  const refsOf = (heb) => (withRefs.find((i) => i.hebrew === heb) || {}).refs || [];
  assert.includes(refsOf('אָב').join(' '), 'Gen.2.24');
  assert.includes(refsOf('אֱלֹהִים').join(' '), 'Gen.1.1');
  assert.includes(refsOf('אוֹר').join(' '), 'Gen.1.3');
  assert.includes(refsOf('שָׁמַע').join(' '), 'Deut.6.4');
});

suite.test('O alfabeto não recebe referências (são letras, não palavras)', () => {
  const alphabet = hebrew.find((c) => c.id === 'kelley_01');
  assert.isTrue(!(alphabet.items || []).some((i) => i.refs), 'letra do alfabeto com referência');
});

module.exports = suite;

if (require.main === module) {
  suite.run();
}
