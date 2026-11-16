/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba
 * ==========================================================================
 * RPG de estudo: cada lição do Gamida é um capítulo da aventura. O aluno lê o
 * pergaminho de gramática, enfrenta ondas de criaturas-palavra (vocabulário da
 * lição, nos dois sentidos) e vence um guardião feito das frases da lição:
 * palavra por palavra, um golpe de gramática e a montagem da tradução.
 *
 * Vale para hebraico e grego, com o conteúdo completo de cada idioma.
 */

(function () {
const _req = (path) => (typeof require !== "undefined" ? require(path) : null);
const _stateModule = _req("./state.js") || (typeof window !== "undefined" ? window : {});
const _evalModule = _req("./evaluation.js") || (typeof window !== "undefined" ? window.EvaluationModule : {}) || {};
const Campaign = (typeof window !== "undefined" && window.ScribeCampaign) || _req("./scribe-campaign.js");

const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const buildChoiceOptions = (typeof window !== "undefined" && window.buildChoiceOptions) || _stateModule.buildChoiceOptions;
const preferredGloss = (typeof window !== "undefined" && window.preferredGloss) || _stateModule.preferredGloss;
const normalizeText = (typeof window !== "undefined" && window.normalizeText) || _evalModule.normalizeText;

const { CLASSES, RELICS, RELIC_MILESTONES, getChapterMeta } = Campaign;

// Menos que isso não dá quatro alternativas distintas
const MIN_CHAPTER_WORDS = 4;
// Palavras novas por capítulo e palavras antigas que voltam para revisão
const WORDS_PER_CHAPTER = 8;
const OLD_WORDS = 2;
// Frases do guardião: o último capítulo é mais longo
const BOSS_SENTENCES = 5;
const FINAL_BOSS_SENTENCES = 8;
// Sem frases na lição (alfabeto), o guardião ataca com uma rajada de palavras
const RUSH_WORDS = 6;
// Golpes de palavra por frase e pedaços na montagem da tradução
const STRIKES_PER_SENTENCE = 3;
const MAX_CHUNKS = 7;

const STEMS = ["Qal", "Nifal", "Piel", "Pual", "Hitpael", "Hifil", "Hofal"];
const PERSONS = ["eu", "tu", "ele", "ela", "nós", "vós", "eles", "elas"];
const TENSES = ["Presente", "Imperfeito", "Futuro", "Aoristo", "Perfeito", "Mais-que-perfeito"];
const CASES = ["Nominativo", "Genitivo", "Dativo", "Acusativo", "Vocativo"];
// Um tipo de pergunta só aparece a partir da lição que o ensina
const GRAMMAR_GATES = { pessoa: "kelley_12", tronco: "kelley_14", tempo: "bergmann_04", caso: "bergmann_05" };

/* ============================ Regras puras ============================ */

/** Forma de dicionário sem genitivo, artigo nem colchetes: chave para achar o verbete */
function headTerm(term) {
  return String(term || "").split(/[,(/]/)[0].replace(/[[\]]/g, "").trim().normalize("NFC");
}

/** Rótulo curto da lição: "III", "12" */
function lessonLabel(chapter) {
  const lesson = String((chapter && chapter.title) || "").match(/Li[cç][aã]o\s+([IVXLCDM]+|\d+)\b/i);
  return lesson ? `Lição ${lesson[1].toUpperCase()}` : "";
}

/**
 * Capítulos da aventura: toda lição com vocabulário suficiente, na ordem do material
 * @param {Array<Object>} chapters
 * @param {string} language
 * @returns {Array<{index: number, chapter: Object, meta: Object}>}
 */
function buildCampaign(chapters, language) {
  return (Array.isArray(chapters) ? chapters : [])
    .filter((c) => c && (c.items || []).filter((i) => getTerm(i) && (i.translations || []).length).length >= MIN_CHAPTER_WORDS)
    .map((chapter, index) => ({ index, chapter, meta: getChapterMeta(language, chapter, index) }));
}

/**
 * Em que capítulos (por posição) cada uma das quatro relíquias aparece.
 * A última vem sempre com o último capítulo; em campanhas curtas as anteriores
 * recuam uma a uma, e as que não couberem ficam sem capítulo (-1).
 */
function relicIndexes(total) {
  const indexes = RELIC_MILESTONES.map((fraction) => Math.min(total - 1, Math.max(0, Math.round((total - 1) * fraction))));
  for (let k = indexes.length - 2; k >= 0; k--) {
    indexes[k] = Math.min(indexes[k], indexes[k + 1] - 1);
  }
  return indexes.map((index) => (index < 0 ? -1 : index));
}

function relicFor(cls, index, total) {
  const slot = relicIndexes(total).indexOf(index);
  return slot === -1 ? null : RELICS.find((r) => r.cls === cls && r.slot === slot) || null;
}

/** O dano cresce ao longo da campanha, qualquer que seja o número de capítulos */
function monsterDamage(index, total) {
  return 10 + Math.round((20 * index) / Math.max(1, total - 1));
}
function bossDamage(index, total) {
  return 16 + Math.round((20 * index) / Math.max(1, total - 1));
}

function bossSentenceCount(index, total) {
  return index === total - 1 && total > 1 ? FINAL_BOSS_SENTENCES : BOSS_SENTENCES;
}

/** Atributos do herói: classe, nível e relíquias */
function heroStats(state) {
  const cls = CLASSES[state.cls] || CLASSES.cavaleiro;
  const stats = {
    hp: cls.hp[0] + cls.hp[1] * (state.lvl || 1),
    crit: cls.crit, armor: cls.armor, dodge: cls.dodge, hints: cls.hints,
    critXP: cls.critXP || 0, ward: 0, xp: 0, regen: 0, revive: 0,
  };
  (state.relics || []).forEach((id) => {
    const relic = RELICS.find((r) => r.id === id);
    if (relic) Object.keys(relic.fx).forEach((k) => { stats[k] += relic.fx[k]; });
  });
  stats.armor = Math.min(0.6, stats.armor);
  stats.dodge = Math.min(0.45, stats.dodge);
  return stats;
}

const xpNeeded = (level) => level * 60;

function wordsOf(chapter) {
  const seen = new Set();
  return ((chapter && chapter.items) || []).filter((item) => {
    const term = getTerm(item);
    if (!term || !(item.translations || []).length || seen.has(term)) return false;
    seen.add(term);
    return true;
  });
}

/**
 * Criaturas do capítulo, em ondas: palavras da lição (primeiro as que o aluno já errou)
 * e duas de lições anteriores, para não deixar o que passou para trás
 * @returns {Array<Array<{item: Object, old: boolean}>>}
 */
function buildWaves(chapter, previousChapters, stats) {
  const pool = shuffleArray(wordsOf(chapter));
  const missed = (item) => ((stats || {})[getTerm(item)] || {}).x > 0;
  const weak = pool.filter(missed);
  const fresh = pool.filter((item) => !missed(item));
  const picked = [...weak.slice(0, 3), ...fresh].slice(0, WORDS_PER_CHAPTER).map((item) => ({ item, old: false }));
  const taken = new Set(picked.map((w) => getTerm(w.item)));
  const old = shuffleArray((previousChapters || []).flatMap(wordsOf))
    .filter((item) => !taken.has(getTerm(item)))
    .slice(0, OLD_WORDS)
    .map((item) => ({ item, old: true }));
  const queue = shuffleArray([...picked, ...old]);
  return [queue.slice(0, 4), queue.slice(4, 7), queue.slice(7)].filter((wave) => wave.length);
}

/** Índice do vocabulário inteiro do idioma, pela forma de dicionário */
function buildVocabIndex(chapters) {
  const index = new Map();
  (chapters || []).forEach((chapter) => {
    wordsOf(chapter).forEach((item) => {
      const key = headTerm(getTerm(item));
      if (key && !index.has(key)) index.set(key, item);
    });
  });
  return index;
}

const cleanTokenText = (token) => String((token && token.text) || "").replace(/[[\]]/g, "").trim();

/** Tudo o que a análise da palavra diz, num texto só, para procurar tronco, pessoa, tempo e caso */
function tokenAnalysisText(token) {
  const parts = Array.isArray(token.parts) ? token.parts : [];
  return [
    token.word_class, token.inflection, token.syntax_role,
    ...parts.map((p) => `${p.type || ""} ${p.inflection || ""}`),
  ].filter(Boolean).join(" · ");
}

function isVerbToken(token) {
  const parts = Array.isArray(token.parts) ? token.parts : [];
  return /^verbo/i.test(token.word_class || "") || parts.some((p) => /^verbo/i.test(p.type || ""));
}

/** Tronco do verbo hebraico citado na análise (aceita grafias como Pi'el, Hif'il, Niphal) */
function hebrewStem(token) {
  const text = tokenAnalysisText(token);
  const patterns = [
    ["Hitpael", /Hitpa['’ʿ]?el/i], ["Nifal", /Ni(f|ph)['’ʿ]?al/i], ["Hifil", /Hi(f|ph)['’ʿ]?il/i], ["Hofal", /Ho(f|ph)['’ʿ]?al/i],
    ["Piel", /Pi['’ʿ]?el/i], ["Pual", /Pu['’ʿ]?al/i], ["Qal", /\bQal\b/i],
  ];
  const found = patterns.find(([, re]) => re.test(text));
  return found ? found[0] : null;
}

/** Quem pratica a ação, a partir de "3ª pessoa masculino singular" e variações */
function verbPerson(token) {
  const match = tokenAnalysisText(token).match(/([123])ª\s+pessoa([^.;(]{0,40}?)(singular|plural)/i);
  if (!match) return null;
  const plural = /plural/i.test(match[3]);
  const feminine = /femin/i.test(match[2]);
  if (match[1] === "1") return plural ? "nós" : "eu";
  if (match[1] === "2") return plural ? "vós" : "tu";
  if (plural) return feminine ? "elas" : "eles";
  return feminine ? "ela" : "ele";
}

function greekTense(token) {
  const text = token.inflection || tokenAnalysisText(token);
  if (/mais-que-perfeito/i.test(text)) return "Mais-que-perfeito";
  if (/imperfeito/i.test(text)) return "Imperfeito";
  const found = ["Presente", "Futuro", "Aoristo", "Perfeito"].find((t) => new RegExp(t, "i").test(text));
  return found || null;
}

function greekCase(token) {
  const text = token.inflection || tokenAnalysisText(token);
  return CASES.find((c) => new RegExp(c, "i").test(text)) || null;
}

/**
 * Golpe de gramática sobre uma palavra da frase, quando a análise dela permite
 * @param {Object} token
 * @param {string} language
 * @param {(kind: string) => boolean} [isOpen] se a lição que ensina aquele ponto já foi alcançada
 * @returns {{kind: string, label: string, answer: string, options: Array<string>}|null}
 */
function grammarQuestion(token, language, isOpen = () => true) {
  if (!token) return null;
  const candidates = [];
  const add = (kind, label, answer, pool) => {
    if (answer && pool.includes(answer) && isOpen(kind)) candidates.push({ kind, label, answer, pool });
  };
  if (isVerbToken(token)) {
    if (language === "hebrew") add("tronco", "Qual o tronco de", hebrewStem(token), STEMS);
    else add("tempo", "Qual o tempo de", greekTense(token), TENSES);
    add("pessoa", "Quem faz a ação em", verbPerson(token), PERSONS);
  } else if (language === "greek") {
    add("caso", "Em que caso está", greekCase(token), CASES);
  }
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const wrong = shuffleArray(pick.pool.filter((x) => x !== pick.answer)).slice(0, 3);
  return { kind: pick.kind, label: pick.label, answer: pick.answer, options: shuffleArray([pick.answer, ...wrong]) };
}

/**
 * Golpes de palavra de uma frase: até três palavras cujo sentido o aluno consegue apontar,
 * pelo significado na frase (quando a análise o traz) ou pelo verbete do vocabulário
 * @param {Object} sentence
 * @param {Map<string, Object>} vocabIndex
 * @param {Object} chapter capítulo da batalha: palavras da própria lição têm prioridade
 * @returns {Array<{tokenIndex: number, text: string, lemma: string, answer: string, item: Object|null, token: Object}>}
 */
function sentenceStrikes(sentence, vocabIndex, chapter) {
  const ownWords = new Set(wordsOf(chapter).map((item) => headTerm(getTerm(item))));
  const seen = new Set();
  const eligible = [];
  ((sentence && sentence.tokens) || []).forEach((token, tokenIndex) => {
    const text = cleanTokenText(token);
    const lemma = headTerm(token.lemma || text);
    const item = vocabIndex.get(lemma) || null;
    const answer = token.context_meaning ? String(token.context_meaning).trim() : item ? preferredGloss(item.translations) : "";
    if (!text || !answer || seen.has(lemma)) return;
    seen.add(lemma);
    eligible.push({ tokenIndex, text, lemma, answer, item, token, own: ownWords.has(lemma) });
  });
  const ranked = [...shuffleArray(eligible.filter((s) => s.own)), ...shuffleArray(eligible.filter((s) => !s.own))];
  return ranked
    .slice(0, STRIKES_PER_SENTENCE)
    .sort((a, b) => a.tokenIndex - b.tokenIndex)
    .map(({ own, ...strike }) => strike);
}

/**
 * Alternativas de um golpe de palavra: a certa e três significados que não se confundem com ela
 * @param {{answer: string, item: Object|null, token: Object}} strike
 * @param {Array<string>} glossPool outros significados das frases do capítulo
 * @param {Array<Object>} chapters
 * @returns {Array<string>}
 */
function strikeOptions(strike, glossPool, chapters) {
  const answerKey = normalizeText(strike.answer);
  const own = new Set([answerKey, ...((strike.item && strike.item.translations) || []).map(normalizeText)]);
  const seen = new Set(own);
  const wrong = [];
  const consider = (gloss) => {
    const key = normalizeText(gloss);
    if (!key || seen.has(key) || wrong.length >= 3) return;
    seen.add(key);
    wrong.push(gloss);
  };
  shuffleArray(glossPool || []).forEach(consider);
  if (wrong.length < 3 && strike.item) {
    buildChoiceOptions(strike.item, chapters).filter((o) => !o.isCorrect).forEach((o) => consider(o.text));
  }
  if (wrong.length < 3) {
    shuffleArray((chapters || []).flatMap(wordsOf)).forEach((item) => consider(preferredGloss(item.translations)));
  }
  return shuffleArray([strike.answer, ...wrong]);
}

/** Divide a tradução em pedaços para montar: palavra a palavra, ou em grupos nas frases longas */
function chunkTranslation(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const size = Math.max(1, Math.ceil(words.length / MAX_CHUNKS));
  const chunks = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size).join(" "));
  return chunks;
}

/**
 * Pedaços certos da tradução mais dois intrusos tirados de outras frases
 * @returns {{target: string, chunks: Array<string>, bank: Array<{id: number, text: string, used: boolean}>}}
 */
function buildSentenceBank(sentence, otherSentences) {
  const target = preferredGloss(sentence.translations);
  const chunks = chunkTranslation(target);
  const own = new Set(chunks.map(normalizeText));
  const intruders = [];
  shuffleArray((otherSentences || []).filter((s) => s !== sentence).flatMap((s) => chunkTranslation(preferredGloss(s.translations))))
    .forEach((chunk) => {
      const key = normalizeText(chunk);
      if (key && !own.has(key) && intruders.length < 2) {
        own.add(key);
        intruders.push(chunk);
      }
    });
  const bank = shuffleArray([...chunks, ...intruders]).map((text, id) => ({ id, text, used: false }));
  return { target, chunks, bank };
}

/** A montagem está certa quando reproduz a tradução, sem contar acento, caixa e pontuação */
function isBuildCorrect(builtTexts, chunks) {
  return normalizeText((builtTexts || []).join(" ")) === normalizeText((chunks || []).join(" "));
}

/**
 * Frases do guardião: as da própria lição e, se faltarem, as das lições anteriores
 * @param {number} index
 * @param {Array<{chapter: Object}>} campaign
 * @returns {Array<Object>}
 */
function bossSentences(index, campaign) {
  const count = bossSentenceCount(index, campaign.length);
  const usable = (chapter) => ((chapter && chapter.sentences) || []).filter(
    (s) => getTerm(s) && (s.translations || []).length && Array.isArray(s.tokens) && s.tokens.length,
  );
  let list = shuffleArray(usable(campaign[index].chapter)).slice(0, count);
  for (let j = index - 1; list.length < count && j >= 0; j--) {
    const extra = shuffleArray(usable(campaign[j].chapter)).filter((s) => !list.includes(s));
    list = list.concat(extra.slice(0, count - list.length));
  }
  return list;
}

/* ============================ Progresso ============================ */

const FRESH = () => ({ cls: null, done: {}, lvl: 1, xp: 0, potions: 3, scrolls: 2, relics: [], stats: {} });
const storageKey = (language) => `gamida_${language || AppState.language}_scribe`;
let S = FRESH();

function sanitizeProgress(raw) {
  const state = FRESH();
  if (!raw || typeof raw !== "object") return state;
  if (CLASSES[raw.cls]) state.cls = raw.cls;
  if (raw.done && typeof raw.done === "object") Object.keys(raw.done).forEach((id) => { if (raw.done[id]) state.done[id] = true; });
  if (Number.isFinite(raw.lvl) && raw.lvl >= 1) state.lvl = Math.floor(raw.lvl);
  if (Number.isFinite(raw.xp) && raw.xp >= 0) state.xp = Math.floor(raw.xp);
  if (Number.isFinite(raw.potions) && raw.potions >= 0) state.potions = Math.floor(raw.potions);
  if (Number.isFinite(raw.scrolls) && raw.scrolls >= 0) state.scrolls = Math.floor(raw.scrolls);
  if (Array.isArray(raw.relics)) state.relics = raw.relics.filter((id) => RELICS.some((r) => r.id === id));
  if (raw.stats && typeof raw.stats === "object") state.stats = raw.stats;
  return state;
}

function loadProgress(language) {
  if (typeof localStorage === "undefined") return FRESH();
  try {
    return sanitizeProgress(JSON.parse(localStorage.getItem(storageKey(language)) || "null"));
  } catch (_) {
    return FRESH();
  }
}

function save() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(S));
  } catch (err) {
    console.warn("Aviso ao salvar o progresso das Crônicas do Escriba:", err);
  }
}

