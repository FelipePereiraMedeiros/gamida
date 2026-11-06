/**
 * ==========================================================================
 * Módulo 2: Motor de Avaliação Linguística & Normalização de Texto
 * ==========================================================================
 */

const { TestSuite, assert } = require('./test-utils');

const suite = new TestSuite('Módulo 2: Motor de Avaliação Linguística');

// Funções puras importadas diretamente do módulo de produção
const {
  normalizeText,
  getEditDistance,
  evaluateAnswer,
  escapeHTML,
} = require('../js/modules/evaluation.js');

// Testes Unitários do Módulo 2
suite.test('normalizeText remove acentos, pontuação e espaços redundantes', () => {
  assert.equal(normalizeText('Coração, Alma!'), 'coracao alma');
  assert.equal(normalizeText('   EM    PAZ...   '), 'em paz');
  assert.equal(normalizeText('ágape (amor)'), 'agape amor');
  assert.equal(normalizeText(''), '');
});

suite.test('getEditDistance calcula a distância de Levenshtein corretamente', () => {
  assert.equal(getEditDistance('casa', 'casa'), 0);
  assert.equal(getEditDistance('casa', 'caza'), 1);
  assert.equal(getEditDistance('livro', 'livros'), 1);
  assert.equal(getEditDistance('homem', 'mulher'), 5);
});

suite.test('evaluateAnswer valida correspondência exata', () => {
  const result = evaluateAnswer('rei', ['rei', 'o rei']);
  assert.equal(result.status, 'correct');
});

suite.test('evaluateAnswer tolera insensibilidade a maiúsculas e acentos', () => {
  const result = evaluateAnswer('Graca', ['graça']);
  assert.equal(result.status, 'correct');
});

suite.test('evaluateAnswer lida com opções opcionais entre parênteses', () => {
  // Se a tradução cadastrada for "(ele) disse" ou "falou (com)"
  const res1 = evaluateAnswer('disse', ['(ele) disse']);
  assert.equal(res1.status, 'correct');

  const res2 = evaluateAnswer('ele disse', ['(ele) disse']);
  assert.equal(res2.status, 'correct');
});

suite.test('evaluateAnswer detecta inversão de palavras como aceitável com aviso de typo', () => {
  const res = evaluateAnswer('Deus de paz', ['paz de Deus']);
  assert.equal(res.status, 'typo');
});

suite.test('evaluateAnswer rejeita inversão sintática em frases completas (> 3 palavras ou isSentence)', () => {
  const resLong = evaluateAnswer('o rei viu o homem', ['o homem viu o rei']);
  assert.equal(resLong.status, 'incorrect');
  const resOpt = evaluateAnswer('Deus ama', ['ama Deus'], { isSentence: true });
  assert.equal(resOpt.status, 'incorrect');
});

suite.test('evaluateAnswer tolera pequenos erros de digitação (1 caractere)', () => {
  const res = evaluateAnswer('palvra', ['palavra']);
  assert.equal(res.status, 'typo');
});

suite.test('evaluateAnswer lida com entradas nulas ou indefinidas defensivamente', () => {
  const resNull = evaluateAnswer(null, ['rei']);
  assert.equal(resNull.status, 'incorrect');

  const resUndef = evaluateAnswer(undefined, ['rei']);
  assert.equal(resUndef.status, 'incorrect');
});

suite.test('Partículas sem tradução direta (μέν, ἄν) aceitam resposta vazia', () => {
  assert.equal(evaluateAnswer('', ['partícula usada correlativamente']).status, 'correct');
  assert.equal(evaluateAnswer('   ', ['partícula que denota condição ou eventualidade']).status, 'correct');
  assert.equal(evaluateAnswer('', ['partícula usada correlativamente'], { isSentence: false }).status, 'correct');
  // Termos com tradução real continuam exigindo resposta
  assert.equal(evaluateAnswer('', ['se']).status, 'incorrect');
  assert.equal(evaluateAnswer('', ['mas', 'porém']).status, 'incorrect');
  // Opção explícita
  assert.equal(evaluateAnswer('', ['qualquer'], { allowEmpty: true }).status, 'correct');
  // Resposta errada não vazia continua incorreta
  assert.equal(evaluateAnswer('casa', ['partícula usada correlativamente']).status, 'incorrect');
});

suite.test('escapeHTML sanitiza caracteres especiais contra DOM XSS', () => {
  assert.equal(escapeHTML('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHTML('O "rei" & a \'rainha\''), 'O &quot;rei&quot; &amp; a &#039;rainha&#039;');
  assert.equal(escapeHTML(null), '');
  assert.equal(escapeHTML(undefined), '');
});

suite.test('evaluateAnswer aceita múltiplas traduções separadas por vírgula', () => {
  assert.equal(evaluateAnswer('rei, o rei', ['rei', 'o rei']).status, 'correct');
  assert.equal(evaluateAnswer('graca; favor', ['graça', 'favor']).status, 'correct');
  assert.equal(evaluateAnswer('graça/favor', ['graça', 'favor']).status, 'correct');
  assert.equal(evaluateAnswer('rei,', ['rei']).status, 'correct');
});

suite.test('evaluateAnswer rejeita lista com alguma tradução inválida', () => {
  assert.equal(evaluateAnswer('rei, cachorro', ['rei', 'o rei']).status, 'incorrect');
});

suite.test('evaluateAnswer sinaliza typo quando uma das partes tem erro de digitação', () => {
  assert.equal(evaluateAnswer('palvra, verbo', ['palavra', 'verbo']).status, 'typo');
});

suite.test('evaluateAnswer preserva traduções cadastradas que contêm vírgula', () => {
  assert.equal(evaluateAnswer('Senhor, a quem iremos?', ['Senhor, a quem iremos?']).status, 'correct');
  assert.equal(evaluateAnswer('moises, servo do senhor', ['moisés, servo do senhor']).status, 'correct');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
