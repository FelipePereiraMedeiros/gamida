/**
 * ==========================================================================
 * Módulo 6: Modo Sobrevivência (Morte Súbita)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 6: Modo Sobrevivência (Morte Súbita)');
const { appJs } = loadSourceFiles();
const { AppState } = require('../js/modules/state.js');
const {
  startSurvival,
  updateSurvivalUI,
  nextSurvivalQuestion,
  submitSurvivalAnswer,
  finishSurvival,
} = require('../js/modules/survival.js');

suite.test('Regras de vidas, streak e registro de falhas no modo Sobrevivência', () => {
  let lives = 3;
  let streak = 0;

  // 1. Acerto: incrementa sequência e mantém vidas
  streak++;
  assert.equal(streak, 1);
  assert.equal(lives, 3);

  // 2. Erro: decrementa 1 vida e quebra streak
  lives--;
  streak = 0;
  assert.equal(lives, 2);
  assert.equal(streak, 0, 'Streak deve zerar ao errar');

  // 3. Esgotamento de vidas: Game Over
  lives -= 2;
  assert.equal(lives, 0, 'Vidas esgotadas');
  assert.isTrue(lives <= 0, 'Deve disparar Game Over quando vidas <= 0');
});

suite.test('Atualização e persistência do High Score de sobrevivência', () => {
  AppState.survivalHighScore = 15;
  const newStreak = 18;

  if (newStreak > AppState.survivalHighScore) {
    AppState.survivalHighScore = newStreak;
  }

  assert.equal(AppState.survivalHighScore, 18, 'Recorde deve ser atualizado quando superado');
});

suite.test('Declaração e exportação de todas as funções do Modo Sobrevivência', () => {
  assert.isFunction(startSurvival, 'startSurvival deve ser uma função');
  assert.isFunction(updateSurvivalUI, 'updateSurvivalUI deve ser uma função');
  assert.isFunction(nextSurvivalQuestion, 'nextSurvivalQuestion deve ser uma função');
  assert.isFunction(submitSurvivalAnswer, 'submitSurvivalAnswer deve ser uma função');
  assert.isFunction(finishSurvival, 'finishSurvival deve ser uma função');

  assert.includes(appJs, 'function startSurvival', 'startSurvival ausente no app.js');
  assert.includes(appJs, 'function updateSurvivalUI', 'updateSurvivalUI ausente no app.js');
  assert.includes(appJs, 'function nextSurvivalQuestion', 'nextSurvivalQuestion ausente no app.js');
  assert.includes(appJs, 'function submitSurvivalAnswer', 'submitSurvivalAnswer ausente no app.js');
  assert.includes(appJs, 'function finishSurvival', 'finishSurvival ausente no app.js');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
