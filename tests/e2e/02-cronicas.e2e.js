/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Crônicas do Escriba no navegador: capítulo inteiro, mapa, tempo esgotado e caçada completa.
 */
const { openApp, scribeSeed, openScribe, playBattle } = require("./lib");

/** Abre o pergaminho do capítulo pela lista */
async function openChapter(page, index) {
  await page.evaluate(() => {
    try { localStorage.setItem("gamida_scribe_view", "list"); } catch (_) {}
  });
  await openScribe(page);
  await page.click(`[data-chapter="${index}"]`);
  await page.waitForSelector("#sc-go");
}

module.exports = [
  {
    name: "Capítulo inteiro no hebraico e no grego: criaturas, guardião, relíquia e progresso",
    async fn({ browser, base, assert }) {
      for (const [language, index] of [["hebrew", 3], ["greek", 4]]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, storage: scribeSeed(language) });
        await openChapter(page, index);
        await page.click("#sc-go");
        const end = await playBattle(page);
        assert.equal(end, "vitória", `${language}: a batalha terminou em ${end}`);
        assert.match(await page.textContent(".sc-big"), new RegExp(`Capítulo ${index + 1} completo`));
        const progress = await page.evaluate(() => ScribeModule.loadProgress());
        const id = await page.evaluate((i) => ScribeModule.buildCampaign(AppState.chapters, AppState.language)[i].chapter.id, index);
        assert.ok(progress.done[id], `${language}: capítulo não ficou marcado como vencido`);
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Mapa: cada livro mostra um botão por capítulo e o botão leva ao pergaminho",
    async fn({ browser, base, assert }) {
      for (const [language, books] of [["hebrew", 2], ["greek", 1]]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, storage: { ...scribeSeed(language), gamida_scribe_view: "map" } });
        await openScribe(page);
        const tabs = await page.$$("[data-book]");
        assert.equal(Math.max(tabs.length, 1), books, `${language}: abas de livro`);
        const nodes = await page.$$(".sc-node");
        assert.ok(nodes.length >= 11, `${language}: só ${nodes.length} lugares no mapa`);
        await nodes[1].click();
        await page.click("#sc-map-enter");
        await page.waitForSelector("#sc-go");
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Tempo esgotado: a criatura ataca quem não responde",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew", storage: scribeSeed("hebrew") });
      await openChapter(page, 2);
      await page.click("#sc-go");
      await page.waitForSelector("#sc-hero-hp-text");
      const before = await page.evaluate(() => window.__scribeBattle().hp);
      // Se a primeira criatura for veloz, ela foge sem atacar e o ataque vem na seguinte
      await page.waitForFunction((hp) => window.__scribeBattle() && window.__scribeBattle().hp < hp, before, { timeout: 30000 });
      assert.match(await page.textContent("#sc-log"), /tempo acabou/i);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Caçada completa: todas as palavras do capítulo entram, e errar faz a palavra voltar",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", storage: scribeSeed("greek") });
      await openChapter(page, 2);
      await page.click("#sc-full");
      await page.waitForSelector("#sc-mon-info");
      const info = await page.evaluate(() => {
        const B = window.__scribeBattle();
        return { total: B.fullTotal, words: ScribeModule.buildFullWaves(B.chapter, {}).flat().length };
      });
      assert.equal(info.total, info.words, "a caçada não trouxe o vocabulário inteiro");
      assert.match(await page.textContent("#sc-mon-info"), new RegExp(`Recolhidas 0/${info.total}`));
      // erra a primeira de propósito: a palavra vai para a onda das que escaparam
      await page.waitForFunction(() => window.__scribeBattle() && !window.__scribeBattle().lock && document.querySelectorAll("#sc-screen .sc-opt").length);
      const wrong = await page.evaluate(() => window.__scribeBattle().opts.findIndex((o) => !o.isCorrect));
      await page.keyboard.press(String(wrong + 1));
      let escaped = 0;
      const end = await playBattle(page, {
        onStep: async () => {
          escaped = Math.max(escaped, await page.evaluate(() => (window.__scribeBattle() ? window.__scribeBattle().escaped.length + (window.__scribeBattle().rematch ? 1 : 0) : 0)));
        },
      });
      assert.equal(end, "vitória", `a caçada terminou em ${end}`);
      assert.ok(escaped >= 1, "a palavra errada não voltou no fim");
      assert.match(await page.textContent("#sc-screen"), /Selo da caçada completa/);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Guardião no celular: frase longa compacta, com passo, pergunta e alternativas à vista",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", viewport: { width: 390, height: 844 }, storage: scribeSeed("greek") });
      await openScribe(page);
      // A frase mais longa do grego (Jo 1.51, 26 palavras)
      await page.evaluate(() => {
        const sentence = AppState.chapters.find((c) => c.id === "bergmann_05").sentences.find((s) => s.id === "sent_05_05");
        ScribeExtra.startExtraBattle({ id: "teste", title: "Teste", words: [], sentences: [sentence], onEnd: () => {}, onBack: () => {} });
      });
      await page.click("#sc-fight");
      await page.waitForSelector("#sc-cmd .sc-step");
      await page.waitForTimeout(900);
      const view = await page.evaluate(() => {
        const box = (sel) => document.querySelector(sel).getBoundingClientRect();
        const opts = [...document.querySelectorAll("#sc-cmd .sc-opt")].map((b) => b.getBoundingClientRect());
        return {
          step: document.querySelector("#sc-cmd .sc-step").textContent,
          question: box("#sc-cmd .sc-q"),
          lastOption: opts[opts.length - 1],
          framed: document.querySelectorAll("#sc-cmd .sc-bw:not(.is-plain)").length,
          long: !!document.querySelector(".sc-bossline--long"),
          height: window.innerHeight,
        };
      });
      assert.match(view.step, /^Frase 1 de 1 · passo 1 de \d: significado/);
      assert.ok(view.long, "a frase longa não ficou compacta");
      assert.ok(view.framed >= 1 && view.framed <= 3, `${view.framed} palavras em destaque`);
      assert.ok(view.question.top >= 0 && view.lastOption.bottom <= view.height, "a pergunta ou as alternativas ficaram fora da tela");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
