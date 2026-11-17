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
];
