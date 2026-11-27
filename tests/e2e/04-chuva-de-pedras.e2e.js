/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Chuva de Pedras: abre, joga, pausa e termina nos dois idiomas.
 */
const { openApp } = require("./lib");

module.exports = [
  {
    name: "Abre, joga, pausa e termina; os erros vão para a lista de revisão",
    async fn({ browser, base, assert }) {
      for (const [language, viewport] of [["hebrew", { width: 1280, height: 900 }], ["greek", { width: 390, height: 800 }]]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, viewport });
        await page.evaluate(() => {
          changeGlobalChapter(AppState.chapters[4].id);
          switchTab("play");
        });
        await page.click(".mode-card--stones");
        await page.click("#sr-play");
        await page.waitForTimeout(1500);
        await page.keyboard.press(" ");
        assert.ok(await page.isVisible("#sr-pause"), `${language}: a pausa não apareceu`);
        await page.keyboard.press(" ");
        for (let i = 0; i < 40 && !(await page.isVisible("#sr-over")); i++) {
          await page.keyboard.press(String(1 + (i % 4)));
          await page.waitForTimeout(250);
        }
        assert.ok(await page.isVisible("#sr-over"), `${language}: o jogo não terminou`);
        assert.ok((await page.evaluate(() => getErrorCards().length)) > 0, `${language}: os erros não foram para a revisão`);
        await page.evaluate(() => resetToDashboard());
        assert.ok(await page.isVisible("#assess-dashboard"));
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Chuva com lição salva que saiu do material (o antigo exame): volta ao padrão em vez de abrir vazia",
    async fn({ browser, base, assert }) {
      const storage = { gamida_greek_stone_rain: JSON.stringify({ best: 0, chapterIds: ["estudo_exame"], onlyErrors: false }) };
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", storage });
      const ids = await page.evaluate(() => StoneRainModule.selectedChapterIds());
      assert.ok(ids.length > 0 && !ids.includes("estudo_exame"), `lições: ${ids.join(",")}`);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
