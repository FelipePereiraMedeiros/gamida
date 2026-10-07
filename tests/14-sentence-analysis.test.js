/**
 * ==========================================================================
 * Módulo 14: Análise Morfossintática de Frases Hebraicas (Page Kelley)
 * Bateria de Testes Unitários e de Integração
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 14: Análise Morfossintática Granular (Page Kelley)');
const { html, css, appJs, hebrewData } = loadSourceFiles();

const SentenceAnalysisModule = require('../js/modules/sentence-analysis.js');
const {
  CATEGORY_MAP,
  getMorphemeCategory,
  tokenEndsWithMaqqef,
  buildFlatMorphemesList,
  renderSentenceMorphemesHTML,
  renderGlobalSentenceView,
  renderMorphemeDissectionView,
  openSentenceAnalysisModal,
  closeSentenceAnalysisModal,
  setActiveMorphemeIndex,
  navigateMorphemes,
  ModalState
} = SentenceAnalysisModule;

// --------------------------------------------------------------------------
// TESTE 1: Mapeamento e Classificação das 8 Categorias Morfológicas
// --------------------------------------------------------------------------
suite.test('Classificação correta das 8 categorias morfológicas canônicas', () => {
  // 1. Artigo
  assert.equal(getMorphemeCategory('Artigo definido'), 'article');
  assert.equal(getMorphemeCategory('Artigo'), 'article');

  // 2. Conjunção
  assert.equal(getMorphemeCategory('Conjunção coordenativa'), 'conjunction');
  assert.equal(getMorphemeCategory('Conjunção (vav consecutivo)'), 'conjunction');
  assert.equal(getMorphemeCategory('Vav conjuntivo'), 'conjunction');

  // 3. Preposição
  assert.equal(getMorphemeCategory('Preposição inseparável'), 'preposition');
  assert.equal(getMorphemeCategory('Preposição inseparável com artigo absorvido'), 'preposition');
  assert.equal(getMorphemeCategory('Preposição (variante de מִן)'), 'preposition');

  // 4. Substantivo
  assert.equal(getMorphemeCategory('Substantivo'), 'noun');
  assert.equal(getMorphemeCategory('Substantivo segolado'), 'noun');
  assert.equal(getMorphemeCategory('Nome Próprio'), 'noun');
  assert.equal(getMorphemeCategory('Nome Divino'), 'noun');

  // 5. Adjetivo
  assert.equal(getMorphemeCategory('Adjetivo'), 'adjective');
  assert.equal(getMorphemeCategory('Adjetivo qualificativo'), 'adjective');

  // 6. Verbo
  assert.equal(getMorphemeCategory('Verbo'), 'verb');
  assert.equal(getMorphemeCategory('Verbo (particípio ativo)'), 'verb');
  assert.equal(getMorphemeCategory('Verbo (particípio passivo)'), 'verb');

  // 7. Sufixo Pronominal
  assert.equal(getMorphemeCategory('Sufixo pronominal'), 'suffix');
  assert.equal(getMorphemeCategory('Sufixo pronominal (com nun enérgico assimilado)'), 'suffix');

  // 8. Partícula / Pronome
  assert.equal(getMorphemeCategory('Pronome demonstrativo'), 'particle');
  assert.equal(getMorphemeCategory('Pronome pessoal independente'), 'particle');
  assert.equal(getMorphemeCategory('Partícula de negação'), 'particle');
  assert.equal(getMorphemeCategory('Advérbio de tempo'), 'particle');
  assert.equal(getMorphemeCategory('Partícula indicadora de objeto direto'), 'particle');
});

// --------------------------------------------------------------------------
// TESTE 2: Metadados e Códigos de Cores no CATEGORY_MAP e CSS
// --------------------------------------------------------------------------
suite.test('CATEGORY_MAP define todas as 8 categorias com classes e hex adequados', () => {
  const expectedKeys = ['article', 'conjunction', 'preposition', 'noun', 'adjective', 'verb', 'suffix', 'particle'];
  expectedKeys.forEach(k => {
    assert.isTrue(!!CATEGORY_MAP[k], `Categoria ${k} ausente em CATEGORY_MAP`);
    assert.isTrue(!!CATEGORY_MAP[k].badgeClass, `badgeClass ausente para ${k}`);
    assert.isTrue(!!CATEGORY_MAP[k].glowClass, `glowClass ausente para ${k}`);
    assert.isTrue(!!CATEGORY_MAP[k].name, `name ausente para ${k}`);
  });

  // Validação no CSS styles.css
  assert.includes(css, '.morpheme-article', 'Classe .morpheme-article ausente no styles.css');
  assert.includes(css, '.morpheme-conjunction', 'Classe .morpheme-conjunction ausente no styles.css');
  assert.includes(css, '.morpheme-preposition', 'Classe .morpheme-preposition ausente no styles.css');
  assert.includes(css, '.morpheme-noun', 'Classe .morpheme-noun ausente no styles.css');
  assert.includes(css, '.morpheme-adjective', 'Classe .morpheme-adjective ausente no styles.css');
  assert.includes(css, '.morpheme-verb', 'Classe .morpheme-verb ausente no styles.css');
  assert.includes(css, '.morpheme-suffix', 'Classe .morpheme-suffix ausente no styles.css');
  assert.includes(css, '.morpheme-particle', 'Classe .morpheme-particle ausente no styles.css');
});

// --------------------------------------------------------------------------
// TESTE 3: Regra de Maqqef (Traço de Ligação Hebraico)
// --------------------------------------------------------------------------
suite.test('tokenEndsWithMaqqef detecta hifens massoréticos e convencionais', () => {
  assert.isTrue(tokenEndsWithMaqqef({ text: 'עַל־' }));
  assert.isTrue(tokenEndsWithMaqqef({ text: 'מִן־' }));
  assert.isTrue(tokenEndsWithMaqqef({ text: 'כָּל-' }));
  assert.isTrue(tokenEndsWithMaqqef({ text: 'בְּכָל\u05BE' }));
  assert.isFalse(tokenEndsWithMaqqef({ text: 'שָׁלוֹם' }));
  assert.isFalse(tokenEndsWithMaqqef({ text: 'הָאוֹר' }));
  assert.isFalse(tokenEndsWithMaqqef(null));
});

// --------------------------------------------------------------------------
// TESTE 4: Dissecação Granular de Tokens e Parts (Modelo de Dados)
// --------------------------------------------------------------------------
suite.test('buildFlatMorphemesList dissecada frase composta em morfemas atômicos', () => {
  const testSentence = {
    id: 'test_01',
    hebrew: 'הָאוֹר וְהַחֹשֶׁךְ',
    translations: ['a luz e as trevas'],
    syntax_type: 'Sintagma Nominal Coordenado Determinado',
    tokens: [
      {
        index: 1,
        text: 'הָאוֹר',
        composite: true,
        syntax_role: 'Primeiro sintagma nominal.',
        parts: [
          { segment: 'הָ', transliteration: 'ha', type: 'Artigo definido', meaning: 'o/a' },
          { segment: 'אוֹר', transliteration: 'or', type: 'Substantivo', meaning: 'luz' }
        ]
      },
      {
        index: 2,
        text: 'וְהַחֹשֶׁךְ',
        composite: true,
        syntax_role: 'Segundo sintagma coordenado.',
        parts: [
          { segment: 'וְ', transliteration: 've', type: 'Conjunção coordenativa', meaning: 'e' },
          { segment: 'הַ', transliteration: 'ha', type: 'Artigo definido', meaning: 'o/a' },
          { segment: 'חֹשֶׁךְ', transliteration: 'choshech', type: 'Substantivo', meaning: 'trevas' }
        ]
      }
    ]
  };

  const list = buildFlatMorphemesList(testSentence);
  assert.equal(list.length, 5, 'Frase com 2 tokens compostos deve gerar 5 morfemas atômicos');
  assert.equal(list[0].part.segment, 'הָ');
  assert.equal(list[0].category, 'article');
  assert.equal(list[1].part.segment, 'אוֹר');
  assert.equal(list[1].category, 'noun');
  assert.equal(list[2].part.segment, 'וְ');
  assert.equal(list[2].category, 'conjunction');
  assert.equal(list[3].part.segment, 'הַ');
  assert.equal(list[3].category, 'article');
  assert.equal(list[4].part.segment, 'חֹשֶׁךְ');
  assert.equal(list[4].category, 'noun');
});

// --------------------------------------------------------------------------
// TESTE 5: Geração de HTML da Frase Hebraica (Tokens e Spans de Morfemas)
// --------------------------------------------------------------------------
suite.test('renderSentenceMorphemesHTML gera spans com data-token-idx e data-part-idx', () => {
  const sentence = {
    tokens: [
      {
        text: 'בָּרַךְ',
        composite: false,
        word_class: 'Verbo',
        syntax_role: 'Núcleo verbal.'
      },
      {
        text: 'עַל־',
        composite: false,
        word_class: 'Preposição',
        syntax_role: 'Preposição com maqqef.'
      },
      {
        text: 'הָעָם',
        composite: true,
        syntax_role: 'Objeto preposicionado.',
        parts: [
          { segment: 'הָ', type: 'Artigo definido' },
          { segment: 'עָם', type: 'Substantivo' }
        ]
      }
    ]
  };

  const htmlOutput = renderSentenceMorphemesHTML(sentence);
  assert.includes(htmlOutput, 'data-token-idx="0"', 'Primeiro token deve ter data-token-idx="0"');
  assert.includes(htmlOutput, 'data-part-idx="0"', 'Primeira parte deve ter data-part-idx="0"');
  assert.includes(htmlOutput, 'has-maqqef', 'Token com maqqef deve receber a classe has-maqqef');
  assert.includes(htmlOutput, 'data-token-idx="2" data-part-idx="1"', 'Segunda parte do token 2 deve estar presente');
  assert.includes(htmlOutput, 'morpheme-article', 'Artigo deve conter classe morpheme-article');
  assert.includes(htmlOutput, 'morpheme-noun', 'Substantivo deve conter classe morpheme-noun');
  assert.includes(htmlOutput, 'morpheme-verb', 'Verbo deve conter classe morpheme-verb');
});

// --------------------------------------------------------------------------
// TESTE 6: Painel de Análise Dinâmico (Visão Global vs Dissecação Anatômica)
// --------------------------------------------------------------------------
suite.test('renderGlobalSentenceView e renderMorphemeDissectionView geram conteúdos corretos', () => {
  const sentence = {
    syntax_type: 'Oração Verbal Perfeita',
    translations: ['O rei guardou a aliança'],
    notes: 'Verbo qatal perfeito na 3ª pessoa masculina singular.'
  };

  const globalHTML = renderGlobalSentenceView(sentence);
  assert.includes(globalHTML, 'Oração Verbal Perfeita', 'Deve exibir a classificação sintática');
  assert.includes(globalHTML, 'O rei guardou a aliança', 'Deve exibir a tradução literal');
  assert.includes(globalHTML, 'Verbo qatal perfeito', 'Deve exibir as notas pedagógicas');
  assert.includes(globalHTML, 'Passe o mouse sobre qualquer letra', 'Deve exibir a dica de instrução');

  const morphemeItem = {
    index: 0,
    category: 'article',
    part: {
      segment: 'הַ',
      transliteration: 'ha',
      type: 'Artigo definido',
      meaning: 'o/a',
      phonetics: 'Seguido de dagesh forte na consoante subsequente.'
    },
    token: {
      text: 'הַמֶּלֶךְ',
      transliteration: "ham-melech",
      syntax_role: 'Sujeito da oração.',
      lemma: 'מֶלֶךְ'
    }
  };

  const dissectionHTML = renderMorphemeDissectionView(morphemeItem, sentence);
  assert.includes(dissectionHTML, 'הַ', 'Deve exibir o segmento em hebraico ampliado');
  assert.includes(dissectionHTML, '[ ha ]', 'Deve exibir a transliteração');
  assert.includes(dissectionHTML, 'Artigo definido', 'Deve exibir a etiqueta do tipo');
  assert.includes(dissectionHTML, 'o/a', 'Deve exibir a tradução isolada');
  assert.includes(dissectionHTML, 'dagesh forte', 'Deve exibir o card explicativo de fonética de Kelley');
  assert.includes(dissectionHTML, 'Sujeito da oração', 'Deve exibir o papel sintático do token');
  assert.includes(dissectionHTML, 'מֶלֶךְ', 'Deve exibir o lemma do token');
});

// --------------------------------------------------------------------------
// TESTE 7: Navegação de Teclado RTL e Estado do Modal
// --------------------------------------------------------------------------
suite.test('Navegação de teclado RTL avança e recua no array de morfemas', () => {
  const sentence = {
    tokens: [
      {
        composite: true,
        parts: [
          { segment: 'וְ', type: 'Conjunção coordenativa' },
          { segment: 'אֶת', type: 'Partícula indicadora de objeto direto' }
        ]
      },
      {
        composite: false,
        text: 'הָאָרֶץ',
        word_class: 'Substantivo'
      }
    ]
  };

  ModalState.isOpen = true;
  ModalState.currentSentence = sentence;
  ModalState.flatMorphemes = buildFlatMorphemesList(sentence);
  ModalState.activeIndex = null;
  ModalState.pinnedIndex = null;

  assert.equal(ModalState.flatMorphemes.length, 3);

  // Simula ArrowLeft (direção +1, avança para a esquerda em RTL)
  navigateMorphemes(+1);
  assert.equal(ModalState.pinnedIndex, 0, 'Primeiro passo com ArrowLeft deve selecionar índice 0');

  navigateMorphemes(+1);
  assert.equal(ModalState.pinnedIndex, 1, 'Segundo passo com ArrowLeft deve avançar para índice 1');

  navigateMorphemes(+1);
  assert.equal(ModalState.pinnedIndex, 2, 'Terceiro passo deve avançar para índice 2');

  navigateMorphemes(+1);
  assert.equal(ModalState.pinnedIndex, 0, 'Deve ciclar de volta para índice 0');

  // Simula ArrowRight (direção -1, volta para a direita em RTL)
  navigateMorphemes(-1);
  assert.equal(ModalState.pinnedIndex, 2, 'ArrowRight retrocede para o último índice');

  closeSentenceAnalysisModal();
  assert.isFalse(ModalState.isOpen, 'Modal deve ser fechado após closeSentenceAnalysisModal');
});

// --------------------------------------------------------------------------
// TESTE 8: Contrato do Modal e Script no index.html
// --------------------------------------------------------------------------
suite.test('index.html contém contêiner do modal e botões de análise integrados', () => {
  assert.includes(html, 'id="sentence-analysis-modal"', 'Modal #sentence-analysis-modal ausente no index.html');
  assert.includes(html, 'id="sentence-morphemes-container"', 'Contêiner #sentence-morphemes-container ausente no index.html');
  assert.includes(html, 'id="sentence-morphemes-ribbon"', 'Contêiner #sentence-morphemes-ribbon ausente no index.html');
  assert.includes(html, 'id="sentence-analysis-panel"', 'Painel #sentence-analysis-panel ausente no index.html');
  assert.includes(html, 'id="btn-close-analysis-modal"', 'Botão #btn-close-analysis-modal ausente no index.html');
  assert.includes(html, 'id="btn-practice-analysis"', 'Botão #btn-practice-analysis ausente no index.html');
  assert.includes(html, 'id="btn-feedback-analysis"', 'Botão #btn-feedback-analysis ausente no index.html');
  assert.includes(html, 'src="js/modules/sentence-analysis.js"', 'Tag script sentence-analysis.js ausente no index.html');
});

// --------------------------------------------------------------------------
// TESTE 9: Integração de Código no app.js e ui.js
// --------------------------------------------------------------------------
suite.test('ui.js e app.js exportam e integram a abertura do modal', () => {
  assert.includes(appJs, 'openCurrentPracticeSentenceAnalysis', 'openCurrentPracticeSentenceAnalysis ausente no app.js');
  const uiJs = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'modules', 'ui.js'), 'utf8');
  assert.includes(uiJs, 'btn-vocab-analyze', 'Botão btn-vocab-analyze ausente no ui.js');
  assert.includes(uiJs, 'openSentenceAnalysisModal', 'Chamada openSentenceAnalysisModal ausente no ui.js');
});

// --------------------------------------------------------------------------
// TESTE 10: Barra Interativa de Fragmentos (Morpheme Ribbon)
// --------------------------------------------------------------------------
suite.test('renderMorphemesRibbonHTML gera chips para toda a oração e cada morfema atômico', () => {
  const mockMorphemes = [
    { index: 0, category: 'article', part: { segment: 'הַ', type: 'Artigo definido' } },
    { index: 1, category: 'noun', part: { segment: 'מֶלֶךְ', type: 'Substantivo' } }
  ];
  const ribbonHTML = SentenceAnalysisModule.renderMorphemesRibbonHTML(mockMorphemes);
  assert.includes(ribbonHTML, 'global-chip', 'Deve conter chip para visualização global da oração');
  assert.includes(ribbonHTML, 'data-morpheme-idx="global"', 'Chip global deve ter atributo data-morpheme-idx="global"');
  assert.includes(ribbonHTML, 'data-morpheme-idx="0"', 'Primeiro chip deve ter data-morpheme-idx="0"');
  assert.includes(ribbonHTML, 'data-morpheme-idx="1"', 'Segundo chip deve ter data-morpheme-idx="1"');
  assert.includes(ribbonHTML, 'הַ', 'Deve exibir texto hebraico do primeiro fragmento');
  assert.includes(ribbonHTML, 'מֶלֶךְ', 'Deve exibir texto hebraico do segundo fragmento');
});

module.exports = suite;
