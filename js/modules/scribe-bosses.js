/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: guardiões com desenho próprio
 * ==========================================================================
 * Figuras dos guardiões do Livro II e do Segundo Rolo que antes repetiam os
 * gigantes do Livro I: reis, faraó, rainha, sacerdotes, mágicos, espíritos,
 * o muro de Jericó, o grande peixe, a tempestade, a Morte, estátuas e Dagom.
 * Mesmo estilo da arte do jogo: formas simples que depois passam pela paleta.
 * draw() devolve false quando o tipo não é deste módulo.
 */

(function () {
const RM =
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Figuras humanas: o que muda é a roupa, o que vai na cabeça e o que vai na mão */
const RULERS = {
  rei: { robe: "#68386c", trim: "#feae34", head: "crown", item: "scepter", beard: "#3e2731" },
  rei_jeoaquim: { robe: "#68386c", trim: "#feae34", head: "crown", item: "knife", beard: "#3e2731" },
  rei_guerra: { robe: "#a22633", trim: "#feae34", head: "crown", item: "sword", beard: "#3e2731", armor: true },
  rei_siria: { robe: "#124e89", trim: "#feae34", head: "crown", item: "scepter", beard: "#181425" },
  rei_moabe: { robe: "#733e39", trim: "#feae34", head: "crown", item: "sword", beard: "#3e2731", armor: true },
  rei_assiria: { robe: "#a22633", trim: "#feae34", head: "tiara", item: "scepter", beard: "#181425", curls: true },
  rei_babilonia: { robe: "#124e89", trim: "#feae34", head: "tall", item: "scepter", beard: "#181425", curls: true },
  oficial_assiria: { robe: "#733e39", trim: "#feae34", head: "tiara_low", item: "scroll", beard: "#181425", curls: true, shout: true },
  farao: { robe: "#ead4aa", trim: "#feae34", head: "nemes", item: "crook", beard: null, collar: true },
  herodes: { robe: "#68386c", trim: "#feae34", head: "laurel", item: "scepter", beard: null },
  agripa: { robe: "#c0cbdc", trim: "#ffffff", head: "laurel", item: "scepter", beard: null, shine: true },
  rainha: { robe: "#68386c", trim: "#feae34", head: "veil", item: "mirror", beard: null, queen: true },
  sacerdote: { robe: "#124e89", trim: "#feae34", head: "mitre", item: "staff", beard: "#c0cbdc", breastplate: true },
  sacerdote_baal: { robe: "#a22633", trim: "#f77622", head: "horns", item: "knife", beard: "#3e2731", fire: true },
  adivinho: { robe: "#733e39", trim: "#e4a672", head: "turban", item: "staff", beard: "#c0cbdc" },
  mago: { robe: "#262b44", trim: "#2ce8f5", head: "hood", item: "orb", beard: "#3e2731", stars: true },
  traidor: { robe: "#5a6988", trim: "#3a4466", head: "hood", item: "bag", beard: "#3e2731" },
  orador: { robe: "#ead4aa", trim: "#a22633", head: null, item: "scroll", beard: null, shout: true },
};

const OTHERS = ["espirito", "legiao", "espiritos_ras", "muro", "peixe", "tempestade", "morte", "abadom", "estatua_ouro", "artemis", "dagom"];
const KINDS = [...Object.keys(RULERS), ...OTHERS];

function draw(c, kind, mx, gy, sc, t, flash, breath, Wd) {
  if (!KINDS.includes(kind)) return false;
  const u = 1.95 * sc; // unidade: as figuras humanas têm uns 58 de altura
  c.save();
  c.translate(mx, gy);
  const tools = makeTools(c, u, flash);
  if (RULERS[kind]) drawRuler(tools, RULERS[kind], t, breath);
  else ({ espirito: spirit, legiao: spirit, espiritos_ras: spirit, muro: wall, peixe: fish, tempestade: storm, morte: death, abadom: death, estatua_ouro: statue, artemis: statue, dagom: dagon })[kind](tools, kind, t, breath, Wd);
  c.restore();
  return true;
}

function makeTools(c, s, flash) {
  const F = (col) => (flash ? "#ff9a8f" : col);
  return {
    c, s, F,
    P(p, col) {
      c.fillStyle = F(col);
      c.beginPath();
      for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i] * s, p[i + 1] * s) : c.moveTo(p[i] * s, p[i + 1] * s);
      c.fill();
    },
    R(a, b, w, h, col) {
      c.fillStyle = F(col);
      c.fillRect(a * s, b * s, w * s, h * s);
    },
    C(a, b, r, col) {
      c.fillStyle = F(col);
      c.beginPath();
      c.arc(a * s, b * s, r * s, 0, 7);
      c.fill();
    },
    E(a, b, rx, ry, col) {
      c.fillStyle = F(col);
      c.beginPath();
      c.ellipse(a * s, b * s, rx * s, ry * s, 0, 0, 7);
      c.fill();
    },
    L(p, col, w) {
      c.strokeStyle = F(col);
      c.lineWidth = w * s;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i] * s, p[i + 1] * s) : c.moveTo(p[i] * s, p[i + 1] * s);
      c.stroke();
    },
    shadow(w) {
      c.fillStyle = "rgba(0,0,0,.45)";
      c.beginPath();
      c.ellipse(0, s, w * s, 3.5 * s, 0, 0, 7);
      c.fill();
    },
    alpha(a, fn) {
      const old = c.globalAlpha;
      c.globalAlpha = old * a;
      fn();
      c.globalAlpha = old;
    },
  };
}

