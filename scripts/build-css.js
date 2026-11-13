#!/usr/bin/env node
/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Compila o Tailwind para css/tailwind.css, o arquivo que o index.html carrega.
 * Uso: npm run build:css   (antes, uma única vez: npm install)
 *
 * `node scripts/bump-version.js` já chama esta compilação, então o CSS acompanha cada versão.
 *
 * O cabeçalho do arquivo guarda uma assinatura das classes usadas no HTML e no JavaScript.
 * O teste de integridade refaz essa assinatura: se alguém usar uma classe nova e esquecer
 * de recompilar, o teste acusa em vez de a tela aparecer sem estilo.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const OUTPUT = path.join(root, "css", "tailwind.css");
const INPUT = path.join(root, "css", "tailwind.input.css");
const SIGNATURE_RE = /^\/\* gamida-tailwind-classes: ([0-9a-f]{64}) \*\//;

function listContentFiles() {
  const files = [path.join(root, "index.html")];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".js")) files.push(full);
      });
  };
  walk(path.join(root, "js"));
  return files;
}

/**
 * Assinatura do conjunto de palavras que podem ser classes do Tailwind.
 * Só muda quando surge ou some uma palavra candidata, não a cada edição do código.
 * @returns {string}
 */
function computeSignature() {
  const candidates = new Set();
  listContentFiles().forEach((file) => {
    const text = fs.readFileSync(file, "utf8");
    (text.match(/[A-Za-z0-9_:/.[\]%#()-]+/g) || []).forEach((word) => {
      // Só palavras com cara de classe utilitária: minúsculas com hífen, dois-pontos ou colchete.
      // Utilitários de uma palavra só (hidden, flex...) já estão sempre presentes no código.
      if (/^[a-z!-][A-Za-z0-9_:/.[\]%#()-]*$/.test(word) && /[-:[]/.test(word)) candidates.add(word);
    });
  });
  const config = fs.readFileSync(path.join(root, "tailwind.config.js"), "utf8");
  return crypto
    .createHash("sha256")
    .update(Array.from(candidates).sort().join("\n"))
    .update("\n--config--\n")
    .update(config)
    .digest("hex");
}

function readBuiltSignature() {
  if (!fs.existsSync(OUTPUT)) return null;
  const match = fs.readFileSync(OUTPUT, "utf8").match(SIGNATURE_RE);
  return match ? match[1] : null;
}

function isTailwindInstalled() {
  try {
    require.resolve("tailwindcss/lib/cli.js", { paths: [root] });
    return true;
  } catch (_) {
    return false;
  }
}

function build() {
  if (!isTailwindInstalled()) {
    console.error("Tailwind não instalado. Rode `npm install` uma vez e repita `npm run build:css`.");
    process.exit(1);
  }
  const cli = require.resolve("tailwindcss/lib/cli.js", { paths: [root] });
  const css = execFileSync(process.execPath, [cli, "-c", path.join(root, "tailwind.config.js"), "-i", INPUT, "--minify"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 64 * 1024 * 1024,
  });
  const header =
    `/* gamida-tailwind-classes: ${computeSignature()} */\n` +
    "/* Arquivo gerado por `npm run build:css`. Não edite à mão: altere as classes no HTML/JS e recompile. */\n";
  fs.writeFileSync(OUTPUT, header + css.trim() + "\n");
  console.log(`css/tailwind.css gerado (${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB)`);
}

module.exports = { computeSignature, readBuiltSignature, isTailwindInstalled, build };

if (require.main === module) build();
