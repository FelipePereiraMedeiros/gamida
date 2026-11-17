/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
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
const Lore = (typeof window !== "undefined" && window.ScribeLore) || _req("./scribe-lore.js");

const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const buildChoiceOptions = (typeof window !== "undefined" && window.buildChoiceOptions) || _stateModule.buildChoiceOptions;
const preferredGloss = (typeof window !== "undefined" && window.preferredGloss) || _stateModule.preferredGloss;
const normalizeText = (typeof window !== "undefined" && window.normalizeText) || _evalModule.normalizeText;
const evaluateAnswer = (typeof window !== "undefined" && window.evaluateAnswer) || _evalModule.evaluateAnswer;
const compareSentenceWords = (typeof window !== "undefined" && window.compareSentenceWords) || _evalModule.compareSentenceWords;

const { CLASSES, RELICS, BOOKS, SPECIES, classInfo, getChapterMeta } = Campaign;

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

// Digitar leva mais tempo do que tocar: a janela do golpe crítico é maior
const TYPING_CRIT_FACTOR = 1.8;
// A escolha entre tocar e digitar vale para os dois jogos
const TYPING_KEY = "gamida_game_typing";

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

/** Relíquia que a classe encontra ao vencer o guardião deste capítulo (ou null) */
function relicFor(cls, chapterId) {
  return RELICS.find((r) => r.cls === cls && r.ch === chapterId) || null;
}

/** Relíquias do rolo do idioma: as do hebraico ficam no Livro I e II, as do grego no Segundo Rolo */
function relicsOf(language) {
  const table = language === "greek" ? Campaign.GREEK : Campaign.HEBREW;
  return RELICS.filter((r) => table[r.ch]);
}

/** Livros da campanha do idioma, com prólogo e final (Lore) e o último capítulo de cada um */
function booksOf(language) {
  const lang = language === "greek" ? "greek" : "hebrew";
  return (BOOKS[lang] || []).map((book) => ({ ...book, ...(Lore.forBook(lang, book.id) || {}) }));
}

/** Nome e verso da criatura (as figuras são as mesmas nos dois rolos) */
function speciesName(language, sp) {
  const table = SPECIES[language === "greek" ? "greek" : "hebrew"] || {};
  const entry = table[sp] || SPECIES.hebrew[sp] || ["Criatura", ""];
  return { name: entry[0], ref: entry[1] };
}