const doneCount = (state) => Object.keys((state && state.done) || {}).length;

/**
 * Traz o progresso de um backup quando ele está mais adiantado que o deste aparelho
 * @param {string} language
 * @param {Object} incoming
 * @returns {boolean} true se o progresso local foi substituído
 */
function mergeProgress(language, incoming) {
  const imported = sanitizeProgress(incoming);
  const local = loadProgress(language);
  if (doneCount(imported) < doneCount(local) || (doneCount(imported) === doneCount(local) && imported.lvl <= local.lvl)) return false;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(storageKey(language), JSON.stringify(imported));
    } catch (_) {
      return false;
    }
  }
  if (language === AppState.language) S = imported;
  return true;
}

/* ============================ Interface ============================ */

const $ = (selector) => (typeof document !== "undefined" ? document.querySelector(selector) : null);
const esc = (text) => String(text === null || text === undefined ? "" : text)
  .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const isHebrew = () => AppState.language === "hebrew";
const termClass = () => (isHebrew() ? "hebrew-text" : "greek-text");
const audio = () => (typeof window !== "undefined" ? window.GameAudio : null);
const gfx = () => (typeof window !== "undefined" ? window.ScribeGraphics : null);
const sfx = (name, arg) => { const a = audio(); if (a && a.sfx[name]) a.sfx[name](arg); };
const music = (theme) => { const a = audio(); if (!a) return; if (theme) a.epic.play(theme); else a.epic.stop(); };
const reduceMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Trechos em hebraico ou grego dentro de um texto em português
const ORIGINAL_RUN = /([֐-׿][֐-׿\s־]*[֐-׿]|[֐-׿]|[Ͱ-Ͽἀ-῿][Ͱ-Ͽἀ-῿\s,᾽‑-]*[Ͱ-Ͽἀ-῿]|[Ͱ-Ͽἀ-῿])/g;
/** Escapa o texto e dá a fonte do idioma aos trechos no alfabeto original */
const rich = (text) => esc(text).replace(ORIGINAL_RUN, (run) =>
  `<span class="sc-orig ${/[֐-׿]/.test(run) ? "hebrew-text" : "greek-text"}">${run}</span>`);
