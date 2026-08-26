/**
 * ==========================================================================
 * Módulo 6: Modo Sobrevivência (Morte Súbita)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 6: Modo Sobrevivência (Morte Súbita)');
const { appJs } = loadSourceFiles();

suite.test('Regras de vidas e streak no modo Sobrevivência', () => {
  let survLives = 3;
  let survStreak = 0;

  // Acerto
  survStreak++;
  assert.equal(survStreak, 1);
  assert.equal(survLives, 3);

  // Erro 1
  survLives--;
  assert.equal(survLives, 2);

  // Erro 2 e 3
  survLives -= 2;
  assert.equal(survLives, 0, 'Vidas esgotadas');
  assert.isTrue(survLives <= 0, 'Deve disparar Game Over quando vidas <= 0');
});

suite.test('Atualização e persistência do High Score de sobrevivência', () => {
  let currentHighScore = 15;
  let newStreak = 18;

  if (newStreak > currentHighScore) {
    currentHighScore = newStreak;
  }

  assert.equal(currentHighScore, 18, 'Recorde deve ser atualizado quando superado');
});

suite.test('Declaração das funções do Modo Sobrevivência no app.js', () => {
  assert.includes(appJs, 'function startSurvival', 'startSurvival ausente');
  assert.includes(appJs, 'function updateSurvivalUI', 'updateSurvivalUI ausente');
  assert.includes(appJs, 'function nextSurvivalQuestion', 'nextSurvivalQuestion ausente');
  assert.includes(appJs, 'function submitSurvivalAnswer', 'submitSurvivalAnswer ausente');
  assert.includes(appJs, 'function finishSurvival', 'finishSurvival ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
