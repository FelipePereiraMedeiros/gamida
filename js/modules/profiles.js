/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Perfis
 * ==========================================================================
 * Um perfil reúne tudo o que é do aluno: progresso de todos os modos e práticas
 * (repetição espaçada, domínio, recordes, trilha, Chuva de Pedras, Crônicas do
 * Escriba, dias de estudo) e todas as configurações (idioma, meta diária, modo de
 * resposta, som, ordem e seleção de capítulos...).
 *
 * O material de estudo (capítulos) e a versão dos dados NÃO fazem parte do perfil:
 * são o banco de dados do sistema, iguais para todos os perfis do aparelho.
 *
 * Como funciona: o perfil ativo usa as chaves "gamida_*" de sempre no armazenamento
 * do navegador, então nenhum módulo precisa saber de perfis. Ao trocar de perfil, as
 * chaves do perfil atual são guardadas num pacote e as do outro perfil são restauradas.
 * O arquivo de perfil (exportar, importar, nuvem) é esse mesmo pacote em JSON.
 */

(function () {
const REGISTRY_KEY = "gamida_profiles";
const STORE_PREFIX = "gamida_profile_store_";
const FILE_FORMAT = "gamida-profile";
const FILE_FORMAT_VERSION = 1;

/** Chaves que são do sistema, não do aluno */
const SYSTEM_KEYS = [
  /^gamida_profiles$/,
  /^gamida_profile_store_/,
  /^gamida_profile_backup$/,
  /^gamida_google_/,
  /_chapters$/,
  /^gamida_data_version_/,
  /^gamida_db/,
];

const COLORS = ["#e2683c", "#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444"];

/** A chave pertence ao perfil (progresso ou configuração do aluno)? */
function isProfileKey(key) {
  return typeof key === "string" && key.startsWith("gamida_") && !SYSTEM_KEYS.some((re) => re.test(key));
}

/* ---------------- acesso ao armazenamento (sem passar pela marcação de mudança) ---------------- */

let storage = typeof localStorage !== "undefined" ? localStorage : null;
let rawSet = storage ? storage.setItem.bind(storage) : null;
let rawRemove = storage ? storage.removeItem.bind(storage) : null;
let suppress = 0;
let reloadPage = () => {
  if (typeof location !== "undefined") location.reload();
};

/** Para testes: usa outro armazenamento e outra forma de recarregar */
function _setEnvironment({ storage: st, reload } = {}) {
  if (st) {
    storage = st;
    rawSet = st.setItem.bind(st);
    rawRemove = st.removeItem.bind(st);
  }
  if (reload) reloadPage = reload;
}

function keysOf(st) {
  const keys = [];
  for (let i = 0; i < st.length; i++) keys.push(st.key(i));
  return keys;
}

function now() {
  return Date.now();
}

function makeId() {
  return `p_${now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------------- registro de perfis ---------------- */

function sanitizeProfile(p, index) {
  if (!p || typeof p !== "object" || typeof p.id !== "string" || !/^p_[a-z0-9_]+$/i.test(p.id)) return null;
  return {
    id: p.id,
    name: String(p.name || "Perfil").slice(0, 40) || "Perfil",
    color: COLORS.includes(p.color) ? p.color : COLORS[index % COLORS.length],
    createdAt: Number.isFinite(p.createdAt) ? p.createdAt : now(),
    updatedAt: Number.isFinite(p.updatedAt) ? p.updatedAt : 0,
    syncedAt: Number.isFinite(p.syncedAt) ? p.syncedAt : 0,
    google: p.google && typeof p.google.sub === "string"
      ? { sub: p.google.sub, email: String(p.google.email || ""), name: String(p.google.name || "") }
      : null,
    driveFileId: typeof p.driveFileId === "string" ? p.driveFileId : null,
  };
}

/** Lê o registro; na primeira vez cria o perfil que já existia no aparelho (sem perder nada) */
function loadRegistry() {
  let reg = null;
  try {
    reg = storage ? JSON.parse(storage.getItem(REGISTRY_KEY) || "null") : null;
  } catch (_) {
    reg = null;
  }
  const profiles = reg && Array.isArray(reg.profiles) ? reg.profiles.map(sanitizeProfile).filter(Boolean) : [];
  if (!profiles.length) {
    const first = { id: makeId(), name: "Meu perfil", color: COLORS[0], createdAt: now(), updatedAt: hasAnyData() ? now() : 0, syncedAt: 0, google: null, driveFileId: null };
    const fresh = { version: 1, active: first.id, profiles: [first] };
    saveRegistry(fresh);
    return fresh;
  }
  const active = profiles.some((p) => p.id === reg.active) ? reg.active : profiles[0].id;
  return { version: 1, active, profiles };
}

function saveRegistry(reg) {
  if (!storage) return;
  try {
    rawSet(REGISTRY_KEY, JSON.stringify(reg));
  } catch (err) {
    console.warn("Aviso ao salvar os perfis:", err);
  }
}

function hasAnyData() {
  return !!storage && keysOf(storage).some(isProfileKey);
}

function getActiveProfile() {
  const reg = loadRegistry();
  return reg.profiles.find((p) => p.id === reg.active);
}

function listProfiles() {
  const reg = loadRegistry();
  return reg.profiles.map((p) => ({ ...p, active: p.id === reg.active }));
}

/** Atualiza campos do perfil (nome, vínculo com o Google, datas de sincronização) */
function updateProfile(id, fields) {
  const reg = loadRegistry();
  const profile = reg.profiles.find((p) => p.id === id);
  if (!profile) return null;
  Object.assign(profile, fields);
  reg.profiles = reg.profiles.map(sanitizeProfile).filter(Boolean);
  saveRegistry(reg);
  return reg.profiles.find((p) => p.id === id);
}

/* ---------------- pacote de dados do perfil ---------------- */

/** Todas as chaves do perfil ativo, com o valor guardado */
function snapshot() {
  const data = {};
  if (!storage) return data;
  keysOf(storage).filter(isProfileKey).sort().forEach((key) => {
    data[key] = storage.getItem(key);
  });
  return data;
}

/** Chaves que são progresso de verdade (as de configuração o app grava sozinho ao abrir) */
const PROGRESS_KEY = /^gamida_(hebrew|greek)_(srs|mastery|survival_high|mastery_path|stone_rain|scribe)$|^gamida_activity$/;

/** O perfil ativo (ou um pacote) tem algum progresso? */
function hasProgress(data = snapshot()) {
  return Object.keys(data || {}).some((key) => PROGRESS_KEY.test(key) && data[key] && data[key] !== "{}" && data[key] !== "0");
}

const BACKUP_KEY = "gamida_profile_backup";

/** Cópia do perfil antes de ele ser substituído por um arquivo ou pela nuvem */
function saveBackup(reason) {
  const profile = getActiveProfile();
  try {
    rawSet(BACKUP_KEY, JSON.stringify({ profileId: profile.id, at: now(), reason, data: snapshot(), updatedAt: profile.updatedAt }));
  } catch (err) {
    console.warn("Aviso ao guardar a cópia do perfil:", err);
  }
}

function readBackup() {
  try {
    const b = JSON.parse((storage && storage.getItem(BACKUP_KEY)) || "null");
    return b && b.profileId === getActiveProfile().id && b.data ? b : null;
  } catch (_) {
    return null;
  }
}

/** Volta o perfil ao que era antes da última substituição */
function restoreBackup({ reload = true } = {}) {
  const backup = readBackup();
  if (!backup) return false;
  applySnapshot(backup.data);
  rawRemove(BACKUP_KEY);
  updateProfile(backup.profileId, { updatedAt: now() });
  if (reload) reloadPage();
  return true;
}

/** Troca as chaves do perfil ativo pelas do pacote */
function applySnapshot(data) {
  if (!storage) return;
  suppress++;
  try {
    keysOf(storage).filter(isProfileKey).forEach((key) => rawRemove(key));
    Object.keys(data || {}).forEach((key) => {
      if (isProfileKey(key) && typeof data[key] === "string") rawSet(key, data[key]);
    });
  } finally {
    suppress--;
  }
}

function readStore(id) {
  try {
    return JSON.parse((storage && storage.getItem(STORE_PREFIX + id)) || "null") || {};
  } catch (_) {
    return {};
  }
}

/** Troca de perfil: guarda o atual, restaura o escolhido e recarrega a página */
function switchProfile(id, { reload = true } = {}) {
  const reg = loadRegistry();
  if (!reg.profiles.some((p) => p.id === id)) return false;
  if (reg.active === id) return true;
  rawSet(STORE_PREFIX + reg.active, JSON.stringify(snapshot()));
  applySnapshot(readStore(id));
  rawRemove(STORE_PREFIX + id);
  reg.active = id;
  saveRegistry(reg);
  if (reload) reloadPage();
  return true;
}

/** Cria um perfil vazio e passa para ele */
function createProfile(name, { switchTo = true, reload = true, google = null } = {}) {
  const reg = loadRegistry();
  const profile = sanitizeProfile({
    id: makeId(),
    name: String(name || "").trim() || `Perfil ${reg.profiles.length + 1}`,
    color: COLORS[reg.profiles.length % COLORS.length],
    createdAt: now(),
    google,
  }, reg.profiles.length);
  reg.profiles.push(profile);
  saveRegistry(reg);
  if (switchTo) switchProfile(profile.id, { reload });
  return profile;
}

/** Apaga um perfil que não está em uso (e o pacote dele) */
function deleteProfile(id) {
  const reg = loadRegistry();
  if (id === reg.active || !reg.profiles.some((p) => p.id === id)) return false;
  reg.profiles = reg.profiles.filter((p) => p.id !== id);
  rawRemove(STORE_PREFIX + id);
  saveRegistry(reg);
  return true;
}

function renameProfile(id, name) {
  const clean = String(name || "").trim().slice(0, 40);
  if (!clean) return null;
  return updateProfile(id, { name: clean });
}

/* ---------------- arquivo de perfil ---------------- */

/** Monta o arquivo de perfil (só o perfil: nada do material de estudo) */
function buildProfileFile(profile = getActiveProfile()) {
  return {
    format: FILE_FORMAT,
    formatVersion: FILE_FORMAT_VERSION,
    appVersion: typeof window !== "undefined" && window.APP_VERSION ? window.APP_VERSION : undefined,
    exportedAt: new Date().toISOString(),
    updatedAt: profile.updatedAt || now(),
    profile: { name: profile.name, color: profile.color },
    data: snapshot(),
  };
}

/** Confere se o JSON é um arquivo de perfil válido; devolve o motivo quando não é */
function validateProfileFile(file) {
  if (!file || typeof file !== "object") return "Arquivo vazio ou ilegível.";
  if (file.format !== FILE_FORMAT) return "Este arquivo não é um perfil do Gamida.";
  if (!Number.isFinite(file.formatVersion) || file.formatVersion > FILE_FORMAT_VERSION) return "Arquivo de perfil de uma versão mais nova do Gamida. Atualize o aplicativo.";
  if (!file.data || typeof file.data !== "object") return "O arquivo de perfil não tem dados.";
  const bad = Object.keys(file.data).filter((k) => !isProfileKey(k) || typeof file.data[k] !== "string");
  if (bad.length) return `O arquivo traz dados que não são de perfil (${bad.slice(0, 3).join(", ")}).`;
  return null;
}

/** Substitui os dados do perfil ativo pelos do arquivo */
function applyProfileFile(file, { reload = true, keepName = false } = {}) {
  const problem = validateProfileFile(file);
  if (problem) throw new Error(problem);
  if (hasProgress()) saveBackup(file.exportedAt ? "arquivo" : "nuvem");
  applySnapshot(file.data);
  const profile = getActiveProfile();
  const fields = { updatedAt: Number.isFinite(file.updatedAt) ? file.updatedAt : now() };
  if (!keepName && file.profile && file.profile.name) fields.name = file.profile.name;
  updateProfile(profile.id, fields);
  if (reload) reloadPage();
  return true;
}

/* ---------------- marcação de mudanças ---------------- */

let installed = false;
let pendingMark = 0;
/**
 * Toda gravação de uma chave do perfil marca o perfil como alterado
 * (é o que a sincronização usa para saber quem é o mais novo)
 */
function installChangeTracking() {
  if (installed || typeof Storage === "undefined" || !storage) return;
  installed = true;
  const proto = Storage.prototype;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  rawSet = (k, v) => origSet.call(storage, k, v);
  rawRemove = (k) => origRemove.call(storage, k);
  const mark = (key) => {
    if (suppress || !isProfileKey(key)) return;
    pendingMark = now();
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("gamida:profile-changed", { detail: { key } }));
    }
  };
  proto.setItem = function (key, value) {
    const before = this === storage ? this.getItem(key) : null;
    origSet.call(this, key, value);
    if (this === storage && before !== String(value)) mark(key);
  };
  proto.removeItem = function (key) {
    const had = this === storage && this.getItem(key) !== null;
    origRemove.call(this, key);
    if (had) mark(key);
  };
  // Grava a data da última mudança no registro sem disparar a cada tecla
  setInterval(flushChangeMark, 2000);
  if (typeof window !== "undefined") window.addEventListener("pagehide", flushChangeMark);
}

function flushChangeMark() {
  if (!pendingMark) return;
  const reg = loadRegistry();
  const profile = reg.profiles.find((p) => p.id === reg.active);
  if (profile) {
    profile.updatedAt = Math.max(profile.updatedAt || 0, pendingMark);
    saveRegistry(reg);
  }
  pendingMark = 0;
}

/* ---------------- resumo de todos os modos ---------------- */

function readJSON(key, fallback) {
  try {
    const raw = storage ? storage.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

/** Números do perfil ativo em cada idioma, lidos direto do armazenamento */
function languageSummary(language) {
  const srs = readJSON(`gamida_${language}_srs`, {}) || {};
  const mastery = readJSON(`gamida_${language}_mastery`, {}) || {};
  const path = readJSON(`gamida_${language}_mastery_path`, {}) || {};
  const stones = readJSON(`gamida_${language}_stone_rain`, {}) || {};
  const scribe = readJSON(`gamida_${language}_scribe`, {}) || {};
  const records = Object.values(srs).filter((r) => r && typeof r === "object");
  const high = parseInt((storage && storage.getItem(`gamida_${language}_survival_high`)) || "0", 10);
  return {
    studied: records.length,
    mastered: Object.values(mastery).filter((n) => Number(n) >= 3).length,
    review: records.filter((r) => r.pendingError).length,
    survivalHigh: Number.isFinite(high) ? high : 0,
    pathCompleted: Array.isArray(path.completed) ? path.completed.length : 0,
    stoneBest: Number.isFinite(stones.best) ? stones.best : 0,
    scribe: {
      chapters: Object.keys(scribe.done || {}).length,
      level: Number.isFinite(scribe.lvl) ? scribe.lvl : 0,
      relics: Array.isArray(scribe.relics) ? scribe.relics.length : 0,
      hero: scribe.cls || null,
    },
  };
}

function activitySummary() {
  const days = readJSON("gamida_activity", {}) || {};
  const values = Object.values(days).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const mod = typeof window !== "undefined" ? window.ActivityModule : null;
  const summary = mod ? mod.getActivitySummary() : null;
  return {
    daysStudied: values.length,
    answers: values.reduce((a, b) => a + b, 0),
    streak: summary ? summary.streak : 0,
    best: summary ? summary.best : 0,
    today: summary ? summary.today : 0,
    goal: summary ? summary.goal : parseInt((storage && storage.getItem("gamida_daily_goal")) || "20", 10),
  };
}

/** Configurações do perfil, em linguagem de gente */
function settingsSummary() {
  const get = (k) => (storage ? storage.getItem(k) : null);
  const audio = readJSON("gamida_game_audio", {}) || {};
  return [
    ["Idioma de estudo", get("gamida_language") === "greek" ? "Grego" : "Hebraico"],
    ["Meta diária", `${get("gamida_daily_goal") || 20} respostas`],
    ["Resposta nos jogos", get("gamida_game_typing") === "1" ? "Digitar" : "Tocar"],
    ["Alternativas", get("gamida_choiceDirection") === "reverse" ? "Português → original" : "Original → português"],
    ["Som dos jogos", audio.muted ? "Desligado" : "Ligado"],
    ["Música dos jogos", audio.music === false ? "Desligada" : "Ligada"],
  ];
}

/* ---------------- tela do perfil ---------------- */

const esc = (text) => String(text === null || text === undefined ? "" : text)
  .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const initials = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const fmtDate = (ms) => (ms ? new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "nunca");
const HERO = { hebrew: { mago: "Profeta", cavaleiro: "Guerreiro de Israel", assassino: "Juiz benjamita" }, greek: { mago: "Pescador", cavaleiro: "Centurião", assassino: "Fazedor de tendas" } };

function statRow(label, value) {
  return `<div class="profile-stat"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
}

function languageCard(language) {
  const s = languageSummary(language);
  const title = language === "greek" ? "Grego" : "Hebraico";
  const glyph = language === "greek" ? "α" : "א";
  const hero = s.scribe.hero ? HERO[language][s.scribe.hero] : "sem herói";
  return `<div class="profile-card">
    <h3 class="profile-card__title"><span class="profile-card__glyph">${glyph}</span>${title}</h3>
    <dl class="profile-stats">
      ${statRow("Palavras estudadas", s.studied)}
      ${statRow("Dominadas", s.mastered)}
      ${statRow("Para revisar", s.review)}
      ${statRow("Trilha de domínio", `${s.pathCompleted} capítulos`)}
      ${statRow("Recorde no Sobrevivência", s.survivalHigh)}
      ${statRow("Recorde na Chuva de Pedras", s.stoneBest)}
      ${statRow("Crônicas do Escriba", s.scribe.chapters ? `${s.scribe.chapters} capítulos · nível ${s.scribe.level} · ${hero}` : "não começou")}
      ${statRow("Relíquias", s.scribe.relics)}
    </dl>
  </div>`;
}

function renderProfileTab() {
  if (typeof document === "undefined") return;
  const root = document.getElementById("profile-root");
  if (!root) return;
  flushChangeMark();
  const active = getActiveProfile();
  const others = listProfiles().filter((p) => !p.active);
  const act = activitySummary();
  const cloud = typeof window !== "undefined" ? window.CloudSync : null;
  root.innerHTML = `
    <div class="profile-card profile-card--head">
      <div class="profile-avatar" style="background:${esc(active.color)}" aria-hidden="true">${esc(initials(active.name))}</div>
      <div class="profile-head__text">
        <h3 class="profile-head__name" id="profile-name">${esc(active.name)}</h3>
        <p class="profile-head__meta">${active.google && cloud && cloud.isEnabled() ? `Conta Google: ${esc(active.google.email)}` : "Perfil deste aparelho"} · alterado em ${esc(fmtDate(active.updatedAt))}</p>
      </div>
      <div class="profile-head__actions">
        <button type="button" class="btn-secondary" id="profile-rename">Renomear</button>
      </div>
    </div>

    <div class="profile-grid">
      <div class="profile-card">
        <h3 class="profile-card__title">Estudo</h3>
        <dl class="profile-stats">
          ${statRow("Dias seguidos", act.streak)}
          ${statRow("Melhor sequência", `${act.best} dias`)}
          ${statRow("Dias estudados", act.daysStudied)}
          ${statRow("Respostas dadas", act.answers)}
          ${statRow("Hoje", `${act.today} de ${act.goal}`)}
        </dl>
      </div>
      ${languageCard("hebrew")}
      ${languageCard("greek")}
      <div class="profile-card">
        <h3 class="profile-card__title">Configurações deste perfil</h3>
        <dl class="profile-stats">${settingsSummary().map(([k, v]) => statRow(k, v)).join("")}</dl>
        <p class="profile-note">Ao trocar de perfil, cada um volta com o seu idioma, meta, preferências e progresso.</p>
      </div>
    </div>

    <div class="profile-grid">
      ${cloud && cloud.isEnabled() ? `<div class="profile-card" id="cloud-card">${cloud.renderCard(active)}</div>` : ""}
      <div class="profile-card">
        <h3 class="profile-card__title">Perfis neste aparelho</h3>
        <ul class="profile-list">${others.map((p) => `<li class="profile-list__item">
          <span class="profile-avatar profile-avatar--sm" style="background:${esc(p.color)}" aria-hidden="true">${esc(initials(p.name))}</span>
          <span class="profile-list__name">${esc(p.name)}${p.google ? `<small>${esc(p.google.email)}</small>` : ""}</span>
          <button type="button" class="btn-secondary" data-profile-switch="${esc(p.id)}">Usar</button>
          <button type="button" class="btn-danger" data-profile-delete="${esc(p.id)}" aria-label="Excluir ${esc(p.name)}">Excluir</button>
        </li>`).join("") || `<li class="profile-note">Só este perfil por enquanto.</li>`}</ul>
        <form class="profile-new" id="profile-new-form">
          <label for="profile-new-name" class="field-label">Novo perfil</label>
          <div class="flex gap-2">
            <input id="profile-new-name" class="control-select flex-1 min-w-0" maxlength="40" placeholder="Nome do aluno" autocomplete="off" />
            <button type="submit" class="btn-secondary">Criar</button>
          </div>
        </form>
      </div>
      <div class="profile-card">
        <h3 class="profile-card__title">Arquivo de perfil</h3>
        <p class="profile-note">Um arquivo .json com o progresso e as configurações deste perfil, sem o material de estudo. Serve para levar o perfil a outro aparelho.</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" id="profile-export">Baixar arquivo</button>
          <label class="btn-secondary cursor-pointer">Carregar arquivo<input type="file" id="profile-import" accept="application/json,.json" class="hidden" /></label>
        </div>
        ${readBackup() ? `<p class="profile-note">Há uma cópia de como este perfil estava antes da última substituição (${esc(fmtDate(readBackup().at))}).</p>
        <button type="button" class="btn-secondary" id="profile-undo">Voltar à cópia anterior</button>` : ""}
        <p class="profile-note" id="profile-file-status" role="status"></p>
      </div>
    </div>`;
  bindProfileTab();
  if (cloud && cloud.isEnabled()) cloud.bindCard();
}

function bindProfileTab() {
  const $ = (id) => document.getElementById(id);
  const active = getActiveProfile();
  const rename = $("profile-rename");
  if (rename) rename.onclick = () => {
    const name = typeof prompt === "function" ? prompt("Nome do perfil", active.name) : null;
    if (name && renameProfile(active.id, name)) renderProfileTab();
  };
  document.querySelectorAll("[data-profile-switch]").forEach((btn) => {
    btn.onclick = () => switchProfile(btn.dataset.profileSwitch);
  });
  document.querySelectorAll("[data-profile-delete]").forEach((btn) => {
    btn.onclick = () => {
      const p = listProfiles().find((x) => x.id === btn.dataset.profileDelete);
      if (p && confirm(`Excluir o perfil "${p.name}" deste aparelho? O progresso dele será apagado${p.google ? " daqui (a cópia no Google Drive continua)" : ""}.`)) {
        deleteProfile(p.id);
        renderProfileTab();
      }
    };
  });
  const form = $("profile-new-form");
  if (form) form.onsubmit = (e) => {
    e.preventDefault();
    createProfile($("profile-new-name").value);
  };
  const undo = $("profile-undo");
  if (undo) undo.onclick = () => {
    if (confirm("Voltar este perfil a como estava antes da última substituição? O estado atual será perdido.")) restoreBackup();
  };
  const exp = $("profile-export");
  if (exp) exp.onclick = () => downloadProfileFile();
  const imp = $("profile-import");
  if (imp) imp.onchange = () => {
    const file = imp.files && imp.files[0];
    if (!file) return;
    const status = $("profile-file-status");
    file.text().then((text) => {
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (_) {
        throw new Error("O arquivo não é um JSON válido.");
      }
      const problem = validateProfileFile(parsed);
      if (problem) throw new Error(problem);
      if (confirm(`Carregar o perfil "${(parsed.profile && parsed.profile.name) || "sem nome"}"? O progresso e as configurações deste perfil serão substituídos pelos do arquivo.`)) {
        applyProfileFile(parsed);
      }
    }).catch((err) => {
      if (status) status.textContent = err.message;
    }).finally(() => {
      imp.value = "";
    });
  };
}

function downloadProfileFile() {
  const profile = getActiveProfile();
  const blob = new Blob([JSON.stringify(buildProfileFile(profile), null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = profile.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "perfil";
  a.href = url;
  a.download = `gamida-perfil-${slug}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

/** Atualiza o botão de perfil da navegação (iniciais e cor) */
function updateProfileBadge() {
  if (typeof document === "undefined") return;
  const badge = document.getElementById("nav-profile-avatar");
  if (!badge) return;
  const p = getActiveProfile();
  badge.textContent = initials(p.name);
  badge.style.background = p.color;
  const btn = document.getElementById("nav-btn-profile");
  if (btn) btn.title = `Perfil: ${p.name}`;
}

const ProfilesModule = {
  REGISTRY_KEY,
  STORE_PREFIX,
  FILE_FORMAT,
  isProfileKey,
  loadRegistry,
  listProfiles,
  getActiveProfile,
  updateProfile,
  snapshot,
  applySnapshot,
  hasProgress,
  readBackup,
  restoreBackup,
  switchProfile,
  createProfile,
  deleteProfile,
  renameProfile,
  buildProfileFile,
  validateProfileFile,
  applyProfileFile,
  languageSummary,
  activitySummary,
  settingsSummary,
  installChangeTracking,
  flushChangeMark,
  renderProfileTab,
  updateProfileBadge,
  downloadProfileFile,
  _setEnvironment,
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ProfilesModule = ProfilesModule;
  window.renderProfileTab = renderProfileTab;
  // Marca mudanças desde o começo, antes dos outros módulos gravarem
  installChangeTracking();
  loadRegistry();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ProfilesModule;
}
})();
