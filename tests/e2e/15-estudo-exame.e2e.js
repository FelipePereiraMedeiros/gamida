/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * "Estudo para exame": modo temporário de revisão das Provas 1 e 2 (hebraico e grego).
 * Confere cada função do módulo nos dois idiomas.
 */
const { openApp } = require("./lib");

const queue = (page) => page.evaluate(() => practiceQueue.map((i) => ({ term: i.hebrew || i.term, kind: i.kind || "", group: i.group || "", type: i.type || "", key: !!i.key })));

async function answerSentence(page, text) {
  await page.fill("#input-sentence", text);
  await page.keyboard.press("Enter");
  await page.waitForSelector("#feedback-key:not(.hidden)");
}

module.exports = [
  {
    name: "Estudo para exame: aviso uma vez, botão no menu nas duas línguas, fora das Crônicas e do caminho",
    async fn({ browser, base, assert }) {
      for (const language of ["hebrew", "greek"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, viewport: { width: 390, height: 844 }, examAlert: true });
        await page.waitForSelector("#exam-alert");
        assert.match(await page.textContent("#exam-alert"), /Estudo para exame/);
        assert.ok(await page.isVisible("#nav-btn-exam"), `${language}: o botão do menu não apareceu`);
        await page.click("#exam-alert-go");
        await page.waitForFunction(() => AppState.currentChapter && AppState.currentChapter.id === "estudo_exame");
        const info = await page.evaluate((lang) => ({
          tab: AppState.currentTab,
          campaign: ScribeModule.buildCampaign(AppState.chapters, lang).some((c) => c.chapter.id === "estudo_exame"),
          path: MasteryPathModule.getPathStatus(AppState.chapters, []).some((s) => s.chapter.id === "estudo_exame"),
          scroll: document.documentElement.scrollWidth,
        }), language);
        assert.equal(info.tab, "practice");
        assert.ok(!info.campaign, `${language}: a lição do exame entrou nas Crônicas`);
        assert.ok(!info.path, `${language}: a lição do exame entrou no Caminho do domínio`);
        assert.ok(info.scroll <= 390, `${language}: rolagem lateral no celular`);
        assert.ok(await page.isVisible("#exam-cheatsheet"), `${language}: a barra do exame não apareceu`);
        await page.reload();
        await page.waitForSelector("#nav-btn-exam");
        await page.waitForTimeout(500);
        assert.ok(!(await page.isVisible("#exam-alert")), `${language}: o aviso apareceu de novo`);
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Hebraico: frases das provas com chave e análise, filtros, simulado, vocabulário, escolha, erros e favoritas",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "hebrew" });
      await page.evaluate(() => openExamMode());
      // Vocabulário: Digitação e Escolha
      await page.evaluate(() => { setExerciseMode("typing"); setExamWords("all"); });
      const words = await queue(page);
      assert.ok(words.length >= 30 && words.every((w) => w.kind === "vocab"), `vocabulário: ${words.length}`);
      assert.ok(!(await page.isVisible("#exam-words-tabela")), "a tabela de análise apareceu no hebraico");
      await page.evaluate(() => setExamWords("prova1"));
      assert.ok((await queue(page)).every((w) => w.group === "prova1" || w.group === "ambas"));
      await page.evaluate(() => setExamWords("all"));
      await page.evaluate(() => setExerciseMode("choice"));
      const right = await page.evaluate(() => [...document.querySelectorAll(".choice-grid button")].findIndex((b) => b.dataset.correct === "1"));
      assert.ok(right >= 0, "a escolha não montou as alternativas");
      // Erra na Escolha: a palavra vai para os Erros
      await page.evaluate(() => [...document.querySelectorAll(".choice-grid button")].find((b) => b.dataset.correct !== "1").click());
      await page.evaluate(() => setExerciseMode("errors"));
      assert.ok((await queue(page)).length >= 1, "o erro não entrou no modo Erros");
      // Frases: as 18, por prova e simulado de 10
      await page.evaluate(() => trainExamPhrases());
      let q = await queue(page);
      assert.equal(q.length, 18, `frases: ${q.length}`);
      assert.ok(q.every((s) => s.key), "faltou a chave em alguma frase");
      await page.evaluate(() => setExamPhrases("prova1"));
      assert.equal((await queue(page)).length, 8);
      await page.evaluate(() => setExamPhrases("prova2"));
      assert.equal((await queue(page)).length, 10);
      await page.click("text=Simulado (10 frases)");
      assert.equal((await queue(page)).length, 10);
      // Resposta: chave do gabarito e análise palavra por palavra
      await answerSentence(page, "xyz");
      assert.match(await page.textContent("#feedback-key-text"), /^Prova [12] · \d+/);
      await page.click("#btn-feedback-analysis");
      await page.waitForSelector("#sentence-analysis-modal:not(.hidden)");
      assert.ok((await page.evaluate(() => document.querySelectorAll("#sentence-analysis-modal [data-token-index], #sentence-analysis-modal .morph-token, #sentence-analysis-modal button").length)) > 0, "a análise abriu vazia");
      await page.keyboard.press("Escape");
      // A tradução do gabarito conta como acerto
      await page.evaluate(() => nextQuestion());
      const gabarito = await page.evaluate(() => AppState.currentQuestion.translations[0]);
      await page.fill("#input-sentence", gabarito);
      await page.keyboard.press("Enter");
      assert.ok(await page.evaluate(() => AppState.correctCount >= 1), "a tradução do gabarito não contou como acerto");
      // Favoritar no exame
      await page.click("#btn-practice-fav");
      await page.evaluate(() => setExerciseMode("favorites"));
      assert.ok((await queue(page)).length >= 1, "a favorita não entrou em Favoritas");
      // Colinha só do hebraico
      await page.evaluate(() => setExerciseMode("typing"));
      await page.click(".exam-cheat > summary");
      assert.ok(await page.isVisible('.exam-cheat__grid[data-exam-lang="hebrew"]'));
      assert.ok(!(await page.isVisible('.exam-cheat__grid[data-exam-lang="greek"]')), "a colinha do grego apareceu no hebraico");
      // Simulado da aba Revisar: só a lição do exame
      await page.evaluate(() => { switchTab("review"); openSimuladoConfig(); });
      assert.match(await page.textContent("#assess-config"), /1 capítulo/);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Grego: 40 palavras, sorteio de 20, tabela de análise, frases com chave e análise, Mago da Morfologia e Chuva de Pedras",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      await page.evaluate(() => openExamMode());
      await page.evaluate(() => { setExerciseMode("typing"); setExamWords("prova1"); });
      let q = await queue(page);
      assert.ok(q.length === 20 && q.every((w) => w.group === "prova1" && w.kind === "vocab"), `prova 1: ${q.length}`);
      await page.evaluate(() => setExamWords("prova2"));
      assert.equal((await queue(page)).length, 20);
      // Sorteio de 20 das 40, como no exame
      await page.click(".exam-bar__actions >> text=Sorteio de 20 palavras");
      q = await queue(page);
      assert.equal(q.length, 20, "o sorteio não trouxe 20 palavras");
      assert.equal(new Set(q.map((w) => w.term)).size, 20, "o sorteio repetiu palavra");
      assert.ok(q.every((w) => w.kind === "vocab"));
      // A resposta do gabarito conta como acerto
      const answer = await page.evaluate(() => AppState.currentQuestion.translations[0]);
      await page.fill("#input-answer", answer);
      await page.keyboard.press("Enter");
      assert.ok(await page.evaluate(() => AppState.correctCount === 1), "a resposta do gabarito não contou");
      // Tabela de análise: a classificação fica na dica e a chave aparece depois
      await page.click(".exam-bar__actions >> text=Tabela de análise");
      q = await queue(page);
      assert.equal(q.length, 31);
      assert.ok(q.every((w) => w.kind === "tabela" && w.key));
      await page.click("#btn-show-meta");
      assert.match(await page.textContent("#question-category"), /—/);
      await page.fill("#input-answer", "xyz");
      await page.keyboard.press("Enter");
      await page.waitForSelector("#feedback-key:not(.hidden)");
      assert.match(await page.textContent("#feedback-key-text"), /Prova [12]/);
      // Frases com chave e análise
      await page.click(".exam-bar__actions >> text=Frases das provas");
      q = await queue(page);
      assert.ok(q.length >= 25, `frases: ${q.length}`);
      assert.ok(q.every((s) => s.key), "faltou a chave em alguma frase");
      await page.evaluate(() => setExamPhrases("simulado"));
      assert.equal((await queue(page)).length, 5);
      await answerSentence(page, "xyz");
      await page.click("#btn-feedback-analysis");
      await page.waitForSelector("#sentence-analysis-modal:not(.hidden)");
      await page.keyboard.press("Escape");
      // Colinha só do grego
      await page.click(".exam-cheat > summary");
      assert.ok(await page.isVisible("text=Regras de correção do professor"));
      assert.ok(!(await page.isVisible('.exam-cheat__grid[data-exam-lang="hebrew"]')), "a colinha do hebraico apareceu no grego");
      // Mago da Morfologia já com a lição do exame
      await page.evaluate(() => openExamMorphDrill());
      await page.waitForTimeout(300);
      const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem("gamida_morph_drill_prefs")).chapterIds);
      assert.deepEqual(prefs, ["estudo_exame"]);
      assert.match(await page.evaluate(() => document.body.innerText), /\d+ palavras disponíveis/);
      // Chuva de Pedras com as palavras do exame
      await page.evaluate(() => { openExamMode(); resetToDashboard(); switchTab("play"); openStoneRain(); });
      await page.waitForTimeout(300);
      assert.deepEqual(await page.evaluate(() => StoneRainModule.selectedChapterIds()), ["estudo_exame"], "a Chuva não usou só a lição do exame");
      await page.click("#sr-play").catch(() => {});
      await page.waitForTimeout(700);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Recorte das provas: no exame só a lição do exame (mesmo com Acumulativo ou Todas); fora dele, o exame não se mistura",
    async fn({ browser, base, assert }) {
      for (const language of ["greek", "hebrew"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language });
        const chapters = () => page.evaluate(() => [...new Set(practiceQueue.map((i) => i._chapterId))]);
        await page.evaluate(() => openExamMode());
        for (const mode of ["typing", "choice", "sentences"]) {
          await page.evaluate((m) => setExerciseMode(m), mode);
          assert.deepEqual(await chapters(), ["estudo_exame"], `${language} ${mode}: entrou lição de fora`);
        }
        // "Até o atual" e "Todos" dentro do exame: nunca misturam o exame com outras lições
        const neverMixed = (list, what) => assert.ok(!(list.includes("estudo_exame") && list.length > 1), `${language} ${what}: misturou o exame (${list.join(",")})`);
        await page.evaluate(() => { setExerciseMode("typing"); setPracticeCumulative(true); });
        neverMixed(await chapters(), "Até o atual");
        await page.evaluate(() => { openExamMode(); selectAllPracticeChapters(); });
        neverMixed(await chapters(), "Todos");
        // Fora do exame: uma lição comum com todas marcadas não traz o exame
        const first = await page.evaluate(() => AppState.chapters.find((c) => !c.special && (c.items || []).length > 5).id);
        await page.evaluate((id) => { changeGlobalChapter(id); selectAllPracticeChapters(); }, first);
        const outside = await chapters();
        assert.ok(outside.length > 1 && !outside.includes("estudo_exame"), `${language}: o exame entrou no treino comum (${outside.join(",")})`);
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Grego: Raízes (só as 40 palavras) e Forma do léxico (digitada sem acento e na Escolha, em grego); hebraico sem essas opções",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek", viewport: { width: 390, height: 844 } });
      await page.evaluate(() => { openExamMode(); setExerciseMode("typing"); });
      await page.evaluate(() => setExamWords("raizes")); // botão dentro do painel "Opções"
      let q = await queue(page);
      assert.equal(q.length, 40);
      assert.ok(q.every((w) => w.kind === "vocab"), "entrou forma da tabela nas raízes");
      await page.evaluate(() => trainExamWords());
      assert.equal((await queue(page)).length, 40, "o atalho Vocabulário não ficou só com as 40");
      await page.click(".exam-bar__actions >> text=Forma do léxico");
      q = await queue(page);
      assert.ok(q.length === 31 && q.every((w) => w.kind === "lexico"), `forma do léxico: ${q.length}`);
      const answer = await page.evaluate(() => AppState.currentQuestion.translations.slice(-1)[0].normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      await page.fill("#input-answer", answer);
      await page.keyboard.press("Enter");
      assert.ok(await page.evaluate(() => AppState.correctCount === 1), "a forma do léxico sem acento não contou");
      await page.waitForSelector("#feedback-key:not(.hidden)");
      assert.match(await page.textContent("#feedback-key-text"), /forma do léxico/);
      await page.evaluate(() => setExerciseMode("choice"));
      const options = await page.evaluate(() => [...document.querySelectorAll(".choice-btn")].map((b) => ({ text: b.textContent, right: b.dataset.correct === "1", greek: b.classList.contains("greek-text") })));
      assert.equal(options.length, 4);
      assert.equal(options.filter((o) => o.right).length, 1);
      assert.ok(options.every((o) => o.greek && /[\u0370-\u03FF\u1F00-\u1FFF]/.test(o.text)), "alternativa da forma do léxico fora do grego");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
      const h = await openApp({ browser, base }, { language: "hebrew" });
      await h.page.evaluate(() => openExamMode());
      for (const id of ["raizes", "tabela", "lexico"]) assert.ok(!(await h.page.isVisible(`#exam-words-${id}`)), `hebraico mostrou ${id}`);
      assert.deepEqual(h.errors, [], h.errors.join(" | "));
      await h.context.close();
    },
  },
];