/* ---------------- figuras humanas (olham para a esquerda, para o herói) ---------------- */
function drawRuler(T, o, t, breath) {
  const { c, s, P, R, C, L, E } = T;
  const br = RM ? 0 : Math.sin(t * 2) * 0.6;
  const wv = RM ? 0 : Math.sin(t * 2.6);
  const glow = RM ? 0.6 : 0.45 + 0.3 * Math.sin(t * 3);
  T.shadow(20);
  c.scale(-1, 1);
  const skin = "#c28569";
  const skinD = "#b86f50";
  const shade = (col) => (col === "#ead4aa" || col === "#c0cbdc" ? "#8b9bb4" : "#3e2731");
  // Capa ou manto de trás
  P([-8, -42, -17 + wv, -18, -19 + wv * 1.3, -1, -6, -1], o.robe);
  T.alpha(0.55, () => P([-8, -42, -17 + wv, -18, -19 + wv * 1.3, -1, -12, -1], shade(o.robe)));
  if (o.fire) {
    for (let k = 0; k < 5; k++) {
      const fx = -22 + k * 11;
      const h = 6 + 3 * Math.sin(t * 7 + k);
      P([fx - 3, 0, fx, -h - 4, fx + 3, 0], k % 2 ? "#f77622" : "#feae34");
    }
  }
  c.translate(0, br * s);
  // Túnica longa até os pés
  P([-13, 0, 13, 0, 10, -24, 8, -42, -8, -42, -10, -24], o.robe);
  P([-13, 0, -6, 0, -6.6, -24, -8, -42, -10, -24], shade(o.robe));
  R(-13, -2.6, 26, 2.6, o.trim);
  R(-1.2, -40, 2.4, 38, o.trim);
  if (o.stars) for (let k = 0; k < 9; k++) C(-9 + rnd(k) * 18, -6 - rnd(k + 7) * 32, 0.7, k % 2 ? "#2ce8f5" : "#fee761");
  if (o.armor) {
    P([-9, -24, 9, -24, 9.6, -41, -9.6, -41], "#8b9bb4");
    for (let k = 0; k < 4; k++) L([-9, -27 - k * 3.6, 9, -27 - k * 3.6], "#5a6988", 0.8);
  }
  if (o.breastplate) {
    R(-5.6, -38, 11.2, 13, "#feae34");
    const G = ["#e43b44", "#63c74d", "#0099db", "#feae34", "#b55088", "#2ce8f5", "#f77622", "#c0cbdc", "#3e8948", "#68386c", "#e4a672", "#124e89"];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) R(-4.8 + k * 3.4, -37 + r * 3.1, 2.6, 2.4, G[r * 3 + k]);
  }
  if (o.collar) {
    E(0, -40, 9.6, 4.4, "#0099db");
    E(0, -40.6, 8, 3, "#feae34");
    E(0, -41.2, 6.4, 2, "#124e89");
  }
  // Cinto
  R(-10, -25, 20, 2.6, o.trim);
  // Braço de trás
  P([-8, -41, -12.4, -36, -12.8, -26, -9.6, -25.6], o.robe);
  C(-11.6, -25, 2.1, skinD);
  // Cabeça
  const hx = 0.6;
  const hy = -48;
  C(hx, hy, 6.2, skin);
  P([hx - 6.2, hy, hx - 2, hy + 5.8, hx + 2, hy + 6, hx - 1, hy + 2, hx - 4.6, hy - 1], skinD);
  R(hx + 1.2, hy - 3.4, 4, 1.1, "#181425");
  R(hx + 1.8, hy - 2, 3, 2.2, o.queen ? "#3e2731" : "#ffffff");
  R(hx + 3.2, hy - 1.8, 1.4, 1.8, "#a22633");
  P([hx + 5.6, hy - 0.8, hx + 7.6, hy + 1.2, hx + 5.6, hy + 1.8], skin);
  if (o.queen) {
    R(hx + 1, hy - 3.6, 4.6, 0.8, "#68386c");
    R(hx + 3, hy + 3, 2.6, 1, "#a22633");
  }
  if (o.beard) {
    P([hx - 4.6, hy + 1.6, hx + 6.6, hy + 2.4, hx + 5.4, hy + 9, hx + 1, hy + (o.curls ? 13 : 11), hx - 3, hy + 8], o.beard);
    if (o.curls) for (let k = 0; k < 4; k++) L([hx - 2 + k * 2.2, hy + 4, hx - 2 + k * 2.2, hy + 11], "#3a4466", 0.6);
  }
  if (o.shout) {
    P([hx + 3, hy + 3, hx + 7, hy + 3.4, hx + 5, hy + 5.8], "#3e2731");
    if (!RM && Math.sin(t * 4) > 0) {
      L([hx + 10, hy, hx + 14, hy - 2], "#ffffff", 0.7);
      L([hx + 10, hy + 3, hx + 15, hy + 3], "#ffffff", 0.7);
    }
  }
  const head = o.head;
  if (head === "crown") {
    R(hx - 6.4, hy - 7.4, 12.8, 3, "#feae34");
    for (let k = 0; k < 4; k++) P([hx - 6.4 + k * 4.2, hy - 7.4, hx - 4.8 + k * 4.2, hy - 12, hx - 3.2 + k * 4.2, hy - 7.4], "#feae34");
    C(hx, hy - 6, 1, "#e43b44");
    C(hx - 4, hy - 6, 0.8, "#0099db");
  } else if (head === "tiara" || head === "tiara_low") {
    const h = head === "tiara" ? 12 : 7;
    P([hx - 6.4, hy - 5, hx + 6.4, hy - 5, hx + 5.4, hy - 5 - h, hx - 5.4, hy - 5 - h], head === "tiara" ? "#ead4aa" : "#c0cbdc");
    R(hx - 6.4, hy - 7, 12.8, 2, o.trim);
    if (head === "tiara") P([hx - 1.6, hy - 17, hx, hy - 21, hx + 1.6, hy - 17], o.trim);
  } else if (head === "tall") {
    R(hx - 6, hy - 19, 12, 13, "#124e89");
    for (let k = 0; k < 3; k++) R(hx - 6, hy - 17 + k * 4, 12, 1.2, "#feae34");
    P([hx - 6, hy - 19, hx, hy - 23, hx + 6, hy - 19], "#feae34");
  } else if (head === "nemes") {
    P([hx - 7, hy - 4, hx - 6, hy - 9, hx + 6, hy - 9, hx + 7, hy - 4, hx + 4, hy - 5, hx - 4, hy + 8, hx - 9, hy + 10], "#0099db");
    for (let k = 0; k < 5; k++) L([hx - 8.4 + k * 0.6, hy - 6 + k * 3, hx - 2 + k * 0.6, hy - 7 + k * 3], "#feae34", 0.9);
    C(hx + 5.6, hy - 9, 1.3, "#feae34");
    R(hx + 2.6, hy + 4, 1.6, 6, "#3e2731");
  } else if (head === "laurel") {
    for (let k = 0; k < 6; k++) E(hx - 6 + k * 2.4, hy - 6.6 + Math.abs(k - 2.5) * 0.6, 1.4, 0.8, o.shine ? "#ffffff" : "#feae34");
    P([hx - 6, hy - 5, hx - 5, hy - 9, hx + 2, hy - 10.4, hx + 6, hy - 7, hx + 1, hy - 7.6], "#3e2731");
  } else if (head === "veil") {
    P([hx - 7, hy - 5, hx - 4, hy - 11, hx + 4, hy - 11, hx + 7, hy - 5, hx - 2, hy - 6, hx - 6, hy + 4, hx - 10 + wv, hy + 16, hx - 11 + wv, hy + 4], "#5d275d");
    R(hx - 5, hy - 9.6, 10, 2, "#feae34");
    for (let k = 0; k < 4; k++) C(hx - 3.6 + k * 2.4, hy - 8.6, 0.6, k % 2 ? "#e43b44" : "#2ce8f5");
    R(hx + 2, hy + 6.8, 1.2, 1.2, "#feae34");
  } else if (head === "mitre") {
    P([hx - 6.2, hy - 4, hx - 6.6, hy - 11, hx - 2, hy - 14, hx + 4, hy - 13, hx + 6.6, hy - 10, hx + 6.2, hy - 4], "#ead4aa");
    for (let k = 0; k < 3; k++) L([hx - 6, hy - 6 - k * 2.6, hx + 6, hy - 6 - k * 2.6], "#c0cbdc", 0.6);
    R(hx + 0.6, hy - 9, 4, 2.2, "#feae34");
    L([hx - 1, hy - 6.4, hx + 6, hy - 6.4], "#124e89", 0.7);
  } else if (head === "horns") {
    P([hx - 6, hy - 4, hx - 5, hy - 10, hx + 5, hy - 10, hx + 6, hy - 4], "#a22633");
    P([hx - 5, hy - 9, hx - 9, hy - 15, hx - 3, hy - 10], "#ead4aa");
    P([hx + 5, hy - 9, hx + 9, hy - 15, hx + 3, hy - 10], "#ead4aa");
    C(hx, hy - 8, 1.2, "#feae34");
  } else if (head === "turban") {
    E(hx, hy - 6, 7, 4.6, "#ead4aa");
    L([hx - 6, hy - 6, hx + 6, hy - 8], "#e4a672", 0.9);
    L([hx - 5, hy - 3.6, hx + 6, hy - 5.4], "#e4a672", 0.9);
  } else if (head === "hood") {
    P([hx - 8, hy + 4, hx - 7.6, hy - 6, hx - 2, hy - 11, hx + 5, hy - 9.6, hx + 7.4, hy - 4, hx + 4, hy - 6, hx - 3, hy - 6, hx - 5, hy + 4, hx - 5, hy + 10], o.robe);
  }
  // Braço da frente e o que ele segura
  P([7, -41, 11, -39.6, 17, -34.6, 17.2, -30.4, 10, -31.4, 7, -34], o.robe);
  const hand = [19, -31.4];
  const item = o.item;
  if (item === "scepter") {
    L([hand[0], hand[1] + 26, hand[0] + 1, hand[1] - 22], "#feae34", 1.6);
    C(hand[0] + 1, hand[1] - 23.5, 2.6, "#feae34");
    C(hand[0] + 1, hand[1] - 23.5, 1.3, "#e43b44");
  } else if (item === "sword") {
    L([hand[0], hand[1], hand[0] + 4, hand[1] - 28], "#c0cbdc", 2.2);
    L([hand[0] + 0.4, hand[1] - 3, hand[0] + 3.6, hand[1] - 26], "#ffffff", 0.6);
    L([hand[0] - 3, hand[1] - 1, hand[0] + 3, hand[1] + 0.4], "#feae34", 1.4);
  } else if (item === "knife") {
    L([hand[0], hand[1], hand[0] + 2, hand[1] - 11], "#c0cbdc", 1.4);
    if (o.head === "crown") {
      // O rolo cortado coluna por coluna (Jr 36.23)
      R(-17, -30, 5, 9, "#ead4aa");
      for (let k = 0; k < 3; k++) L([-16, -28 + k * 2.6, -12.6, -28 + k * 2.6], "#733e39", 0.4);
      T.alpha(glow, () => C(-14.6, -18, 2.4, "#f77622"));
    }
  } else if (item === "crook") {
    L([hand[0], hand[1] + 10, hand[0] + 2, hand[1] - 16], "#feae34", 1.6);
    c.strokeStyle = T.F("#0099db");
    c.lineWidth = 1.6 * s;
    c.beginPath();
    c.arc((hand[0] - 1) * s, (hand[1] - 16) * s, 3 * s, 0, Math.PI, true);
    c.stroke();
    for (let k = 0; k < 3; k++) L([-12, -25 + k, -16 - k, -16 + k * 2], k % 2 ? "#feae34" : "#0099db", 0.9);
  } else if (item === "mirror") {
    C(hand[0] + 1, hand[1] - 5, 3.2, "#feae34");
    C(hand[0] + 1, hand[1] - 5, 2.2, "#c0cbdc");
    L([hand[0], hand[1], hand[0] + 0.6, hand[1] - 2], "#feae34", 1);
  } else if (item === "staff") {
    L([hand[0], hand[1] + 30, hand[0] + 1, hand[1] - 22], "#733e39", 1.8);
    if (o.breastplate) T.alpha(0.5, () => C(hand[0] + 1, hand[1] - 23, 2.4, "#63c74d"));
    else C(hand[0] + 1, hand[1] - 22, 1.4, "#3e2731");
  } else if (item === "orb") {
    L([hand[0], hand[1] + 30, hand[0] + 1, hand[1] - 20], "#3e2731", 1.6);
    T.alpha(glow, () => C(hand[0] + 1, hand[1] - 24, 5, "#2ce8f5"));
    C(hand[0] + 1, hand[1] - 24, 2.6, "#ffffff");
    C(hand[0] + 1.6, hand[1] - 24, 1, "#181425");
  } else if (item === "bag") {
    // As trinta moedas (Mt 26.15)
    P([hand[0] - 3, hand[1] + 2, hand[0] + 3, hand[1] + 2, hand[0] + 4.6, hand[1] + 9, hand[0] - 4.6, hand[1] + 9], "#b86f50");
    L([hand[0] - 1.4, hand[1] + 2, hand[0] + 1.4, hand[1] + 2], "#3e2731", 1);
    for (let k = 0; k < 3; k++) T.alpha(glow, () => C(hand[0] - 2 + k * 2, hand[1] + 1, 0.9, "#feae34"));
  } else if (item === "scroll") {
    R(hand[0] - 1, hand[1] - 9, 3.4, 12, "#ead4aa");
    C(hand[0] + 0.7, hand[1] - 9, 1.8, "#e4a672");
    C(hand[0] + 0.7, hand[1] + 3, 1.8, "#e4a672");
  }
  C(hand[0], hand[1], 2.5, skin);
  C(hand[0], hand[1], 1.5, skinD);
  if (o.shine) T.alpha(glow * 0.6, () => C(0, -30, 18, "#ffffff"));
  if (breath) T.alpha(0.5, () => C(hx + 10, hy, 6, "#e43b44"));
}

