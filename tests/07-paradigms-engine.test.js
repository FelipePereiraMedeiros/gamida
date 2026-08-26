/**
 * ==========================================================================
 * Módulo 7: Paradigmas Gramaticais & Esquemas Visuais
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 7: Paradigmas Gramaticais & Esquemas');
const { appJs, greekData, hebrewData } = loadSourceFiles();

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

suite.test('Regra de negócio: Paradigmas são ocultos em Hebraico e exibidos em Grego', () => {
  assert.includes(appJs, 'updateParadigmsVisibility', 'updateParadigmsVisibility ausente');
  assert.includes(appJs, 'if (AppState.language === "hebrew")', 'Verificação de idioma para paradigmas ausente');
  assert.includes(appJs, 'btnParadigms.style.display = "none"', 'Ocultação de paradigmas em hebraico ausente');
});

suite.test('Funções de renderização estática e interativa de paradigmas declaradas', () => {
  assert.includes(appJs, 'function getStaticParadigmTableHTML', 'getStaticParadigmTableHTML ausente');
  assert.includes(appJs, 'function getStaticDiagramHTML', 'getStaticDiagramHTML ausente');
  assert.includes(appJs, 'function renderParadigmSkeleton', 'renderParadigmSkeleton ausente');
  assert.includes(appJs, 'function renderTableView', 'renderTableView ausente');
  assert.includes(appJs, 'function checkParadigmAnswers', 'checkParadigmAnswers ausente');
  assert.includes(appJs, 'function resetParadigmBoard', 'resetParadigmBoard ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