const orig = (text) => `<span class="sc-orig ${termClass()}">${esc(text)}</span>`;

let campaign = [];
let vocabIndex = new Map();
let B = null; // batalha em curso
let A = null; // animação da arena
let frameId = 0;
let timerId = 0;

function isOpen() {
  const view = typeof document !== "undefined" ? document.getElementById("scribe-view") : null;
  return !!view && !view.classList.contains("hidden");
}

function setScreen(html) {
  const screen = $("#sc-screen");
  if (screen) screen.innerHTML = html;
}

function on(selector, handler) {
  const node = $(selector);
  if (node) node.onclick = handler;
}

function isUnlocked(index) {
  if (index <= 0) return true;
  return !!S.done[campaign[index].chapter.id] || !!S.done[campaign[index - 1].chapter.id];
}

const P = () => heroStats(S);
const maxHP = () => P().hp;

function gainXP(amount) {
  const gained = Math.round(amount * (1 + P().xp));
  S.xp += gained;
  let leveled = false;
  while (S.xp >= xpNeeded(S.lvl)) {
    S.xp -= xpNeeded(S.lvl);
    S.lvl++;
    leveled = true;
  }
  if (leveled && B) {
    B.hp = maxHP();
    sfx("level");
    log(`Nível ${S.lvl}! Vida restaurada.`, "ok");
  }
  save();
  return gained;
}

function recordAnswer(term, ok) {
  if (typeof window === "undefined") return;
  if (typeof window.recordActivity === "function") window.recordActivity();
  // Errar uma palavra aqui também a manda para a lista de erros do Gamida
  if (!ok && term && typeof window.recordSRSError === "function") window.recordSRSError(term);
}

function stat(term, ok) {
  const entry = S.stats[term] || (S.stats[term] = { r: 0, x: 0 });
  if (ok) entry.r++;
  else entry.x++;
}

/* ---------- Painel do herói ---------- */

function heroPanel() {
  const cls = CLASSES[S.cls];
  const stats = P();
  const relics = S.relics.map((id) => RELICS.find((r) => r.id === id)).filter(Boolean);
  return `<div class="sc-hero">
    <canvas class="sc-avatar" id="sc-avatar" width="116" height="116" aria-hidden="true"></canvas>
    <div class="sc-bars">
      <b>${esc(cls.name)} · nível ${S.lvl}</b>
      <div class="sc-bar sc-bar--xp" title="Experiência"><i style="width:${(S.xp / xpNeeded(S.lvl)) * 100}%"></i></div>
      <div class="sc-stats">
        <span>Vida <b>${stats.hp}</b></span><span>XP <b>${S.xp}/${xpNeeded(S.lvl)}</b></span>
        <span>Óleo de cura <b>${S.potions}</b></span><span>Dicas <b>${S.scrolls}</b></span>
        <span>Capítulos <b>${doneCount(S)}/${campaign.length}</b></span>
      </div>
      ${relics.length ? `<div class="sc-relics">${relics.map((r) => `<span class="sc-relic" title="${esc(r.desc)}">${esc(r.name)}</span>`).join("")}</div>` : ""}
    </div>
  </div>`;
}

function paintAvatar(id, cls) {
  const g = gfx();
  const canvas = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!g || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  const px = 4;
  const lw = Math.ceil(w / px);
  const lh = Math.ceil(h / px);
  const low = g.buf(`av-${id}`, lw, lh);
  const lc = low.getContext("2d");
  const t = performance.now() / 1000;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.fillStyle = "#1b2338";
  lc.fillRect(0, 0, lw, lh);
  lc.setTransform(1 / px, 0, 0, 1 / px, 0, 0);
  g.drawHero(lc, w / 2, h * 0.92, h / 90, t, false, cls, false);
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.quantize(lc, lw, lh);
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.drawImage(low, 0, 0, lw, lh, 0, 0, w, h);
}

function animateAvatars(ids) {
  cancelAnimationFrame(frameId);
  const step = () => {
    if (!isOpen() || !ids.some(([id]) => document.getElementById(id))) return;
    ids.forEach(([id, cls]) => paintAvatar(id, cls));
    frameId = requestAnimationFrame(step);
  };
  step();
}

/* ---------- Telas fora da batalha ---------- */