/* ---------------- espíritos: nuvem de rostos (Legião, Mc 5.9; três espíritos como rãs, Ap 16.13) ---------------- */
function spirit(T, kind, t) {
  const { c, s, C, E, L } = T;
  const n = kind === "legiao" ? 9 : kind === "espiritos_ras" ? 3 : 4;
  const col = kind === "espiritos_ras" ? ["#265c42", "#3e8948", "#63c74d"] : ["#262b44", "#3a4466", "#5a6988"];
  const bob = RM ? 0 : Math.sin(t * 2) * 3;
  T.shadow(18);
  c.translate(0, bob * s);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 6.28 + (RM ? 0 : t * 0.6);
    const r = kind === "legiao" ? 12 : 8;
    const x = Math.cos(a) * r;
    const y = -34 + Math.sin(a) * r * 0.8;
    T.alpha(0.85, () => {
      E(x, y, 9, 11, col[k % 3]);
      // Cauda que se desfaz em fumaça
      L([x, y + 8, x - 4 + Math.sin(t * 3 + k) * 3, y + 20, x + 2, y + 28], col[(k + 1) % 3], 3);
    });
    if (kind === "espiritos_ras") {
      C(x - 3, y - 7, 2.6, col[2]);
      C(x + 3, y - 7, 2.6, col[2]);
      C(x - 3, y - 7, 1.2, "#fee761");
      C(x + 3, y - 7, 1.2, "#fee761");
      L([x - 5, y + 1, x + 5, y + 1], "#181425", 1);
    } else {
      C(x - 3, y - 2, 1.5, "#e43b44");
      C(x + 3, y - 2, 1.5, "#e43b44");
      E(x, y + 4, 2, 2.6 + (RM ? 0 : Math.sin(t * 5 + k)), "#0b0612");
    }
  }
}

