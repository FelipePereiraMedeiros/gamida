/**
 * ==========================================================================
 * Gamida Test Suite - Shared Utilities & Mock Environment
 * Utilitários de Teste, Mini-Framework de Asserções e Mock do DOM
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n${colors.bright}${colors.cyan}▶ Executando: ${this.name}${colors.reset}`);
    for (const t of this.tests) {
      try {
        await t.fn();
        this.passed++;
        console.log(`  ${colors.green}✔ PASS${colors.reset} ${t.description}`);
      } catch (err) {
        this.failed++;
        console.log(`  ${colors.red}✖ FAIL${colors.reset} ${t.description}`);
        console.log(`    ${colors.yellow}Erro: ${err.message}${colors.reset}`);
      }
    }
    return {
      name: this.name,
      total: this.tests.length,
      passed: this.passed,
      failed: this.failed,
    };
  }
}

// Helpers de Asserção
const assert = {
  isTrue(val, msg = 'Esperava valor verdadeiro') {
    if (!val) throw new Error(msg);
  },
  isFalse(val, msg = 'Esperava valor falso') {
    if (val) throw new Error(msg);
  },
  equal(actual, expected, msg = '') {
    if (actual !== expected) {
      throw new Error(msg || `Esperava ${JSON.stringify(expected)}, mas obteve ${JSON.stringify(actual)}`);
    }
  },
  deepEqual(actual, expected, msg = '') {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
      throw new Error(msg || `Esperava estrutura ${e}, mas obteve ${a}`);
    }
  },
  includes(container, item, msg = '') {
    if (!container || !container.includes(item)) {
      throw new Error(msg || `Esperava que o conteúdo incluísse: ${item}`);
    }
  },
  isFunction(val, msg = '') {
    if (typeof val !== 'function') {
      throw new Error(msg || `Esperava uma função, mas obteve ${typeof val}`);
    }
  },
  isArray(val, msg = '') {
    if (!Array.isArray(val)) {
      throw new Error(msg || `Esperava um Array, mas obteve ${typeof val}`);
    }
  },
  isGreaterThan(actual, min, msg = '') {
    if (!(actual > min)) {
      throw new Error(msg || `Esperava que ${actual} fosse maior que ${min}`);
    }
  },
};

// Mock de localStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Carregador dos arquivos de código-fonte
function loadSourceFiles() {
  const rootDir = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'css', 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  const dataLoaderJs = fs.readFileSync(path.join(rootDir, 'js', 'data-loader.js'), 'utf8');
  const hebrewData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'hebrew_chapters.json'), 'utf8'));
  const greekData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'greek_chapters.json'), 'utf8'));

  return { html, css, appJs, dataLoaderJs, hebrewData, greekData, rootDir };
}

module.exports = {
  TestSuite,
  assert,
  colors,
  MockLocalStorage,
  loadSourceFiles,
};
