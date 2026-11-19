/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * "Prova de amanhã": modo temporário de revisão (só no hebraico).
 */
const { openApp } = require("./lib");

module.exports = [
  {
    name: "Prova de amanhã: aviso uma vez, botão no menu, palavras com plural e construto, fora das Crônicas e do caminho",
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
      assert.equal(info.queue, 137, `a prática trouxe ${info.queue} itens (72 palavras e formas + 65 da gramática)`);
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
    name: "Prova de amanhã: filtro de forma (tudo, raiz, plural, construto)",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew" });
      await page.evaluate(() => { openExamMode(); setExerciseMode("typing"); });
      assert.ok(await page.evaluate(() => !document.getElementById("practice-form-container").classList.contains("hidden")), "o filtro de forma não apareceu na prova");
      const pick = async (form) => {
        await page.evaluate((f) => document.getElementById(`exam-form-${f}`).click(), form);
        return page.evaluate(() => practiceQueue.map((i) => ({ h: i.hebrew, t: i.type, s: !!i.singular })));
      };
      const root = await pick("root");
      assert.equal(root.length, 36);
      assert.ok(root.every((i) => !i.s), "a raiz trouxe plural ou construto");
      const plural = await pick("plural");
      assert.ok(plural.length >= 18 && plural.every((i) => i.s && (!/construto/.test(i.t) || /iguais/.test(i.t))), "o plural trouxe outra forma");
      const construct = await pick("construct");
      assert.ok(construct.length >= 16 && construct.every((i) => /construto/.test(i.t)), "o construto trouxe outra forma");
      assert.ok(construct.some((i) => i.h === "אַנְשֵׁי"));
      assert.match(await page.textContent("#practice-options-summary"), /Só o construto/);
      assert.equal((await pick("all")).length, 137);
      const grammar = await pick("grammar");
      assert.equal(grammar.length, 65, "a gramática dos slides não veio inteira");
      // A escolha fica guardada e só vale na prova
      await page.evaluate(() => document.getElementById("exam-form-plural").click());
      await page.evaluate(() => changeGlobalChapter(AppState.chapters[1].id));
      assert.ok(await page.evaluate(() => document.getElementById("practice-form-container").classList.contains("hidden")), "o filtro apareceu fora da prova");
      assert.ok(await page.evaluate(() => practiceQueue.some((i) => i.hebrew === "אָב")), "o filtro da prova afetou outra lição");
      await page.evaluate(() => openExamMode());
      assert.ok(await page.evaluate(() => practiceQueue.every((i) => i.singular)), "a escolha do filtro não ficou guardada");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Prova de amanhã: frases da lista com chave, filtros nominais/verbais e simulado 5 + 5",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew" });
      await page.evaluate(() => openExamMode());
      assert.ok(await page.isVisible("#exam-cheatsheet"), "a barra da prova não apareceu");
      const queue = () => page.evaluate(() => practiceQueue.map((i) => ({ k: i.kind, key: !!i.key })));
      await page.evaluate(() => setExamPhrases("nominal"));
      assert.equal(await page.evaluate(() => AppState.exerciseMode), "sentences", "o filtro de frases não levou ao modo Frases");
      let q = await queue();
      assert.ok(q.length === 108 && q.every((i) => i.k === "nominal"), `nominais: ${q.length}`);
      assert.ok(q.filter((i) => i.key).length >= 90, "faltou a chave do gabarito nas nominais");
      await page.evaluate(() => setExamPhrases("verbal"));
      q = await queue();
      assert.ok(q.length === 109 && q.every((i) => i.k === "verbal"), `verbais: ${q.length}`);
      await page.evaluate(() => setExamPhrases("kelley"));
      assert.ok((await queue()).every((i) => i.k === "kelley"));
      await page.click("text=Simulado (10 frases)");
      q = await queue();
      assert.equal(q.filter((i) => i.k === "nominal").length, 5, "o simulado não trouxe 5 nominais");
      assert.equal(q.filter((i) => i.k === "verbal").length, 5, "o simulado não trouxe 5 verbais");
      // Responder mostra a chave do gabarito; a próxima questão a esconde
      assert.ok(!(await page.isVisible("#feedback-key")));
      await page.fill("#input-sentence", "xyz");
      await page.keyboard.press("Enter");
      await page.waitForSelector("#feedback-key:not(.hidden)");
      assert.match(await page.textContent("#feedback-key-text"), /^[NV]\d+ · /);
      assert.ok(!(await page.isVisible("#btn-feedback-analysis")), "as frases da lista não têm análise palavra por palavra");
      await page.keyboard.press("Enter");
      assert.ok(!(await page.isVisible("#feedback-key")), "a chave não escondeu na questão seguinte");
      // A colinha abre; fora da prova a barra some
      await page.click(".exam-cheat > summary");
      assert.ok(await page.isVisible("text=Cinco lembretes para a prova"));
      await page.click("text=Vocabulário I–XIV");
      assert.ok(!(await page.isVisible("#exam-cheatsheet")), "a barra da prova ficou fora da prova");
      const ids = await page.evaluate(() => AppState.selectedChapterIds);
      assert.ok(ids.includes("kelley_14") && ids.includes("kelley_09") && !ids.includes("prova_amanha"), "o vocabulário I–XIV não selecionou as lições");
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
