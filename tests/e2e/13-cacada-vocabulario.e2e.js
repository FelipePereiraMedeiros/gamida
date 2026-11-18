/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Caçada completa das Crônicas: todo o vocabulário do capítulo vira criatura,
 * inclusive num aparelho com capítulos guardados de uma versão antiga.
 */
const fs = require("fs");
const path = require("path");
const { ROOT, openApp, scribeSeed, openScribe, playBattle } = require("./lib");

const defaults = (language) => JSON.parse(fs.readFileSync(path.join(ROOT, "data", `${language}_chapters.json`), "utf8"));
const termOf = (item) => item.hebrew || item.term;

async function startHunt(page, chapterId) {
  await page.evaluate(() => {
    try { localStorage.setItem("gamida_scribe_view", "list"); } catch (_) {}
  });
  await openScribe(page);
  const index = await page.evaluate((id) => ScribeModule.buildCampaign(AppState.chapters, AppState.language).findIndex((c) => c.chapter.id === id), chapterId);
  await page.click(`[data-chapter="${index}"]`);
  await page.click("#sc-full");
  await page.waitForSelector("#sc-mon-info");
}

module.exports = [
  {
    name: "Aparelho com capítulo antigo (favorito marcado, palavras faltando): a caçada traz o vocabulário inteiro",
    async fn({ browser, base, assert }) {
      const chapters = defaults("hebrew");
      const chap = chapters.find((c) => c.id === "kelley_05");
      const full = chap.items.map(termOf);
      // Como ficava num aparelho antigo: três palavras a menos, um favorito e uma tradução editada
      const old = JSON.parse(JSON.stringify(chapters));
      const oldChap = old.find((c) => c.id === "kelley_05");
      const removed = oldChap.items.splice(-3).map(termOf);
      oldChap.items[0].favorite = true;
      oldChap.items[1].translations = ["tradução do aluno"];
      oldChap.items.forEach((i) => delete i.refs);
      oldChap._userModified = true;
      const storage = {
        ...scribeSeed("hebrew"),
        gamida_hebrew_chapters: JSON.stringify(old),
        gamida_data_version_hebrew: "2.30.0",
      };
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", storage });
      const loaded = await page.evaluate(() => {
        const c = AppState.chapters.find((x) => x.id === "kelley_05");
        return { terms: c.items.map((i) => i.hebrew), fav: c.items[0].favorite, edited: c.items[1].translations[0], refs: c.items[0].refs };
      });
      removed.forEach((t) => assert.ok(loaded.terms.includes(t), `a palavra ${t} não voltou ao capítulo`));
      assert.equal(loaded.fav, true, "o favorito se perdeu");
      assert.equal(loaded.edited, "tradução do aluno", "a edição do aluno se perdeu");
      assert.ok(Array.isArray(loaded.refs) && loaded.refs.length, "a referência bíblica não chegou à palavra");
      await startHunt(page, "kelley_05");
      const hunt = await page.evaluate(() => window.__scribeBattle().waves.flat().map((w) => w.item.hebrew));
      assert.equal(hunt.length, full.length, `a caçada trouxe ${hunt.length} de ${full.length} palavras`);
      full.forEach((t) => assert.ok(hunt.includes(t), `a palavra ${t} ficou fora da caçada`));
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Caçada completa jogada até o fim: cada palavra do vocabulário aparece como criatura",
    async fn({ browser, base, assert }) {
      const chap = defaults("greek").find((c) => c.id === "bergmann_03") || defaults("greek")[2];
      const expected = new Set(chap.items.map(termOf));
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", storage: scribeSeed("greek") });
      await startHunt(page, chap.id);
      const seen = new Set();
      const end = await playBattle(page, {
        onStep: async () => {
          const term = await page.evaluate(() => {
            const B = window.__scribeBattle();
            return B && !B.boss && B.mon ? B.mon.term : null;
          });
          if (term) seen.add(term);
        },
      });
      assert.equal(end, "vitória", `a caçada terminou em ${end}`);
      const missing = [...expected].filter((t) => !seen.has(t));
      assert.deepEqual(missing, [], `palavras que não apareceram: ${missing.join(", ")}`);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
