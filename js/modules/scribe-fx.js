/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: animações
 * ==========================================================================
 * As animações da versão nova do jogo: poses do herói, golpes que voam até o
 * inimigo (fogo, relâmpago, luz), ataque do inimigo (garras ou orbe), letras da
 * palavra vencida voltando ao rolo, pilar de luz ao subir de nível, chuva de
 * bênçãos do óleo, clarão, letreiros em tela cheia, transição entre telas e as
 * cenas ilustradas do prólogo e do final de cada livro.
 *
 * Tudo aqui só desenha: o motor (scribe-chronicles.js) decide quando.
 * Quem pede menos movimento no sistema fica sem os efeitos que se mexem.
 */

(function () {
const RM =
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const gfx = () => (typeof window !== "undefined" ? window.ScribeGraphics : null);

/* ---------------- golpe de cada classe ---------------- */

/**
 * Golpe de cada herói, coerente com o modelo bíblico da classe.
 * Hebraico: fogo do céu do profeta (2Rs 1.10), golpe de luz do guerreiro,
 * relâmpago do juiz. Grego: a rede do pescador (Mt 4.19), o pilo do centurião
 * (o dardo da legião romana) e a carta do fazedor de tendas, que se desenrola
 * sobre o inimigo (as cartas de Paulo).
 */
const CLASS_ATTACK = {
  hebrew: { mago: "fogo", cavaleiro: "luz", assassino: "raio" },
  greek: { mago: "rede", cavaleiro: "pilo", assassino: "carta" },
};
const ATTACK_TIME = {
  fogo: { d: 0.42, hit: 380 },
  raio: { d: 0.5, hit: 120 },
  luz: { d: 0.36, hit: 260 },
  rede: { d: 0.5, hit: 470 },
  pilo: { d: 0.3, hit: 280 },
  carta: { d: 0.46, hit: 430 },
};
/** Cor das faíscas quando o golpe acerta */
const ATTACK_COLOR = { fogo: "#f77622", raio: "#9fd8ff", luz: "#fee761", rede: "#2ce8f5", pilo: "#e4a672", carta: "#feae34" };

function attackFor(language, cls) {
  const table = CLASS_ATTACK[language === "greek" ? "greek" : "hebrew"];
  return table[cls] || table.mago;
}

/* ---------------- pose do herói ---------------- */

/** Inclinação e deslocamento do herói conforme a pose (ataque, magia, dano, esquiva, vitória) */
function heroPose(pose, t) {
  let rot = 0;
  let dx = 0;
  let dy = 0;
  if (pose && !RM) {
    const k = (t - pose.t0) / pose.d;
    if (k >= 0 && k < 1) {
      const e = Math.sin(k * Math.PI);
      if (pose.k === "atk") {
        rot = 0.22 * e;
        dx = 7 * e;
      } else if (pose.k === "cast") {
        rot = -0.14 * e;
        dy = -4 * e;
      } else if (pose.k === "hurt") {
        rot = -0.28 * e;
        dx = -10 * e;
      } else if (pose.k === "dodge") {
        dx = -18 * e;
        rot = -0.1 * e;
      } else if (pose.k === "win") {
        dy = -16 * Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k);
      }
    }
  }
  return { rot, dx, dy };
}

/** Escala do herói na arena (maior no celular, como na versão nova) */
const heroScale = (W, sc) => sc * (W < 480 ? 1.75 : 1.5);

/* ---------------- projéteis ---------------- */

function drawProj(c, A, W, H, gy, sc, t) {
  if (!A.proj || !A.proj.length) return;
  const g = gfx();
  const hx = W * 0.18 + 20 * sc;
  const hy = gy - 60 * sc;
  const mx = W * 0.72;
  const my = gy - 45 * sc;
  for (const p of A.proj) {
    const k = (t - p.t0) / p.d;
    if (k < 0 || k > 1.6) continue;
    if (p.k === "fogo") {
      if (k <= 1) {
        const x = hx + (mx - hx) * k;
        const y = hy + (my - hy) * k - Math.sin(k * Math.PI) * 30;
        for (let i = 6; i >= 1; i--) {
          const kk = Math.max(0, k - i * 0.04);
          const tx = hx + (mx - hx) * kk;
          const ty = hy + (my - hy) * kk - Math.sin(kk * Math.PI) * 30;
          c.globalAlpha = 0.5 * (1 - i / 7);
          c.fillStyle = i > 3 ? "#be4a2f" : "#f77622";
          c.beginPath();
          c.arc(tx, ty, 9 - i, 0, 7);
          c.fill();
        }
        c.globalAlpha = 1;
        c.fillStyle = "#f77622";
        c.beginPath();
        c.arc(x, y, 10, 0, 7);
        c.fill();
        c.fillStyle = "#fee761";
        c.beginPath();
        c.arc(x + 2, y - 1, 5, 0, 7);
        c.fill();
      } else {
        const e = (k - 1) / 0.6;
        c.globalAlpha = 1 - e;
        c.fillStyle = "#f77622";
        c.beginPath();
        c.arc(mx, my, 10 + e * 40, 0, 7);
        c.fill();
        c.fillStyle = "#fee761";
        c.beginPath();
        c.arc(mx, my, 6 + e * 20, 0, 7);
        c.fill();
        c.globalAlpha = 1;
      }
    } else if (p.k === "raio") {
      if (k < 1.2) {
        c.globalAlpha = k < 0.4 ? 1 : Math.max(0, 1.2 - k);
        if (k < 0.25) {
          c.fillStyle = "rgba(159,216,255,.25)";
          c.fillRect(0, 0, W, H);
        }
        if (g && g.bolt) {
          g.bolt(c, mx - 10, 0, mx, my, Math.floor(t * 20), "#2ce8f5", 7);
          g.bolt(c, mx - 10, 0, mx, my, Math.floor(t * 20), "#ffffff", 3);
          g.bolt(c, mx + 20, 0, mx + 4, my - 10, Math.floor(t * 20) + 3, "#9fd8ff", 1.5);
        }
        c.strokeStyle = "#2ce8f5";
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(mx, gy, 30 * k + 10, 6, 0, 0, 7);
        c.stroke();
        c.globalAlpha = 1;
      }
    } else if (p.k === "rede") {
      drawNet(c, k, hx, hy, mx, my, t);
    } else if (p.k === "pilo") {
      drawPilum(c, k, hx, hy, mx, my, t, p.t0);
    } else if (p.k === "carta") {
      drawLetter(c, k, hx, hy, mx, my, t);
    } else if (k < 1.4) {
      const e = Math.min(1, k);
      c.globalAlpha = k > 1 ? Math.max(0, 1.4 - k) / 0.4 : 1;
      c.strokeStyle = "#fee761";
      c.lineWidth = 5;
      c.beginPath();
      c.arc(mx - 10, my, 38, -1.2, -1.2 + e * 2.6);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(mx - 10, my, 38, -1.2, -1.2 + e * 2.6);
      c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28 + t;
        c.strokeStyle = "rgba(254,231,97,.6)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(mx + Math.cos(a) * 14 * e, my + Math.sin(a) * 14 * e);
        c.lineTo(mx + Math.cos(a) * 34 * e, my + Math.sin(a) * 34 * e);
        c.stroke();
      }
      c.globalAlpha = 0.5 * (1 - e);
      c.fillStyle = "#fee761";
      c.beginPath();
      c.arc(hx - 10, hy + 10, 26, 0, 7);
      c.fill();
      c.globalAlpha = 1;
    }
  }
  A.proj = A.proj.filter((p) => (t - p.t0) / p.d < 1.6);
}