/* ---------------- o muro de Jericó (Js 6.20) ---------------- */
function wall(T, kind, t) {
  const { c, s, R, C, P, L } = T;
  T.shadow(32);
  const shake = RM ? 0 : Math.sin(t * 9) * 0.5;
  c.translate(shake * s, 0);
  R(-30, -58, 60, 58, "#b86f50");
  for (let row = 0; row < 11; row++) {
    for (let k = 0; k < 7; k++) {
      const x = -30 + k * 9 + (row % 2) * 4.5;
      if (x + 8 > 30.5) continue;
      R(x + 0.4, -57.6 + row * 5.2, 8.2, 4.4, row % 3 === 0 ? "#d77643" : "#be4a2f");
    }
  }
  for (let k = 0; k < 5; k++) R(-30 + k * 13, -64, 8, 6.4, "#b86f50");
  // Rachaduras
  L([-6, -58, -2, -44, -8, -32, -3, -18, -9, 0], "#3e2731", 1.2);
  L([14, -58, 10, -40, 18, -26], "#3e2731", 1);
  // Olhos nas frestas e a porta de Raabe com o cordão (Js 2.18)
  C(-14, -40, 3, "#181425");
  C(10, -40, 3, "#181425");
  C(-13.4, -40, 1.4, "#fee761");
  C(10.6, -40, 1.4, "#fee761");
  P([-6, 0, -6, -16, 0, -21, 6, -16, 6, 0], "#3e2731");
  R(22, -50, 4, 6, "#3e2731");
  L([24, -44, 25, -26], "#e43b44", 1);
  for (let k = 0; k < 6; k++) {
    if (RM) break;
    const f = (t * 0.9 + rnd(k)) % 1;
    R(-30 + rnd(k + 3) * 60, -58 + f * 58, 1.2, 1.2, "#e4a672");
  }
}

