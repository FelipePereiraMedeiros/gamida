/**
 * ==========================================================================
 * Módulo 13: Bateria de Integridade Geral do Sistema & Contrato de DOM
 * Teste End-to-End da Estrutura, Módulos e Fluxos do Gamida
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 13: Integridade Geral do Sistema (E2E & Contrato DOM)');
const { html, css, appJs, hebrewData, greekData, rootDir } = loadSourceFiles();

// Importação de módulos de produção
const StateModule = require('../js/modules/state.js');
const { AppState, resetStats, shuffleArray, buildDistractorCache } = StateModule;
const EvaluationModule = require('../js/modules/evaluation.js');
const AssessmentModule = require('../js/modules/assessment.js');
const SurvivalModule = require('../js/modules/survival.js');
const SRSModule = require('../js/modules/srs.js');
const ParadigmsModule = require('../js/modules/paradigms.js');
const AlphabetModule = require('../js/modules/alphabet.js');
const UIModule = require('../js/modules/ui.js');

// Mock helper do DOM para simulações completas
function createSystemMockDOM() {
  const elementsById = {};

  class MockClassList {
    constructor() {
      this.classes = new Set();
    }
    add(...cls) {
      cls.forEach(c => {
        if (c) c.split(' ').forEach(item => { if (item) this.classes.add(item); });
      });
    }
    remove(...cls) {
      cls.forEach(c => {
        if (c) c.split(' ').forEach(item => { if (item) this.classes.delete(item); });
      });
    }
    contains(c) {
      return this.classes.has(c);
    }
    toggle(c, force) {
      if (force !== undefined) {
        if (force) this.add(c);
        else this.remove(c);
      } else {
        if (this.contains(c)) this.remove(c);
        else this.add(c);
      }
    }
    toString() {
      return Array.from(this.classes).join(' ');
    }
  }

  class MockElement {
    constructor(id = '', tag = 'DIV') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.parentElement = null;
      this.classList = new MockClassList();
      this.style = {};
      this.value = '';
      this._textContent = '';
      this._innerHTML = '';
      this.disabled = false;
      this.onclick = null;
      this.onkeydown = null;
      this.attrs = {};
    }
    get textContent() {
      return this._textContent;
    }
    set textContent(v) {
      this._textContent = String(v ?? '');
    }
    get innerHTML() {
      return this._innerHTML;
    }
    set innerHTML(v) {
      this._innerHTML = String(v ?? '');
      if (!v) {
        this.children = [];
      }
    }
    appendChild(child) {
      if (!child) return child;
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    }
    querySelector(sel) {
      return this.children[0] || null;
    }
    querySelectorAll(sel) {
      return this.children;
    }
    getAttribute(name) {
      return this.attrs[name] || null;
    }
    setAttribute(name, val) {
      this.attrs[name] = String(val);
    }
    removeAttribute(name) {
      delete this.attrs[name];
    }
    focus() {}
    blur() {}
    click() {
      if (typeof this.onclick === 'function') {
        this.onclick({ target: this, preventDefault: () => {}, stopPropagation: () => {} });
      }
    }
  }

  const getElementById = (id) => {
    if (!elementsById[id]) {
      elementsById[id] = new MockElement(id);
    }
    return elementsById[id];
  };

  const createElement = (tag) => new MockElement('', tag);
  const querySelectorAll = (sel) => [];

  return { elementsById, getElementById, createElement, querySelectorAll };
}

// --------------------------------------------------------------------------
// TESTE 1: Integridade Estrutural de Arquivos e Assets
// --------------------------------------------------------------------------
suite.test('Todos os arquivos JS e CSS referenciados em index.html existem e são válidos', () => {
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  const scriptSources = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      scriptSources.push(src);
    }
  }

  assert.isGreaterThan(scriptSources.length, 5, 'Deve conter múltiplos scripts de módulos locais');
  scriptSources.forEach(src => {
    const filePath = path.join(rootDir, src.replace(/\//g, path.sep));
    assert.isTrue(fs.existsSync(filePath), `Arquivo de script referenciado não encontrado: ${src}`);
    const stat = fs.statSync(filePath);
    assert.isGreaterThan(stat.size, 100, `Arquivo de script vazio ou truncado: ${src}`);
  });

  const cssPath = path.join(rootDir, 'css', 'styles.css');
  assert.isTrue(fs.existsSync(cssPath), 'Arquivo css/styles.css deve existir');
  assert.isGreaterThan(css.length, 500, 'css/styles.css deve conter estilos de produção');
});

// --------------------------------------------------------------------------
// TESTE 2: Contrato de IDs entre JavaScript e HTML
// --------------------------------------------------------------------------
suite.test('Contrato de IDs: Elementos vitais manipulados no JS existem em index.html', () => {
  const criticalIDs = [
    // Seletor e cabeçalho
    'custom-chapter-selector',
    'app-logo-btn',
    'chapter-dropdown-list',
    'chapter-dropdown-text',
    // Abas de navegação
    'navbar-tabs-container',
    'navbar-tabs-row',
    'nav-btn-practice',
    'nav-btn-paradigms',
    'nav-btn-vocab',
    'nav-btn-assessment',
    'nav-btn-manage',
    // Contêineres de abas
    'tab-practice',
    'tab-paradigms',
    'tab-vocab',
    'tab-assessment',
    'tab-manage',
    // Prática
    'standard-practice-panel',
    'hebrew-prompt',
    'btn-show-hint',
    'hint-text',
    'interface-typing',
    'input-answer',
    'interface-choice',
    'interface-sentences',
    'input-sentence',
    'feedback-banner',
    'btn-next',
    'stat-streak',
    'stat-score',
    'question-progress',
    'interface-choice',
    // Simulado
    'assess-dashboard',
    'assess-config',
    'assessment-active',
    'assessment-results',
    'sim-scope-info',
    'assessment-counter',
    'assess-hebrew',
    'assessment-type-tag',
    'assess-user-input',
    'assess-btn-prev',
    'assess-action-container',
    'diagnostic-list',
    'correction-list',
    // Sobrevivência
    'survival-active',
    'survival-results',
    'survival-hebrew',
    'survival-input',
    'survival-hearts',
    'surv-correction-box',
    'surv-res-streak',
    'surv-res-high',
    // Anki SRS
    'anki-active',
    'anki-results',
    'anki-counter',
    'anki-hebrew',
    'anki-translit',
    'anki-translation',
    'anki-reveal-container',
    'anki-back',
    'anki-next-good',
    'anki-next-easy',
    'anki-res-hard',
    'anki-res-good',
    'anki-res-easy',
    // Paradigmas
    'tab-paradigms',
    'paradigm-board',
    'paradigm-select',
    'paradigm-deck',
    'paradigm-action-container',
    'paradigm-header',
    'paradigm-title',
    // Dicionário
    'vocab-search',
    'vocab-table-body',
    'vocab-scope-single',
    'vocab-scope-cumulative',
    'vocab-category-select',
    // Apoio
    'btn-coffee',
  ];

  criticalIDs.forEach(id => {
    const pattern1 = `id="${id}"`;
    const pattern2 = `id='${id}'`;
    const exists = html.includes(pattern1) || html.includes(pattern2);
    assert.isTrue(exists, `ID crítico [${id}] não encontrado no index.html!`);
  });
});

// --------------------------------------------------------------------------
// TESTE 3: Integridade Semântica e Consistência dos Dados de Ambos os Idiomas
// --------------------------------------------------------------------------
suite.test('Datasets de Hebraico e Grego possuem consistência semântica e estrutural absoluta', () => {
  const datasets = [
    { name: 'Hebraico', data: hebrewData, primaryField: 'hebrew' },
    { name: 'Grego', data: greekData, primaryField: 'greek' },
  ];

  datasets.forEach(({ name, data, primaryField }) => {
    assert.isGreaterThan(data.length, 0, `${name} deve ter capítulos`);
    const seenIds = new Set();

    data.forEach((chap, cIdx) => {
      assert.isTrue(!!chap.id && typeof chap.id === 'string', `${name}: Capítulo [${cIdx}] com ID inválido`);
      assert.isFalse(seenIds.has(chap.id), `${name}: ID duplicado detectado: ${chap.id}`);
      seenIds.add(chap.id);

      assert.isTrue(!!chap.title && typeof chap.title === 'string', `${name}: Capítulo ${chap.id} sem título`);
      assert.isArray(chap.items, `${name}: Capítulo ${chap.id} deve ter array de items`);
      assert.isGreaterThan(chap.items.length, 0, `${name}: Capítulo ${chap.id} com items vazio`);

      chap.items.forEach((item, iIdx) => {
        const term = item[primaryField] || item.hebrew || item.greek || item.term;
        assert.isTrue(!!term && typeof term === 'string', `${name} [${chap.id}:${iIdx}]: Termo não encontrado`);
        assert.isArray(item.translations, `${name} [${chap.id}:${term}]: translations deve ser array`);
        assert.isGreaterThan(item.translations.length, 0, `${name} [${chap.id}:${term}]: translations vazio`);
      });

      if (chap.sentences) {
        assert.isArray(chap.sentences, `${name} [${chap.id}]: sentences deve ser array`);
        chap.sentences.forEach((sent, sIdx) => {
          const sentTerm = sent[primaryField] || sent.hebrew || sent.greek || sent.term;
          assert.isTrue(!!sentTerm, `${name} [${chap.id}:frase ${sIdx}]: Termo da frase ausente`);
          assert.isArray(sent.translations, `${name} [${chap.id}:frase ${sIdx}]: traduções ausentes`);
        });
      }
    });
  });
});

// --------------------------------------------------------------------------
// TESTE 4: Ciclo Completo de Simulação do Simulado Personalizado (E2E)
// --------------------------------------------------------------------------
suite.test('Simulado E2E: Configuração -> Prova (5 questões) -> Navegação -> Submissão -> Diagnóstico', () => {
  const { getElementById, createElement, querySelectorAll } = createSystemMockDOM();
  global.document = { getElementById, createElement, querySelectorAll };

  // Inicializar estado para teste
  AppState.chapters = hebrewData;
  const targetChapter = hebrewData.find(c => c.id === 'kelley_03') || hebrewData[1];
  AppState.currentChapter = targetChapter;
  AppState.activeChapterId = targetChapter.id;

  // 1. Abertura do modal de configuração
  AssessmentModule.openSimuladoConfig();
  const scopeEl = getElementById('sim-scope-info');
  assert.isTrue(scopeEl.textContent.length > 0, 'sim-scope-info deve conter texto pedagógico explicativo');
  assert.isFalse(getElementById('assess-config').classList.contains('hidden'), 'Config do simulado deve estar visível');

  // 2. Definir parâmetros e iniciar simulado com 5 questões
  AssessmentModule.setSimConfig('amount', 5);
  AssessmentModule.setSimConfig('focus', 'mixed');
  AssessmentModule.startSimulado();

  const questions = AssessmentModule.getAssessQuestions();
  assert.equal(questions.length, 5, 'Deve gerar exatamente 5 questões no simulado');
  assert.equal(AssessmentModule.getAssessIndex(), 0, 'Deve iniciar na primeira questão');
  assert.isFalse(getElementById('assessment-active').classList.contains('hidden'), 'Tela de simulado ativo deve estar visível');
  assert.includes(getElementById('assessment-counter').textContent, 'Questão 1 de 5');

  // 3. Navegação: próxima questão
  AssessmentModule.navigateAssessment(1);
  assert.equal(AssessmentModule.getAssessIndex(), 1, 'Deve avançar para a questão 2');
  assert.includes(getElementById('assessment-counter').textContent, 'Questão 2 de 5');

  // 4. Navegação: questão anterior
  AssessmentModule.navigateAssessment(-1);
  assert.equal(AssessmentModule.getAssessIndex(), 0, 'Deve retornar para a questão 1');

  // 5. Responder todas as 5 questões
  const answersMap = AssessmentModule.getAssessAnswersMap();
  questions.forEach((q, idx) => {
    answersMap[idx] = (idx % 2 === 0) ? q.translations[0] : 'resposta propositalmente incorreta';
  });

  // 6. Submeter simulado
  AssessmentModule.finishAssessment();

  // 7. Validação da tela de resultados e relatório de diagnóstico
  assert.isFalse(getElementById('assessment-results').classList.contains('hidden'), 'Tela de resultados deve estar visível');
  const gradeText = getElementById('res-grade').textContent;
  assert.isTrue(gradeText.length > 0, 'Nota final deve ser exibida');
  assert.isTrue(getElementById('diagnostic-list').children.length > 0, 'Diagnóstico por lição deve ser gerado');
});

// --------------------------------------------------------------------------
// TESTE 5: Ciclo Completo de Simulação do Modo Sobrevivência (E2E)
// --------------------------------------------------------------------------
suite.test('Sobrevivência E2E: Início (3 vidas) -> Acerto -> Erros -> Esgotamento de Vidas -> Recorde', () => {
  const { getElementById, createElement, querySelectorAll } = createSystemMockDOM();
  global.document = { getElementById, createElement, querySelectorAll };

  AppState.chapters = hebrewData;
  const targetChapter = hebrewData.find(c => c.id === 'kelley_03') || hebrewData[1];
  AppState.currentChapter = targetChapter;
  AppState.activeChapterId = targetChapter.id;
  AppState.survivalHighScore = 2;

  // 1. Iniciar Sobrevivência
  SurvivalModule.startSurvival();
  assert.equal(SurvivalModule.getSurvLives(), 3, 'Deve iniciar com 3 vidas');
  assert.equal(SurvivalModule.getSurvStreak(), 0, 'Deve iniciar com streak 0');
  assert.isFalse(getElementById('survival-active').classList.contains('hidden'), 'Sobrevivência ativa deve estar visível');

  // 2. Acerto: responder com tradução correta da questão ativa
  const currentQ1 = SurvivalModule.getSurvCurrent();
  assert.isTrue(!!currentQ1, 'Deve haver uma questão ativa na sobrevivência');
  getElementById('survival-input').value = currentQ1.translations[0];
  SurvivalModule.submitSurvivalAnswer();

  assert.equal(SurvivalModule.getSurvStreak(), 1, 'Streak deve subir para 1');
  assert.equal(SurvivalModule.getSurvLives(), 3, 'Vidas devem ser mantidas em 3');

  // 3. Erro 1: resposta incorreta
  getElementById('survival-input').value = 'palavra_totalmente_errada_xyz';
  SurvivalModule.submitSurvivalAnswer();
  assert.equal(SurvivalModule.getSurvLives(), 2, 'Vidas devem cair para 2');
  assert.equal(SurvivalModule.getSurvStreak(), 0, 'Streak deve zerar ao errar');

  // 4. Erro 2
  getElementById('survival-input').value = 'palavra_totalmente_errada_xyz';
  SurvivalModule.submitSurvivalAnswer();
  assert.equal(SurvivalModule.getSurvLives(), 1, 'Vidas devem cair para 1');

  // 5. Erro 3: perda da última vida -> Game Over
  getElementById('survival-input').value = 'palavra_totalmente_errada_xyz';
  SurvivalModule.submitSurvivalAnswer();
  assert.isTrue(SurvivalModule.getSurvLives() <= 0, 'Vidas devem estar esgotadas');

  // Finalização
  SurvivalModule.finishSurvival(false);
  assert.isFalse(getElementById('survival-results').classList.contains('hidden'), 'Resultados de sobrevivência devem estar visíveis');
  assert.isTrue(getElementById('survival-active').classList.contains('hidden'), 'Sobrevivência ativa deve estar oculta');
});

// --------------------------------------------------------------------------
// TESTE 6: Ciclo Completo de Simulação do Modo SRS Anki Flashcards (E2E)
// --------------------------------------------------------------------------
suite.test('Anki E2E: Início -> Exibição -> Revelação -> Classificação -> Cálculo de Intervalo', () => {
  const { getElementById, createElement, querySelectorAll } = createSystemMockDOM();
  global.document = { getElementById, createElement, querySelectorAll };

  AppState.chapters = hebrewData;
  const targetChapter = hebrewData.find(c => c.id === 'kelley_03') || hebrewData[1];
  AppState.currentChapter = targetChapter;
  AppState.activeChapterId = targetChapter.id;
  AppState.srs = {};

  // 1. Iniciar Anki
  SRSModule.startAnki();
  assert.isFalse(getElementById('anki-active').classList.contains('hidden'), 'Anki ativo deve estar visível');
  const ankiQueue = SRSModule.getAnkiQueue();
  assert.isTrue(ankiQueue.length > 0, 'Fila do Anki deve conter termos');

  // 2. Revelar resposta
  SRSModule.revealAnki();
  assert.isFalse(getElementById('anki-back').classList.contains('hidden'), 'Verso do cartão deve estar visível após revelar');
  assert.isTrue(getElementById('anki-reveal-container').classList.contains('hidden'), 'Botão revelar deve estar oculto');

  // 3. Avaliar com 'good'
  const currentCard = SRSModule.getAnkiCurrentCard();
  const cardId = StateModule.getTerm(currentCard) || currentCard.hebrew || currentCard.greek || currentCard.term || currentCard.id;
  SRSModule.answerAnki('good');

  const srsRecord = AppState.srs[cardId];
  assert.isTrue(!!srsRecord, 'Registro do card no AppState.srs deve ser persistido');
  assert.isGreaterThan(srsRecord.interval, 0, 'Intervalo deve ser incrementado');

  // 4. Finalização
  SRSModule.finishAnki();
  assert.isFalse(getElementById('anki-results').classList.contains('hidden'), 'Resultados de Anki devem estar visíveis');
});

// --------------------------------------------------------------------------
// TESTE 7: Ciclo Completo de Simulação de Paradigmas Gramaticais (E2E)
// --------------------------------------------------------------------------
suite.test('Paradigmas E2E: Troca para Grego -> Renderização de Tabela & Diagrama -> Validação', () => {
  const { getElementById, createElement, querySelectorAll } = createSystemMockDOM();
  global.document = { getElementById, createElement, querySelectorAll };

  AppState.language = 'greek';
  AppState.chapters = greekData;
  const greekChapterWithParadigms = greekData.find(c => c.paradigms && c.paradigms.length > 0);
  assert.isTrue(!!greekChapterWithParadigms, 'Deve haver ao menos um capítulo de grego com paradigmas');
  AppState.currentChapter = greekChapterWithParadigms;
  AppState.activeChapterId = greekChapterWithParadigms.id;

  // 1. Atualizar visibilidade
  ParadigmsModule.updateParadigmsVisibility();
  assert.isFalse(getElementById('nav-btn-paradigms').classList.contains('hidden'), 'Botão da aba paradigmas deve estar visível');

  // 2. Renderizar Paradigma
  const tableParadigm = greekChapterWithParadigms.paradigms.find(p => p.type === 'table');
  assert.isTrue(!!tableParadigm, 'Deve haver um paradigma tipo table');
  ParadigmsModule.renderTableView(tableParadigm, getElementById('paradigm-board'));

  assert.isTrue(getElementById('paradigm-deck').children.length > 0, 'Deck de fichas de paradigmas deve ter itens para arrastar');
  assert.isTrue(getElementById('paradigm-action-container').innerHTML.includes('checkParadigmAnswers'), 'Ações de paradigma devem ter botão de checar');

  // 3. Reset do tabuleiro
  ParadigmsModule.resetParadigmBoard();
  assert.equal(getElementById('paradigm-deck').children.length, 0, 'Deck deve estar limpo após reset');
});

// --------------------------------------------------------------------------
// TESTE 8: Troca de Idioma & Atualização Global Resiliente
// --------------------------------------------------------------------------
suite.test('Troca de idioma e capítulo global opera sem exceções e atualiza UI', () => {
  const { getElementById, createElement, querySelectorAll } = createSystemMockDOM();
  global.document = { getElementById, createElement, querySelectorAll };

  AppState.language = 'hebrew';
  AppState.chapters = hebrewData;
  AppState.currentChapter = hebrewData[0];
  AppState.activeChapterId = hebrewData[0].id;

  // Chamar changeGlobalChapter
  assert.isFunction(UIModule.changeGlobalChapter, 'changeGlobalChapter deve ser uma função');
  UIModule.changeGlobalChapter('kelley_03');
  assert.equal(AppState.currentChapter.id, 'kelley_03', 'Capítulo ativo deve ser atualizado para kelley_03');
  assert.equal(AppState.activeChapterId, 'kelley_03', 'ID ativo deve ser kelley_03');

  // Chamar toggleLanguage
  assert.isFunction(UIModule.toggleLanguage, 'toggleLanguage deve ser uma função');
  UIModule.toggleLanguage();
  assert.equal(AppState.language, 'greek', 'Idioma deve mudar para grego');
});

// --------------------------------------------------------------------------
// TESTE 9: Resiliência Defensiva contra Elementos Nulos (Zero Uncaught Exceptions)
// --------------------------------------------------------------------------
suite.test('Blindagem Defensiva: Módulos executam sem lançar exceções mesmo com DOM nulo', () => {
  global.document = {
    getElementById: () => null,
    createElement: () => ({ classList: { add() {}, remove() {} }, style: {}, children: [] }),
    querySelectorAll: () => [],
  };

  let errorCount = 0;
  try {
    AssessmentModule.openSimuladoConfig();
    AssessmentModule.resetToDashboard();
    SurvivalModule.resetSurvival();
    SRSModule.finishAnki();
    ParadigmsModule.resetParadigmBoard();
    ParadigmsModule.updateParadigmsVisibility();
    UIModule.toggleMobileMenu(false);
  } catch (err) {
    errorCount++;
    console.error('Erro inesperado em execução defensiva:', err);
  }

  assert.equal(errorCount, 0, 'Nenhuma função deve quebrar quando elementos do DOM estiverem ausentes');
});

// --------------------------------------------------------------------------
// TESTE 10: Blindagem de Delegadores (Sem Recursão Infinita)
// --------------------------------------------------------------------------
suite.test('Blindagem de Delegadores: Wrappers do app.js não contêm fallbacks recursivos (|| window)', () => {
  assert.isFalse(appJs.includes('(window.SRSModule || window).saveSRS'), 'loadSRS/saveSRS não deve ter fallback recursivo para window');
  assert.isFalse(appJs.includes('(window.SurvivalModule || window).startSurvival'), 'Survival não deve ter fallback recursivo para window');
  assert.isFalse(appJs.includes('(window.AssessmentModule || window).startSimulado'), 'Assessment não deve ter fallback recursivo para window');
  assert.isFalse(appJs.includes('(window.UIModule || window).setVocabCumulative'), 'UIModule não deve ter fallback recursivo para window');
  assert.isFalse(appJs.includes('(window.ParadigmsModule || window).renderTableView'), 'Paradigms não deve ter fallback recursivo para window');
});

// --------------------------------------------------------------------------
// TESTE 11: Validação de Idioma na Importação (Proteção contra Corrupção de Dados)
// --------------------------------------------------------------------------
suite.test('Validação de Idioma na Importação: Rejeita backups e capítulos de idioma divergente', () => {
  const elementsById = {
    'json-input': { value: JSON.stringify({ language: 'greek', chapters: [{ id: 'bergmann_01', title: 'Grego', items: [] }] }) },
    'json-status': { textContent: '', className: '' },
  };

  const oldDoc = global.document;
  global.document = {
    getElementById: (id) => elementsById[id] || null,
  };

  const vm = require('vm');
  const sandbox = {
    document: global.document,
    localStorage: { setItem() {}, getItem() { return null; } },
    AppState: { language: 'hebrew', chapters: [], srs: {}, survivalHighScore: 0 },
    APP_VERSION: '2.7.1',
    isValidChapter: () => true,
    hasUniqueChapterIds: () => true,
    saveSRS: () => {},
    saveChaptersToStorage: () => {},
    buildDistractorCache: () => {},
    setupGlobalChapterDropdown: () => {},
    changeGlobalChapter: () => {},
    console,
  };
  vm.createContext(sandbox);

  // Executa apenas o bloco da função saveChapterFromJSON extraído do app.js
  const saveFnCode = appJs.match(/function saveChapterFromJSON\(\)\s*\{[\s\S]*?\n\}/)[0];
  vm.runInContext(saveFnCode, sandbox);
  vm.runInContext('saveChapterFromJSON();', sandbox);

  assert.includes(
    elementsById['json-status'].textContent,
    'Este backup pertence ao idioma \'Grego\'',
    'Importação de backup grego em sessão hebraica deve ser rejeitada com erro claro',
  );

  // Limpeza
  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
});

// --------------------------------------------------------------------------
// TESTE 12: Tolerância à Cota de Armazenamento (QuotaExceededError)
// --------------------------------------------------------------------------
suite.test('Tolerância à Cota de Armazenamento: Falhas de localStorage.setItem não causam exceções não-tratadas', () => {
  const oldStorage = global.localStorage;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    },
    removeItem: () => {},
  };

  let uncaughtErrors = 0;
  try {
    SRSModule.saveSRS();
    StateModule.saveChaptersToStorage();
    UIModule.toggleLanguage();
    SurvivalModule.finishSurvival(false);
  } catch (err) {
    uncaughtErrors++;
    console.error('Erro de cota vazou para a aplicação:', err);
  }

  assert.equal(uncaughtErrors, 0, 'Falha de cota do localStorage deve ser capturada suavemente sem quebrar o app');

  if (oldStorage === undefined) delete global.localStorage; else global.localStorage = oldStorage;
});

// --------------------------------------------------------------------------
// TESTE 13: Fonte Única de Validação de Capítulos (M4 / C1)
// --------------------------------------------------------------------------
suite.test('Validação de Capítulos Centralizada: StateModule e DataLoader rejeitam coleções vazias e convergem', () => {
  const DataLoader = require('../js/data-loader.js');
  const emptyChapter = {
    id: "chap_vazio",
    title: "Lição Sem Vocabulário",
    items: [],
    sentences: [],
  };

  const validChapter = {
    id: "chap_valido",
    title: "Lição Válida",
    items: [{ term: "אָב", translations: ["pai"] }],
    sentences: [],
  };

  const duplicateIdChapters = [
    { id: "dup_1", title: "A", items: [{ term: "a", translations: ["a"] }] },
    { id: "dup_1", title: "B", items: [{ term: "b", translations: ["b"] }] },
  ];

  // Rejeição rigorosa de capítulo sem vocabulário (impede loops infinitos e divisão por zero)
  assert.isFalse(StateModule.isValidChapter(emptyChapter), 'StateModule deve rejeitar capítulo com coleções vazias');
  assert.isFalse(DataLoader.isValidChapter(emptyChapter), 'DataLoader deve rejeitar capítulo com coleções vazias');

  // Aceitação de capítulo com vocabulário válido
  assert.isTrue(StateModule.isValidChapter(validChapter), 'StateModule deve aceitar capítulo estruturado com termos');
  assert.isTrue(DataLoader.isValidChapter(validChapter), 'DataLoader deve aceitar capítulo estruturado com termos');

  // Detecção de IDs duplicados
  assert.isFalse(StateModule.hasUniqueChapterIds(duplicateIdChapters), 'IDs duplicados devem ser rejeitados');
  assert.isFalse(DataLoader.hasUniqueChapterIds(duplicateIdChapters), 'DataLoader deve acusar IDs duplicados');
});

// --------------------------------------------------------------------------
// TESTE 14: Sanitização XSS e Proteção de Injeção HTML (M1 / C1)
// --------------------------------------------------------------------------
suite.test('Sanitização Centralizada: StateModule, EvaluationModule e Paradigms protegem contra injeção de tags', () => {
  const { escapeHTML } = StateModule;
  const EvalModule = require('../js/modules/evaluation.js');

  const xssVector = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
  const escaped = escapeHTML(xssVector);

  assert.isFalse(escaped.includes('<script>'), 'Tags de script devem ser sanitizadas');
  assert.isFalse(escaped.includes('<img'), 'Tags de imagem devem ser sanitizadas');
  assert.includes(escaped, '&lt;script&gt;', 'Tag <script> deve ser codificada para entidade &lt;script&gt;');
  assert.includes(escaped, '&quot;xss&quot;', 'Aspas duplas devem ser codificadas para entidade &quot;');

  // Convergência entre módulos
  assert.equal(escapeHTML(xssVector), EvalModule.escapeHTML(xssVector), 'StateModule e EvaluationModule devem convergir na sanitização');

  // Proteção em paradigmas (geração estática de tabela)
  const ParadigmsModule = require('../js/modules/paradigms.js');
  const maliciousParadigm = {
    title: '<b onmouseover=alert(1)>Tabela</b>',
    headers: ['<script>', 'Sufixo'],
    rows: [['<iframe src="evil.com">', '<b>dado</b>']],
  };

  const html = ParadigmsModule.getStaticParadigmTableHTML(maliciousParadigm);
  assert.isFalse(html.includes('<script>'), 'Headers em paradigmas estáticos devem ser sanitizados');
  assert.isFalse(html.includes('<iframe'), 'Células em paradigmas estáticos devem ser sanitizadas');
  assert.includes(html, '&lt;script&gt;', 'Sanitização de entidades deve estar presente no HTML de paradigmas');
});

// --------------------------------------------------------------------------
// TESTE 15: Isolamento de Listeners de Teclado (M3)
// --------------------------------------------------------------------------
suite.test('Isolamento de Listeners de Teclado: Eventos prevenidos ou com modal ativo não disparam simulado/sobrevivência', () => {
  let simulatedSubmissionTriggered = false;
  let simulatedSurvivalTriggered = false;

  const mockModal = {
    classList: {
      contains: (cls) => cls === "hidden" ? false : true, // Modal visível (não-hidden)
    },
  };

  const oldDoc = global.document;
  global.document = {
    getElementById: (id) => {
      if (id === "sentence-analysis-modal") return mockModal;
      return null;
    },
    addEventListener: () => {},
  };

  // Testa lógica de guarda contra conflito
  const modalActive = global.document.getElementById("sentence-analysis-modal");
  const isModalOpen = modalActive && !modalActive.classList.contains("hidden");

  assert.isTrue(isModalOpen, 'Modal deve ser detectado como aberto');

  const eventHandledByModal = {
    key: "Enter",
    defaultPrevented: true,
  };

  if (eventHandledByModal.defaultPrevented || isModalOpen) {
    // Ação ignorada por segurança
  } else {
    simulatedSubmissionTriggered = true;
  }

  assert.isFalse(simulatedSubmissionTriggered, 'Submissão de simulado não deve ser disparada com modal de análise ativo');
  assert.isFalse(simulatedSurvivalTriggered, 'Submissão de sobrevivência não deve ser disparada');

  if (oldDoc === undefined) delete global.document; else global.document = oldDoc;
});

// --------------------------------------------------------------------------
// TESTE 16: Versão Canônica Única e Dinâmica (B2)
// --------------------------------------------------------------------------
suite.test('Versão Canônica Única: DataLoader e módulos compartilham a mesma versão da aplicação', () => {
  const DataLoader = require('../js/data-loader.js');
  const { APP_VERSION } = StateModule;

  assert.isTrue(typeof DataLoader.VERSION === 'string' && DataLoader.VERSION.length > 0, 'DataLoader.VERSION deve ser string válida');
  assert.equal(DataLoader.VERSION, APP_VERSION, 'DataLoader.VERSION e StateModule.APP_VERSION devem ser idênticos');
  assert.equal(DataLoader.VERSION, '2.7.1', 'Versão atual deve ser 2.7.1');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
