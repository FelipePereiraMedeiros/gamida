/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 22: Perfis e perfil na nuvem (Google Drive)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 22: Perfis e nuvem');
const { html, appJs } = loadSourceFiles();
const Profiles = require('../js/modules/profiles.js');
const Cloud = require('../js/modules/cloud-sync.js');

/** Armazenamento em memória com a mesma interface do localStorage */
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    dump: () => Object.fromEntries(map),
  };
}

function setup(initial) {
  const st = memoryStorage(initial);
  let reloads = 0;
  Profiles._setEnvironment({ storage: st, reload: () => { reloads++; } });
  return { st, reloads: () => reloads };
}

suite.test('Só progresso e configurações entram no perfil; o material de estudo fica de fora', () => {
  ['gamida_language', 'gamida_hebrew_srs', 'gamida_greek_scribe', 'gamida_daily_goal', 'gamida_activity', 'gamida_game_typing', 'gamida_selectedChaps_hebrew']
    .forEach((k) => assert.isTrue(Profiles.isProfileKey(k), `${k} deveria ser do perfil`));
  ['gamida_hebrew_chapters', 'gamida_greek_chapters', 'gamida_data_version_hebrew', 'gamida_profiles', 'gamida_profile_store_p_x', 'gamida_google_token', 'outra_coisa']
    .forEach((k) => assert.isTrue(!Profiles.isProfileKey(k), `${k} não é do perfil`));
});

suite.test('Primeiro uso: o progresso que já existia vira o primeiro perfil, sem perder nada', () => {
  const { st } = setup({ gamida_hebrew_srs: '{"a":{}}', gamida_hebrew_chapters: '[]' });
  const reg = Profiles.loadRegistry();
  assert.equal(reg.profiles.length, 1);
  assert.equal(reg.active, reg.profiles[0].id);
  assert.equal(st.getItem('gamida_hebrew_srs'), '{"a":{}}');
  assert.deepEqual(Object.keys(Profiles.snapshot()), ['gamida_hebrew_srs']);
});

suite.test('Trocar de perfil guarda um e restaura o outro, mantendo o material', () => {
  const { st, reloads } = setup({ gamida_language: 'greek', gamida_hebrew_srs: '{"x":1}', gamida_hebrew_chapters: '[1]' });
  const first = Profiles.getActiveProfile();
  const second = Profiles.createProfile('Maria', { reload: true });
  assert.equal(Profiles.getActiveProfile().id, second.id);
  assert.equal(st.getItem('gamida_language'), null, 'Perfil novo começa vazio');
  assert.equal(st.getItem('gamida_hebrew_chapters'), '[1]', 'Material continua');
  st.setItem('gamida_language', 'hebrew');
  Profiles.switchProfile(first.id);
  assert.equal(st.getItem('gamida_language'), 'greek');
  assert.equal(st.getItem('gamida_hebrew_srs'), '{"x":1}');
  Profiles.switchProfile(second.id);
  assert.equal(st.getItem('gamida_language'), 'hebrew');
  assert.equal(st.getItem('gamida_hebrew_srs'), null);
  assert.equal(reloads(), 3, 'Cada troca recarrega a página');
  assert.isTrue(!Profiles.deleteProfile(second.id), 'Não apaga o perfil em uso');
  assert.isTrue(Profiles.deleteProfile(first.id));
  assert.equal(st.getItem(Profiles.STORE_PREFIX + first.id), null, 'O pacote do perfil apagado some');
});

suite.test('Arquivo de perfil: leva só o perfil, é validado e restaura tudo', () => {
  const { st } = setup({ gamida_daily_goal: '35', gamida_greek_stone_rain: '{"best":120}', gamida_greek_chapters: '[]' });
  Profiles.renameProfile(Profiles.getActiveProfile().id, 'João');
  const file = Profiles.buildProfileFile();
  assert.equal(file.format, 'gamida-profile');
  assert.equal(file.profile.name, 'João');
  assert.deepEqual(Object.keys(file.data).sort(), ['gamida_daily_goal', 'gamida_greek_stone_rain']);
  assert.isTrue(Profiles.validateProfileFile(file) === null);
  assert.isTrue(!!Profiles.validateProfileFile({ chapters: [] }), 'Backup de capítulos não é perfil');
  assert.isTrue(!!Profiles.validateProfileFile({ format: 'gamida-profile', formatVersion: 1, data: { gamida_hebrew_chapters: '[]' } }), 'Arquivo com material é recusado');
  assert.isTrue(!!Profiles.validateProfileFile({ format: 'gamida-profile', formatVersion: 99, data: {} }), 'Versão futura é recusada');
  st.setItem('gamida_daily_goal', '5');
  st.setItem('gamida_extra', '1');
  Profiles.applyProfileFile(file, { reload: false });
  assert.equal(st.getItem('gamida_daily_goal'), '35');
  assert.equal(st.getItem('gamida_extra'), null, 'Dados que não estão no arquivo saem');
  assert.equal(st.getItem('gamida_greek_chapters'), '[]', 'Material intacto');
});

