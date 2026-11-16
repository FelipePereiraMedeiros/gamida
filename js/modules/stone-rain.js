/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Chuva de Pedras
 * ==========================================================================
 * Arcade de vocabulário: pedras com palavras caem sobre a muralha e o aluno
 * toca no significado da pedra destacada antes que ela acerte o muro.
 * Usa o vocabulário de todas as lições do idioma ativo (hebraico ou grego).
 */

(function () {
const _stateModule = (typeof require !== "undefined") ? require("./state.js") : (typeof window !== "undefined" ? window : {});
const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm = (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const buildChoiceOptions = (typeof window !== "undefined" && window.buildChoiceOptions) || _stateModule.buildChoiceOptions;
const preferredGloss = (typeof window !== "undefined" && window.preferredGloss) || _stateModule.preferredGloss;

const LIVES = 5;
const WALL_HEIGHT = 46;
// Acertos seguidos para o multiplicador subir, e teto do multiplicador
const COMBO_EVERY = 3;
const COMBO_MAX = 5;
// Acertos para passar de fase
const HITS_PER_LEVEL = 8;
// Mínimo de palavras para haver 4 alternativas distintas
const MIN_DECK = 4;

/* ============================ Regras puras ============================ */

/** Rótulo curto do capítulo para os botões: "III", "12" ou o começo do título */
function chapterShortLabel(chapter) {
  const title = String((chapter && chapter.title) || "");
  const lesson = title.match(/Li[cç][aã]o\s+([IVXLCDM]+|\d+)\b/i);
  if (lesson) return lesson[1].toUpperCase();
  return title.length > 14 ? `${title.slice(0, 13)}…` : title || "?";
}

/** Palavra principal do verbete: "πατήρ, πατρός, ὁ" cabe na pedra como "πατήρ" */
function headTerm(term) {
  return String(term || "").split(/[,(]/)[0].trim() || String(term || "");
}

/**
 * Monta o baralho da partida com o vocabulário dos capítulos escolhidos, sem repetir termos
 * @param {Array<Object>} chapters
 * @param {{chapterIds?: Array<string>, onlyErrors?: boolean}} [opts]
 * @param {(item: Object) => boolean} [isError] indica se o termo está na lista de erros
 * @returns {Array<{id: number, item: Object, term: string, head: string, pt: string, chapterId: string, chapterLabel: string}>}
 */
function buildDeck(chapters, opts = {}, isError) {
  const wanted = Array.isArray(opts.chapterIds) ? new Set(opts.chapterIds) : null;
  const seen = new Set();
  const deck = [];
  (Array.isArray(chapters) ? chapters : []).forEach((chapter) => {
    if (!chapter || (wanted && !wanted.has(chapter.id))) return;
    (chapter.items || []).forEach((item) => {
      const term = getTerm(item);
      const pt = Array.isArray(item.translations) ? item.translations[0] : "";
      if (!term || !pt || seen.has(term)) return;
      if (opts.onlyErrors && !(typeof isError === "function" && isError(item))) return;
      seen.add(term);
      deck.push({
        id: deck.length,
        item,
        term,
        head: headTerm(term),
        pt: preferredGloss(item.translations),
        chapterId: chapter.id,
        chapterLabel: chapterShortLabel(chapter),
      });
    });
  });
  return deck;
}

/** Segundos que uma pedra leva do topo ao muro: cai mais rápido a cada fase */
function fallTime(level) {
  return Math.max(3.6, 9.5 - (level - 1) * 0.65);
}

/** Pedras simultâneas na tela: uma no começo, até quatro */
function maxStones(level) {
  return Math.min(4, 1 + Math.floor((level - 1) / 2));
}

/**
 * Pontos de um acerto: o multiplicador vale mais que a pressa, mas acertar cedo rende bônus
 * @param {number} combo multiplicador atual
 * @param {number} heightLeft fração da queda que ainda faltava (0 a 1)
 */
function hitScore(combo, heightLeft) {
  return 10 * combo + Math.round(Math.max(0, Math.min(1, heightLeft)) * 10);
}

/** Multiplicador depois de um acerto: sobe a cada três acertos seguidos */
function comboAfterHit(combo, totalHits) {
  return totalHits % COMBO_EVERY === 0 && combo < COMBO_MAX ? combo + 1 : combo;
}

function levelAfterHit(level, totalHits) {
  return totalHits % HITS_PER_LEVEL === 0 ? level + 1 : level;
}

/* ============================ Preferências ============================ */

const storageKey = () => `gamida_${AppState.language}_stone_rain`;
let prefs = { best: 0, chapterIds: null, onlyErrors: false, reverse: false };

function loadPrefs() {
  prefs = { best: 0, chapterIds: null, onlyErrors: false, reverse: false };
  if (typeof localStorage === "undefined") return;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey()) || "null");
    if (stored && typeof stored === "object") {
      prefs.best = Number.isFinite(stored.best) ? stored.best : 0;
      prefs.chapterIds = Array.isArray(stored.chapterIds) ? stored.chapterIds : null;
      prefs.onlyErrors = !!stored.onlyErrors;
      prefs.reverse = !!stored.reverse;
    }
  } catch (_) {}
}

function savePrefs() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(prefs));
  } catch (_) {}
}

