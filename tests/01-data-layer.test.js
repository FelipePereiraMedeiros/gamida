/**
 * ==========================================================================
 * Módulo 1: Camada de Dados, DataLoader e Validação de Capítulos
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles, MockLocalStorage } = require('./test-utils');

const suite = new TestSuite('Módulo 1: Camada de Dados & Validação de Capítulos');
const { dataLoaderJs, hebrewData, greekData } = loadSourceFiles();

// Funções puras importadas diretamente do módulo de produção
const { getTerm, isValidChapter, hasUniqueChapterIds } = require('../js/modules/state.js');

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

// 6. Camada de Armazenamento Unificada (GamidaStorage / DataLoader.storage)
suite.test('DataLoader.storage fornece API assíncrona com fallback resiliente', async () => {
  const DataLoader = require('../js/data-loader.js');
  assert.isTrue(typeof DataLoader.storage.getItem === 'function', 'getItem deve ser função');
  assert.isTrue(typeof DataLoader.storage.setItem === 'function', 'setItem deve ser função');
  assert.isTrue(typeof DataLoader.storage.removeItem === 'function', 'removeItem deve ser função');

  const testKey = 'gamida_test_sprint2_key';
  const testVal = 'sprint2_value';
  await DataLoader.storage.setItem(testKey, testVal);
  const retrieved = await DataLoader.storage.getItem(testKey);
  assert.equal(retrieved, testVal, 'Valor salvo via storage deve ser recuperado com exatidão');
  await DataLoader.storage.removeItem(testKey);
  const afterRemove = await DataLoader.storage.getItem(testKey);
  assert.isTrue(afterRemove === null || afterRemove === undefined, 'Item removido deve retornar nulo');
});

// 7. Padrão Overlay na Migração de Capítulos (A1)
suite.test('DataLoader.loadChapters preserva capítulos customizados e editados (_userModified) após upgrade de versão', async () => {
  const DataLoader = require('../js/data-loader.js');
  const oldStorage = global.localStorage;
  const mockStorage = new MockLocalStorage();
  global.localStorage = mockStorage;

  try {
    const oldVersion = "0.9.0-old";
    const customChapter = {
      id: "cap_meu_estudo_personalizado",
      title: "Minha Lição Especial",
      items: [{ term: "דָּבָר", translations: ["palavra"] }],
      sentences: [],
      _custom: true,
    };

    const defaults = await DataLoader.fetchDefaultChapters("hebrew");
    const editedDefault = JSON.parse(JSON.stringify(defaults[0]));
    editedDefault.title = "Lição 1 - Modificada pelo Usuário";
    editedDefault._userModified = true;

    const storedChapters = [editedDefault, customChapter];
    mockStorage.setItem("gamida_hebrew_chapters", JSON.stringify(storedChapters));
    mockStorage.setItem("gamida_data_version_hebrew", oldVersion);

    DataLoader.clearCache("hebrew");
    const loaded = await DataLoader.loadChapters("hebrew");

    const loadedChap1 = loaded.find((c) => c.id === editedDefault.id);
    assert.isTrue(!!loadedChap1, "Capítulo 1 padrão deve existir");
    assert.equal(loadedChap1.title, "Lição 1 - Modificada pelo Usuário", "Título customizado pelo usuário deve ser preservado");
    assert.isTrue(loadedChap1._userModified === true, "Flag _userModified deve persistir");

    const loadedCustom = loaded.find((c) => c.id === "cap_meu_estudo_personalizado");
    assert.isTrue(!!loadedCustom, "Capítulo customizado do usuário deve ser preservado na migração");
    assert.equal(loadedCustom.title, "Minha Lição Especial", "Dados do capítulo customizado devem permanecer intactos");

    assert.isGreaterThan(loaded.length, defaults.length, "Total de capítulos deve conter defaults + customizados");
  } finally {
    if (oldStorage === undefined) delete global.localStorage; else global.localStorage = oldStorage;
  }
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
