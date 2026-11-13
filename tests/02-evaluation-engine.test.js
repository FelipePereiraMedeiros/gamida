/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
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
  compareSentenceWords,
  getDisplayTranslations,
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

suite.test('Pronome-sujeito inicial é opcional, mas não pode ser trocado', () => {
  assert.equal(evaluateAnswer('circundou', ['ele circundou']).status, 'correct');
  assert.equal(evaluateAnswer('ele circundou', ['ele circundou']).status, 'correct');
  assert.equal(evaluateAnswer('estava cheio', ['estar cheio', 'ele estava cheio']).status, 'correct');
  // Trocar o pronome muda a pessoa/gênero: não é acerto nem erro de digitação
  assert.equal(evaluateAnswer('ela circundou', ['ele circundou']).status, 'incorrect');
  assert.equal(evaluateAnswer('guardaram', ['ele guardou']).status, 'incorrect');
  // O pronome sozinho continua sendo uma tradução normal
  assert.equal(evaluateAnswer('ele', ['ele']).status, 'correct');
});

suite.test('Pronome "se" vale antes ou depois do verbo', () => {
  assert.equal(evaluateAnswer('ajoelhou-se', ['ele se ajoelhou']).status, 'correct');
  assert.equal(evaluateAnswer('se ajoelhou', ['ele se ajoelhou']).status, 'correct');
  assert.equal(evaluateAnswer('ele ajoelhou-se', ['ele se ajoelhou']).status, 'correct');
  assert.equal(evaluateAnswer('se curvou', ['curvou-se']).status, 'correct');
});

suite.test('Preposição de regência no fim da glosa é opcional', () => {
  assert.equal(evaluateAnswer('fora', ['fora de']).status, 'correct');
  assert.equal(evaluateAnswer('estar prestes', ['estar prestes a']).status, 'correct');
  assert.equal(evaluateAnswer('apoderar-se', ['apoderar-se de', 'segurar']).status, 'correct');
  // Só a preposição final cai: o artigo ou preposição inicial pode mudar o sentido
  assert.equal(evaluateAnswer('saber', ['a saber']).status, 'incorrect');
  assert.equal(evaluateAnswer('de', ['de']).status, 'correct');
});

suite.test('Frases toleram até dois deslizes em palavras longas, nunca troca de gênero', () => {
  const accepted = ['pois davi descansou com seus antepassados'];
  assert.equal(evaluateAnswer('pois davi descançou com seus antepasados', accepted, { isSentence: true }).status, 'typo');
  assert.equal(evaluateAnswer('pois davi descançou com seos antepasados', accepted, { isSentence: true }).status, 'incorrect');
  assert.equal(evaluateAnswer('o menina bom', ['o menino bom'], { isSentence: true }).status, 'incorrect');
  assert.equal(evaluateAnswer('ela guardou a lei', ['ele guardou a lei'], { isSentence: true }).status, 'incorrect');
});

suite.test('compareSentenceWords aponta o que bateu, sobrou e faltou', () => {
  const diff = compareSentenceWords('Jesus disse a eles: eu sou pão da vida', [
    'No princípio era o Verbo',
    'Disse-lhes Jesus: Eu sou o pão da vida.',
  ]);
  assert.equal(diff.expected, 'Disse-lhes Jesus: Eu sou o pão da vida.', 'Deve escolher a tradução mais próxima');
  const missing = diff.expectedWords.filter((w) => !w.matched).map((w) => w.text);
  assert.deepEqual(missing, ['Disse-lhes', 'o']);
  const extra = diff.userWords.filter((w) => !w.matched).map((w) => w.text);
  assert.deepEqual(extra, ['disse', 'a', 'eles:']);
  assert.equal(compareSentenceWords('', ['algo']), null);
  assert.equal(compareSentenceWords('algo', []), null);
});

suite.test('getDisplayTranslations omite a grafia sem acento quando há a acentuada', () => {
  assert.deepEqual(getDisplayTranslations(['ceu', 'céu', 'céus']), ['céu', 'céus']);
  assert.deepEqual(getDisplayTranslations(['pai', 'ancestral']), ['pai', 'ancestral']);
  assert.deepEqual(getDisplayTranslations(['e']), ['e']);
  // A grafia sem acento continua aceita na correção
  assert.equal(evaluateAnswer('ceu', ['ceu', 'céu']).status, 'correct');
  assert.equal(evaluateAnswer('errado', ['ceu', 'céu']).expected, 'céu');
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
