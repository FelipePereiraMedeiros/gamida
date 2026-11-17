/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Uso sem internet: aplicativo instalável (manifesto e ícones), service worker
 * que guarda tudo no aparelho, e abertura direta do disco (file://).
 */
const path = require("path");
const { ROOT } = require("./lib");

module.exports = [
  {
    name: "Depois da primeira visita, o Gamida abre e funciona sem internet nos dois idiomas",
    async fn({ browser, base, assert }) {
      const context = await browser.newContext({ serviceWorkers: "allow" });
      const errors = [];
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${base}/index.html`);
      // Espera o service worker guardar tudo e assumir a página
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      const manifest = await page.evaluate(async () => (await fetch("manifest.webmanifest")).json());
      assert.equal(manifest.short_name, "Gamida");
      assert.ok(manifest.icons.some((i) => i.sizes === "512x512"), "falta o ícone de 512 px");
      await context.setOffline(true);
      for (const language of ["hebrew", "greek"]) {
        await page.evaluate((lang) => localStorage.setItem("gamida_language", lang), language);
        await page.reload();
        await page.waitForFunction(() => window.AppState && AppState.chapters && AppState.chapters.length > 20, null, { timeout: 15000 });
        assert.equal(await page.evaluate(() => AppState.language), language);
        await page.evaluate(() => { switchTab("play"); openStoneRain(); });
        assert.ok(await page.isVisible("#stone-rain-view"), `${language}: jogo não abriu sem internet`);
      }
      const fontsOk = await page.evaluate(async () => (await document.fonts.load('16px "SBL Hebrew"', "א")).length > 0);
      assert.ok(fontsOk, "fonte hebraica não carregou sem internet");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Aberto direto do disco (file://), carrega os capítulos pelo pacote de dados",
    async fn({ browser, assert }) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`file://${path.join(ROOT, "index.html")}`);
      await page.waitForFunction(() => window.AppState && AppState.chapters && AppState.chapters.length > 20, null, { timeout: 15000 });
      assert.ok(await page.evaluate(() => !!window.GAMIDA_DEFAULT_DATA), "o pacote de dados não foi usado");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Num servidor normal, o pacote de dados de 1,5 MB não é baixado",
    async fn({ browser, base, assert }) {
      const context = await browser.newContext({ serviceWorkers: "block" });
      const page = await context.newPage();
      const bundles = [];
      page.on("request", (r) => { if (r.url().includes("data-bundle.js")) bundles.push(r.url()); });
      await page.goto(`${base}/index.html`);
      await page.waitForFunction(() => window.AppState && AppState.chapters && AppState.chapters.length > 20);
      assert.deepEqual(bundles, [], "data-bundle.js foi baixado sem necessidade");
      await context.close();
    },
  },
];
