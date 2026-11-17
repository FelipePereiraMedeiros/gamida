/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Atualiza a lista de arquivos que o service worker (sw.js) guarda para o
 * Gamida abrir sem internet, e a versão do cache.
 * Uso: node scripts/build-sw.js   (o bump-version.js já roda este script)
 *
 * Entram: a página, estilos, scripts, fontes, ícones, manifesto e os dados dos
 * capítulos. Ficam de fora o pacote data/data-bundle.js (só serve para abrir
 * direto do disco), a página de retorno do login e os testes.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const SW = path.join(root, "sw.js");

function walk(dir, filter) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return walk(rel, filter);
    return filter(rel) ? [rel] : [];
  });
}

/** Arquivos guardados no aparelho, em ordem estável */
function precacheList() {
  return [
    "index.html",
    "manifest.webmanifest",
    ...walk("css", (f) => f.endsWith(".css") && !f.endsWith("tailwind.input.css")),
    ...walk("js", (f) => f.endsWith(".js") && !f.endsWith("oauth-callback.js")),
    ...walk("fonts", (f) => /\.(woff2?|ttf)$/.test(f)),
    ...walk("icons", (f) => f.endsWith(".png")),
    "data/hebrew_chapters.json",
    "data/greek_chapters.json",
  ].sort();
}

function currentVersion() {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
}

/** Conteúdo esperado do trecho gerado do sw.js */
function generatedBlock(version = currentVersion()) {
  return `// <gerado por scripts/build-sw.js: não edite à mão>\nconst VERSION = "${version}";\nconst PRECACHE = ${JSON.stringify(precacheList(), null, 2)};\n// </gerado>`;
}

const BLOCK_RE = /\/\/ <gerado por scripts\/build-sw\.js: não edite à mão>[\s\S]*?\/\/ <\/gerado>/;

function isUpToDate() {
  const match = fs.readFileSync(SW, "utf8").match(BLOCK_RE);
  return !!match && match[0] === generatedBlock();
}

function build() {
  const src = fs.readFileSync(SW, "utf8");
  fs.writeFileSync(SW, src.replace(BLOCK_RE, generatedBlock()));
  console.log(`sw.js: ${precacheList().length} arquivos para uso sem internet (versão ${currentVersion()})`);
}

module.exports = { precacheList, generatedBlock, isUpToDate, build };

if (require.main === module) build();
