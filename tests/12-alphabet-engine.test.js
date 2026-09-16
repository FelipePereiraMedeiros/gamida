/**
 * ==========================================================================
 * Módulo 12: Motor Gamificado do Alfabeto (Ordem, Configuração & Formas)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 12: Motor Gamificado do Alfabeto');
const { appJs, html, css, hebrewData, greekData } = loadSourceFiles();

// 1. Integridade do Capítulo 1 (Hebraico)
suite.test('Capítulo 1 de Hebraico (kelley_01) contém as 22 consoantes com metadados completos', () => {
  const chap1 = hebrewData.find(c => c.id === 'kelley_01');
  assert.isTrue(!!chap1, 'Capítulo kelley_01 ausente no hebrew_chapters.json');
  assert.equal(chap1.items.length, 22, 'Alef-Bet hebraico deve conter exatamente 22 consoantes');

  chap1.items.forEach((item, index) => {
    assert.equal(item.order, index + 1, `Ordem incorreta para a letra ${item.name}`);
    assert.isTrue(!!item.hebrew, `Glifo hebraico ausente para item ${index + 1}`);
    assert.isTrue(!!item.name, `Nome da letra ausente para item ${index + 1}`);
    assert.isTrue(!!item.sound, `Descrição de som ausente para item ${index + 1}`);
    assert.isGreaterThan(item.translations.length, 0, `Traduções ausentes para item ${index + 1}`);
  });
});

// 2. Integridade do Capítulo 1 (Grego)
suite.test('Capítulo 1 de Grego (bergmann_01) contém as 24 letras com maiúsculas e minúsculas', () => {
  const chap1 = greekData.find(c => c.id === 'bergmann_01');
  assert.isTrue(!!chap1, 'Capítulo bergmann_01 ausente no greek_chapters.json');
  assert.equal(chap1.items.length, 24, 'Alfabeto grego deve conter exatamente 24 letras');

  chap1.items.forEach((item, index) => {
    assert.equal(item.order, index + 1, `Ordem incorreta para a letra ${item.name}`);
    assert.isTrue(!!item.term, `Minúscula grega ausente para item ${index + 1}`);
    assert.isTrue(!!item.uppercase, `Maiúscula grega ausente para item ${index + 1}`);
    assert.isTrue(!!item.name, `Nome da letra grega ausente para item ${index + 1}`);
    assert.isTrue(!!item.sound, `Descrição de som ausente para item ${index + 1}`);
  });
});

// 3. Detecção e Controle de Visualização do Capítulo do Alfabeto
suite.test('Função isAlphabetChapter detecta capítulos do alfabeto corretamente', () => {
  assert.includes(appJs, 'function isAlphabetChapter', 'Função isAlphabetChapter ausente');
  assert.includes(appJs, 'kelley_01', 'Verificação do ID kelley_01 ausente');
  assert.includes(appJs, 'bergmann_01', 'Verificação do ID bergmann_01 ausente');
  assert.includes(appJs, 'function updatePracticeChapterView', 'Função updatePracticeChapterView ausente');
});

// 4. Submodos de Jogo do Alfabeto (Ordem, Impostores, Formas/Sofit, Clássico)
suite.test('Submodos do jogo do alfabeto (order, impostors, shapes, classic) configurados', () => {
  assert.includes(appJs, 'function setAlphabetSubmode', 'Função setAlphabetSubmode ausente');
  assert.includes(appJs, 'alpha-mode-', 'Prefixo dos botões alpha-mode- ausente no app.js');
  assert.includes(appJs, '"order"', 'Submodo order ausente');
  assert.includes(appJs, '"impostors"', 'Submodo impostors ausente');
  assert.includes(appJs, '"shapes"', 'Submodo shapes ausente');
  assert.includes(appJs, '"classic"', 'Submodo classic ausente');
  assert.includes(html, 'id="alpha-mode-order"', 'Botão alpha-mode-order ausente no HTML');
  assert.includes(html, 'id="alpha-mode-impostors"', 'Botão alpha-mode-impostors ausente no HTML');
  assert.includes(html, 'id="alpha-mode-shapes"', 'Botão alpha-mode-shapes ausente no HTML');
  assert.includes(html, 'id="alpha-mode-classic"', 'Botão alpha-mode-classic ausente no HTML');
});

// 5. Motor do Jogo do Alfabeto (AlphabetGameEngine)
const { AlphabetGameEngine } = require('../js/modules/alphabet.js');
const { isAlphabetChapter } = require('../js/modules/state.js');

suite.test('Função isAlphabetChapter valida capítulos do alfabeto funcionalmente', () => {
  assert.isTrue(isAlphabetChapter({ id: 'kelley_01' }), 'kelley_01 deve ser reconhecido');
  assert.isTrue(isAlphabetChapter({ id: 'bergmann_01' }), 'bergmann_01 deve ser reconhecido');
  assert.isTrue(isAlphabetChapter({ id: 'outro', title: 'Alfabeto e Pronúncia' }), 'title com alfabeto deve ser reconhecido');
  assert.isFalse(isAlphabetChapter({ id: 'kelley_02', title: 'Substantivos' }), 'kelley_02 não é alfabeto');
});

suite.test('AlphabetGameEngine implementa geração funcional de desafios de ordem, impostores e formas', () => {
  assert.isTrue(typeof AlphabetGameEngine === 'object', 'AlphabetGameEngine deve ser um objeto');
  assert.isFunction(AlphabetGameEngine.generateOrderChallenge, 'Método generateOrderChallenge ausente');
  assert.isFunction(AlphabetGameEngine.generateImpostorChallenge, 'Método generateImpostorChallenge ausente');
  assert.isFunction(AlphabetGameEngine.generateShapesChallenge, 'Método generateShapesChallenge ausente');

  // 1. Desafio de ordem hebraica
  const orderHeb = AlphabetGameEngine.generateOrderChallenge("hebrew");
  assert.isTrue(!!orderHeb, 'Deve gerar desafio de ordem hebraica');
  assert.equal(orderHeb.options.length, 4, 'Deve conter 4 alternativas');
  assert.isTrue(orderHeb.options.some(opt => opt.isCorrect), 'Uma das alternativas deve ser correta');

  // 2. Desafio de ordem grega
  const orderGrk = AlphabetGameEngine.generateOrderChallenge("greek");
  assert.isTrue(!!orderGrk, 'Deve gerar desafio de ordem grega');
  assert.equal(orderGrk.options.length, 4, 'Deve conter 4 alternativas');
  assert.isTrue(orderGrk.options.some(opt => opt.isCorrect), 'Uma das alternativas deve ser correta');

  // 3. Desafio de impostores
  const impostorHeb = AlphabetGameEngine.generateImpostorChallenge("hebrew");
  assert.isTrue(!!impostorHeb, 'Deve gerar desafio de impostor');
  assert.equal(impostorHeb.options.length, 4, 'Deve conter 4 alternativas');
  assert.isTrue(impostorHeb.options.some(opt => opt.isCorrect), 'Deve conter alternativa correta');

  // 4. Desafio de formas
  const shapesHeb = AlphabetGameEngine.generateShapesChallenge("hebrew");
  assert.isTrue(!!shapesHeb, 'Deve gerar desafio de formas');
  assert.equal(shapesHeb.options.length, 2, 'Deve conter 2 alternativas (Regular vs Sofit)');
  assert.isTrue(shapesHeb.options.some(opt => opt.isCorrect), 'Deve conter alternativa correta');
});

// 6. Sistema de Pontuação, Combos e Feedback do Alfabeto
suite.test('Sistema de combos e feedback visual configurado no AlphabetGameEngine', () => {
  assert.includes(appJs, 'alphabet-feedback-banner', 'Banner de feedback do alfabeto ausente');
  assert.includes(appJs, 'alphabet-combo-badge', 'Badge de combo do alfabeto ausente');
  assert.includes(appJs, 'alphabet-score-indicator', 'Indicador de score do alfabeto ausente');
  assert.includes(appJs, 'function nextAlphabetChallenge', 'Função nextAlphabetChallenge ausente');
});

// 7. Estrutura HTML da Estação do Alfabeto
suite.test('Estrutura HTML da Estação do Alfabeto presente no index.html', () => {
  assert.includes(html, 'id="alphabet-mode-controls"', 'Controles do modo alfabeto ausentes no index.html');
  assert.includes(html, 'id="alphabet-game-panel"', 'Painel do jogo do alfabeto ausente no index.html');
  assert.includes(html, 'id="alphabet-target-glyph"', 'Glifo alvo do alfabeto ausente no index.html');
  assert.includes(html, 'id="alphabet-options-grid"', 'Grid de opções do alfabeto ausente no index.html');
  assert.includes(html, 'id="alphabet-feedback-banner"', 'Banner de feedback ausente no index.html');
});

// 8. Animações e Estilos CSS para o Jogo do Alfabeto
suite.test('Animações CSS do jogo do alfabeto declaradas no styles.css', () => {
  assert.includes(css, '@keyframes combo-pop', 'Keyframe combo-pop ausente');
  assert.includes(css, '@keyframes shake-wrong', 'Keyframe shake-wrong ausente');
  assert.includes(css, '@keyframes letter-glow', 'Keyframe letter-glow ausente');
  assert.includes(css, '.alphabet-card-hover', 'Classe alphabet-card-hover ausente');
});

// 9. Ausência de Pistas Textuais ou Números Ordinais nas Opções (Não entregar resposta)
suite.test('Desafios de ordem, impostores e formas não exibem nomes de letras ou números nas alternativas', () => {
  // 1. Ordem alfabética
  assert.isFalse(appJs.includes('${correctLetter.name} (${correctLetter.order}ª)'), 'Opção correta não deve exibir número ordinal');
  assert.isFalse(appJs.includes('${d.name} (${d.order}ª)'), 'Distratores não devem exibir número ordinal');
  assert.isFalse(appJs.includes('subtext: correctLetter.name'), 'Opções de ordem não devem exibir nome da letra');
  assert.isFalse(appJs.includes('subtext: d.name'), 'Distratores de ordem não devem exibir nome da letra');

  // 2. Detector de impostores
  assert.isFalse(appJs.includes('subtext: group.name'), 'Opções de impostores não devem ter nome do alvo');
  assert.isFalse(appJs.includes('subtext: twinData ? twinData.name'), 'Distratores de impostores não devem ter nome da letra');

  // 3. Formas Sofit
  assert.isFalse(appJs.includes('${target.name} Sofit`'), 'Opção Sofit não deve conter nome da letra');
  assert.isFalse(appJs.includes('${target.name} Regular`'), 'Opção Regular não deve conter nome da letra');

  // 4. Maiúsculas e Minúsculas
  assert.isFalse(appJs.includes('${target.name} Minúscula`'), 'Opção minúscula grega não deve conter nome da letra');
  assert.isFalse(appJs.includes('${target.name} Maiúscula`'), 'Opção maiúscula grega não deve conter nome da letra');
});

// 10. Modo Detector de Impostores Oculta Glifo Alvo e Não Repete Alternativas
suite.test('Detector de impostores não exibe o glifo alvo no cabeçalho e garante opções únicas', () => {
  assert.includes(appJs, 'targetGlyph: "⚖️"', 'Glifo alvo não deve exibir a letra resposta no detector de impostores');
  assert.isFalse(appJs.includes('${group.name} (${group.target})'), 'Instrução de impostores não deve exibir a letra entre parênteses');
  assert.includes(appJs, 't !== group.target', 'Impostores devem filtrar estritamente o alvo');
  assert.includes(appJs, 'new Set', 'Impostores devem garantir alternativas únicas via Set');
});

// 11. Filtro de Visibilidade de Paradigmas e Modos Vazios
suite.test('Filtro de visibilidade oculta abas e modos quando não há itens disponíveis', () => {
  assert.includes(appJs, '!hasParadigms', 'Verificação de ausência de paradigmas ausente');
  assert.includes(appJs, '!hasSentences', 'Verificação de ausência de frases ausente');
  assert.includes(appJs, 'btnSentences.classList.add("hidden")', 'Ocultação do modo frases ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
