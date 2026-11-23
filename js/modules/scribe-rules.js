/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: regras
 * ==========================================================================
 * As regras do jogo, sem tela: capítulos, ondas de criaturas, dano, nível,
 * perguntas de gramática do guardião, montagem da tradução e o progresso
 * salvo. O motor (scribe-chronicles.js) usa tudo daqui; os testes de unidade
 * também.
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
    // Lições especiais (como o "Estudo para exame") não são capítulos da história
    .filter((c) => c && !c.special && (c.items || []).filter((i) => getTerm(i) && (i.translations || []).length).length >= MIN_CHAPTER_WORDS)
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
  // "qual?" e "Qual" são a mesma resposta: interrogação e aspas não distinguem alternativas
  const keyOf = (text) => normalizeText(text).replace(/[?¿!¡"“”'‘’]/g, "").trim();
  const own = new Set([keyOf(strike.answer), ...((strike.item && strike.item.translations) || []).map(keyOf)]);
  const seen = new Set(own);
  const wrong = [];
  const consider = (gloss) => {
    const key = keyOf(gloss);
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
  let piece = [];
  words.forEach((word, i) => {
    piece.push(word);
    // Fecha o pedaço no tamanho máximo ou, antes, numa pausa da frase (vírgula, ponto),
    // desde que o resto ainda caiba nos pedaços que sobram
    const rest = words.length - i - 1;
    const slots = MAX_CHUNKS - chunks.length - 1;
    const pause = size > 1 && piece.length >= 2 && /[,;:.!?]$/.test(word) && rest <= slots * size;
    if (piece.length >= size || pause) {
      chunks.push(piece.join(" "));
      piece = [];
    }
  });
  if (piece.length) chunks.push(piece.join(" "));
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


/* ============================ Progresso salvo ============================ */

const FRESH = () => ({
  cls: null, done: {}, lvl: 1, xp: 0, potions: 3, scrolls: 2, relics: [], stats: {},
  seenIntro: false, seenEnding: false, story: {}, seen: {}, kills: {}, full: {},
});
const storageKey = (language) => `gamida_${language || AppState.language}_scribe`;

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

const doneCount = (state) => Object.keys((state && state.done) || {}).length;

const ScribeRules = {
  MIN_CHAPTER_WORDS,
  WORDS_PER_CHAPTER,
  OLD_WORDS,
  BOSS_SENTENCES,
  FINAL_BOSS_SENTENCES,
  RUSH_WORDS,
  STRIKES_PER_SENTENCE,
  MAX_CHUNKS,
  TYPING_CRIT_FACTOR,
  TYPING_KEY,
  STEMS,
  PERSONS,
  TENSES,
  CASES,
  GRAMMAR_GATES,
  CLASSES,
  RELICS,
  BOOKS,
  SPECIES,
  classInfo,
  getChapterMeta,
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
  wordsOf,
  buildWaves,
  buildFullWaves,
  buildVocabIndex,
  tokenAnalysisText,
  isVerbToken,
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
  xpNeeded,
  FULL_WAVE,
  cleanTokenText,
  FRESH,
  storageKey,
  sanitizeProgress,
  loadProgress,
  doneCount,
};

if (typeof window !== "undefined") window.ScribeRules = ScribeRules;
if (typeof module !== "undefined" && module.exports) module.exports = ScribeRules;
})();