/** O dano cresce ao longo da campanha, qualquer que seja o número de capítulos */
function monsterDamage(index, total) {
  return 10 + Math.round((20 * index) / Math.max(1, total - 1));
}
function bossDamage(index, total, meta) {
  const damage = 16 + Math.round((20 * index) / Math.max(1, total - 1));
  return meta && meta.light ? Math.round(damage / 2) : damage;
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

/** Palavras por onda na caçada completa */
const FULL_WAVE = 6;

/**
 * Caçada completa: todas as palavras do capítulo viram criaturas, em ondas de seis.
 * As que o aluno já errou vêm primeiro, para não ficarem para o fim cansado.
 * @returns {Array<Array<{item: Object, old: boolean}>>}
 */
function buildFullWaves(chapter, stats) {
  const pool = shuffleArray(wordsOf(chapter));
  const missed = (item) => ((stats || {})[getTerm(item)] || {}).x > 0;
  const queue = [...pool.filter(missed), ...pool.filter((item) => !missed(item))].map((item) => ({ item, old: false }));
  const waves = [];
  for (let i = 0; i < queue.length; i += FULL_WAVE) waves.push(queue.slice(i, i + FULL_WAVE));
  return waves;
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

/**
 * Traduções aceitas num golpe de palavra digitado: o sentido na frase e os do verbete
 * @param {{answer: string, item: Object|null}} strike
 * @returns {Array<string>}
 */
function strikeAccepted(strike) {
  const list = [strike.answer, ...((strike.item && strike.item.translations) || [])];
  return list.filter((text, index) => text && list.indexOf(text) === index);
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

const FRESH = () => ({
  cls: null, done: {}, lvl: 1, xp: 0, potions: 3, scrolls: 2, relics: [], stats: {},
  seenIntro: false, seenEnding: false, story: {}, seen: {}, kills: {}, full: {},
});
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
  // Quem já tinha herói antes de a história existir não precisa rever o prólogo à força
  state.seenIntro = !!raw.seenIntro || (!!state.cls && raw.seenIntro === undefined);
  state.seenEnding = !!raw.seenEnding;
  // Prólogos e finais de cada livro já lidos ("p2", "e1"...)
  if (raw.story && typeof raw.story === "object") Object.keys(raw.story).forEach((k) => { if (/^[pe]\d+$/.test(k) && raw.story[k]) state.story[k] = true; });
  if (state.seenIntro) state.story.p1 = true;
  // Capítulos com o vocabulário inteiro recolhido na caçada completa
  if (raw.full && typeof raw.full === "object") Object.keys(raw.full).forEach((id) => { if (raw.full[id]) state.full[id] = true; });
  // Bestiário: criaturas vistas e vencidas
  ["seen", "kills"].forEach((field) => {
    if (raw[field] && typeof raw[field] === "object") {
      Object.keys(raw[field]).forEach((sp) => {
        if (Number.isFinite(raw[field][sp]) && raw[field][sp] > 0) state[field][sp] = Math.floor(raw[field][sp]);
      });
    }
  });
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
const fxApi = () => (typeof window !== "undefined" ? window.ScribeFX : null);
/** Escurece e clareia a tela ao trocar de cena (como na versão nova do jogo) */
const transition = (color) => { const fx = fxApi(); if (fx) fx.wipe(color); };
const announce = (text, kind, sub) => { const fx = fxApi(); if (fx) fx.banner(text, kind, sub); };
const ORIG_FONT = () => (isHebrew()
  ? '700 22px "SBL Hebrew", "Ezra SIL", "Noto Sans Hebrew", "David", serif'
  : '700 20px "Gentium Plus", "SBL Greek", "Galatia SIL", "Palatino Linotype", serif');
const sfx = (name, arg) => { const a = audio(); if (a && a.sfx[name]) a.sfx[name](arg); };
const music = (theme) => { const a = audio(); if (!a) return; if (theme) a.epic.play(theme); else a.epic.stop(); };
const sting = (name) => { const a = audio(); if (a) a.epic.sting(name); };
/** Tema de batalha do capítulo: cada cenário tem o seu; o último capítulo tem tema próprio */
const battleTheme = () => { const a = audio(); return a && B ? a.epic.themeForScene(B.meta.scene) : "field"; };
const bossTheme = () => (B && B.index === B.total - 1 && B.total > 1 ? "final" : "boss");
const loreOf = (index) => Lore.forChapter(AppState.language, campaign[index].chapter.id);
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

function isUnlocked() {
  // Todos os capítulos ficam abertos: a revisão pode começar em qualquer ponto.
  // A ordem da história continua indicada pelo capítulo "próximo".
  return true;
}

const P = () => heroStats(S);
/** Classe com o nome do rolo do idioma (Profeta, Guerreiro de Israel, Juiz benjamita / Pescador, Centurião, Fazedor de tendas) */
const clsInfo = (key) => classInfo(AppState.language, key || S.cls);
const classLore = (key) => ((Lore.CLASS_LORE[AppState.language === "greek" ? "greek" : "hebrew"] || {})[key]) || "";
const bookOf = (index) => (campaign[index] && campaign[index].meta.book) || 1;
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
    if (A) {
      const t = performance.now() / 1000;
      const size = arenaSize();
      A.lvl = t;
      if (size) A.floats.push({ txt: `NÍVEL ${S.lvl}`, x: size.W * 0.18, y: 60, c: "#fee761", t0: t });
    }
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
  const entry = S.stats[term] || (S.stats[term] = { r: 0, x: 0, s: 0 });
  if (ok) {
    entry.r++;
    entry.s = (entry.s || 0) + 1;
  } else {
    entry.x++;
    entry.s = 0;
  }
}

/* ---------- Painel do herói ---------- */

function heroPanel() {
  const cls = clsInfo();
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
      ${relics.length ? `<div class="sc-relics">${relics.map((r) => `<span class="sc-relic" title="${esc(`${r.ref} · ${r.desc}`)}">${esc(r.name)}</span>`).join("")}</div>` : ""}
    </div>
  </div>`;
}

/** Herói do rolo do idioma: no grego, Pescador, Centurião e Fazedor de tendas têm figura própria */
function drawHeroFor(g, ctx, x, gy, scale, t, flash, cls, withRelics) {
  const heroes = typeof window !== "undefined" ? window.ScribeHeroes : null;
  if (!isHebrew() && heroes) return heroes.drawGreekHero(ctx, x, gy, scale, t, flash, cls, withRelics ? new Set(S.relics) : new Set());
  return g.drawHero(ctx, x, gy, scale, t, flash, cls, withRelics);
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
  g.setEnvironment({ relics: new Set(S.relics) });
  drawHeroFor(g, lc, w / 2, h * 0.92, h / 90, t, false, cls, cls === S.cls);
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
  music("prologue");
  const relics = relicsOf(AppState.language);
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Escolha seu herói</h3>
    <p class="sc-story sc-story--left">As palavras do ${isHebrew() ? "Rolo das Palavras" : "Segundo Rolo"} fugiram e viraram criaturas. Escolha quem vai atrás delas. A classe muda vida, tempo de crítico, defesa e as relíquias bíblicas que você encontra.</p>
    <div class="sc-classes">${Object.keys(CLASSES).map((key) => {
      const cls = clsInfo(key);
      return `<div class="sc-cls">
      <canvas id="sc-cv-${key}" width="200" height="200" aria-hidden="true"></canvas>
      <b>${esc(cls.name)}</b><p>${esc(cls.desc)}</p>
      <p class="sc-cls__lore">${esc(classLore(key))}</p>
      <ul>${cls.perks.map((perk) => `<li>${esc(perk)}</li>`).join("")}</ul>
      <p class="sc-muted sc-small">Relíquias: ${relics.filter((r) => r.cls === key).map((r) => `${esc(r.name)} (${esc(r.ref)})`).join(" · ")}</p>
      <button type="button" class="sc-btn" data-class="${key}">Escolher ${esc(cls.name)}</button>
    </div>`;
    }).join("")}</div>
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
  transition();
  if (!S.seenIntro) return showPrologue(false, 1);
  if (!S.cls) return chooseClass();
  B = null;
  stopTimer();
  music("map");
  const total = campaign.length;
  // Próximo capítulo da história: o primeiro ainda não vencido
  const current = campaign.findIndex((c) => !S.done[c.chapter.id]);
  const started = doneCount(S) > 0;
  const books = booksOf(AppState.language);
  const weak = weakWords().length;
  let lastBook = 0;
  setScreen(`<div class="sc-card">${heroPanel()}
    <p class="sc-story">${started
      ? "Siga a história pelo capítulo destacado ou escolha qualquer outro para revisar: todos estão abertos. Cada um traz um pergaminho de ensino, ondas de criaturas-palavra e um guardião de várias frases."
      : `O ${isHebrew() ? "Rolo das Palavras" : "Segundo Rolo"} está em branco: ${esc(Lore.VILLAIN.name)} engoliu as palavras. Cada palavra virou uma criatura, e cada frase, um guardião. Percorra o caminho de ${esc(campaign[0].meta.city)} a ${esc(campaign[total - 1].meta.city)} e traga-as de volta. Os capítulos seguem as lições, e você pode começar por qualquer um.`}</p>
    <div class="sc-viewtoggle" role="group" aria-label="Ver capítulos">
      <button type="button" class="sc-viewtoggle__btn${mapView() ? "" : " is-on"}" data-view="list" aria-pressed="${!mapView()}">Lista</button>
      <button type="button" class="sc-viewtoggle__btn${mapView() ? " is-on" : ""}" data-view="map" aria-pressed="${mapView()}">Mapa</button>
    </div>
    ${mapView() ? mapHtml(current) : `<div class="sc-chapters">${campaign.map(({ chapter, meta }, i) => {
      const relic = relicFor(S.cls, chapter.id);
      const done = !!S.done[chapter.id];
      const lesson = lessonLabel(chapter);
      let heading = "";
      if (meta.book !== lastBook) {
        lastBook = meta.book;
        const book = books.find((b) => b.id === meta.book);
        if (book) heading = `<div class="sc-bookhead">${esc(book.title)}</div>`;
      }
      return `${heading}<button type="button" class="sc-chap${done ? " is-done" : ""}${i === current ? " is-current" : ""}${!done && i !== current ? " is-free" : ""}" data-chapter="${i}">
        <span class="sc-chap__n ${termClass()}">${esc(meta.native.split(/[־\s]/)[0])}</span>
        <span class="sc-chap__body"><b>Capítulo ${i + 1} · ${esc(meta.city)}</b>
          <span>${lesson ? `${esc(lesson)} · ` : ""}${rich(meta.scroll.t)} · guardião: ${esc(meta.boss)}${relic ? ` · relíquia: ${esc(relic.name)}` : ""}</span></span>
        <em>${done ? "vencido" : i === current ? "próximo" : "aberto"}${S.full[chapter.id] ? `<i class="sc-seal" title="Caçada completa: todo o vocabulário recolhido">★</i>` : ""}</em>
      </button>`;
    }).join("")}</div>`}
    <div class="sc-row">
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-dungeon" ${weak ? "" : "disabled"}>Masmorra (${weak} ${weak === 1 ? "palavra fraca" : "palavras fracas"})</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-bestiary">Bestiário</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-stats">Desempenho</button>
    </div>
    <p class="sc-muted sc-small sc-center sc-byline">Crônicas do Escriba · José Henrique Rosseto e Felipe Pereira Medeiros</p>
    <div class="sc-row" id="sc-map-actions">
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-change-class">Trocar de classe</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-reset">Recomeçar a aventura</button>
    </div>
  </div>`);
  document.querySelectorAll("#sc-screen [data-view]").forEach((btn) => {
    btn.onclick = () => {
      setMapView(btn.dataset.view === "map");
      showMap();
    };
  });
  if (mapView()) bindMap(current);
  else animateAvatars([["sc-avatar", S.cls]]);
  document.querySelectorAll("#sc-screen [data-chapter]").forEach((btn) => {
    btn.onclick = () => {
      const a = audio();
      if (a) a.init();
      showScroll(Number(btn.dataset.chapter));
    };
  });
  on("#sc-dungeon", () => {
    const a = audio();
    if (a) a.init();
    startDungeon();
  });
  on("#sc-bestiary", showBestiary);
  on("#sc-stats", showStats);
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
  if (!mapView() && currentBtn && started && typeof currentBtn.scrollIntoView === "function") currentBtn.scrollIntoView({ block: "center" });
}

/* ---------- Mapa desenhado dos capítulos ---------- */

const MAPVIEW_KEY = "gamida_scribe_view";
const mapApi = () => (typeof window !== "undefined" ? window.ScribeMap : null);
/** Ver os capítulos no mapa? (só quando o mapa está disponível) */
function mapView() {
  if (!mapApi()) return false;
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(MAPVIEW_KEY) === "map";
  } catch (_) {
    return false;
  }
}
function setMapView(on) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(MAPVIEW_KEY, on ? "map" : "list");
  } catch (_) {}
}

// Livro e capítulo escolhidos no mapa (ficam enquanto a tela está aberta)
let mapSel = { book: null, id: null };

function booksWithMap() {
  return booksOf(AppState.language).filter((b) => mapApi().mapFor(AppState.language, b.id));
}

function mapHtml(current) {
  const books = booksWithMap();
  const currentMeta = campaign[current >= 0 ? current : 0].meta;
  if (!books.some((b) => b.id === mapSel.book)) mapSel.book = (books.find((b) => b.id === currentMeta.book) || books[0] || {}).id;
  const def = mapApi().mapFor(AppState.language, mapSel.book);
  if (!def) return "";
  const inBook = campaign.filter((c) => c.meta.book === mapSel.book);
  const placed = inBook.filter((c) => def.places[c.chapter.id]);
  const extra = inBook.filter((c) => !def.places[c.chapter.id]);
  if (!placed.some((c) => c.chapter.id === mapSel.id)) {
    const next = placed.find((c) => c.index === current) || placed.find((c) => !S.done[c.chapter.id]) || placed[0];
    mapSel.id = next ? next.chapter.id : null;
  }
  const book = books.find((b) => b.id === mapSel.book);
  return `${books.length > 1 ? `<div class="sc-booktabs" role="tablist">${books.map((b) => `<button type="button" role="tab" class="sc-booktab${b.id === mapSel.book ? " is-on" : ""}" aria-selected="${b.id === mapSel.book}" data-book="${b.id}">${esc(b.title)}</button>`).join("")}</div>` : ""}
    <div class="sc-worldmap"><canvas id="sc-world" aria-label="Mapa: ${esc(book ? book.title : "")}"></canvas>
      ${(def.labels || []).map(([txt, x, y]) => `<span class="sc-maplbl" style="left:${x}%;top:${y}%">${esc(txt)}</span>`).join("")}
      ${placed.map(({ chapter, meta, index }) => {
        const [x, y] = def.places[chapter.id];
        return `<button type="button" class="sc-node${S.done[chapter.id] ? " is-done" : ""}${index === current ? " is-current" : ""}${chapter.id === mapSel.id ? " is-sel" : ""}" data-node="${esc(chapter.id)}" style="left:${x * 100}%;top:${y * 100}%" aria-label="Capítulo ${index + 1}: ${esc(meta.city)}${S.done[chapter.id] ? ", vencido" : ""}">${index + 1}</button>`;
      }).join("")}
    </div>
    ${mapSel.book > 1 || !isHebrew() ? `<p class="sc-muted sc-small sc-center">${isHebrew() ? "Canaã aparece ampliada, à esquerda da moldura" : "A Terra Santa aparece ampliada, à direita da moldura"}, fora de escala: muitos capítulos acontecem a poucos quilômetros uns dos outros.</p>` : ""}
    <div class="sc-chapinfo" id="sc-chapinfo" aria-live="polite"></div>
    ${extra.length ? `<div class="sc-chapters">${extra.map(({ chapter, meta, index }) => `<button type="button" class="sc-chap${S.done[chapter.id] ? " is-done" : ""}" data-chapter="${index}">
      <span class="sc-chap__n ${termClass()}">${esc(meta.native.split(/[־\s]/)[0])}</span>
      <span class="sc-chap__body"><b>Capítulo ${index + 1} · ${esc(meta.city)}</b><span>${rich(meta.scroll.t)}</span></span><em>${S.done[chapter.id] ? "vencido" : "aberto"}</em></button>`).join("")}</div>` : ""}`;
}

function mapInfo(current) {
  const box = $("#sc-chapinfo");
  const entry = campaign.find((c) => c.chapter.id === mapSel.id);
  if (!box || !entry) return;
  const { chapter, meta, index } = entry;
  const relic = relicFor(S.cls, chapter.id);
  const lesson = lessonLabel(chapter);
  box.innerHTML = `<span class="sc-chapinfo__n ${termClass()}">${esc(meta.native)}</span>
    <div class="sc-chapinfo__body"><b>Capítulo ${index + 1} · ${esc(meta.city)}${S.done[chapter.id] ? " · vencido" : index === current ? " · próximo" : ""}</b>
      <span>${lesson ? `${esc(lesson)} · ` : ""}${rich(meta.scroll.t)}</span>
      <span>Guardião: ${esc(meta.boss)}${meta.bossRef ? ` (${esc(meta.bossRef)})` : ""}${relic ? ` · relíquia: ${esc(relic.name)}` : ""}${S.full[chapter.id] ? " · ★ vocabulário completo" : ""}</span></div>
    <button type="button" class="sc-btn" id="sc-map-enter">${S.done[chapter.id] ? "Refazer" : "Entrar"}</button>`;
  document.querySelectorAll("#sc-screen .sc-node").forEach((n) => n.classList.toggle("is-sel", n.dataset.node === mapSel.id));
  on("#sc-map-enter", () => {
    const a = audio();
    if (a) a.init();
    showScroll(index);
  });
}

function bindMap(current) {
  mapInfo(current);
  document.querySelectorAll("#sc-screen [data-book]").forEach((btn) => {
    btn.onclick = () => {
      mapSel = { book: Number(btn.dataset.book), id: null };
      sfx("tick");
      showMap();
    };
  });
  document.querySelectorAll("#sc-screen .sc-node").forEach((btn) => {
    btn.onclick = () => {
      mapSel.id = btn.dataset.node;
      sfx("tick");
      mapInfo(current);
    };
  });
  const g = gfx();
  const ids = campaign.map((c) => c.chapter.id);
  const done = new Set(ids.filter((id) => S.done[id]));
  cancelAnimationFrame(frameId);
  const step = () => {
    const canvas = document.getElementById("sc-world");
    if (!canvas || !isOpen()) return;
    paintAvatar("sc-avatar", S.cls);
    mapApi().renderMap(canvas, {
      language: AppState.language,
      book: mapSel.book,
      chapterIds: ids,
      done,
      selId: mapSel.id,
      hero: g ? (ctx, x, gy, scale, t) => drawHeroFor(g, ctx, x, gy, scale, t, false, S.cls, true) : null,
    });
    frameId = requestAnimationFrame(step);
  };
  step();
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
  // Ao entrar num livro novo pela primeira vez, o prólogo dele vem antes
  if (!fromBook && meta.book > 1 && !S.story[`p${meta.book}`]) return showPrologue(false, meta.book, () => showScroll(index));
  B = null;
  stopTimer();
  music("scroll");
  sfx("tick");
  transition();
  setScreen(`<div class="sc-card">
    <div class="sc-stage sc-stage--banner"><canvas id="sc-chbanner" aria-label="Cenário de ${esc(meta.city)}"></canvas></div>
    <div class="sc-arrival"><span class="sc-arrival__place">Capítulo ${index + 1} · ${esc(meta.city)} <span class="${termClass()}">${esc(meta.native)}</span>${meta.ref ? ` <small class="sc-muted">${esc(meta.ref)}</small>` : ""}</span>
      <p>${rich(meta.story)}</p>
      <p class="sc-muted sc-small"><b>Guardião:</b> ${esc(meta.boss)}${meta.bossRef ? ` (${esc(meta.bossRef)})` : ""}${meta.why ? ` · <b>Por que aqui:</b> ${rich(meta.why)}` : ""}</p>
      ${meta.liberty ? `<details class="sc-liberty"><summary>Nota de honestidade</summary><p>${rich(meta.liberty)}</p></details>` : ""}</div>
    ${scrollHtml(meta.scroll)}
    <p class="sc-muted sc-small sc-center">${esc(chapter.title)}</p>
    <div class="sc-row">${fromBook
      ? `<button type="button" class="sc-btn" id="sc-back">Voltar ao grimório</button>`
      : `<button type="button" class="sc-btn" id="sc-go">Entrar em batalha</button><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Mapa</button>`}</div>
    ${fromBook ? "" : fullHuntCard(chapter)}
  </div>`);
  on("#sc-go", () => startChapter(index));
  on("#sc-full", () => startChapter(index, { full: true }));
  on("#sc-back", fromBook ? showBook : showMap);
  chapterBannerLoop(index);
}

/** Convite para a caçada completa, com o versículo que dá o tom de cada rolo */
function fullHuntCard(chapter) {
  const total = wordsOf(chapter).length;
  const done = !!S.full[chapter.id];
  const flavor = isHebrew()
    ? "Como no censo do deserto, “segundo o número dos nomes, cabeça por cabeça” (Nm 1.2): cada palavra do capítulo é contada."
    : "Como a rede de Pedro, “cheia de grandes peixes, cento e cinquenta e três” (Jo 21.11): nenhuma palavra fica para trás.";
  return `<div class="sc-fullhunt">
    <div class="sc-fullhunt__text"><b>Caçada completa · ${total} palavras${done ? " · selo conquistado" : ""}</b>
      <span>${esc(flavor)} Todo o vocabulário do capítulo aparece em ondas de ${FULL_WAVE}; as que escaparem voltam no fim. Há acampamento entre as ondas e o guardião espera no final.</span></div>
    <button type="button" class="sc-btn sc-btn--ghost" id="sc-full">Caçar as ${total} palavras</button>
  </div>`;
}

/** Cenário animado do capítulo, com o nome no original */
function chapterBannerLoop(index) {
  const fx = fxApi();
  cancelAnimationFrame(frameId);
  if (!fx) return;
  const { meta } = campaign[index];
  const opts = {
    scene: meta.scene,
    sky: index % 4 === 0 ? 1 : index,
    native: meta.native,
    label: `Capítulo ${index + 1} · ${meta.city}`,
    rtl: isHebrew(),
    fontNative: ORIG_FONT().replace(/\d+px/, "26px"),
    fontLabel: "700 15px Rubik, sans-serif",
  };
  const step = () => {
    const canvas = typeof document !== "undefined" ? document.getElementById("sc-chbanner") : null;
    if (!canvas || !isOpen()) return;
    fx.renderChapterBanner(canvas, opts);
    frameId = requestAnimationFrame(step);
  };
  step();
}

function showBook() {
  transition();
  if (!isOpen()) return;
  if (!S.cls) return chooseClass();
  B = null;
  stopTimer();
  music("map");
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Grimório</h3>
    <div class="sc-row sc-row--left">
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-open-chronicle">Ler a crônica (${doneCount(S)} de ${campaign.length} trechos)</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-open-credits">Créditos</button>
      ${booksOf(AppState.language).map((book) => `<button type="button" class="sc-btn sc-btn--ghost" data-prologue="${book.id}">Prólogo · ${esc(book.short)}</button>`).join("")}
    </div>
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
  on("#sc-open-chronicle", showChronicle);
  on("#sc-open-credits", showCredits);
  document.querySelectorAll("#sc-screen [data-prologue]").forEach((btn) => {
    btn.onclick = () => showPrologue(true, Number(btn.dataset.prologue));
  });
}

/* ---------- História: prólogo, crônica e final ---------- */

function storyHtml(paragraphs) {
  return (paragraphs || []).map((text) => `<p>${rich(text)}</p>`).join("");
}

/**
 * História contada em quadros ilustrados: cada parágrafo ganha uma cena desenhada,
 * com o texto aparecendo aos poucos. "Pular" leva ao último quadro.
 */
function storyScenes({ part, book, eyebrow, title, paragraphs, finalHtml, bindFinal }) {
  const fx = fxApi();
  const slides = fx ? fx.slidesFor(AppState.language, book, part) : [];
  let i = 0;
  let shown = 0;
  let T0 = performance.now() / 1000;
  const last = paragraphs.length - 1;
  setScreen(`<div class="sc-card">
    <span class="sc-eyebrow">${esc(eyebrow)}</span>
    <h3 class="sc-h sc-h--big">${esc(title)}</h3>
    ${fx ? `<div class="sc-stage sc-stage--story"><canvas id="sc-cut" aria-hidden="true"></canvas></div>` : ""}
    <div class="sc-tale sc-tale--scene" id="sc-tale" aria-live="polite"></div>
    <div class="sc-row sc-row--between"><span class="sc-muted sc-small" id="sc-cutn"></span><span class="sc-row" id="sc-cut-actions"></span></div>
  </div>`);
  const g = gfx();
  const env = {
    lang: AppState.language,
    cls: S.cls || "mago",
    font: ORIG_FONT(),
    hero: (ctx, cls, x, gy, s, t, relics) => {
      if (!g) return;
      if (relics) g.setEnvironment({ relics: new Set(S.relics) });
      drawHeroFor(g, ctx, x, gy, s, t, false, cls, relics && cls === S.cls);
    },
    boss: (ctx, kind, x, gy, sc, t) => {
      if (g) drawBoss(g, ctx, kind, x, gy, sc, t, false, false, 400);
    },
  };
  const actions = () => {
    const box = $("#sc-cut-actions");
    const counter = $("#sc-cutn");
    if (counter) counter.textContent = `${eyebrow} · ${i + 1}/${paragraphs.length}`;
    if (!box) return;
    if (i >= last) {
      box.innerHTML = finalHtml;
      bindFinal();
    } else {
      box.innerHTML = `<button type="button" class="sc-btn sc-btn--ghost" id="sc-skip">Pular</button><button type="button" class="sc-btn" id="sc-next-slide">Continuar</button>`;
      on("#sc-skip", () => go(last));
      on("#sc-next-slide", next);
    }
  };
  const go = (k) => {
    i = Math.max(0, Math.min(last, k));
    shown = reduceMotion() ? 1e9 : 0;
    T0 = performance.now() / 1000;
    sfx("tick");
    actions();
  };
  function next() {
    const a = audio();
    if (a) a.init();
    const full = paragraphs[i];
    if (shown < full.length) {
      shown = full.length;
      return;
    }
    go(i + 1);
  }
  cancelAnimationFrame(frameId);
  const step = () => {
    const tale = $("#sc-tale");
    if (!tale || !isOpen()) return;
    const full = paragraphs[i];
    if (shown < full.length) shown = Math.min(full.length, shown + 1.6);
    const text = full.slice(0, Math.floor(shown));
    if (tale.dataset.len !== String(text.length)) {
      tale.dataset.len = String(text.length);
      tale.innerHTML = `<p>${rich(text)}</p>`;
    }
    const canvas = document.getElementById("sc-cut");
    if (canvas && fx) fx.renderSlide(canvas, slides[Math.min(i, slides.length - 1)], performance.now() / 1000 - T0, env);
    frameId = requestAnimationFrame(step);
  };
  go(0);
  step();
}

/** Abertura da aventura: de onde veio a névoa e o que o aprendiz tem de fazer */
function showPrologue(fromBook, book = 1, then) {
  const entry = Lore.forBook(AppState.language, book) || {};
  const prologue = entry.prologue || Lore.PROLOGUE[AppState.language] || Lore.PROLOGUE.hebrew;
  B = null;
  stopTimer();
  music("prologue");
  transition();
  storyScenes({
    part: "prologue",
    book,
    eyebrow: book > 1 ? "Novo livro" : "Prólogo",
    title: prologue.title,
    paragraphs: prologue.paragraphs,
    finalHtml: `<button type="button" class="sc-btn" id="sc-begin">${fromBook ? "Voltar ao grimório" : "Pegar a pena"}</button>`,
    bindFinal: () => on("#sc-begin", () => {
      const a = audio();
      if (a) a.init();
      if (fromBook) return showBook();
      S.story[`p${book}`] = true;
      if (book === 1) S.seenIntro = true;
      save();
      return then ? then() : showMap();
    }),
  });
}

/** Créditos: as Crônicas do Escriba são obra em coautoria (CREDITOS.md) */
function showCredits() {
  B = null;
  stopTimer();
  music("scroll");
  transition();
  const list = (items) => `<ul class="sc-credits__list">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Créditos</h3>
    <p class="sc-story sc-story--left">As Crônicas do Escriba são obra em coautoria de <b>José Henrique Rosseto</b> e <b>Felipe Pereira Medeiros</b>.</p>
    <div class="sc-credits">
      <section><h4 class="sc-h">José Henrique Rosseto</h4>${list([
        "Concepção do jogo: palavras que viram criaturas, frases que viram guardiões, heróis, relíquias e o Devorador do Esquecimento",
        "Guia do Mestre do Rolo: os sete selos, o cânone da história, a ficha de capítulo, o roteiro do Livro I e os roteiros-base do Livro II e do Segundo Rolo",
        "Arte em pixel da versão original: cenários, heróis do hebraico, criaturas, guardiões do Livro I e paleta",
        "Mapa desenhado do Livro I",
        "Animações da versão original: poses, golpes de fogo, luz e relâmpago, letreiros, transições e cenas da história",
        "Elite e velozes, fúria do guardião, masmorra, bestiário e desempenho",
      ])}</section>
      <section><h4 class="sc-h">Felipe Pereira Medeiros</h4>${list([
        "Integração ao Gamida: batalha ligada às lições de Kelley e Bergmann, golpe de gramática, montagem e digitação das traduções, tempo de resposta e progresso",
        "Campanha completa no hebraico e no grego: fichas, pergaminhos, histórias, falas, epílogos, prólogos e finais",
        "Heróis do Segundo Rolo (Pescador, Centurião e Fazedor de tendas) com as relíquias gregas",
        "Guardiões com figura própria do Livro II e do grego",
        "Mapas do Livro II e do Segundo Rolo",
        "Golpes do grego: a rede, o pilo e a carta",
        "Caçada completa, bestiário ilustrado, mapa dos capítulos, música e efeitos sonoros",
      ])}</section>
    </div>
    <p class="sc-muted sc-small">Referências de estudo: Page H. Kelley, Gramática do Hebraico Bíblico; Johannes Bergmann, Gramática do Grego do Novo Testamento. A citação não indica vínculo nem endosso.</p>
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Grimório</button></div>
  </div>`);
  on("#sc-back", showBook);
}

/** A crônica: os trechos que já voltaram ao rolo, na ordem do caminho */
function showChronicle() {
  B = null;
  stopTimer();
  music("scroll");
  const relics = S.relics.map((id) => RELICS.find((r) => r.id === id)).filter(Boolean);
  const books = booksOf(AppState.language);
  let lastBook = 0;
  const entries = campaign.map(({ chapter, meta }, i) => {
    let heading = "";
    if (meta.book !== lastBook) {
      lastBook = meta.book;
      const book = books.find((b) => b.id === meta.book);
      if (book) heading = `<li class="sc-chronicle__book">${esc(book.title)}</li>`;
    }
    if (!S.done[chapter.id]) return `${heading}<li class="sc-chronicle__lost">Capítulo ${i + 1} · página ainda em branco</li>`;
    const lore = loreOf(i);
    return `${heading}<li><b>Capítulo ${i + 1} · ${esc(meta.city)} <span class="${termClass()}">${esc(meta.native)}</span></b>
      <p>${rich(meta.story)}</p><p class="sc-chronicle__quote">${rich(lore.epilogue)}</p></li>`;
  }).join("");
  const endings = books.filter((b) => S.story[`e${b.id}`] || (b.id === books[books.length - 1].id && S.seenEnding));
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">A crônica do escriba</h3>
    <p class="sc-muted">O que já voltou ao ${isHebrew() ? "Rolo das Palavras" : "Segundo Rolo"}. ${esc(Lore.VILLAIN.name)} <span class="${termClass()}">${esc(Lore.VILLAIN.native[AppState.language === "greek" ? "greek" : "hebrew"])}</span> ainda guarda o resto.</p>
    <ol class="sc-chronicle">${entries}</ol>
    ${relics.length ? `<h4 class="sc-h">Relíquias</h4><ul class="sc-relic-lore">${relics.map((r) => `<li><b>${esc(r.name)}</b> <span class="sc-muted">${esc(r.ref)}</span><br>${esc(Lore.RELIC_LORE[r.id] || r.desc)}</li>`).join("")}</ul>` : ""}
    ${endings.length ? `<div class="sc-row">${endings.map((b) => `<button type="button" class="sc-btn sc-btn--ghost" data-ending="${b.id}">Rever o final · ${esc(b.short)}</button>`).join("")}</div>` : ""}
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Grimório</button></div>
  </div>`);
  on("#sc-back", showBook);
  document.querySelectorAll("#sc-screen [data-ending]").forEach((btn) => {
    btn.onclick = () => showEnding(Number(btn.dataset.ending), true);
  });
}

/** Final: o rolo volta cheio para a casa do mestre */
function showEnding(book, fromChronicle) {
  const books = booksOf(AppState.language);
  const last = books.length ? books[books.length - 1].id : 1;
  const id = book || last;
  const entry = Lore.forBook(AppState.language, id) || {};
  const ending = entry.ending || Lore.ENDING[AppState.language] || Lore.ENDING.hebrew;
  const next = books.find((b) => b.id === id + 1);
  B = null;
  stopTimer();
  music("prologue");
  sting("victory");
  transition();
  S.story[`e${id}`] = true;
  if (id === last) S.seenEnding = true;
  save();
  const offerNext = !fromChronicle && next && !S.story[`p${next.id}`];
  storyScenes({
    part: "ending",
    book: id,
    eyebrow: id === last ? "Epílogo" : "Fim do livro",
    title: ending.title,
    paragraphs: ending.paragraphs,
    finalHtml: `${offerNext ? `<button type="button" class="sc-btn" id="sc-next-book">Abrir o ${esc(next.short)}</button>` : ""}<button type="button" class="sc-btn${offerNext ? " sc-btn--ghost" : ""}" id="sc-map">${fromChronicle ? "Crônica" : "Mapa"}</button>`,
    bindFinal: () => {
      on("#sc-next-book", () => showPrologue(false, next.id));
      on("#sc-map", fromChronicle ? showChronicle : showMap);
    },
  });
}

/* ============================ Batalha ============================ */

/** Estado das animações da arena */
function freshArena() {
  return { parts: [], floats: [], lunge: {}, monFlash: 0, heroFlash: 0, shake: 0, deathT: 0, pose: null, proj: [], eatk: null, flash: 0, lvl: 0, heal: 0, letters: [] };
}

function startChapter(index, { full = false } = {}) {
  transition();
  const { chapter, meta } = campaign[index];
  const stats = P();
  const waves = full ? buildFullWaves(chapter, S.stats) : buildWaves(chapter, campaign.slice(0, index).map((c) => c.chapter), S.stats);
  B = {
    index, chapter, meta, total: campaign.length,
    waves,
    wave: 0, mi: 0, hp: stats.hp, boss: false, mon: null, lock: false, q: null,
    free: stats.hints, ward: stats.ward, revive: stats.revive,
    // Caçada completa: palavras recolhidas, as que escaparam e se já voltaram
    full, fullTotal: full ? waves.reduce((n, w) => n + w.length, 0) : 0, caught: new Set(), escaped: [], rematch: false,
  };
  A = freshArena();
  const g = gfx();
  if (g) g.resetEmbers();
  music(battleTheme());
  sting("chapter");
  nextMonster();
}

const currentWave = () => B.waves[B.wave];

function nextMonster() {
  if (B.mi >= currentWave().length) {
    B.wave++;
    B.mi = 0;
    if (B.wave >= B.waves.length && B.full && B.escaped.length && !B.rematch) {
      // As que escaparam voltam uma vez, todas juntas
      B.rematch = true;
      B.waves.push(B.escaped.splice(0));
    }
    if (B.wave >= B.waves.length) return B.dungeon ? dungeonDone() : bossIntro();
    sfx("combo");
    if (B.full) camp();
  }
  const word = currentWave()[B.mi];
  B.mon = makeMonster(word);
  renderBattle();
  askMob();
  if (B.mi === 0 && B.wave > 0) {
    if (B.full && B.rematch && B.wave === B.waves.length - 1) log(currentWave().length === 1 ? "A palavra que escapou voltou! É a última chance de recolhê-la." : `As ${currentWave().length} palavras que escaparam voltaram! É a última chance de recolhê-las.`, "bad");
    else if (B.full) log(`Onda ${B.wave + 1} de ${B.waves.length}. ${B.campMsg || ""}`, "ok");
    else log(`Onda ${B.wave + 1} de ${B.waves.length}!`, "ok");
  }
}

/** Acampamento entre as ondas da caçada completa: recupera um pouco de vida */
function camp() {
  const healed = Math.min(Math.round(maxHP() * 0.15), maxHP() - B.hp);
  B.campMsg = "";
  if (healed > 0) {
    B.hp += healed;
    B.campMsg = `Acampamento: +${healed} de vida.`;
    if (A) A.heal = performance.now() / 1000;
  }
}

/** Placar da caçada completa */
const fullLabel = () => `Recolhidas ${B.caught.size}/${B.fullTotal}`;

/**
 * Criatura de uma palavra. A figura vem das criaturas da região (ficha do capítulo).
 * Palavra já errada ou de lição anterior pode vir como elite (3 golpes); às vezes
 * vem uma veloz, que foge com a palavra se você demorar.
 */
function makeMonster(word, rand = Math.random()) {
  const term = getTerm(word.item);
  let seed = 0;
  for (let i = 0; i < term.length; i++) seed = (seed * 31 + term.charCodeAt(i)) % 9973;
  const pool = (B.meta.creatures && B.meta.creatures.length) ? B.meta.creatures : ["imp", "wraith", "dragon"];
  const mon = { word, term, label: headTerm(term), hp: 2, max: 2, seed, dead: false, type: "normal" };
  mon.sp = pool[(seed + B.mi + B.wave) % pool.length];
  const entry = S.stats[term] || {};
  const weak = entry.x > 0 && (entry.s || 0) < 3;
  const firstWave = !B.dungeon && B.index === 0 && B.wave === 0;
  if ((weak || word.old) && rand < 0.55 && !B.full) {
    mon.type = "elite";
    mon.hp = mon.max = 3;
  } else if (rand > 0.84 && !firstWave) {
    mon.type = "fast";
  }
  if (!S.seen[mon.sp]) {
    S.seen[mon.sp] = 1;
    save();
  }
  return mon;
}

function monsterName() {
  if (B.boss) return B.meta.boss;
  const mon = B.mon;
  if (!mon) return "";
  const { name } = speciesName(AppState.language, mon.sp);
  if (mon.type === "elite") return `${name} de elite`;
  if (mon.type === "fast") return `${name} veloz`;
  return mon.word.old ? `${name} antigo` : name;
}

function bossProgressLabel() {
  if (B.rush) return `Palavra ${Math.min(B.ri + 1, B.rush.length)} de ${B.rush.length}`;
  return `Frase ${Math.min(B.si + 1, B.sents.length)} de ${B.sents.length}`;
}

function battleShell(inner) {
  const cls = clsInfo();
  const mon = B.mon;
  return `<div class="sc-card sc-card--battle">
    <div class="sc-stage"><canvas id="sc-arena" aria-label="Arena de batalha"></canvas>
      <div class="sc-hudtop">
        <div class="sc-hudbox"><b>${esc(cls.name)} · nível ${S.lvl}</b>
          <div class="sc-bar sc-bar--hp"><i id="sc-hero-hp" style="width:${(B.hp / maxHP()) * 100}%"></i></div>
          <span id="sc-hero-hp-text">${B.hp}/${maxHP()}</span></div>
        <div class="sc-hudbox sc-hudbox--right"><b>${esc(monsterName())}</b>
          <div class="sc-bar ${B.boss ? "sc-bar--boss" : "sc-bar--hp"}"><i id="sc-mon-hp" style="width:${mon ? (mon.hp / mon.max) * 100 : 0}%"></i></div>
          <span id="sc-mon-info">${B.boss ? bossProgressLabel() : B.full ? `Onda ${B.wave + 1}/${B.waves.length} · ${fullLabel()}` : `Onda ${B.wave + 1}/${B.waves.length} · ${B.mi + 1}/${currentWave().length}`}</span></div>
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
  on("#sc-flee", () => {
    if (B) clearTimeout(B.fleeT);
    showMap();
  });
}

function log(html, tone) {
  const node = $("#sc-log");
  if (!node) return;
  node.className = `sc-log${tone ? ` is-${tone}` : ""}`;
  node.innerHTML = html;
}

/** Na metade da vida o guardião entra em fúria: bate 25% mais forte e treme a arena */
function checkRage() {
  if (!B || !B.boss || B.rage || !B.mon || B.mon.dead || B.mon.hp <= 0 || B.mon.hp > B.mon.max / 2) return;
  B.rage = true;
  const t = performance.now() / 1000;
  if (A) {
    A.shake = reduceMotion() ? 0 : t + 0.7;
    A.flash = t + 0.3;
  }
  announce("Fúria", "boss", B.meta.boss);
  sfx("wall");
  log(`Fúria! ${esc(B.meta.boss)} agora bate 25% mais forte.`, "bad");
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
  checkRage();
}

function stopTimer() {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(timerId);
  timerId = 0;
}

/**
 * Barra de tempo da pergunta. Nas criaturas, responder antes de ela acabar é
 * golpe crítico. Em criaturas e guardiões, quando ela acaba o inimigo ataca
 * (dano e animação) e a barra recomeça, sem crítico, até a resposta vir.
 * @param {number} seconds duração da barra
 * @param {{crit?: boolean}} [opts] crit: a primeira barra vale golpe crítico
 */
function startTimer(seconds, { crit = true } = {}) {
  B.t0 = performance.now();
  B.crit = crit ? seconds : 0;
  B.qid = (B.qid || 0) + 1;
  const qid = B.qid;
  stopTimer();
  const tick = () => {
    if (!B || B.qid !== qid || !isOpen()) return;
    const bar = $("#sc-timer i");
    const left = 1 - (performance.now() - B.t0) / 1000 / seconds;
    if (bar) {
      bar.style.width = `${Math.max(0, left * 100)}%`;
      bar.parentElement.classList.toggle("is-late", B.crit === 0);
    }
    if (left > 0) {
      timerId = requestAnimationFrame(tick);
      return;
    }
    // Resposta sendo conferida, criatura fugindo ou herói caído: a próxima pergunta traz barra nova
    if (B.lock || !B.mon || B.mon.dead || B.hp <= 0) return;
    timeAttack();
    if (!B || B.qid !== qid || B.lock || B.hp <= 0) return;
    B.t0 = performance.now();
    B.crit = 0;
    timerId = requestAnimationFrame(tick);
  };
  tick();
}

/** O tempo acabou: o inimigo ataca */
function timeAttack() {
  const damage = B.boss ? bossDamage(B.index, B.total, B.meta) : B.dungeon ? B.dmg : monsterDamage(B.index, B.total);
  log(`O tempo acabou: ${esc(B.boss ? B.meta.boss : monsterName().toLowerCase())} atacou! Responda para revidar.`, "bad");
  hurt(damage);
}

/** Tempo das perguntas do guardião (um pouco mais que o das criaturas) */
const bossWindow = (typed) => P().crit * 1.6 * (typed ? TYPING_CRIT_FACTOR : 1);
const TIMER_BAR = `<div class="sc-timer" id="sc-timer" title="Responda antes da barra acabar ou o inimigo ataca"><i></i></div>`;

/* ---------- Tocar ou digitar ---------- */

function isTypingPreferred() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(TYPING_KEY) === "1";
  } catch (_) {
    return false;
  }
}

/** A pergunta atual é digitada? A dica troca uma pergunta digitada por alternativas (B.choiceOnce) */
const typedNow = () => isTypingPreferred() && !!B && !B.choiceOnce;

function refreshInputModeButton() {
  const btn = typeof document !== "undefined" ? document.getElementById("sc-input-mode") : null;
  if (!btn) return;
  btn.textContent = isTypingPreferred() ? "Resposta: digitar" : "Resposta: tocar";
  btn.setAttribute("aria-pressed", String(isTypingPreferred()));
}

/** Redesenha a pergunta em curso, depois de trocar o modo de resposta ou de usar uma dica */
function rerenderQuestion() {
  if (!B || B.lock || !$("#sc-cmd")) return;
  if (!B.boss) askMob();
  else if (B.rush) rushTurn();
  else bossTurn();
}

function toggleTyping() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(TYPING_KEY, isTypingPreferred() ? "0" : "1");
  } catch (_) {}
  refreshInputModeButton();
  if (B) B.choiceOnce = false;
  rerenderQuestion();
}

function typedForm(placeholder, { area = false } = {}) {
  const field = area
    ? `<textarea id="sc-typed-input" class="sc-typed__input sc-typed__input--area" rows="2" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"></textarea>`
    : `<input type="text" id="sc-typed-input" class="sc-typed__input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">`;
  return `<form class="sc-typed" id="sc-typed">${field}<button type="submit" class="sc-btn">${area ? "Desferir golpe" : "Golpear"}</button></form>`;
}

function bindTyped(handler) {
  const form = $("#sc-typed");
  const input = $("#sc-typed-input");
  if (!form || !input) return;
  const submit = () => {
    const value = input.value.trim();
    if (value && B && !B.lock) handler(value, input);
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    submit();
  };
  // Na caixa de frase, Enter envia e Shift+Enter quebra a linha
  input.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && input.tagName === "TEXTAREA") {
      e.preventDefault();
      submit();
    }
  };
  try { input.focus({ preventScroll: true }); } catch (_) { input.focus(); }
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
  const step = B.mon.max - B.mon.hp;
  // Significado no primeiro golpe e no terceiro (elite); no outro, o termo original
  const first = step % 2 === 0;
  B.lock = false;
  B.dir = first ? "forward" : "reverse";
  B.opts = buildChoiceOptions(word.item, AppState.chapters, { direction: B.dir });
  const cmd = $("#sc-cmd");
  if (!cmd) return;
  // Só o primeiro golpe pode ser digitado: no golpe final a resposta é o termo original
  const typed = first && typedNow();
  cmd.innerHTML = `<div class="sc-prompt">${first
    ? `<div class="sc-q">Ataque: o que significa?</div><div class="sc-prompt__term ${termClass()}">${esc(B.mon.term)}</div>`
    : `<div class="sc-q">Golpe final: qual é a palavra para</div><div class="sc-prompt__pt">${esc(word.item.translations.join(" / "))}</div>`}</div>
    <div class="sc-timer" id="sc-timer" title="Responda antes da barra acabar: golpe crítico. Se ela acabar, a criatura ataca"><i></i></div>
    ${typed ? typedForm("Digite a tradução…") : optionButtons(B.opts.map((o) => o.text), { asTerm: !first })}`;
  if (typed) bindTyped(answerMobTyped);
  else bindOptions(answerMob);
  startTimer(P().crit * (typed ? TYPING_CRIT_FACTOR : 1));
  armFlee(typed);
  if (B.mon.type === "elite" && step === 0) log("Criatura de elite: são 3 golpes para vencer.", "bad");
}

