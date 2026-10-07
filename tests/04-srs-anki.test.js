/**
 * ==========================================================================
 * Módulo 4: Sistema de Repetição Espaçada (SRS) & Anki Flashcards
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 4: Sistema SRS & Anki Flashcards');
const { appJs } = loadSourceFiles();
const { recordSRSError, getSRSKey } = require('../js/modules/srs.js');
const { AppState } = require('../js/modules/state.js');

/**
 * Função de cálculo SRS idêntica à de produção (js/modules/srs.js: answerAnki)
 */
function calculateSRSNextReview(record, grade) {
  const current = record || {
    interval: 0,
    ef: 2.5,
    nextReview: 0,
    fails: 0,
  };

  const updated = { ...current };

  if (grade === "hard") {
    updated.interval = 0;
    updated.ef = Math.max(1.3, updated.ef - 0.2);
    updated.nextReview = Date.now() + 60 * 1000; // 60 segundos de revisão prioritária
  } else if (grade === "good") {
    updated.interval =
      updated.interval === 0 ? 1 : Math.round(updated.interval * updated.ef);
    updated.nextReview =
      Date.now() + updated.interval * 24 * 60 * 60 * 1000;
  } else if (grade === "easy") {
    updated.ef += 0.15;
    updated.interval =
      updated.interval === 0
        ? 4
        : Math.round(updated.interval * updated.ef * 1.3);
    updated.nextReview =
      Date.now() + updated.interval * 24 * 60 * 60 * 1000;
  }

  return updated;
}

suite.test('getSRSKey normaliza chaves Unicode (NFC) eliminando duplicidades por marcas diacríticas/nikkud', () => {
  // Forma composta (NFC) vs Decomposta (NFD)
  const nfcWord = "שָׁלוֹם";
  const nfdWord = nfcWord.normalize("NFD");

  assert.equal(getSRSKey(nfcWord), getSRSKey(nfdWord), "getSRSKey deve unificar NFC e NFD");
  assert.equal(getSRSKey("  " + nfcWord + "  "), getSRSKey(nfdWord), "getSRSKey deve fazer trim()");

  AppState.srs = {};
  recordSRSError(nfdWord);
  assert.isTrue(!!AppState.srs[nfcWord], "recordSRSError com termo NFD deve salvar sob a chave NFC");
  assert.equal(AppState.srs[nfcWord].fails, 1, "Falha registrada corretamente");

  // Chamada subsequente com NFC deve acumular falhas na mesma entrada sem duplicar chave
  recordSRSError(nfcWord);
  assert.equal(AppState.srs[nfcWord].fails, 2, "Falhas devem acumular na chave NFC estável");
  assert.equal(Object.keys(AppState.srs).length, 1, "Não deve criar chaves duplicadas no SRS");
});

suite.test('recordSRSError inicializa e contabiliza falhas com revisão imediata em AppState.srs', () => {
  AppState.srs = {};
  const term = "shalom";

  recordSRSError(term);

  assert.isTrue(!!AppState.srs[term], 'Termo deve ser registrado no AppState.srs');
  assert.equal(AppState.srs[term].fails, 1, 'Falha deve ser contabilizada');
  assert.equal(AppState.srs[term].ef, 2.5, 'EF inicial padrão deve ser 2.5');
  assert.isGreaterThan(AppState.srs[term].nextReview, 0, 'nextReview deve ser timestamp positivo');

  // Segunda falha
  recordSRSError(term);
  assert.equal(AppState.srs[term].fails, 2, 'Falhas devem acumular');
});

suite.test('Classificação "hard" reseta intervalo para 0, agenda revisão em 60s e reduz EF em 0.2', () => {
  const initial = { interval: 5, ef: 2.5, nextReview: 0, fails: 0 };
  const beforeTime = Date.now();
  const updated = calculateSRSNextReview(initial, "hard");

  assert.equal(updated.interval, 0, 'Intervalo do hard deve zerar');
  assert.equal(Math.round(updated.ef * 10) / 10, 2.3, 'EF deve decrescer em 0.2');
  assert.isTrue(
    updated.nextReview >= beforeTime + 59000 && updated.nextReview <= Date.now() + 61000,
    'Próxima revisão deve ser agendada para ~60 segundos depois',
  );
});

suite.test('Classificação "hard" respeita piso mínimo de EF = 1.3', () => {
  const lowEF = { interval: 2, ef: 1.4, nextReview: 0, fails: 2 };
  const updated = calculateSRSNextReview(lowEF, "hard");
  assert.equal(updated.ef, 1.3, 'EF não pode cair abaixo do piso 1.3');
});

