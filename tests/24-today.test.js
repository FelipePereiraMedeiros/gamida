/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 24: Painel "Hoje", progresso unificado e grupos da aba Avaliar
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 24: Hoje e progresso unificado');
const { html } = loadSourceFiles();
const Today = require('../js/modules/today.js');
const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

suite.test('Um único próximo passo, na ordem: revisão, caminho, Crônicas', () => {
  const path_ = { id: 'kelley_03', title: 'Lição III', terms: 18 };
  const scribe = { number: 2, city: 'Éden' };
  const all = Today.computeSteps({ due: 4, errors: 2, path: path_, scribe });
  assert.deepEqual(all.map((s) => s.id), ['due', 'path', 'scribe'], 'Vencidas primeiro');
  assert.equal(all[0].title, 'Revisar 4 palavras vencidas');
  assert.deepEqual(Today.computeSteps({ due: 0, errors: 1, path: path_ }).map((s) => s.id), ['errors', 'path'], 'Sem vencidas, os erros');
  assert.equal(Today.computeSteps({ errors: 1 })[0].title, 'Rever 1 palavra errada');
  assert.deepEqual(Today.computeSteps({ scribe }).map((s) => s.id), ['scribe']);
  assert.deepEqual(Today.computeSteps({}), [], 'Nada pendente');
});

suite.test('O painel fica no topo da tela inicial e é atualizado ao voltar a ela', () => {
  assert.isTrue(html.indexOf('id="today-panel"') > html.indexOf('id="tab-practice"'), 'Painel fora da aba Praticar');
  assert.isTrue(html.indexOf('id="today-panel"') < html.indexOf('id="practice-control-bar"'), 'Painel abaixo da prática');
  assert.includes(html, 'js/modules/today.js');
  const app = read('js/app.js');
  assert.includes(app, 'tabName === "practice" && typeof window !== "undefined" && window.TodayModule');
});

suite.test('Aba Avaliar em três grupos: Revisar, Testar e Jogar', () => {
  const dash = html.slice(html.indexOf('id="assess-dashboard"'), html.indexOf('<!-- Chuva de Pedras: arcade'));
  const groups = [...dash.matchAll(/<h3 id="mode-group-(\w+)" class="mode-group__title">([^<]+)<\/h3>/g)].map((m) => m[2]);
  assert.deepEqual(groups, ['Revisar', 'Testar', 'Jogar']);
  const order = ['startAnki(', 'openMasteryPath()', 'openMorphDrill()', 'openSimuladoConfig()', 'startSurvival()', 'openStoneRain()', 'openScribeChronicles()'].map((a) => dash.indexOf(a));
  assert.isTrue(order.every((v, i) => v > -1 && (i === 0 || v > order[i - 1])), 'Cartões fora do grupo esperado');
});

suite.test('Nos jogos, acerto digitado conta para o domínio; acerto por alternativa não', () => {
  const stones = read('js/modules/stone-rain.js');
  assert.includes(stones, 'if (ok && typed && typeof window.recordMasteryHit === "function")');
  assert.includes(stones, 'registerHit(target, true)', 'Chuva de Pedras: resposta digitada');
  const scribe = read('js/modules/scribe-chronicles.js');
  assert.includes(scribe, 'B.lastTyped && typeof window.recordMasteryHit === "function"');
  ['function answerMobTyped(value, input) {\n  B.lastTyped = true;', 'function bossAnswerTyped(value, input) {\n  B.lastTyped = true;'].forEach((s) => assert.includes(scribe, s));
  const path_ = read('js/modules/mastery-path.js');
  assert.includes(path_, 'caçada completa nas Crônicas', 'Selo da caçada no Caminho do domínio');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