/** A criatura veloz foge com a palavra se a resposta demorar (5 s tocando, 10 s digitando) */
function armFlee(typed) {
  clearTimeout(B.fleeT);
  const mon = B.mon;
  if (mon.type !== "fast") return;
  mon.qn = (mon.qn || 0) + 1;
  const qn = mon.qn;
  const seconds = typed ? 10 : 5;
  B.fleeT = setTimeout(() => {
    if (B && B.mon === mon && mon.qn === qn && !B.lock && !mon.dead) fleeMob();
  }, seconds * 1000);
  if (mon.max - mon.hp === 0) log(`Criatura veloz! Ela foge em ${seconds} s se você demorar.`, "bad");
}

function fleeMob() {
  const mon = B.mon;
  B.lock = true;
  mon.dead = true;
  A.deathT = performance.now() / 1000 + 0.6;
  stat(mon.term, false);
  recordAnswer(mon.term, false);
  save();
  sfx("wall");
  if (B.full && !B.rematch) B.escaped.push(mon.word);
  log(`A criatura veloz fugiu com a palavra: ${orig(mon.term)} = ${esc(mon.word.item.translations.join(" / "))}. ${B.full && !B.rematch ? "Ela volta no fim da caçada." : "Ela foi para a Masmorra."}`, "bad");
  setTimeout(() => {
    if (!B) return;
    B.mi++;
    nextMonster();
  }, 1100);
}