/** Rede de pesca: sai girando, abre no ar e envolve o inimigo, espirrando água */
function drawNet(c, k, hx, hy, mx, my, t) {
  const grid = (cx, cy, r, rot, alpha) => {
    c.save();
    c.translate(cx, cy);
    c.rotate(rot);
    c.globalAlpha = alpha;
    c.strokeStyle = "#c0cbdc";
    c.lineWidth = 1.5;
    c.beginPath();
    for (let i = -3; i <= 3; i++) {
      const o = (i / 3) * r;
      const w = Math.sqrt(Math.max(0, r * r - o * o));
      c.moveTo(o, -w);
      c.lineTo(o, w);
      c.moveTo(-w, o);
      c.lineTo(w, o);
    }
    c.stroke();
    c.strokeStyle = "#733e39";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, r, 0, 7);
    c.stroke();
    // boias de cortiça na borda da rede
    c.fillStyle = "#feae34";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.28;
      c.fillRect(Math.cos(a) * r - 2, Math.sin(a) * r - 2, 4, 4);
    }
    c.restore();
    c.globalAlpha = 1;
  };
  if (k <= 1) {
    const x = hx + (mx - hx) * k;
    const y = hy + (my - hy) * k - Math.sin(k * Math.PI) * 40;
    // corda presa à mão do pescador
    c.strokeStyle = "#b86f50";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(hx, hy);
    c.quadraticCurveTo((hx + x) / 2, Math.min(hy, y) - 20, x, y);
    c.stroke();
    grid(x, y, 6 + 18 * k, k * 5, 1);
  } else {
    const e = (k - 1) / 0.6;
    grid(mx, my, 26 - e * 6, 0, 1 - e * 0.6);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 6.28;
      c.globalAlpha = 1 - e;
      c.fillStyle = i % 2 ? "#2ce8f5" : "#0099db";
      c.fillRect(mx + Math.cos(a) * (14 + e * 30), my + Math.sin(a) * (10 + e * 20) + e * e * 30, 3, 3);
    }
    c.globalAlpha = 1;
  }
}

