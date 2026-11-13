#!/usr/bin/env node
/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Sincroniza a versão do sistema em todos os arquivos que a declaram (ver AGENTS.md)
 * e recompila css/tailwind.css.
 * Uso: node scripts/bump-version.js 2.23.0
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next || "")) {
  console.error("Informe a nova versão no formato X.Y.Z. Ex.: node scripts/bump-version.js 2.23.0");
  process.exit(1);
}

const current = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
const files = [
  "package.json",
  "index.html",
  "js/modules/state.js",
  "js/app.js",
  "js/data-loader.js",
  "tests/13-system-integrity.test.js",
];

files.forEach((file) => {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, "utf8");
  const after = before.split(current).join(next);
  if (after === before) {
    console.warn(`Aviso: versão ${current} não encontrada em ${file}`);
    return;
  }
  fs.writeFileSync(full, after);
  console.log(`${file}: ${current} -> ${next}`);
});

// O package-lock.json repete a versão do projeto em dois campos próprios
const lockPath = path.join(root, "package-lock.json");
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  lock.version = next;
  if (lock.packages && lock.packages[""]) lock.packages[""].version = next;
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
  console.log(`package-lock.json: -> ${next}`);
}

// O CSS compilado acompanha cada versão: classes novas entram sem passo manual
const css = require("./build-css.js");
if (css.isTailwindInstalled()) {
  css.build();
} else if (css.readBuiltSignature() !== css.computeSignature()) {
  console.warn("Aviso: css/tailwind.css está desatualizado. Rode `npm install` e depois `npm run build:css`.");
}
