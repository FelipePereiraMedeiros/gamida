/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
/**
 * Gera js/modules/scribe-graphics.js a partir da versão original das Crônicas do Escriba.
 *
 * Uso:
 *   node scripts/cronicas/extrair-arte.js <arquivo>            (escreve o módulo)
 *   node scripts/cronicas/extrair-arte.js <arquivo> --conferir  (só compara com o atual)
 *
 * <arquivo> é a página HTML da versão original (salva do navegador) ou o script
 * dela já extraído. O código original não fica no repositório: é obra de José
 * Henrique Rosseto (ver CREDITOS.md), e quem atualiza a arte informa o arquivo.
 *
 * O que o script faz:
 * 1. pega o maior <script> da página e o formata com o Prettier (devDependency);
 * 2. recorta os desenhos de cenário, heróis, criaturas e guardiões;
 * 3. troca as variáveis globais do jogo original (B, S) pelo estado que o motor
 *    do Gamida injeta com setEnvironment (relíquias do herói e céu escuro);
 * 4. escreve o módulo com o aviso de coautoria.
 *
 * Os mapas (scribe-map.js) e as animações (scribe-fx.js) também partiram da
 * versão original, mas foram adaptados à mão e não são gerados por este script.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "js", "modules", "scribe-graphics.js");
const { COAUTHOR_NOTICE } = require("../license-headers.js");

async function loadSource(file) {
  const raw = fs.readFileSync(file, "utf8");
  let code = raw;
  if (/<script/i.test(raw)) {
    const scripts = [...raw.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    if (!scripts.length) throw new Error("Nenhum <script> na página informada.");
    code = scripts.reduce((a, b) => (b.length > a.length ? b : a));
  }
  let prettier;
  try {
    prettier = require("prettier");
  } catch (_) {
    throw new Error("Prettier não instalado. Rode `npm install` uma vez.");
  }
  return prettier.format(code, { parser: "babel", printWidth: 160 });
}

/** Recortes do código formatado, linha a linha (como o código original está organizado) */
function cutter(lines) {
  const find = (prefix, from = 0) => {
    const i = lines.findIndex((l, k) => k >= from && l.startsWith(prefix));
    if (i === -1) throw new Error(`Trecho não encontrado: ${prefix}`);
    return i;
  };
  const fn = (prefix) => {
    const start = find(prefix);
    let end = start + 1;
    while (end < lines.length && lines[end] !== "}" && lines[end] !== "};") end++;
    return lines.slice(start, end + 1).join("\n");
  };
  const block = (prefix, endPrefix) => {
    const start = find(prefix);
    const end = find(endPrefix, start + 1);
    return lines.slice(start, end).join("\n");
  };
  const last = (prefix) => {
    const starts = lines.map((l, i) => (l.startsWith(prefix) ? i : -1)).filter((i) => i !== -1);
    if (!starts.length) throw new Error(`Trecho não encontrado: ${prefix}`);
    const start = starts[starts.length - 1];
    let end = start + 1;
    while (end < lines.length && lines[end] !== "}") end++;
    return lines.slice(start, end + 1).join("\n");
  };
  return { fn, block, last };
}

function buildBody(formatted) {
  const { fn, block, last } = cutter(formatted.split("\n"));
  const parts = [
    // Cenário base
    fn("function paintBG(c, W, H, scene, idx, t) {"),
    // Céus, brasas, vinheta, asas, olhos, criaturas antigas, dragão, sombra, arquidemônio
    block("const SKIES = [", "/* heróis */"),
    // Paleta de 32 cores, pontilhado e contorno
    block("const PAL = [", "const PX = 2;"),
    // Animações de cenário (uma por cena)
    block("const rnd = (i) => {", "/* ================= Ataques escolhíveis"),
    // Guardiões: gigantes, serpentes, feras e o desenho por tipo
    block("function drawGiant(c, x, gy, s, t, flash, kind, breath) {", "const ASSIM = ["),
    // Criaturas por região
    block("const FL = (f, c) =>", "function drawMob(c, m, mx, gy, sc, t, f, br, Wd) {"),
    fn("function drawMob(c, m, mx, gy, sc, t, f, br, Wd) {"),
    // Guardiões ídolo e terafim, e o desenho por tipo que os inclui
    block("function drawIdolBoss(c, x, gy, s, t, f, br) {", "function bossPhase(t) {"),
    fn("function rageAura(c, mx, gy, sc, t) {"),
    // Céu e neblina por cena
    block("const SKY2 = {", "/* ---------- avisos em tela cheia"),
    // Heróis da versão nova (a última definição vale)
    last("function drawHero(c, x, gy, s, t, flash, cls, glow) {"),
    // Primeiro plano e halo da lua
    block("const FGK = {", "/* ---------- mapa do mundo"),
  ];
  let body = parts.join("\n\n");
  // Dependências globais viram estado injetado pelo motor
  const sky = /const sky = SKY2\[scene\] && !\(typeof B !== "undefined" && B && \(B\.boss \|\| B\.dungeon\)\) \? SKY2\[scene\] : SKIES\[idx % 4\],/;
  if (!sky.test(body)) throw new Error("paintBG mudou: revise a troca do céu escuro.");
  body = body.replace(sky, "const sky = SKY2[scene] && !ENV.darkSky ? SKY2[scene] : SKIES[idx % 4],");
  body = body.replace(/function heroRelics\(cls, show\) \{\n {2}return show && cls === S\.cls \? new Set\(S\.relics\) : new Set\(\);\n\}/, "");
  if (!body.includes("const R_ = heroRelics(cls, glow),")) throw new Error("drawHero mudou: revise a troca das relíquias.");
  body = body.replace("const R_ = heroRelics(cls, glow),", "const R_ = glow && ENV.relics ? ENV.relics : new Set(),");
  const leftovers = [...new Set(body.match(/\b(B|S|A|music|sfx|CH)\.[a-zA-Z]+/g) || [])];
  if (leftovers.length) throw new Error(`Referências ao jogo original que sobraram: ${leftovers.join(", ")}`);
  return body;
}