/** Pilo romano: o dardo voa reto, crava no inimigo e solta faíscas */
function drawPilum(c, k, hx, hy, mx, my, t, t0) {
  const ang = Math.atan2(my - hy, mx - hx) - 0.12 * (1 - Math.min(1, k) * 2);
  const at = (x, y, a, shake) => {
    c.save();
    c.translate(x, y);
    c.rotate(a + shake);
    c.scale(1.5, 1.5);
    c.fillStyle = "#0b0612";
    c.fillRect(-35, -2.5, 46, 5);
    c.fillStyle = "#d77643";
    c.fillRect(-34, -1.5, 22, 3);
    c.fillStyle = "#c0cbdc";
    c.fillRect(-12, -1, 14, 2);
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(2, -3);
    c.lineTo(9, 0);
    c.lineTo(2, 3);
    c.fill();
    c.fillStyle = "#3e2731";
    c.fillRect(-14, -2.5, 3, 5);
    c.restore();
  };
  if (k <= 1) {
    const x = hx + (mx - 18 - hx) * k;
    const y = hy + (my - hy) * k - Math.sin(k * Math.PI) * 14;
    c.globalAlpha = 0.35;
    c.strokeStyle = "#ead4aa";
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x - 40 - i * 8, y - 4 + i * 4);
      c.lineTo(x - 70 - i * 8, y - 4 + i * 4);
      c.stroke();
    }
    c.globalAlpha = 1;
    at(x, y, ang, 0);
  } else {
    const e = (k - 1) / 0.6;
    c.globalAlpha = e > 0.7 ? (1 - e) / 0.3 : 1;
    at(mx - 24, my, ang, Math.sin((t - t0) * 60) * 0.08 * (1 - e));
    c.globalAlpha = 1;
    for (let i = 0; i < 10; i++) {
      const a = -1.6 + (i / 9) * 3.2;
      c.globalAlpha = 1 - e;
      c.fillStyle = i % 2 ? "#feae34" : "#f77622";
      c.fillRect(mx - 10 + Math.cos(a) * (6 + e * 34), my + Math.sin(a) * (6 + e * 26), 3, 3);
    }
    c.globalAlpha = 1;
  }
}

/** Carta do apóstolo: o rolo voa girando, se abre sobre o inimigo e solta as letras em luz */
function drawLetter(c, k, hx, hy, mx, my, t) {
  if (k <= 1) {
    const x = hx + (mx - hx) * k;
    const y = hy + (my - hy) * k - Math.sin(k * Math.PI) * 34;
    for (let i = 4; i >= 1; i--) {
      const kk = Math.max(0, k - i * 0.05);
      c.globalAlpha = 0.25 * (1 - i / 5);
      c.fillStyle = "#fee761";
      c.fillRect(hx + (mx - hx) * kk - 3, hy + (my - hy) * kk - Math.sin(kk * Math.PI) * 34 - 3, 6, 6);
    }
    c.globalAlpha = 1;
    c.save();
    c.translate(x, y);
    c.rotate(k * 9);
    c.fillStyle = "#ead4aa";
    c.fillRect(-9, -4, 18, 8);
    c.fillStyle = "#733e39";
    c.fillRect(-11, -5, 3, 10);
    c.fillRect(8, -5, 3, 10);
    c.fillStyle = "#a22633";
    c.fillRect(-2, -2, 4, 4);
    c.restore();
  } else {
    const e = (k - 1) / 0.6;
    const w = 18 + Math.min(1, e * 3) * 46;
    c.globalAlpha = 1 - e * 0.8;
    c.fillStyle = "#ead4aa";
    c.fillRect(mx - w / 2, my - 14, w, 28);
    c.fillStyle = "#733e39";
    c.fillRect(mx - w / 2 - 3, my - 16, 4, 32);
    c.fillRect(mx + w / 2 - 1, my - 16, 4, 32);
    c.fillStyle = "#3e2731";
    for (let i = 0; i < 4; i++) c.fillRect(mx - w / 2 + 6, my - 9 + i * 6, Math.max(0, w - 14) * (0.6 + 0.4 * rnd(i)), 1.5);
    // as letras sobem da carta como luz
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (rnd(i) - 0.5) * 2.4;
      const r = e * (30 + rnd(i + 5) * 40);
      c.globalAlpha = 1 - e;
      c.fillStyle = i % 3 ? "#feae34" : "#ffffff";
      const lx = mx + Math.cos(a) * r;
      const ly = my + Math.sin(a) * r;
      c.fillRect(lx - 1, ly - 3, 2, 6);
      c.fillRect(lx - 3, ly - 1, 6, 2);
    }
    c.globalAlpha = 0.35 * (1 - e);
    c.fillStyle = "#fee761";
    c.beginPath();
    c.arc(mx, my, 20 + e * 30, 0, 7);
    c.fill();
    c.globalAlpha = 1;
  }
}

