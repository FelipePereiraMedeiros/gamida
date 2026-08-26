/**
 * ==========================================================================
 * Módulo 11: Apoio do Desenvolvedor ("Pague-me um café!" & PIX)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 11: Apoio ("Pague-me um café!" & PIX)');
const { appJs, html, css } = loadSourceFiles();

suite.test('Botão #btn-coffee estruturado no index.html com ícone e estilo de destaque', () => {
  assert.includes(html, 'id="btn-coffee"', 'Botão #btn-coffee ausente');
  assert.includes(html, 'Pague-me um café!', 'Texto inicial ausente');
  assert.includes(html, 'onclick="copyPixCoffee(this)"', 'Evento de clique ausente');
  assert.includes(html, 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600', 'Gradiente de destaque ausente');
});

suite.test('Função copyPixCoffee copia a chave PIX correta (10971140669)', () => {
  assert.includes(appJs, 'function copyPixCoffee', 'copyPixCoffee ausente');
  assert.includes(appJs, '10971140669', 'Chave PIX 10971140669 ausente');
});

suite.test('Exibição formatada dos dados do beneficiário (Felipe Pereira Medeiros / NuBank)', () => {
  assert.includes(appJs, 'Felipe Pereira Medeiros', 'Nome do beneficiário ausente');
  assert.includes(appJs, 'NuBank', 'Nome da instituição bancária ausente');
  assert.includes(appJs, 'Copiado!', 'Badge de feedback de cópia ausente');
});

suite.test('Fallback para navegadores que bloqueiam navigator.clipboard em contextos HTTP', () => {
  assert.includes(appJs, 'fallbackCopyPix', 'Função fallbackCopyPix ausente');
  assert.includes(appJs, 'document.execCommand("copy")', 'execCommand de fallback ausente');
});

suite.test('Função resetCoffeeButton restaura estado original suavemente', () => {
  assert.includes(appJs, 'function resetCoffeeButton', 'resetCoffeeButton ausente');
  assert.includes(appJs, 'Pague-me um café!', 'Texto de restauração ausente');
});

suite.test('Animações CSS do botão de café (coffee-pulse e copied-pop) declaradas no styles.css', () => {
  assert.includes(css, '@keyframes coffee-pulse', 'Keyframe coffee-pulse ausente');
  assert.includes(css, '@keyframes copied-pop', 'Keyframe copied-pop ausente');
  assert.includes(css, '.coffee-btn-glow', 'Classe coffee-btn-glow ausente');
  assert.includes(css, '.animate-copied-pop', 'Classe animate-copied-pop ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
