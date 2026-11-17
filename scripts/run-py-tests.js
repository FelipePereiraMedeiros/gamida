/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Roda os testes em Python de tests/ (análise de frases, restauração do hebraico,
 * orientação de leitura). Uso: npm run test:py
 * Usa python3 (ou python, no Windows) e falha se algum teste falhar.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "tests");
const files = fs.readdirSync(dir).filter((f) => /^test_.*\.py$/.test(f)).sort();
const python = ["python3", "python"].find((cmd) => spawnSync(cmd, ["--version"]).status === 0);
if (!python) {
  console.error("Python 3 não encontrado.");
  process.exit(2);
}

const failed = files.filter((file) => {
  const run = spawnSync(python, [path.join(dir, file)], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  const ok = run.status === 0;
  console.log(`${ok ? "✔" : "✖"} ${file}`);
  if (!ok) console.log((run.stdout || "") + (run.stderr || ""));
  return !ok;
});

console.log(`\nTestes Python: ${files.length - failed.length} de ${files.length} passaram.`);
process.exit(failed.length ? 1 : 0);
