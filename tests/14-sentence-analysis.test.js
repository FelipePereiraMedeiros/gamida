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
// TESTE 1: Mapeamento e Classificação das 9 Categorias Morfológicas
// --------------------------------------------------------------------------
suite.test('Classificação correta das 9 categorias morfológicas canônicas', () => {
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

  // 7. Advérbio (incluindo Advérbio Interrogativo)
  assert.equal(getMorphemeCategory('Advérbio'), 'adverb');
  assert.equal(getMorphemeCategory('Advérbio Interrogativo'), 'adverb');
  assert.equal(getMorphemeCategory('Advérbio interrogativo'), 'adverb');
  assert.equal(getMorphemeCategory('Advérbio interrogativo de lugar'), 'adverb');
  assert.equal(getMorphemeCategory('Advérbio de tempo'), 'adverb');
  assert.equal(getMorphemeCategory('Advérbio de lugar'), 'adverb');
  assert.equal(getMorphemeCategory('Advérbio de intensidade'), 'adverb');

  // 8. Sufixo Pronominal
  assert.equal(getMorphemeCategory('Sufixo pronominal'), 'suffix');
  assert.equal(getMorphemeCategory('Sufixo pronominal (com nun enérgico assimilado)'), 'suffix');

  // 9. Partícula / Pronome
  assert.equal(getMorphemeCategory('Pronome demonstrativo'), 'particle');
  assert.equal(getMorphemeCategory('Pronome pessoal independente'), 'particle');
  assert.equal(getMorphemeCategory('Pronome interrogativo'), 'particle');
  assert.equal(getMorphemeCategory('Partícula de negação'), 'particle');
  assert.equal(getMorphemeCategory('Partícula indicadora de objeto direto'), 'particle');
});

// --------------------------------------------------------------------------
// TESTE 2: Metadados e Códigos de Cores no CATEGORY_MAP e CSS
// --------------------------------------------------------------------------
suite.test('CATEGORY_MAP define todas as 9 categorias com classes e hex adequados', () => {
  const expectedKeys = ['article', 'conjunction', 'preposition', 'noun', 'adjective', 'verb', 'adverb', 'suffix', 'particle'];
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
  assert.includes(css, '.morpheme-adverb', 'Classe .morpheme-adverb ausente no styles.css');
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

// --------------------------------------------------------------------------
// TESTE 11: Tipografia Bíblica Padronizada na Frase em Evidência
// --------------------------------------------------------------------------
suite.test('Contêiner da frase hebraica no modal utiliza a tipografia bíblica padrão (SBL Hebrew)', () => {
  const currentCss = require('fs').readFileSync(require('path').join(__dirname, '..', 'css', 'styles.css'), 'utf8');
  const currentHtml = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');

  // Validação no CSS: deve priorizar SBL Hebrew e Ezra SIL antes de fontes modernas
  const containerRule = currentCss.match(/\.hebrew-sentence-container\s*\{[^}]+\}/);
  assert.isTrue(!!containerRule, 'Regra .hebrew-sentence-container deve existir no styles.css');
  assert.includes(containerRule[0], '"SBL Hebrew"', 'Deve incluir "SBL Hebrew" na pilha de fontes');
  assert.includes(containerRule[0], '"Ezra SIL"', 'Deve incluir "Ezra SIL" na pilha de fontes');
  assert.isTrue(
    containerRule[0].indexOf('"SBL Hebrew"') < containerRule[0].indexOf('"Noto Sans Hebrew"'),
    'Fonte bíblica tradicional SBL Hebrew deve ter precedência sobre Noto Sans Hebrew',
  );

  // Validação no HTML: contêiner deve conter hebrew-text
  assert.includes(
    currentHtml,
    'class="hebrew-sentence-container hebrew-text text-white py-2"',
    'Contêiner #sentence-morphemes-container no index.html deve conter a classe hebrew-text',
  );
});

// --------------------------------------------------------------------------
// TESTE 12: Otimização de Hover e Mitigação de Redundâncias de Renderização
// --------------------------------------------------------------------------
suite.test('setActiveMorphemeIndex otimiza hover ignorando chamadas redundantes sem alteração de estado', () => {
  ModalState.isOpen = true;
  ModalState.flatMorphemes = [{ index: 0, tokenIdx: 0, partIdx: 0 }];
  ModalState.activeIndex = 0;
  ModalState.pinnedIndex = null;

  // Chamada idêntica no hover (pin = false) não deve gerar erro ou alterar estado
  setActiveMorphemeIndex(0, false);
  assert.equal(ModalState.activeIndex, 0, 'Estado deve permanecer consistente');
  assert.equal(ModalState.pinnedIndex, null, 'Hover não deve fixar o morfema');

  // Fechamento limpo
  closeSentenceAnalysisModal();
  assert.isFalse(ModalState.isOpen, 'Modal fechado com sucesso');
});

// --------------------------------------------------------------------------
// TESTE 13: Hover no mesmo nível do background (sem saltinho / elevação vertical)
// --------------------------------------------------------------------------
suite.test('Hover dos morfemas e chips permanece no mesmo nível do background sem saltinho (sem translateY)', () => {
  const currentCss = require('fs').readFileSync(require('path').join(__dirname, '..', 'css', 'styles.css'), 'utf8');

  // Regra do .hebrew-sentence-container .morpheme:hover
  const morphemeHoverRule = currentCss.match(/\.hebrew-sentence-container\s+\.morpheme:hover[^{]*\{[^}]+\}/);
  assert.isTrue(!!morphemeHoverRule, 'Regra de hover de morfemas deve existir no styles.css');
  assert.isFalse(morphemeHoverRule[0].includes('translateY'), 'Morfemas em hover não devem conter deslocamento vertical translateY');

  // Regra do .morpheme-chip:hover
  const chipHoverRule = currentCss.match(/\.morpheme-chip:hover\s*\{[^}]+\}/);
  assert.isTrue(!!chipHoverRule, 'Regra .morpheme-chip:hover deve existir no styles.css');
  assert.isFalse(chipHoverRule[0].includes('translateY'), 'Chips em hover não devem conter deslocamento vertical translateY');

  // Validação: Morfemas não possuem borda inferior pontilhada/tracejada
  const morphemeBaseRule = currentCss.match(/\.hebrew-sentence-container\s+\.morpheme\s*\{[^}]+\}/);
  assert.isTrue(!!morphemeBaseRule, 'Regra base de morfemas deve existir no styles.css');
  assert.isFalse(morphemeBaseRule[0].includes('dashed'), 'Morfemas não devem conter borda inferior tracejada/pontilhada');
});