/* ---------------- chuva de bênçãos (óleo de cura) ---------------- */

function drawHeal(c, A, W, H, gy, sc, t) {
  if (!A.heal) return;
  const k = (t - A.heal) / 1.8;
  if (k > 1) {
    A.heal = 0;
    return;
  }
  const hx = W * 0.18;
  const hy = gy - 40 * sc;
  if (k < 0.75) {
    c.globalAlpha = k < 0.6 ? 0.8 : 0.8 * (1 - (k - 0.6) / 0.15);
    c.fillStyle = "#3a4466";
    c.beginPath();
    c.ellipse(hx, 16, 46 * sc, 10, 0, 0, 7);
    c.ellipse(hx - 26 * sc, 20, 24 * sc, 8, 0, 0, 7);
    c.ellipse(hx + 26 * sc, 20, 24 * sc, 8, 0, 0, 7);
    c.fill();
    c.strokeStyle = "#9fd8ff";
    c.lineWidth = 1.5;
    for (let i = 0; i < 22; i++) {
      const x = hx + (rnd(i) - 0.5) * 80 * sc;
      const y = 24 + ((t * 300 + rnd(i + 30) * gy) % (gy - 24));
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 2, y + 9);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  for (let j = 0; j < 7; j++) {
    const kj = (k * 9 - j) / 2.2;
    if (kj < 0 || kj > 1) continue;
    c.globalAlpha = 1 - kj;
    c.strokeStyle = j % 2 ? "#2ce8f5" : "#9fd8ff";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(hx, gy, 10 + kj * 44 * sc, 3 + kj * 9 * sc, 0, 0, 7);
    c.stroke();
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 16; i++) {
    const kk = (k * 1.6 + rnd(i)) % 1;
    c.globalAlpha = (1 - kk) * (k < 0.9 ? 1 : (1 - k) * 10);
    c.fillStyle = i % 3 ? "#63c74d" : "#ffffff";
    c.fillRect(hx + (rnd(i + 7) - 0.5) * 40 * sc + Math.sin(t * 4 + i) * 4, gy - kk * 90 * sc, 3, 3);
  }
  c.globalAlpha = 0.3 * Math.sin(Math.min(1, k) * Math.PI);
  c.fillStyle = "#63c74d";
  c.beginPath();
  c.arc(hx, hy, 34 * sc, 0, 7);
  c.fill();
  c.globalAlpha = 1;
}

/* ---------------- ataque do inimigo, subida de nível e clarão ---------------- */

function drawEnemyFX(c, A, W, H, gy, sc, t, mx, rageColor) {
  const hx = W * 0.18;
  const hy = gy - 42 * sc;
  const e = A.eatk;
  if (e && !RM) {
    const k = (t - e.t0) / 0.42;
    if (k >= 0 && k < 1) {
      if (e.caster) {
        // Orbe que voa do inimigo até o herói
        const kk = Math.min(1, k / 0.6);
        const x = mx + (hx - mx) * kk;
        const y = gy - 55 * sc + (hy - (gy - 55 * sc)) * kk;
        for (let i = 4; i >= 0; i--) {
          c.globalAlpha = (1 - i / 5) * (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4);
          c.fillStyle = i ? "#68386c" : "#b55088";
          c.beginPath();
          c.arc(x + i * 7, y, 7 - i, 0, 7);
          c.fill();
        }
        if (k >= 0.6 && !e.dodged) {
          const b = (k - 0.6) / 0.4;
          c.globalAlpha = 1 - b;
          c.fillStyle = "#b55088";
          c.beginPath();
          c.arc(hx, hy, 8 + b * 26, 0, 7);
          c.fill();
        }
      } else if (!e.dodged) {
        // Três garras riscando o herói
        c.globalAlpha = 1 - k;
        [["#f1e9d8", 2.5, 0], ["#e43b44", 1, 2]].forEach(([col, w, off]) => {
          c.strokeStyle = col;
          c.lineWidth = w;
          for (let i = 0; i < 3; i++) {
            const o = (i - 1) * 9 * sc + off;
            const L = Math.min(1, k * 2.5);
            c.beginPath();
            c.moveTo(hx + 14 * sc + o, hy - 22 * sc);
            c.lineTo(hx + 14 * sc + o - 28 * sc * L, hy - 22 * sc + 44 * sc * L);
            c.stroke();
          }
        });
      }
      c.globalAlpha = 1;
    }
  }
  if (A.lvl) {
    const k = (t - A.lvl) / 1.3;
    if (k < 1) {
      c.globalAlpha = 0.55 * Math.sin(k * Math.PI);
      const g = c.createLinearGradient(0, 0, 0, gy);
      g.addColorStop(0, "rgba(254,231,97,0)");
      g.addColorStop(1, "#fee761");
      c.fillStyle = g;
      c.fillRect(hx - 22 * sc, 0, 44 * sc, gy);
      c.globalAlpha = 1;
      for (let i = 0; i < 14; i++) {
        const kk = (k * 1.4 + rnd(i)) % 1;
        c.globalAlpha = 1 - kk;
        c.fillStyle = "#ffffff";
        c.fillRect(hx + (rnd(i + 3) - 0.5) * 44 * sc, gy - kk * gy * 0.8, 2, 4);
      }
      c.globalAlpha = 1;
    } else A.lvl = 0;
  }
  if (A.flash > t) {
    c.globalAlpha = 0.4;
    c.fillStyle = rageColor ? "#e43b44" : "#ffffff";
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
}

/* ---------------- letras da palavra vencida voltando ao rolo ---------------- */

/** Letras de uma palavra sem sinais (pontos vocálicos, acentos e espíritos) */
function lettersOf(term) {
  return [...String(term || "").normalize("NFD").replace(/[֑-ׇ̀-ͯ͂-ͅ\s־,()[\]/·.;-]/g, "")].slice(0, 12);
}

function drawLetters(c, A, W, H, gy, sc, t, font) {
  if (!A.letters || !A.letters.length) return;
  c.font = font;
  c.textAlign = "center";
  for (const l of A.letters) {
    const k = (t - l.t0) / 1.15;
    if (k < 0 || k > 1) continue;
    const e = k * k * (3 - 2 * k);
    const sx = W * 0.72 + (l.i - l.n / 2) * -14;
    const sy = gy - 50 * sc;
    const ex = W * 0.12;
    const ey = 24;
    const x = sx + (ex - sx) * e;
    const y = sy + (ey - sy) * e - Math.sin(k * Math.PI) * 46;
    c.globalAlpha = k < 0.85 ? 1 : (1 - k) / 0.15;
    c.fillStyle = "#181425";
    c.fillText(l.ch, x + 2, y + 2);
    c.fillStyle = "#feae34";
    c.fillText(l.ch, x, y);
  }
  c.globalAlpha = 1;
  A.letters = A.letters.filter((l) => t - l.t0 < 1.15);
}

/* ---------------- letreiro em tela cheia e transição ---------------- */

const escHtml = (text) => String(text === null || text === undefined ? "" : text)
  .replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));

