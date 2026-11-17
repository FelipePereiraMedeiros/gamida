/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Gera os ícones do aplicativo instalável (icons/*.png) a partir de um desenho
 * em HTML: quadrado laranja da marca com a letra א, como no cabeçalho do Gamida.
 * Uso: node scripts/build-icons.js   (precisa do Playwright com Chromium)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "icons");

const page = (size, maskable) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "SBL Hebrew"; src: url("file://${path.join(root, "fonts", "SBL_Hbrw.ttf")}"); }
html, body { margin: 0; width: ${size}px; height: ${size}px; background: ${maskable ? "#c2410c" : "transparent"}; }
.mark { position: absolute; inset: ${maskable ? 0 : Math.round(size * 0.04)}px; display: grid; place-items: center;
  border-radius: ${maskable ? 0 : Math.round(size * 0.22)}px; background: linear-gradient(160deg, #ea580c, #c2410c); }
.mark span { color: #fff; font: 700 ${Math.round(size * (maskable ? 0.5 : 0.62))}px "SBL Hebrew", serif; line-height: 1; transform: translateY(-4%); }
</style></head><body><div class="mark"><span>א</span></div></body></html>`;

async function main() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (_) {
    console.error("Playwright não encontrado: npm install --no-save playwright && npx playwright install chromium");
    process.exit(2);
  }
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const targets = [
    ["icon-192.png", 192, false],
    ["icon-512.png", 512, false],
    ["icon-maskable-512.png", 512, true],
    ["apple-touch-icon.png", 180, true],
  ];
  for (const [name, size, maskable] of targets) {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(page(size, maskable));
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(out, name), omitBackground: !maskable });
    await p.close();
    console.log(`icons/${name}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