function answerMob(k) {
  if (!B || B.lock || !B.opts[k]) return;
  const option = B.opts[k];
  const buttons = document.querySelectorAll("#sc-screen .sc-opt");
  if (option.isCorrect) {
    buttons[k].classList.add("is-ok");
    mobHit();
  } else {
    buttons[k].classList.add("is-bad");
    buttons[k].disabled = true;
    const wrongGloss = esc((option.translations || []).join(" / "));
    mobMiss(B.dir === "forward"
      ? `Errou! “${esc(option.text)}” é ${orig(option.term)}. A criatura contra-ataca.`
      : `Errou! ${orig(option.term)} é “${wrongGloss}”. A criatura contra-ataca.`);
  }
}

function answerMobTyped(value, input) {
  const { word, term } = B.mon;
  if (evaluateAnswer(value, word.item.translations).status !== "incorrect") {
    input.disabled = true;
    mobHit();
    return;
  }
  // Depois do erro a resposta aparece: digitá-la é o que fixa
  input.value = "";
  mobMiss(`Errou! Não é “${esc(value)}”. ${orig(term)} = ${esc(word.item.translations.join(" / "))}. Digite para continuar.`);
}

function mobHit() {
  const { word, term } = B.mon;
  B.lock = true;
  clearTimeout(B.fleeT);
  B.choiceOnce = false;
  const crit = (performance.now() - B.t0) / 1000 < B.crit;
  B.mon.hp = Math.max(0, B.mon.hp - (crit ? 2 : 1));
  stat(term, true);
  recordAnswer(term, true);
  heroStrike(crit ? 24 : 12, crit);
  sfx("hit", crit ? 4 : 1);
  updateBars();
  log(`${crit ? "Golpe crítico!" : "Acertou!"} ${orig(term)} = ${esc(word.item.translations.join(" / "))}`, "ok");
  setTimeout(() => {
    if (!B || !B.mon) return;
    if (B.mon.hp <= 0) killMob(crit);
    else askMob();
  }, crit ? 750 : 600);
}

