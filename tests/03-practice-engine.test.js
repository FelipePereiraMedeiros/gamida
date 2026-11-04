/**
 * ==========================================================================
 * Módulo 3: Motor de Prática, Modos de Exercício & Distratores
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 3: Motor de Prática & Modos de Exercício');
const { appJs, hebrewData } = loadSourceFiles();

// Funções puras e estado importados do módulo de produção
const { shuffleArray, buildDistractorCache, AppState, resetStats } = require('../js/modules/state.js');

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

suite.test('Modo de exercício de favoritas (favorites) é suportado no app.js', () => {
  assert.includes(appJs, '"favorites"', 'Modo favorites não suportado no app.js');
  assert.includes(appJs, 'AppState.exerciseMode === "favorites"', 'Verificação do modo favorites ausente no app.js');
});

suite.test('Pontuação e streak são calculados corretamente conforme o modo', () => {
  // Frases dão 20 pontos, palavras dão 10 pontos
  assert.isFalse(appJs.includes('AppState.score +='), 'A prática regular não usa pontos');
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

suite.test('resetStats zera todas as métricas da sessão', () => {
  AppState.score = 50;
  AppState.streak = 5;
  AppState.totalAnswered = 8;
  AppState.correctCount = 5;

  resetStats();

  assert.equal(AppState.score, 0, 'Score deve ser 0');
  assert.equal(AppState.streak, 0, 'Streak deve ser 0');
  assert.equal(AppState.totalAnswered, 0, 'totalAnswered deve ser 0');
  assert.equal(AppState.correctCount, 0, 'correctCount deve ser 0');
});

suite.test('Funções contextuais de modo, categoria, acumulativo e alfabeto disparam resetStats no app.js', () => {
  // setExerciseMode deve resetar
  assert.includes(appJs, 'function setExerciseMode', 'setExerciseMode declarada');
  const setExerciseMatch = appJs.match(/function setExerciseMode[\s\S]*?\{([\s\S]*?)\n\}/);
  assert.isTrue(!!setExerciseMatch && setExerciseMatch[1].includes('resetStats()'), 'setExerciseMode deve invocar resetStats()');

  // setPracticeCategory deve resetar
  const setCatMatch = appJs.match(/function setPracticeCategory[\s\S]*?\{([\s\S]*?)\n\}/);
  assert.isTrue(!!setCatMatch && setCatMatch[1].includes('resetStats()'), 'setPracticeCategory deve invocar resetStats()');

  // setPracticeCumulative deve resetar
  const setCumMatch = appJs.match(/function setPracticeCumulative[\s\S]*?\{([\s\S]*?)\n\}/);
  assert.isTrue(!!setCumMatch && setCumMatch[1].includes('resetStats()'), 'setPracticeCumulative deve invocar resetStats()');

  // setAlphabetSubmode deve resetar
  const setAlphaMatch = appJs.match(/function setAlphabetSubmode[\s\S]*?\{([\s\S]*?)\n\}/);
  assert.isTrue(!!setAlphaMatch && setAlphaMatch[1].includes('resetStats()'), 'setAlphabetSubmode deve invocar resetStats()');
});

suite.test('Métricas seguem acumulando quando a lista recomeça', () => {
  const start = appJs.indexOf('function checkPracticeAnswer(');
  const end = appJs.indexOf('function nextQuestion(');
  assert.isTrue(start > 0 && end > start, 'checkPracticeAnswer não encontrado');
  assert.isFalse(appJs.slice(start, end).includes('resetStats('), 'Responder não pode zerar as métricas da sessão');
  assert.isFalse(appJs.includes('isNewRoundPending'), 'Nova rodada não deve agendar reinício das métricas');
});

suite.test('AppState possui flag isPracticeAnswered e resetStats a reinicia para false', () => {
  assert.isDefined(AppState.isPracticeAnswered, 'isPracticeAnswered deve estar definido no AppState');
  AppState.isPracticeAnswered = true;
  resetStats();
  assert.isFalse(AppState.isPracticeAnswered, 'resetStats deve resetar isPracticeAnswered para false');
});

suite.test('Funções de transmutação de botão de ação (resetPracticeActionButtons, updatePracticeActionButtonToNext) existem no app.js', () => {
  assert.includes(appJs, 'function resetPracticeActionButtons', 'resetPracticeActionButtons não encontrada no app.js');
  assert.includes(appJs, 'function updatePracticeActionButtonToNext', 'updatePracticeActionButtonToNext não encontrada no app.js');
});

suite.test('submitAnswer e submitSentenceAnswer invocam nextQuestion quando isPracticeAnswered for verdadeiro', () => {
  assert.includes(appJs, 'if (AppState.isPracticeAnswered)', 'submitAnswer deve verificar isPracticeAnswered para avançar');
});

suite.test('Interceptador de teclado trata tecla Enter para envio e avanço contínuo no praticar', () => {
  assert.includes(appJs, 'isPracticeVisible && isStdPanelVisible && e.key === "Enter"', 'Interceptador de Enter no praticar ausente');
  assert.includes(appJs, 'if (AppState.isPracticeAnswered)', 'Enter após resposta deve verificar isPracticeAnswered');
});

suite.test('Seleção de capítulos específicos e ordenação (Primeira ➔ Última e Última ➔ Primeira) em Hebraico e Grego', () => {
  const { greekData } = loadSourceFiles();
  const {
    getSelectedChapters,
    setSelectedChapters,
    toggleChapterSelection,
    setChapterOrder,
  } = require('../js/modules/state.js');

  // 1. Teste em Hebraico: selecionar capítulos específicos (ex: Lição 3, Lição 5 e Lição 8)
  AppState.language = 'hebrew';
  AppState.chapters = hebrewData;
  setChapterOrder('asc', AppState);
  setSelectedChapters(['kelley_03', 'kelley_05', 'kelley_08'], AppState);

  const hebAsc = getSelectedChapters(AppState);
  assert.equal(hebAsc.length, 3, 'Deve retornar exatamente os 3 capítulos selecionados em hebraico');
  assert.deepEqual(
    hebAsc.map((c) => c.id),
    ['kelley_03', 'kelley_05', 'kelley_08'],
    'Ordem crescente (asc) deve ir do capítulo menor ao maior',
  );

  // Inverter para Última ➔ Primeira (desc)
  setChapterOrder('desc', AppState);
  const hebDesc = getSelectedChapters(AppState);
  assert.deepEqual(
    hebDesc.map((c) => c.id),
    ['kelley_08', 'kelley_05', 'kelley_03'],
    'Ordem decrescente (desc) deve ir do capítulo maior ao menor',
  );

  // Alternar capítulo específico via toggleChapterSelection
  toggleChapterSelection('kelley_05', AppState);
  const hebAfterToggle = getSelectedChapters(AppState);
  assert.deepEqual(
    hebAfterToggle.map((c) => c.id),
    ['kelley_08', 'kelley_03'],
    'toggleChapterSelection deve remover kelley_05 mantendo ordem desc',
  );

  // 2. Teste em Grego: selecionar capítulos específicos (ex: Cap 2, Cap 6 e Cap 13)
  AppState.language = 'greek';
  AppState.chapters = greekData;
  setChapterOrder('asc', AppState);
  setSelectedChapters(['bergmann_02', 'bergmann_06', 'bergmann_13'], AppState);

  const grkAsc = getSelectedChapters(AppState);
  assert.deepEqual(
    grkAsc.map((c) => c.id),
    ['bergmann_02', 'bergmann_06', 'bergmann_13'],
    'Ordem crescente no Grego deve ir do capítulo menor ao maior',
  );

  setChapterOrder('desc', AppState);
  const grkDesc = getSelectedChapters(AppState);
  assert.deepEqual(
    grkDesc.map((c) => c.id),
    ['bergmann_13', 'bergmann_06', 'bergmann_02'],
    'Ordem decrescente no Grego deve ir do capítulo maior ao menor',
  );

  // Reset para estado padrão limpo
  setChapterOrder('asc', AppState);
  AppState.selectedChapterIds = [];
});

suite.test('A lista é embaralhada de novo ao recomeçar uma rodada', () => {
  assert.includes(appJs, 'function reshufflePracticeQueue', 'reshufflePracticeQueue ausente');
  const start = appJs.indexOf('if (AppState.currentQuestionIndex >= practiceQueue.length)');
  assert.isTrue(start > 0 && appJs.slice(start, start + 220).includes('reshufflePracticeQueue();'), 'Nova rodada deve embaralhar a fila');
});

suite.test('Selecionar todos marca os capítulos de vocabulário e desmarcar mantém o primeiro', () => {
  const { getSelectedChapters, setSelectedChapters, toggleAllChapterSelection } = require('../js/modules/state.js');
  AppState.language = 'hebrew';
  AppState.chapters = hebrewData;
  const vocabIds = hebrewData.filter((c) => c.id !== 'kelley_01').map((c) => c.id);

  setSelectedChapters(['kelley_03', 'kelley_05'], AppState);
  toggleAllChapterSelection(AppState);
  assert.deepEqual(
    getSelectedChapters(AppState, { order: 'asc' }).map((c) => c.id),
    vocabIds,
    'Seleção parcial deve passar a todos os capítulos, sem o alfabeto',
  );
  assert.equal(AppState.isPracticeCumulative, true, 'Todos os capítulos formam sessão combinada');

  toggleAllChapterSelection(AppState);
  assert.deepEqual(
    getSelectedChapters(AppState).map((c) => c.id),
    [vocabIds[0]],
    'Desmarcar todos deve manter somente o primeiro capítulo',
  );
  assert.equal(AppState.isPracticeCumulative, false, 'Um capítulo não forma sessão combinada');

  setSelectedChapters(['kelley_01'], AppState);
  toggleAllChapterSelection(AppState);
  assert.equal(getSelectedChapters(AppState).length, vocabIds.length, 'A partir do alfabeto deve marcar todos');
});

suite.test('Caixa de selecionar todos existe na lista com estado parcial e estilo próprio', () => {
  const fs = require('fs');
  const path = require('path');
  const uiJs = fs.readFileSync(path.join(__dirname, '../js/modules/ui.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../css/interface.css'), 'utf8');
  assert.includes(uiJs, 'id="chapter-select-all"', 'Caixa de selecionar todos ausente');
  assert.includes(uiJs, 'allBox.indeterminate = markedCount > 0 && !allMarked', 'Estado parcial ausente');
  assert.includes(css, '.chapter-option__box:indeterminate', 'Estilo do estado parcial ausente');
  assert.equal(css.includes('accent-color'), false, 'Caixas devem usar o estilo próprio do tema');
});

suite.test('Resumo da rodada conta acertos e erros e compara rodadas do mesmo tamanho', () => {
  const { getRoundSummary, startNewRound } = require('../js/modules/state.js');
  const miss = { hebrew: 'בַּיִת', translations: ['casa'] };
  const state = { totalAnswered: 4, correctCount: 3, roundMisses: [miss], previousRound: null };

  const first = getRoundSummary(state);
  assert.equal(first.wrong, 1, 'Erros são as respostas sem acerto');
  assert.equal(first.accuracy, 75, 'Precisão vale para a rodada');
  assert.equal(first.delta, null, 'A primeira rodada não tem comparação');
  assert.deepEqual(first.misses, [miss], 'Resumo lista os termos errados');

  startNewRound(state);
  assert.equal(state.totalAnswered, 0, 'Nova rodada zera as respostas');
  assert.equal(state.correctCount, 0, 'Nova rodada zera os acertos');
  assert.equal(state.roundMisses.length, 0, 'Nova rodada limpa os erros');

  state.totalAnswered = 4;
  state.correctCount = 4;
  assert.equal(getRoundSummary(state).delta, 1, 'Compara com a rodada anterior');

  state.totalAnswered = 5;
  assert.equal(getRoundSummary(state).delta, null, 'Rodadas de tamanhos diferentes não se comparam');
});

suite.test('Fim da lista mostra o resumo em vez de recomeçar sem avisar', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.includes(html, 'id="round-summary"', 'Resumo da rodada ausente');
  assert.includes(html, 'id="round-tally"', 'Contagem da rodada ausente');
  assert.includes(html, 'onclick="restartPracticeRound()"', 'Botão de praticar de novo ausente');
  assert.includes(html, 'id="btn-round-errors"', 'Botão de praticar os erros ausente');
  const start = appJs.indexOf('if (AppState.currentQuestionIndex >= practiceQueue.length)');
  assert.isTrue(start > 0 && appJs.slice(start, start + 200).includes('showRoundSummary();'), 'Fim da lista deve abrir o resumo');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