/** Letreiro que atravessa a tela ("Você caiu", nome do guardião, "Fúria"...) */
function banner(text, kind, sub) {
  if (RM || typeof document === "undefined") return;
  document.querySelectorAll(".sc-bannerfx").forEach((x) => x.remove());
  const d = document.createElement("div");
  d.className = `sc-bannerfx${kind ? ` is-${kind}` : ""}`;
  d.setAttribute("aria-hidden", "true");
  d.innerHTML = `<div><b>${escHtml(text)}</b>${sub ? `<span>${escHtml(sub)}</span>` : ""}</div>`;
  d.addEventListener("animationend", () => d.remove());
  document.body.appendChild(d);
}

/** Escurece e clareia a tela ao trocar de cena */
function wipe(color) {
  if (RM || typeof document === "undefined") return;
  const d = document.createElement("div");
  d.className = "sc-wipe";
  d.setAttribute("aria-hidden", "true");
  if (color) d.style.background = color;
  d.addEventListener("animationend", () => d.remove());
  document.body.appendChild(d);
}

/* ---------------- figuras das cenas da história ---------------- */

function scrollProp(c, x, y, s, torn, glow, t) {
  if (glow) {
    c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3);
    c.fillStyle = "#fee761";
    c.beginPath();
    c.arc(x, y, 34 * s, 0, 7);
    c.fill();
    c.globalAlpha = 1;
  }
  c.fillStyle = "#ead4aa";
  if (!torn) c.fillRect(x - 24 * s, y - 12 * s, 48 * s, 24 * s);
  else {
    c.fillRect(x - 24 * s, y - 12 * s, 20 * s, 24 * s);
    c.save();
    c.translate(x + 14 * s, y);
    c.rotate(0.35);
    c.fillRect(-10 * s, -12 * s, 22 * s, 24 * s);
    c.restore();
  }
  c.fillStyle = "#733e39";
  c.fillRect(x - 28 * s, y - 14 * s, 4 * s, 28 * s);
  c.fillRect(x + 24 * s, y - 14 * s, 4 * s, 28 * s);
  c.fillStyle = "#3e2731";
  for (let i = 0; i < 5; i++) {
    if (torn && i % 2) continue;
    c.fillRect(x - 18 * s, y - 8 * s + i * 4 * s, (torn ? 12 : 36) * s, 1.2 * s);
  }
}