function mobMiss(message) {
  const { term } = B.mon;
  B.mon.missed = true;
  stat(term, false);
  recordAnswer(term, false);
  log(message, "bad");
  hurt(B.dungeon ? B.dmg : monsterDamage(B.index, B.total));
}

function killMob(crit) {
  const stats = P();
  const fx = fxApi();
  if (fx && A && !reduceMotion()) {
    const t = performance.now() / 1000;
    const letters = fx.lettersOf(B.mon.label || B.mon.term);
    A.letters = A.letters.concat(letters.map((ch, i) => ({ ch, i, n: letters.length, t0: t + i * 0.07 })));
    A.pose = { k: "win", t0: t + 0.15, d: 0.7 };
  }
  B.mon.dead = true;
  A.deathT = performance.now() / 1000 + 0.6;
  sfx("combo");
  let fullNote = "";
  if (B.full) {
    // Errou antes de vencer: a palavra conta como vista, mas volta no fim para ser recolhida sem erro
    if (B.mon.missed && !B.rematch) {
      B.escaped.push(B.mon.word);
      fullNote = " Ela volta no fim para ser recolhida sem erro.";
    } else if (B.mon.missed) {
      fullNote = " Errada de novo: ela fica para a Masmorra.";
    } else {
      B.caught.add(B.mon.term);
      fullNote = ` ${fullLabel()}.`;
    }
  }
  const bonus = B.mon.type === "elite" ? 8 : B.mon.type === "fast" ? 5 : 0;
  const xp = gainXP(12 + (B.mon.word.old ? 4 : 0) + (crit ? stats.critXP : 0) + bonus);
  S.kills[B.mon.sp] = (S.kills[B.mon.sp] || 0) + 1;
  let drop = "";
  if (B.mon.type === "elite") {
    const healed = Math.min(10, maxHP() - B.hp);
    if (healed > 0) {
      B.hp += healed;
      fxText(`+${healed}`, "#5fd394");
      updateBars();
      drop += " A elite deixou 10 de vida.";
    }
  }
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
      drop += " Caiu um óleo de cura!";
    } else {
      S.scrolls++;
      drop += " Caiu um pergaminho de dica!";
    }
    save();
  }
  log(`Criatura vencida: ${orig(B.mon.term)} = ${esc(B.mon.word.item.translations.join(" / "))} · +${xp} XP.${drop}${fullNote}`, "ok");
  setTimeout(() => {
    if (!B) return;
    B.mi++;
    nextMonster();
  }, 950);
}

