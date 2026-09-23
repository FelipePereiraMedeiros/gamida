/**
 * ==========================================================================
 * Módulo 8: Dicionário de Vocabulário & Busca em Tempo Real
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 8: Dicionário & Busca em Tempo Real');
const { appJs, html } = loadSourceFiles();
const { renderVocabTable, filterVocabTable } = require('../js/modules/ui.js');

suite.test('Estrutura HTML da tabela de dicionário e campo de busca', () => {
  assert.includes(html, 'id="vocab-table-body"', 'Tbody #vocab-table-body ausente');
  assert.includes(html, 'id="vocab-search"', 'Input de busca #vocab-search ausente');
  assert.includes(html, 'oninput="filterVocabTable()"', 'Evento oninput de filtro ausente');
});

suite.test('Funções de renderização e filtro do dicionário exportadas no ui.js e app.js', () => {
  assert.isFunction(renderVocabTable, 'renderVocabTable deve ser uma função');
  assert.isFunction(filterVocabTable, 'filterVocabTable deve ser uma função');

  assert.includes(appJs, 'function renderVocabTable', 'renderVocabTable ausente no app.js');
  assert.includes(appJs, 'function filterVocabTable', 'filterVocabTable ausente no app.js');
  assert.includes(appJs, 'lastRenderedVocabChapter', 'Cache de capítulo renderizado ausente');
});

suite.test('Injeção de tabelas de paradigmas no final do dicionário', () => {
  assert.includes(appJs, 'INJEÇÃO DOS PARADIGMAS NO FINAL DA LISTA', 'Comentário ou bloco de injeção ausente');
  assert.includes(appJs, 'getStaticParadigmTableHTML', 'Chamada da tabela de paradigma ausente');
});

suite.test('Estrutura HTML dos seletores de abrangência e filtro de categoria do dicionário', () => {
  assert.includes(html, 'id="vocab-scope-single"', 'Botão #vocab-scope-single ausente');
  assert.includes(html, 'id="vocab-scope-cumulative"', 'Botão #vocab-scope-cumulative ausente');
  assert.includes(html, 'id="vocab-category-select"', 'Seletor #vocab-category-select ausente');
  assert.includes(html, 'setVocabCumulative(false)', 'Chamada setVocabCumulative(false) ausente');
  assert.includes(html, 'setVocabCumulative(true)', 'Chamada setVocabCumulative(true) ausente');
  assert.includes(html, 'setVocabCategory(this.value)', 'Chamada setVocabCategory ausente');
});

suite.test('Funções de escopo e categoria do dicionário exportadas no ui.js, state.js e app.js', () => {
  const { setVocabCumulative, setVocabCategory, updateVocabScopeUI, updateVocabCategoryFilterUI } = require('../js/modules/ui.js');
  const { getAvailableVocabCategories } = require('../js/modules/state.js');

  assert.isFunction(setVocabCumulative, 'setVocabCumulative deve ser uma função');
  assert.isFunction(setVocabCategory, 'setVocabCategory deve ser uma função');
  assert.isFunction(updateVocabScopeUI, 'updateVocabScopeUI deve ser uma função');
  assert.isFunction(updateVocabCategoryFilterUI, 'updateVocabCategoryFilterUI deve ser uma função');
  assert.isFunction(getAvailableVocabCategories, 'getAvailableVocabCategories deve ser uma função');

  assert.includes(appJs, 'function setVocabCumulative', 'setVocabCumulative ausente no app.js');
  assert.includes(appJs, 'function setVocabCategory', 'setVocabCategory ausente no app.js');
  assert.includes(appJs, 'function getAvailableVocabCategories', 'getAvailableVocabCategories ausente no app.js');
});

suite.test('getAvailableVocabCategories contabiliza palavras, frases e categorias no modo normal e acumulativo', () => {
  const { getAvailableVocabCategories } = require('../js/modules/state.js');
  const mockState = {
    chapters: [
      {
        id: 'kelley_01',
        title: 'Lição 1 - Alfabeto',
        items: [{ hebrew: 'א', transliteration: 'alef', translations: ['alef'], type: 'Consoante' }],
        sentences: []
      },
      {
        id: 'kelley_02',
        title: 'Lição 2 - Vocabulário',
        items: [
          { hebrew: 'אִישׁ', transliteration: 'ish', translations: ['homem'], type: 'Substantivo' },
          { hebrew: 'אָב', transliteration: 'av', translations: ['pai'], type: 'Substantivo' },
          { hebrew: 'טוֹב', transliteration: 'tov', translations: ['bom'], type: 'Adjetivo' }
        ],
        sentences: [
          { hebrew: 'אִישׁ טוֹב', transliteration: 'ish tov', translations: ['homem bom'], type: 'Frase' }
        ]
      },
      {
        id: 'kelley_03',
        title: 'Lição 3 - Verbos',
        items: [
          { hebrew: 'אָמַר', transliteration: 'amar', translations: ['disse'], type: 'Verbo' }
        ],
        sentences: []
      }
    ],
    currentChapter: null,
    isVocabCumulative: false,
    vocabCategory: 'all'
  };

  mockState.currentChapter = mockState.chapters[1]; // Lição 2

  // Modo Normal
  const normalCats = getAvailableVocabCategories(mockState);
  assert.equal(normalCats.totalWords, 3, 'Deve conter 3 palavras na lição 2');
  assert.equal(normalCats.totalSentences, 1, 'Deve conter 1 frase na lição 2');
  assert.equal(normalCats.totalItems, 4, 'Total de itens deve ser 4');
  assert.isTrue(normalCats.categories.some(c => c.id === 'substantivo' && c.count === 2), 'Deve encontrar 2 substantivos');
  assert.isTrue(normalCats.categories.some(c => c.id === 'adjetivo' && c.count === 1), 'Deve encontrar 1 adjetivo');
  assert.isFalse(normalCats.categories.some(c => c.id === 'verbo'), 'Não deve conter verbos na lição 2');

  // Modo Acumulativo na Lição 3 (inclui Lição 2 e 3, desconsidera alfabeto)
  mockState.currentChapter = mockState.chapters[2];
  mockState.isVocabCumulative = true;
  const cumulCats = getAvailableVocabCategories(mockState);
  assert.equal(cumulCats.totalWords, 4, 'Deve conter 4 palavras acumuladas (3 da L2 + 1 da L3)');
  assert.equal(cumulCats.totalSentences, 1, 'Deve conter 1 frase acumulada');
  assert.isTrue(cumulCats.categories.some(c => c.id === 'verbo' && c.count === 1), 'Deve conter verbos');
  assert.isTrue(cumulCats.categories.some(c => c.id === 'substantivo' && c.count === 2), 'Deve conter substantivos acumulados');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
