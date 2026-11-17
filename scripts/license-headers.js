/**
 * Garante o aviso de direitos autorais no topo de cada arquivo-fonte do Gamida.
 * Uso: node scripts/license-headers.js   (acrescenta o aviso onde faltar)
 *
 * Um arquivo copiado sozinho, fora do repositório, continua dizendo de quem é
 * e sob que condições pode ser usado. O teste de integridade usa findMissing()
 * para acusar arquivo novo sem o aviso.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const NOTICE =
  "Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. " +
  "Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE.";
const NOTICE_RE = /Copyright \(c\) \d{4} (José Henrique Rosseto e )?Felipe Pereira Medeiros( \(coautores\))?\. Todos os direitos reservados\./;

// Crônicas do Escriba: obra em coautoria (LICENSE, cláusula 1.5; CREDITOS.md).
// Os heróis do grego e os guardiões novos são criação só de Felipe e ficam com o aviso comum.
const COAUTHORED = [
  "js/modules/scribe-graphics.js",
  "js/modules/scribe-fx.js",
  "js/modules/scribe-map.js",
  "js/modules/scribe-chronicles.js",
  "js/modules/scribe-campaign.js",
  "js/modules/scribe-lore.js",
];
const COAUTHOR_NOTICE =
  "Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). " +
  "Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md.";
const isCoauthored = (file) => COAUTHORED.includes(file) || file.startsWith("scripts/cronicas/");

// Como cada tipo de arquivo escreve um comentário de uma linha
const COMMENT_STYLES = {
  ".js": (text) => `/*! ${text} */`,
  ".css": (text) => `/*! ${text} */`,
  ".html": (text) => `<!-- ${text} -->`,
  ".py": (text) => `# ${text}`,
  ".ps1": (text) => `# ${text}`,
};

// Gerados por ferramenta de terceiros ou sem sintaxe de comentário
const SKIPPED = new Set(["css/tailwind.css", "css/tailwind.input.css"]);
const SOURCE_DIRS = ["js", "css", "scripts", "tests"];
const ROOT_FILES = ["index.html", "sw.js", "test-environment.html", "test-runner.js", "serve.ps1", "tailwind.config.js", "data/data-bundle.js"];

function listSourceFiles() {
  const files = [];
  const walk = (dir) => {
    fs.readdirSync(path.join(root, dir), { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((entry) => {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (COMMENT_STYLES[path.extname(entry.name)] && !SKIPPED.has(rel)) files.push(rel);
      });
  };
  SOURCE_DIRS.filter((dir) => fs.existsSync(path.join(root, dir))).forEach(walk);
  ROOT_FILES.filter((file) => fs.existsSync(path.join(root, file))).forEach((file) => files.push(file));
  return files;
}

/** O aviso precisa estar no começo do arquivo, não perdido no meio do código */
function hasNotice(content, file = "") {
  const head = content.slice(0, 700);
  if (!NOTICE_RE.test(head)) return false;
  // Arquivo das Crônicas precisa nomear os dois coautores
  return !isCoauthored(file) || head.includes("José Henrique Rosseto e Felipe Pereira Medeiros (coautores)");
}

function findMissing() {
  return listSourceFiles().filter((file) => !hasNotice(fs.readFileSync(path.join(root, file), "utf8"), file));
}

function addNotice(file) {
  const full = path.join(root, file);
  let content = fs.readFileSync(full, "utf8");
  const line = COMMENT_STYLES[path.extname(file)](isCoauthored(file) ? COAUTHOR_NOTICE : NOTICE);
  // Arquivo das Crônicas com o aviso antigo (só de Felipe): troca a linha pelo aviso de coautoria
  const lines = content.split("\n");
  const old = lines.findIndex((l, i) => i < 3 && NOTICE_RE.test(l));
  if (old !== -1) {
    lines[old] = line;
    fs.writeFileSync(full, lines.join("\n"));
    return;
  }
  // "#!..." e "<!doctype html>" têm de continuar na primeira linha
  const firstLine = content.split("\n", 1)[0];
  const keepsFirstLine = firstLine.startsWith("#!") || /^<!doctype/i.test(firstLine);
  const updated = keepsFirstLine
    ? `${firstLine}\n${line}\n${content.slice(firstLine.length + 1)}`
    : `${line}\n${content}`;
  fs.writeFileSync(full, updated);
}

module.exports = { NOTICE, COAUTHOR_NOTICE, COAUTHORED, listSourceFiles, findMissing };

if (require.main === module) {
  const missing = findMissing();
  missing.forEach(addNotice);
  console.log(missing.length === 0
    ? "Todos os arquivos-fonte já têm o aviso de direitos autorais."
    : `Aviso de direitos autorais acrescentado a ${missing.length} arquivo(s):\n  ${missing.join("\n  ")}`);
}
