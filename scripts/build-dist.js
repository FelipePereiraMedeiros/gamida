/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Monta a pasta dist/ com o que vai ao ar (Cloudflare Pages).
 * Uso: node scripts/build-dist.js   (ou npm run build)
 *
 * Entram só os arquivos de que o aplicativo precisa: os que o service worker
 * guarda (página, estilos, scripts, fontes, ícones, manifesto e dados), o
 * próprio sw.js, a página de retorno do login com o script dela, a política
 * de privacidade, o _headers (cabeçalhos de segurança do Cloudflare), o
 * _redirects (a raiz abre o index.html) e o robots.txt. Ficam de fora testes, documentação, scripts, a página de testes
 * no navegador, o pacote data/data-bundle.js (só serve para abrir do disco)
 * e tudo o mais do repositório.
 *
 * Só usa módulos do próprio Node: não precisa de npm install.
 */
const fs = require("fs");
const path = require("path");
const { precacheList, isUpToDate } = require("./build-sw.js");

const root = path.join(__dirname, "..");
const OUT = path.join(root, "dist");

/** Arquivos que vão ao ar, além dos que o service worker guarda */
const EXTRA = ["sw.js", "oauth-callback.html", "js/oauth-callback.js", "privacidade.html", "_headers", "_redirects", "robots.txt"];

function files() {
  return [...new Set([...precacheList(), ...EXTRA])].sort();
}

function build() {
  if (!isUpToDate()) throw new Error("sw.js desatualizado: rode node scripts/build-sw.js (o bump-version.js já roda).");
  const list = files();
  const missing = list.filter((f) => !fs.existsSync(path.join(root, f)));
  if (missing.length) throw new Error(`Arquivos que faltam para o ar: ${missing.join(", ")}`);
  fs.rmSync(OUT, { recursive: true, force: true });
  list.forEach((f) => {
    const dest = path.join(OUT, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, f), dest);
  });
  if (fs.readFileSync(path.join(root, "privacidade.html"), "utf8").includes("{{CONTATO}}")) {
    console.warn("Aviso: privacidade.html ainda sem o e-mail de contato ({{CONTATO}}). O Google pede esse contato para publicar o login.");
  }
  const bytes = list.reduce((sum, f) => sum + fs.statSync(path.join(root, f)).size, 0);
  console.log(`dist/: ${list.length} arquivos, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  return list;
}

module.exports = { files, build, EXTRA };

if (require.main === module) build();
