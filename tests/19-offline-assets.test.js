/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 19: Funcionamento sem internet (estilos e fontes locais)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 19: Funcionamento sem Internet');
const { html, rootDir } = loadSourceFiles();
const { computeSignature, readBuiltSignature } = require('../scripts/build-css.js');

suite.test('index.html não depende de nenhum servidor externo', () => {
  const external = (html.match(/(?:src|href)="https?:\/\/[^"]+"/g) || []);
  assert.deepEqual(external, [], 'Scripts, estilos e fontes devem vir do próprio projeto');
  assert.isTrue(!html.includes('cdn.tailwindcss.com'), 'O CDN do Tailwind não pode voltar');
});

suite.test('Tailwind compilado é carregado depois dos estilos próprios', () => {
  const own = html.indexOf('href="css/interface.css"');
  const tailwind = html.indexOf('href="css/tailwind.css"');
  assert.isTrue(own > 0 && tailwind > own, 'css/tailwind.css deve vir por último, como o CDN fazia');
  assert.isTrue(fs.existsSync(path.join(rootDir, 'css', 'tailwind.css')), 'css/tailwind.css ausente');
});

suite.test('css/tailwind.css está em dia com as classes do HTML e do JavaScript', () => {
  assert.equal(
    readBuiltSignature(),
    computeSignature(),
    'Classes mudaram desde a última compilação: rode `npm run build:css` e inclua css/tailwind.css no commit',
  );
});

suite.test('Fontes da interface existem no projeto', () => {
  const fontsCss = fs.readFileSync(path.join(rootDir, 'css', 'fonts.css'), 'utf8');
  assert.includes(html, 'href="css/fonts.css"', 'css/fonts.css não é carregado');
  const urls = fontsCss.match(/url\(([^)]+)\)/g) || [];
  assert.isTrue(urls.length > 0, 'css/fonts.css sem fontes');
  urls.forEach((u) => {
    const rel = u.slice(4, -1);
    assert.isTrue(!/^https?:/.test(rel), `Fonte externa em css/fonts.css: ${rel}`);
    assert.isTrue(fs.existsSync(path.join(rootDir, 'css', rel)), `Arquivo de fonte ausente: ${rel}`);
  });
  ['Rubik', 'Noto Sans Hebrew', 'Gentium Plus'].forEach((family) => {
    assert.includes(fontsCss, `font-family: '${family}'`, `Família ${family} ausente`);
  });
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
