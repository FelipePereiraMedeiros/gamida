/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 20: Chuva de Pedras (arcade de vocabulário)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 20: Chuva de Pedras');
const { html, hebrewData, greekData } = loadSourceFiles();
const {
  buildDeck, chapterShortLabel, headTerm, fallTime, maxStones, hitScore, comboAfterHit, levelAfterHit, MIN_DECK, LIVES,
} = require('../js/modules/stone-rain.js');
const { getTerm } = require('../js/modules/state.js');

suite.test('Baralho cobre o vocabulário de todas as lições, nos dois idiomas', () => {
  [hebrewData, greekData].forEach((chapters) => {
    const deck = buildDeck(chapters);
    const terms = new Set(chapters.flatMap((c) => (c.items || []).map(getTerm)));
    assert.equal(deck.length, terms.size, 'Cada termo do material entra uma vez');
    assert.equal(new Set(deck.map((w) => w.term)).size, deck.length, 'Sem termos repetidos');
    assert.deepEqual(deck.map((w) => w.id), deck.map((_, i) => i), 'Identificadores em sequência');
    deck.forEach((w) => assert.isTrue(!!w.head && !!w.pt && !!w.chapterLabel, `Pedra incompleta: ${w.term}`));
    const lessons = new Set(deck.map((w) => w.chapterId));
    chapters.forEach((c) => assert.isTrue(lessons.has(c.id), `Lição fora do jogo: ${c.title}`));
  });
});

suite.test('Baralho respeita as lições escolhidas e o filtro de erros', () => {
  const two = hebrewData.slice(1, 3);
  const deck = buildDeck(hebrewData, { chapterIds: two.map((c) => c.id) });
  assert.isTrue(deck.length > 0 && deck.every((w) => two.some((c) => c.id === w.chapterId)));
  assert.equal(buildDeck(hebrewData, { chapterIds: [] }).length, 0, 'Sem lição marcada não há pedras');

  const wrong = new Set(two[0].items.slice(0, 5).map(getTerm));
  const errorsOnly = buildDeck(hebrewData, { onlyErrors: true }, (item) => wrong.has(getTerm(item)));
  assert.deepEqual(errorsOnly.map((w) => w.term).sort(), Array.from(wrong).sort());
  assert.equal(buildDeck(hebrewData, { onlyErrors: true }).length, 0, 'Sem lista de erros, o filtro esvazia o baralho');
});

suite.test('Rótulos cabem nos botões e nas pedras', () => {
  assert.equal(chapterShortLabel({ title: 'Lição XIV - Verbos: Troncos e Perfeito' }), 'XIV');
  assert.equal(chapterShortLabel({ title: 'Lição 12 - Verbos (1º Aoristo)' }), '12');
  assert.equal(chapterShortLabel({ title: 'Meu capítulo extra de revisão' }), 'Meu capítulo …');
  assert.equal(headTerm('πατήρ, πατρός, ὁ'), 'πατήρ');
  assert.equal(headTerm('δέ (δ\')'), 'δέ');
  assert.equal(headTerm('מֶלֶךְ'), 'מֶלֶךְ');
});

suite.test('A dificuldade cresce por fase, com piso e teto', () => {
  assert.equal(fallTime(1), 9.5);
  assert.isTrue(fallTime(5) < fallTime(1), 'Cai mais rápido nas fases altas');
  assert.equal(fallTime(50), 3.6, 'Nunca mais rápido que 3,6 s');
  assert.equal(maxStones(1), 1);
  assert.equal(maxStones(3), 2);
  assert.equal(maxStones(30), 4, 'No máximo quatro pedras na tela');
});

suite.test('Pontuação: multiplicador, bônus por rapidez e fases', () => {
  assert.equal(hitScore(1, 0), 10);
  assert.equal(hitScore(1, 1), 20, 'Acertar no alto rende o bônus inteiro');
  assert.equal(hitScore(4, 0.5), 45);
  assert.equal(hitScore(2, 9), 30, 'O bônus não passa de 10');
  assert.equal(comboAfterHit(1, 2), 1);
  assert.equal(comboAfterHit(1, 3), 2, 'Três acertos seguidos sobem o multiplicador');
  assert.equal(comboAfterHit(5, 15), 5, 'O multiplicador para em ×5');
  assert.equal(levelAfterHit(1, 7), 1);
  assert.equal(levelAfterHit(1, 8), 2, 'Oito acertos passam de fase');
  assert.equal(LIVES, 5);
  assert.equal(MIN_DECK, 4);
});

suite.test('Chuva de Pedras está ligada à tela de Avaliar', () => {
  assert.includes(html, 'onclick="openStoneRain()"', 'Cartão do modo ausente');
  assert.includes(html, 'id="stone-rain-view"', 'Tela do jogo ausente');
  assert.includes(html, 'id="sr-canvas"', 'Canvas ausente');
  assert.includes(html, 'js/modules/stone-rain.js', 'Módulo não carregado');
  assert.includes(html, 'js/modules/game-audio.js', 'Som dos jogos não carregado');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
