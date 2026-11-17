/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Prática com várias lições: na ordem das lições ou com as lições misturadas.
 */
const { openApp } = require("./lib");

/** Quantas vezes a fila troca de lição de um item para o seguinte */
const chapterSwitches = (page) => page.evaluate(() => {
  let n = 0;
  for (let i = 1; i < practiceQueue.length; i++) if (practiceQueue[i]._chapterId !== practiceQueue[i - 1]._chapterId) n++;
  return { n, size: practiceQueue.length, ids: [...new Set(practiceQueue.map((q) => q._chapterId))] };
});

module.exports = [
  {
    name: "Lições misturadas: as palavras de várias lições vêm embaralhadas juntas, e a escolha fica guardada",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      const chosen = await page.evaluate(() => {
        const ids = AppState.chapters.slice(1, 6).map((c) => c.id);
        setSelectedChapters(ids);
        buildPracticeQueue();
        return ids;
      });
      const ordered = await chapterSwitches(page);
      assert.equal(ordered.n, chosen.length - 1, "na ordem das lições, a fila deveria ir lição por lição");
      await page.evaluate(() => { document.getElementById("order-mix").click(); });
      assert.equal(await page.getAttribute("#order-mix", "aria-pressed"), "true");
      assert.equal(await page.getAttribute("#order-asc", "aria-pressed"), "false");
      const mixed = await chapterSwitches(page);
      assert.equal(mixed.size, ordered.size, "misturar mudou a quantidade de itens");
      assert.deepEqual(mixed.ids.sort(), ordered.ids.sort(), "misturar mudou as lições da fila");
      assert.ok(mixed.n > chosen.length * 3, `a fila não misturou as lições (${mixed.n} trocas)`);
      assert.equal(await page.evaluate(() => localStorage.getItem("gamida_mixChapters_greek")), "1");
      // Escolher uma ordem desliga a mistura
      await page.evaluate(() => { document.getElementById("order-asc").click(); });
      assert.equal(await page.getAttribute("#order-mix", "aria-pressed"), "false");
      assert.equal((await chapterSwitches(page)).n, chosen.length - 1);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
