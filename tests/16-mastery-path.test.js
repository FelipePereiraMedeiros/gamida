/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 16: Caminho do Domínio
 * ==========================================================================
 */

const { TestSuite, assert, MockLocalStorage, loadSourceFiles } = require('./test-utils');
const Path = require('../js/modules/mastery-path.js');

const suite = new TestSuite('Módulo 16: Caminho do Domínio');
const { html, appJs, greekData, hebrewData } = loadSourceFiles();

const chapters = [
  { id: 'alfa', title: 'Lição 1 - O Alfabeto Grego', items: [{ term: 'α', translations: ['alfa'] }] },
  { id: 'c1', title: 'Cap 1', items: [
    { term: 'λόγος', translations: ['palavra'] },
    { term: 'θεός', translations: ['deus'] },
    { term: 'λόγος', translations: ['palavra'] },
  ], sentences: [{ term: 'ὁ λόγος', translations: ['a palavra'] }] },
  { id: 'vazio', title: 'Sem termos', items: [] },
  { id: 'c2', title: 'Cap 2', items: [{ term: 'ἄνθρωπος', translations: ['homem'] }] },
  { id: 'c3', title: 'Cap 3', items: [{ term: 'κόσμος', translations: ['mundo'] }] },
];

function withStorage(fn) {
  const previous = global.localStorage;
  global.localStorage = new MockLocalStorage();
  try { return fn(); } finally { global.localStorage = previous; }
}

/** Responde certo ou errado ao termo atual */
function answer(session, correct) {
  const item = session.queue[session.index];
  return Path.answerSession(session, correct ? item.translations[0] : 'resposta errada');
}

suite.test('Caminho ignora o alfabeto e capítulos sem termos, na ordem do livro', () => {
  assert.deepEqual(Path.getPathChapters(chapters).map((c) => c.id), ['c1', 'c2', 'c3']);
  assert.isGreaterThan(Path.getPathChapters(greekData).length, 15);
  assert.isGreaterThan(Path.getPathChapters(hebrewData).length, 5);
});

suite.test('Só termos entram no capítulo, sem frases e sem duplicatas', () => {
  const terms = Path.getChapterTerms(chapters[1]).map((t) => t.term);
  assert.deepEqual(terms.sort(), ['θεός', 'λόγος'].sort());
});

suite.test('Primeiro capítulo liberado; os seguintes ficam bloqueados até concluir o anterior', () => {
  const st = Path.getPathStatus(chapters, []);
  assert.deepEqual(st.map((s) => s.status), ['open', 'locked', 'locked']);
  const after = Path.getPathStatus(chapters, ['c1']);
  assert.deepEqual(after.map((s) => s.status), ['done', 'open', 'locked']);
});

suite.test('Acertar todos os termos conclui o capítulo', () => {
  const s = Path.createSession(chapters[1]);
  assert.equal(s.queue.length, 2);
  answer(s, true);
  assert.equal(Path.advanceSession(s), 'next');
  answer(s, true);
  assert.equal(Path.advanceSession(s), 'completed');
  assert.isTrue(s.completed);
});

suite.test('Um erro recomeça o capítulo do zero, embaralhado e com nova tentativa', () => {
  const s = Path.createSession(chapters[1]);
  answer(s, true);
  Path.advanceSession(s);
  const res = answer(s, false);
  assert.equal(res.status, 'incorrect');
  assert.equal(Path.advanceSession(s), 'restart');
  assert.equal(s.index, 0);
  assert.equal(s.attempt, 2);
  assert.equal(s.queue.length, 2, 'Todos os termos voltam para a fila');
  assert.isTrue(!s.failed, 'A nova tentativa começa limpa');
});

suite.test('Recomeço muda a ordem dos termos quando há mais de um', () => {
  let changed = 0;
  for (let i = 0; i < 20; i++) {
    const s = Path.createSession(chapters[1]);
    const before = s.queue.map((t) => t.term).join('|');
    answer(s, false);
    Path.advanceSession(s);
    if (s.queue.map((t) => t.term).join('|') !== before) changed++;
  }
  assert.equal(changed, 20, 'Com 2 termos, a nova ordem deve ser sempre diferente');
});

suite.test('Erro de digitação é aceito, como no Praticar', () => {
  const s = Path.createSession({ id: 'x', title: 'x', items: [{ term: 'λόγος', translations: ['palavra'] }] });
  assert.equal(Path.answerSession(s, 'palavr').status, 'typo');
  assert.equal(Path.advanceSession(s), 'completed');
});

suite.test('Concluir salva o progresso por idioma e devolve o próximo capítulo', () => {
  withStorage(() => {
    const next = Path.markCompleted('greek', chapters, 'c1');
    assert.equal(next.id, 'c2');
    assert.deepEqual(Path.loadCompleted('greek'), ['c1']);
    assert.deepEqual(Path.loadCompleted('hebrew'), []);
    assert.equal(Path.markCompleted('greek', chapters, 'c3'), null, 'Último capítulo não tem próximo');
  });
});

suite.test('Backup une o progresso dos dois dispositivos, sem perder nenhum lado', () => {
  withStorage(() => {
    Path.saveCompleted('greek', ['c1', 'c3']);
    assert.equal(Path.mergeCompleted('greek', ['c2', 'c3', 'c2']), 1, 'Só o capítulo novo conta');
    assert.deepEqual(Path.loadCompleted('greek'), ['c1', 'c3', 'c2']);
    assert.equal(Path.mergeCompleted('greek', ['c1']), 0, 'Backup antigo não remove nada');
    assert.deepEqual(Path.loadCompleted('greek'), ['c1', 'c3', 'c2']);
    assert.deepEqual(Path.loadCompleted('hebrew'), [], 'O progresso é separado por idioma');
  });
});

suite.test('Backup ignora dados inválidos do Caminho', () => {
  withStorage(() => {
    Path.saveCompleted('greek', ['c1']);
    assert.equal(Path.mergeCompleted('greek', [null, 7, '', { id: 'c2' }]), 0);
    assert.equal(Path.mergeCompleted('greek', 'c2'), 0, 'Backups sem lista são ignorados');
    assert.deepEqual(Path.loadCompleted('greek'), ['c1']);
  });
});

suite.test('Exportar e importar backup incluem o Caminho do domínio', () => {
  assert.includes(appJs, 'masteryPath: pathModule ? pathModule.loadCompleted(AppState.language) : []');
  assert.includes(appJs, 'pathModule.mergeCompleted(AppState.language, parsed.masteryPath)');
});

suite.test('Avaliar tem o cartão e as telas do Caminho do domínio', () => {
  ['onclick="openMasteryPath()"', 'id="path-overview"', 'id="path-chapter-list"', 'id="path-active"',
    'id="path-input"', 'id="path-feedback"', 'id="path-complete"', 'js/modules/mastery-path.js']
    .forEach((needle) => assert.includes(html, needle, `Falta ${needle} no index.html`));
  assert.includes(appJs, 'MasteryPathModule');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
