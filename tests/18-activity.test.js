/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 18: Constância de Estudo (dias seguidos e meta diária)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 18: Constância de Estudo');
const { appJs, html } = loadSourceFiles();
const { summarize, dayKey, parseGoal, DAILY_GOAL, MIN_GOAL, MAX_GOAL } = require('../js/modules/activity.js');

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);

suite.test('dayKey usa a data local do aluno', () => {
  assert.equal(dayKey(at(2026, 3, 5, 23)), '2026-03-05');
  assert.equal(dayKey(at(2026, 12, 31, 0)), '2026-12-31');
});

suite.test('Sem estudo não há sequência', () => {
  const s = summarize({}, at(2026, 3, 5));
  assert.equal(s.streak, 0);
  assert.equal(s.today, 0);
  assert.isTrue(!s.goalMet && !s.studiedToday);
});

suite.test('Dias seguidos contam até hoje', () => {
  const days = { '2026-03-03': 5, '2026-03-04': 12, '2026-03-05': 3 };
  const s = summarize(days, at(2026, 3, 5));
  assert.equal(s.streak, 3);
  assert.equal(s.today, 3);
  assert.isTrue(s.studiedToday);
});

suite.test('Ontem sustenta a sequência até o fim de hoje; anteontem não', () => {
  const days = { '2026-03-03': 5, '2026-03-04': 12 };
  const today = summarize(days, at(2026, 3, 5));
  assert.equal(today.streak, 2, 'Ainda dá tempo de estudar hoje');
  assert.isTrue(!today.studiedToday);
  assert.equal(summarize(days, at(2026, 3, 6)).streak, 0, 'Um dia inteiro sem estudo zera');
});

suite.test('Sequência atravessa a virada de mês e de ano', () => {
  const days = { '2025-12-30': 1, '2025-12-31': 1, '2026-01-01': 1 };
  assert.equal(summarize(days, at(2026, 1, 1)).streak, 3);
  assert.equal(summarize({ '2026-02-28': 2, '2026-03-01': 2 }, at(2026, 3, 1)).streak, 2);
});

suite.test('Meta diária e recorde', () => {
  const days = { '2026-01-10': 4, '2026-01-11': 4, '2026-01-12': 4, '2026-01-13': 4, '2026-03-05': DAILY_GOAL };
  const s = summarize(days, at(2026, 3, 5));
  assert.isTrue(s.goalMet);
  assert.equal(s.streak, 1);
  assert.equal(s.best, 4);
  assert.isTrue(!summarize({ '2026-03-05': DAILY_GOAL - 1 }, at(2026, 3, 5)).goalMet);
});

suite.test('Meta definida pelo aluno vale no lugar da padrão', () => {
  const days = { '2026-03-05': 8 };
  assert.isTrue(summarize(days, at(2026, 3, 5), 5).goalMet, 'Meta menor já cumprida');
  assert.equal(summarize(days, at(2026, 3, 5), 5).goal, 5);
  assert.isTrue(!summarize(days, at(2026, 3, 5), 50).goalMet, 'Meta maior ainda não cumprida');
  assert.equal(summarize(days, at(2026, 3, 5), 'lixo').goal, DAILY_GOAL, 'Meta inválida cai na padrão');
});

suite.test('parseGoal aceita só números e respeita os limites', () => {
  assert.equal(parseGoal('35'), 35);
  assert.equal(parseGoal(12.6), 13);
  assert.equal(parseGoal(0), MIN_GOAL);
  assert.equal(parseGoal(-4), MIN_GOAL);
  assert.equal(parseGoal(99999), MAX_GOAL);
  assert.equal(parseGoal(''), null);
  assert.equal(parseGoal(null), null);
  assert.equal(parseGoal('abc'), null);
});

suite.test('Registro corrompido é ignorado', () => {
  const s = summarize({ 'lixo': 9, '2026-03-05': 'abc', '2026-03-04': -2, '2026-03-03': 7 }, at(2026, 3, 4));
  assert.equal(s.streak, 1);
  assert.equal(summarize(null, at(2026, 3, 4)).streak, 0);
});

suite.test('Constância está ligada à interface e ao backup', () => {
  assert.includes(html, 'id="stat-days"', 'Indicador de dias seguidos ausente');
  assert.includes(html, 'js/modules/activity.js', 'Módulo não carregado no index.html');
  assert.includes(appJs, 'window.recordActivity()', 'A prática não registra atividade');
  assert.includes(appJs, 'exportActivity()', 'Backup não leva a constância');
  assert.includes(appJs, 'mergeActivity(parsed.activity)', 'Backup não restaura a constância');
  assert.includes(html, 'id="daily-goal-input"', 'Campo da meta diária ausente');
  assert.includes(html, 'saveDailyGoalFromInput(event)', 'Formulário da meta não salva');
  assert.includes(appJs, 'adoptDailyGoal(parsed.dailyGoal)', 'Backup não leva a meta diária');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
