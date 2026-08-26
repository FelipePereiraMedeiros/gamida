/**
 * ==========================================================================
 * Módulo 10: Menu Mobile Retrátil & Carrossel de Abas com Indicadores
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 10: Menu Mobile & Carrossel de Abas');
const { appJs, html, css } = loadSourceFiles();

// 1. Menu Mobile Retrátil
suite.test('Alvos retráteis identificados com .mobile-collapsible-target no HTML', () => {
  assert.includes(html, 'mobile-collapsible-target', 'Classe .mobile-collapsible-target ausente');
  assert.includes(html, 'id="custom-chapter-selector"', 'Seletor de capítulos ausente');
  assert.includes(html, 'id="navbar-tabs-row"', 'Linha de abas ausente');
});

suite.test('Puxador de menu mobile configurado com alinhamento óptico', () => {
  assert.includes(html, 'id="mobile-menu-toggle-btn"', 'Botão #mobile-menu-toggle-btn ausente');
  assert.includes(html, 'id="mobile-menu-toggle-label"', 'Rótulo #mobile-menu-toggle-label ausente');
  assert.includes(html, 'id="mobile-menu-toggle-icon"', 'Ícone #mobile-menu-toggle-icon ausente');
  assert.includes(html, 'inline-flex', 'Classe inline-flex ausente no botão');
  assert.includes(html, 'leading-none', 'Classe leading-none ausente no botão');
});

suite.test('Função toggleMobileMenu implementada com suporte a estado forçado', () => {
  assert.includes(appJs, 'function toggleMobileMenu', 'toggleMobileMenu ausente');
  assert.includes(appJs, 'isMobileMenuExpanded', 'Variável de controle de estado ausente');
});

suite.test('Auto-retração do menu acionada ao trocar de aba ou selecionar capítulo no mobile', () => {
  assert.includes(appJs, 'switchTab', 'switchTab ausente');
  assert.includes(appJs, 'toggleMobileMenu(false)', 'Chamada de auto-retração ausente');
});

// 2. Carrossel de Abas com Indicadores
suite.test('Contêiner de abas possui wrapper com botões e sombras de fade', () => {
  assert.includes(html, 'id="navbar-tabs-container"', 'Contêiner #navbar-tabs-container ausente');
  assert.includes(html, 'id="tabs-scroll-right-btn"', 'Botão direito #tabs-scroll-right-btn ausente');
  assert.includes(html, 'id="tabs-fade-right"', 'Sombra direita #tabs-fade-right ausente');
  assert.includes(html, 'id="tabs-scroll-left-btn"', 'Botão esquerdo #tabs-scroll-left-btn ausente');
  assert.includes(html, 'id="tabs-fade-left"', 'Sombra esquerda #tabs-fade-left ausente');
});

suite.test('Funções de rolagem e cálculo de overflow implementadas no JS', () => {
  assert.includes(appJs, 'function scrollTabs', 'scrollTabs ausente');
  assert.includes(appJs, 'function updateTabsScrollIndicators', 'updateTabsScrollIndicators ausente');
  assert.includes(appJs, 'container.scrollWidth > container.clientWidth', 'Cálculo de overflow ausente');
});

suite.test('Animações CSS do carrossel e do puxador declaradas no styles.css', () => {
  assert.includes(css, '@keyframes pull-subtle', 'Keyframe pull-subtle ausente');
  assert.includes(css, '@keyframes subtle-bounce-x', 'Keyframe subtle-bounce-x ausente');
  assert.includes(css, '.animate-pull-indicator', 'Classe animate-pull-indicator ausente');
  assert.includes(css, '.animate-subtle-bounce-x', 'Classe animate-subtle-bounce-x ausente');
  assert.includes(css, '#mobile-menu-toggle-label', 'Regra de alinhamento óptico do label ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
