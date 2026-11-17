/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Usabilidade e acessibilidade: navegação por áreas, entrada de capítulo curta
 * no celular e descrições para leitores de tela nos jogos.
 */
const { openApp, scribeSeed, openScribe } = require("./lib");

module.exports = [
  {
    name: "Navegação: Revisar e Jogar mostram só os seus modos; Consultar e Perfil reúnem o resto",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", viewport: { width: 390, height: 844 } });
      const visible = (sel) => page.isVisible(sel);
      await page.click("#nav-btn-review");
      assert.ok(await visible(".mode-card--review") && await visible(".mode-card--exam"), "Revisar sem revisão ou simulado");
      assert.ok(!(await visible(".mode-card--scribe")) && !(await visible(".mode-card--survival")), "jogos em Revisar");
      await page.click("#nav-btn-play");
      for (const card of [".mode-card--scribe", ".mode-card--stones", ".mode-card--survival"]) assert.ok(await visible(card), `${card} fora de Jogar`);
      await page.click("#nav-btn-consult");
      assert.ok(await visible("#tab-vocab") && await visible("#consult-switch"));
      await page.click("#nav-btn-profile");
      assert.ok(await visible("#daily-goal-form"), "meta de estudo fora do Perfil");
      await page.click("#profile-manage");
      assert.ok(await visible("#tab-manage"), "Gerenciar conteúdo não abriu pelo Perfil");
      assert.match(await page.getAttribute("#nav-btn-profile", "class"), /is-active/, "Gerenciar conteúdo deveria manter Perfil destacado");
      const wide = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(wide <= 392, `rolagem lateral (${wide}px)`);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Celular: na entrada do capítulo, os botões aparecem sem rolar e o pergaminho começa recolhido",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", viewport: { width: 390, height: 844 }, storage: { ...scribeSeed("greek"), gamida_scribe_view: "list" } });
      await openScribe(page);
      await page.click('[data-chapter="3"]');
      await page.waitForSelector("#sc-go");
      await page.evaluate(() => window.scrollTo(0, 0));
      const box = await page.$eval("#sc-go", (b) => b.getBoundingClientRect().bottom);
      assert.ok(box < 844, `"Entrar em batalha" fora da tela (${Math.round(box)}px)`);
      assert.ok(!(await page.$eval(".sc-scroll-wrap", (d) => d.open)), "o pergaminho deveria começar recolhido no celular");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Leitores de tela: a arena e a pedra em foco são descritas em texto",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", storage: { ...scribeSeed("hebrew"), gamida_scribe_view: "list" } });
      await openScribe(page);
      await page.click('[data-chapter="2"]');
      await page.click("#sc-go");
      await page.waitForSelector("#sc-arena");
      const label = await page.getAttribute("#sc-arena", "aria-label");
      assert.match(label, /contra .* com a palavra /, `descrição da arena: ${label}`);
      await page.evaluate(() => { resetToDashboard(); switchTab("play"); openStoneRain(); });
      await page.click("#sr-play");
      await page.waitForFunction(() => document.getElementById("sr-target-text").textContent.length > 0, null, { timeout: 8000 });
      assert.match(await page.textContent("#sr-target-text"), /^Pedra: .+\?$/);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