/** Capítulos com vocabulário suficiente para entrar no jogo */
function playableChapters() {
  return (AppState.chapters || []).filter((c) => c && (c.items || []).length > 0);
}

function selectedChapterIds() {
  const valid = new Set(playableChapters().map((c) => c.id));
  if (Array.isArray(prefs.chapterIds)) return prefs.chapterIds.filter((id) => valid.has(id));
  // Primeira vez: começa pelos capítulos que o aluno está estudando
  const current = (AppState.selectedChapterIds || []).filter((id) => valid.has(id));
  if (current.length > 0) return current;
  return AppState.currentChapter && valid.has(AppState.currentChapter.id) ? [AppState.currentChapter.id] : [];
}

const isErrorItem = (item) =>
  typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.isItemInErrorList === "function"
    ? window.SRSModule.isItemInErrorList(item)
    : false;

function currentDeck() {
  return buildDeck(AppState.chapters, { chapterIds: selectedChapterIds(), onlyErrors: prefs.onlyErrors }, isErrorItem);
}

/* ============================ Interface ============================ */

const el = (id) => (typeof document !== "undefined" ? document.getElementById(id) : null);
const audio = () => (typeof window !== "undefined" ? window.GameAudio : null);
const isHebrew = () => AppState.language === "hebrew";
const termFont = (px) => (isHebrew()
  ? `700 ${px}px "SBL Hebrew", "Ezra SIL", "Noto Sans Hebrew", serif`
  : `700 ${Math.round(px * 0.87)}px "Gentium Plus", "Times New Roman", serif`);
const reduceMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let game = null;
let lastFrame = 0;
let frameId = 0;
let banner = { text: "", time: 0 };
const stars = Array.from({ length: 70 }, () => ({
  x: Math.random(), y: Math.random() * 0.7, r: Math.random() * 1.3 + 0.3, phase: Math.random() * 6,
}));

function isOpen() {
  const view = el("stone-rain-view");
  return !!view && !view.classList.contains("hidden");
}

function show(id, visible) {
  const node = el(id);
  if (node) node.classList.toggle("hidden", !visible);
}

/**
 * Menu e fim de jogo ocupam a altura do próprio conteúdo (sem rolagem dentro do palco);
 * durante a partida o palco tem a altura do canvas e as respostas aparecem embaixo.
 */
function setStageMode(mode) {
  const stage = el("sr-stage");
  if (stage) stage.classList.toggle("is-panel", mode !== "play");
  show("sr-answers", mode === "play");
}

function updateAudioLabels() {
  const a = audio();
  if (!a) return;
  document.querySelectorAll("[data-game-audio='mute']").forEach((btn) => {
    btn.textContent = a.isMuted() ? "Som: desligado" : "Som: ligado";
    btn.setAttribute("aria-pressed", String(!a.isMuted()));
  });
  document.querySelectorAll("[data-game-audio='music']").forEach((btn) => {
    btn.textContent = a.isMusicOn() ? "Música: ligada" : "Música: desligada";
    btn.setAttribute("aria-pressed", String(a.isMusicOn()));
  });
}