/* ---------------- o grande peixe (Jn 1.17) ---------------- */
function fish(T, kind, t, breath) {
  const { c, s, P, C, E, L } = T;
  const sw = RM ? 0 : Math.sin(t * 2) * 2;
  E(0, -2, 40, 5, "#124e89");
  c.translate(0, sw * s);
  P([22, -26, 44, -44 + sw, 40, -24, 46, -8 - sw, 22, -18], "#3a4466");
  E(0, -24, 30, 18, "#5a6988");
  E(2, -16, 24, 9, "#8b9bb4");
  P([-4, -40, 8, -54, 12, -38], "#3a4466");
  // Boca aberta virada para o herói
  const open = breath ? 9 : 4 + (RM ? 0 : Math.sin(t * 3) * 1.5);
  P([-30, -24, -14, -24 - open, -14, -24 + open], "#3e2731");
  P([-28, -24, -16, -22 - open * 0.6, -16, -24], "#a22633");
  C(-16, -32, 3, "#ead4aa");
  C(-17, -32, 1.6, "#181425");
  for (let k = 0; k < 3; k++) L([-6 + k * 4, -30, -8 + k * 4, -20], "#3a4466", 0.8);
  for (let k = 0; k < 4; k++) {
    if (RM) break;
    const f = (t * 0.7 + k * 0.25) % 1;
    C(-28 - f * 6, -40 - f * 20, 1 + f, "#2ce8f5");
  }
}