function chooseClass() {
  B = null;
  music(null);
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Escolha seu herói</h3>
    <p class="sc-story sc-story--left">As palavras do rolo viraram demônios e dragões. Escolha quem vai atrás delas. A classe muda vida, tempo de crítico, defesa e as relíquias bíblicas que você encontra.</p>
    <div class="sc-classes">${Object.entries(CLASSES).map(([key, cls]) => `<div class="sc-cls">
      <canvas id="sc-cv-${key}" width="200" height="200" aria-hidden="true"></canvas>
      <b>${esc(cls.name)}</b><p>${esc(cls.desc)}</p>
      <ul>${cls.perks.map((perk) => `<li>${esc(perk)}</li>`).join("")}</ul>
      <p class="sc-muted sc-small">Relíquias: ${RELICS.filter((r) => r.cls === key).map((r) => esc(r.name)).join(" · ")}</p>
      <button type="button" class="sc-btn" data-class="${key}">Escolher ${esc(cls.name)}</button>
    </div>`).join("")}</div>
  </div>`);
  animateAvatars(Object.keys(CLASSES).map((key) => [`sc-cv-${key}`, key]));
  document.querySelectorAll("#sc-screen [data-class]").forEach((btn) => {
    btn.onclick = () => {
      const a = audio();
      if (a) a.init();
      S.cls = btn.dataset.class;
      save();
      sfx("fanfare");
      showMap();
    };
  });
}

function showMap() {
  if (!S.cls) return chooseClass();
  B = null;
  stopTimer();
  music("map");
  const total = campaign.length;
  const current = campaign.findIndex((c, i) => isUnlocked(i) && !S.done[c.chapter.id]);
  const master = isHebrew() ? "Kelley" : "Bergmann";
  const started = doneCount(S) > 0;
  setScreen(`<div class="sc-card">${heroPanel()}
    <p class="sc-story">${started
      ? "Escolha o próximo capítulo. Cada um traz um pergaminho de ensino, ondas de criaturas-palavra e um guardião de várias frases."
      : `O rolo do mestre ${master} se rasgou. Cada palavra virou um demônio, e cada frase, um guardião. Percorra a terra de ${esc(campaign[0].meta.city)} a ${esc(campaign[total - 1].meta.city)} e restaure o rolo.`}</p>
    <div class="sc-chapters">${campaign.map(({ chapter, meta }, i) => {
      const relic = relicFor(S.cls, i, total);
      const done = !!S.done[chapter.id];
      const open = isUnlocked(i);
      const lesson = lessonLabel(chapter);
      return `<button type="button" class="sc-chap${done ? " is-done" : ""}${i === current ? " is-current" : ""}" data-chapter="${i}" ${open ? "" : "disabled"}>
        <span class="sc-chap__n ${termClass()}">${esc(meta.native.split(/[־\s]/)[0])}</span>
        <span class="sc-chap__body"><b>Capítulo ${i + 1} · ${esc(meta.city)}</b>
          <span>${lesson ? `${esc(lesson)} · ` : ""}${rich(meta.scroll.t)}${relic ? ` · relíquia: ${esc(relic.name)}` : ""}</span></span>
        <em>${done ? "vencido" : open ? "aberto" : "bloqueado"}</em>
      </button>`;
    }).join("")}</div>
    <div class="sc-row" id="sc-map-actions">
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-change-class">Trocar de classe</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-reset">Recomeçar a aventura</button>
    </div>
  </div>`);
  animateAvatars([["sc-avatar", S.cls]]);
  document.querySelectorAll("#sc-screen [data-chapter]").forEach((btn) => {
    btn.onclick = () => {
      const a = audio();
      if (a) a.init();
      showScroll(Number(btn.dataset.chapter));
    };
  });
  on("#sc-change-class", () => {
    $("#sc-map-actions").innerHTML = `<span class="sc-muted">Trocar mantém nível e capítulos, mas as relíquias são da classe atual.</span>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-change-yes">Trocar</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-cancel">Cancelar</button>`;
    on("#sc-change-yes", chooseClass);
    on("#sc-cancel", showMap);
  });
  on("#sc-reset", () => {
    $("#sc-map-actions").innerHTML = `<span class="sc-muted">Apagar todo o progresso desta aventura?</span>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-reset-yes">Sim, recomeçar</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-cancel">Cancelar</button>`;
    on("#sc-reset-yes", () => {
      S = FRESH();
      save();
      chooseClass();
    });
    on("#sc-cancel", showMap);
  });
  const currentBtn = $("#sc-screen .sc-chap.is-current");
  if (currentBtn && started && typeof currentBtn.scrollIntoView === "function") currentBtn.scrollIntoView({ block: "center" });
}

function scrollHtml(scroll) {
  const paragraphs = (list) => (list || []).map((text) => `<p>${rich(text)}</p>`).join("");
  const table = scroll.rows && scroll.rows.length
    ? `<div class="sc-table"><table>${scroll.rows.map((row) => `<tr>${row.map((cell) => `<td>${rich(cell)}</td>`).join("")}</tr>`).join("")}</table></div>`
    : "";
  return `<div class="sc-scroll"><h4>Pergaminho · ${rich(scroll.t)}</h4>${paragraphs(scroll.p)}${table}${paragraphs(scroll.after)}
    <div class="sc-tip"><b>Dica do mestre:</b> ${rich(scroll.tip)}</div></div>`;
}

function showScroll(index, fromBook) {
  const { meta, chapter } = campaign[index];
  B = null;
  stopTimer();
  music("map");
  sfx("tick");
  setScreen(`<div class="sc-card">
    <p class="sc-story">${esc(meta.story)}</p>
    ${scrollHtml(meta.scroll)}
    <p class="sc-muted sc-small sc-center">${esc(chapter.title)}</p>
    <div class="sc-row">${fromBook
      ? `<button type="button" class="sc-btn" id="sc-back">Voltar ao grimório</button>`
      : `<button type="button" class="sc-btn" id="sc-go">Entrar em batalha</button><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Mapa</button>`}</div>
  </div>`);
  on("#sc-go", () => startChapter(index));
  on("#sc-back", fromBook ? showBook : showMap);
}

function showBook() {
  if (!isOpen()) return;
  if (!S.cls) return chooseClass();
  B = null;
  stopTimer();
  music("map");
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Grimório</h3>
    <p class="sc-muted">Os pergaminhos dos capítulos que você já abriu.</p>
    <div class="sc-chapters">${campaign.map(({ meta, chapter }, i) => `<button type="button" class="sc-chap" data-chapter="${i}" ${isUnlocked(i) ? "" : "disabled"}>
      <span class="sc-chap__n ${termClass()}">${esc(meta.native.split(/[־\s]/)[0])}</span>
      <span class="sc-chap__body"><b>${rich(meta.scroll.t)}</b><span>${esc(meta.city)}${lessonLabel(chapter) ? ` · ${esc(lessonLabel(chapter))}` : ""}</span></span><em></em>
    </button>`).join("")}</div>
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Mapa</button></div>
  </div>`);
  document.querySelectorAll("#sc-screen [data-chapter]").forEach((btn) => {
    btn.onclick = () => showScroll(Number(btn.dataset.chapter), true);
  });
  on("#sc-back", showMap);
}

/* ============================ Batalha ============================ */

function startChapter(index) {
  const { chapter, meta } = campaign[index];
  const stats = P();
  B = {
    index, chapter, meta, total: campaign.length,
    waves: buildWaves(chapter, campaign.slice(0, index).map((c) => c.chapter), S.stats),
    wave: 0, mi: 0, hp: stats.hp, boss: false, mon: null, lock: false, q: null,
    free: stats.hints, ward: stats.ward, revive: stats.revive,
  };
  A = { parts: [], floats: [], lunge: {}, monFlash: 0, heroFlash: 0, shake: 0, deathT: 0 };
  const g = gfx();
  if (g) g.resetEmbers();
  music("battle");
  nextMonster();
}

const currentWave = () => B.waves[B.wave];

function nextMonster() {
  if (B.mi >= currentWave().length) {
    B.wave++;
    B.mi = 0;
    if (B.wave >= B.waves.length) return bossIntro();
    sfx("combo");
  }
  const word = currentWave()[B.mi];
  const term = getTerm(word.item);
  let seed = 0;
  for (let i = 0; i < term.length; i++) seed = (seed * 31 + term.charCodeAt(i)) % 9973;
  B.mon = { word, term, label: headTerm(term), hp: 2, max: 2, seed, dead: false };
  renderBattle();
  askMob();
  if (B.mi === 0 && B.wave > 0) log(`Onda ${B.wave + 1} de ${B.waves.length}!`, "ok");
}

function monsterName() {
  if (B.boss) return B.meta.boss;
  if (B.mon && B.mon.word.old) return "Criatura antiga";
  return ["Demônio menor", "Espectro", "Draconídeo"][(B.mon ? B.mon.seed : 0) % 3];
}

function bossProgressLabel() {
  if (B.rush) return `Palavra ${Math.min(B.ri + 1, B.rush.length)} de ${B.rush.length}`;
  return `Frase ${Math.min(B.si + 1, B.sents.length)} de ${B.sents.length}`;
}

function battleShell(inner) {
  const cls = CLASSES[S.cls];
  const mon = B.mon;
  return `<div class="sc-card sc-card--battle">
    <div class="sc-stage"><canvas id="sc-arena" aria-label="Arena de batalha"></canvas>
      <div class="sc-hudtop">
        <div class="sc-hudbox"><b>${esc(cls.name)} · nível ${S.lvl}</b>
          <div class="sc-bar sc-bar--hp"><i id="sc-hero-hp" style="width:${(B.hp / maxHP()) * 100}%"></i></div>
          <span id="sc-hero-hp-text">${B.hp}/${maxHP()}</span></div>
        <div class="sc-hudbox sc-hudbox--right"><b>${esc(monsterName())}</b>
          <div class="sc-bar ${B.boss ? "sc-bar--boss" : "sc-bar--hp"}"><i id="sc-mon-hp" style="width:${mon ? (mon.hp / mon.max) * 100 : 0}%"></i></div>
          <span id="sc-mon-info">${B.boss ? bossProgressLabel() : `Onda ${B.wave + 1}/${B.waves.length} · ${B.mi + 1}/${currentWave().length}`}</span></div>
      </div>
    </div>
    ${inner}
    <div class="sc-log" id="sc-log" role="status"></div>
    <div class="sc-items">
      <button type="button" class="sc-item" id="sc-potion">Óleo de cura (${S.potions})</button>
      <button type="button" class="sc-item" id="sc-hint">${hintLabel()}</button>
      <button type="button" class="sc-item" id="sc-flee">Fugir para o mapa</button>
    </div>
  </div>`;
}