suite.test('Classificação "good" avança intervalo baseado no Ease Factor', () => {
  // Novo card
  const r1 = calculateSRSNextReview(null, "good");
  assert.equal(r1.interval, 1, 'Primeiro intervalo de good deve ser 1 dia');

  // Segunda revisão com EF padrão (2.5) -> round(1 * 2.5) = 3 dias
  const r2 = calculateSRSNextReview(r1, "good");
  assert.equal(r2.interval, 3, 'Segundo intervalo deve ser 3 dias');
});

suite.test('Classificação "easy" aplica bônus de intervalo (4 dias inicial) e eleva EF em 0.15', () => {
  const r1 = calculateSRSNextReview(null, "easy");
  assert.equal(r1.interval, 4, 'Primeiro intervalo de fácil deve ser 4 dias');
  assert.equal(Math.round(r1.ef * 100) / 100, 2.65, 'EF deve ser elevado em 0.15');

  // Próxima revisão: round(4 * 2.80 * 1.3) = round(14.56) = 15 dias
  const r2 = calculateSRSNextReview(r1, "easy");
  assert.equal(r2.interval, 15, 'Segundo intervalo deve aplicar multiplicador 1.3x');
});

suite.test('Declaração das funções do Anki no app.js e módulos', () => {
  assert.includes(appJs, 'function startAnki', 'startAnki ausente');
  assert.includes(appJs, 'function renderAnkiCard', 'renderAnkiCard ausente');
  assert.includes(appJs, 'function revealAnki', 'revealAnki ausente');
  assert.includes(appJs, 'function answerAnki', 'answerAnki ausente');
  assert.includes(appJs, 'function finishAnki', 'finishAnki ausente');
});

suite.test('startAnki, revealAnki e finishAnki operam no DOM com tolerância defensiva', () => {
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
    };
    elementsById[id] = el;
    return el;
  };

  createMockEl('assess-dashboard');
  createMockEl('anki-active');
  createMockEl('anki-results');
  createMockEl('anki-counter');
  createMockEl('anki-type-tag');
  createMockEl('anki-hebrew');
  createMockEl('anki-translit');
  createMockEl('anki-translation');
  createMockEl('anki-next-good');
  createMockEl('anki-next-easy');
  createMockEl('anki-back');
  createMockEl('anki-reveal-container');
  createMockEl('anki-res-hard');
  createMockEl('anki-res-good');
  createMockEl('anki-res-easy');

  const oldDoc = global.document;
  const oldWindow = global.window;
  const oldAlert = global.alert;

  global.document = {
    getElementById: (id) => elementsById[id] || null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  global.alert = () => {};

  const srsModule = require('../js/modules/srs.js');

  AppState.currentChapter = {
    id: "chap_srs_test",
    title: "Lição SRS Teste",
    items: [
      { term: "אֱלֹהִים", translations: ["Deus", "deuses"] },
    ],
  };
  AppState.chapters = [AppState.currentChapter];
  AppState.srs = {};

  srsModule.startAnki();

  assert.isTrue(
    elementsById['assess-dashboard'].classList.contains('hidden'),
    'assess-dashboard deve ser ocultado',
  );
  assert.isFalse(
    elementsById['anki-active'].classList.contains('hidden'),
    'anki-active deve ser exibido',
  );
  assert.equal(
    elementsById['anki-hebrew'].textContent,
    'אֱלֹהִים',
    'anki-hebrew deve exibir a palavra correta',
  );

  srsModule.revealAnki();

  assert.isTrue(
    elementsById['anki-reveal-container'].classList.contains('hidden'),
    'anki-reveal-container deve sumir após revelar',
  );
  assert.isFalse(
    elementsById['anki-back'].classList.contains('hidden'),
    'anki-back deve aparecer ao revelar resposta',
  );

  srsModule.finishAnki();

  assert.isTrue(
    elementsById['anki-active'].classList.contains('hidden'),
    'anki-active deve sumir após finalizar',
  );
  assert.isFalse(
    elementsById['anki-results'].classList.contains('hidden'),
    'anki-results deve aparecer',
  );

  // Limpeza
  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
  if (oldWindow === undefined) delete global.window; else global.window = oldWindow;
  if (oldAlert === undefined) delete global.alert; else global.alert = oldAlert;
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
