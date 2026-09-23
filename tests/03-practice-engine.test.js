/**
 * ==========================================================================
 * Módulo 3: Motor de Prática, Modos de Exercício & Distratores
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 3: Motor de Prática & Modos de Exercício');
const { appJs, hebrewData } = loadSourceFiles();

// Funções puras e estado importados do módulo de produção
const { shuffleArray, buildDistractorCache, AppState } = require('../js/modules/state.js');

suite.test('shuffleArray embaralha mantendo todos os elementos', () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled = shuffleArray(original);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
});

suite.test('buildDistractorCache extrai palavras e frases únicas para distratores', () => {
  AppState.chapters = hebrewData;
  buildDistractorCache();
  const cache = AppState.distractorCache;
  assert.isArray(cache.words, 'Cache de palavras deve ser um Array');
  assert.isGreaterThan(cache.words.length, 10, 'Deve conter palavras no cache');
  assert.isArray(cache.sentences, 'Cache de frases deve ser um Array');
  
  // Garantir que não há duplicatas
  const uniqueWords = new Set(cache.words);
  assert.equal(cache.words.length, uniqueWords.size, 'Não pode haver duplicatas no cache de palavras');
});

suite.test('Funções essenciais do motor de prática estão declaradas no app.js', () => {
  assert.includes(appJs, 'function buildPracticeQueue', 'buildPracticeQueue não encontrada');
  assert.includes(appJs, 'function renderCurrentQuestion', 'renderCurrentQuestion não encontrada');
  assert.includes(appJs, 'function checkPracticeAnswer', 'checkPracticeAnswer não encontrada');
  assert.includes(appJs, 'function setExerciseMode', 'setExerciseMode não encontrada');
  assert.includes(appJs, 'function nextQuestion', 'nextQuestion não encontrada');
  assert.includes(appJs, 'function resetStats', 'resetStats não encontrada');
  assert.includes(appJs, 'function setPracticeCumulative', 'setPracticeCumulative não encontrada');
  assert.includes(appJs, 'function setPracticeCategory', 'setPracticeCategory não encontrada');
  assert.includes(appJs, 'function getAvailablePracticeCategories', 'getAvailablePracticeCategories não encontrada');
});

suite.test('Modos de exercício (typing, choice, sentences) são suportados', () => {
  assert.includes(appJs, '"typing"', 'Modo typing não suportado');
  assert.includes(appJs, '"choice"', 'Modo choice não suportado');
  assert.includes(appJs, '"sentences"', 'Modo sentences não suportado');
});

suite.test('Pontuação e streak são calculados corretamente conforme o modo', () => {
  // Frases dão 20 pontos, palavras dão 10 pontos
  assert.includes(appJs, 'AppState.score += AppState.exerciseMode === "sentences" ? 20 : 10;');
  assert.includes(appJs, 'AppState.streak++;');
});

suite.test('Filtro dinâmico identifica apenas categorias disponíveis na lição atual (modo normal)', () => {
  const { WORD_CATEGORIES, matchItemCategory, getAvailablePracticeCategories } = require('../js/modules/state.js');
  
  // Configura capítulo 5 de Hebraico (sem verbos, apenas substantivos, adjetivos, partículas)
  AppState.chapters = hebrewData;
  AppState.currentChapter = hebrewData.find(c => c.id === 'kelley_05');
  AppState.isPracticeCumulative = false;
  AppState.exerciseMode = 'typing';

  const result = getAvailablePracticeCategories(AppState);
  assert.isGreaterThan(result.total, 0, 'Deve conter palavras na lição 5');
  
  // Deve conter Substantivo e não deve conter Verbo
  const hasSubst = result.categories.some(c => c.id === 'substantivo');
  const hasVerbo = result.categories.some(c => c.id === 'verbo');
  assert.isTrue(hasSubst, 'Lição 5 possui substantivos e deve exibi-los no filtro');
  assert.isFalse(hasVerbo, 'Lição 5 NÃO possui verbos e não deve exibi-los no filtro');
});

suite.test('Filtro dinâmico no modo acumulativo agrega categorias das lições anteriores', () => {
  const { getAvailablePracticeCategories } = require('../js/modules/state.js');
  
  AppState.chapters = hebrewData;
  AppState.currentChapter = hebrewData.find(c => c.id === 'kelley_05');
  AppState.isPracticeCumulative = false;
  AppState.exerciseMode = 'typing';

  const normalResult = getAvailablePracticeCategories(AppState);
  AppState.isPracticeCumulative = true;
  const cumulativeResult = getAvailablePracticeCategories(AppState);

  assert.isTrue(cumulativeResult.total >= normalResult.total, 'Total acumulado deve ser maior ou igual ao normal');
  // Alfabeto não deve aparecer como categoria no acumulado se capítulo > 1
  assert.isFalse(cumulativeResult.categories.some(c => c.id === 'consoante'), 'Não deve conter consoantes de alfabeto');
});

suite.test('Filtro por categoria selecionada refina itens do vocabulário', () => {
  const { matchItemCategory } = require('../js/modules/state.js');
  const nounItem = { hebrew: 'בַּיִת', type: 'Substantivo' };
  const verbItem = { hebrew: 'אָמַר', type: 'Verbo' };

  assert.isTrue(matchItemCategory(nounItem, 'substantivo'), 'Deve aceitar substantivo');
  assert.isFalse(matchItemCategory(verbItem, 'substantivo'), 'Não deve aceitar verbo quando filtrado por substantivo');
  assert.isTrue(matchItemCategory(verbItem, 'all'), 'Deve aceitar qualquer item quando categoria é "all"');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