const hintLabel = () => `Dica (${B && B.free > 0 ? `${B.free} grátis` : S.scrolls})`;

function renderBattle(inner) {
  setScreen(battleShell(inner || `<div id="sc-cmd"></div>`));
  arenaLoop();
  on("#sc-potion", usePotion);
  on("#sc-hint", useHint);
  on("#sc-flee", showMap);
}

function log(html, tone) {
  const node = $("#sc-log");
  if (!node) return;
  node.className = `sc-log${tone ? ` is-${tone}` : ""}`;
  node.innerHTML = html;
}

function updateBars() {
  const hero = $("#sc-hero-hp");
  const heroText = $("#sc-hero-hp-text");
  const mon = $("#sc-mon-hp");
  const info = $("#sc-mon-info");
  if (hero) hero.style.width = `${Math.max(0, (B.hp / maxHP()) * 100)}%`;
  if (heroText) heroText.textContent = `${Math.max(0, B.hp)}/${maxHP()}`;
  if (mon && B.mon) mon.style.width = `${Math.max(0, (B.mon.hp / B.mon.max) * 100)}%`;
  if (info && B.boss) info.textContent = bossProgressLabel();
}

function stopTimer() {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(timerId);
  timerId = 0;
}

/** Barra do golpe crítico: responder antes de ela acabar dobra o dano */
function startTimer(seconds) {
  B.t0 = performance.now();
  B.crit = seconds;
  stopTimer();
  const tick = () => {
    const bar = $("#sc-timer i");
    if (!bar || !B) return;
    const left = 1 - (performance.now() - B.t0) / 1000 / seconds;
    bar.style.width = `${Math.max(0, left * 100)}%`;
    if (left > 0) timerId = requestAnimationFrame(tick);
  };
  tick();
}

function optionButtons(options, { asTerm = false } = {}) {
  return `<div class="sc-opts">${options.map((text, k) => `<button type="button" class="sc-opt${asTerm ? ` sc-opt--term ${termClass()}` : ""}" data-k="${k}">
    <span class="sc-opt__k">${k + 1}</span><span>${esc(text)}</span></button>`).join("")}</div>`;
}

function bindOptions(handler) {
  document.querySelectorAll("#sc-screen .sc-opt").forEach((btn) => {
    btn.onclick = () => handler(Number(btn.dataset.k));
  });
}

/* ---------- Criaturas: uma palavra, dois golpes ---------- */

function askMob() {
  const { word } = B.mon;
  const first = B.mon.hp === B.mon.max;
  B.lock = false;
  B.dir = first ? "forward" : "reverse";
  B.opts = buildChoiceOptions(word.item, AppState.chapters, { direction: B.dir });
  const cmd = $("#sc-cmd");
  if (!cmd) return;
  cmd.innerHTML = `<div class="sc-prompt">${first
    ? `<div class="sc-q">Ataque: o que significa?</div><div class="sc-prompt__term ${termClass()}">${esc(B.mon.term)}</div>`
    : `<div class="sc-q">Golpe final: qual é a palavra para</div><div class="sc-prompt__pt">${esc(word.item.translations.join(" / "))}</div>`}</div>
    <div class="sc-timer" id="sc-timer" title="Responda antes da barra acabar para um golpe crítico"><i></i></div>
    ${optionButtons(B.opts.map((o) => o.text), { asTerm: !first })}`;
  bindOptions(answerMob);
  startTimer(P().crit);
}

function answerMob(k) {
  if (!B || B.lock || !B.opts[k]) return;
  const { word, term } = B.mon;
  const option = B.opts[k];
  const buttons = document.querySelectorAll("#sc-screen .sc-opt");
  const gloss = esc(word.item.translations.join(" / "));
  if (option.isCorrect) {
    B.lock = true;
    buttons[k].classList.add("is-ok");
    const crit = (performance.now() - B.t0) / 1000 < B.crit;
    B.mon.hp = Math.max(0, B.mon.hp - (crit ? 2 : 1));
    stat(term, true);
    recordAnswer(term, true);
    fxHitMonster(crit ? 24 : 12, crit);
    sfx("hit", crit ? 4 : 1);
    updateBars();
    log(`${crit ? "Golpe crítico!" : "Acertou!"} ${orig(term)} = ${gloss}`, "ok");
    setTimeout(() => {
      if (!B || !B.mon) return;
      if (B.mon.hp <= 0) killMob(crit);
      else askMob();
    }, crit ? 750 : 600);
  } else {
    buttons[k].classList.add("is-bad");
    buttons[k].disabled = true;
    stat(term, false);
    recordAnswer(term, false);
    const wrongGloss = esc((option.translations || []).join(" / "));
    log(B.dir === "forward"
      ? `Errou! “${esc(option.text)}” é ${orig(option.term)}. A criatura contra-ataca.`
      : `Errou! ${orig(option.term)} é “${wrongGloss}”. A criatura contra-ataca.`, "bad");
    hurt(monsterDamage(B.index, B.total));
  }
}

function killMob(crit) {
  const stats = P();
  B.mon.dead = true;
  A.deathT = performance.now() / 1000 + 0.6;
  sfx("combo");
  const xp = gainXP(12 + (B.mon.word.old ? 4 : 0) + (crit ? stats.critXP : 0));
  let drop = "";
  if (stats.regen) {
    const healed = Math.min(stats.regen, maxHP() - B.hp);
    if (healed > 0) {
      B.hp += healed;
      fxText(`+${healed}`, "#5fd394");
      updateBars();
    }
  }
  if (Math.random() < 0.22) {
    if (Math.random() < 0.6) {
      S.potions++;
      drop = " Caiu um óleo de cura!";
    } else {
      S.scrolls++;
      drop = " Caiu um pergaminho de dica!";
    }
    save();
  }
  log(`Criatura vencida: ${orig(B.mon.term)} = ${esc(B.mon.word.item.translations.join(" / "))} · +${xp} XP.${drop}`, "ok");
  setTimeout(() => {
    if (!B) return;
    B.mi++;
    nextMonster();
  }, 950);
}

function hurt(damage) {
  const stats = P();
  if (B.ward > 0) {
    B.ward--;
    fxHitHero(0, true);
    log("O Urim e Tumim desviou o golpe.", "ok");
    sfx("tick");
    return;
  }
  if (Math.random() < stats.dodge) {
    fxHitHero(0, true);
    sfx("tick");
    const node = $("#sc-log");
    log(`${node ? node.innerHTML : ""} Você esquivou!`, "ok");
    return;
  }
  const dealt = Math.round(damage * (1 - stats.armor));
  B.hp -= dealt;
  fxHitHero(dealt);
  sfx("wrong");
  sfx("wall");
  updateBars();
  if (B.hp <= 0) {
    if (B.revive > 0) {
      B.revive--;
      B.hp = Math.round(maxHP() / 2);
      updateBars();
      fxText("REVIVEU", "#ff5a6a");
      log("O cordão escarlate de Raabe salvou você: metade da vida restaurada.", "ok");
      return;
    }
    B.lock = true;
    setTimeout(defeat, 700);
  }
}

function defeat() {
  if (!B) return;
  music(null);
  sfx("over");
  stopTimer();
  cancelAnimationFrame(frameId);
  const index = B.index;
  B = null;
  setScreen(`<div class="sc-card sc-card--center">
    <h3 class="sc-h">Você caiu</h3>
    <p class="sc-story">A lâmpada se apagou em ${esc(campaign[index].meta.city)}. Nível, XP e relíquias continuam; o capítulo recomeça.</p>
    <div class="sc-row">
      <button type="button" class="sc-btn" id="sc-retry">Tentar de novo</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-reread">Reler o pergaminho</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-map">Mapa</button>
    </div>
  </div>`);
  on("#sc-retry", () => startChapter(index));
  on("#sc-reread", () => showScroll(index));
  on("#sc-map", showMap);
}

function usePotion() {
  if (!B || S.potions <= 0 || B.hp >= maxHP()) return;
  S.potions--;
  const healed = Math.min(45, maxHP() - B.hp);
  B.hp += healed;
  fxText(`+${healed}`, "#5fd394");
  sfx("tick");
  save();
  updateBars();
  const btn = $("#sc-potion");
  if (btn) btn.textContent = `Óleo de cura (${S.potions})`;
  log(`Óleo de cura: +${healed} de vida.`, "ok");
}

