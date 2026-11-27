/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Perfis e cópia do perfil no Google Drive (com o Google simulado, sem internet).
 */
const { openApp } = require("./lib");

/** Google e Drive de mentira: guarda o arquivo de perfil em memória */
function fakeGoogle(drive, name) {
  return async (route, url) => {
    if (url.host === "accounts.google.com") {
      const back = `${url.searchParams.get("redirect_uri")}#access_token=TOK-${name}&expires_in=3599&token_type=Bearer&state=${url.searchParams.get("state")}`;
      await route.fulfill({ status: 302, headers: { location: back } });
      return true;
    }
    if (url.pathname === "/oauth2/v3/userinfo") {
      await route.fulfill({ json: { sub: "777", email: "aluno@exemplo.com", name: "Aluno Teste" } });
      return true;
    }
    if (url.pathname === "/drive/v3/files") {
      await route.fulfill({ json: { files: drive.file ? [{ id: "f1" }] : [] } });
      return true;
    }
    if (url.pathname === "/drive/v3/files/f1") {
      await route.fulfill({ status: 200, contentType: "application/json", body: drive.file });
      return true;
    }
    if (url.pathname.startsWith("/upload/drive/v3/files")) {
      const body = route.request().postData();
      drive.uploads++;
      drive.file = route.request().method() === "POST" ? body.split("\r\n")[7] : body;
      await route.fulfill({ json: { id: "f1" } });
      return true;
    }
    return false;
  };
}

const PREVIEW = { gamida_google_preview: "1", gamida_google_client_id: "123-abc.apps.googleusercontent.com" };

