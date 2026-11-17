/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: utilidades comuns
 * ==========================================================================
 * O que os módulos de desenho e o motor do jogo repetiam cada um por conta:
 * o pedido de "reduzir movimento" do sistema, o acaso fixo dos desenhos
 * (rnd: o mesmo número para a mesma semente, para a arte não tremer) e o
 * escape de texto para HTML. Também os ícones em pixel da interface do jogo
 * (coração, caveira, coroa, óleo, pergaminho, fuga, pausa), desenhados aqui mesmo.
 */

(function () {
/** O sistema pede menos movimento? (consultado na hora) */
const reducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Número entre 0 e 1, sempre o mesmo para a mesma semente */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const esc = (text) => ((typeof window !== "undefined" && window.GamidaHTML) || require("./html.js")).escapeHTML(text);

/* ---------- Ícones em pixel ---------- */
// Cada letra é uma cor da paleta do jogo; o contorno escuro é acrescentado sozinho
const ICON_COLORS = {
  R: "#e43b44", D: "#a22633", W: "#ffffff", w: "#c0cbdc", g: "#8b9bb4", K: "#181425",
  G: "#feae34", Y: "#fee761", O: "#f77622", B: "#733e39", P: "#ead4aa", S: "#c28569", L: "#c0cbdc",
};
const ICONS = {
  heart: [".RR.RR.", "RWRRRRR", "RRRRRRR", "DRRRRRD", ".DRRRD.", "..DRD..", "...D..."],
  skull: [".wwwww.", "wWwwwww", "wKKwKKw", "wKKwKKw", "wwwKwww", ".wwwww.", ".w.w.w."],
  crown: ["G..G..G", "GG.Y.GG", "GGGGGGG", "GYGRGYG", "GGGGGGG"],
  potion: ["..BBB..", "...L...", "..LRL..", ".LRRRL.", "LRWRRRL", "LRRRRRL", "LDRRRDL", ".LLLLL."],
  scroll: ["SPPPPPS", ".PKKKP.", ".PPPPP.", ".PKKPP.", ".PPPPP.", ".PKKKP.", "SPPPPPS"],
  flee: ["...w...", "..ww...", ".wwwwww", "wwwwwww", ".wwwwww", "..ww...", "...w..."],
  pause: ["ww.ww", "ww.ww", "ww.ww", "ww.ww", "ww.ww", "ww.ww"],
  play: ["w....", "www..", "wwwww", "www..", "w...."],
  star: ["...Y...", "..YYY..", "YYYYYYY", ".YYYYY.", ".YY.YY.", "Y.....Y"],
};

/**
 * Ícone em pixel como SVG (texto HTML fixo, sem dado de fora)
 * @param {string} name chave de ICONS
 * @param {number} [px] tamanho de cada pixel na tela
 */
function pixelIcon(name, px = 2) {
  const rows = ICONS[name];
  if (!rows) return "";
  const h = rows.length + 2;
  const w = Math.max(...rows.map((r) => r.length)) + 2;
  const filled = (x, y) => y >= 1 && y <= rows.length && x >= 1 && rows[y - 1][x - 1] !== undefined && rows[y - 1][x - 1] !== ".";
  let rects = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (filled(x, y)) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_COLORS[rows[y - 1][x - 1]]}"/>`;
      else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#181425"/>`;
    }
  }
  return `<svg class="sc-ico" aria-hidden="true" focusable="false" width="${w * px}" height="${h * px}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}

const ScribeCommon = {
  pixelIcon,
  reducedMotion,
  // Lido uma vez ao carregar, como faziam os módulos de desenho
  RM: reducedMotion(),
  rnd,
  esc,
};

if (typeof window !== "undefined") window.ScribeCommon = ScribeCommon;
if (typeof module !== "undefined" && module.exports) module.exports = ScribeCommon;
})();
