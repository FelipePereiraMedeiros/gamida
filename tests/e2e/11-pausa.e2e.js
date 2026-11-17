/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Pausa nos jogos: nas Crônicas o tempo e a fuga param e a pergunta fica coberta.
 */
const { openApp, scribeSeed, openScribe } = require("./lib");

module.exports = [
  {
    name: "Crônicas: pausar para o tempo, cobre a pergunta e continuar retoma de onde parou",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", storage: { ...scribeSeed("hebrew"), gamida_scribe_view: "list" } });
      await openScribe(page);
      await page.click('[data-chapter="2"]');
      await page.click("#sc-go");
      await page.waitForSelector(".sc-opt");
      await page.waitForTimeout(500);
      const width = () => page.evaluate(() => parseFloat(document.querySelector("#sc-timer i").style.width));
      await page.click("#sc-pause-btn");
      assert.ok(await page.isVisible("#sc-pause"), "a tela de pausa não apareceu");
      const hp = await page.evaluate(() => window.__scribeBattle().hp);
      const before = await width();
      await page.waitForTimeout(2500);
      assert.ok(Math.abs((await width()) - before) < 1, "o tempo continuou correndo na pausa");
      // A pergunta não responde durante a pausa (nem pelo teclado)
      await page.keyboard.press("1");
      assert.equal(await page.evaluate(() => document.querySelectorAll(".sc-opt.is-ok, .sc-opt.is-bad").length), 0, "respondeu com o jogo pausado");
      assert.equal(await page.evaluate(() => window.__scribeBattle().hp), hp, "o inimigo atacou durante a pausa");
      await page.click("#sc-resume");
      assert.ok(!(await page.isVisible("#sc-pause")), "continuar não fechou a pausa");
      const resumed = await width();
      assert.ok(Math.abs(resumed - before) < 8, `o tempo não retomou de onde parou (${before} → ${resumed})`);
      await page.waitForTimeout(600);
      assert.ok((await width()) < resumed, "o tempo não voltou a correr");
      // Teclado: P pausa e Esc continua
      await page.keyboard.press("p");
      assert.ok(await page.isVisible("#sc-pause"), "a tecla P não pausou");
      await page.keyboard.press("Escape");
      assert.ok(!(await page.isVisible("#sc-pause")), "Esc não continuou");
      // Sair da aba pausa sozinho
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      assert.ok(await page.isVisible("#sc-pause"), "sair da aba não pausou");
      await page.click("#sc-pause-flee");
      assert.ok(await page.isVisible(".sc-chap, .sc-worldmap"), "voltar ao mapa não funcionou");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Crônicas: a criatura veloz não foge com o jogo pausado",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", storage: { ...scribeSeed("greek"), gamida_scribe_view: "list" } });
      await openScribe(page);
      await page.click('[data-chapter="2"]');
      await page.click("#sc-go");
      await page.waitForSelector(".sc-opt");
      // Prazo de fuga de 1,5 s, como o da criatura veloz
      await page.evaluate(() => {
        const B = window.__scribeBattle();
        window.__fled = false;
        B.fleeFn = () => { window.__fled = true; };
        B.fleeAt = performance.now() + 1500;
        B.fleeT = setTimeout(B.fleeFn, 1500);
      });
      await page.click("#sc-pause-btn");
      await page.waitForTimeout(2500);
      assert.equal(await page.evaluate(() => window.__fled), false, "a criatura fugiu durante a pausa");
      await page.click("#sc-resume");
      await page.waitForTimeout(2000);
      assert.equal(await page.evaluate(() => window.__fled), true, "o prazo de fuga não voltou a correr depois da pausa");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