/** O mestre (Kelley no hebraico, Bergmann no grego) */
function drawMaster(c, x, gy, s, t) {
  const b = RM ? 0 : Math.sin(t * 1.5);
  c.fillStyle = "#5a6988";
  c.beginPath();
  c.moveTo(x - 10 * s, gy);
  c.lineTo(x - 7 * s, gy - 34 * s + b);
  c.lineTo(x + 7 * s, gy - 34 * s + b);
  c.lineTo(x + 10 * s, gy);
  c.fill();
  c.fillStyle = "#e8b796";
  c.beginPath();
  c.arc(x, gy - 38 * s + b, 5 * s, 0, 7);
  c.fill();
  c.fillStyle = "#f1e9d8";
  c.beginPath();
  c.moveTo(x - 5 * s, gy - 37 * s + b);
  c.lineTo(x + 5 * s, gy - 37 * s + b);
  c.lineTo(x, gy - 26 * s + b);
  c.fill();
  c.fillStyle = "#3a4466";
  c.fillRect(x - 6 * s, gy - 44 * s + b, 12 * s, 3 * s);
  c.strokeStyle = "#733e39";
  c.lineWidth = 2 * s;
  c.beginPath();
  c.moveTo(x + 12 * s, gy);
  c.lineTo(x + 12 * s, gy - 46 * s);
  c.stroke();
}

const ALPHABET = { hebrew: "אבגדהוזחטיכלמנסעפצקרשת", greek: "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ" };

/**
 * Desenho de cada quadro da história. env traz: hero(ctx, cls, x, gy, s, t, relics),
 * cls (classe do aluno), boss(ctx, kind, x, gy, sc, t) e lang.
 */