function hurt(damage) {
  const stats = P();
  if (B.boss && B.rage) damage = Math.round(damage * 1.25);
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
  sting("defeat");
  announce("Você caiu", "lose");
  stopTimer();
  cancelAnimationFrame(frameId);
  const index = B.index;
  const dungeon = !!B.dungeon;
  const full = !!B.full;
  B = null;
  if (dungeon) {
    setScreen(`<div class="sc-card sc-card--center">
      <h3 class="sc-h">Você caiu na masmorra</h3>
      <p class="sc-story">As palavras fracas continuam lá embaixo, esperando. Nível, XP e relíquias continuam.</p>
      <div class="sc-row"><button type="button" class="sc-btn" id="sc-retry">Descer de novo</button>
        <button type="button" class="sc-btn sc-btn--ghost" id="sc-map">Mapa</button></div>
    </div>`);
    on("#sc-retry", startDungeon);
    on("#sc-map", showMap);
    return;
  }
  setScreen(`<div class="sc-card sc-card--center">
    <h3 class="sc-h">Você caiu</h3>
    <p class="sc-story">A lâmpada se apagou em ${esc(campaign[index].meta.city)}. Nível, XP e relíquias continuam; o capítulo recomeça.</p>
    <div class="sc-row">
      <button type="button" class="sc-btn" id="sc-retry">Tentar de novo</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-reread">Reler o pergaminho</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-map">Mapa</button>
    </div>
  </div>`);
  on("#sc-retry", () => startChapter(index, { full }));
  on("#sc-reread", () => showScroll(index));
  on("#sc-map", showMap);
}

function usePotion() {
  if (!B || S.potions <= 0 || B.hp >= maxHP()) return;
  S.potions--;
  if (A) A.heal = performance.now() / 1000;
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
  if (!B || B.lock || (B.free <= 0 && S.scrolls <= 0)) return;
  const spend = (message) => {
    if (B.free > 0) B.free--;
    else S.scrolls--;
    save();
    const hintBtn = $("#sc-hint");
    if (hintBtn) hintBtn.textContent = hintLabel();
    sfx("tick");
    log(message, "ok");
  };
  // Pergunta digitada: a dica a troca por alternativas (ou pelos pedaços, na frase)
  if ($("#sc-typed")) {
    B.choiceOnce = true;
    rerenderQuestion();
    spend(B.phase === "build" && B.boss ? "A dica trouxe os pedaços da tradução." : "A dica trocou a pergunta por alternativas.");
    return;
  }
  const buttons = Array.from(document.querySelectorAll("#sc-screen .sc-opt"));
  if (!buttons.length) return;
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
  spend("A dica apagou duas respostas erradas.");
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
  music(bossTheme());
  const intro = B.rush
    ? `${esc(B.meta.boss)} desperta e lança <b>${B.rush.length} palavras</b> de uma vez. Aponte o termo certo para cada significado.`
    : `${esc(B.meta.boss)} desperta e guarda <b>${B.sents.length} ${B.sents.length === 1 ? "frase" : "frases"}</b>. Decifre as palavras, responda o golpe de gramática e monte cada tradução.`;
  B.rage = false;
  renderBattle(`<p class="sc-taunt"><b>${esc(B.meta.boss)}${B.meta.bossRef ? ` <small>(${esc(B.meta.bossRef)})</small>` : ""}:</b> ${rich(loreOf(B.index).taunt)}</p>
    <div class="sc-prompt"><div class="sc-q sc-q--strong">${intro}</div></div>
    <div class="sc-scroll sc-scroll--tip"><b>Dica do mestre:</b> ${rich(B.meta.scroll.tip)}</div>
    <div class="sc-row"><button type="button" class="sc-btn" id="sc-fight">Lutar</button></div>`);
  sfx("level");
  transition("#2a0508");
  announce(B.meta.boss, "boss", B.meta.bossRef);
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
  // Na pergunta a palavra aparece sem a pontuação que a acompanha na frase
  const word = `<span class="sc-ask ${termClass()}">${esc(strike.text.replace(/[,.;:·!?]+$/, ""))}</span>`;
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
  // O golpe de gramática é sempre por alternativas; o de palavra pode ser digitado
  const typed = !B.q && typedNow();
  cmd.innerHTML = `${bossLine()}<div class="sc-prompt"><div class="sc-q sc-q--strong">${label}</div></div>${TIMER_BAR}${typed ? typedForm("Digite o significado…") : optionButtons(B.opts)}`;
  if (typed) bindTyped(bossAnswerTyped);
  else bindOptions(bossAnswer);
  startTimer(bossWindow(typed), { crit: false });
}

function bossAnswer(k) {
  if (!B || B.lock || B.opts[k] === undefined) return;
  const buttons = document.querySelectorAll("#sc-screen .sc-opt");
  if (B.opts[k] === B.ans) {
    buttons[k].classList.add("is-ok");
    bossStrikeHit();
  } else {
    buttons[k].classList.add("is-bad");
    buttons[k].disabled = true;
    bossStrikeMiss(`${esc(B.meta.boss)} revida! Olhe o começo e o fim da palavra.`);
  }
}

function bossAnswerTyped(value, input) {
  const strike = B.s.strikes[B.wi];
  if (evaluateAnswer(value, strikeAccepted(strike)).status !== "incorrect") {
    input.disabled = true;
    bossStrikeHit();
    return;
  }
  input.value = "";
  bossStrikeMiss(`${esc(B.meta.boss)} revida! Não é “${esc(value)}”: é “${esc(strike.answer)}”. Digite para continuar.`);
}

function bossStrikeHit() {
  const strike = B.s.strikes[B.wi];
  const vocabTerm = strike.item ? getTerm(strike.item) : null;
  B.lock = true;
  B.choiceOnce = false;
  sfx("hit", 2);
  if (!B.q) {
    recordAnswer(vocabTerm, true);
    B.mon.hp--;
    heroStrike(15, false);
    updateBars();
    if (strike.grammar) {
      B.q = strike.grammar;
      log(`Certo: ${esc(strike.answer)}. Golpe extra de gramática!`, "ok");
      setTimeout(bossTurn, 650);
      return;
    }
  } else {
    recordAnswer(null, true);
    heroStrike(8, true);
    log(`Certo: ${esc(B.q.answer)}.`, "ok");
    gainXP(4);
  }
  B.q = null;
  B.wi++;
  if (B.wi >= B.s.strikes.length) B.phase = "build";
  setTimeout(bossTurn, 650);
}

function bossStrikeMiss(message) {
  const strike = B.s.strikes[B.wi];
  recordAnswer(B.q || !strike.item ? null : getTerm(strike.item), false);
  log(message, "bad");
  hurt(bossDamage(B.index, B.total, B.meta));
}

function bossBuild() {
  const cmd = $("#sc-cmd");
  if (!cmd || !B) return;
  B.opts = [];
  B.built = B.built || [];
  const fresh = B.buildClock !== B.si;
  if (fresh) B.buildClock = B.si;
  if (typedNow()) {
    bossBuildTyped(cmd);
    if (fresh) startTimer(buildWindow(true), { crit: false });
    return;
  }
  const { bank, chunks } = B.s;
  cmd.innerHTML = `${bossLine()}
    <div class="sc-prompt"><div class="sc-q sc-q--strong">Golpe da frase: monte a tradução</div></div>
    ${TIMER_BAR}
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
    if (isBuildCorrect(got, chunks)) {
      sentenceHit();
      return;
    }
    const box = $("#sc-build");
    if (box) {
      box.classList.add("is-bad", "sc-shake");
      setTimeout(() => box.classList.remove("sc-shake"), 300);
    }
    const firstBad = got.findIndex((text, i) => normalizeText(text) !== normalizeText(chunks[i] || ""));
    document.querySelectorAll("#sc-build .sc-chip").forEach((chip, i) => {
      if (i === firstBad) chip.classList.add("is-wrong");
    });
    sentenceMiss(got.length < chunks.length && firstBad === -1
      ? "Falta pedaço: toda palavra da frase precisa aparecer."
      : "A ordem ou um pedaço não bate. O destacado é o primeiro problema.");
  });
  if (fresh) startTimer(buildWindow(false), { crit: false });
}

/** Tempo para montar a frase: cresce com o número de pedaços */
function buildWindow(typed) {
  const pieces = (B.s && B.s.chunks ? B.s.chunks.length : 4);
  return Math.max(18, pieces * 4.5) * (typed ? 1.5 : 1);
}

/** Golpe da frase digitado: o aluno escreve a tradução inteira */
function bossBuildTyped(cmd) {
  const { sentence } = B.s;
  cmd.innerHTML = `${bossLine()}
    <div class="sc-prompt"><div class="sc-q sc-q--strong">Golpe da frase: digite a tradução</div></div>
    ${TIMER_BAR}
    ${typedForm("Tradução da frase…", { area: true })}
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-use-chips">Montar com pedaços</button></div>`;
  on("#sc-use-chips", () => {
    B.choiceOnce = true;
    bossBuild();
  });
  bindTyped((value, input) => {
    if (evaluateAnswer(value, sentence.translations, { isSentence: true }).status !== "incorrect") {
      input.disabled = true;
      sentenceHit();
      return;
    }
    // Sem entregar a resposta: diz quanto da tradução já bate
    const diff = compareSentenceWords(value, sentence.translations);
    const matched = diff ? diff.expectedWords.filter((w) => w.matched).length : 0;
    const total = diff ? diff.expectedWords.length : 0;
    sentenceMiss(`Ainda não: ${matched} de ${total} palavras batem com a tradução esperada. Corrija ou monte com pedaços.`);
  });
}

