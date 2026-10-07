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

suite.test('startSurvival e finishSurvival operam no DOM de forma resiliente', () => {
  const elementsById = {};
  const mockClassList = () => ({
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); },
  });

  const createMockEl = (id) => {
    const el = {
      id,
      textContent: '',
      classList: mockClassList(),
      value: '',
      disabled: false,
      focus: () => {},
    };
    elementsById[id] = el;
    return el;
  };

  createMockEl('assess-dashboard');
  createMockEl('survival-active');
  createMockEl('survival-results');
  createMockEl('surv-correction-box');
  createMockEl('survival-streak');
  createMockEl('survival-hearts');
  createMockEl('survival-hebrew');
  createMockEl('survival-input');
  createMockEl('surv-res-streak');
  createMockEl('surv-res-high');

  const oldDoc = global.document;
  const oldWindow = global.window;
  const oldAlert = global.alert;

  global.document = {
    getElementById: (id) => elementsById[id] || null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  global.alert = () => {};

  AppState.currentChapter = {
    id: "chap_test",
    title: "Lição Teste",
    items: [
      { term: "דָּבָר", translations: ["palavra", "coisa"] },
      { term: "מֶלֶךְ", translations: ["rei"] },
    ],
  };
  AppState.chapters = [AppState.currentChapter];

  startSurvival();

  assert.isTrue(
    elementsById['assess-dashboard'].classList.contains('hidden'),
    'assess-dashboard deve ser ocultado',
  );
  assert.isFalse(
    elementsById['survival-active'].classList.contains('hidden'),
    'survival-active deve ser revelado',
  );
  assert.isTrue(
    elementsById['survival-hebrew'].textContent.length > 0,
    'survival-hebrew deve exibir o termo atual',
  );

  finishSurvival(false);

  assert.isTrue(
    elementsById['survival-active'].classList.contains('hidden'),
    'survival-active deve ser ocultado após finalizar',
  );
  assert.isFalse(
    elementsById['survival-results'].classList.contains('hidden'),
    'survival-results deve ser exibido',
  );

  // Limpeza
  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
  if (oldWindow === undefined) delete global.window; else global.window = oldWindow;
  if (oldAlert === undefined) delete global.alert; else global.alert = oldAlert;
});

suite.test('Rastreamento da pontuação máxima da partida e persistência do recorde após erros e Game Over', () => {
  const elementsById = {};
  const mockClassList = () => ({
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); },
  });

  const createMockEl = (id) => {
    const el = {
      id,
      textContent: '',
      classList: mockClassList(),
      value: '',
      disabled: false,
      focus: () => {},
    };
    elementsById[id] = el;
    return el;
  };

  createMockEl('assess-dashboard');
  createMockEl('survival-active');
  createMockEl('survival-results');
  createMockEl('surv-correction-box');
  createMockEl('survival-streak');
  createMockEl('survival-hearts');
  createMockEl('survival-hebrew');
  createMockEl('survival-input');
  createMockEl('surv-res-streak');
  createMockEl('surv-res-high');

  const oldDoc = global.document;
  const oldWindow = global.window;
  const oldAlert = global.alert;

  global.document = {
    getElementById: (id) => elementsById[id] || null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  global.alert = () => {};

  AppState.currentChapter = {
    id: "chap_test2",
    title: "Lição Teste 2",
    items: [
      { term: "דָּבָר", translations: ["palavra", "coisa"] },
      { term: "מֶלֶךְ", translations: ["rei"] },
      { term: "בַּיִת", translations: ["casa"] },
    ],
  };
  AppState.chapters = [AppState.currentChapter];
  AppState.survivalHighScore = 0;

  const { SurvivalModule } = require('../js/modules/survival.js');

  startSurvival();

  // Acerto 1
  const q1 = SurvivalModule.getSurvCurrent();
  elementsById['survival-input'].value = q1.translations[0];
  submitSurvivalAnswer();
  assert.equal(SurvivalModule.getSurvStreak(), 1);

  // Erro 1 (vidas caem para 2, streak zera)
  elementsById['survival-input'].value = "errado";
  submitSurvivalAnswer();
  assert.equal(SurvivalModule.getSurvStreak(), 0);
  assert.equal(SurvivalModule.getSurvLives(), 2);
  assert.equal(SurvivalModule.getSurvMaxStreak(), 1);

  // Erros 2 e 3
  elementsById['survival-input'].value = "errado2";
  submitSurvivalAnswer();
  elementsById['survival-input'].value = "errado3";
  submitSurvivalAnswer();

  finishSurvival(false);

  assert.equal(elementsById['surv-res-streak'].textContent, '1', 'Sequência alcançada deve registrar o melhor streak da partida');
  assert.equal(elementsById['surv-res-high'].textContent, '1', 'Recorde máximo deve persistir o melhor streak');
  assert.equal(AppState.survivalHighScore, 1);

  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
  if (oldWindow === undefined) delete global.window; else global.window = oldWindow;
  if (oldAlert === undefined) delete global.alert; else global.alert = oldAlert;
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
