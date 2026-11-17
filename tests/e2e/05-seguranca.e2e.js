/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Segurança na prática: dado malicioso importado pelo aluno não vira HTML,
 * e todas as ações da página funcionam sem JavaScript dentro do HTML.
 */
const { openApp, scribeSeed } = require("./lib");

const PAYLOAD = `"'><img src=x data-xss=1>`;

/** Quantos elementos injetados existem na página */
const injected = (page) => page.evaluate(() => document.querySelectorAll("[data-xss]").length);

module.exports = [
  {
    name: "Toda ação data-on-* da página aponta para uma função que existe",
    async fn({ browser, base, assert }) {
      for (const language of ["hebrew", "greek"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language });
        const missing = await page.evaluate(() => {
          const out = [];
          document.querySelectorAll("*").forEach((el) => {
            [...el.attributes].filter((a) => a.name.startsWith("data-on-")).forEach((a) => {
              const { path } = GamidaActions.parseAction(a.value);
              let fn = window;
              path.forEach((p) => { fn = fn == null ? undefined : fn[p]; });
              if (typeof fn !== "function") out.push(a.value);
            });
          });
          return out;
        });
        assert.deepEqual(missing, [], `${language}: ações sem função: ${missing.join(", ")}`);
        assert.deepEqual(errors, [], errors.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Clicar e escolher pela interface funciona com a política de segurança ligada",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { language: "greek" });
      await page.click("#nav-btn-assessment");
      assert.ok(await page.isVisible("#tab-assessment"), "o clique na aba não funcionou");
      await page.click("#nav-btn-vocab");
      assert.ok(await page.isVisible("#tab-vocab"));
      await page.fill("#vocab-search", "λόγ");
      await page.waitForTimeout(300);
      const rows = await page.evaluate(() => document.querySelectorAll("#tab-vocab tbody tr").length);
      assert.ok(rows > 0, "a busca do dicionário não respondeu à digitação");
      // Elemento com role="button": Enter aciona a mesma ação do clique
      await page.click("#nav-btn-practice");
      await page.evaluate(() => {
        const box = document.getElementById("stat-days-box");
        box.focus();
        box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
      assert.ok(await page.isVisible("#tab-manage"), "Enter no atalho da meta diária não abriu a configuração");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Capítulo importado com HTML malicioso em todo texto não injeta nada em nenhuma tela",
    async fn({ browser, base, assert }) {
      for (const language of ["hebrew", "greek"]) {
        const { context, page, errors } = await openApp({ browser, base }, { language, storage: scribeSeed(language, { done: {} }) });
        // Capítulo copiado de um real, com o veneno acrescentado a cada texto
        const json = await page.evaluate((payload) => {
          const poison = (v, key) => {
            if (typeof v === "string") return key === "id" ? v : `${v}${payload}`;
            if (Array.isArray(v)) return v.map((x) => poison(x, key));
            if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, poison(x, k)]));
            return v;
          };
          const base = AppState.chapters.find((c) => (c.sentences || []).length >= 2 && (c.items || []).length >= 6);
          const ch = poison(JSON.parse(JSON.stringify(base)), "");
          ch.id = "capitulo_veneno";
          ch._custom = true;
          return JSON.stringify(ch);
        }, PAYLOAD);
        await page.click("#nav-btn-manage");
        await page.fill("#json-input", json);
        await page.click('[data-on-click="saveChapterFromJSON()"]');
        await page.waitForFunction(() => AppState.chapters.some((c) => c.id === "capitulo_veneno"));
        const screens = [];
        let shownAsText = 0;
        const check = async (label) => {
          const n = await injected(page);
          if (n) screens.push(`${label} (${n})`);
          // O veneno precisa aparecer como texto comum: prova de que chegou à tela e foi escapado
          if (await page.evaluate(() => document.body.innerText.includes("<img src=x data-xss=1>"))) shownAsText++;
        };
        await page.evaluate(() => changeGlobalChapter("capitulo_veneno"));
        await check("seletor de capítulo");
        for (const mode of ["typing", "choice", "sentences"]) {
          await page.evaluate((m) => { switchTab("practice"); setExerciseMode(m); }, mode);
          await check(`prática ${mode}`);
          // responde errado para ver o retorno da correção
          const input = await page.$("#tab-practice input[type=text]:visible, #tab-practice textarea:visible");
          if (input) {
            await input.fill(`zz${PAYLOAD}`);
            await page.keyboard.press("Enter");
          } else {
            await page.evaluate(() => {
              const wrong = [...document.querySelectorAll(".choice-grid button:not([data-correct])")].find((b) => b.offsetParent);
              if (wrong) wrong.click();
            });
          }
          await check(`correção ${mode}`);
        }
        await page.evaluate(() => typeof openCurrentPracticeSentenceAnalysis === "function" && openCurrentPracticeSentenceAnalysis());
        await check("análise da frase");
        await page.evaluate(() => { const b = document.getElementById("btn-close-analysis-modal"); if (b) b.click(); });
        await page.evaluate(() => switchTab("vocab"));
        await check("dicionário");
        await page.evaluate(() => switchTab("paradigms"));
        await check("tabelas");
        await page.evaluate(() => { switchTab("assessment"); openSimuladoConfig(); startSimulado(); });
        await check("simulado");
        await page.evaluate(() => { resetToDashboard(); openMasteryPath(); });
        await check("trilha de domínio");
        await page.evaluate(() => { resetToDashboard(); openMorphDrill(); });
        await check("mago da morfologia");
        await page.evaluate(() => { resetToDashboard(); openStoneRain(); });
        await check("chuva de pedras (menu)");
        await page.click("#sr-play").catch(() => {});
        await page.waitForTimeout(800);
        await check("chuva de pedras (jogo)");
        await page.evaluate(() => { resetToDashboard(); localStorage.setItem("gamida_scribe_view", "list"); openScribeChronicles(); });
        await check("crônicas (lista)");
        const idx = await page.evaluate(() => ScribeModule.buildCampaign(AppState.chapters, AppState.language).findIndex((c) => c.chapter.id === "capitulo_veneno"));
        assert.ok(idx >= 0, "o capítulo importado não entrou nas Crônicas");
        await page.click(`[data-chapter="${idx}"]`);
        await check("crônicas (pergaminho)");
        await page.click("#sc-go");
        await page.waitForTimeout(800);
        await check("crônicas (batalha)");
        await page.evaluate(() => { localStorage.setItem("gamida_scribe_view", "map"); openScribeChronicles(); });
        await check("crônicas (mapa)");
        await page.evaluate(() => switchTab("profile"));
        await check("perfil");
        assert.deepEqual(screens, [], `${language}: HTML injetado em: ${screens.join(", ")}`);
        assert.ok(shownAsText >= 8, `${language}: o texto malicioso só apareceu (escapado) em ${shownAsText} telas; o teste não está exercitando as telas`);
        const real = errors.filter((e) => !/Failed to load resource|net::ERR|404/.test(e));
        assert.deepEqual(real, [], real.join(" | "));
        await context.close();
      }
    },
  },
  {
    name: "Nome de perfil e arquivo de perfil com HTML malicioso não injetam nada",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base });
      await page.evaluate((payload) => {
        const p = ProfilesModule.getActiveProfile();
        ProfilesModule.renameProfile(p.id, `Ana${payload}`);
        switchTab("profile");
      }, PAYLOAD);
      assert.equal(await injected(page), 0, "nome do perfil virou HTML");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
