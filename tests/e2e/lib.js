/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Base dos testes de navegador (Playwright): servidor estático, navegador sem
 * internet, página do Gamida e um robô que joga as Crônicas do Escriba.
 *
 * Qualquer pedido para fora do servidor local é bloqueado e conta como erro:
 * o Gamida não pode depender de servidores externos.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

/** Servidor estático do repositório numa porta livre */
function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.normalize(path.join(ROOT, url === "/" ? "index.html" : url));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("não encontrado");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

/**
 * Abre o Gamida numa página nova
 * @param {Object} env { browser, base }
 * @param {Object} opts { language, viewport, storage (objeto chave → valor), routes (fn(route, url) → true se tratou) }
 */
async function openApp(env, opts = {}) {
  // O service worker fica desligado aqui (ele atenderia os pedidos antes do bloqueio de internet);
  // o teste de uso sem internet (06-offline) liga o dele.
  const context = await env.browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, deviceScaleFactor: 1, serviceWorkers: "block" });
  const errors = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === env.base) return route.continue();
    if (opts.routes && (await opts.routes(route, url))) return undefined;
    errors.push(`pedido externo: ${url.href}`);
    return route.abort();
  });
  const seed = { gamida_language: opts.language || "hebrew", ...(opts.storage || {}) };
  await context.addInitScript((data) => {
    window.__GAMIDA_TEST__ = true;
    try {
      if (!sessionStorage.getItem("__seeded")) {
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        sessionStorage.setItem("__seeded", "1");
      }
    } catch (_) {}
  }, seed);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`erro na página: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("dialog", (d) => d.accept());
  await page.goto(`${env.base}/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.AppState && AppState.chapters && AppState.chapters.length > 0);
  return { context, page, errors };
}

/** Progresso das Crônicas já com herói escolhido e prólogo visto */
function scribeSeed(language, fields = {}) {
  return { [`gamida_${language}_scribe`]: JSON.stringify({ cls: "cavaleiro", done: {}, lvl: 30, xp: 0, potions: 3, scrolls: 2, relics: [], stats: {}, seenIntro: true, story: { p1: true, p2: true }, ...fields }) };
}

/** Abre as Crônicas do Escriba pela tela de Avaliar */
async function openScribe(page) {
  await page.evaluate(() => switchTab("play"));
  await page.click(".mode-card--scribe");
  await page.waitForSelector("#sc-screen .sc-card");
}

/**
 * Joga a batalha em curso até o fim, sempre com a resposta certa
 * (lida do estado da batalha, exposto só nos testes)
 * @returns {Promise<"vitória"|"derrota"|"tempo">}
 */
async function playBattle(page, { maxSeconds = 300, onStep } = {}) {
  // Limite por tempo, não por passos: máquinas lentas (CI) dão menos passos por segundo
  const deadline = Date.now() + maxSeconds * 1000;
  for (let step = 0; Date.now() < deadline; step++) {
    await page.waitForTimeout(90);
    const st = await page.evaluate(() => {
      const B = window.__scribeBattle && window.__scribeBattle();
      const q = (sel) => document.querySelector(sel);
      if (q("#sc-retry") && !B) return { end: "derrota" };
      if (q(".sc-big") && !B) return { end: "vitória" };
      if (q("#sc-fight")) return { fight: true };
      if (!B || B.lock) return { wait: true };
      if (q("#sc-strike")) return { build: B.s.chunks };
      const opts = [...document.querySelectorAll("#sc-screen .sc-opt")];
      if (!opts.length) return { wait: true };
      let idx = -1;
      if (B.boss && !B.rush) idx = B.opts.indexOf(B.ans);
      else idx = B.opts.findIndex((o) => o && o.isCorrect);
      return { idx };
    });
    if (onStep) await onStep(st, step);
    if (st.end) return st.end;
    if (st.fight) await page.click("#sc-fight");
    else if (st.build) {
      for (const text of st.build) {
        const chips = await page.$$("#sc-bank .sc-chip:not([disabled])");
        for (const chip of chips) {
          if ((await chip.textContent()) === text) {
            await chip.click();
            break;
          }
        }
      }
      await page.click("#sc-strike");
      await page.waitForTimeout(400);
    } else if (st.idx >= 0) {
      await page.keyboard.press(String(st.idx + 1));
    }
  }
  return "tempo";
}

module.exports = { ROOT, startServer, openApp, scribeSeed, openScribe, playBattle };
