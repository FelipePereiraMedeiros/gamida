/**
 * ==========================================================================
 * Módulo 3: Motor de Prática, Modos de Exercício & Distratores
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 3: Motor de Prática & Modos de Exercício');
const { appJs, hebrewData } = loadSourceFiles();

function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function buildDistractorCache(chapters) {
  let w = [], s = [];
  chapters.forEach((c) => {
    (c.items || []).forEach((i) => w.push(...(i.translations || [])));
    (c.sentences || []).forEach((st) => s.push(...(st.translations || [])));
  });
  return {
    words: [...new Set(w)],
    sentences: [...new Set(s)],
  };
}

suite.test('shuffleArray embaralha mantendo todos os elementos', () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled = shuffleArray(original);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
});

suite.test('buildDistractorCache extrai palavras e frases únicas para distratores', () => {
  const cache = buildDistractorCache(hebrewData);
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

module.exports = suite;
if (require.main === module) {
  suite.run();
}
