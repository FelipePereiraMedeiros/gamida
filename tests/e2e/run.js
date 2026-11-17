/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Testes de navegador do Gamida.
 *
 * Uso: npm run e2e            (todos)
 *      npm run e2e -- cronicas  (só os arquivos cujo nome contém "cronicas")
 *
 * Precisa do Playwright com o Chromium. No CI ele é instalado pelo workflow;
 * neste projeto não é dependência fixa para não pesar no `npm install` de quem
 * só edita conteúdo. Para rodar localmente: npx playwright install chromium.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { startServer } = require("./lib");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (_) {
  console.error("Playwright não encontrado. Instale com: npm install --no-save playwright && npx playwright install chromium");
  process.exit(2);
}

async function main() {
  const filter = process.argv[2] || "";
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith(".e2e.js") && f.includes(filter)).sort();
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let passed = 0;
  const failures = [];
  for (const file of files) {
    const tests = require(path.join(__dirname, file));
    console.log(`\n▶ ${file}`);
    for (const { name, fn } of tests) {
      const t0 = Date.now();
      try {
        await fn({ browser, base, assert });
        passed++;
        console.log(`  ✔ ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      } catch (err) {
        failures.push(`${file} › ${name}: ${err.message}`);
        console.log(`  ✖ ${name}\n    ${String(err.message).split("\n").join("\n    ")}`);
      }
    }
  }
  await browser.close();
  server.close();
  console.log(`\nTestes de navegador: ${passed} passaram, ${failures.length} falharam.`);
  if (failures.length) {
    console.log(failures.map((f) => `  - ${f}`).join("\n"));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