module.exports = [
  {
    name: "Cada perfil guarda o próprio progresso e as próprias configurações",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { storage: { gamida_daily_goal: "42" } });
      await page.evaluate(() => switchTab("profile"));
      await page.fill("#profile-new-name", "Maria");
      await Promise.all([page.waitForNavigation(), page.click("#profile-new-form button")]);
      await page.waitForFunction(() => window.ProfilesModule);
      assert.equal(await page.evaluate(() => ProfilesModule.getActiveProfile().name), "Maria");
      assert.equal(await page.evaluate(() => localStorage.getItem("gamida_daily_goal")), null, "o perfil novo herdou a meta do outro");
      const first = await page.evaluate(() => ProfilesModule.listProfiles().find((p) => !p.active).id);
      await Promise.all([page.waitForNavigation(), page.evaluate((id) => ProfilesModule.switchProfile(id), first)]);
      await page.waitForFunction(() => window.ProfilesModule);
      assert.equal(await page.evaluate(() => localStorage.getItem("gamida_daily_goal")), "42", "a meta do primeiro perfil não voltou");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Mudança no progresso é percebida sem interceptar o armazenamento do navegador",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base });
      const intact = await page.evaluate(() => Storage.prototype.setItem.toString().includes("[native code]"));
      assert.ok(intact, "o perfil ainda substitui Storage.prototype.setItem");
      const before = await page.evaluate(() => ProfilesModule.getActiveProfile().updatedAt || 0);
      await page.evaluate(() => localStorage.setItem("gamida_daily_goal", "77"));
      await page.waitForFunction((t) => (ProfilesModule.getActiveProfile().updatedAt || 0) > t, before, { timeout: 5000 });
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Gamida aberto em duas abas: a segunda avisa",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base });
      const second = await context.newPage();
      await second.goto(`${base}/index.html`, { waitUntil: "load" });
      await second.waitForSelector("#gamida-other-tab", { timeout: 5000 });
      await page.waitForSelector("#gamida-other-tab", { timeout: 5000 });
      assert.match(await second.textContent("#gamida-other-tab"), /outra aba/);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Lembrete de cópia: aparece depois de 14 dias sem cópia e some ao baixar o arquivo",
    async fn({ browser, base, assert }) {
      const old = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const registry = { version: 1, active: "p_antigo", profiles: [{ id: "p_antigo", name: "Ana", createdAt: old, updatedAt: old }] };
      const { context, page, errors } = await openApp({ browser, base }, {
        storage: { gamida_profiles: JSON.stringify(registry), gamida_hebrew_scribe: JSON.stringify({ cls: "mago", lvl: 3, done: { kelley_03: true } }) },
      });
      await page.waitForSelector("#gamida-backup-reminder", { timeout: 8000 });
      const [download] = await Promise.all([page.waitForEvent("download"), page.click("#gamida-backup-reminder button")]);
      assert.match(download.suggestedFilename(), /^gamida-perfil-ana\.json$/);
      await page.waitForSelector("#gamida-backup-reminder", { state: "detached" });
      assert.ok(await page.evaluate(() => ProfilesModule.getActiveProfile().backupAt > 0), "a data da cópia não foi guardada");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Sincronização com o Google desligada: sem cartão, sem botão e sem pedidos",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base }, { storage: { gamida_google_client_id: "123-abc.apps.googleusercontent.com" } });
      await page.evaluate(() => switchTab("profile"));
      assert.equal(await page.$("#cloud-card"), null);
      assert.equal(await page.$("#cloud-signin"), null);
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Nuvem (modo de teste): sobe o perfil e outro aparelho recebe; com progresso dos dois lados, pergunta",
    async fn({ browser, base, assert }) {
      const drive = { file: null, uploads: 0 };
      // Aparelho 1, já com estudo
      const one = await openApp({ browser, base }, { routes: fakeGoogle(drive, "A"), storage: { ...PREVIEW, gamida_daily_goal: "42", gamida_greek_stone_rain: JSON.stringify({ best: 321 }) } });
      await one.page.evaluate(() => switchTab("profile"));
      await Promise.all([one.context.waitForEvent("page"), one.page.click("#cloud-signin")]);
      await one.page.waitForFunction(() => /Salvo no seu Google Drive/.test((document.getElementById("cloud-status") || {}).textContent || ""), null, { timeout: 15000 });
      const up = JSON.parse(drive.file);
      assert.equal(up.format, "gamida-profile");
      assert.equal(up.data.gamida_daily_goal, "42");
      assert.ok(!Object.keys(up.data).some((k) => /_chapters$/.test(k)), "o material de estudo foi para a nuvem");
      // Aparelho 2, novo: recebe sem perguntar
      const two = await openApp({ browser, base }, { routes: fakeGoogle(drive, "B"), storage: PREVIEW });
      await two.page.evaluate(() => switchTab("profile"));
      await Promise.all([two.context.waitForEvent("page"), two.page.click("#cloud-signin")]);
      await two.page.waitForFunction(() => localStorage.getItem("gamida_daily_goal") === "42", null, { timeout: 15000 });
      // Aparelho 3, com progresso próprio: pergunta qual manter
      const three = await openApp({ browser, base }, { routes: fakeGoogle(drive, "C"), storage: { ...PREVIEW, gamida_hebrew_scribe: JSON.stringify({ cls: "mago", lvl: 3, done: { kelley_03: true } }) } });
      await three.page.evaluate(() => switchTab("profile"));
      await Promise.all([three.context.waitForEvent("page"), three.page.click("#cloud-signin")]);
      await three.page.waitForSelector(".cloud-dialog", { timeout: 15000 });
      const uploads = drive.uploads;
      await three.page.click('[data-choice="download"]');
      await three.page.waitForFunction(() => localStorage.getItem("gamida_daily_goal") === "42", null, { timeout: 15000 });
      assert.ok(await three.page.evaluate(() => !!ProfilesModule.readBackup()), "a cópia do aparelho 3 não foi guardada");
      assert.equal(drive.uploads, uploads, "a escolha pela nuvem não podia sobrescrever a nuvem");
      const errors = [...one.errors, ...two.errors, ...three.errors];
      assert.deepEqual(errors, [], errors.join(" | "));
      await Promise.all([one.context.close(), two.context.close(), three.context.close()]);
    },
  },
  {
    name: "Login com Google no aplicativo instalado: vai na própria tela, volta, liga o perfil e cria um único arquivo no Drive (Google simulado)",
    async fn({ browser, base, assert }) {
      let authUrl = null;
      let uploads = 0;
      let lastUpload = "";
      const routes = async (route, url) => {
        if (url.hostname === "accounts.google.com") {
          authUrl = url.href;
          await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Google</p>" });
          return true;
        }
        if (url.hostname !== "www.googleapis.com") return false;
        if (url.pathname === "/oauth2/v3/userinfo") await route.fulfill({ json: { sub: "42", email: "aluno@exemplo.com", name: "Aluno" } });
        else if (url.pathname.startsWith("/upload/drive/v3/files")) {
          uploads++;
          lastUpload = route.request().postData() || "";
          await route.fulfill({ json: { id: "arquivo-1" } });
        } else if (url.pathname === "/drive/v3/files") await route.fulfill({ json: { files: [] } });
        else await route.fulfill({ status: 404, body: "" });
        return true;
      };
      const storage = { gamida_google_preview: "1", gamida_google_client_id: "123-teste.apps.googleusercontent.com" };
      const { context, page, errors } = await openApp({ browser, base }, { viewport: { width: 390, height: 844 }, storage, routes });
      // Aberto como aplicativo instalado
      await page.evaluate(() => {
        const orig = window.matchMedia.bind(window);
        window.matchMedia = (q) => (/display-mode: standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : orig(q));
        switchTab("profile");
      });
      await page.click("#cloud-signin");
      await page.waitForURL(/accounts\.google\.com/);
      const auth = new URL(authUrl);
      assert.equal(auth.searchParams.get("prompt"), "select_account", "o primeiro login escolhe a conta");
      assert.match(auth.searchParams.get("redirect_uri"), /\/oauth-callback\.html$/);
      assert.equal(auth.searchParams.get("scope"), "openid email profile https://www.googleapis.com/auth/drive.appdata");
      // O Google devolve para a página de retorno, que volta ao app
      await page.goto(`${base}/oauth-callback.html#access_token=tok&expires_in=3599&token_type=Bearer&state=${encodeURIComponent(auth.searchParams.get("state"))}`);
      await page.waitForURL(`${base}/index.html`);
      await page.waitForFunction(() => { const p = ProfilesModule.getActiveProfile(); return p.google && p.driveFileId === "arquivo-1"; }, null, { timeout: 15000 });
      assert.ok(!(await page.evaluate(() => location.hash)), "o token ficou no endereço");
      assert.equal(uploads, 1, "o arquivo do Drive foi criado mais de uma vez");
      assert.match(lastUpload, /"parents":\["appDataFolder"\]/, "o arquivo não foi para a pasta oculta do app");
      // Reconectar: direto, sem escolher a conta de novo
      await page.evaluate(() => {
        // A página recarregou na volta: continua como aplicativo instalado
        const orig = window.matchMedia.bind(window);
        window.matchMedia = (q) => (/display-mode: standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : orig(q));
        localStorage.removeItem("gamida_google_token");
        switchTab("profile");
        CloudSync.refreshCard();
      });
      await page.click("#cloud-signin");
      await page.waitForURL(/accounts\.google\.com/);
      const again = new URL(authUrl);
      assert.equal(again.searchParams.get("prompt"), null);
      assert.equal(again.searchParams.get("login_hint"), "aluno@exemplo.com");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
  {
    name: "Nuvem: manter a deste aparelho guarda a versão do Drive (dá para desfazer) e sessão expirada avisa",
    async fn({ browser, base, assert }) {
      const drive = { file: null, uploads: 0 };
      // Aparelho 1 sobe a meta 42
      const one = await openApp({ browser, base }, { routes: fakeGoogle(drive, "A"), storage: { ...PREVIEW, gamida_daily_goal: "42", gamida_greek_stone_rain: JSON.stringify({ best: 321 }) } });
      await one.page.evaluate(() => switchTab("profile"));
      await Promise.all([one.context.waitForEvent("page"), one.page.click("#cloud-signin")]);
      await one.page.waitForFunction(() => /Salvo no seu Google Drive/.test((document.getElementById("cloud-status") || {}).textContent || ""), null, { timeout: 15000 });
      // Aparelho 2, com progresso próprio, escolhe manter o dele
      const two = await openApp({ browser, base }, { routes: fakeGoogle(drive, "B"), storage: { ...PREVIEW, gamida_daily_goal: "7", gamida_hebrew_scribe: JSON.stringify({ cls: "mago", lvl: 3 }) } });
      const { page } = two;
      await page.evaluate(() => switchTab("profile"));
      await Promise.all([two.context.waitForEvent("page"), page.click("#cloud-signin")]);
      await page.waitForSelector(".cloud-dialog", { timeout: 15000 });
      await page.click('[data-choice="upload"]');
      await page.waitForFunction(() => /Salvo no seu Google Drive/.test((document.getElementById("cloud-status") || {}).textContent || ""), null, { timeout: 15000 });
      assert.equal(JSON.parse(drive.file).data.gamida_daily_goal, "7", "a versão deste aparelho não subiu");
      const backup = await page.evaluate(() => ProfilesModule.readBackup());
      assert.ok(backup && backup.reason === "drive", "a versão do Drive não ficou guardada antes de ser substituída");
      assert.equal(backup.data.gamida_daily_goal, "42");
      await page.evaluate(() => { switchTab("manage"); switchTab("profile"); });
      assert.match(await page.textContent("#tab-profile"), /versão que estava no Google Drive/);
      // Desfazer: volta à versão do Drive
      await Promise.all([page.waitForNavigation(), page.click("#profile-undo")]);
      await page.waitForFunction(() => window.ProfilesModule);
      assert.equal(await page.evaluate(() => localStorage.getItem("gamida_daily_goal")), "42", "desfazer não trouxe a versão do Drive");
      // Sessão do Google expirada com progresso sem cópia: aviso ao abrir
      await page.evaluate(() => {
        localStorage.removeItem("gamida_google_token");
        const p = ProfilesModule.getActiveProfile();
        ProfilesModule.updateProfile(p.id, { updatedAt: (p.syncedAt || 0) + 5000 });
      });
      await page.reload();
      await page.waitForSelector("#cloud-reconnect", { timeout: 10000 });
      assert.match(await page.textContent("#cloud-reconnect"), /não está sendo salvo no Google Drive/);
      assert.ok(await page.isVisible("#cloud-reconnect-go"));
      // "Agora não" some nesta sessão, mesmo recarregando
      await page.click("#cloud-reconnect-later");
      assert.ok(!(await page.isVisible("#cloud-reconnect")));
      await page.reload();
      await page.waitForTimeout(2000);
      assert.ok(!(await page.isVisible("#cloud-reconnect")), "o aviso voltou depois de \"Agora não\"");
      const errors = [...one.errors, ...two.errors];
      assert.deepEqual(errors, [], errors.join(" | "));
      await Promise.all([one.context.close(), two.context.close()]);
    },
  },
  {
    name: "Login com Google desligado: nenhum aviso de reconectar, mesmo com perfil ligado e sem sessão",
    async fn({ browser, base, assert }) {
      const { context, page, errors } = await openApp({ browser, base });
      await page.evaluate(() => {
        const p = ProfilesModule.getActiveProfile();
        ProfilesModule.updateProfile(p.id, { google: { sub: "1", email: "a@b.c", name: "A" }, updatedAt: Date.now(), syncedAt: 1 });
      });
      await page.reload();
      await page.waitForTimeout(2000);
      assert.ok(!(await page.$("#cloud-reconnect")), "aviso apareceu com o login desligado");
      assert.deepEqual(errors, [], errors.join(" | "));
      await context.close();
    },
  },
];