/** A dica apaga duas alternativas erradas */
function useHint() {
  if (!B || B.lock) return;
  const buttons = Array.from(document.querySelectorAll("#sc-screen .sc-opt"));
  if (!buttons.length || (B.free <= 0 && S.scrolls <= 0)) return;
  let removed = 0;
  buttons.forEach((btn, k) => {
    const option = B.opts[k];
    const isAnswer = typeof option === "string" ? option === B.ans : !!(option && option.isCorrect);
    if (!isAnswer && !btn.disabled && removed < 2) {
      btn.disabled = true;
      btn.classList.add("is-gone");
      removed++;
    }
  });
  if (!removed) return;
  if (B.free > 0) B.free--;
  else S.scrolls--;
  save();
  const hintBtn = $("#sc-hint");
  if (hintBtn) hintBtn.textContent = hintLabel();
  sfx("tick");
  log("A dica apagou duas respostas erradas.", "ok");
}

/* ---------- Guardião: as frases da lição ---------- */

function grammarGateOpen(kind) {
  const gateId = GRAMMAR_GATES[kind];
  const gateIndex = campaign.findIndex((c) => c.chapter.id === gateId);
  return gateIndex === -1 || B.index >= gateIndex;
}

function prepareSentence(sentence) {
  const strikes = sentenceStrikes(sentence, vocabIndex, B.chapter);
  // Um golpe de gramática por frase, na primeira palavra cuja análise permitir
  let grammarUsed = false;
  strikes.forEach((strike) => {
    strike.grammar = null;
    if (grammarUsed) return;
    const question = grammarQuestion(strike.token, AppState.language, grammarGateOpen);
    if (question) {
      strike.grammar = question;
      grammarUsed = true;
    }
  });
  return { sentence, strikes, ...buildSentenceBank(sentence, B.sentPool) };
}

function bossIntro() {
  const stats = P();
  B.boss = true;
  B.lock = false;
  B.free = stats.hints;
  B.sentPool = campaign.slice(0, B.index + 1).flatMap((c) => c.chapter.sentences || []);
  // Significados das palavras nas frases do capítulo: daí saem as alternativas erradas
  B.glossPool = (B.chapter.sentences || []).flatMap((s) => (s.tokens || []).map((t) => t.context_meaning).filter(Boolean));
  const sentences = bossSentences(B.index, campaign);
  let total;
  if (sentences.length) {
    B.rush = null;
    B.sents = sentences.map(prepareSentence);
    B.si = 0;
    B.s = B.sents[0];
    B.wi = 0;
    B.q = null;
    B.phase = B.s.strikes.length ? "word" : "build";
    total = B.sents.reduce((sum, s) => sum + s.strikes.length + 1, 0);
  } else {
    // Lição sem frases: o guardião dispara palavras, pedindo o termo original
    B.sents = [];
    B.rush = shuffleArray(wordsOf(B.chapter)).slice(0, RUSH_WORDS);
    B.ri = 0;
    total = B.rush.length;
  }
  B.mon = { word: null, term: "", label: "", hp: total, max: total, seed: B.index * 7 + 5, dead: false };
  const g = gfx();
  if (g) g.resetEmbers();
  music("boss");
  const intro = B.rush
    ? `${esc(B.meta.boss)} desperta! Ele lança <b>${B.rush.length} palavras</b> de uma vez. Aponte o termo certo para cada significado.`
    : `${esc(B.meta.boss)} desperta! Ele guarda <b>${B.sents.length} ${B.sents.length === 1 ? "frase" : "frases"}</b>. Decifre as palavras, responda o golpe de gramática e monte cada tradução.`;
  renderBattle(`<div class="sc-prompt"><div class="sc-q sc-q--strong">${intro}</div></div>
    <div class="sc-scroll sc-scroll--tip"><b>Dica do mestre:</b> ${rich(B.meta.scroll.tip)}</div>
    <div class="sc-row"><button type="button" class="sc-btn" id="sc-fight">Lutar</button></div>`);
  sfx("level");
  on("#sc-fight", () => {
    renderBattle();
    if (B.rush) rushTurn();
    else bossTurn();
  });
}

function bossLine() {
  const { sentence, strikes } = B.s;
  const struck = new Map(strikes.map((s, i) => [s.tokenIndex, i]));
  const allDone = B.phase === "build";
  return `<div class="sc-bossline" dir="${isHebrew() ? "rtl" : "ltr"}">${(sentence.tokens || []).map((token, tokenIndex) => {
    const strikeIndex = struck.has(tokenIndex) ? struck.get(tokenIndex) : -1;
    const done = strikeIndex !== -1 && (allDone || strikeIndex < B.wi);
    const now = !allDone && strikeIndex === B.wi;
    return `<div class="sc-bw${done ? " is-done" : ""}${now ? " is-now" : ""}">
      <span class="${termClass()}">${esc(cleanTokenText(token))}</span>
      <small>${done ? esc(strikes[strikeIndex].answer) : "&nbsp;"}</small></div>`;
  }).join("")}</div>`;
}

function bossTurn() {
  const cmd = $("#sc-cmd");
  if (!cmd || !B) return;
  B.lock = false;
  updateBars();
  if (B.phase === "build") return bossBuild();
  const strike = B.s.strikes[B.wi];
  const word = `<span class="sc-ask ${termClass()}">${esc(strike.text)}</span>`;
  let label;
  if (B.q) {
    B.opts = B.q.options;
    B.ans = B.q.answer;
    label = `${esc(B.q.label)} ${word}?`;
  } else {
    B.opts = strikeOptions(strike, B.glossPool, AppState.chapters);
    B.ans = strike.answer;
    const showLemma = strike.item && !strike.token.context_meaning && strike.lemma !== headTerm(strike.text);
    label = strike.token.context_meaning
      ? `O que significa ${word} nesta frase?`
      : showLemma
        ? `${word} vem de ${orig(strike.lemma)}. O que significa?`
        : `O que significa ${word}?`;
  }
  cmd.innerHTML = `${bossLine()}<div class="sc-prompt"><div class="sc-q sc-q--strong">${label}</div></div>${optionButtons(B.opts)}`;
  bindOptions(bossAnswer);
}

function bossAnswer(k) {
  if (!B || B.lock || B.opts[k] === undefined) return;
  const strike = B.s.strikes[B.wi];
  const buttons = document.querySelectorAll("#sc-screen .sc-opt");
  const vocabTerm = strike.item ? getTerm(strike.item) : null;
  if (B.opts[k] === B.ans) {
    B.lock = true;
    buttons[k].classList.add("is-ok");
    sfx("hit", 2);
    if (!B.q) {
      recordAnswer(vocabTerm, true);
      B.mon.hp--;
      fxHitMonster(15, false);
      updateBars();
      if (strike.grammar) {
        B.q = strike.grammar;
        log(`Certo: ${esc(strike.answer)}. Golpe extra de gramática!`, "ok");
        setTimeout(bossTurn, 650);
        return;
      }
    } else {
      recordAnswer(null, true);
      fxHitMonster(8, true);
      log(`Certo: ${esc(B.q.answer)}.`, "ok");
      gainXP(4);
    }
    B.q = null;
    B.wi++;
    if (B.wi >= B.s.strikes.length) B.phase = "build";
    setTimeout(bossTurn, 650);
  } else {
    buttons[k].classList.add("is-bad");
    buttons[k].disabled = true;
    recordAnswer(B.q ? null : vocabTerm, false);
    log(`${esc(B.meta.boss)} revida! Olhe o começo e o fim da palavra.`, "bad");
    hurt(bossDamage(B.index, B.total));
  }
}

function bossBuild() {
  const cmd = $("#sc-cmd");
  if (!cmd || !B) return;
  B.opts = [];
  B.built = B.built || [];
  const { bank, chunks, sentence } = B.s;
  cmd.innerHTML = `${bossLine()}
    <div class="sc-prompt"><div class="sc-q sc-q--strong">Golpe da frase: monte a tradução</div></div>
    <div class="sc-build" id="sc-build">${B.built.length
      ? B.built.map((b, i) => `<button type="button" class="sc-chip is-placed" data-i="${i}">${esc(b.text)}</button>`).join("")
      : `<span class="sc-build__hint">Toque nos pedaços na ordem do português</span>`}</div>
    <div class="sc-chips" id="sc-bank">${bank.map((b) => `<button type="button" class="sc-chip" data-id="${b.id}" ${b.used ? "disabled" : ""}>${esc(b.text)}</button>`).join("")}</div>
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-clear">Limpar</button><button type="button" class="sc-btn" id="sc-strike">Desferir golpe</button></div>`;
  document.querySelectorAll("#sc-bank .sc-chip").forEach((chip) => {
    chip.onclick = () => {
      const piece = bank.find((b) => b.id === Number(chip.dataset.id));
      if (!piece || piece.used) return;
      piece.used = true;
      B.built.push(piece);
      sfx("tick");
      bossBuild();
    };
  });
  document.querySelectorAll("#sc-build .sc-chip").forEach((chip) => {
    chip.onclick = () => {
      const [piece] = B.built.splice(Number(chip.dataset.i), 1);
      piece.used = false;
      bossBuild();
    };
  });
  on("#sc-clear", () => {
    B.built.forEach((b) => { b.used = false; });
    B.built = [];
    bossBuild();
  });
  on("#sc-strike", () => {
    if (B.lock) return;
    const got = B.built.map((b) => b.text);
    recordAnswer(null, isBuildCorrect(got, chunks));
    if (isBuildCorrect(got, chunks)) {
      B.lock = true;
      B.mon.hp--;
      updateBars();
      fxHitMonster(30, true);
      sfx("level");
      log(`Frase vencida: “${esc(preferredGloss(sentence.translations))}”`, "ok");
      setTimeout(() => {
        if (!B) return;
        B.si++;
        B.built = [];
        if (B.si >= B.sents.length) return bossDown();
        B.s = B.sents[B.si];
        B.wi = 0;
        B.q = null;
        B.phase = B.s.strikes.length ? "word" : "build";
        bossTurn();
      }, 1100);
    } else {
      const box = $("#sc-build");
      if (box) {
        box.classList.add("is-bad", "sc-shake");
        setTimeout(() => box.classList.remove("sc-shake"), 300);
      }
      const firstBad = got.findIndex((text, i) => normalizeText(text) !== normalizeText(chunks[i] || ""));
      document.querySelectorAll("#sc-build .sc-chip").forEach((chip, i) => {
        if (i === firstBad) chip.classList.add("is-wrong");
      });
      log(got.length < chunks.length && firstBad === -1
        ? "Falta pedaço: toda palavra da frase precisa aparecer."
        : "A ordem ou um pedaço não bate. O destacado é o primeiro problema.", "bad");
      hurt(bossDamage(B.index, B.total));
    }
  });
}

