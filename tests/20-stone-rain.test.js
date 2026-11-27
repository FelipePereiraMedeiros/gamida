/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 20: Chuva de Pedras (arcade de vocabulário)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 20: Chuva de Pedras');
const { html, hebrewData, greekData, rootDir } = loadSourceFiles();
const {
  buildDeck, buildPhases, chaptersFrom, chaptersUpTo, speedLevel, phaseAfterClear,
  chapterShortLabel, headTerm, fallTime, maxStones, hitScore, comboAfterHit, MIN_DECK, LIVES,
} = require('../js/modules/stone-rain.js');
const { getTerm } = require('../js/modules/state.js');

suite.test('Baralho cobre o vocabulário de todas as lições, nos dois idiomas', () => {
  [hebrewData, greekData].forEach((chapters) => {
    const deck = buildDeck(chapters);
    const terms = new Set(chapters.filter((c) => !c.special).flatMap((c) => (c.items || []).map(getTerm)));
    assert.equal(deck.length, terms.size, 'Cada termo do material entra uma vez');
    assert.equal(new Set(deck.map((w) => w.term)).size, deck.length, 'Sem termos repetidos');
    assert.deepEqual(deck.map((w) => w.id), deck.map((_, i) => i), 'Identificadores em sequência');
    deck.forEach((w) => assert.isTrue(!!w.head && !!w.pt && !!w.chapterLabel, `Pedra incompleta: ${w.term}`));
    const lessons = new Set(deck.map((w) => w.chapterId));
    // Lições especiais (modos à parte) só entram quando escolhidas
    chapters.filter((c) => !c.special).forEach((c) => assert.isTrue(lessons.has(c.id), `Lição fora do jogo: ${c.title}`));
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
  assert.equal(LIVES, 5);
  assert.equal(MIN_DECK, 1);
});

suite.test('Cada fase é uma lição, na ordem do material, com o vocabulário inteiro dela', () => {
  // Lições especiais (modos à parte) só entram quando escolhidas
  [hebrewData, greekData].map((data) => data.filter((c) => !c.special)).forEach((chapters) => {
    const phases = buildPhases(chapters);
    assert.deepEqual(phases.map((p) => p.chapterId), chapters.map((c) => c.id), 'Uma fase por lição, na ordem do livro');
    phases.forEach((phase, index) => {
      const lesson = chapters[index];
      const terms = new Set((lesson.items || []).map(getTerm));
      assert.equal(phase.words.length, terms.size, `Fase ${phase.label} com o vocabulário completo da lição`);
      assert.isTrue(phase.words.every((w) => w.chapterId === lesson.id && terms.has(w.term)), 'Só palavras da própria lição');
      assert.equal(phase.label, chapterShortLabel(lesson));
      assert.equal(phase.title, lesson.title);
    });
    const ids = phases.flatMap((p) => p.words.map((w) => w.id));
    assert.equal(new Set(ids).size, ids.length, 'Identificadores únicos em toda a partida');
  });
});

suite.test('A partida pode começar em qualquer lição e segue a ordem do livro', () => {
  const start = hebrewData[9];
  const from = chaptersFrom(hebrewData, start.id);
  assert.equal(from[0], start.id);
  assert.equal(from.length, hebrewData.length - 9);
  assert.deepEqual(buildPhases(hebrewData, { chapterIds: from }).map((p) => p.chapterId), hebrewData.slice(9).map((c) => c.id));

  const upTo = chaptersUpTo(hebrewData, start.id);
  assert.equal(upTo.length, 10);
  assert.equal(upTo[upTo.length - 1], start.id);

  // Lições marcadas fora de ordem são jogadas na ordem do livro
  const picked = [hebrewData[12].id, hebrewData[3].id, hebrewData[7].id];
  assert.deepEqual(buildPhases(hebrewData, { chapterIds: picked }).map((p) => p.chapterId), [hebrewData[3].id, hebrewData[7].id, hebrewData[12].id]);
  assert.deepEqual(chaptersFrom(hebrewData, 'nao_existe'), hebrewData.map((c) => c.id), 'Ponto de partida desconhecido começa do início');
  assert.equal(buildPhases(hebrewData, { chapterIds: [] }).length, 0);
});

suite.test('Fase sem palavras erradas fica de fora quando o filtro está ligado', () => {
  const wrong = new Set([getTerm(hebrewData[2].items[0]), getTerm(hebrewData[5].items[1])]);
  const phases = buildPhases(hebrewData, { onlyErrors: true }, (item) => wrong.has(getTerm(item)));
  assert.deepEqual(phases.map((p) => p.chapterId), [hebrewData[2].id, hebrewData[5].id]);
  assert.isTrue(phases.every((p) => p.words.length === 1));
});

suite.test('A velocidade sobe por fase concluída, e a última fase volta à primeira', () => {
  assert.equal(speedLevel(0), 1, 'Começar na lição XX não começa rápido');
  assert.equal(speedLevel(4), 5);
  assert.equal(phaseAfterClear(0, 3), 1);
  assert.equal(phaseAfterClear(2, 3), 0, 'Depois da última, nova volta');
  assert.equal(phaseAfterClear(0, 1), 0);
});

suite.test('Digitando, as pedras caem mais devagar e em menor número', () => {
  [1, 4, 8, 20].forEach((level) => {
    assert.isTrue(fallTime(level, true) > fallTime(level), `Fase ${level}: mais tempo para digitar`);
    assert.isTrue(maxStones(level, true) <= maxStones(level), `Fase ${level}: não mais pedras que tocando`);
  });
  assert.equal(fallTime(1, true), 16);
  assert.equal(fallTime(60, true), 6.5, 'Nunca menos de 6,5 s para digitar');
  assert.equal(maxStones(60, true), 3, 'No máximo três pedras quando se digita');
  assert.equal(fallTime(3, false), fallTime(3), 'Sem o segundo argumento vale o modo de tocar');
});

suite.test('Hebraico e grego dos jogos usam as fontes do restante do sistema', () => {
  const fs = require('fs');
  const path = require('path');
  const games = fs.readFileSync(path.join(rootDir, 'css', 'games.css'), 'utf8');
  const system = fs.readFileSync(path.join(rootDir, 'css', 'styles.css'), 'utf8');
  const stackOf = (css, selector) => {
    const start = css.indexOf(selector);
    const match = start === -1 ? null : css.slice(start).match(/font-family:\s*([^;]+);/);
    return match ? match[1].replace(/\s+/g, ' ').trim() : null;
  };
  const hebrew = stackOf(system, '.hebrew-text,');
  const greek = stackOf(system, '.greek-text {');
  assert.isTrue(!!hebrew && !!greek, 'Fontes do sistema não encontradas em styles.css');
  assert.equal(stackOf(games, '.sc-wrap .hebrew-text {'), hebrew, 'Hebraico dos jogos com outra fonte');
  assert.equal(stackOf(games, '.sc-wrap .greek-text {'), greek, 'Grego dos jogos com outra fonte');
  // O desenho no canvas não passa pelo CSS: os módulos precisam citar as mesmas famílias
  ['stone-rain.js', 'scribe-chronicles.js'].forEach((file) => {
    const source = fs.readFileSync(path.join(rootDir, 'js', 'modules', file), 'utf8');
    assert.includes(source, hebrew, `${file}: canvas com outra fonte de hebraico`);
    assert.includes(source, greek, `${file}: canvas com outra fonte de grego`);
  });
});

suite.test('Chuva de Pedras está ligada à tela de Avaliar', () => {
  assert.includes(html, 'data-on-click="openStoneRain()"', 'Cartão do modo ausente');
  assert.includes(html, 'id="stone-rain-view"', 'Tela do jogo ausente');
  assert.includes(html, 'id="sr-canvas"', 'Canvas ausente');
  assert.includes(html, 'js/modules/stone-rain.js', 'Módulo não carregado');
  assert.includes(html, 'js/modules/game-audio.js', 'Som dos jogos não carregado');
  assert.includes(html, "stoneRainToggle('typing')", 'Opção de digitar a resposta ausente');
  assert.includes(html, 'id="sr-start"', 'Escolha da fase inicial ausente');
  assert.includes(html, 'data-on-change="stoneRainStartAt(this.value)"', 'Escolha da fase inicial não ligada');
});

suite.test('Lição especial só entra na Chuva quando escolhida, e então sozinha', () => {
  [hebrewData, greekData].forEach((data) => {
    // Lição especial de teste: as palavras de uma lição comum, repetidas num modo à parte
    const base = data.find((c) => (c.items || []).length >= 8 && c.id !== data[0].id);
    const exam = { id: 'licao_especial', title: 'Lição especial', special: 'exam', items: base.items.map((i) => ({ ...i })) };
    const chapters = [...data, exam];
    assert.isFalse(buildPhases(chapters).some((p) => p.chapterId === exam.id), 'a lição especial entrou sem ser escolhida');
    const only = buildPhases(chapters, { chapterIds: [exam.id] });
    assert.isTrue(only.length === 1 && only[0].chapterId === exam.id && only[0].words.length > 0, 'escolhida, a lição especial não virou fase');
  });
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