function renderMenu() {
  const chips = el("sr-chapter-chips");
  if (!chips) return;
  const selected = new Set(selectedChapterIds());
  chips.textContent = "";
  playableChapters().forEach((chapter) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sr-chip";
    btn.textContent = chapterShortLabel(chapter);
    btn.title = chapter.title;
    btn.setAttribute("aria-pressed", String(selected.has(chapter.id)));
    btn.onclick = () => {
      const ids = selectedChapterIds();
      prefs.chapterIds = ids.includes(chapter.id) ? ids.filter((id) => id !== chapter.id) : ids.concat(chapter.id);
      savePrefs();
      renderMenu();
    };
    chips.appendChild(btn);
  });

  const errorsBtn = el("sr-only-errors");
  if (errorsBtn) errorsBtn.setAttribute("aria-pressed", String(prefs.onlyErrors));
  const reverseBtn = el("sr-reverse");
  if (reverseBtn) {
    reverseBtn.setAttribute("aria-pressed", String(prefs.reverse));
    reverseBtn.textContent = "Pedras em português";
  }

  const count = currentDeck().length;
  const info = el("sr-pool-info");
  if (info) {
    info.textContent = count >= MIN_DECK
      ? `${count} palavras nesta partida`
      : prefs.onlyErrors
        ? "Há menos de 4 palavras erradas nessas lições. Desmarque “Só as que errei” ou escolha mais lições."
        : "Escolha lições com pelo menos 4 palavras.";
  }
  const play = el("sr-play");
  if (play) play.disabled = count < MIN_DECK;
  const best = el("sr-best");
  if (best) best.textContent = String(prefs.best);
}

function selectChapters(mode) {
  const all = playableChapters();
  if (mode === "all") prefs.chapterIds = all.map((c) => c.id);
  else if (mode === "none") prefs.chapterIds = [];
  else {
    // Até o capítulo que o aluno está estudando
    const index = all.findIndex((c) => AppState.currentChapter && c.id === AppState.currentChapter.id);
    prefs.chapterIds = all.slice(0, index >= 0 ? index + 1 : all.length).map((c) => c.id);
  }
  savePrefs();
  renderMenu();
}

function toggleOption(name) {
  if (name === "errors") prefs.onlyErrors = !prefs.onlyErrors;
  else prefs.reverse = !prefs.reverse;
  savePrefs();
  renderMenu();
}

function resize() {
  const stage = el("sr-stage");
  if (!stage || !canvas || !isOpen()) return;
  const rect = stage.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  width = rect.width;
  height = Math.round(Math.min(520, Math.max(330, window.innerHeight * 0.56)));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (!game || !game.running) drawScene();
}

function hud() {
  const lives = game ? Math.max(0, game.lives) : LIVES;
  const set = (id, text) => { const node = el(id); if (node) node.textContent = text; };
  set("sr-score", String(game ? game.score : 0));
  set("sr-combo", `×${game ? game.combo : 1}`);
  set("sr-level", String(game ? game.level : 1));
  set("sr-lives", "♥".repeat(lives) + "♡".repeat(LIVES - lives));
  const livesEl = el("sr-lives");
  if (livesEl) livesEl.setAttribute("aria-label", `${lives} de ${LIVES} vidas`);
}

function newGame(deck) {
  const a = audio();
  if (a) {
    a.init();
    a.sfx.start();
    a.epic.stop();
    a.chip.reset();
    a.chip.start();
  }
  game = {
    deck: deck || currentDeck(),
    stones: [], particles: [],
    score: 0, combo: 1, hits: 0, level: 1, lives: LIVES,
    missed: new Map(), spawnTimer: 0, target: null, options: [],
    shake: 0, running: true, paused: false, clock: 0, recent: [],
  };
  show("sr-menu", false);
  show("sr-over", false);
  show("sr-pause", false);
  setStageMode("play");
  resize();
  spawn();
  hud();
  lastFrame = performance.now();
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(loop);
}

