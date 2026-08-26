/**
 * ==========================================================================
 * Módulo 8: Dicionário de Vocabulário & Busca em Tempo Real
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 8: Dicionário & Busca em Tempo Real');
const { appJs, html } = loadSourceFiles();

suite.test('Estrutura HTML da tabela de dicionário e campo de busca', () => {
  assert.includes(html, 'id="vocab-table-body"', 'Tbody #vocab-table-body ausente');
  assert.includes(html, 'id="vocab-search"', 'Input de busca #vocab-search ausente');
  assert.includes(html, 'oninput="filterVocabTable()"', 'Evento oninput de filtro ausente');
});

suite.test('Funções de renderização e filtro do dicionário declaradas no app.js', () => {
  assert.includes(appJs, 'function renderVocabTable', 'renderVocabTable ausente');
  assert.includes(appJs, 'function filterVocabTable', 'filterVocabTable ausente');
  assert.includes(appJs, 'lastRenderedVocabChapter', 'Cache de capítulo renderizado ausente');
});

suite.test('Injeção de tabelas de paradigmas no final do dicionário', () => {
  assert.includes(appJs, 'INJEÇÃO DOS PARADIGMAS NO FINAL DA LISTA', 'Comentário ou bloco de injeção ausente');
  assert.includes(appJs, 'getStaticParadigmTableHTML', 'Chamada da tabela de paradigma ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