/** Guardião sem frases (alfabeto): rajada de palavras no sentido inverso */
function rushTurn() {
  const cmd = $("#sc-cmd");
  if (!cmd || !B) return;
  B.lock = false;
  updateBars();
  const item = B.rush[B.ri];
  B.opts = buildChoiceOptions(item, AppState.chapters, { direction: "reverse" });
  cmd.innerHTML = `<div class="sc-prompt"><div class="sc-q">Rajada do guardião: qual é a palavra para</div>
    <div class="sc-prompt__pt">${esc(item.translations.join(" / "))}</div></div>${optionButtons(B.opts.map((o) => o.text), { asTerm: true })}`;
  bindOptions((k) => {
    if (!B || B.lock || !B.opts[k]) return;
    const buttons = document.querySelectorAll("#sc-screen .sc-opt");
    const term = getTerm(item);
    if (B.opts[k].isCorrect) {
      B.lock = true;
      buttons[k].classList.add("is-ok");
      recordAnswer(term, true);
      stat(term, true);
      B.mon.hp--;
      fxHitMonster(15, false);
      sfx("hit", 2);
      updateBars();
      log(`Certo: ${orig(term)} = ${esc(item.translations.join(" / "))}`, "ok");
      setTimeout(() => {
        if (!B) return;
        B.ri++;
        if (B.ri >= B.rush.length) bossDown();
        else rushTurn();
      }, 650);
    } else {
      buttons[k].classList.add("is-bad");
      buttons[k].disabled = true;
      recordAnswer(term, false);
      stat(term, false);
      log(`${esc(B.meta.boss)} revida! ${orig(B.opts[k].term)} é “${esc((B.opts[k].translations || []).join(" / "))}”.`, "bad");
      hurt(bossDamage(B.index, B.total));
    }
  });
}

function bossDown() {
  B.mon.dead = true;
  B.mon.hp = 0;
  updateBars();
  A.deathT = performance.now() / 1000 + 0.8;
  music(null);
  sfx("fanfare");
  const index = B.index;
  const total = B.total;
  const sentences = B.sents.map((s) => s.sentence);
  const chapterId = B.chapter.id;
  S.done[chapterId] = true;
  S.potions++;
  const xp = gainXP(60 + Math.max(sentences.length, 1) * 6);
  const relic = relicFor(S.cls, index, total);
  let newRelic = null;
  if (relic && !S.relics.includes(relic.id)) {
    S.relics.push(relic.id);
    newRelic = relic;
  }
  save();
  setTimeout(() => {
    if (!isOpen()) return;
    cancelAnimationFrame(frameId);
    B = null;
    music("map");
    const next = campaign[index + 1];
    setScreen(`<div class="sc-card sc-card--center">
      <span class="sc-muted">${esc(campaign[index].meta.boss)} derrotado</span>
      <div class="sc-big">Capítulo ${index + 1} completo</div>
      ${newRelic ? `<div class="sc-relicdrop"><span class="sc-muted">Relíquia encontrada</span><b>${esc(newRelic.name)}</b><span>${esc(newRelic.ref)} · ${esc(newRelic.desc)}</span></div>` : ""}
      <p class="sc-muted">+${xp} XP · +1 óleo de cura</p>
      ${sentences.length ? `<details class="sc-review"><summary>Rever as ${sentences.length} frases do guardião</summary>
        <div class="sc-revlist">${sentences.map((s) => `<div><span class="sc-revlist__term ${termClass()}" dir="${isHebrew() ? "rtl" : "ltr"}">${esc(getTerm(s))}</span>
          <span>“${esc(preferredGloss(s.translations))}”</span></div>`).join("")}</div></details>` : ""}
      <div class="sc-row">${next
        ? `<button type="button" class="sc-btn" id="sc-next">Seguir para ${esc(next.meta.city)}</button>`
        : `<span class="sc-muted">Você restaurou o rolo inteiro.</span>`}
        <button type="button" class="sc-btn sc-btn--ghost" id="sc-again">Refazer capítulo</button>
        <button type="button" class="sc-btn sc-btn--ghost" id="sc-map">Mapa</button></div>
    </div>`);
    if (newRelic) sfx("fanfare");
    on("#sc-next", () => showScroll(index + 1));
    on("#sc-again", () => startChapter(index));
    on("#sc-map", showMap);
  }, 1100);
}

/* ============================ Arena ============================ */

const PX = 3;

function arenaLoop() {
  cancelAnimationFrame(frameId);
  const step = () => {
    const canvas = typeof document !== "undefined" ? document.getElementById("sc-arena") : null;
    if (!canvas || !B || !isOpen()) return;
    drawArena(canvas);
    frameId = requestAnimationFrame(step);
  };
  step();
}

function hasGlow() {
  return S.relics.some((id) => {
    const relic = RELICS.find((r) => r.id === id);
    return relic && relic.cls === S.cls;
  });
}