// --------------------------------------------------------------------------
// TESTE 14: Metodologia de Análise Morfológica em 4 Passos no Grego (Johannes Bergmann)
// --------------------------------------------------------------------------
suite.test('Metodologia de Tradução em 4 Passos de Johannes Bergmann aplicada ao Grego', () => {
  const greekSentence = {
    term: "Καὶ αὕτη ἐστὶν ἡ μαρτυρία τοῦ Ἰωάννου·",
    transliteration: "Kai hautē estin hē martyria tou Iōannou",
    type: "Oração Coordenada Copulativa",
    syntax_type: "Oração Copulativa Declarativa (§ 3.4)",
    translations: ["E este é o testemunho de João:"],
    tokens: [
      {
        text: "Καὶ",
        word_class: "Conjunção",
        syntax_role: "Conjunção coordenativa copulativa. Conectivo interfrasal ('E')",
        lemma: "καί",
        meaning: "e, também"
      },
      {
        text: "αὕτη",
        word_class: "Pronome demonstrativo",
        syntax_role: "Sujeito da oração copulativa (nominativo feminino singular: 'esta')",
        lemma: "οὗτος",
        meaning: "este, esta, isto"
      },
      {
        text: "ἐστὶν",
        word_class: "Verbo",
        syntax_role: "Verbo de ligação. Presente do indicativo ativo, 3ª pessoa singular ('é')",
        lemma: "εἰμί",
        meaning: "ser, estar"
      },
      {
        text: "ἡ",
        word_class: "Artigo definido",
        syntax_role: "Determinante do predicativo (nominativo feminino singular: 'a')",
        lemma: "ὁ",
        meaning: "o, a"
      },
      {
        text: "μαρτυρία",
        word_class: "Substantivo",
        syntax_role: "Núcleo do predicativo do sujeito (nominativo feminino singular: 'testemunho')",
        lemma: "μαρτυρία",
        meaning: "testemunho"
      }
    ]
  };

  const flatList = buildFlatMorphemesList(greekSentence);
  assert.equal(flatList.length, 5, 'Deve gerar exatamente 5 vocábulos');

  // Passo 1: Classes Gramaticais Canônicas
  assert.equal(flatList[0].category, 'conjunction', 'Καὶ deve ser conjunção');
  assert.equal(flatList[1].category, 'pronoun', 'αὕτη deve ser pronome no grego');
  assert.equal(flatList[2].category, 'verb', 'ἐστὶν deve ser verbo');
  assert.equal(flatList[3].category, 'article', 'ἡ deve ser artigo');
  assert.equal(flatList[4].category, 'noun', 'μαρτυρία deve ser substantivo');

  // Passo 2, 3 e 4 via parseGreekStepDetails
  const verbDetails = parseGreekStepDetails(greekSentence.tokens[2], greekSentence);
  assert.isTrue(verbDetails.step1Class.includes('Verbo'), 'Passo 1 do verbo: Verbo');
  assert.isTrue(verbDetails.step2Morphology.includes('Presente do indicativo ativo, 3ª pessoa singular'), 'Passo 2 do verbo: tempo, modo, voz, pessoa e número');
  assert.equal(verbDetails.step3Lemma, 'εἰμί', 'Passo 3 do verbo: lema no vocabulário');
  assert.equal(verbDetails.step3Translation, 'é', 'Passo 3 do verbo: tradução contextual no ponto da oração');
  assert.equal(verbDetails.continuousTranslation, 'E este é o testemunho de João:', 'Passo 4: linha contínua da oração');

  // Passo 2 do Pronome demonstrativo
  const pronDetails = parseGreekStepDetails(greekSentence.tokens[1], greekSentence);
  assert.isTrue(pronDetails.step2Morphology.includes('nominativo feminino singular'), 'Passo 2 do pronome: caso, gênero e número');
  assert.equal(pronDetails.step3Lemma, 'οὗτος', 'Passo 3 do pronome: lema no vocabulário');
});

