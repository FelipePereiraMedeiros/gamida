/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Crônicas do Escriba: depois do primeiro erro, as alternativas mostram a transliteração.
 */
const { openApp, scribeSeed, openScribe } = require("./lib");

module.exports = [
  {
    name: "Crônicas: errar uma alternativa revela a transliteração de cada opção, nos dois idiomas",
    async fn({ browser, base, assert }) {
      for (const language of ["hebrew", "greek"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, storage: { ...scribeSeed(language), gamida_scribe_view: "list" } });
        await openScribe(page);
        await page.click('[data-chapter="3"]');
        await page.click("#sc-go");
        await page.waitForSelector(".sc-opt");
        const shown = () => page.evaluate(() => [...document.querySelectorAll("#sc-screen .sc-opt__tr")].filter((n) => !n.hidden && n.offsetParent).length);
        assert.equal(await shown(), 0, `${language}: a transliteração apareceu antes do erro`);
        const expected = await page.evaluate(() => window.__scribeBattle().opts.map((o) => o.transliteration));
        assert.ok(expected.filter(Boolean).length >= 2, `${language}: as alternativas vieram sem transliteração`);
        // Erra de propósito
        const wrong = await page.evaluate(() => window.__scribeBattle().opts.findIndex((o) => !o.isCorrect));
        await page.click(`#sc-screen .sc-opt[data-k="${wrong}"]`);
        assert.equal(await shown(), expected.filter(Boolean).length, `${language}: a transliteração não apareceu em todas as alternativas`);
        const texts = await page.evaluate(() => [...document.querySelectorAll("#sc-screen .sc-opt")].map((b) => (b.querySelector(".sc-opt__tr") || {}).textContent || ""));
        assert.deepEqual(texts, expected, `${language}: a transliteração não corresponde a cada alternativa`);
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
];
