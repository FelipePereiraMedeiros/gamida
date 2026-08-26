/**
 * ==========================================================================
 * Módulo 1: Camada de Dados, DataLoader e Validação de Capítulos
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles, MockLocalStorage } = require('./test-utils');

const suite = new TestSuite('Módulo 1: Camada de Dados & Validação de Capítulos');
const { dataLoaderJs, hebrewData, greekData } = loadSourceFiles();

function getTerm(item) {
  return item.term || item.hebrew || '';
}

function isValidChapter(chapter) {
  if (!chapter || typeof chapter !== 'object') return false;
  if (typeof chapter.id !== 'string' || !chapter.id.trim()) return false;
  if (typeof chapter.title !== 'string' || !chapter.title.trim()) return false;
  const collections = [chapter.items, chapter.sentences].filter(Array.isArray);
  if (collections.length === 0) return false;
  return collections.flat().every((item) => {
    const term = item && getTerm(item);
    return (
      item &&
      typeof term === 'string' &&
      term.trim() &&
      Array.isArray(item.translations) &&
      item.translations.length > 0 &&
      item.translations.every((translation) => typeof translation === 'string')
    );
  });
}

function hasUniqueChapterIds(chapters) {
  const ids = chapters.map((chapter) => chapter && chapter.id);
  return ids.every((id, index) => id && ids.indexOf(id) === index);
}

// 1. Integridade do Arquivo hebrew_chapters.json
suite.test('Banco de dados de Hebraico (hebrew_chapters.json) possui formato válido', () => {
  assert.isArray(hebrewData, 'hebrew_chapters.json deve ser um Array');
  assert.isGreaterThan(hebrewData.length, 0, 'Deve conter ao menos 1 capítulo de hebraico');
  assert.isTrue(hasUniqueChapterIds(hebrewData), 'Capítulos de hebraico devem ter IDs únicos');
  assert.isTrue(hebrewData.every(isValidChapter), 'Todos os capítulos de hebraico devem ser válidos');
});

// 2. Integridade do Arquivo greek_chapters.json
suite.test('Banco de dados de Grego (greek_chapters.json) possui formato válido', () => {
  assert.isArray(greekData, 'greek_chapters.json deve ser um Array');
  assert.isGreaterThan(greekData.length, 0, 'Deve conter ao menos 1 capítulo de grego');
  assert.isTrue(hasUniqueChapterIds(greekData), 'Capítulos de grego devem ter IDs únicos');
  assert.isTrue(greekData.every(isValidChapter), 'Todos os capítulos de grego devem ser válidos');
});

// 3. Validação dos Itens e Traduções
suite.test('Todos os vocábulos e frases possuem termos e listas de traduções não-vazias', () => {
  const allHebrewItems = hebrewData.flatMap(c => [...(c.items || []), ...(c.sentences || [])]);
  const allGreekItems = greekData.flatMap(c => [...(c.items || []), ...(c.sentences || [])]);

  assert.isGreaterThan(allHebrewItems.length, 20, 'Hebraico deve conter volume robusto de termos');
  assert.isGreaterThan(allGreekItems.length, 20, 'Grego deve conter volume robusto de termos');

  allHebrewItems.forEach(item => {
    assert.isTrue(!!getTerm(item), `Item de hebraico sem termo: ${JSON.stringify(item)}`);
    assert.isGreaterThan(item.translations.length, 0, `Item de hebraico sem tradução: ${getTerm(item)}`);
  });

  allGreekItems.forEach(item => {
    assert.isTrue(!!getTerm(item), `Item de grego sem termo: ${JSON.stringify(item)}`);
    assert.isGreaterThan(item.translations.length, 0, `Item de grego sem tradução: ${getTerm(item)}`);
  });
});

// 4. Módulo DataLoader JS
suite.test('DataLoader implementa métodos fetchDefaultChapters e loadChapters', () => {
  assert.includes(dataLoaderJs, 'fetchDefaultChapters(language)', 'Método fetchDefaultChapters ausente');
  assert.includes(dataLoaderJs, 'loadChapters(language)', 'Método loadChapters ausente');
  assert.includes(dataLoaderJs, 'cache:', 'Objeto de cache do DataLoader ausente');
});

// 5. Tratamento de LocalStorage e Versão dos Dados
suite.test('DataLoader gerencia persistência e invalidação de versão no localStorage', () => {
  assert.includes(dataLoaderJs, 'localStorage.getItem', 'Leitura do localStorage ausente');
  assert.includes(dataLoaderJs, 'localStorage.setItem', 'Escrita no localStorage ausente');
  assert.includes(dataLoaderJs, 'gamida_data_version_', 'Chave de versão de dados ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