// --------------------------------------------------------------------------
// TESTE 15: Categoria Pronome no Grego e Orientação LTR
// --------------------------------------------------------------------------
suite.test('Categoria Pronome e Orientação LTR no Grego (§ Bergmann)', () => {
  // Teste de classificação
  assert.equal(getMorphemeCategory('Pronome demonstrativo', true), 'pronoun', 'Deve mapear pronome demonstrativo para pronoun no Grego');
  assert.equal(getMorphemeCategory('Pronome pessoal', true), 'pronoun', 'Deve mapear pronome pessoal para pronoun no Grego');
  assert.equal(getMorphemeCategory('Pronome relativo', true), 'pronoun', 'Deve mapear pronome relativo para pronoun no Grego');

  // No hebraico, pronomes isolados caem em particle por padrão histórico da gramática de Kelley
  assert.equal(getMorphemeCategory('Pronome pessoal', false), 'particle', 'No Hebraico pronomes isolados caem em particle');

  // Metadados do Pronome no CATEGORY_MAP
  assert.isTrue(!!CATEGORY_MAP.pronoun, 'Categoria pronoun deve existir no CATEGORY_MAP');
  assert.equal(CATEGORY_MAP.pronoun.colorName, 'Fúcsia / Violeta');
  assert.equal(CATEGORY_MAP.pronoun.glowClass, 'morpheme-pronoun');

  // Detecção de frase grega LTR
  const greekSentence = { term: "Ἐν ἀρχῇ ἦν ὁ λόγος" };
  assert.isTrue(isGreekSentence(greekSentence), 'Deve detectar oração grega com sucesso');
});

// --------------------------------------------------------------------------
// TESTE 16: Linha Interlinear e Linha Contínua Pedagógica de Tradução (Passo 4)
// --------------------------------------------------------------------------
suite.test('Visão Global com Linha Interlinear e Linha Contínua de Tradução Fluente', () => {
  const greekSentence = {
    term: "Ἐν ἀρχῇ ἦν ὁ λόγος",
    transliteration: "En archē ēn ho logos",
    syntax_type: "Oração Teológica Declarativa (§ 2.3)",
    translations: ["No princípio era o Verbo"],
    tokens: [
      { text: "Ἐν", word_class: "Preposição", syntax_role: "Preposição que rege o dativo ('Em')", lemma: "ἐν" },
      { text: "ἀρχῇ", word_class: "Substantivo", syntax_role: "Dativo feminino singular ('princípio')", lemma: "ἀρχή" },
      { text: "ἦν", word_class: "Verbo", syntax_role: "Imperfeito do indicativo ativo, 3ª sg ('era')", lemma: "εἰμί" },
      { text: "ὁ", word_class: "Artigo definido", syntax_role: "Nominativo masculino singular ('o')", lemma: "ὁ" },
      { text: "λόγος", word_class: "Substantivo", syntax_role: "Nominativo masculino singular ('Palavra / Verbo')", lemma: "λόγος" }
    ]
  };

  const globalHtml = renderGlobalSentenceView(greekSentence);
  assert.isTrue(globalHtml.includes('interlinear-word'), 'Deve conter botões de dissecação interlinear');
  assert.isTrue(globalHtml.includes('continuous-translation-line'), 'Deve conter linha contínua de tradução');
  assert.isTrue(globalHtml.includes('No princípio era o Verbo'), 'Deve conter a redação fluente em português da oração');
  assert.isTrue(globalHtml.includes('Johannes Bergmann'), 'Deve remeter à gramática de Johannes Bergmann');

  // Visão dissecada de morfema grego
  const flat = buildFlatMorphemesList(greekSentence);
  const dissectionHtml = renderMorphemeDissectionView(flat[2], greekSentence);
  assert.isTrue(dissectionHtml.includes('Passo 1: Classe Gramatical'), 'Morfema grego deve conter Passo 1');
  assert.isTrue(dissectionHtml.includes('Passo 2: Morfologia &amp; Inflexão') || dissectionHtml.includes('Passo 2: Morfologia & Inflexão'), 'Morfema grego deve conter Passo 2');
  assert.isTrue(dissectionHtml.includes('Passo 3: Vocabulário'), 'Morfema grego deve conter Passo 3');
  assert.isTrue(dissectionHtml.includes('Passo 4: Linha Contínua'), 'Morfema grego deve conter Passo 4');
});