/** Sorteia a próxima palavra: evita repetir as recentes e volta mais vezes às erradas */
function pickWord() {
  const deck = game.deck;
  const avoid = new Set([...game.stones.map((s) => s.word.id), ...game.recent]);
  let candidates = deck.filter((w) => !avoid.has(w.id));
  if (!candidates.length) candidates = deck.filter((w) => !game.stones.some((s) => s.word.id === w.id));
  if (!candidates.length) candidates = deck;
  const missed = candidates.filter((w) => game.missed.has(w.id));
  const word = missed.length && Math.random() < 0.35
    ? missed[(Math.random() * missed.length) | 0]
    : candidates[(Math.random() * candidates.length) | 0];
  game.recent.push(word.id);
  if (game.recent.length > Math.min(12, Math.max(0, deck.length - 4))) game.recent.shift();
  return word;
}

function spawn() {
  const word = pickWord();
  const label = prefs.reverse ? word.pt : word.head;
  ctx.font = prefs.reverse ? "500 16px Rubik, sans-serif" : termFont(30);
  const textWidth = ctx.measureText(label).width;
  const stoneWidth = Math.min(width - 20, Math.max(90, textWidth + 34));
  const stoneHeight = prefs.reverse ? 46 : 54;
  let x = 10 + Math.random() * Math.max(1, width - 20 - stoneWidth);
  for (let attempt = 0; attempt < 6; attempt++) {
    const clash = game.stones.some((s) => s.y < stoneHeight * 1.6 && Math.abs(s.x - x) < Math.max(s.w, stoneWidth));
    if (!clash) break;
    x = 10 + Math.random() * Math.max(1, width - 20 - stoneWidth);
  }
  game.stones.push({
    word, label, x, y: -stoneHeight, w: stoneWidth, h: stoneHeight,
    speed: (height - WALL_HEIGHT + stoneHeight) / fallTime(game.level),
    rotation: (Math.random() - 0.5) * 0.08,
  });
  retarget();
}

/** O alvo é sempre a pedra mais próxima do muro */
function retarget() {
  const lowest = game.stones.reduce((best, s) => (!best || s.y > best.y ? s : best), null);
  if (lowest && game.target !== lowest) {
    game.target = lowest;
    game.options = buildChoiceOptions(lowest.word.item, AppState.chapters, { direction: prefs.reverse ? "reverse" : "forward" });
    renderAnswers(game.options);
  }
  if (!lowest) {
    game.target = null;
    renderAnswers([]);
  }
}