function drawArena(canvas) {
  const g = gfx();
  if (!g) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return;
  if (canvas.width !== Math.round(W * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const t = performance.now() / 1000;
  const lw = Math.ceil(W / PX);
  const lh = Math.ceil(H / PX);
  const low = g.buf("low", lw, lh);
  const lc = low.getContext("2d");
  const sprites = g.buf("spr", lw, lh);
  const sc = sprites.getContext("2d");
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.clearRect(0, 0, lw, lh);
  sc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  g.paintBG(lc, W, H, B.meta.scene, B.boss ? 3 : B.index, t);
  if (B.boss) {
    lc.fillStyle = "rgba(140,10,0,.2)";
    lc.fillRect(0, 0, W, H);
  }
  const groundY = H * 0.86;
  const scale = Math.min(1.25, H / 210);
  const lunge = (who) => (A.lunge.who === who && A.lunge.t > t ? W * 0.13 * Math.sin(((A.lunge.t - t) / 0.28) * Math.PI) : 0);
  g.drawHero(sc, W * 0.18 + lunge("hero"), groundY, scale * 1.3, t, A.heroFlash > t, S.cls, hasGlow());
  let monsterX = 0;
  if (B.mon && (!B.mon.dead || A.deathT > t)) {
    const mon = B.mon;
    const flash = A.monFlash > t;
    const breath = A.lunge.who === "mon" && A.lunge.t > t;
    monsterX = W * 0.72 - lunge("mon");
    sc.globalAlpha = mon.dead ? Math.max(0, (A.deathT - t) / 0.6) : 1;
    if (B.boss) {
      const kind = B.index === B.total - 1 ? "hydra" : B.index % 2 === 0 ? "dragon" : "demon";
      if (kind === "demon") g.drawArchDemon(sc, monsterX, groundY, 46 * scale, t, flash, breath);
      else {
        g.drawDragon(sc, monsterX + W * 0.04, groundY, 52 * scale, t, flash, {
          heads: kind === "hydra" ? 3 : 1, big: true,
          col: kind === "hydra" ? "#3f6a4a" : ["#8a2a1a", "#5a2f8a", "#8a6a2a"][B.index % 3],
          belly: kind === "hydra" ? "#a8c27a" : "#d0a050", breath,
        });
      }
    } else {
      const kind = mon.seed % 3;
      if (kind === 0) g.drawImp(sc, monsterX, groundY, 34 * scale, t, flash, mon.seed);
      else if (kind === 1) g.drawWraith(sc, monsterX, groundY, 34 * scale, t, flash, mon.seed);
      else g.drawDragon(sc, monsterX + W * 0.03, groundY, 30 * scale, t, flash, { col: ["#4f7a3a", "#8a3a2a", "#3a5a8a"][mon.seed % 3], belly: "#c9a86a", breath });
    }
    sc.globalAlpha = 1;
  }
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.outlineOnto(lc, sprites, "#0b0612");
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  g.embers(lc, W, H, t, B.boss);
  g.vignette(lc, W, H, B.boss);
  A.parts.forEach((p) => {
    const k = (t - p.t0) / p.d;
    if (k > 1) return;
    lc.globalAlpha = 1 - k;
    lc.fillStyle = p.c;
    lc.fillRect(p.x + p.vx * k, p.y + p.vy * k + 60 * k * k, PX * 1.4, PX * 1.4);
  });
  lc.globalAlpha = 1;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.quantize(lc, lw, lh);

  const c = canvas.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  const shakeX = A.shake > t ? Math.round((Math.random() - 0.5) * 4) * PX * dpr : 0;
  c.fillStyle = "#181425";
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.drawImage(low, 0, 0, lw, lh, shakeX, 0, lw * PX * dpr, lh * PX * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Placa com a palavra sobre a criatura
  if (B.mon && !B.boss && !B.mon.dead && B.mon.label) {
    c.font = isHebrew() ? '700 22px "SBL Hebrew", "Noto Sans Hebrew", serif' : '700 19px "Gentium Plus", serif';
    c.direction = isHebrew() ? "rtl" : "ltr";
    c.textAlign = "center";
    const tw = Math.min(W * 0.5, Math.ceil(c.measureText(B.mon.label).width / PX) * PX + 18);
    const py = Math.round((groundY - 34 * scale * 2.75) / PX) * PX;
    c.fillStyle = "#181425";
    c.fillRect(monsterX - tw / 2 - PX, py - 16 - PX, tw + PX * 2, 28 + PX * 2);
    c.fillStyle = "#a22633";
    c.fillRect(monsterX - tw / 2, py - 16, tw, 28);
    c.fillStyle = "#262b44";
    c.fillRect(monsterX - tw / 2 + PX, py - 16 + PX, tw - PX * 2, 28 - PX * 2);
    c.fillStyle = "#feae34";
    c.fillText(B.mon.label, monsterX, py + 5, tw - 10);
    c.direction = "ltr";
  }
  A.floats.forEach((f) => {
    const k = t - f.t0;
    if (k > 1) return;
    c.globalAlpha = 1 - k;
    c.font = "800 15px Rubik, sans-serif";
    c.textAlign = "center";
    const y = Math.round((f.y - 30 * k) / PX) * PX;
    c.fillStyle = "#181425";
    c.fillText(f.txt, f.x + 2, y + 2);
    c.fillStyle = f.c;
    c.fillText(f.txt, f.x, y);
  });
  c.globalAlpha = 1;
  A.parts = A.parts.filter((p) => t - p.t0 < p.d);
  A.floats = A.floats.filter((f) => t - f.t0 < 1);
}

function arenaSize() {
  const canvas = typeof document !== "undefined" ? document.getElementById("sc-arena") : null;
  return canvas ? { W: canvas.clientWidth, H: canvas.clientHeight } : null;
}

function fxHitMonster(damage, crit) {
  const size = arenaSize();
  if (!size || !A) return;
  const t = performance.now() / 1000;
  A.lunge = { who: "hero", t: t + 0.28 };
  A.monFlash = t + 0.15;
  A.floats.push({ txt: `${crit ? "CRÍTICO −" : "−"}${damage}`, x: size.W * 0.72, y: size.H * 0.3, c: crit ? "#e2b04a" : "#fff", t0: t });
  if (reduceMotion()) return;
  const color = S.cls === "mago" ? "#9fd8ff" : S.cls === "assassino" ? "#e8e2d4" : "#e2b04a";
  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * 6.28;
    A.parts.push({ x: size.W * 0.72, y: size.H * 0.55, vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80, c: crit ? "#ffcf3a" : color, t0: t, d: 0.65 });
  }
}

function fxHitHero(damage, dodged) {
  const size = arenaSize();
  if (!size || !A) return;
  const t = performance.now() / 1000;
  A.lunge = { who: "mon", t: t + 0.4 };
  if (dodged) {
    A.floats.push({ txt: "ESQUIVOU", x: size.W * 0.18, y: size.H * 0.35, c: "#9fd8ff", t0: t });
    return;
  }
  A.heroFlash = t + 0.25;
  A.shake = reduceMotion() ? 0 : t + 0.3;
  A.floats.push({ txt: `−${damage}`, x: size.W * 0.18, y: size.H * 0.35, c: "#ff7b6b", t0: t });
}

function fxText(txt, color) {
  const size = arenaSize();
  if (!size || !A) return;
  A.floats.push({ txt, x: size.W * 0.18, y: size.H * 0.35, c: color, t0: performance.now() / 1000 });
}

/* ============================ Entrada e saída ============================ */

let listenersReady = false;
function setupListeners() {
  if (listenersReady || typeof document === "undefined") return;
  listenersReady = true;
  document.addEventListener("keydown", (e) => {
    if (!isOpen() || e.defaultPrevented) return;
    if (/^[1-4]$/.test(e.key)) {
      const btn = document.querySelectorAll("#sc-screen .sc-opt")[Number(e.key) - 1];
      if (btn && !btn.disabled) {
        btn.click();
        e.preventDefault();
      }
    } else if ((e.key === "m" || e.key === "M") && typeof window.gameAudioToggleMute === "function") {
      window.gameAudioToggleMute();
    }
  });
}

function refreshAudioLabels() {
  const a = audio();
  if (!a || typeof document === "undefined") return;
  document.querySelectorAll("[data-game-audio='mute']").forEach((btn) => {
    btn.textContent = a.isMuted() ? "Som: desligado" : "Som: ligado";
  });
  document.querySelectorAll("[data-game-audio='music']").forEach((btn) => {
    btn.textContent = a.isMusicOn() ? "Música: ligada" : "Música: desligada";
  });
}

function openScribeChronicles() {
  if (typeof document === "undefined") return;
  S = loadProgress();
  campaign = buildCampaign(AppState.chapters, AppState.language);
  vocabIndex = buildVocabIndex(AppState.chapters);
  const dashboard = document.getElementById("assess-dashboard");
  const view = document.getElementById("scribe-view");
  if (!view) return;
  if (dashboard) dashboard.classList.add("hidden");
  view.classList.remove("hidden");
  const native = document.getElementById("sc-title-orig");
  if (native) {
    native.textContent = isHebrew() ? "סֹפֵר" : "γραμματεύς";
    native.className = termClass();
  }
  setupListeners();
  refreshAudioLabels();
  const a = audio();
  if (a) a.chip.stop();
  if (!campaign.length) {
    setScreen(`<div class="sc-card sc-card--center"><p class="sc-story">Ainda não há lições com vocabulário suficiente para a aventura.</p></div>`);
    return;
  }
  showMap();
}

/** Encerra a batalha e a música ao sair da tela (voltar ao painel ou trocar de aba) */
function closeScribeChronicles() {
  B = null;
  stopTimer();
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameId);
  music(null);
  if (typeof document === "undefined") return;
  const view = document.getElementById("scribe-view");
  if (view) view.classList.add("hidden");
  setScreen("");
}

function updateScribeCardStat() {
  if (typeof document === "undefined") return;
  const node = document.getElementById("scribe-card-stat");
  if (!node) return;
  const progress = loadProgress();
  const total = buildCampaign(AppState.chapters, AppState.language).length;
  node.textContent = progress.cls
    ? `${doneCount(progress)} de ${total} capítulos · nível ${progress.lvl}`
    : `${total} capítulos, de ${isHebrew() ? "Éden a Jerusalém" : "Belém a Patmos"}`;
}

const ScribeModule = {
  MIN_CHAPTER_WORDS,
  STEMS,
  PERSONS,
  TENSES,
  CASES,
  headTerm,
  lessonLabel,
  buildCampaign,
  relicIndexes,
  relicFor,
  monsterDamage,
  bossDamage,
  bossSentenceCount,
  heroStats,
  xpNeeded,
  buildWaves,
  buildVocabIndex,
  hebrewStem,
  verbPerson,
  greekTense,
  greekCase,
  grammarQuestion,
  sentenceStrikes,
  strikeOptions,
  chunkTranslation,
  buildSentenceBank,
  isBuildCorrect,
  bossSentences,
  sanitizeProgress,
  loadProgress,
  mergeProgress,
  openScribeChronicles,
  closeScribeChronicles,
  updateScribeCardStat,
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeModule = ScribeModule;
  window.openScribeChronicles = openScribeChronicles;
  window.scribeShowBook = showBook;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeModule;
}
})();
