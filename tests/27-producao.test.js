/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 27: Produção (Cloudflare Pages): o que vai ao ar, cabeçalhos,
 * privacidade, instalação e aviso de endereço novo
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert } = require('./test-utils');

const suite = new TestSuite('Módulo 27: Produção');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const Dist = require('../scripts/build-dist.js');

suite.test('Vai ao ar só o que o aplicativo usa (sem testes, documentação, scripts nem a página de testes)', () => {
  const files = Dist.files();
  const required = ['index.html', 'sw.js', 'manifest.webmanifest', 'oauth-callback.html', 'js/oauth-callback.js', 'privacidade.html', 'termos.html', '_headers', '_redirects', 'robots.txt',
    'data/hebrew_chapters.json', 'data/greek_chapters.json', 'js/app.js', 'js/modules/cloud-sync.js', 'js/modules/new-home.js'];
  required.forEach((f) => assert.isTrue(files.includes(f), `Falta no ar: ${f}`));
  const banned = files.filter((f) => /^(tests|docs|scripts|referencias|node_modules|\.github)\/|test-environment|data-bundle|package|LICENSE|\.md$|\.ps1$/.test(f));
  assert.deepEqual(banned, [], 'Arquivo interno indo ao ar');
  files.forEach((f) => assert.isTrue(fs.existsSync(path.join(root, f)), `Arquivo da lista não existe: ${f}`));
  assert.includes(read('.gitignore'), 'dist/');
  assert.includes(read('package.json'), '"build": "node scripts/build-dist.js"');
});

suite.test('Cabeçalhos do Cloudflare: a mesma CSP da página, mais proteção contra moldura e HTTPS', () => {
  const headers = read('_headers');
  const meta = read('index.html').match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];
  const csp = headers.match(/^\s+Content-Security-Policy: (.+)$/m)[1];
  assert.isTrue(csp.startsWith(meta), 'A CSP do cabeçalho não é a mesma do index.html');
  assert.includes(csp, "frame-ancestors 'none'");
  ['X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Strict-Transport-Security', 'Referrer-Policy', 'Permissions-Policy'].forEach((h) => assert.includes(headers, h));
  assert.isTrue(/^\/sw\.js\n\s+Cache-Control: no-cache/m.test(headers), 'O service worker precisa ser conferido a cada visita');
  assert.isTrue(/^\/oauth-callback\.html\n\s+Cache-Control: no-store/m.test(headers), 'A página de retorno do login não pode ficar em cache');
  assert.isTrue(!/interest-cohort/.test(headers), 'Permissão obsoleta gera aviso no console');
});

suite.test('Cloudflare: cada página pelo nome exato, raiz no index.html e 404 para o que não existe', () => {
  const wrangler = read('wrangler.jsonc');
  assert.isTrue(/"directory": "\.\/dist"/.test(wrangler), 'O Worker publica a pasta dist/');
  assert.isTrue(/"html_handling": "none"/.test(wrangler), 'Sem redirecionar index.html e oauth-callback.html (o service worker recusa resposta redirecionada)');
  assert.isTrue(/"not_found_handling": "none"/.test(wrangler), 'Arquivo que não existe precisa responder 404');
  assert.isTrue(/^\/ \/index\.html 200$/m.test(read('_redirects')), 'A raiz precisa abrir o index.html sem redirecionar');
});

suite.test('Política de privacidade: existe, explica o Drive e está ligada no rodapé e no cartão da nuvem', () => {
  const page = read('privacidade.html');
  ['drive.appdata', 'gamida-perfil.json', 'uso limitado', 'Excluir dados ocultos'].forEach((t) => assert.includes(page, t));
  assert.isTrue(!/<script/i.test(page), 'A página de privacidade não precisa de script');
  assert.includes(read('index.html'), 'href="privacidade.html"');
  assert.includes(read('js/modules/cloud-sync.js'), 'href="privacidade.html"');
});

suite.test('Termos de uso: existem, seguem a licença e estão ligados no rodapé e na política', () => {
  const page = read('termos.html');
  ['estudo pessoal e não comercial', 'inteligência artificial', 'Lei nº 9.609/1998', 'no estado em que se encontra', 'José Henrique Rosseto', 'href="privacidade.html"'].forEach((t) => assert.includes(page, t));
  assert.isTrue(!/<script/i.test(page), 'A página de termos não precisa de script');
  assert.includes(read('index.html'), 'href="termos.html"');
  assert.includes(read('privacidade.html'), 'href="termos.html"');
});

suite.test('Login com Google: ID do cliente do Gamida no código, contato nas páginas legais', () => {
  const Cloud = require('../js/modules/cloud-sync.js');
  assert.isTrue(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(Cloud.GOOGLE_CLIENT_ID), 'ID do cliente OAuth ausente ou malformado');
  assert.isTrue(!/client_secret|GOCSPX-/.test(read('js/modules/cloud-sync.js')), 'Segredo do cliente não pode ir para o código');
  ['privacidade.html', 'termos.html'].forEach((page) => {
    const html = read(page);
    assert.isTrue(!html.includes('{{CONTATO}}'), `${page} sem o e-mail de contato`);
    assert.includes(html, 'href="mailto:gamida.app@gmail.com"', `${page} sem o e-mail de suporte do Gamida`);
  });
});

suite.test('Contato público é só o e-mail do Gamida (LICENSE, README, privacidade e termos)', () => {
  ['LICENSE', 'README.md', 'privacidade.html', 'termos.html'].forEach((f) => {
    assert.includes(read(f), 'gamida.app@gmail.com', `${f} sem o e-mail do Gamida`);
    assert.isTrue(!/gasperfpm@/i.test(read(f)), `${f} ainda com o e-mail pessoal`);
  });
});

suite.test('Instalável: manifesto com id, ícones existentes e rodapé com a versão atual', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id, './index.html', 'O id precisa ser o start_url de antes, para não duplicar instalações');
  assert.equal(manifest.display, 'standalone');
  manifest.icons.forEach((icon) => assert.isTrue(fs.existsSync(path.join(root, icon.src)), `Ícone ausente: ${icon.src}`));
  assert.isTrue(manifest.icons.some((i) => i.purpose === 'maskable'));
  const version = JSON.parse(read('package.json')).version;
  assert.includes(read('index.html'), `<span id="footer-version-tag">v${version}</span>`);
});

suite.test('Login: instalado vai na própria tela; reconectar não pede a conta de novo', () => {
  const Cloud = require('../js/modules/cloud-sync.js');
  assert.equal(new URL(Cloud.buildAuthUrl('a.r', { prompt: '' })).searchParams.get('prompt'), null);
  assert.equal(new URL(Cloud.buildAuthUrl('a.p')).searchParams.get('prompt'), 'select_account');
  assert.equal(Cloud.isStandalone(), false, 'Fora do navegador não é aplicativo instalado');
});

suite.test('Aviso de endereço novo: desligado sem endereço; só no endereço antigo', () => {
  const NewHome = require('../js/modules/new-home.js');
  assert.equal(NewHome.shouldShow('felipe.github.io', ''), false, 'Sem endereço novo, nada aparece');
  assert.equal(NewHome.shouldShow('felipe.github.io', 'https://gamida.pages.dev/'), true);
  assert.equal(NewHome.shouldShow('gamida.pages.dev', 'https://gamida.pages.dev/'), false, 'No endereço novo, nada aparece');
  assert.equal(NewHome.shouldShow('localhost', 'https://gamida.pages.dev/'), false);
});

module.exports = suite;

if (require.main === module) {
  suite.run();
}
