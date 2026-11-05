/**
 * ==========================================================================
 * Módulo 7: Paradigmas Gramaticais & Esquemas Visuais
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 7: Paradigmas Gramaticais & Esquemas');
const { appJs, greekData, hebrewData } = loadSourceFiles();
const {
  getStaticParadigmTableHTML,
  getStaticDiagramHTML,
  updateParadigmsVisibility,
  renderParadigmSkeleton,
  renderTableView,
  renderDiagramView,
  checkParadigmAnswers,
  resetParadigmBoard,
  onDropToZone,
  onDropToDeck,
  onChipClick,
  onZoneClick,
  isExerciseParadigm,
  isBlankCell,
  getActiveParadigmsList,
} = require('../js/modules/paradigms.js');
const { AppState } = require('../js/modules/state.js');

suite.test('Capítulos de Grego contêm estruturas de paradigmas válidas', () => {
  const chaptersWithParadigms = greekData.filter(c => c.paradigms && c.paradigms.length > 0);
  assert.isGreaterThan(chaptersWithParadigms.length, 0, 'Deve haver ao menos um capítulo de grego com paradigmas');

  chaptersWithParadigms.forEach(chap => {
    chap.paradigms.forEach(p => {
      assert.isTrue(typeof p.title === 'string' && p.title.trim().length > 0, 'Paradigma deve ter título');
      assert.isTrue(p.type === 'table' || p.type === 'diagram', 'Paradigma deve ser tipo table ou diagram');
      if (p.type === 'table') {
        assert.isArray(p.headers, 'Tabela de paradigma deve ter headers');
        assert.isArray(p.rows, 'Tabela de paradigma deve ter rows');
      }
    });
  });
});

suite.test('getStaticParadigmTableHTML gera marcação HTML estruturada com headers e rows', () => {
  const tableParadigm = greekData
    .flatMap(c => c.paradigms || [])
    .find(p => p.type === 'table');

  assert.isTrue(!!tableParadigm, 'Deve existir um paradigma do tipo table no dataset de grego');
  const html = getStaticParadigmTableHTML(tableParadigm);

  assert.isTrue(typeof html === 'string' && html.length > 50, 'Deve gerar string HTML não-vazia');
  assert.includes(html, '<table', 'Deve conter tag table');
  assert.includes(html, '<thead', 'Deve conter thead com cabeçalhos');
  assert.includes(html, '<tbody', 'Deve conter tbody com linhas');
  tableParadigm.headers.forEach(h => {
    assert.includes(html, h, `Deve renderizar header: ${h}`);
  });
});

suite.test('getStaticDiagramHTML gera visualização diagramada com nós posicionados', () => {
  const diagramParadigm = greekData
    .flatMap(c => c.paradigms || [])
    .find(p => p.type === 'diagram');

  if (diagramParadigm) {
    const html = getStaticDiagramHTML(diagramParadigm);
    assert.isTrue(typeof html === 'string' && html.length > 50, 'Deve gerar string HTML do diagrama');
    assert.includes(html, '<svg', 'Deve conter SVG de diagrama');
  }
});

suite.test('Declaração e exportação das funções de paradigmas no módulo e app.js', () => {
  assert.isFunction(getStaticParadigmTableHTML);
  assert.isFunction(getStaticDiagramHTML);
  assert.isFunction(updateParadigmsVisibility);
  assert.isFunction(renderParadigmSkeleton);
  assert.isFunction(renderTableView);
  assert.isFunction(renderDiagramView);
  assert.isFunction(checkParadigmAnswers);
  assert.isFunction(resetParadigmBoard);

  assert.includes(appJs, 'function getStaticParadigmTableHTML', 'getStaticParadigmTableHTML ausente no app.js');
  assert.includes(appJs, 'function getStaticDiagramHTML', 'getStaticDiagramHTML ausente no app.js');
});

// ================= TESTES DE RENDERIZAÇÃO INTERATIVA NO DOM =================

function createMockDOM() {
  const elementsById = {};

  class MockClassList {
    constructor(owner) {
      this.owner = owner;
      this.classes = new Set();
    }
    add(...cls) {
      cls.forEach(c => this.classes.add(c));
    }
    remove(...cls) {
      cls.forEach(c => this.classes.delete(c));
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
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.parentElement = null;
      this.attrs = {};
      this._id = '';
      this._className = '';
      this.classList = new MockClassList(this);
      this._textContent = '';
      this._innerHTML = '';
      this.style = {};
      this.ondragover = null;
      this.ondragleave = null;
      this.ondrop = null;
      this.onclick = null;
      this.ondragstart = null;
      this.ondragend = null;
      this.draggable = false;
      this.value = '';
    }

    get id() {
      return this._id;
    }
    set id(val) {
      this._id = val;
      if (val) elementsById[val] = this;
    }

    get className() {
      return this.classList.toString() || this._className;
    }
    set className(val) {
      this._className = val || '';
      this.classList.classes = new Set((val || '').split(/\s+/).filter(Boolean));
    }

    get textContent() {
      if (this._textContent) return this._textContent;
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join(' ');
      }
      return '';
    }
    set textContent(val) {
      this._textContent = String(val || '');
      this.children = [];
    }

    get innerHTML() {
      return this._innerHTML;
    }
    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
      this._textContent = '';
      if (!html) return;

      // Parser simples para extrair divs de drop-zone ou botões
      const dropZoneMatches = html.matchAll(/<div[^>]*class="[^"]*drop-zone[^"]*"[^>]*data-expected="([^"]*)"[^>]*>/gi);
      for (const match of dropZoneMatches) {
        const expected = match[1];
        const dz = new MockElement('div');
        dz.className = 'drop-zone';
        dz.setAttribute('data-expected', expected);
        dz.setAttribute('data-answer', expected);
        this.appendChild(dz);
      }
      if (html.includes('id="paradigm-feedback"')) {
        const fb = new MockElement('div');
        fb.id = 'paradigm-feedback';
        this.appendChild(fb);
      }
    }

    setAttribute(name, val) {
      this.attrs[name] = String(val);
    }
    getAttribute(name) {
      return this.attrs[name] !== undefined ? this.attrs[name] : null;
    }

    appendChild(child) {
      if (child.parentElement && child.parentElement !== this) {
        const idx = child.parentElement.children.indexOf(child);
        if (idx !== -1) child.parentElement.children.splice(idx, 1);
      }
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
      const results = [];
      const isClass = selector.startsWith('.');
      const isId = selector.startsWith('#');
      const target = isClass || isId ? selector.slice(1) : selector;

      function traverse(node) {
        node.children.forEach(c => {
          if (isClass && c.classList.contains(target)) results.push(c);
          else if (isId && c.id === target) results.push(c);
          else if (!isClass && !isId && c.tagName.toLowerCase() === target.toLowerCase()) results.push(c);
          traverse(c);
        });
      }
      traverse(this);
      return results;
    }
  }

  const doc = {
    createElement: tag => new MockElement(tag),
    getElementById: id => elementsById[id] || null,
    querySelectorAll: selector => {
      if (selector === '#paradigm-board .drop-zone') {
        const board = elementsById['paradigm-board'];
        return board ? board.querySelectorAll('.drop-zone') : [];
      }
      return [];
    }
  };

  // Monta a estrutura da aba no mock
  const header = new MockElement('div');
  header.id = 'paradigm-header';
  const title = new MockElement('h3');
  title.id = 'paradigm-title';
  header.appendChild(title);

  const select = new MockElement('select');
  select.id = 'paradigm-select';

  const board = new MockElement('div');
  board.id = 'paradigm-board';

  const actionContainer = new MockElement('div');
  actionContainer.id = 'paradigm-action-container';

  const deck = new MockElement('div');
  deck.id = 'paradigm-deck';

  elementsById['paradigm-header'] = header;
  elementsById['paradigm-title'] = title;
  elementsById['paradigm-select'] = select;
  elementsById['paradigm-board'] = board;
  elementsById['paradigm-action-container'] = actionContainer;
  elementsById['paradigm-deck'] = deck;

  return { doc, elementsById };
}

suite.test('renderTableView monta tabela, drop-zones, action container e deck de fichas sem exceções', () => {
  const { doc, elementsById } = createMockDOM();
  global.document = doc;
  global.window = {
    AppState,
    shuffleArray: arr => [...arr],
    ParadigmsModule: require('../js/modules/paradigms.js')
  };

  AppState.language = 'greek';
  const tableParadigm = greekData
    .flatMap(c => c.paradigms || [])
    .find(p => p.type === 'table');

  assert.isTrue(!!tableParadigm, 'Deve existir um paradigma table');

  const board = elementsById['paradigm-board'];
  renderTableView(tableParadigm, board);

  // Valida que o container da tabela e linhas foram adicionados
  assert.isGreaterThan(board.children.length, 0, 'Board deve conter elementos renderizados');
  
  // Valida que o botão de ação foi configurado
  const actionContainer = elementsById['paradigm-action-container'];
  assert.isTrue(actionContainer.innerHTML.includes('Verificar Estrutura'), 'Deve renderizar botão Verificar Estrutura');

  // Valida que o deck de fichas foi exibido e preenchido
  const deck = elementsById['paradigm-deck'];
  assert.isFalse(deck.classList.contains('hidden'), 'Deck de fichas deve estar visível');
  assert.isGreaterThan(deck.children.length, 0, 'Deck deve conter chips arrastáveis');
  deck.children.forEach(chip => {
    assert.isTrue(chip.draggable, 'Cada ficha do deck deve ser draggable');
  });
});

suite.test('renderDiagramView renderiza com sucesso paradigma do tipo diagram (elements schema)', () => {
  const { doc, elementsById } = createMockDOM();
  global.document = doc;
  global.window = {
    AppState,
    shuffleArray: arr => [...arr],
    ParadigmsModule: require('../js/modules/paradigms.js')
  };

  AppState.language = 'greek';
  const diagramParadigm = greekData
    .flatMap(c => c.paradigms || [])
    .find(p => p.type === 'diagram');

  assert.isTrue(!!diagramParadigm, 'Deve existir o diagrama no dataset de grego');
  assert.isArray(diagramParadigm.elements, 'Diagrama deve conter array elements');

  const board = elementsById['paradigm-board'];
  renderDiagramView(diagramParadigm, board);

  // Valida que o wrapper do diagrama foi inserido no board
  assert.isGreaterThan(board.children.length, 0, 'Board deve conter o diagrama renderizado');

  // Valida ação
  const actionContainer = elementsById['paradigm-action-container'];
  assert.isTrue(actionContainer.innerHTML.includes('Verificar grafo'), 'Deve renderizar botão Verificar grafo');

  // Valida deck
  const deck = elementsById['paradigm-deck'];
  assert.isFalse(deck.classList.contains('hidden'), 'Deck deve estar visível para o diagrama');
  assert.equal(deck.children.length, diagramParadigm.elements.length, 'Deck deve ter tantas fichas quanto elements');
});

suite.test('checkParadigmAnswers avalia preenchimento incompleto, erros e acertos com precisão', () => {
  const { doc, elementsById } = createMockDOM();
  global.document = doc;
  global.window = {
    AppState,
    shuffleArray: arr => [...arr],
    ParadigmsModule: require('../js/modules/paradigms.js')
  };

  const board = elementsById['paradigm-board'];
  
  // Cria 2 drop-zones
  const z1 = doc.createElement('div');
  z1.className = 'drop-zone';
  z1.setAttribute('data-expected', 'εἰμί');
  board.appendChild(z1);

  const z2 = doc.createElement('div');
  z2.className = 'drop-zone';
  z2.setAttribute('data-expected', 'εἶ');
  board.appendChild(z2);

  const feedback = doc.createElement('div');
  feedback.id = 'paradigm-feedback';
  elementsById['paradigm-feedback'] = feedback;

  // 1. Zonas vazias -> Incompleto
  checkParadigmAnswers();
  assert.isTrue(feedback.textContent.includes('Preencha todos'), 'Deve alertar quando incompleto');

  // 2. Preenchido com erro
  const chipErr = doc.createElement('div');
  chipErr.className = 'drag-chip';
  chipErr.textContent = 'errado';
  z1.appendChild(chipErr);

  const chipCor1 = doc.createElement('div');
  chipCor1.className = 'drag-chip';
  chipCor1.textContent = 'εἶ';
  z2.appendChild(chipCor1);

  checkParadigmAnswers();
  assert.isTrue(feedback.textContent.includes('Ainda há erros'), 'Deve apontar erros');
  assert.isTrue(z1.classList.contains('border-rose-500'), 'Zona 1 deve ter borda vermelha');
  assert.isTrue(z2.classList.contains('border-emerald-500'), 'Zona 2 deve ter borda verde');

  // 3. Preenchido 100% correto
  chipErr.textContent = 'εἰμί';
  checkParadigmAnswers();
  assert.isTrue(feedback.textContent.includes('Perfeito'), 'Deve parabenizar acerto');
  assert.isTrue(z1.classList.contains('border-emerald-500'), 'Zona 1 deve ter borda verde');
  assert.isTrue(z2.classList.contains('border-emerald-500'), 'Zona 2 deve ter borda verde');
});

suite.test('resetParadigmBoard oculta cabeçalho, limpa deck e esvazia action container', () => {
  const { doc, elementsById } = createMockDOM();
  global.document = doc;
  global.window = {
    AppState,
    shuffleArray: arr => [...arr]
  };

  AppState.currentChapter = { id: 'test', paradigms: [{ title: 'Tabela' }] };

  const header = elementsById['paradigm-header'];
  header.classList.remove('hidden');
  const deck = elementsById['paradigm-deck'];
  deck.classList.remove('hidden');
  const actionContainer = elementsById['paradigm-action-container'];
  actionContainer.classList.remove('hidden');
  actionContainer.innerHTML = '<button>teste</button>';

  resetParadigmBoard();

  assert.isTrue(header.classList.contains('hidden'), 'Header deve ser ocultado');
  assert.isTrue(deck.classList.contains('hidden'), 'Deck deve ser ocultado');
  assert.isTrue(actionContainer.classList.contains('hidden'), 'Action container deve ser ocultado');
  assert.equal(actionContainer.innerHTML, '', 'Action container deve ser limpo');

  // Limpa globais para não afetar outros testes
  delete global.document;
  delete global.window;
});

suite.test('Capítulos de Hebraico contêm estruturas de paradigmas de Page Kelley', () => {
  const hebWithParadigms = hebrewData.filter(c => c.paradigms && c.paradigms.length > 0);
  assert.isGreaterThan(hebWithParadigms.length, 0, 'Deve haver capítulos de hebraico com paradigmas interativos');
  hebWithParadigms.forEach(chap => {
    chap.paradigms.forEach(p => {
      assert.isTrue(typeof p.title === 'string' && p.title.trim().length > 0, 'Paradigma hebraico deve ter título');
      assert.equal(p.type, 'table', 'Paradigma hebraico deve ser do tipo table');
      assert.isArray(p.headers, 'Tabela hebraica deve ter headers');
      assert.isArray(p.rows, 'Tabela hebraica deve ter rows');
    });
  });
});

suite.test('A aba usa o nome Tabelas e Grafos nos textos visíveis', () => {
  const html = require('fs').readFileSync(require('path').join(__dirname, '../index.html'), 'utf8');
  assert.includes(html, '<h2 class="page-head__title">Tabelas e Grafos</h2>', 'Título da aba ausente');
  assert.isFalse(html.includes('<span>Paradigmas</span>'), 'Navegação não deve usar o nome antigo');
});

suite.test('A seleção traz as tabelas principais e mantém as demais só na Consulta', () => {
  const count = (data) => {
    const all = data.flatMap(c => c.paradigms || []);
    return { total: all.length, exercise: all.filter(isExerciseParadigm).length };
  };
  assert.equal(count(greekData).exercise, 51, 'Grego: tabelas principais no seletor');
  assert.equal(count(greekData).total, 93, 'Grego: todas as tabelas seguem disponíveis na Consulta');
  assert.equal(count(hebrewData).exercise, 31, 'Hebraico: tabelas principais no seletor');
  [...greekData, ...hebrewData].forEach(chap => {
    if (chap.paradigms && chap.paradigms.length) {
      assert.isGreaterThan(chap.paradigms.filter(isExerciseParadigm).length, 0, `${chap.id} ficou sem tabela no exercício`);
    }
    (chap.paradigms || []).filter(p => p.type === 'table').forEach(p => {
      p.rows.forEach(r => assert.equal(r.length, p.headers.length, `${p.title}: linha fora do cabeçalho`));
    });
  });
});

suite.test('O seletor e o tabuleiro ignoram as tabelas de consulta', () => {
  const principal = { type: 'table', title: 'Principal', headers: ['a', 'b'], rows: [['x', 'y']] };
  const extra = { ...principal, title: 'Extra', level: 'consulta' };
  const previous = { chapter: AppState.currentChapter, ids: AppState.selectedChapterIds };
  AppState.selectedChapterIds = [];
  AppState.currentChapter = { id: 'teste', paradigms: [extra, principal] };
  assert.deepEqual(getActiveParadigmsList().map(p => p.title), ['Principal']);
  AppState.currentChapter = previous.chapter;
  AppState.selectedChapterIds = previous.ids;

  const ui = require('fs').readFileSync(require('path').join(__dirname, '../js/modules/ui.js'), 'utf8');
  assert.includes(ui, 'ch.paradigms.filter(isExercise)', 'O seletor deve usar a mesma regra do tabuleiro');
});

suite.test('Células vazias ou com travessão não geram zona nem ficha', () => {
  const { doc, elementsById } = createMockDOM();
  global.document = doc;
  global.window = { AppState, shuffleArray: arr => [...arr], ParadigmsModule: require('../js/modules/paradigms.js') };
  AppState.language = 'hebrew';

  const board = elementsById['paradigm-board'];
  renderTableView({
    type: 'table', title: 'Com lacunas', headers: ['Forma', 'Qal', "Pu'al", "Hof'al"],
    rows: [['Imper. 2ms', 'מְשֹׁל', '—', '']],
  }, board);

  assert.equal(board.querySelectorAll('.drop-zone').length, 1, 'Só a célula preenchida vira zona');
  assert.equal(elementsById['paradigm-deck'].children.length, 1, 'Só a célula preenchida vira ficha');
  assert.isTrue(isBlankCell(' — ') && isBlankCell('') && !isBlankCell('-–'), 'Terminação zero (-–) é resposta');
  delete global.document;
  delete global.window;
});

suite.test('Hebraico traz os quadros centrais do livro', () => {
  const titles = hebrewData.flatMap(c => c.paradigms || []);
  const find = (text) => titles.find(p => p.title.includes(text));

  ['Sufixos em Substantivo Singular', 'Sufixos em Substantivo Plural'].forEach(t => {
    assert.equal(find(t).rows.length, 10, `${t}: as 10 pessoas, incluindo 2fp e 3fp`);
  });
  assert.isTrue(!!find('Sinopse do Verbo Forte (מָשַׁל): Formas Finitas'), 'Sinopse do verbo forte ausente');
  assert.equal(find('Classes de Verbos Fracos').rows.length, 10, 'O livro agrupa os fracos em 10 classes');
  ['kelley_22', 'kelley_23', 'kelley_24', 'licao_25', 'licao_26', 'licao_27', 'licao_28', 'licao_29', 'licao_30', 'licao_31']
    .forEach(id => {
      const chap = hebrewData.find(c => c.id === id);
      assert.isGreaterThan((chap.paradigms || []).length, 0, `${id} sem tabela de verbo fraco`);
    });
});

suite.test('Grego usa os resumos do livro e corrige o optativo e ἵημι', () => {
  const all = greekData.flatMap(c => c.paradigms || []);
  const optativo = all.find(p => p.title === 'Resumo: Modo Optativo');
  assert.equal(optativo.rows.length, 7, 'O quadro do livro tem 7 linhas');
  assert.deepEqual(optativo.rows[4].slice(1), ['-ν', '-ς', '-–', '-μεν', '-τε', '-σαν'], '1º aoristo passivo');
  assert.isTrue(!all.some(p => p.title === 'Terminações do Modo Optativo'), 'A tabela antiga divergia do livro');

  const mi = all.find(p => p.title === 'Radicais Reduplicados dos Verbos em -μι');
  assert.equal(mi.rows.find(r => r[0] === 'ἵημι')[2], 'ἥ- / ἕ-');
  assert.equal(all.find(p => p.title === 'Artigo Definido').rows.length, 8, 'Singular e plural num quadro só');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}

