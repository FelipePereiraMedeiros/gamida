/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Prática: a classificação do termo fica escondida como dica ("Mostrar dica").
 */
const { openApp } = require("./lib");

module.exports = [
  {
    name: "Prática: a classificação fica escondida, aparece em Mostrar dica e depois da resposta, e esconde na questão seguinte",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      await page.evaluate(() => { changeGlobalChapter(AppState.chapters[3].id); setExerciseMode("typing"); });
      await page.waitForSelector("#input-answer");
      const state = () => page.evaluate(() => ({
        info: !document.getElementById("question-meta").classList.contains("hidden"),
        btn: !document.getElementById("btn-show-meta").classList.contains("hidden"),
        type: document.getElementById("question-category").textContent,
        expected: AppState.currentQuestion.type,
      }));
      let s = await state();
      assert.ok(!s.info && s.btn, "a classificação apareceu antes de pedir a dica");
      assert.ok(!(await page.isVisible("#question-category")), "a classificação está visível");
      await page.click("#btn-show-meta");
      s = await state();
      assert.ok(s.info && !s.btn, "Mostrar dica não mostrou a classificação");
      assert.equal(s.type, s.expected);
      assert.equal(await page.getAttribute("#btn-show-meta", "aria-expanded"), "true");
      // Próxima questão: escondida de novo; responder mostra sozinha
      await page.fill("#input-answer", "zzz");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => !document.getElementById("btn-show-meta").classList.contains("hidden"));
      s = await state();
      assert.ok(!s.info, "a dica não voltou a esconder na questão seguinte");
      await page.fill("#input-answer", "zzz");
      await page.keyboard.press("Enter");
      s = await state();
      assert.ok(s.info, "depois da resposta a classificação não apareceu");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Prática com várias lições: a lição de cada termo também fica na dica",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew" });
      await page.evaluate(() => changeGlobalChapter(AppState.chapters[1].id));
      await page.evaluate(() => {
        setSelectedChapters(AppState.chapters.slice(1, 4).map((c) => c.id));
        setExerciseMode("typing");
        buildPracticeQueue();
        renderCurrentQuestion();
      });
      assert.ok(!(await page.isVisible("#question-chapter-badge")), "a lição apareceu antes da dica");
      await page.click("#btn-show-meta");
      assert.ok(await page.isVisible("#question-chapter-badge"), "a dica não mostrou a lição do termo");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