function sentenceHit() {
  const { sentence } = B.s;
  recordAnswer(null, true);
  B.lock = true;
  B.choiceOnce = false;
  B.mon.hp--;
  updateBars();
  heroStrike(30, true);
  sfx("level");
  log(`Frase vencida: “${esc(preferredGloss(sentence.translations))}”`, "ok");
  setTimeout(() => {
    if (!B) return;
    B.si++;
    B.built = [];
    if (B.si >= B.sents.length) return bossDown();
    B.s = B.sents[B.si];
    B.buildClock = -1;
    B.wi = 0;
    B.q = null;
    B.phase = B.s.strikes.length ? "word" : "build";
    bossTurn();
  }, 1100);
}

function sentenceMiss(message) {
  recordAnswer(null, false);
  log(message, "bad");
  hurt(bossDamage(B.index, B.total, B.meta));
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
    <div class="sc-prompt__pt">${esc(item.translations.join(" / "))}</div></div>${TIMER_BAR}${optionButtons(B.opts.map((o) => o.text), { asTerm: true })}`;
  startTimer(bossWindow(false), { crit: false });
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
      heroStrike(15, false);
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
      hurt(bossDamage(B.index, B.total, B.meta));
    }
  });
}

function bossDown() {
  B.mon.dead = true;
  B.mon.hp = 0;
  updateBars();
  A.deathT = performance.now() / 1000 + 0.8;
  music(null);
  sting("victory");
  announce("Guardião vencido", "win", B.meta.boss);
  const index = B.index;
  const total = B.total;
  const sentences = B.sents.map((s) => s.sentence);
  const chapterId = B.chapter.id;
  S.done[chapterId] = true;
  S.potions++;
  const full = B.full ? { caught: B.caught.size, total: B.fullTotal } : null;
  const fullDone = !!full && full.caught >= full.total;
  const firstSeal = fullDone && !S.full[chapterId];
  if (fullDone) S.full[chapterId] = true;
  const xp = gainXP(60 + Math.max(sentences.length, 1) * 6 + (full ? full.caught * 2 : 0) + (firstSeal ? 40 : 0));
  const relic = relicFor(S.cls, chapterId);
  let newRelic = null;
  if (relic && !S.relics.includes(relic.id)) {
    S.relics.push(relic.id);
    newRelic = relic;
  }
  // Livro fechado: todos os capítulos dele vencidos e o final ainda não lido
  const book = bookOf(index);
  const bookClosed = campaign.filter((c) => c.meta.book === book).every((c) => S.done[c.chapter.id]) && !S.story[`e${book}`];
  save();
  setTimeout(() => {
    if (!isOpen()) return;
    cancelAnimationFrame(frameId);
    B = null;
    music("map");
    const next = campaign[index + 1];
    setScreen(`<div class="sc-card sc-card--center">
      <span class="sc-muted">Guardião vencido: ${esc(campaign[index].meta.boss)}</span>
      <div class="sc-big">Capítulo ${index + 1} completo</div>
      <blockquote class="sc-fragment"><span class="sc-fragment__label">Trecho devolvido ao ${isHebrew() ? "rolo" : "códice"}</span>${rich(loreOf(index).epilogue)}</blockquote>
      ${newRelic ? `<div class="sc-relicdrop"><span class="sc-muted">Relíquia encontrada</span><b>${esc(newRelic.name)}</b><span>${esc(newRelic.ref)} · ${esc(newRelic.desc)}</span><em>${esc(Lore.RELIC_LORE[newRelic.id] || "")}</em></div>` : ""}
      ${full ? `<div class="sc-fullresult${fullDone ? " is-done" : ""}"><b>${fullDone ? "Selo da caçada completa" : "Caçada completa"}</b>
        <span>${full.caught} de ${full.total} palavras recolhidas${fullDone ? (firstSeal ? " · selo novo no mapa" : "") : ". As que ficaram foram para a Masmorra; tente de novo para ganhar o selo."}</span></div>` : ""}
      <p class="sc-muted">+${xp} XP · +1 óleo de cura</p>
      ${sentences.length ? `<details class="sc-review"><summary>Rever as ${sentences.length} frases do guardião</summary>
        <div class="sc-revlist">${sentences.map((s) => `<div><span class="sc-revlist__term ${termClass()}" dir="${isHebrew() ? "rtl" : "ltr"}">${esc(getTerm(s))}</span>
          <span>“${esc(preferredGloss(s.translations))}”</span></div>`).join("")}</div></details>` : ""}
      <div class="sc-row">${bookClosed
        ? `<button type="button" class="sc-btn" id="sc-ending">Fechar o livro</button>`
        : next
          ? `<button type="button" class="sc-btn" id="sc-next">Seguir para ${esc(next.meta.city)}</button>`
          : ""}
        <button type="button" class="sc-btn sc-btn--ghost" id="sc-again">Refazer capítulo</button>
        <button type="button" class="sc-btn sc-btn--ghost" id="sc-map">Mapa</button></div>
    </div>`);
    if (newRelic) setTimeout(() => sting("relic"), 1500);
    on("#sc-ending", () => showEnding(book));
    on("#sc-next", () => showScroll(index + 1));
    void total;
    on("#sc-again", () => startChapter(index, { full: !!full }));
    on("#sc-map", showMap);
  }, 1100);
}

/* ============================ Masmorra, bestiário e desempenho ============================ */

const DUNGEON_WORDS = 12;
const DUNGEON_META = {
  city: "Masmorra", native: "", scene: "dungeon", book: 0, boss: "", creatures: ["skel", "wraith", "raven"],
  scroll: { t: "Palavras fracas" },
};

/** Palavras que o aluno errou e ainda não acertou três vezes seguidas, de todo o material do idioma */
function weakWords() {
  const seen = new Set();
  const list = [];
  campaign.forEach(({ chapter }) => {
    wordsOf(chapter).forEach((item) => {
      const term = getTerm(item);
      const entry = S.stats[term];
      if (!seen.has(term) && entry && entry.x > 0 && (entry.s || 0) < 3) {
        seen.add(term);
        list.push(item);
      }
    });
  });
  return list;
}

/** Masmorra: só as palavras fracas, sem guardião. Três acertos seguidos tiram a palavra de lá. */
function startDungeon() {
  transition("#0b0612");
  const words = shuffleArray(weakWords()).slice(0, DUNGEON_WORDS).map((item) => ({ item, old: false }));
  if (!words.length) return showMap();
  const stats = P();
  const waves = [];
  for (let i = 0; i < words.length; i += 4) waves.push(words.slice(i, i + 4));
  const done = Math.max(1, doneCount(S));
  B = {
    index: 0, chapter: { id: "masmorra", title: "Masmorra", sentences: [] }, meta: DUNGEON_META, total: campaign.length,
    dungeon: true, dmg: monsterDamage(Math.min(done, campaign.length) - 1, campaign.length),
    waves, wave: 0, mi: 0, hp: stats.hp, boss: false, mon: null, lock: false, q: null,
    free: stats.hints, ward: stats.ward, revive: stats.revive, count: words.length,
  };
  A = freshArena();
  const g = gfx();
  if (g) g.resetEmbers();
  music("boss");
  nextMonster();
  log(`Masmorra: ${words.length} ${words.length === 1 ? "palavra fraca" : "palavras fracas"}. Cada acerto seguido aproxima a palavra da saída.`, "ok");
}

function dungeonDone() {
  const count = B.count;
  const xp = gainXP(10 + count * 3);
  const left = weakWords().length;
  cancelAnimationFrame(frameId);
  B = null;
  music("map");
  sting("victory");
  setScreen(`<div class="sc-card sc-card--center">
    <span class="sc-muted">Masmorra limpa</span>
    <div class="sc-big">${count} ${count === 1 ? "palavra enfrentada" : "palavras enfrentadas"}</div>
    <p class="sc-muted">+${xp} XP · ${left ? `${left} ${left === 1 ? "palavra ainda fraca" : "palavras ainda fracas"} (cada uma sai com três acertos seguidos)` : "nenhuma palavra fraca restante"}</p>
    <div class="sc-row">${left ? `<button type="button" class="sc-btn" id="sc-again">Descer de novo</button>` : ""}
      <button type="button" class="sc-btn${left ? " sc-btn--ghost" : ""}" id="sc-map">Mapa</button></div>
  </div>`);
  on("#sc-again", startDungeon);
  on("#sc-map", showMap);
}

/** Bestiário: criaturas da região com versículo, e os guardiões já vencidos */
function showBestiary() {
  transition();
  B = null;
  stopTimer();
  music("scroll");
  const lang = AppState.language === "greek" ? "greek" : "hebrew";
  const species = Object.keys(SPECIES[lang] || SPECIES.hebrew);
  const bosses = campaign.filter(({ chapter }) => S.done[chapter.id]);
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Bestiário</h3>
    <p class="sc-muted">Criaturas que você já encontrou e quantas venceu. Cada uma tem um versículo de onde o jogo tirou a figura.</p>
    <div class="sc-beasts">${species.map((sp) => {
      const { name, ref } = speciesName(lang, sp);
      const known = !!S.seen[sp];
      return `<div class="sc-beast${known ? "" : " is-unknown"}">${known ? `<canvas class="sc-beast__cv" id="sc-beast-${sp}" width="96" height="96" aria-hidden="true"></canvas>` : `<span class="sc-beast__cv sc-beast__cv--blank" aria-hidden="true">?</span>`}
        <b>${known ? esc(name) : "???"}</b><span>${known ? esc(ref) : "ainda não vista"}</span><em>${S.kills[sp] || 0} vencidas</em></div>`;
    }).join("")}</div>
    <h4 class="sc-h">Guardiões (${bosses.length} de ${campaign.length} vencidos)</h4>
    <div class="sc-beasts sc-beasts--bosses">${campaign.map(({ chapter, meta }, i) => {
      const won = !!S.done[chapter.id];
      return `<div class="sc-beast${won ? "" : " is-unknown"}">${won ? `<canvas class="sc-beast__cv" id="sc-boss-${i}" width="96" height="96" aria-hidden="true"></canvas>` : `<span class="sc-beast__cv sc-beast__cv--blank" aria-hidden="true">?</span>`}
        <b>${won ? esc(meta.boss) : "???"}</b><span>${won ? esc(meta.bossRef || "") : `Capítulo ${i + 1}`}</span><em>${esc(meta.city)}</em></div>`;
    }).join("")}</div>
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Mapa</button></div>
  </div>`);
  on("#sc-back", showMap);
  const g = gfx();
  if (!g) return;
  species.filter((sp) => S.seen[sp]).forEach((sp) => paintThumb(`sc-beast-${sp}`, (ctx, w, h, t) => g.drawMobSprite(ctx, sp, w * 0.5, h * 0.9, 24, t, false, false, 3, w)));
  campaign.forEach(({ chapter, meta }, i) => {
    if (S.done[chapter.id]) paintThumb(`sc-boss-${i}`, (ctx, w, h, t) => drawBoss(g, ctx, meta.bossKind, w * 0.5, h * 0.94, 0.5, t, false, false, w));
  });
}