function renderAnswers(options) {
  const box = el("sr-answers");
  if (!box) return;
  box.textContent = "";
  const termClass = isHebrew() ? "hebrew-text" : "greek-text";
  (options.length ? options : [null, null, null, null]).forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sr-answer${option && prefs.reverse ? ` sr-answer--term ${termClass}` : ""}`;
    btn.disabled = !option;
    if (option) {
      const key = document.createElement("span");
      key.className = "sr-answer__key";
      key.textContent = String(index + 1);
      const text = document.createElement("span");
      text.textContent = option.text;
      btn.append(key, text);
      btn.onclick = () => choose(index, btn);
    } else {
      btn.innerHTML = "&nbsp;";
    }
    box.appendChild(btn);
  });
}

function flash(btn, ok, long) {
  if (!btn) return;
  btn.classList.add(ok ? "is-ok" : "is-bad");
  setTimeout(() => btn.classList.remove("is-ok", "is-bad"), long ? 600 : 220);
}

function recordAnswer(word, ok) {
  if (typeof window === "undefined") return;
  if (typeof window.recordActivity === "function") window.recordActivity();
  // Errar aqui também manda o termo para a lista de erros do Gamida
  if (!ok && typeof window.recordSRSError === "function") window.recordSRSError(word.term);
}

function choose(index, btn) {
  if (!game || !game.running || game.paused || !game.target) return;
  const target = game.target;
  const option = game.options[index];
  if (!option) return;
  const a = audio();
  if (option.isCorrect) {
    game.hits++;
    game.score += hitScore(game.combo, (height - WALL_HEIGHT - target.y) / height);
    const combo = comboAfterHit(game.combo, game.hits);
    if (combo > game.combo && a) a.sfx.combo();
    game.combo = combo;
    burst(target.x + target.w / 2, target.y + target.h / 2, "#f2b134", 22);
    if (a) a.sfx.hit(game.combo);
    recordAnswer(target.word, true);
    game.stones = game.stones.filter((s) => s !== target);
    game.target = null;
    const level = levelAfterHit(game.level, game.hits);
    if (level > game.level) {
      game.level = level;
      banner = { text: `Fase ${level}`, time: 1.4 };
      if (a) {
        a.sfx.level();
        a.chip.setLevel(level);
      }
    }
    flash(btn, true);
    retarget();
    if (!game.stones.length) game.spawnTimer = Math.min(game.spawnTimer, 0.25);
  } else {
    game.combo = 1;
    if (a) a.sfx.wrong();
    recordAnswer(target.word, false);
    flash(btn, false);
    const buttons = el("sr-answers").children;
    game.options.forEach((opt, i) => { if (opt.isCorrect) flash(buttons[i], true, true); });
    loseLife(target.word);
  }
  hud();
}

function loseLife(word) {
  game.lives--;
  game.shake = reduceMotion() ? 0 : 0.35;
  game.missed.set(word.id, word);
  hud();
  if (game.lives <= 0) gameOver();
}

function burst(x, y, color, count) {
  const n = reduceMotion() ? Math.min(count, 6) : count;
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, life: 0.7, color, r: 2 + Math.random() * 3 });
  }
}

function loop(now) {
  if (!isOpen()) {
    frameId = 0;
    return;
  }
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (game && game.running && !game.paused) update(dt);
  drawScene();
  frameId = requestAnimationFrame(loop);
}

function update(dt) {
  game.clock += dt;
  game.spawnTimer -= dt;
  const limit = maxStones(game.level);
  const gap = Math.max(1.3, fallTime(game.level) / (limit + 0.6));
  if (game.spawnTimer <= 0 && game.stones.length < limit) {
    spawn();
    game.spawnTimer = gap;
  } else if (game.spawnTimer <= 0) {
    game.spawnTimer = 0.3;
  }
  game.stones.forEach((s) => { s.y += s.speed * dt; });
  const landed = game.stones.filter((s) => s.y + s.h >= height - WALL_HEIGHT);
  if (landed.length) {
    const a = audio();
    for (const stone of landed) {
      burst(stone.x + stone.w / 2, height - WALL_HEIGHT, "#ff6b5e", 16);
      if (a) a.sfx.wall();
      game.combo = 1;
      recordAnswer(stone.word, false);
      loseLife(stone.word);
      if (!game.running) return;
    }
    game.stones = game.stones.filter((s) => !landed.includes(s));
    if (landed.includes(game.target)) game.target = null;
    retarget();
    hud();
  }
  game.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 380 * dt;
    p.life -= dt;
  });
  game.particles = game.particles.filter((p) => p.life > 0);
  if (game.shake > 0) game.shake -= dt;
  if (banner.time > 0) banner.time -= dt;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawScene() {
  if (!ctx || !width) return;
  ctx.save();
  if (game && game.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#0b1020");
  sky.addColorStop(1, "#1d2850");
  ctx.fillStyle = sky;
  ctx.fillRect(-10, -10, width + 20, height + 20);
  const time = performance.now() / 1000;
  stars.forEach((s) => {
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 1.3 + s.phase);
    ctx.fillStyle = "#f3ecdf";
    ctx.beginPath();
    ctx.arc(s.x * width, s.y * height, s.r, 0, 7);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Lua crescente
  ctx.fillStyle = "#f6e7b8";
  ctx.beginPath();
  ctx.arc(width - 48, 44, 18, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#141c36";
  ctx.beginPath();
  ctx.arc(width - 41, 39, 16, 0, 7);
  ctx.fill();
  // Muralha com ameias e fiadas de pedra
  const wallY = height - WALL_HEIGHT;
  ctx.fillStyle = "#8f7a52";
  ctx.fillRect(0, wallY, width, WALL_HEIGHT);
  ctx.fillStyle = "#a8925f";
  for (let x = 0; x < width; x += 34) ctx.fillRect(x, wallY - 12, 20, 12);
  ctx.strokeStyle = "rgba(40,30,15,.45)";
  ctx.lineWidth = 1;
  for (let row = 0; row < 3; row++) {
    const y = wallY + row * (WALL_HEIGHT / 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    for (let x = (row % 2) * 22; x < width; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + WALL_HEIGHT / 3);
      ctx.stroke();
    }
  }
  if (game) {
    // O muro avermelha conforme as vidas acabam
    ctx.fillStyle = `rgba(255,107,94,${(1 - game.lives / LIVES) * 0.35})`;
    ctx.fillRect(0, wallY, width, WALL_HEIGHT);
    game.stones.forEach((s) => {
      const isTarget = s === game.target;
      ctx.save();
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      ctx.rotate(s.rotation);
      ctx.shadowColor = isTarget ? "rgba(242,177,52,.75)" : "rgba(0,0,0,.4)";
      ctx.shadowBlur = isTarget ? 18 : 8;
      roundRect(-s.w / 2, -s.h / 2, s.w, s.h, 12);
      ctx.fillStyle = isTarget ? "#d9c497" : "#bfa979";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = isTarget ? 3 : 1.5;
      ctx.strokeStyle = isTarget ? "#f2b134" : "#7d6a45";
      ctx.stroke();
      ctx.fillStyle = "#2a1f0d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (prefs.reverse) {
        ctx.font = "500 16px Rubik, sans-serif";
        ctx.direction = "ltr";
      } else {
        ctx.font = termFont(30);
        ctx.direction = isHebrew() ? "rtl" : "ltr";
      }
      ctx.fillText(s.label, 0, prefs.reverse ? 1 : 3, s.w - 16);
      ctx.restore();
      if (isTarget) {
        const cx = s.x + s.w / 2;
        ctx.fillStyle = "#f2b134";
        ctx.beginPath();
        ctx.moveTo(cx - 7, s.y - 12);
        ctx.lineTo(cx + 7, s.y - 12);
        ctx.lineTo(cx, s.y - 4);
        ctx.fill();
      }
    });
    game.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.7);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    });
    ctx.globalAlpha = 1;
    if (banner.time > 0) {
      ctx.globalAlpha = Math.min(1, banner.time);
      ctx.fillStyle = "#f2b134";
      ctx.font = "800 34px Rubik, sans-serif";
      ctx.textAlign = "center";
      ctx.direction = "ltr";
      ctx.fillText(banner.text, width / 2, height * 0.42);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function gameOver() {
  game.running = false;
  const a = audio();
  if (a) {
    a.chip.stop();
    a.sfx.over();
  }
  const isRecord = game.score > prefs.best;
  if (isRecord) {
    prefs.best = game.score;
    savePrefs();
  }
  const missed = Array.from(game.missed.values());
  const over = el("sr-over");
  if (!over) return;
  over.textContent = "";
  const add = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    over.appendChild(node);
    return node;
  };
  add("h3", "sr-overlay__title", "A muralha caiu");
  add("div", "sr-big", String(game.score));
  add("p", "sr-overlay__text", `${isRecord ? "Novo recorde. " : ""}Fase ${game.level} · ${game.hits} ${game.hits === 1 ? "pedra destruída" : "pedras destruídas"} · recorde ${prefs.best}`);
  if (missed.length) {
    add("p", "sr-overlay__text", "Revise estas antes da próxima partida (já estão na sua lista de erros):");
    const table = add("table", "sr-missed");
    const body = document.createElement("tbody");
    missed.forEach((word) => {
      const row = document.createElement("tr");
      const term = document.createElement("td");
      term.className = `sr-missed__term ${isHebrew() ? "hebrew-text" : "greek-text"}`;
      term.textContent = word.term;
      const meaning = document.createElement("td");
      meaning.textContent = word.item.translations.join(" / ");
      const lesson = document.createElement("td");
      lesson.className = "sr-missed__lesson";
      lesson.textContent = word.chapterLabel;
      row.append(term, meaning, lesson);
      body.appendChild(row);
    });
    table.appendChild(body);
  }
  const row = add("div", "sr-row");
  const button = (label, primary, handler) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = primary ? "sr-play" : "sr-ghost";
    btn.textContent = label;
    btn.onclick = handler;
    row.appendChild(btn);
  };
  const canReplayMissed = missed.length >= MIN_DECK;
  if (canReplayMissed) button("Jogar só com as erradas", true, () => newGame(missed.map((w, id) => ({ ...w, id }))));
  button("Jogar de novo", !canReplayMissed, () => newGame());
  button("Menu", false, toMenu);
  show("sr-over", true);
  setStageMode("over");
  renderAnswers([]);
}

function toMenu() {
  const a = audio();
  if (a) a.chip.stop();
  if (game) game.running = false;
  game = null;
  show("sr-over", false);
  show("sr-pause", false);
  show("sr-menu", true);
  setStageMode("menu");
  renderMenu();
  renderAnswers([]);
  hud();
}

function pause(on) {
  if (!game || !game.running) return;
  game.paused = on;
  show("sr-pause", on);
  const a = audio();
  if (a) {
    if (on) a.chip.stop();
    else a.chip.start();
  }
}

function togglePause() {
  if (game && game.running) pause(!game.paused);
}

function toggleMute() {
  const a = audio();
  if (!a) return;
  a.init();
  if (!a.toggleMute()) a.sfx.combo();
  updateAudioLabels();
}

function toggleMusic() {
  const a = audio();
  if (!a) return;
  a.init();
  a.toggleMusic();
  updateAudioLabels();
}

let listenersReady = false;
function setupListeners() {
  if (listenersReady || typeof window === "undefined") return;
  listenersReady = true;
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isOpen()) pause(true);
  });
  document.addEventListener("keydown", (e) => {
    if (!isOpen() || e.defaultPrevented) return;
    const playing = game && game.running;
    if (/^[1-4]$/.test(e.key) && playing && !game.paused) {
      const btn = el("sr-answers").children[Number(e.key) - 1];
      choose(Number(e.key) - 1, btn);
      e.preventDefault();
    } else if (e.key === " " && playing) {
      togglePause();
      e.preventDefault();
    } else if (e.key === "m" || e.key === "M") {
      toggleMute();
    }
  });
}

function openStoneRain() {
  if (typeof document === "undefined") return;
  loadPrefs();
  show("assess-dashboard", false);
  show("stone-rain-view", true);
  canvas = el("sr-canvas");
  ctx = canvas ? canvas.getContext("2d") : null;
  setupListeners();
  const native = el("sr-title-orig");
  if (native) {
    native.textContent = isHebrew() ? "אֲבָנִים" : "λίθοι";
    native.className = isHebrew() ? "hebrew-text" : "greek-text";
  }
  const foot = el("sr-foot");
  if (foot) {
    foot.textContent = `Vocabulário de todas as lições de ${isHebrew() ? "hebraico" : "grego"} do Gamida. Fale a palavra em voz alta antes de tocar.`;
  }
  updateAudioLabels();
  toMenu();
  resize();
  cancelAnimationFrame(frameId);
  lastFrame = performance.now();
  frameId = requestAnimationFrame(loop);
  // As fontes do idioma podem chegar depois da primeira pintura do canvas
  if (document.fonts && typeof document.fonts.load === "function") {
    document.fonts.load(termFont(30), isHebrew() ? "אב" : "αβ").then(() => drawScene()).catch(() => {});
  }
}

/** Encerra a partida e o som ao sair da tela (voltar ao painel ou trocar de aba) */
function closeStoneRain() {
  const a = audio();
  if (a) a.chip.stop();
  if (game) game.running = false;
  game = null;
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameId);
  frameId = 0;
  show("stone-rain-view", false);
}

const StoneRainModule = {
  LIVES,
  MIN_DECK,
  chapterShortLabel,
  headTerm,
  buildDeck,
  fallTime,
  maxStones,
  hitScore,
  comboAfterHit,
  levelAfterHit,
  openStoneRain,
  closeStoneRain,
  getBest: () => { loadPrefs(); return prefs.best; },
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.StoneRainModule = StoneRainModule;
  window.openStoneRain = openStoneRain;
  window.stoneRainPlay = () => newGame();
  window.stoneRainSelect = selectChapters;
  window.stoneRainToggle = toggleOption;
  window.stoneRainPause = togglePause;
  window.stoneRainResume = () => pause(false);
  window.stoneRainMenu = toMenu;
  window.gameAudioToggleMute = toggleMute;
  window.gameAudioToggleMusic = toggleMusic;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = StoneRainModule;
}
})();
