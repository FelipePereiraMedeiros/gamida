/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 23: Segurança (CSP, ações sem JavaScript no HTML, escape único)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 23: Segurança');
const { html } = loadSourceFiles();
const Actions = require('../js/modules/actions.js');
const { escapeHTML } = require('../js/modules/html.js');

const ROOT = path.join(__dirname, '..');
const jsFiles = [];
(function walk(dir) {
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel);
    else if (e.name.endsWith('.js')) jsFiles.push(rel);
  });
})('js');
const throws = (fn, msg) => {
  let threw = false;
  try { fn(); } catch (_) { threw = true; }
  assert.isTrue(threw, msg);
};
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

suite.test('index.html tem política de segurança que proíbe JavaScript dentro do HTML', () => {
  const meta = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  assert.isTrue(!!meta, 'CSP ausente');
  const csp = meta[1];
  const script = (csp.match(/script-src ([^;]+)/) || [])[1] || '';
  assert.equal(script.trim(), "'self'", `script-src deveria ser só 'self': ${script}`);
  assert.isTrue(!/unsafe-eval/.test(csp), 'unsafe-eval na CSP');
  assert.includes(csp, "object-src 'none'");
  assert.includes(csp, "base-uri 'self'");
  assert.isTrue(html.indexOf('Content-Security-Policy') < html.indexOf('<script'), 'A CSP precisa vir antes do primeiro script');
});

suite.test('Nenhum script embutido nem manipulador on* no HTML ou nos modelos do JavaScript', () => {
  [['index.html', html], ['oauth-callback.html', read('oauth-callback.html')]].forEach(([name, text]) => {
    assert.isTrue(!/<script(?![^>]*\bsrc=)[^>]*>/.test(text), `${name}: script embutido`);
    assert.isTrue(!/\son[a-z]+\s*=\s*["']/.test(text.replace(/<!--[\s\S]*?-->/g, '')), `${name}: manipulador on* no HTML`);
  });
  jsFiles.forEach((file) => {
    const src = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.isTrue(!/\son(click|change|input|submit|keydown|keyup|load|error|mouse\w+|focus|blur)=\\?["']/.test(src), `${file}: manipulador on* em modelo de HTML`);
  });
});

suite.test('Toda ação data-on-* do HTML e do JavaScript é uma chamada simples que o despachante entende', () => {
  const sources = [['index.html', html], ...jsFiles.map((f) => [f, read(f)])];
  let count = 0;
  sources.forEach(([file, text]) => {
    for (const m of text.matchAll(/data-on-[a-z]+=\\?"([^"\\]*)\\?"/g)) {
      const action = m[1].replace(/\$\{[^}]*\}/g, '0');
      let problem = null;
      try { Actions.parseAction(action); } catch (err) { problem = err.message; }
      assert.isTrue(!problem, `${file}: ${problem}`);
      count++;
    }
  });
  assert.isTrue(count >= 100, `Esperava as ações da interface; achei ${count}`);
});

suite.test('O despachante recusa qualquer coisa além de chamada de função com valores simples', () => {
  const ok = Actions.parseAction("setSimConfig('count', 20, this.value, event)");
  assert.deepEqual(ok.path, ['setSimConfig']);
  assert.deepEqual(ok.args.map((a) => a.value !== undefined ? a.value : a.ref), ['count', 20, 'this.value', 'event']);
  assert.deepEqual(Actions.parseAction("f('a, b', \"c'd\")").args.map((a) => a.value), ['a, b', "c'd"]);
  assert.deepEqual(Actions.parseAction('SentenceAnalysisModule.navigateMorphemes(+1)').path, ['SentenceAnalysisModule', 'navigateMorphemes']);
  ['alert(1);alert(2)', "fetch('x').then(go)", 'f(document.cookie)', 'f(g())', 'x[0]()', 'f(`a`)', "f('a' + b)", 'f(this.innerHTML)', 'new F()']
    .forEach((bad) => throws(() => Actions.parseAction(bad), `Deveria recusar: ${bad}`));
});

suite.test('Escape único: escapa tudo o que abre HTML e só existe em js/modules/html.js', () => {
  assert.equal(escapeHTML('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
  assert.equal(escapeHTML("'`&"), '&#039;&#096;&amp;');
  assert.equal(escapeHTML(null), '');
  assert.equal(escapeHTML(0), '0');
  const copies = jsFiles.filter((f) => f !== 'js/modules/html.js' && /&amp;/.test(read(f)));
  assert.deepEqual(copies, [], `Cópias do escape: ${copies.join(', ')}`);
  assert.isTrue(html.indexOf('js/modules/html.js') < html.indexOf('js/modules/state.js'), 'html.js precisa carregar antes dos outros módulos');
  assert.isTrue(html.indexOf('js/modules/actions.js') < html.indexOf('js/app.js'), 'actions.js precisa carregar antes do app');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