/** Guardião pelo tipo da ficha: os do Livro II e do grego têm figura própria (scribe-bosses.js) */
function drawBoss(g, ctx, kind, x, gy, scale, t, flash, breath, W) {
  const bosses = typeof window !== "undefined" ? window.ScribeBosses : null;
  if (bosses && bosses.draw(ctx, kind, x, gy, scale, t, flash, breath, W)) return;
  g.drawBossKind(ctx, kind || "golias", x, gy, scale, t, flash, breath, W);
}

/** Retrato parado de criatura ou guardião, com a mesma paleta e contorno da arena */
function paintThumb(id, draw) {
  const g = gfx();
  const canvas = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!g || !canvas) return;
  const px = 2;
  const w = canvas.width;
  const h = canvas.height;
  const lw = Math.ceil(w / px);
  const lh = Math.ceil(h / px);
  const low = g.buf("thumb", lw, lh);
  const lc = low.getContext("2d");
  const spr = g.buf("thumb-spr", lw, lh);
  const sc = spr.getContext("2d");
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.fillStyle = "#1b2338";
  lc.fillRect(0, 0, lw, lh);
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.clearRect(0, 0, lw, lh);
  sc.setTransform(1 / px, 0, 0, 1 / px, 0, 0);
  draw(sc, w, h, 1.2);
  sc.setTransform(1, 0, 0, 1, 0, 0);
  g.outlineOnto(lc, spr, "#0b0612");
  g.quantize(lc, lw, lh);
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, w, h);
  c.drawImage(low, 0, 0, lw, lh, 0, 0, w, h);
}

/** Desempenho: acertos, erros e as palavras que mais custam */
function showStats() {
  transition();
  B = null;
  stopTimer();
  music("scroll");
  const rows = Object.entries(S.stats).filter(([, e]) => e && (e.r || e.x));
  const right = rows.reduce((sum, [, e]) => sum + (e.r || 0), 0);
  const wrong = rows.reduce((sum, [, e]) => sum + (e.x || 0), 0);
  const total = right + wrong;
  const hardest = rows.filter(([, e]) => e.x > 0).sort((a, b) => (b[1].x - (b[1].s || 0)) - (a[1].x - (a[1].s || 0)) || b[1].x - a[1].x).slice(0, 12);
  setScreen(`<div class="sc-card">
    <h3 class="sc-h">Desempenho</h3>
    <div class="sc-stats sc-stats--big">
      <span>Respostas <b>${total}</b></span><span>Acertos <b>${total ? Math.round((right / total) * 100) : 0}%</b></span>
      <span>Palavras vistas <b>${rows.length}</b></span><span>Palavras fracas <b>${weakWords().length}</b></span>
      <span>Capítulos <b>${doneCount(S)}/${campaign.length}</b></span>
    </div>
    ${hardest.length ? `<h4 class="sc-h">As que mais custam</h4><div class="sc-revlist">${hardest.map(([term, e]) => `<div><span class="sc-revlist__term ${termClass()}" dir="${isHebrew() ? "rtl" : "ltr"}">${esc(term)}</span>
      <span>${e.r || 0} acertos · ${e.x} erros${(e.s || 0) >= 3 ? " · dominada" : ""}</span></div>`).join("")}</div>` : `<p class="sc-muted">Ainda sem erros registrados.</p>`}
    <div class="sc-row"><button type="button" class="sc-btn sc-btn--ghost" id="sc-back">Mapa</button></div>
  </div>`);
  on("#sc-back", showMap);
}

/* ============================ Arena ============================ */

const PX = 2;

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
  g.setEnvironment({ relics: new Set(S.relics), darkSky: !!(B.boss || B.dungeon) });
  g.paintBG(lc, W, H, B.meta.scene, B.boss || B.dungeon ? 3 : B.index, t);
  g.sceneFX(lc, W, H, B.meta.scene, t, B.boss);
  if (B.boss) {
    lc.fillStyle = "rgba(140,10,0,.2)";
    lc.fillRect(0, 0, W, H);
  }
  const groundY = H * 0.86;
  const scale = Math.min(1.25, H / 210);
  const lunge = (who) => (A.lunge.who === who && A.lunge.t > t ? W * 0.13 * Math.sin(((A.lunge.t - t) / 0.28) * Math.PI) : 0);
  const fx = fxApi();
  const pose = fx ? fx.heroPose(A.pose, t) : { rot: 0, dx: 0, dy: 0 };
  sc.save();
  sc.translate(W * 0.18 + lunge("hero") + pose.dx, groundY + pose.dy);
  sc.rotate(pose.rot);
  drawHeroFor(g, sc, 0, 0, fx ? fx.heroScale(W, scale) : scale * 1.3, t, A.heroFlash > t, S.cls, true);
  sc.restore();
  let monsterX = 0;
  if (B.mon && (!B.mon.dead || A.deathT > t)) {
    const mon = B.mon;
    if (mon.dead && mon.type === "fast" && !mon.fled) mon.fled = t;
    const flash = A.monFlash > t;
    const breath = A.lunge.who === "mon" && A.lunge.t > t;
    monsterX = W * 0.72 - lunge("mon");
    sc.globalAlpha = mon.dead ? Math.max(0, (A.deathT - t) / 0.6) : 1;
    if (B.boss) {
      if (B.rage) g.rageAura(sc, monsterX, groundY, scale, t);
      drawBoss(g, sc, B.meta.bossKind, monsterX, groundY, scale * (B.rage ? 1.08 : 1), B.rage ? t * 1.5 : t, flash, breath, W);
    } else {
      g.drawMob(sc, mon, monsterX, groundY, scale, t, flash, breath, W);
    }
    sc.globalAlpha = 1;
  }
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.outlineOnto(lc, sprites, "#0b0612");
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  if (g.fgFX) g.fgFX(lc, W, H, B.meta.scene, t);
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
  if (fx) {
    fx.drawProj(lc, A, W, H, groundY, scale, t);
    fx.drawHeal(lc, A, W, H, groundY, scale, t);
    fx.drawEnemyFX(lc, A, W, H, groundY, scale, t, monsterX, !!(B.boss && B.rage));
  }
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
    c.font = isHebrew() ? '700 22px "SBL Hebrew", "Ezra SIL", "Noto Sans Hebrew", "David", serif' : '700 19px "Gentium Plus", "SBL Greek", "Galatia SIL", "Palatino Linotype", serif';
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
  if (fx) fx.drawLetters(c, A, W, H, groundY, scale, t, ORIG_FONT());
  A.parts = A.parts.filter((p) => t - p.t0 < p.d);
  A.floats = A.floats.filter((f) => t - f.t0 < 1);
}

function arenaSize() {
  const canvas = typeof document !== "undefined" ? document.getElementById("sc-arena") : null;
  return canvas ? { W: canvas.clientWidth, H: canvas.clientHeight } : null;
}

/**
 * Golpe do herói: o projétil da classe sai do herói e o dano aparece quando ele
 * chega (fogo do profeta e do pescador, luz do guerreiro e do centurião,
 * relâmpago do juiz e do fazedor de tendas)
 */
function heroStrike(damage, crit) {
  const fx = fxApi();
  if (!fx || !A || reduceMotion() || !arenaSize()) return fxHitMonster(damage, crit);
  const kind = fx.attackFor(AppState.language, S.cls);
  const time = fx.ATTACK_TIME[kind];
  const t = performance.now() / 1000;
  A.proj.push({ k: kind, t0: t, d: time.d });
  A.pose = { k: "cast", t0: t, d: 0.35 };
  const mine = A;
  setTimeout(() => {
    if (A === mine) fxHitMonster(damage, crit);
  }, time.hit);
}

function fxHitMonster(damage, crit) {
  const size = arenaSize();
  if (!size || !A) return;
  const t = performance.now() / 1000;
  A.lunge = { who: "hero", t: t + 0.28 };
  A.pose = { k: "atk", t0: t, d: 0.3 };
  if (crit && !reduceMotion()) {
    A.flash = t + 0.09;
    A.shake = t + 0.18;
  }
  A.monFlash = t + 0.15;
  A.floats.push({ txt: `${crit ? "CRÍTICO −" : "−"}${damage}`, x: size.W * 0.72, y: size.H * 0.3, c: crit ? "#e2b04a" : "#fff", t0: t });
  if (reduceMotion()) return;
  const fxMod = fxApi();
  const color = fxMod ? fxMod.ATTACK_COLOR[fxMod.attackFor(AppState.language, S.cls)] : S.cls === "mago" ? "#9fd8ff" : S.cls === "assassino" ? "#e8e2d4" : "#e2b04a";
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
  A.pose = { k: dodged ? "dodge" : "hurt", t0: t, d: 0.4 };
  // Quem ataca de longe (espectro, ídolo, serafim, gafanhoto, corvo e os guardiões) lança um orbe; os outros arranham
  A.eatk = { t0: t, dodged, caster: !!B && (B.boss || (!!B.mon && ["wraith", "idol", "seraph", "locust", "raven"].includes(B.mon.sp))) };
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
    // Digitando, as teclas são texto e não atalhos
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
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
  refreshInputModeButton();
  const a = audio();
  if (a) {
    a.chip.stop();
    a.epic.setFlavor(AppState.language);
  }
  if (!campaign.length) {
    setScreen(`<div class="sc-card sc-card--center"><p class="sc-story">Ainda não há lições com vocabulário suficiente para a aventura.</p></div>`);
    return;
  }
  showMap();
}

/** Encerra a batalha e a música ao sair da tela (voltar ao painel ou trocar de aba) */
function closeScribeChronicles() {
  if (B) clearTimeout(B.fleeT);
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
  relicFor,
  relicsOf,
  booksOf,
  speciesName,
  monsterDamage,
  bossDamage,
  bossSentenceCount,
  heroStats,
  xpNeeded,
  buildWaves,
  buildFullWaves,
  FULL_WAVE,
  buildVocabIndex,
  hebrewStem,
  verbPerson,
  greekTense,
  greekCase,
  grammarQuestion,
  sentenceStrikes,
  strikeOptions,
  strikeAccepted,
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
  // Só nos testes de navegador (tests/e2e): leitura do estado da batalha para o robô jogar
  if (window.__GAMIDA_TEST__) window.__scribeBattle = () => B;
  window.openScribeChronicles = openScribeChronicles;
  window.scribeShowBook = showBook;
  window.scribeToggleTyping = toggleTyping;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeModule;
}
})();