const HEAD = `/*! ${COAUTHOR_NOTICE} */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: arte em pixel
 * ==========================================================================
 * GERADO por scripts/cronicas/extrair-arte.js a partir da versão original do
 * jogo, de José Henrique Rosseto (CREDITOS.md). Não edite à mão: rode o script.
 *
 * Cenários, heróis, criaturas e guardiões desenhados em canvas, sem imagens
 * externas (heróis com as relíquias no corpo, criaturas por região, guardiões
 * bíblicos com desenho próprio e neblina por cena). O desenho é feito em baixa
 * resolução e passa por uma paleta de 32 cores com pontilhado e contorno.
 *
 * O motor informa, por setEnvironment, o que no original eram variáveis globais:
 * as relíquias do herói (desenhadas no corpo) e se o céu deve ficar escuro
 * (guardião ou masmorra).
 */

(function () {
// Quem pede menos movimento no sistema fica sem partículas e sem balanço
const RM =
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ENV = { relics: new Set(), darkSky: false };

/** O motor informa as relíquias do herói e o tipo de céu */
function setEnvironment({ relics, darkSky } = {}) {
  if (relics) ENV.relics = relics instanceof Set ? relics : new Set(relics);
  if (typeof darkSky === "boolean") ENV.darkSky = darkSky;
}

`;

const TAIL = `

/** Zera as brasas ao trocar de batalha, para não herdar as do cenário anterior */
function resetEmbers() {
  EMB = [];
}

const ScribeGraphics = {
  setEnvironment,
  paintBG,
  sceneFX: (...args) => sceneFX(...args),
  embers,
  resetEmbers,
  vignette,
  drawImp,
  drawWraith,
  drawDragon,
  drawArchDemon,
  drawHero,
  drawBossKind: (...args) => drawBossKind(...args),
  drawMob,
  drawMobSprite,
  rageAura,
  fgFX,
  bolt,
  flame,
  quantize,
  buf,
  outlineOnto,
  SPECIES_KEYS: ["imp", "wraith", "dragon", "snake", "raven", "golem", "idol", "jackal", "goat", "frog", "locust", "scorpion", "seraph", "skel"],
  BOSS_KINDS: ["serpent", "leviata", "beemote", "calf", "dragao", "demon", "demon2", "nefilim", "golias", "ninrode", "abimeleque"],
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeGraphics = ScribeGraphics;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeGraphics;
}
})();
`;

async function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file) {
    console.error("Informe a página (ou o script) da versão original: node scripts/cronicas/extrair-arte.js <arquivo> [--conferir]");
    process.exit(2);
  }
  const out = HEAD + buildBody(await loadSource(file)) + TAIL;
  if (flag === "--conferir") {
    const same = fs.readFileSync(OUT, "utf8") === out;
    console.log(same ? "scribe-graphics.js está igual ao gerado." : "scribe-graphics.js difere do gerado: rode sem --conferir para atualizar.");
    process.exit(same ? 0 : 1);
  }
  fs.writeFileSync(OUT, out);
  console.log(`Escrito ${path.relative(ROOT, OUT)} (${out.length} caracteres).`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { buildBody, loadSource };
