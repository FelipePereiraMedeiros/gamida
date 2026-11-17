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

suite.test('Aplicativo instalável: manifesto, ícones e service worker em dia com a versão', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const sw = require('../scripts/build-sw.js');
  assert.isTrue(sw.isUpToDate(), 'sw.js desatualizado: rode node scripts/build-sw.js (o bump-version.js já faz isso)');
  const list = sw.precacheList();
  list.forEach((file) => assert.isTrue(fs.existsSync(path.join(root, file)), `Arquivo guardado no aparelho não existe: ${file}`));
  ['index.html', 'js/app.js', 'js/modules/pwa.js', 'data/hebrew_chapters.json', 'data/greek_chapters.json', 'css/tailwind.css', 'fonts/SBL_Hbrw.ttf'].forEach((f) => assert.includes(list, f, `${f} não fica guardado para uso sem internet`));
  assert.isTrue(!list.includes('data/data-bundle.js'), 'O pacote de dados não precisa ficar guardado');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.short_name, 'Gamida');
  assert.equal(manifest.display, 'standalone');
  manifest.icons.forEach((icon) => assert.isTrue(fs.existsSync(path.join(root, icon.src)), `Ícone ausente: ${icon.src}`));
  assert.includes(html, '<link rel="manifest" href="manifest.webmanifest" />');
  assert.includes(html, 'js/modules/pwa.js');
  assert.isTrue(!html.includes('data/data-bundle.js'), 'O pacote de dados só deve carregar sob demanda (file://)');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