/* ---------------- tempestade e Euroaquilão (Mc 4.37; At 27.14) ---------------- */
function storm(T, kind, t) {
  const { c, s, C, E, L } = T;
  const bob = RM ? 0 : Math.sin(t * 1.6) * 2;
  for (let k = 0; k < 14; k++) {
    const x = -26 + rnd(k) * 52;
    const f = RM ? 0.5 : (t * 1.8 + rnd(k + 9)) % 1;
    L([x - f * 6, -30 + f * 30, x - f * 6 - 2, -26 + f * 30], "#8b9bb4", 0.6);
  }
  c.translate(0, bob * s);
  [[-16, -48, 14], [0, -56, 17], [17, -48, 14], [-6, -42, 15], [10, -40, 13]].forEach(([x, y, r], k) => C(x, y, r, k % 2 ? "#3a4466" : "#262b44"));
  E(0, -38, 24, 6, "#181425");
  C(-7, -50, 2.4, "#fee761");
  C(7, -50, 2.4, "#fee761");
  E(0, -42, 6, 3 + (RM ? 0 : Math.abs(Math.sin(t * 2)) * 2), "#0b0612");
  // Sopro de vento na direção do herói
  for (let k = 0; k < 3; k++) L([-24, -44 + k * 5, -34 - k * 3, -46 + k * 5, -42, -42 + k * 5], "#c0cbdc", 0.8);
  if (!RM && t % 2.4 < 0.18) {
    L([12, -36, 8, -26, 14, -24, 6, -8], "#fee761", 1.6);
    T.alpha(0.25, () => C(0, -30, 40, "#ffffff"));
  }
}

