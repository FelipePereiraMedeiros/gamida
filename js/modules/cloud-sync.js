/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Perfil na nuvem (Google Drive do próprio aluno)
 * ==========================================================================
 * Entrar com a conta Google e guardar o ARQUIVO DE PERFIL (progresso e
 * configurações, nada do material de estudo) na pasta oculta de dados de
 * aplicativo do Google Drive do aluno ("appDataFolder"). Ninguém além do
 * Gamida, naquela conta, enxerga essa pasta; o app não vê os outros arquivos
 * do Drive. Não há servidor do Gamida no meio: o navegador fala direto com o
 * Google.
 *
 * Sem bibliotecas externas: o login usa o fluxo OAuth 2.0 para aplicativos de
 * navegador (janela do Google que devolve um token de acesso para
 * oauth-callback.html), e o Drive é usado pela API REST com fetch.
 *
 * Para funcionar, o dono do Gamida precisa criar um "ID do cliente OAuth"
 * (tipo Aplicativo da Web) no Google Cloud e colocá-lo em GOOGLE_CLIENT_ID.
 * Passo a passo em docs/login-google.md.
 */

(function () {
/**
 * Chave geral da sincronização com o Google. DESLIGADA enquanto o login não é
 * ativado de vez (ID do cliente, tela de consentimento publicada): com ela em
 * false, nada deste módulo roda, o cartão da nuvem não aparece e nenhum pedido
 * vai ao Google. Para testar num navegador só, sem afetar ninguém:
 *   localStorage.setItem("gamida_google_preview", "1")
 */
const CLOUD_SYNC_ENABLED = false;
const PREVIEW_KEY = "gamida_google_preview";

/** ID do cliente OAuth do Gamida (público por natureza; não é segredo) */
const GOOGLE_CLIENT_ID = "";

const SCOPES = "openid email profile https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "gamida-perfil.json";
const TOKEN_KEY = "gamida_google_token";
const CLIENT_KEY = "gamida_google_client_id";
const STATE_KEY = "gamida_google_oauth_state";
const RESULT_KEY = "gamida_google_oauth_result";
const AUTOSAVE_MS = 20000;

const Profiles = () => (typeof window !== "undefined" ? window.ProfilesModule : null) || (typeof require !== "undefined" ? require("./profiles.js") : null);

let fetchImpl = (...args) => fetch(...args);
let status = { busy: false, text: "", tone: "" };
let autosaveTimer = 0;

function _setFetch(fn) {
  fetchImpl = fn;
}

function store() {
  return typeof localStorage !== "undefined" ? localStorage : null;
}

/** ID do cliente: o do código, ou um informado neste aparelho (útil para testar antes de publicar) */
function clientId() {
  const st = store();
  const local = st ? (st.getItem(CLIENT_KEY) || "").trim() : "";
  return local || GOOGLE_CLIENT_ID;
}

/** A sincronização está ligada (no código ou, para teste, neste navegador)? */
function isEnabled() {
  if (CLOUD_SYNC_ENABLED) return true;
  try {
    const st = store();
    return !!st && st.getItem(PREVIEW_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function isConfigured() {
  return isEnabled() && /\.apps\.googleusercontent\.com$/.test(clientId());
}

function redirectUri() {
  if (typeof location === "undefined") return "";
  return new URL("oauth-callback.html", location.href).href.split("#")[0].split("?")[0];
}

/** Endereço da tela de login do Google */
function buildAuthUrl(state, { prompt = "select_account", loginHint = "" } = {}) {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "token",
    scope: SCOPES,
    include_granted_scopes: "true",
    state,
    prompt,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Lê a resposta do Google (o que vem depois do # no endereço de retorno) */
function parseAuthResponse(hash) {
  const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  if (params.get("error")) return { error: params.get("error") };
  const token = params.get("access_token");
  const expiresIn = parseInt(params.get("expires_in") || "0", 10);
  if (!token) return { error: "sem_token" };
  return { token, expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600, state: params.get("state") || "" };
}

/* ---------------- token ---------------- */

function saveToken(token, expiresIn) {
  const st = store();
  if (st) st.setItem(TOKEN_KEY, JSON.stringify({ token, exp: Date.now() + (expiresIn - 60) * 1000 }));
}

function currentToken() {
  const st = store();
  if (!st) return null;
  try {
    const saved = JSON.parse(st.getItem(TOKEN_KEY) || "null");
    if (saved && saved.token && saved.exp > Date.now()) return saved.token;
  } catch (_) {}
  return null;
}

function forgetToken() {
  const st = store();
  if (st) st.removeItem(TOKEN_KEY);
}

/* ---------------- login ---------------- */

function randomState() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Resposta do Google deixada por oauth-callback.html (vale por 10 minutos) */
function takeStoredResult() {
  const st = store();
  if (!st) return null;
  let saved = null;
  try {
    saved = JSON.parse(st.getItem(RESULT_KEY) || "null");
  } catch (_) {}
  if (!saved || typeof saved.hash !== "string") return null;
  st.removeItem(RESULT_KEY);
  return Date.now() - (saved.at || 0) < 10 * 60 * 1000 ? saved.hash : null;
}

/**
 * Abre a janela do Google. Se o navegador bloquear a janela, vai para a página
 * do Google na própria aba e volta depois. O final do "state" diz qual dos dois
 * caminhos foi usado (.p janela, .r página inteira) para oauth-callback.html.
 */
function signIn() {
  if (!isConfigured()) {
    setStatus("O login com Google ainda não foi configurado neste Gamida.", "bad");
    return Promise.resolve(false);
  }
  const base = randomState();
  const profile = Profiles().getActiveProfile();
  const hint = profile.google ? profile.google.email : "";
  const w = 480;
  const h = 640;
  const left = Math.max(0, (window.screenX || 0) + ((window.outerWidth || w) - w) / 2);
  const top = Math.max(0, (window.screenY || 0) + ((window.outerHeight || h) - h) / 2);
  const popup = window.open("", "gamida-google", `width=${w},height=${h},left=${left},top=${top}`);
  if (!popup) {
    const state = `${base}.r`;
    sessionStorage.setItem(STATE_KEY, state);
    window.location.assign(buildAuthUrl(state, { loginHint: hint }));
    return Promise.resolve(false);
  }
  const state = `${base}.p`;
  sessionStorage.setItem(STATE_KEY, state);
  popup.location.href = buildAuthUrl(state, { loginHint: hint });
  setStatus("Continue na janela do Google…", "");
  return new Promise((resolve) => {
    let done = false;
    const finish = (hash) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
      clearTimeout(giveUp);
      resolve(hash ? finishSignIn(hash) : false);
    };
    // A janela do Google pode cortar a ligação com esta aba; por isso a resposta
    // chega por mensagem ou pelo armazenamento, o que vier primeiro
    const onMessage = (event) => {
      if (event.origin === window.location.origin && event.data && event.data.type === "gamida-oauth") {
        takeStoredResult();
        finish(event.data.hash);
      }
    };
    const onStorage = (event) => {
      if (event.key === RESULT_KEY && event.newValue) finish(takeStoredResult());
    };
    const poll = setInterval(() => {
      const hash = takeStoredResult();
      if (hash) finish(hash);
    }, 1000);
    const giveUp = setTimeout(() => {
      setStatus("O login não foi concluído. Tente de novo.", "");
      finish(null);
    }, 5 * 60 * 1000);
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
  });
}

/** Termina o login: confere o state, guarda o token, liga o perfil à conta e sincroniza */
async function finishSignIn(hash) {
  const res = parseAuthResponse(hash);
  const expected = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (res.error) {
    setStatus(res.error === "access_denied" ? "Você não autorizou o acesso." : `O Google recusou o login (${res.error}).`, "bad");
    return false;
  }
  if (!expected || res.state !== expected) {
    setStatus("Resposta de login inválida. Tente de novo.", "bad");
    return false;
  }
  saveToken(res.token, res.expiresIn);
  try {
    const user = await api("https://www.googleapis.com/oauth2/v3/userinfo");
    const linked = await linkProfile({ sub: user.sub, email: user.email || "", name: user.name || "" });
    if (!linked) return false;
    await sync({ interactive: true });
    return true;
  } catch (err) {
    setStatus(`Não foi possível entrar: ${err.message}`, "bad");
    return false;
  }
}

/** Volta do login em página inteira (quando a janela foi bloqueada) */
function resumeRedirectSignIn() {
  if (typeof sessionStorage === "undefined") return;
  const expected = sessionStorage.getItem(STATE_KEY) || "";
  if (!expected.endsWith(".r")) return;
  const hash = takeStoredResult();
  if (hash) {
    finishSignIn(hash).then(() => {
      if (typeof window.switchTab === "function") window.switchTab("profile");
    });
  }
}

/**
 * Cada conta Google fica ligada a um perfil. Se a conta já é de outro perfil deste
 * aparelho, troca para ele; se o perfil atual é de outra conta, cria um perfil novo.
 */
async function linkProfile(google) {
  const P = Profiles();
  const active = P.getActiveProfile();
  const owner = P.listProfiles().find((p) => p.google && p.google.sub === google.sub);
  if (owner && owner.id !== active.id) {
    setStatus(`Abrindo o perfil de ${google.email}…`, "");
    P.switchProfile(owner.id);
    return false;
  }
  if (!owner && active.google && active.google.sub !== google.sub) {
    P.createProfile(google.name || google.email, { google });
    return false;
  }
  P.updateProfile(active.id, { google });
  return true;
}

function signOut({ unlink = false } = {}) {
  const token = currentToken();
  forgetToken();
  if (token) fetchImpl(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => {});
  if (unlink) {
    const P = Profiles();
    const active = P.getActiveProfile();
    P.updateProfile(active.id, { google: null, driveFileId: null, syncedAt: 0 });
  }
  setStatus(unlink ? "Conta desligada deste perfil. O arquivo no Drive continua lá." : "Você saiu da conta Google.", "");
  refreshCard();
}

/* ---------------- Drive ---------------- */

async function api(url, options = {}) {
  const token = currentToken();
  if (!token) throw new Error("sessão do Google expirada");
  const res = await fetchImpl(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    forgetToken();
    throw new Error("sessão do Google expirada");
  }
  if (!res.ok) throw new Error(`Google respondeu ${res.status}`);
  const type = (res.headers && res.headers.get && res.headers.get("content-type")) || "";
  return type.includes("json") ? res.json() : res.text();
}

async function findRemoteFile() {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const list = await api(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
  return list && list.files && list.files.length ? list.files[0] : null;
}

async function downloadRemote(id) {
  const body = await api(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`);
  return typeof body === "string" ? JSON.parse(body) : body;
}

async function uploadRemote(file, id) {
  const json = JSON.stringify(file);
  if (id) {
    await api(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(id)}?uploadType=media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    return id;
  }
  const boundary = `gamida${randomState()}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"], mimeType: "application/json" }),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    json,
    `--${boundary}--`,
  ].join("\r\n");
  const created = await api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  return created.id;
}

/**
 * O que fazer ao comparar este aparelho com a nuvem
 * @param {{updatedAt:number, syncedAt:number, hasData:boolean}} local
 * @param {{updatedAt:number}|null} remote
 * @returns {"upload"|"download"|"conflict"|"none"}
 */
function decide(local, remote) {
  if (!remote) return local.hasData || local.updatedAt ? "upload" : "none";
  const remoteChanged = remote.updatedAt > (local.syncedAt || 0);
  const localChanged = (local.updatedAt || 0) > (local.syncedAt || 0);
  if (!local.syncedAt) {
    // Primeira vez neste aparelho: com o perfil vazio, a nuvem vale; com dados dos dois lados, o aluno escolhe
    if (!local.hasData) return "download";
    return remote.updatedAt === local.updatedAt ? "none" : "conflict";
  }
  if (remoteChanged && localChanged) return "conflict";
  if (remoteChanged) return "download";
  if (localChanged) return "upload";
  return "none";
}

let syncing = null;
/** Sincroniza o perfil ativo com o arquivo no Drive */
function sync({ interactive = false } = {}) {
  if (!isEnabled()) return Promise.resolve("none");
  if (syncing) return syncing;
  syncing = doSync(interactive).finally(() => {
    syncing = null;
    refreshCard();
  });
  return syncing;
}

async function doSync(interactive) {
  const P = Profiles();
  if (P.detectChanges) P.detectChanges();
  P.flushChangeMark();
  let profile = P.getActiveProfile();
  if (!profile.google || !currentToken()) return "none";
  setStatus("Sincronizando…", "", true);
  try {
    const meta = profile.driveFileId ? { id: profile.driveFileId } : await findRemoteFile();
    let remote = null;
    if (meta) {
      try {
        remote = await downloadRemote(meta.id);
      } catch (err) {
        if (!/404/.test(err.message)) throw err;
      }
    }
    if (remote && P.validateProfileFile(remote)) remote = null;
    const hasData = P.hasProgress();
    let action = decide({ updatedAt: profile.updatedAt, syncedAt: profile.syncedAt, hasData }, remote ? { updatedAt: remote.updatedAt || 0 } : null);
    if (action === "conflict") {
      action = interactive ? await askConflict(profile, remote) : "none";
      if (action === "none") {
        setStatus("Há mudanças aqui e na nuvem. Abra o Perfil para escolher qual manter.", "bad");
        return "conflict";
      }
    }
    if (action === "download") {
      setStatus("Perfil trazido da nuvem. Recarregando…", "ok");
      P.applyProfileFile(remote, { reload: false, keepName: true });
      P.updateProfile(profile.id, { driveFileId: meta.id, syncedAt: remote.updatedAt, updatedAt: remote.updatedAt });
      if (typeof location !== "undefined" && typeof location.reload === "function") setTimeout(() => location.reload(), 600);
      return "download";
    }
    if (action === "upload") {
      const file = P.buildProfileFile(P.getActiveProfile());
      const id = await uploadRemote(file, meta ? meta.id : null);
      profile = P.updateProfile(profile.id, { driveFileId: id, syncedAt: file.updatedAt, updatedAt: file.updatedAt });
      setStatus(`Salvo no seu Google Drive às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`, "ok");
      return "upload";
    }
    if (meta && meta.id !== profile.driveFileId) P.updateProfile(profile.id, { driveFileId: meta.id });
    setStatus("Tudo em dia com a nuvem.", "ok");
    return "none";
  } catch (err) {
    if (/404/.test(err.message)) P.updateProfile(profile.id, { driveFileId: null });
    setStatus(`Não foi possível sincronizar: ${err.message}.`, "bad");
    return "error";
  }
}

/**
 * Este aparelho e a nuvem mudaram: o aluno escolhe qual manter.
 * Fechar a janela não escolhe nada (nada é apagado).
 */
function askConflict(profile, remote) {
  const when = (ms) => (ms ? new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "?");
  const P = Profiles();
  if (typeof document === "undefined") return Promise.resolve("none");
  return new Promise((resolve) => {
    const box = document.createElement("div");
    box.className = "cloud-dialog";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "cloud-dialog-title");
    box.innerHTML = `<div class="cloud-dialog__card">
      <h3 id="cloud-dialog-title">Qual progresso manter?</h3>
      <p>Este aparelho e o seu Google Drive têm versões diferentes de <b>${esc(profile.name)}</b>.</p>
      <ul>
        <li><b>Neste aparelho:</b> alterado em ${esc(when(profile.updatedAt))}${P.hasProgress() ? "" : " (sem progresso)"}</li>
        <li><b>No Google Drive:</b> alterado em ${esc(when(remote.updatedAt))}${P.hasProgress(remote.data) ? "" : " (sem progresso)"}</li>
      </ul>
      <p class="cloud-dialog__hint">A versão que não for escolhida é substituída. Se escolher a da nuvem, uma cópia deste aparelho fica guardada na tela do Perfil.</p>
      <div class="cloud-dialog__actions">
        <button type="button" class="btn-secondary" data-choice="download">Usar a do Google Drive</button>
        <button type="button" class="btn-secondary" data-choice="upload">Manter a deste aparelho</button>
        <button type="button" class="btn-danger" data-choice="none">Decidir depois</button>
      </div>
    </div>`;
    const close = (choice) => {
      document.removeEventListener("keydown", onKey);
      box.remove();
      resolve(choice);
    };
    const onKey = (e) => {
      if (e.key === "Escape") close("none");
    };
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-choice]");
      if (btn) close(btn.dataset.choice);
      else if (e.target === box) close("none");
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
    const first = box.querySelector("[data-choice]");
    if (first) first.focus();
  });
}

/* ---------------- gravação automática ---------------- */

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  const P = Profiles();
  if (!P || !currentToken() || !P.getActiveProfile().google) return;
  autosaveTimer = setTimeout(() => sync(), AUTOSAVE_MS);
}

function startAutoSync() {
  if (typeof window === "undefined" || !isEnabled()) return;
  window.addEventListener("gamida:profile-changed", scheduleAutosave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = 0;
      sync();
    }
  });
  resumeRedirectSignIn();
  // Ao abrir o app com a sessão ainda válida, confere se há algo novo na nuvem
  if (currentToken()) setTimeout(() => sync(), 1500);
}

/* ---------------- cartão na tela do perfil ---------------- */

function setStatus(text, tone, busy = false) {
  status = { text, tone, busy };
  const node = typeof document !== "undefined" ? document.getElementById("cloud-status") : null;
  if (node) {
    node.textContent = text;
    node.className = `profile-note${tone === "ok" ? " is-ok" : tone === "bad" ? " is-bad" : ""}`;
  }
}

const esc = (text) => ((typeof window !== "undefined" && window.GamidaHTML) || require("./html.js")).escapeHTML(text);

function renderCard(profile) {
  const connected = !!currentToken();
  const when = profile.syncedAt ? new Date(profile.syncedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "nunca";
  let body;
  if (!isConfigured()) {
    body = `<p class="profile-note">O login com Google ainda não foi ativado neste Gamida. Enquanto isso, leve o perfil entre aparelhos pelo arquivo de perfil.</p>`;
  } else if (!profile.google) {
    body = `<p class="profile-note">Entre com sua conta Google para guardar este perfil no seu próprio Google Drive e continuar de onde parou em qualquer aparelho.</p>
      <button type="button" class="btn-google" id="cloud-signin"><svg class="btn-google__g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Entrar com Google</button>`;
  } else if (!connected) {
    body = `<p class="profile-note">Ligado a <b>${esc(profile.google.email)}</b>. Última sincronização: ${esc(when)}. Entre de novo para sincronizar.</p>
      <div class="flex flex-wrap gap-2"><button type="button" class="btn-google" id="cloud-signin"><svg class="btn-google__g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Reconectar</button>
      <button type="button" class="btn-danger" id="cloud-unlink">Desligar a conta</button></div>`;
  } else {
    body = `<p class="profile-note">Conectado como <b>${esc(profile.google.email)}</b>. Última sincronização: ${esc(when)}. As mudanças são salvas sozinhas.</p>
      <div class="flex flex-wrap gap-2"><button type="button" class="btn-secondary" id="cloud-sync">Sincronizar agora</button>
      <button type="button" class="btn-secondary" id="cloud-signout">Sair</button>
      <button type="button" class="btn-danger" id="cloud-unlink">Desligar a conta</button></div>`;
  }
  return `<h3 class="profile-card__title">Nuvem · Google Drive</h3>${body}
    <p class="${status.tone === "ok" ? "profile-note is-ok" : status.tone === "bad" ? "profile-note is-bad" : "profile-note"}" id="cloud-status" role="status">${esc(status.text)}</p>
    <p class="profile-note profile-note--small">Só o arquivo de perfil (${FILE_NAME}) vai para a pasta privada de dados de aplicativo do seu Drive. O Gamida não vê os outros arquivos do Drive, e o material de estudo não é enviado.</p>`;
}

function bindCard() {
  if (typeof document === "undefined") return;
  const on = (id, fn) => {
    const node = document.getElementById(id);
    if (node) node.onclick = fn;
  };
  on("cloud-signin", () => signIn().then(() => refreshCard()));
  on("cloud-sync", () => sync({ interactive: true }));
  on("cloud-signout", () => signOut());
  on("cloud-unlink", () => {
    if (confirm("Desligar a conta Google deste perfil? O progresso continua neste aparelho e o arquivo no Drive não é apagado.")) signOut({ unlink: true });
  });
}

function refreshCard() {
  if (typeof document === "undefined") return;
  const card = document.getElementById("cloud-card");
  const P = Profiles();
  if (!card || !P) return;
  card.innerHTML = renderCard(P.getActiveProfile());
  bindCard();
}

const CloudSync = {
  CLOUD_SYNC_ENABLED,
  isEnabled,
  GOOGLE_CLIENT_ID,
  SCOPES,
  FILE_NAME,
  isConfigured,
  clientId,
  redirectUri,
  buildAuthUrl,
  parseAuthResponse,
  decide,
  signIn,
  finishSignIn,
  signOut,
  sync,
  currentToken,
  saveToken,
  linkProfile,
  renderCard,
  bindCard,
  refreshCard,
  startAutoSync,
  _setFetch,
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.CloudSync = CloudSync;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAutoSync);
  else startAutoSync();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = CloudSync;
}
})();
