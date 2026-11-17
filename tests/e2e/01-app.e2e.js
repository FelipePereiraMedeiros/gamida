/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * O aplicativo abre nos dois idiomas, troca de aba e pratica sem erros e sem internet.
 */
const { openApp } = require("./lib");

const TABS = ["practice", "assessment", "paradigms", "vocab", "manage", "profile"];

module.exports = [
  {
    name: "Abre nos dois idiomas, passa por todas as abas e não pede nada da internet",
    async fn({ browser, base, assert }) {
      for (const language of ["hebrew", "greek"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language });
        assert.equal(await page.evaluate(() => AppState.language), language);
        // A aba de tabelas só aparece nos capítulos que têm tabelas
        const withTables = await page.evaluate(() => (AppState.chapters.find((c) => (c.paradigms || []).length) || {}).id);
        if (withTables) await page.evaluate((id) => changeGlobalChapter(id), withTables);
        for (const tab of TABS) {
          if (tab === "paradigms" && !withTables) continue;
          await page.evaluate((t) => switchTab(t), tab);
          assert.ok(await page.isVisible(`#tab-${tab}`), `aba ${tab} não apareceu`);
        }
        assert.deepEqual(errors, [], `${language}: ${errors.join(" | ")}`);
        await context.close();
      }
    },
  },
  {
    name: "Prática por alternativas: acertar e errar contam no placar",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      await page.evaluate(() => {
        changeGlobalChapter(AppState.chapters[2].id);
        setExerciseMode("choice");
      });
      await page.click(".choice-grid button[data-correct]");
      await page.keyboard.press("Enter");
      await page.click(".choice-grid button:not([data-correct])");
      const s = await page.evaluate(() => ({ total: AppState.totalAnswered, right: AppState.correctCount }));
      assert.equal(s.total, 2);
      assert.equal(s.right, 1);
      assert.deepEqual(errors, []);
      await context.close();
    },
  },
  {
    name: "Celular: a navegação de baixo cabe na tela, sem rolagem lateral",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { viewport: { width: 360, height: 760 } });
      for (const tab of TABS) {
        await page.evaluate((t) => switchTab(t), tab);
        const wide = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(wide <= 362, `aba ${tab} com rolagem lateral (${wide}px)`);
      }
      assert.deepEqual(errors, []);
      await context.close();
    },
  },
];