suite.test('Configuração gravada ao abrir o app não conta como progresso; substituir guarda cópia', () => {
  const { st } = setup({ gamida_language: 'hebrew', gamida_lastChap_hebrew: 'kelley_03', gamida_hebrew_srs: '{}' });
  assert.isTrue(!Profiles.hasProgress(), 'Só configurações e SRS vazio');
  st.setItem('gamida_greek_scribe', '{"lvl":2}');
  assert.isTrue(Profiles.hasProgress());
  Profiles.applyProfileFile({ format: 'gamida-profile', formatVersion: 1, data: { gamida_daily_goal: '9' } }, { reload: false });
  assert.equal(st.getItem('gamida_greek_scribe'), null);
  assert.isTrue(!!Profiles.readBackup(), 'Cópia do estado anterior');
  assert.isTrue(Profiles.restoreBackup({ reload: false }));
  assert.equal(st.getItem('gamida_greek_scribe'), '{"lvl":2}');
  assert.equal(st.getItem('gamida_daily_goal'), null);
});

suite.test('Resumo do perfil junta os modos dos dois idiomas', () => {
  setup({
    gamida_hebrew_srs: JSON.stringify({ a: { fails: 1, pendingError: true }, b: {} }),
    gamida_hebrew_mastery: JSON.stringify({ a: 3, b: 1 }),
    gamida_hebrew_survival_high: '42',
    gamida_hebrew_mastery_path: JSON.stringify({ completed: ['kelley_03'] }),
    gamida_greek_stone_rain: JSON.stringify({ best: 77 }),
    gamida_greek_scribe: JSON.stringify({ cls: 'mago', done: { bergmann_01: true }, lvl: 4, relics: ['rede_direita'] }),
  });
  const he = Profiles.languageSummary('hebrew');
  assert.deepEqual([he.studied, he.mastered, he.review, he.survivalHigh, he.pathCompleted], [2, 1, 1, 42, 1]);
  const gr = Profiles.languageSummary('greek');
  assert.equal(gr.stoneBest, 77);
  assert.deepEqual(gr.scribe, { chapters: 1, level: 4, relics: 1, hero: 'mago' });
  assert.isTrue(Profiles.settingsSummary().length >= 5);
});

suite.test('Nuvem: decide subir, baixar ou perguntar pelo que mudou desde a última sincronização', () => {
  const d = Cloud.decide;
  assert.equal(d({ updatedAt: 5, syncedAt: 0, hasData: true }, null), 'upload', 'Sem arquivo na nuvem, sobe');
  assert.equal(d({ updatedAt: 0, syncedAt: 0, hasData: false }, null), 'none');
  assert.equal(d({ updatedAt: 0, syncedAt: 0, hasData: false }, { updatedAt: 9 }), 'download', 'Aparelho novo recebe da nuvem');
  assert.equal(d({ updatedAt: 3, syncedAt: 0, hasData: true }, { updatedAt: 9 }), 'conflict', 'Dados dos dois lados: o aluno escolhe');
  assert.equal(d({ updatedAt: 10, syncedAt: 10, hasData: true }, { updatedAt: 12 }), 'download');
  assert.equal(d({ updatedAt: 15, syncedAt: 10, hasData: true }, { updatedAt: 10 }), 'upload');
  assert.equal(d({ updatedAt: 15, syncedAt: 10, hasData: true }, { updatedAt: 12 }), 'conflict');
  assert.equal(d({ updatedAt: 10, syncedAt: 10, hasData: true }, { updatedAt: 10 }), 'none');
});

suite.test('Nuvem: login só pede a pasta de dados do app no Drive e lê a resposta do Google', () => {
  assert.includes(Cloud.SCOPES, 'drive.appdata');
  assert.isTrue(!/auth\/drive(\s|$)|drive\.file|drive\.readonly/.test(Cloud.SCOPES), 'Nenhum acesso ao resto do Drive');
  const url = new URL(Cloud.buildAuthUrl('abc.p'));
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('response_type'), 'token');
  assert.equal(url.searchParams.get('state'), 'abc.p');
  const ok = Cloud.parseAuthResponse('#access_token=tok&expires_in=3599&state=abc.p&token_type=Bearer');
  assert.deepEqual(ok, { token: 'tok', expiresIn: 3599, state: 'abc.p' });
  assert.deepEqual(Cloud.parseAuthResponse('#error=access_denied&state=x'), { error: 'access_denied' });
  assert.equal(Cloud.FILE_NAME, 'gamida-perfil.json');
});

suite.test('Perfil está na navegação, carrega antes dos outros módulos e tem a página de retorno do login', () => {
  assert.includes(html, 'id="nav-btn-profile"');
  assert.includes(html, 'id="tab-profile"');
  assert.includes(appJs, '"profile"');
  const order = ['js/modules/profiles.js', 'js/data-loader.js', 'js/modules/state.js', 'js/modules/cloud-sync.js', 'js/app.js'].map((f) => html.indexOf(f));
  assert.isTrue(order.every((v, i) => v > -1 && (i === 0 || v > order[i - 1])), 'Ordem de carregamento dos scripts');
  const callback = fs.readFileSync(path.join(__dirname, '..', 'oauth-callback.html'), 'utf8');
  assert.includes(callback, 'gamida_google_oauth_result');
  assert.includes(callback, 'Copyright');
  assert.isTrue(!/<script[^>]+src=/.test(callback), 'Página de retorno sem scripts externos');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