// --------------------------------------------------------------------------
// TESTE 17: Validação do Capítulo 13 e Prevenção do Bug "Partícula / Segmento X"
// --------------------------------------------------------------------------
suite.test('Capítulo 13 e Frases Gregas não geram genericamente "partícula" nem "segmento x"', () => {
  const fs = require('fs');
  const path = require('path');
  const greekDbPath = path.resolve(__dirname, '../data/greek_chapters.json');
  const greekData = JSON.parse(fs.readFileSync(greekDbPath, 'utf8'));

  // Localizar capítulo 13
  const ch13 = greekData.find(c => c.id === 'bergmann_13');
  assert.isTrue(!!ch13, 'Capítulo 13 deve existir no banco de dados');
  assert.equal(ch13.sentences.length, 8, 'Capítulo 13 deve conter exatamente 8 sentenças');

  // Testar todas as sentenças do Capítulo 13
  ch13.sentences.forEach((sent, sIdx) => {
    assert.isTrue(Array.isArray(sent.tokens) && sent.tokens.length > 0, `Sentença ${sIdx + 1} do Cap 13 deve ter tokens`);
    const flatList = buildFlatMorphemesList(sent);
    assert.isTrue(flatList.length > 0, `Sentença ${sIdx + 1} do Cap 13 deve gerar lista de morfemas`);

    // Verificar que NENHUM elemento é genericamente "Vocábulo" ou "Segmento X"
    flatList.forEach((m, mIdx) => {
      assert.isTrue(m.word_class !== 'Vocábulo', `Morfema ${mIdx + 1} da sent ${sIdx + 1} não pode ser 'Vocábulo'`);
      assert.isTrue(!m.syntax_role.includes('Segmento '), `Morfema ${mIdx + 1} da sent ${sIdx + 1} não pode ter 'Segmento X'`);
      assert.isTrue(m.category !== 'particle' || m.word_class.toLowerCase().includes('partícula') || m.word_class.toLowerCase().includes('conjunção'),
        `Morfema ${m.text} não deve cair em particle genericamente`);
    });
  });

  // Testar também o mecanismo de fallback inferGreekWordFallback caso uma frase sem tokens seja passada
  const rawSentence = {
    term: "Ἐγένετο ἄνθρωπος ἀπεσταλμένος παρὰ Θεοῦ"
  };
  const fallbackFlat = buildFlatMorphemesList(rawSentence);
  assert.equal(fallbackFlat.length, 5, 'Deve gerar 5 vocábulos via fallback inteligente');
  // 'Ἐγένετο' deve ser inferido como verbo (ou com verbo na classe), NÃO 'particle'
  assert.isTrue(fallbackFlat[0].category === 'verb', 'Ἐγένετο deve ser inferido como verbo no fallback');
  // 'παρὰ' deve ser preposição
  assert.isTrue(fallbackFlat[3].category === 'preposition', 'παρὰ deve ser inferido como preposição');
  // Nenhum deve ser chamado "Segmento 1", "Segmento 2"...
  fallbackFlat.forEach((m, idx) => {
    assert.isTrue(!m.syntax_role.includes('Segmento '), `Fallback do token ${idx + 1} não deve ter 'Segmento X'`);
  });
});

module.exports = suite;