const SLIDE_DRAW = {
  master(c, W, H, t) {
    const gy = H * 0.86;
    scrollProp(c, W * 0.66, gy - 34, 1, false, true, t);
    drawMaster(c, W * 0.3, gy, 1.2, t);
  },
  devourer(c, W, H, t) {
    const g = gfx();
    const k = RM ? 0.45 : (t * 0.12) % 1;
    if (g) g.drawDragon(c, W * (1.15 - k * 1.4), H * 0.5 + Math.sin(t * 2) * 10, 26, t, false, { col: "#68386c", belly: "#b55088", big: true, breath: k > 0.4 && k < 0.6 });
  },
  torn(c, W, H, t) {
    scrollProp(c, W * 0.66, H * 0.86 - 34, 1, true, false, t);
  },
  heroes(c, W, H, t, T, env) {
    const gy = H * 0.86;
    const s = Math.min(1.2, H / 210) * 1.2;
    ["mago", "cavaleiro", "assassino"].forEach((cls, i) => env.hero(c, cls, W * (0.25 + i * 0.25), gy, s, t, false));
  },
  brood(c, W, H, t) {
    const g = gfx();
    if (!g) return;
    const gy = H * 0.86;
    const s = Math.min(1.2, H / 210) * 30;
    ["imp", "wraith", "raven"].forEach((sp, i) => g.drawMobSprite(c, sp, W * (0.3 + i * 0.22), gy, s, t + i, false, false, i + 1, W));
  },
  trail(c, W, H, t, T, env) {
    const gy = H * 0.86;
    scrollProp(c, W * 0.82, gy - 60, 0.6, true, true, t);
    env.hero(c, env.cls, W * (0.15 + (RM ? 0.2 : Math.min(0.4, T * 0.06))), gy, Math.min(1.2, H / 210) * 1.2, t, true);
  },
  fall(c, W, H, t, T) {
    const g = gfx();
    if (!g) return;
    const k = Math.min(1, T / 3);
    c.save();
    c.translate(W * 0.55, H * 0.3 + k * H * 0.5);
    c.rotate(k * 0.9);
    g.drawDragon(c, 0, 0, 26, t, !RM && Math.sin(t * 20) > 0 && k < 1, { col: "#68386c", belly: "#b55088", big: true, heads: 1 });
    c.restore();
  },
  beastfall(c, W, H, t, T) {
    const g = gfx();
    if (!g) return;
    const k = Math.min(1, T / 3);
    c.save();
    c.translate(W * 0.55, H * 0.3 + k * H * 0.5);
    c.rotate(k * 0.9);
    g.drawDragon(c, 0, 0, 26, t, !RM && Math.sin(t * 20) > 0 && k < 1, { heads: 7, big: true, col: "#a22633", belly: "#f77622", crowns: true });
    c.restore();
  },
  statuefall(c, W, H, t, T, env) {
    const k = Math.min(1, T / 2.4);
    const gy = H * 0.86;
    c.save();
    c.translate(W * 0.6, gy);
    c.rotate(-k * 1.3);
    env.boss(c, "estatua_ouro", 0, 0, Math.min(1.2, H / 210), t);
    c.restore();
  },
  restore(c, W, H, t, T) {
    scrollProp(c, W * 0.66, H * 0.86 - 34, 1, T < 2.2, T >= 2.2, t);
  },
  handover(c, W, H, t, T, env) {
    const gy = H * 0.86;
    drawMaster(c, W * 0.62, gy, 1.2, t);
    env.hero(c, env.cls, W * 0.32, gy, Math.min(1.2, H / 210) * 1.3, t, true);
    scrollProp(c, W * 0.47, gy - 56, 0.5, false, true, t);
  },
};

/** Quadros de cada parte da história: cenário, céu, desenho e letras (1 se espalham, -1 voltam) */
const SLIDES = {
  hebrew: {
    1: {
      prologue: [["tents", 0, "master"], ["sinai", 3, "devourer"], ["tents", 3, "torn", 1], ["hills", 1, "heroes"], ["garden", 1, "trail"]],
      ending: [["sinai", 3, "fall"], ["tents", 0, "restore", -1], ["garden", 1, "handover"]],
    },
    2: {
      prologue: [["tents", 0, "master"], ["hills", 3, "brood"], ["spring", 1, "trail"]],
      ending: [["spring", 3, "statuefall"], ["tents", 0, "restore", -1], ["tents", 1, "handover"]],
    },
  },
  greek: {
    1: {
      prologue: [["pillar", 0, "master"], ["mountain", 3, "torn", 1], ["hills", 1, "heroes"], ["spring", 1, "trail"]],
      ending: [["spring", 3, "beastfall"], ["pillar", 0, "restore", -1], ["garden", 1, "handover"]],
    },
  },
};

function slidesFor(language, book, part) {
  const lang = language === "greek" ? "greek" : "hebrew";
  const table = (SLIDES[lang] && SLIDES[lang][book]) || SLIDES[lang][1];
  return table[part] || [];
}

/**
 * Desenha um quadro da história no canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Array} slide [cenário, céu, desenho, letras]
 * @param {number} T segundos desde que o quadro apareceu
 * @param {Object} env { lang, cls, hero(ctx, cls, x, gy, s, t, relics), boss(ctx, kind, x, gy, sc, t) }
 */