/* ---------------- a Morte (Ap 6.8) e Abadom, anjo do abismo (Ap 9.11) ---------------- */
function death(T, kind, t) {
  const { c, s, P, C, L, R } = T;
  const bob = RM ? 0 : Math.sin(t * 1.8) * 2;
  const wv = RM ? 0 : Math.sin(t * 2.4);
  T.shadow(18);
  c.translate(0, bob * s);
  if (kind === "abadom") {
    // Asas de gafanhoto (Ap 9.7-9)
    T.alpha(0.7, () => {
      P([2, -40, 26, -62 + wv * 3, 32, -40, 10, -30], "#8b9bb4");
      P([2, -36, 22, -24 + wv * 2, 30, -12, 8, -26], "#5a6988");
    });
  }
  P([-12, 0, 12, 0, 9, -36, 4, -50, -4, -50, -9, -36], "#181425");
  P([-12, 0, -4, 0, -5, -36, -4, -50, -9, -36], "#0b0612");
  for (let k = 0; k < 4; k++) P([-12 + k * 6, 0, -9 + k * 6, -4 - (k % 2) * 2 - wv, -6 + k * 6, 0], "#262b44");
  // Capuz e caveira
  P([-8, -40, -7, -52, 0, -57, 7, -52, 8, -40, 4, -46, -4, -46], "#181425");
  C(0, -46, 4.6, "#c0cbdc");
  R(-2.8, -47, 2, 2, "#181425");
  R(1, -47, 2, 2, "#181425");
  R(-1.4, -43, 2.8, 1, "#3a4466");
  if (kind === "abadom") {
    for (let k = 0; k < 3; k++) P([-4 + k * 3, -55, -2.6 + k * 3, -59, -1.2 + k * 3, -55], "#feae34");
    T.alpha(0.6, () => {
      C(-1.8, -46, 1, "#e43b44");
      C(2, -46, 1, "#e43b44");
    });
  }
  // Mão ossuda e foice
  C(-12, -30, 2, "#c0cbdc");
  L([-12, 0, -12, -62], "#733e39", 1.6);
  c.strokeStyle = T.F("#c0cbdc");
  c.lineWidth = 2 * s;
  c.beginPath();
  c.arc(-3 * s, -62 * s, 9 * s, Math.PI, Math.PI * 1.75);
  c.stroke();
}

