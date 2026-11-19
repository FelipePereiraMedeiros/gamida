/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * "Prova de amanhã": modo temporário de revisão (só no hebraico).
 */
const { openApp } = require("./lib");

module.exports = [
  {
    name: "Prova de amanhã: aviso uma vez, botão no menu, 72 palavras com plural e construto, fora das Crônicas e do caminho",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", viewport: { width: 390, height: 844 }, examAlert: true });
      await page.waitForSelector("#exam-alert");
      assert.ok(await page.isVisible("#nav-btn-exam"), "o botão do menu não apareceu no hebraico");
      await page.click("#exam-alert-go");
      await page.waitForFunction(() => AppState.currentChapter && AppState.currentChapter.id === "prova_amanha");
      const info = await page.evaluate(() => ({
        tab: AppState.currentTab,
        queue: practiceQueue.length,
        plural: AppState.currentChapter.items.some((i) => i.hebrew === "אֲנָשִׁים"),
        construct: AppState.currentChapter.items.some((i) => i.hebrew === "אַנְשֵׁי" && /de$/.test(i.translations[0])),
        campaign: ScribeModule.buildCampaign(AppState.chapters, "hebrew").some((c) => c.chapter.id === "prova_amanha"),
        path: MasteryPathModule.getPathStatus(AppState.chapters, []).some((s) => s.chapter.id === "prova_amanha"),
        scroll: document.documentElement.scrollWidth,
      }));
      assert.equal(info.tab, "practice");
      assert.equal(info.queue, 72, `a prática trouxe ${info.queue} itens`);
      assert.ok(info.plural && info.construct, "faltou o plural ou o construto");
      assert.ok(!info.campaign, "a lição da prova entrou nas Crônicas");
      assert.ok(!info.path, "a lição da prova entrou no Caminho do domínio");
      assert.ok(info.scroll <= 390, "o menu com o botão novo criou rolagem lateral");
      assert.ok(!(await page.isVisible("#exam-alert")), "o aviso não fechou");
      // O aviso aparece uma vez só
      await page.reload();
      await page.waitForSelector("#nav-btn-exam");
      await page.waitForTimeout(600);
      assert.ok(!(await page.isVisible("#exam-alert")), "o aviso apareceu de novo");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Prova de amanhã não aparece no grego",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", examAlert: true });
      await page.waitForTimeout(800);
      assert.ok(!(await page.isVisible("#nav-btn-exam")), "o botão apareceu no grego");
      assert.ok(!(await page.isVisible("#exam-alert")), "o aviso apareceu no grego");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
