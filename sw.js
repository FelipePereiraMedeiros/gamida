/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Service worker do Gamida: guarda o aplicativo e os dados no aparelho para
 * ele abrir e funcionar sem internet, e instalar como aplicativo.
 *
 * - Cada versão do Gamida tem o próprio cache; os antigos são apagados quando
 *   a versão nova assume.
 * - Tudo é servido do cache primeiro (a versão fica consistente: página,
 *   scripts e dados da mesma versão). A versão nova é baixada em segundo plano
 *   e o aplicativo oferece "Atualizar" quando ela estiver pronta.
 * - Pedidos para outros sites (Google, na sincronização) não passam por aqui.
 */
// <gerado por scripts/build-sw.js: não edite à mão>
const VERSION = "2.49.0";
const PRECACHE = [
  "css/cronicas-pixel.css",
  "css/fonts.css",
  "css/games.css",
  "css/interface.css",
  "css/offline-theme.css",
  "css/styles.css",
  "css/tailwind.css",
  "data/greek_chapters.json",
  "data/hebrew_chapters.json",
  "fonts/SBL_Hbrw.ttf",
  "fonts/SILEOT.ttf",
  "fonts/web/gentium-plus-greek-05b706.woff2",
  "fonts/web/gentium-plus-greek-889e29.woff2",
  "fonts/web/gentium-plus-greek-979f3e.woff2",
  "fonts/web/gentium-plus-greek-e775ef.woff2",
  "fonts/web/gentium-plus-greek-ext-025aca.woff2",
  "fonts/web/gentium-plus-greek-ext-baad68.woff2",
  "fonts/web/gentium-plus-greek-ext-d334b3.woff2",
  "fonts/web/gentium-plus-greek-ext-d7e28c.woff2",
  "fonts/web/gentium-plus-latin-2bbd6d.woff2",
  "fonts/web/gentium-plus-latin-3aa4da.woff2",
  "fonts/web/gentium-plus-latin-88149d.woff2",
  "fonts/web/gentium-plus-latin-ext-224591.woff2",
  "fonts/web/gentium-plus-latin-ext-84b779.woff2",
  "fonts/web/gentium-plus-latin-ext-e1d3db.woff2",
  "fonts/web/gentium-plus-latin-ext-f5a204.woff2",
  "fonts/web/gentium-plus-latin-f58703.woff2",
  "fonts/web/noto-sans-hebrew-greek-ext-043bc6.woff2",
  "fonts/web/noto-sans-hebrew-hebrew-3f0e2f.woff2",
  "fonts/web/noto-sans-hebrew-latin-3da170.woff2",
  "fonts/web/noto-sans-hebrew-latin-ext-636e00.woff2",
  "fonts/web/pixelify-sans-latin-400.woff2",
  "fonts/web/pixelify-sans-latin-700.woff2",
  "fonts/web/rubik-hebrew-366f48.woff2",
  "fonts/web/rubik-latin-0ae40d.woff2",
  "fonts/web/rubik-latin-ext-20c4b0.woff2",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "index.html",
  "js/app.js",
  "js/boot.js",
  "js/data-loader.js",
  "js/modules/actions.js",
  "js/modules/activity.js",
  "js/modules/alphabet.js",
  "js/modules/assessment.js",
  "js/modules/assimilation.js",
  "js/modules/cloud-sync.js",
  "js/modules/evaluation.js",
  "js/modules/game-audio.js",
  "js/modules/html.js",
  "js/modules/mastery-path.js",
  "js/modules/morph-drill.js",
  "js/modules/paradigms.js",
  "js/modules/profiles.js",
  "js/modules/pwa.js",
  "js/modules/scribe-bosses.js",
  "js/modules/scribe-campaign.js",
  "js/modules/scribe-chronicles.js",
  "js/modules/scribe-common.js",
  "js/modules/scribe-fx.js",
  "js/modules/scribe-graphics.js",
  "js/modules/scribe-heroes.js",
  "js/modules/scribe-lore.js",
  "js/modules/scribe-map.js",
  "js/modules/scribe-rules.js",
  "js/modules/sentence-analysis.js",
  "js/modules/srs.js",
  "js/modules/state.js",
  "js/modules/stone-rain.js",
  "js/modules/survival.js",
  "js/modules/today.js",
  "js/modules/ui.js",
  "js/screens/consult.js",
  "js/screens/manage.js",
  "js/screens/practice.js",
  "js/screens/review.js",
  "manifest.webmanifest"
];
// </gerado>

const CACHE = `gamida-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((f) => new Request(f, { cache: "reload" })))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("gamida-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// O aplicativo pede para a versão nova assumir quando o aluno toca em "Atualizar"
self.addEventListener("message", (event) => {
  if (event.data === "atualizar") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // A página de retorno do login vai sempre à rede
  if (url.pathname.endsWith("/oauth-callback.html")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Navegação: a página do aplicativo guardada
    const isApp = req.mode === "navigate" && (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"));
    if (isApp) {
      const page = await cache.match("index.html");
      if (page) return page;
    }
    // Os dados levam ?v=versão no endereço: o cache ignora a consulta
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic" && !url.pathname.endsWith("data-bundle.js")) cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (isApp) {
        const page = await cache.match("index.html");
        if (page) return page;
      }
      throw err;
    }
  })());
});