function renderSlide(canvas, slide, T, env) {
  const g = gfx();
  if (!g || !canvas || !slide) return;
  const [scene, sky, kind, letters] = slide;
  const t = performance.now() / 1000;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return;
  if (canvas.width !== Math.round(W * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const PX = 2;
  const lw = Math.ceil(W / PX);
  const lh = Math.ceil(H / PX);
  const low = g.buf("cut", lw, lh);
  const lc = low.getContext("2d");
  const spr = g.buf("cut-spr", lw, lh);
  const sc = spr.getContext("2d");
  g.setEnvironment({ darkSky: false });
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  g.paintBG(lc, W, H, scene, sky, t);
  g.sceneFX(lc, W, H, scene, t, false);
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.clearRect(0, 0, lw, lh);
  sc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  if (SLIDE_DRAW[kind]) SLIDE_DRAW[kind](sc, W, H, t, RM ? 9 : T, env);
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.outlineOnto(lc, spr, "#0b0612");
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  g.vignette(lc, W, H, false);
  const fade = RM ? 0 : Math.max(0, 1 - T / 0.6);
  if (fade) {
    lc.fillStyle = `rgba(0,0,0,${fade})`;
    lc.fillRect(0, 0, W, H);
  }
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.quantize(lc, lw, lh);
  const c = canvas.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  c.drawImage(low, 0, 0, lw, lh, 0, 0, lw * PX * dpr, lh * PX * dpr);
  if (letters) {
    // As letras do alfabeto se espalham do rolo (ou voltam para ele)
    const abc = ALPHABET[env.lang === "greek" ? "greek" : "hebrew"];
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.font = env.font || "700 20px serif";
    c.textAlign = "center";
    for (let j = 0; j < abc.length; j++) {
      let k = RM ? 1 : Math.min(1, T / 2.2);
      if (letters < 0) k = 1 - k;
      const a = rnd(j) * 6.28;
      const r = k * (W * 0.25 + rnd(j + 40) * W * 0.3);
      const x = W * 0.66 + Math.cos(a) * r;
      const y = H * 0.86 - 34 + Math.sin(a) * r * 0.6 - k * 30;
      c.globalAlpha = letters < 0 && k < 0.05 ? 0 : 1;
      c.fillStyle = "#181425";
      c.fillText(abc[j], x + 2, y + 2);
      c.fillStyle = "#feae34";
      c.fillText(abc[j], x, y);
    }
    c.globalAlpha = 1;
  }
}

/* ---------------- letreiro animado do capítulo (tela do pergaminho) ---------------- */

/**
 * Cenário do capítulo com o nome no original e "Capítulo N · Cidade"
 * @param {Object} opts { scene, sky, native, label, rtl, fontNative, fontLabel }
 */
function renderChapterBanner(canvas, opts) {
  const g = gfx();
  if (!g || !canvas) return;
  const t = performance.now() / 1000;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return;
  if (canvas.width !== Math.round(W * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const PX = 2;
  const lw = Math.ceil(W / PX);
  const lh = Math.ceil(H / PX);
  const low = g.buf("chbanner", lw, lh);
  const lc = low.getContext("2d");
  g.setEnvironment({ darkSky: false });
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  g.paintBG(lc, W, H, opts.scene, opts.sky, t);
  g.sceneFX(lc, W, H, opts.scene, t, false);
  if (g.fgFX) g.fgFX(lc, W, H, opts.scene, t);
  g.vignette(lc, W, H, false);
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.quantize(lc, lw, lh);
  const c = canvas.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  c.drawImage(low, 0, 0, lw, lh, 0, 0, lw * PX * dpr, lh * PX * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.font = opts.fontNative;
  c.direction = opts.rtl ? "rtl" : "ltr";
  c.textAlign = "right";
  const nx = W - 16;
  c.fillStyle = "#181425";
  c.fillText(opts.native, nx + 2, 36);
  c.fillStyle = "#feae34";
  c.fillText(opts.native, nx, 34);
  c.direction = "ltr";
  c.font = opts.fontLabel;
  c.textAlign = "left";
  c.fillStyle = "#181425";
  c.fillText(opts.label, 16, H - 12);
  c.fillStyle = "#f1e9d8";
  c.fillText(opts.label, 14, H - 14);
}

const ScribeFX = {
  CLASS_ATTACK,
  ATTACK_TIME,
  ATTACK_COLOR,
  attackFor,
  SLIDES,
  heroPose,
  heroScale,
  drawProj,
  drawHeal,
  drawEnemyFX,
  drawLetters,
  lettersOf,
  banner,
  wipe,
  scrollProp,
  drawMaster,
  slidesFor,
  renderSlide,
  renderChapterBanner,
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeFX = ScribeFX;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeFX;
}
})();
