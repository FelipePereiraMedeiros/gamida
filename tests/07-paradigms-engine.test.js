/**
 * ==========================================================================
 * Módulo 7: Paradigmas Gramaticais & Esquemas Visuais
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 7: Paradigmas Gramaticais & Esquemas');
const { appJs, greekData } = loadSourceFiles();
const {
  getStaticParadigmTableHTML,
  getStaticDiagramHTML,
  updateParadigmsVisibility,
  renderParadigmSkeleton,
  renderTableView,
  checkParadigmAnswers,
  resetParadigmBoard,
} = require('../js/modules/paradigms.js');

suite.test('Capítulos de Grego contêm estruturas de paradigmas válidas', () => {
  const chaptersWithParadigms = greekData.filter(c => c.paradigms && c.paradigms.length > 0);
  assert.isGreaterThan(chaptersWithParadigms.length, 0, 'Deve haver ao menos um capítulo de grego com paradigmas');

  chaptersWithParadigms.forEach(chap => {
    chap.paradigms.forEach(p => {
      assert.isTrue(typeof p.title === 'string' && p.title.trim().length > 0, 'Paradigma deve ter título');
      assert.isTrue(p.type === 'table' || p.type === 'diagram', 'Paradigma deve ser tipo table ou diagram');
      if (p.type === 'table') {
        assert.isArray(p.headers, 'Tabela de paradigma deve ter headers');
        assert.isArray(p.rows, 'Tabela de paradigma deve ter rows');
      }
    });
  });
});

suite.test('getStaticParadigmTableHTML gera marcação HTML estruturada com headers e rows', () => {
  const tableParadigm = greekData
    .flatMap(c => c.paradigms || [])
    .find(p => p.type === 'table');

  assert.isTrue(!!tableParadigm, 'Deve existir um paradigma do tipo table no dataset de grego');
  const html = getStaticParadigmTableHTML(tableParadigm);

  assert.isTrue(typeof html === 'string' && html.length > 50, 'Deve gerar string HTML não-vazia');
  assert.includes(html, '<table', 'Deve conter tag table');
  assert.includes(html, '<thead', 'Deve conter thead com cabeçalhos');
  assert.includes(html, '<tbody', 'Deve conter tbody com linhas');
  tableParadigm.headers.forEach(h => {
    assert.includes(html, h, `Deve renderizar header: ${h}`);
  });
});

suite.test('getStaticDiagramHTML gera visualização diagramada com nós posicionados', () => {
  const diagramParadigm = greekData
    .flatMap(c => c.paradigms || [])
    .find(p => p.type === 'diagram');

  if (diagramParadigm) {
    const html = getStaticDiagramHTML(diagramParadigm);
    assert.isTrue(typeof html === 'string' && html.length > 50, 'Deve gerar string HTML do diagrama');
    assert.includes(html, 'diagram', 'Deve conter classes de diagrama');
  }
});

suite.test('Declaração e exportação das funções de paradigmas no módulo e app.js', () => {
  assert.isFunction(getStaticParadigmTableHTML);
  assert.isFunction(getStaticDiagramHTML);
  assert.isFunction(updateParadigmsVisibility);
  assert.isFunction(renderParadigmSkeleton);
  assert.isFunction(renderTableView);
  assert.isFunction(checkParadigmAnswers);
  assert.isFunction(resetParadigmBoard);

  assert.includes(appJs, 'function getStaticParadigmTableHTML', 'getStaticParadigmTableHTML ausente no app.js');
  assert.includes(appJs, 'function getStaticDiagramHTML', 'getStaticDiagramHTML ausente no app.js');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
