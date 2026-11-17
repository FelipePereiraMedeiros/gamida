/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Crônicas do Escriba: na batalha, os menus recolhem e a arena ganha a tela.
 */
const { openApp, scribeSeed, openScribe } = require("./lib");

const visibleBox = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const onScreen = r.bottom > 1 && r.top < innerHeight - 1 && r.right > 1 && r.left < innerWidth - 1 && getComputedStyle(el).display !== "none";
  return { onScreen, top: r.top, bottom: r.bottom, height: r.height };
}, sel);

async function startBattle(page) {
  await openScribe(page);
  await page.click('[data-chapter="2"]');
  await page.click("#sc-go");
  await page.waitForSelector("#sc-arena");
  await page.waitForTimeout(400);
}

module.exports = [
  {
    name: "Celular: na batalha os menus recolhem, o botão Menus os traz de volta e eles voltam ao sair",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", viewport: { width: 390, height: 844 }, storage: { ...scribeSeed("hebrew"), gamida_scribe_view: "list" } });
      await startBattle(page);
      assert.ok(!(await visibleBox(page, ".app-header__bar")).onScreen, "a barra de cima continuou na tela");
      assert.ok(!(await visibleBox(page, "#navbar-tabs-row")).onScreen, "a navegação de baixo continuou na tela");
      assert.ok(!(await page.isVisible(".sc-top")), "os botões das Crônicas continuaram na tela");
      assert.ok((await visibleBox(page, "#sc-arena")).height > 300, "a arena não cresceu");
      // As alternativas cabem na tela sem rolar
      assert.ok((await visibleBox(page, "#sc-screen .sc-opt")).bottom < 844, "as alternativas ficaram abaixo da tela");
      const arenaTop = (await visibleBox(page, "#sc-arena")).top;
      await page.click("#sc-menu-btn");
      await page.waitForTimeout(300);
      assert.equal(await page.getAttribute("#sc-menu-btn", "aria-expanded"), "true");
      assert.ok((await visibleBox(page, ".app-header__bar")).onScreen, "o botão Menus não trouxe a barra de cima");
      assert.ok((await visibleBox(page, "#navbar-tabs-row")).onScreen, "o botão Menus não trouxe a navegação");
      assert.ok(await page.isVisible(".sc-top button"), "o botão Menus não trouxe os botões das Crônicas");
      assert.equal((await visibleBox(page, "#sc-arena")).top, arenaTop, "abrir os menus empurrou a arena");
      // Os botões continuam funcionando: Sair volta ao painel com os menus no lugar
      await page.click('.sc-top [data-on-click="resetToDashboard()"]');
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.body.classList.contains("sc-focus")), false, "o modo de batalha continuou depois de sair");
      assert.ok((await visibleBox(page, "#navbar-tabs-row")).onScreen, "a navegação não voltou depois de sair");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Computador: a barra lateral sai na batalha, volta com o mouse na borda e some ao voltar ao jogo",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", viewport: { width: 1280, height: 800 }, storage: { ...scribeSeed("greek"), gamida_scribe_view: "list" } });
      await startBattle(page);
      await page.mouse.move(640, 400);
      await page.waitForTimeout(300);
      assert.ok(!(await visibleBox(page, "#main-app-header")).onScreen, "a barra lateral continuou na tela");
      await page.mouse.move(5, 400);
      await page.waitForTimeout(300);
      assert.ok((await visibleBox(page, "#main-app-header")).onScreen, "o mouse na borda não trouxe a barra lateral");
      await page.mouse.move(700, 400);
      await page.mouse.move(720, 410);
      await page.waitForTimeout(1100);
      assert.ok(!(await visibleBox(page, "#main-app-header")).onScreen, "a barra lateral não recolheu ao voltar ao jogo");
      // No mapa (fora da batalha), tudo no lugar
      await page.click("#sc-flee");
      await page.waitForTimeout(300);
      assert.ok((await visibleBox(page, "#main-app-header")).onScreen, "a barra lateral não voltou no mapa");
      assert.ok(!(await page.isVisible("#sc-menu-btn")), "o botão Menus apareceu fora da batalha");
      // Letras em pixel carregadas do próprio Gamida
      const font = await page.evaluate(async () => {
        await document.fonts.ready;
        return { family: getComputedStyle(document.querySelector("#sc-screen .sc-btn, #sc-screen button")).fontFamily, loaded: document.fonts.check('700 16px "Pixelify Sans"') };
      });
      assert.match(font.family, /Pixelify Sans/);
      assert.ok(font.loaded, "a fonte em pixel não carregou");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
