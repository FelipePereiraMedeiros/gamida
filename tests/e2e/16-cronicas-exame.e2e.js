/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Crônicas do Escriba: "Estudo para exame" (modo temporário, à parte da aventura).
 */
const { openApp, scribeSeed, openScribe, playBattle } = require("./lib");

const progress = (page) => page.evaluate(() => {
  const p = ScribeModule.loadProgress();
  return JSON.stringify({ done: p.done, relics: p.relics, full: p.full, story: p.story });
});

async function openExam(page, prefs, { alreadyOpen = false } = {}) {
  if (!alreadyOpen) await openScribe(page);
  await page.evaluate((p) => localStorage.setItem(`gamida_scribe_exam_${AppState.language}`, JSON.stringify(p)), prefs);
  await page.click("#sc-exam-open");
  await page.waitForSelector("#sc-exam-go");
}

module.exports = [
  {
    name: "Crônicas, estudo para exame: entrada no menu, batalha com o guardião das provas, aventura intacta (hebraico e grego)",
    async fn({ browser, base, assert }) {
      for (const language of ["hebrew", "greek"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, storage: { ...scribeSeed(language), gamida_scribe_view: "list" } });
        await openScribe(page);
        assert.ok(await page.isVisible("#sc-exam-open"), `${language}: a entrada do exame não apareceu no menu`);
        const before = await progress(page);
        await openExam(page, { words: "sorteio", guardian: "both" }, { alreadyOpen: true });
        await page.click("#sc-exam-go");
        await page.waitForSelector("#sc-arena");
        const info = await page.evaluate(() => {
          const B = window.__scribeBattle();
          return { extra: !!B.extra, words: B.count, sentences: B.extra.sentences.length, boss: B.meta.boss };
        });
        assert.ok(info.extra && info.words === 20 && info.sentences === 5, `${language}: batalha montada errada ${JSON.stringify(info)}`);
        const end = await playBattle(page, { maxSeconds: 240 });
        assert.equal(end, "vitória", `${language}: a batalha terminou em ${end}`);
        assert.match(await page.textContent("#sc-screen"), /Guardião das Provas vencido/);
        assert.equal(await progress(page), before, `${language}: o exame mexeu na aventura (capítulos, relíquias, selos ou história)`);
        // Voltar ao exame e ao mapa
        await page.click("#sc-exam-menu");
        await page.waitForSelector("#sc-exam-go");
        await page.click("#sc-exam-map");
        await page.waitForSelector("#sc-exam-open");
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Crônicas, estudo para exame: só criaturas termina sem guardião; cair leva de volta ao exame",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", storage: { ...scribeSeed("greek"), gamida_scribe_view: "list" } });
      await openExam(page, { words: "tabela", guardian: "none" });
      await page.click("#sc-exam-go");
      await page.waitForSelector("#sc-arena");
      assert.equal(await page.evaluate(() => window.__scribeBattle().extra.sentences.length), 0);
      const end = await playBattle(page, { maxSeconds: 200 });
      assert.equal(end, "vitória", `terminou em ${end}`);
      assert.match(await page.textContent("#sc-screen"), /Ondas vencidas/);
      // Derrota: a vida acaba e a tela oferece voltar ao exame
      await page.click("#sc-exam-again");
      await page.waitForSelector("#sc-arena");
      await page.evaluate(() => { const B = window.__scribeBattle(); B.hp = 1; B.ward = 0; B.revive = 0; });
      await page.waitForFunction(() => document.querySelector("#sc-extra-back"), null, { timeout: 40000 });
      assert.match(await page.textContent("#sc-screen"), /Você caiu/);
      await page.click("#sc-extra-back");
      await page.waitForSelector("#sc-exam-go");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Crônicas: sem a lição do exame, o menu não mostra a entrada e a aventura segue normal",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", storage: { ...scribeSeed("hebrew"), gamida_scribe_view: "list" } });
      await page.evaluate(() => { AppState.chapters = AppState.chapters.filter((c) => c.id !== "estudo_exame"); });
      await openScribe(page);
      assert.ok(!(await page.isVisible("#sc-exam-open")), "a entrada apareceu sem a lição do exame");
      await page.click('[data-chapter="2"]');
      await page.click("#sc-go");
      await page.waitForSelector("#sc-arena");
      assert.equal(await page.evaluate(() => !!window.__scribeBattle().extra), false);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
