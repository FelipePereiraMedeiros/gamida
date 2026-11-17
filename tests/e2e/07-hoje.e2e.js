/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Painel "Hoje" e progresso unificado entre a prática e os jogos.
 */
const { openApp, scribeSeed, openScribe } = require("./lib");

module.exports = [
  {
    name: "Hoje: o próximo passo leva ao caminho e, com palavras vencidas, à revisão",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      await page.waitForSelector("#today-go");
      assert.match(await page.textContent("#today-panel"), /Caminho do domínio/);
      await page.click("#today-go");
      assert.ok(await page.isVisible("#path-active"), "o botão não abriu o capítulo do caminho");
      await page.evaluate(() => {
        AppState.chapters[2].items.slice(0, 3).forEach((i) => recordSRSError(getTerm(i)));
        switchTab("practice");
      });
      assert.match(await page.textContent("#today-panel"), /Revisar 3 palavras vencidas/);
      await page.click("#today-go");
      assert.ok(await page.isVisible("#anki-active"), "o botão não abriu a revisão");
      await page.evaluate(() => switchTab("practice"));
      await page.click(".today__hide");
      assert.ok(await page.isHidden("#today-panel"), "ocultar hoje não escondeu o painel");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Crônicas: acerto digitado soma ao domínio da palavra",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, {
        language: "hebrew",
        storage: { ...scribeSeed("hebrew"), gamida_game_typing: "1", gamida_scribe_view: "list" },
      });
      await openScribe(page);
      await page.click('[data-chapter="2"]');
      await page.click("#sc-go");
      await page.waitForSelector("#sc-typed-input");
      const term = await page.evaluate(() => window.__scribeBattle().mon.term);
      const before = await page.evaluate((t) => AppState.mastery[SRSModule.getSRSKey(t)] || 0, term);
      const answer = await page.evaluate(() => window.__scribeBattle().mon.word.item.translations[0]);
      await page.fill("#sc-typed-input", answer);
      await page.keyboard.press("Enter");
      await page.waitForFunction(([t, b]) => (AppState.mastery[SRSModule.getSRSKey(t)] || 0) > b, [term, before], { timeout: 5000 });
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Celular: o painel Hoje começa recolhido numa linha, abre com um toque e lembra a escolha",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", viewport: { width: 390, height: 844 } });
      await page.waitForSelector("#today-toggle");
      const closedHeight = await page.evaluate(() => document.getElementById("today-panel").getBoundingClientRect().height);
      assert.ok(closedHeight < 70, `recolhido ainda ocupa ${closedHeight}px`);
      assert.ok(!(await page.isVisible("#today-go")), "recolhido mostrou o botão do passo");
      assert.match(await page.textContent(".today__peek"), /Caminho do domínio/);
      await page.click(".today__title");
      assert.ok(await page.isVisible("#today-go"), "o toque na barra não abriu o painel");
      assert.equal(await page.getAttribute("#today-toggle", "aria-expanded"), "true");
      await page.reload();
      await page.waitForSelector("#today-toggle");
      assert.ok(await page.isVisible("#today-go"), "o painel não lembrou que estava aberto");
      await page.click("#today-toggle");
      assert.ok(!(await page.isVisible("#today-go")), "não recolheu de novo");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Computador: o painel Hoje fica sempre aberto, sem botão de recolher",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      await page.waitForSelector("#today-go");
      assert.ok(await page.isVisible("#today-go"));
      assert.ok(!(await page.isVisible("#today-toggle")), "o botão de recolher apareceu no computador");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