/* ---------------- estátuas: a de Dura (Dn 3.1) e a Ártemis dos efésios (At 19.27) ---------------- */
function statue(T, kind, t) {
  const { c, s, P, R, C, E, L } = T;
  const gold = kind === "estatua_ouro";
  const body = gold ? "#feae34" : "#c0cbdc";
  const dark = gold ? "#f77622" : "#8b9bb4";
  const glint = RM ? 0.5 : 0.4 + 0.4 * Math.sin(t * 2);
  T.shadow(20);
  R(-16, -8, 32, 8, "#5a6988");
  R(-14, -12, 28, 4, "#8b9bb4");
  P([-11, -12, 11, -12, 8, -48, -8, -48], body);
  P([-11, -12, -4, -12, -4, -48, -8, -48], dark);
  if (gold) {
    // Os braços cruzados e a coroa da estátua do rei
    R(-9, -40, 18, 3, dark);
    C(0, -54, 6.6, body);
    P([-6.6, -58, -4, -66, 0, -60, 4, -66, 6.6, -58], body);
    R(1.4, -56, 3.6, 1.4, "#3e2731");
    P([-4, -50, 6, -50, 4, -42, -2, -42], dark);
  } else {
    // Coroa em forma de torre e as fileiras de ornamentos do peito
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) E(-4.4 + k * 4.4, -40 + r * 4, 1.8, 1.6, dark);
    for (let r = 0; r < 5; r++) R(-7, -30 + r * 3.4, 14, 1.2, dark);
    C(0, -54, 6, body);
    R(-5.4, -66, 10.8, 7, body);
    for (let k = 0; k < 3; k++) R(-5.4 + k * 4.2, -68, 2.4, 2.4, body);
    R(1.4, -56, 3.6, 1.2, "#3e2731");
    L([-9, -46, -16, -32], body, 2.4);
    L([9, -46, 16, -32], body, 2.4);
  }
  T.alpha(glint, () => L([-6, -46, -6, -16], "#ffffff", 1));
}

/* ---------------- Dagom, o ídolo meio peixe (1Sm 5.4) ---------------- */
function dagon(T, kind, t) {
  const { c, s, P, R, C, L } = T;
  T.shadow(20);
  R(-15, -6, 30, 6, "#5a6988");
  // Cauda de peixe no lugar das pernas
  P([-9, -6, 9, -6, 7, -26, -7, -26], "#3e8948");
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) C(-5 + k * 5 + (r % 2) * 2.4, -9 - r * 4.4, 1.8, "#265c42");
  P([-9, -6, -18, -2, -16, -12], "#3e8948");
  // Tronco de pedra
  P([-9, -26, 9, -26, 10, -44, -10, -44], "#8b9bb4");
  P([-9, -26, -4, -26, -4.6, -44, -10, -44], "#5a6988");
  C(0, -50, 6, "#8b9bb4");
  R(1.6, -52, 3.6, 1.4, "#181425");
  P([-6, -54, 0, -62, 6, -54], "#265c42");
  // Rachaduras: caiu diante da arca e se quebrou
  L([-2, -56, 2, -48, -1, -40, 3, -30], "#3e2731", 0.9);
  L([-10, -44, -14, -34], "#8b9bb4", 3);
  R(14, -3, 7, 3, "#8b9bb4");
  C(-14, -33, 2.2, "#8b9bb4");
  if (!RM) T.alpha(0.3 + 0.3 * Math.sin(t * 3), () => C(0, -50, 9, "#2ce8f5"));
}

const ScribeBosses = { KINDS, draw };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeBosses = ScribeBosses;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeBosses;
}
})();
