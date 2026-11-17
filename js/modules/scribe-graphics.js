/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: arte em pixel
 * ==========================================================================
 * Cenários, heróis, criaturas e guardiões desenhados em canvas, sem imagens
 * externas, vindos da versão nova do jogo (heróis com as relíquias no corpo,
 * criaturas por região, guardiões bíblicos com desenho próprio e neblina por cena).
 * O desenho é feito em baixa resolução e passa por uma paleta de 32 cores com
 * pontilhado e contorno, o que dá o aspecto de jogo de 8 bits.
 *
 * O motor informa, por setEnvironment, o que antes eram variáveis globais:
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

function paintBG(c, W, H, scene, idx, t) {
  const sky = SKY2[scene] && !ENV.darkSky ? SKY2[scene] : SKIES[idx % 4],
    gy = H * 0.8,
    g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const night = idx % 4 === 0 || idx % 4 === 3;
  if (night) {
    for (let i = 0; i < 46; i++) {
      c.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.5 + i);
      c.fillStyle = "#f1e9d8";
      c.fillRect((i * 97) % W, (i * 53) % (H * 0.55), 1.5, 1.5);
    }
    c.globalAlpha = 1;
  }
  c.fillStyle = night ? "#f3e3b0" : "#ffd98a";
  c.beginPath();
  c.arc(W * 0.5, H * 0.16, night ? 11 : 15, 0, 7);
  c.fill();
  const st = { scene },
    far = "#1d3a5e",
    near = "#10253f",
    gold = "#e2b04a";
  const hill = (y, a, f, ph, col) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) c.lineTo(x, y + Math.sin(x * f + ph) * a);
    c.lineTo(W, H);
    c.fill();
  };
  const tri = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.lineTo(x, y - h);
    c.lineTo(x + w / 2, y);
    c.fill();
  };
  const tree = (x, y, s) => {
    c.fillStyle = near;
    c.fillRect(x - 2 * s, y - 14 * s, 4 * s, 14 * s);
    c.beginPath();
    c.arc(x, y - 18 * s, 10 * s, 0, 7);
    c.arc(x - 7 * s, y - 13 * s, 7 * s, 0, 7);
    c.arc(x + 7 * s, y - 13 * s, 7 * s, 0, 7);
    c.fill();
  };
  const palm = (x, y, s) => {
    c.strokeStyle = near;
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + 4 * s, y - 14 * s, x + 2 * s, y - 28 * s);
    c.stroke();
    c.fillStyle = near;
    for (let k = 0; k < 5; k++) {
      const a = -2.6 + k * 0.55;
      c.beginPath();
      c.ellipse(x + 2 * s + Math.cos(a) * 9 * s, y - 28 * s + Math.sin(a) * 5 * s, 10 * s, 2.6 * s, a, 0, 7);
      c.fill();
    }
  };
  const tent = (x, y, s, col) => {
    tri(x, y, 34 * s, 22 * s, col || near);
    c.fillStyle = gold;
    c.globalAlpha = 0.6;
    c.fillRect(x - 1.5, y - 9 * s, 3, 9 * s);
    c.globalAlpha = 1;
  };
  const wall = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(x, y - h, w, h);
    for (let k = x; k < x + w; k += 12) c.fillRect(k, y - h - 6, 7, 6);
  };
  hill(gy - 18, 6, 0.02, 1, far);
  switch (st.scene) {
    case "garden":
      hill(gy, 4, 0.03, 2, near);
      [0.1, 0.22, 0.36, 0.62, 0.74].forEach((p, i) => tree(W * p, gy + 2, 0.9 + (i % 2) * 0.3));
      c.strokeStyle = "#4f8fc0";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(W * 0.45, H);
      c.quadraticCurveTo(W * 0.5, gy, W * 0.58, gy - 6);
      c.stroke();
      break;
    case "mountain":
      tri(W * 0.62, gy, W * 0.6, H * 0.62, far);
      tri(W * 0.62, gy - H * 0.62 + 16, W * 0.11, 16, "#dfe6f3");
      c.fillStyle = gold;
      c.fillRect(W * 0.6, gy - H * 0.62 + 8, 26, 7);
      hill(gy, 5, 0.02, 0, near);
      break;
    case "tower":
      hill(gy, 3, 0.03, 0, near);
      for (let k = 0; k < 6; k++) {
        const w = W * 0.32 - k * W * 0.045,
          h = 13;
        c.fillStyle = k % 2 ? far : "#24466f";
        c.fillRect(W * 0.55 - w / 2, gy - (k + 1) * h, w, h);
      }
      c.fillStyle = gold;
      c.fillRect(W * 0.55 - 3, gy - 6 * 13 - 8, 6, 8);
      break;
    case "ziggurat":
      hill(gy, 3, 0.03, 0, near);
      for (let k = 0; k < 3; k++) {
        const w = W * 0.3 - k * W * 0.08;
        c.fillStyle = far;
        c.fillRect(W * 0.6 - w / 2, gy - (k + 1) * 16, w, 16);
      }
      wall(W * 0.05, gy, W * 0.3, 16, near);
      break;
    case "well":
      hill(gy, 4, 0.025, 1, near);
      palm(W * 0.22, gy, 1);
      palm(W * 0.7, gy, 1.1);
      c.fillStyle = near;
      c.fillRect(W * 0.45, gy - 14, 34, 14);
      c.fillStyle = "#4f8fc0";
      c.fillRect(W * 0.45 + 4, gy - 14, 26, 3);
      break;
    case "hills":
      hill(gy - 6, 10, 0.012, 2, "#173352");
      hill(gy, 7, 0.02, 4, near);
      [0.3, 0.36, 0.42].forEach((p) => {
        c.fillStyle = "#24466f";
        c.fillRect(W * p, gy - 26, 14, 12);
      });
      break;
    case "pillar":
      hill(gy, 4, 0.02, 0, near);
      c.fillStyle = "#2c4c74";
      c.fillRect(W * 0.5 - 7, gy - 36, 14, 36);
      c.strokeStyle = gold;
      c.globalAlpha = 0.55;
      c.lineWidth = 1.5;
      for (let k = 0; k < 2; k++) {
        c.beginPath();
        c.moveTo(W * 0.5 - 14 + k * 28, gy - 40);
        c.lineTo(W * 0.62 - 14 + k * 28, 0);
        c.stroke();
      }
      for (let k = 1; k < 8; k++) {
        const yy = gy - 40 - k * ((gy - 40) / 8);
        const xx = W * 0.5 + W * 0.12 * (k / 8);
        c.beginPath();
        c.moveTo(xx - 14, yy);
        c.lineTo(xx + 14, yy);
        c.stroke();
      }
      c.globalAlpha = 1;
      break;
    case "tents":
      hill(gy, 4, 0.02, 0, near);
      tent(W * 0.3, gy, 1);
      tent(W * 0.45, gy, 0.8, "#24466f");
      tent(W * 0.58, gy, 1.1);
      tree(W * 0.8, gy + 2, 1.3);
      break;
    case "pyramids":
      c.fillStyle = "#3a3a52";
      [
        [0.35, 0.38, 0.4],
        [0.6, 0.3, 0.32],
        [0.78, 0.2, 0.22],
      ].forEach(([x, w, h]) => {
        tri(W * x, gy, W * w, H * h, "#2f3f5c");
        c.strokeStyle = gold;
        c.globalAlpha = 0.6;
        c.beginPath();
        c.moveTo(W * x, gy - H * h);
        c.lineTo(W * x + (W * w) / 2, gy);
        c.stroke();
        c.globalAlpha = 1;
      });
      hill(gy, 2, 0.03, 0, near);
      break;
    case "sea":
      c.fillStyle = "#1f5f8f";
      c.fillRect(0, gy - 34, W * 0.42, H);
      c.fillRect(W * 0.58, gy - 34, W * 0.42, H);
      c.fillStyle = "#7fb7dc";
      for (let x = 0; x < W; x += 16) {
        if (x > W * 0.42 && x < W * 0.58) continue;
        c.fillRect(x + Math.sin(t * 2 + x) * 2, gy - 34, 8, 2);
      }
      c.fillStyle = "#3a3424";
      c.fillRect(W * 0.42, gy, W * 0.16, H);
      break;
    case "spring":
      hill(gy, 4, 0.025, 2, near);
      c.fillStyle = "#2f6f9f";
      c.beginPath();
      c.ellipse(W * 0.5, gy + 4, W * 0.14, 8, 0, 0, 7);
      c.fill();
      [0.15, 0.25, 0.75, 0.86].forEach((p, i) => palm(W * p, gy, 0.8 + (i % 2) * 0.3));
      break;
    case "sinai":
      tri(W * 0.55, gy, W * 0.7, H * 0.66, "#22385a");
      c.fillStyle = "rgba(240,240,250,.75)";
      c.beginPath();
      c.ellipse(W * 0.55, gy - H * 0.66, 46, 14, 0, 0, 7);
      c.fill();
      c.fillStyle = "rgba(255,150,60," + (0.55 + 0.3 * Math.sin(t * 6)) + ")";
      c.beginPath();
      c.ellipse(W * 0.55, gy - H * 0.62, 16, 8, 0, 0, 7);
      c.fill();
      hill(gy, 4, 0.02, 0, near);
      break;
    case "dunes":
      hill(gy - 10, 9, 0.015, t * 0.1, "#5a4a2c");
      hill(gy, 7, 0.022, 1 + t * 0.15, "#3b301c");
      break;
    case "walls":
      hill(gy, 3, 0.02, 0, near);
      wall(W * 0.15, gy, W * 0.22, 30, "#2c4c74");
      wall(W * 0.62, gy, W * 0.24, 30, "#2c4c74");
      c.fillStyle = "#2c4c74";
      for (let k = 0; k < 7; k++) c.fillRect(W * 0.4 + k * 9, gy - 4 - (k % 3) * 5, 8, 6);
      break;
    case "tabernacle":
      hill(gy, 3, 0.02, 0, near);
      c.strokeStyle = "#cfd6e3";
      c.lineWidth = 1;
      for (let x = W * 0.25; x <= W * 0.75; x += 10) {
        c.beginPath();
        c.moveTo(x, gy);
        c.lineTo(x, gy - 12);
        c.stroke();
      }
      c.fillStyle = "#c9b48a";
      c.fillRect(W * 0.25, gy - 12, W * 0.5, 4);
      c.fillStyle = "#24466f";
      c.fillRect(W * 0.48, gy - 30, W * 0.16, 30);
      c.fillStyle = gold;
      c.fillRect(W * 0.48, gy - 30, W * 0.16, 3);
      break;
    case "temple":
      hill(gy, 3, 0.02, 0, near);
      wall(0, gy, W, 16, "#2a4466");
      c.fillStyle = "#3a5b84";
      c.fillRect(W * 0.42, gy - 48, W * 0.18, 32);
      c.fillStyle = gold;
      c.fillRect(W * 0.4, gy - 52, W * 0.22, 5);
      for (let k = 0; k < 5; k++) {
        c.fillStyle = "#cfd6e3";
        c.fillRect(W * 0.44 + k * W * 0.033, gy - 44, 3, 28);
      }
      break;
  }

  c.fillStyle = "rgba(5,10,20,.35)";
  c.fillRect(0, gy + 2, W, H - gy);
}

const SKIES = [
  ["#07080f", "#3a1f2a"],
  ["#0b0f1c", "#5a2a1e"],
  ["#0d1422", "#43342a"],
  ["#0a0a14", "#2b1838"],
];
let EMB = [];
function embers(c, W, H, t, boss) {
  if (RM) return;
  if (EMB.length < (boss ? 60 : 34)) EMB.push({ x: Math.random() * W, y: H + 5, v: 12 + Math.random() * 28, s: 1 + Math.random() * 2, ph: Math.random() * 6 });
  EMB.forEach((e) => {
    e.y -= e.v / 60;
    const x = e.x + Math.sin(t + e.ph) * 8;
    c.globalAlpha = Math.max(0, Math.min(1, e.y / H)) * 0.8;
    c.fillStyle = boss ? "#ff6a2a" : "#ffb15a";
    c.fillRect(x, e.y, e.s, e.s);
  });
  EMB = EMB.filter((e) => e.y > -5);
  c.globalAlpha = 1;
}
function vignette(c, W, H, red) {
  const g = c.createRadialGradient(W / 2, H * 0.55, H * 0.2, W / 2, H * 0.55, W * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, red ? "rgba(60,0,0,.55)" : "rgba(0,0,0,.6)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}
function wingPath(c, s, flap, dir) {
  /* asa de morcego/dragão */
  c.beginPath();
  c.moveTo(0, 0);
  const up = -s * (1.1 + flap * 0.35);
  c.lineTo(dir * s * 0.6, up);
  c.lineTo(dir * s * 1.5, up * 0.75);
  c.lineTo(dir * s * 1.9, up * 0.15);
  c.quadraticCurveTo(dir * s * 1.45, s * 0.05, dir * s * 1.25, s * 0.25);
  c.quadraticCurveTo(dir * s * 0.95, s * 0.05, dir * s * 0.75, s * 0.3);
  c.quadraticCurveTo(dir * s * 0.45, s * 0.1, 0, s * 0.3);
  c.closePath();
}
function glowEye(c, x, y, r, col) {
  c.save();
  c.shadowColor = col;
  c.shadowBlur = 10;
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(x, y, r * 1.3, r * 0.7, 0, 0, 7);
  c.fill();
  c.restore();
}

function drawImp(c, x, gy, s, t, flash, seed) {
  const bob = Math.sin(t * 4 + seed) * 4,
    flap = Math.sin(t * 9 + seed),
    y = gy - s * 1.15 + bob,
    col = flash ? "#fff" : ["#7a1a1a", "#5a1f4f", "#7a3a12"][seed % 3];
  c.save();
  c.translate(x, y);
  c.fillStyle = "rgba(0,0,0,.35)";
  c.beginPath();
  c.ellipse(0, s * 1.12 - bob, s * 0.55, s * 0.12, 0, 0, 7);
  c.fill();
  c.fillStyle = flash ? "#fff" : "#3e2731";
  [1, -1].forEach((d) => {
    c.save();
    c.translate(d * s * 0.25, -s * 0.2);
    wingPath(c, s * 0.8, flap, d);
    c.fill();
    c.restore();
  });
  c.strokeStyle = col;
  c.lineWidth = s * 0.08;
  c.beginPath();
  c.moveTo(s * 0.2, s * 0.5);
  c.quadraticCurveTo(s * 0.9, s * 0.7, s * 0.8, s * 0.1);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(s * 0.8, s * 0.1);
  c.lineTo(s * 0.95, -s * 0.05);
  c.lineTo(s * 0.68, 0);
  c.fill();
  const g = c.createLinearGradient(0, -s * 0.5, 0, s * 0.8);
  g.addColorStop(0, col);
  g.addColorStop(1, "#1a0508");
  c.fillStyle = flash ? "#fff" : g;
  c.beginPath();
  c.ellipse(0, s * 0.2, s * 0.38, s * 0.5, 0, 0, 7);
  c.fill();
  c.beginPath();
  c.arc(0, -s * 0.42, s * 0.3, 0, 7);
  c.fill();
  c.fillStyle = "#d9c7a0";
  [1, -1].forEach((d) => {
    c.beginPath();
    c.moveTo(d * s * 0.15, -s * 0.62);
    c.quadraticCurveTo(d * s * 0.45, -s * 0.85, d * s * 0.3, -s * 1.05);
    c.lineTo(d * s * 0.25, -s * 0.62);
    c.fill();
  });
  glowEye(c, -s * 0.12, -s * 0.45, s * 0.06, "#ffd23a");
  glowEye(c, s * 0.08, -s * 0.45, s * 0.06, "#ffd23a");
  c.fillStyle = "#d9c7a0";
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.moveTo(-s * 0.42 + k * s * 0.05, s * 0.25);
    c.lineTo(-s * 0.52 + k * s * 0.05, s * 0.42);
    c.lineTo(-s * 0.36 + k * s * 0.05, s * 0.3);
    c.fill();
  }
  c.restore();
}
function drawWraith(c, x, gy, s, t, flash, seed) {
  const bob = Math.sin(t * 2 + seed) * 6,
    y = gy - s * 1.3 + bob;
  c.save();
  c.translate(x, y);
  c.fillStyle = "rgba(0,0,0,.3)";
  c.beginPath();
  c.ellipse(0, s * 1.3 - bob, s * 0.5, s * 0.1, 0, 0, 7);
  c.fill();
  const g = c.createLinearGradient(0, -s, 0, s * 1.1);
  g.addColorStop(0, flash ? "#fff" : "#5a6988");
  g.addColorStop(1, "rgba(20,24,38,0)");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, -s * 0.95);
  c.quadraticCurveTo(s * 0.55, -s * 0.85, s * 0.5, -s * 0.2);
  c.lineTo(s * 0.62, s * 0.9);
  for (let k = 0; k < 6; k++) {
    const xx = s * 0.62 - k * s * 0.25;
    c.lineTo(xx - s * 0.12, s * (0.7 + 0.25 * Math.sin(t * 6 + k)));
    c.lineTo(xx - s * 0.25, s * 0.95);
  }
  c.lineTo(-s * 0.5, -s * 0.2);
  c.quadraticCurveTo(-s * 0.55, -s * 0.85, 0, -s * 0.95);
  c.fill();
  c.fillStyle = "#05060a";
  c.beginPath();
  c.ellipse(-s * 0.05, -s * 0.48, s * 0.25, s * 0.3, 0, 0, 7);
  c.fill();
  glowEye(c, -s * 0.14, -s * 0.5, s * 0.05, "#7fe8ff");
  glowEye(c, s * 0.04, -s * 0.5, s * 0.05, "#7fe8ff");
  c.strokeStyle = "#8f9bb0";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-s * 0.6, -s * 0.9);
  c.lineTo(-s * 0.45, s * 0.8);
  c.stroke();
  c.fillStyle = "#b9c3d6";
  c.beginPath();
  c.moveTo(-s * 0.6, -s * 0.9);
  c.quadraticCurveTo(-s * 1.1, -s * 0.85, -s * 1.15, -s * 0.45);
  c.quadraticCurveTo(-s * 0.95, -s * 0.7, -s * 0.58, -s * 0.75);
  c.fill();
  c.restore();
}
function drawDragon(c, x, gy, s, t, flash, { heads = 1, col = "#3d1f1a", belly = "#a8722c", big = false, breath = false, crowns = false } = {}) {
  const flap = Math.sin(t * (big ? 2.4 : 3.2)),
    bob = Math.sin(t * 1.6) * 3;
  c.save();
  c.translate(x, gy - s * 0.15 + bob);
  c.fillStyle = "rgba(0,0,0,.4)";
  c.beginPath();
  c.ellipse(0, s * 0.12 - bob, s * 1.3, s * 0.18, 0, 0, 7);
  c.fill();
  const body = flash ? "#fff" : col,
    wing = flash ? "#fff" : shade(col, -0.35),
    rim = "rgba(255,210,160,.45)";
  c.lineJoin = "round";
  c.fillStyle = wing;
  c.strokeStyle = rim;
  c.lineWidth = 1.2;
  c.save();
  c.translate(s * 0.25, -s * 0.85);
  c.rotate(-0.2);
  wingPath(c, s * 1.15, flap, 1);
  c.fill();
  c.stroke();
  c.restore();
  c.strokeStyle = body;
  c.lineWidth = s * 0.22;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(s * 0.6, -s * 0.35);
  c.quadraticCurveTo(s * 1.4, -s * 0.2, s * 1.5, -s * 0.75);
  c.stroke();
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(s * 1.5, -s * 0.75);
  c.lineTo(s * 1.72, -s * 1.02);
  c.lineTo(s * 1.36, -s * 0.86);
  c.fill();
  const g = c.createLinearGradient(0, -s * 1.1, 0, 0);
  g.addColorStop(0, shade(col, 0.25));
  g.addColorStop(1, shade(col, -0.4));
  c.fillStyle = flash ? "#fff" : g;
  c.beginPath();
  c.ellipse(s * 0.15, -s * 0.5, s * 0.75, s * 0.48, 0, 0, 7);
  c.fill();
  c.strokeStyle = rim;
  c.lineWidth = 1.2;
  c.stroke();
  c.fillStyle = flash ? "#fff" : belly;
  c.beginPath();
  c.ellipse(-s * 0.05, -s * 0.35, s * 0.45, s * 0.25, 0.2, 0, 7);
  c.fill();
  [[-s * 0.3], [s * 0.45]].forEach(([lx]) => {
    c.fillStyle = body;
    c.fillRect(lx - s * 0.1, -s * 0.25, s * 0.2, s * 0.32);
    c.fillStyle = "#e8dcc0";
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(lx - s * 0.12 + k * s * 0.09, s * 0.07);
      c.lineTo(lx - s * 0.16 + k * s * 0.09, s * 0.15);
      c.lineTo(lx - s * 0.06 + k * s * 0.09, s * 0.07);
      c.fill();
    }
  });
  c.fillStyle = flash ? "#fff" : shade(col, -0.2);
  c.strokeStyle = rim;
  c.save();
  c.translate(s * 0.05, -s * 0.75);
  c.rotate(0.25);
  wingPath(c, s * 0.95, flap * 0.9, 1);
  c.globalAlpha = 0.95;
  c.fill();
  c.stroke();
  c.restore();
  c.globalAlpha = 1;
  for (let h = 0; h < heads; h++) {
    const off = h - (heads - 1) / 2,
      sway = Math.sin(t * 2 + h * 1.7) * s * 0.06,
      hx = -s * 0.9 + (heads > 3 ? Math.abs(off) * s * 0.1 : off * s * 0.12) + sway,
      hy = -s * 1.2 + off * s * (heads > 3 ? 0.19 : 0.35);
    c.strokeStyle = body;
    c.lineWidth = s * 0.26;
    c.beginPath();
    c.moveTo(-s * 0.35, -s * 0.7);
    c.quadraticCurveTo(-s * 0.6, -s * 1.1 + off * s * 0.15, hx + s * 0.15, hy);
    c.stroke();
    c.strokeStyle = rim;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-s * 0.35, -s * 0.83);
    c.quadraticCurveTo(-s * 0.6, -s * 1.23 + off * s * 0.15, hx + s * 0.15, hy - s * 0.13);
    c.stroke();
    c.save();
    c.translate(hx, hy);
    c.fillStyle = flash ? "#fff" : shade(col, 0.15);
    c.beginPath();
    c.moveTo(s * 0.24, -s * 0.16);
    c.lineTo(-s * 0.38, -s * 0.07);
    c.lineTo(-s * 0.46, s * 0.05);
    c.lineTo(-s * 0.05, s * 0.14);
    c.lineTo(s * 0.26, s * 0.1);
    c.fill();
    c.strokeStyle = rim;
    c.stroke();
    c.fillStyle = "#e8dcc0";
    c.beginPath();
    c.moveTo(s * 0.08, -s * 0.13);
    c.quadraticCurveTo(s * 0.3, -s * 0.4, s * 0.44, -s * 0.46);
    c.quadraticCurveTo(s * 0.24, -s * 0.24, s * 0.18, -s * 0.08);
    c.fill();
    if (crowns) {
      c.fillStyle = "#feae34";
      c.fillRect(-s * 0.14, -s * 0.22, s * 0.24, s * 0.06);
      for (let q = 0; q < 3; q++) c.fillRect(-s * 0.14 + q * s * 0.09, -s * 0.28, s * 0.05, s * 0.07);
    }
    glowEye(c, -s * 0.1, -s * 0.05, s * 0.05, big ? "#ff4a1a" : "#ffcf3a");
    c.fillStyle = "#f1e9d8";
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(-s * 0.36 + k * s * 0.08, s * 0.04);
      c.lineTo(-s * 0.33 + k * s * 0.08, s * 0.11);
      c.lineTo(-s * 0.3 + k * s * 0.08, s * 0.04);
      c.fill();
    }
    if (breath) {
      for (let k = 0; k < 16; k++) {
        const d = Math.random();
        c.globalAlpha = 0.85 * (1 - d);
        c.fillStyle = d < 0.4 ? "#ffe08a" : d < 0.7 ? "#ff8a2a" : "#c2361a";
        c.beginPath();
        c.arc(-s * 0.5 - d * s * 1.9, s * 0.04 + (Math.random() - 0.5) * d * s * 0.6, s * (0.06 + d * 0.13), 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  c.restore();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function drawArchDemon(c, x, gy, s, t, flash, breath) {
  const flap = Math.sin(t * 2.2),
    bob = Math.sin(t * 1.5) * 3,
    col = flash ? "#fff" : "#8a1a1e";
  c.save();
  c.translate(x, gy + bob);
  c.fillStyle = "rgba(0,0,0,.4)";
  c.beginPath();
  c.ellipse(0, -bob, s * 0.9, s * 0.16, 0, 0, 7);
  c.fill();
  c.fillStyle = flash ? "#fff" : "#3e2731";
  [1, -1].forEach((d) => {
    c.save();
    c.translate(d * s * 0.3, -s * 1.55);
    wingPath(c, s * 1.05, flap, d);
    c.fill();
    c.restore();
  });
  const g = c.createLinearGradient(0, -s * 2, 0, 0);
  g.addColorStop(0, col);
  g.addColorStop(1, flash ? "#fff" : "#120304");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-s * 0.5, -s * 1.7);
  c.lineTo(s * 0.5, -s * 1.7);
  c.lineTo(s * 0.32, -s * 0.75);
  c.lineTo(s * 0.42, 0);
  c.lineTo(s * 0.12, 0);
  c.lineTo(0, -s * 0.55);
  c.lineTo(-s * 0.12, 0);
  c.lineTo(-s * 0.42, 0);
  c.lineTo(-s * 0.32, -s * 0.75);
  c.closePath();
  c.fill();
  c.lineWidth = s * 0.17;
  c.strokeStyle = col;
  c.lineCap = "round";
  [1, -1].forEach((d) => {
    c.beginPath();
    c.moveTo(d * s * 0.48, -s * 1.6);
    c.quadraticCurveTo(d * s * 0.8, -s * 1.2, d * s * 0.62, -s * 0.85);
    c.stroke();
    c.fillStyle = "#d9c7a0";
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(d * s * 0.62, -s * 0.85);
      c.lineTo(d * (s * 0.55 + k * s * 0.07), -s * 0.68);
      c.lineTo(d * (s * 0.6 + k * s * 0.03), -s * 0.8);
      c.fill();
    }
  });
  c.fillStyle = col;
  c.beginPath();
  c.arc(0, -s * 1.95, s * 0.28, 0, 7);
  c.fill();
  c.fillStyle = "#cbb48a";
  [1, -1].forEach((d) => {
    c.beginPath();
    c.moveTo(d * s * 0.15, -s * 2.1);
    c.bezierCurveTo(d * s * 0.6, -s * 2.3, d * s * 0.7, -s * 2.6, d * s * 0.45, -s * 2.75);
    c.bezierCurveTo(d * s * 0.5, -s * 2.45, d * s * 0.35, -s * 2.25, d * s * 0.1, -s * 2.0);
    c.fill();
  });
  glowEye(c, -s * 0.1, -s * 1.98, s * 0.05, "#ff3a1a");
  glowEye(c, s * 0.1, -s * 1.98, s * 0.05, "#ff3a1a");
  c.save();
  c.shadowColor = "#ff5a1a";
  c.shadowBlur = 18;
  c.fillStyle = "#ff7a2a";
  c.globalAlpha = 0.6 + 0.3 * Math.sin(t * 4);
  c.beginPath();
  c.moveTo(0, -s * 1.45);
  c.lineTo(s * 0.1, -s * 1.25);
  c.lineTo(0, -s * 1.05);
  c.lineTo(-s * 0.1, -s * 1.25);
  c.fill();
  c.restore();
  if (breath) {
    c.globalAlpha = 0.7;
    for (let k = 0; k < 16; k++) {
      const d = Math.random();
      c.fillStyle = d < 0.5 ? "#ff8a2a" : "#c2361a";
      c.beginPath();
      c.arc(-s * 0.7 - d * s * 1.4, -s * 0.85 + (Math.random() - 0.5) * s * 0.5, s * (0.05 + d * 0.1), 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  c.restore();
}

const PAL = [
  "be4a2f",
  "d77643",
  "ead4aa",
  "e4a672",
  "b86f50",
  "733e39",
  "3e2731",
  "a22633",
  "e43b44",
  "f77622",
  "feae34",
  "fee761",
  "63c74d",
  "3e8948",
  "265c42",
  "193c3e",
  "124e89",
  "0099db",
  "2ce8f5",
  "ffffff",
  "c0cbdc",
  "8b9bb4",
  "5a6988",
  "3a4466",
  "262b44",
  "181425",
  "ff0044",
  "68386c",
  "b55088",
  "f6757a",
  "e8b796",
  "c28569",
].map((h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4), 16)]);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v / 16 - 0.5) * 16);
const QC = new Map();
function nearest(r, g, b) {
  const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  let v = QC.get(k);
  if (v) return v;
  let best = 1e9;
  for (const p of PAL) {
    const d = (r - p[0]) ** 2 * 0.3 + (g - p[1]) ** 2 * 0.59 + (b - p[2]) ** 2 * 0.11;
    if (d < best) {
      best = d;
      v = p;
    }
  }
  QC.set(k, v);
  return v;
}
function quantize(ctx, w, h) {
  const im = ctx.getImageData(0, 0, w, h),
    d = im.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 128) {
        d[i + 3] = 0;
        continue;
      }
      const o = BAYER[(y & 3) * 4 + (x & 3)];
      const p = nearest(Math.max(0, Math.min(255, d[i] + o)), Math.max(0, Math.min(255, d[i + 1] + o)), Math.max(0, Math.min(255, d[i + 2] + o)));
      d[i] = p[0];
      d[i + 1] = p[1];
      d[i + 2] = p[2];
      d[i + 3] = 255;
    }
  ctx.putImageData(im, 0, 0);
}
const BUF = {};
function buf(name, w, h) {
  let c = BUF[name];
  if (!c) {
    c = BUF[name] = document.createElement("canvas");
  }
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}
function outlineOnto(dst, spr, col) {
  const w = spr.width,
    h = spr.height,
    o = buf("ol", w, h),
    oc = o.getContext("2d");
  oc.clearRect(0, 0, w, h);
  oc.globalCompositeOperation = "source-over";
  oc.drawImage(spr, 0, 0);
  oc.globalCompositeOperation = "source-in";
  oc.fillStyle = col;
  oc.fillRect(0, 0, w, h);
  oc.globalCompositeOperation = "source-over";
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].forEach(([dx, dy]) => dst.drawImage(o, dx, dy));
  dst.drawImage(spr, 0, 0);
}

const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function bolt(c, x0, y0, x1, y1, seed, col, w) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x0, y0);
  const n = 7;
  for (let i = 1; i <= n; i++) {
    const k = i / n,
      jx = i === n ? 0 : (rnd(seed + i) - 0.5) * 26;
    c.lineTo(x0 + (x1 - x0) * k + jx, y0 + (y1 - y0) * k);
  }
  c.stroke();
}
function camel(c, x, y, s, t) {
  c.fillStyle = "#4a3420";
  const b = Math.sin(t * 6) * 1.2;
  c.beginPath();
  c.ellipse(x, y - 16 * s + b, 13 * s, 6 * s, 0, 0, 7);
  c.fill();
  c.beginPath();
  c.ellipse(x - 2 * s, y - 22 * s + b, 5 * s, 5 * s, 0, 0, 7);
  c.fill();
  c.fillRect(x + 10 * s, y - 30 * s + b, 3 * s, 14 * s);
  c.beginPath();
  c.ellipse(x + 14 * s, y - 31 * s + b, 5 * s, 3 * s, 0, 0, 7);
  c.fill();
  for (let k = 0; k < 4; k++) {
    const ph = Math.sin(t * 6 + k * 1.6) * 3 * s;
    c.fillRect(x - 9 * s + k * 6 * s + ph * 0.3, y - 12 * s + b, 2 * s, 12 * s - b);
  }
}
function sheep(c, x, y, s, t, i) {
  const b = Math.abs(Math.sin(t * 2 + i)) * 1.5;
  c.fillStyle = "#e8e2d4";
  c.beginPath();
  c.ellipse(x, y - 6 * s - b, 7 * s, 4.5 * s, 0, 0, 7);
  c.fill();
  c.fillStyle = "#262b44";
  c.beginPath();
  c.ellipse(x + 7 * s, y - 7 * s - b, 2.6 * s, 2.2 * s, 0, 0, 7);
  c.fill();
  c.fillRect(x - 4 * s, y - 3 * s - b, 1.5 * s, 3 * s + b);
  c.fillRect(x + 3 * s, y - 3 * s - b, 1.5 * s, 3 * s + b);
}
function angel(c, x, y, s, t) {
  c.globalAlpha = 0.9;
  c.fillStyle = "#fee761";
  c.beginPath();
  c.arc(x, y, 6 * s, 0, 7);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = "#f1e9d8";
  c.beginPath();
  c.moveTo(x - 3 * s, y + 2 * s);
  c.lineTo(x + 3 * s, y + 2 * s);
  c.lineTo(x + 4 * s, y + 10 * s);
  c.lineTo(x - 4 * s, y + 10 * s);
  c.fill();
  const f = Math.sin(t * 9) * 3 * s;
  c.beginPath();
  c.moveTo(x - 2 * s, y + 3 * s);
  c.lineTo(x - 10 * s, y - 2 * s + f);
  c.lineTo(x - 4 * s, y + 7 * s);
  c.fill();
  c.beginPath();
  c.moveTo(x + 2 * s, y + 3 * s);
  c.lineTo(x + 10 * s, y - 2 * s + f);
  c.lineTo(x + 4 * s, y + 7 * s);
  c.fill();
  c.fillStyle = "#e4a672";
  c.beginPath();
  c.arc(x, y, 2 * s, 0, 7);
  c.fill();
}
function flame(c, x, y, s, t) {
  for (let i = 0; i < 3; i++) {
    const h = (14 - i * 4) * s * (1 + 0.25 * Math.sin(t * 14 + i * 2));
    c.fillStyle = ["#be4a2f", "#f77622", "#fee761"][i];
    c.beginPath();
    c.moveTo(x - (6 - i * 1.8) * s, y);
    c.quadraticCurveTo(x - (4 - i) * s, y - h * 0.6, x + Math.sin(t * 9 + i) * 2 * s, y - h);
    c.quadraticCurveTo(x + (4 - i) * s, y - h * 0.6, x + (6 - i * 1.8) * s, y);
    c.fill();
  }
}
function smoke(c, x, y, t, n, spread, col, speed = 14) {
  for (let i = 0; i < n; i++) {
    const k = ((t * speed) / 60 + rnd(i)) % 1;
    c.globalAlpha = 0.45 * (1 - k);
    c.fillStyle = col;
    c.beginPath();
    c.arc(x + Math.sin(t + i) * spread * k + (rnd(i + 9) - 0.5) * 8, y - k * 70, 4 + k * 14, 0, 7);
    c.fill();
  }
  c.globalAlpha = 1;
}
function sceneFX(c, W, H, scene, t, boss) {
  const gy = H * 0.8;
  switch (scene) {
    case "garden": {
      c.strokeStyle = "#9fd8ff";
      c.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const k = (t * 0.25 + i / 6) % 1;
        c.globalAlpha = 0.7 * (1 - Math.abs(k - 0.5) * 2);
        c.beginPath();
        c.moveTo(W * (0.46 + k * 0.1), H - k * (H - gy) - 2);
        c.lineTo(W * (0.46 + k * 0.1) + 5, H - k * (H - gy) - 2);
        c.stroke();
      }
      c.globalAlpha = 1;
      for (let i = 0; i < 14; i++) {
        const x = W * rnd(i) + Math.sin(t * 0.7 + i) * 18,
          y = gy - 20 - rnd(i + 3) * 70 + Math.cos(t * 0.9 + i * 2) * 10;
        c.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + i * 1.7));
        c.fillStyle = "#fee761";
        c.fillRect(x, y, 2, 2);
      }
      c.globalAlpha = 1;
      const sx = W * 0.36,
        sy = gy - 34;
      c.strokeStyle = "#63c74d";
      c.lineWidth = 3;
      c.beginPath();
      for (let k = 0; k <= 10; k++) {
        const xx = sx - 14 + k * 3,
          yy = sy + Math.sin(t * 3 + k * 0.8) * 3 + k * 1.2;
        k ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.stroke();
      c.fillStyle = "#e43b44";
      c.fillRect(sx + 16, sy + 12 + Math.sin(t * 3 + 8) * 3, 2, 1);
      break;
    }
    case "mountain": {
      const cyc = t % 14;
      if (cyc < 10) {
        c.strokeStyle = "rgba(159,216,255,.45)";
        c.lineWidth = 1;
        for (let i = 0; i < 50; i++) {
          const x = ((rnd(i) * W * 1.2 + t * 90) % (W * 1.2)) - W * 0.1,
            y = (rnd(i + 50) * H + t * 360) % H;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x - 4, y + 10);
          c.stroke();
        }
        const f = (t * 0.5) % 1;
        if (f < 0.05) {
          c.fillStyle = "rgba(255,255,255,.35)";
          c.fillRect(0, 0, W, H);
          bolt(c, W * 0.3, 0, W * 0.38, gy - 40, Math.floor(t), "#ffffff", 2);
        }
      } else {
        const a = Math.min(1, (cyc - 10) / 1.5) * Math.min(1, (14 - cyc) / 1);
        ["#e43b44", "#f77622", "#fee761", "#63c74d", "#0099db", "#68386c"].forEach((col, i) => {
          c.globalAlpha = 0.35 * a;
          c.strokeStyle = col;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(W * 0.62, gy + 10, W * 0.42 - i * 3, Math.PI, 2 * Math.PI);
          c.stroke();
        });
        c.globalAlpha = 1;
      }
      c.fillStyle = "#733e39";
      c.fillRect(W * 0.6, gy - H * 0.62 + 4, 26, 4);
      break;
    }
    case "tower": {
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.6 + rnd(i)) % 1;
        c.fillStyle = "#b86f50";
        c.fillRect(W * (0.45 + rnd(i + 4) * 0.2), gy - 90 + k * 90, 5, 3);
      }
      [
        [0.42, gy - 26],
        [0.68, gy - 26],
        [0.55, gy - 84],
      ].forEach(([x, y], i) => {
        c.fillStyle = "#3e2731";
        c.fillRect(W * x - 1, y, 2, 8);
        flame(c, W * x, y, 0.45, t + i);
      });
      break;
    }
    case "ziggurat": {
      [
        [0.6 - 0.15 + 0.02, gy - 16],
        [0.6 + 0.15 - 0.02, gy - 16],
        [0.6, gy - 48],
      ].forEach(([x, y], i) => flame(c, W * x, y, 0.5, t + i * 1.3));
      smoke(c, W * 0.6, gy - 52, t, 7, 12, "#8b9bb4");
      for (let i = 0; i < 3; i++) {
        const x = W * 0.12 + i * W * 0.08;
        c.fillStyle = "#262b44";
        c.fillRect(x, gy - 26, 4, 10);
        c.beginPath();
        c.arc(x + 2, gy - 28, 2.5, 0, 7);
        c.fill();
      }
      break;
    }
    case "well": {
      const cx = ((t * 18) % (W + 80)) - 40;
      camel(c, cx, gy + 4, 0.9, t);
      for (let i = 0; i < 4; i++) {
        c.globalAlpha = Math.max(0, Math.sin(t * 4 + i * 1.5));
        c.fillStyle = "#ffffff";
        c.fillRect(W * 0.45 + 6 + i * 6, gy - 14, 2, 1);
      }
      c.globalAlpha = 1;
      c.strokeStyle = "#5a6988";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(W * 0.45 - 2, gy - 14);
      c.lineTo(W * 0.45 - 2, gy - 32);
      c.lineTo(W * 0.45 + 36, gy - 32);
      c.lineTo(W * 0.45 + 36, gy - 14);
      c.stroke();
      c.beginPath();
      c.moveTo(W * 0.45 + 17, gy - 32);
      c.lineTo(W * 0.45 + 17, gy - 22 + Math.sin(t * 2) * 3);
      c.stroke();
      break;
    }
    case "hills": {
      c.strokeStyle = "#3e8948";
      c.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        const x = (i * W) / 40 + rnd(i) * 6,
          y = gy + 4 + rnd(i + 7) * 12,
          b = Math.sin(t * 2.2 + x * 0.03) * 4;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + b, y - 7);
        c.stroke();
      }
      [
        [0.12, 0],
        [0.24, 1],
        [0.8, 2],
        [0.88, 3],
      ].forEach(([p, i]) => sheep(c, W * p + Math.sin(t * 0.3 + i) * 12, gy + 6, 0.9, t, i));
      break;
    }
    case "pillar": {
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.12 + i / 3) % 1,
          up = i % 2 === 0,
          kk = up ? k : 1 - k;
        const x = W * 0.5 + W * 0.12 * kk,
          y = gy - 40 - kk * (gy - 40);
        c.globalAlpha = Math.min(1, Math.min(kk, 1 - kk) * 6);
        angel(c, x, y, 0.8, t + i);
        c.globalAlpha = 1;
      }
      c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 2);
      c.fillStyle = "#fee761";
      c.beginPath();
      c.moveTo(W * 0.56, 0);
      c.lineTo(W * 0.44, gy - 40);
      c.lineTo(W * 0.6, gy - 40);
      c.lineTo(W * 0.68, 0);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = "#3a4466";
      c.fillRect(W * 0.5 - 18, gy - 6, 14, 6);
      break;
    }
    case "tents": {
      const fx = W * 0.45,
        fy = gy + 2;
      c.fillStyle = "#3e2731";
      c.fillRect(fx - 9, fy - 2, 18, 3);
      flame(c, fx, fy - 2, 0.9, t);
      smoke(c, fx, fy - 18, t, 6, 10, "#5a6988", 10);
      c.globalAlpha = 0.18 + 0.06 * Math.sin(t * 12);
      c.fillStyle = "#f77622";
      c.beginPath();
      c.arc(fx, fy - 8, 40, 0, 7);
      c.fill();
      c.globalAlpha = 1;
      for (let i = 0; i < 8; i++) {
        const k = (t * 0.8 + rnd(i)) % 1;
        c.globalAlpha = 1 - k;
        c.fillStyle = "#feae34";
        c.fillRect(fx + (rnd(i + 3) - 0.5) * 14 + Math.sin(t * 3 + i) * 4, fy - 14 - k * 50, 1.5, 1.5);
      }
      c.globalAlpha = 1;
      break;
    }
    case "pyramids": {
      c.strokeStyle = "#4f8fc0";
      c.lineWidth = 2;
      c.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const y = gy + 12 + Math.sin(x * 0.05 + t * 2) * 1.5;
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      for (let i = 0; i < 70; i++) {
        const x = ((rnd(i) * W * 1.3 + t * (120 + rnd(i + 3) * 80)) % (W * 1.3)) - W * 0.15,
          y = gy - 80 + rnd(i + 70) * 110 + Math.sin(t * 3 + i) * 4;
        c.globalAlpha = 0.35;
        c.fillStyle = "#e4a672";
        c.fillRect(x, y, 3, 1);
      }
      c.globalAlpha = 1;
      break;
    }
    case "spring": {
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.4 + i / 3) % 1;
        c.globalAlpha = 0.6 * (1 - k);
        c.strokeStyle = "#9fd8ff";
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(W * 0.5, gy + 4, W * 0.14 * k, 8 * k, 0, 0, 7);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.fillStyle = "#733e39";
      c.save();
      c.translate(W * 0.5, gy + 2);
      c.rotate(0.2 + Math.sin(t) * 0.05);
      c.fillRect(-16, -2, 32, 4);
      c.restore();
      for (let i = 0; i < 4; i++) {
        const x = ((t * 30 + (i * W) / 4) % (W + 40)) - 20,
          y = H * 0.25 + Math.sin(t + i) * 12 + i * 8,
          f = Math.sin(t * 8 + i) * 3;
        c.strokeStyle = "#181425";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x - 5, y - f);
        c.lineTo(x, y);
        c.lineTo(x + 5, y - f);
        c.stroke();
      }
      break;
    }
    case "sinai": {
      smoke(c, W * 0.55, gy - H * 0.62, t, 12, 30, "#3a4466", 9);
      const f = (t * 0.35) % 1;
      if (f < 0.06) {
        c.fillStyle = "rgba(255,240,200,.3)";
        c.fillRect(0, 0, W, H);
        bolt(c, W * 0.45, 0, W * 0.55, gy - H * 0.6, Math.floor(t * 0.35), "#fee761", 2.5);
        bolt(c, W * 0.7, 0, W * 0.6, gy - H * 0.55, Math.floor(t * 0.35) + 7, "#ffffff", 1.5);
      }
      flame(c, W * 0.55, gy - H * 0.62, 1.1, t);
      flame(c, W * 0.5, gy - H * 0.58, 0.6, t + 1);
      flame(c, W * 0.6, gy - H * 0.58, 0.6, t + 2);
      break;
    }
    case "dungeon": {
      const dg = c.createLinearGradient(0, 0, 0, gy);
      dg.addColorStop(0, "#0b0612");
      dg.addColorStop(1, "#262b44");
      c.fillStyle = dg;
      c.fillRect(0, 0, W, gy + 2);
      c.fillStyle = "#181425";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(W, 0);
      c.lineTo(W, H);
      c.lineTo(W * 0.93, H);
      c.lineTo(W * 0.9, H * 0.35);
      c.quadraticCurveTo(W * 0.5, -H * 0.12, W * 0.1, H * 0.35);
      c.lineTo(W * 0.07, H);
      c.lineTo(0, H);
      c.fill();
      c.fillStyle = "#262b44";
      for (let i = 0; i < 16; i++) {
        const x = W * (0.05 + i * 0.06),
          h = 10 + rnd(i) * 26;
        c.beginPath();
        c.moveTo(x - 6, 0);
        c.lineTo(x, h);
        c.lineTo(x + 6, 0);
        c.fill();
      }
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.7 + rnd(i + 20)) % 1,
          x = W * (0.12 + rnd(i + 30) * 0.76);
        c.fillStyle = "#9fd8ff";
        c.globalAlpha = 1 - k;
        c.fillRect(x, 20 + rnd(i) * 20 + k * (H * 0.7), 1.5, 3);
      }
      c.globalAlpha = 1;
      [
        [0.1, H * 0.45],
        [0.9, H * 0.45],
      ].forEach(([x, y], i) => {
        c.fillStyle = "#3e2731";
        c.fillRect(W * x - 2, y, 4, 10);
        flame(c, W * x, y, 0.55, t + i);
        c.globalAlpha = 0.15;
        c.fillStyle = "#f77622";
        c.beginPath();
        c.arc(W * x, y, 34, 0, 7);
        c.fill();
        c.globalAlpha = 1;
      });
      c.strokeStyle = "#3a4466";
      c.lineWidth = 2;
      [0.3, 0.7].forEach((p) => {
        c.beginPath();
        for (let k = 0; k < 8; k++) {
          const y = k * 6;
          c.moveTo(W * p + Math.sin(t + k * 0.5) * 1, y);
          c.lineTo(W * p + Math.sin(t + k * 0.5 + 0.5) * 1, y + 4);
        }
        c.stroke();
      });
      break;
    }
  }
  if (boss) {
    for (let i = 0; i < 24; i++) {
      const k = (t * 0.15 + rnd(i)) % 1;
      c.globalAlpha = 0.6 * (1 - k);
      c.fillStyle = "#3a1f2a";
      c.fillRect(rnd(i + 5) * W + Math.sin(t + i) * 20, k * H, 3, 3);
    }
    c.globalAlpha = 1;
  }
}


function drawGiant(c, x, gy, s, t, flash, kind, breath) {
  const P_ = {
    golias: { skin: "#c28569", tun: "#a22633", arm: "#d77643", hair: "#3e2731" },
    nefilim: { skin: "#5a6988", tun: "#3e2731", arm: null, hair: "#181425" },
    ninrode: { skin: "#c28569", tun: "#733e39", arm: null, hair: "#3e2731" },
    abimeleque: { skin: "#c28569", tun: "#68386c", arm: null, hair: "#3e2731" },
  }[kind];
  const F = (col) => (flash ? "#fff" : col),
    bob = Math.sin(t * 1.4) * 2,
    lean = breath ? 0.12 : 0;
  c.save();
  c.translate(x, gy);
  c.fillStyle = "rgba(0,0,0,.4)";
  c.beginPath();
  c.ellipse(0, 0, s * 0.75, s * 0.13, 0, 0, 7);
  c.fill();
  c.translate(0, bob);
  c.rotate(-lean);
  c.fillStyle = F(P_.skin);
  c.fillRect(-s * 0.3, -s * 1.05, s * 0.2, s * 1.05);
  c.fillRect(s * 0.1, -s * 1.05, s * 0.2, s * 1.05);
  if (P_.arm) {
    c.fillStyle = F(P_.arm);
    c.fillRect(-s * 0.32, -s * 0.6, s * 0.24, s * 0.5);
    c.fillRect(s * 0.08, -s * 0.6, s * 0.24, s * 0.5);
  }
  c.fillStyle = F(P_.tun);
  c.beginPath();
  c.moveTo(-s * 0.45, -s * 0.9);
  c.lineTo(s * 0.45, -s * 0.9);
  c.lineTo(s * 0.38, -s * 1.25);
  c.lineTo(-s * 0.38, -s * 1.25);
  c.fill();
  const tor = c.createLinearGradient(0, -s * 2, 0, -s * 1.1);
  tor.addColorStop(0, F(P_.arm ? "#feae34" : shade(P_.skin, 0.15)));
  tor.addColorStop(1, F(P_.arm || P_.skin));
  c.fillStyle = tor;
  c.beginPath();
  c.moveTo(-s * 0.4, -s * 1.2);
  c.lineTo(s * 0.4, -s * 1.2);
  c.lineTo(s * 0.55, -s * 1.95);
  c.lineTo(-s * 0.55, -s * 1.95);
  c.fill();
  if (kind === "golias") {
    c.fillStyle = "#b86f50";
    for (let r = 0; r < 6; r++)
      for (let k = 0; k < 6; k++) {
        c.beginPath();
        c.arc(-s * 0.42 + k * s * 0.16 + (r % 2) * s * 0.08, -s * 1.88 + r * s * 0.12, s * 0.06, 0, Math.PI);
        c.fill();
      }
  }
  if (kind === "ninrode") {
    c.fillStyle = F("#b86f50");
    c.beginPath();
    c.moveTo(-s * 0.55, -s * 1.95);
    c.lineTo(s * 0.2, -s * 1.95);
    c.lineTo(-s * 0.1, -s * 1.25);
    c.lineTo(-s * 0.6, -s * 1.35);
    c.fill();
  }
  if (kind === "abimeleque") {
    c.fillStyle = F("#68386c");
    c.beginPath();
    c.moveTo(s * 0.5, -s * 1.95);
    c.quadraticCurveTo(s * 0.9, -s * 1.2, s * 0.75 + Math.sin(t * 2) * s * 0.05, -s * 0.25);
    c.lineTo(s * 0.35, -s * 0.9);
    c.fill();
  }
  c.fillStyle = F(P_.skin);
  c.beginPath();
  c.moveTo(-s * 0.55, -s * 1.9);
  c.lineTo(-s * 0.75, -s * 1.25);
  c.lineTo(-s * 0.6, -s * 1.2);
  c.lineTo(-s * 0.45, -s * 1.7);
  c.fill();
  c.beginPath();
  c.moveTo(s * 0.55, -s * 1.9);
  c.lineTo(s * 0.72, -s * 1.3);
  c.lineTo(s * 0.57, -s * 1.25);
  c.lineTo(s * 0.45, -s * 1.7);
  c.fill();
  c.beginPath();
  c.arc(0, -s * 2.15, s * 0.25, 0, 7);
  c.fill();
  c.fillStyle = F(P_.hair);
  c.beginPath();
  c.moveTo(-s * 0.2, -s * 2.08);
  c.lineTo(s * 0.2, -s * 2.08);
  c.lineTo(s * 0.05, -s * 1.82);
  c.lineTo(-s * 0.05, -s * 1.82);
  c.fill();
  if (kind === "nefilim") {
    c.beginPath();
    c.arc(0, -s * 2.22, s * 0.27, Math.PI, 0);
    c.fill();
    c.fillRect(-s * 0.27, -s * 2.22, s * 0.1, s * 0.4);
    c.fillRect(s * 0.17, -s * 2.22, s * 0.1, s * 0.4);
    glowEye(c, -s * 0.1, -s * 2.16, s * 0.035, "#ff4a1a");
    glowEye(c, s * 0.1, -s * 2.16, s * 0.035, "#ff4a1a");
  } else {
    c.fillStyle = "#181425";
    c.fillRect(-s * 0.12, -s * 2.18, s * 0.06, s * 0.05);
    c.fillRect(s * 0.06, -s * 2.18, s * 0.06, s * 0.05);
  }
  if (kind === "golias") {
    c.fillStyle = F("#d77643");
    c.beginPath();
    c.arc(0, -s * 2.22, s * 0.29, Math.PI, 0);
    c.fill();
    c.fillRect(-s * 0.3, -s * 2.24, s * 0.6, s * 0.06);
    c.fillRect(-s * 0.03, -s * 2.24, s * 0.06, s * 0.2);
    c.fillStyle = "#a22633";
    c.fillRect(-s * 0.04, -s * 2.62, s * 0.08, s * 0.12);
  }
  if (kind === "ninrode") {
    c.fillStyle = "#feae34";
    c.fillRect(-s * 0.26, -s * 2.3, s * 0.52, s * 0.05);
  }
  if (kind === "abimeleque") {
    c.fillStyle = "#feae34";
    c.beginPath();
    c.moveTo(-s * 0.24, -s * 2.3);
    for (let k = 0; k < 5; k++) {
      c.lineTo(-s * 0.24 + k * s * 0.12, -s * 2.48);
      c.lineTo(-s * 0.18 + k * s * 0.12, -s * 2.32);
    }
    c.lineTo(s * 0.24, -s * 2.3);
    c.fill();
  }
  const sw = Math.sin(t * 1.2) * 0.05;
  if (kind === "golias") {
    c.save();
    c.translate(-s * 0.68, -s * 1.25);
    c.rotate(-0.15 - sw - (breath ? 0.6 : 0));
    c.strokeStyle = "#733e39";
    c.lineWidth = s * 0.09;
    c.beginPath();
    c.moveTo(0, s * 1.1);
    c.lineTo(0, -s * 1.6);
    c.stroke();
    c.fillStyle = "#c0cbdc";
    c.beginPath();
    c.moveTo(0, -s * 1.95);
    c.lineTo(-s * 0.08, -s * 1.6);
    c.lineTo(s * 0.08, -s * 1.6);
    c.fill();
    c.restore();
    c.strokeStyle = "#d77643";
    c.lineWidth = s * 0.06;
    c.beginPath();
    c.moveTo(s * 0.2, -s * 1.3);
    c.lineTo(s * 0.55, -s * 2.4);
    c.stroke();
  } else if (kind === "nefilim") {
    c.save();
    c.translate(-s * 0.68, -s * 1.25);
    c.rotate(-0.5 - sw - (breath ? 0.7 : 0));
    c.fillStyle = F("#3e2731");
    c.beginPath();
    c.moveTo(-s * 0.05, s * 0.1);
    c.lineTo(s * 0.05, s * 0.1);
    c.lineTo(s * 0.15, -s * 0.9);
    c.lineTo(-s * 0.15, -s * 0.9);
    c.fill();
    c.restore();
  } else if (kind === "ninrode") {
    c.strokeStyle = "#b86f50";
    c.lineWidth = s * 0.07;
    c.beginPath();
    c.arc(-s * 0.8, -s * 1.4, s * 0.6, -1.2, 1.2, false);
    c.stroke();
    c.strokeStyle = "#ead4aa";
    c.lineWidth = s * 0.02;
    c.beginPath();
    c.moveTo(-s * 0.8 + Math.cos(-1.2) * s * 0.6, -s * 1.4 + Math.sin(-1.2) * s * 0.6);
    c.lineTo(-s * 0.8 + (breath ? -s * 0.2 : 0), -s * 1.4);
    c.lineTo(-s * 0.8 + Math.cos(1.2) * s * 0.6, -s * 1.4 + Math.sin(1.2) * s * 0.6);
    c.stroke();
  } else {
    c.save();
    c.translate(-s * 0.66, -s * 1.25);
    c.rotate(-0.6 - sw - (breath ? 0.8 : 0));
    c.fillStyle = "#c0cbdc";
    c.fillRect(-s * 0.04, -s * 1.1, s * 0.08, s * 1.0);
    c.fillStyle = "#feae34";
    c.fillRect(-s * 0.14, -s * 0.12, s * 0.28, s * 0.06);
    c.restore();
  }
  c.restore();
}
function drawSerpent(c, x, gy, s, t, flash, { col = "#3e8948", belly = "#feae34", sea = false, breath = false } = {}) {
  const F = (v) => (flash ? "#fff" : v);
  c.save();
  c.translate(x, gy);
  if (sea) {
    c.fillStyle = "#124e89";
    c.fillRect(-s * 2, -s * 0.28, s * 4, s * 0.4);
    c.fillStyle = "#0099db";
    for (let i = 0; i < 14; i++) {
      const xx = -s * 1.9 + i * s * 0.3;
      c.beginPath();
      c.arc(xx, -s * 0.28 + Math.sin(t * 3 + i) * s * 0.03, s * 0.12, Math.PI, 0);
      c.fill();
    }
  } else {
    c.fillStyle = "rgba(0,0,0,.4)";
    c.beginPath();
    c.ellipse(0, 0, s * 0.9, s * 0.15, 0, 0, 7);
    c.fill();
  }
  c.lineCap = "round";
  const W_ = sea ? s * 0.32 : s * 0.24;
  if (sea) {
    [
      [s * 1.25, s * 0.42],
      [s * 0.6, s * 0.5],
    ].forEach(([cx, r], i) => {
      c.strokeStyle = F(col);
      c.lineWidth = W_;
      c.beginPath();
      c.arc(cx, -s * 0.2, r, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      c.fillStyle = F(shade(col, -0.3));
      for (let k = 0; k < 4; k++) {
        const a = Math.PI * 1.2 + k * 0.18;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r, -s * 0.2 + Math.sin(a) * r - W_ * 0.4);
        c.lineTo(cx + Math.cos(a + 0.08) * r, -s * 0.2 + Math.sin(a + 0.08) * r - W_ * 1.1);
        c.lineTo(cx + Math.cos(a + 0.16) * r, -s * 0.2 + Math.sin(a + 0.16) * r - W_ * 0.4);
        c.fill();
      }
    });
  } else {
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = F(i % 2 ? shade(col, -0.2) : col);
      c.lineWidth = W_;
      c.beginPath();
      c.ellipse(s * 0.15, -s * 0.12 - i * s * 0.14, s * (0.7 - i * 0.15), s * 0.1, 0, 0, 7);
      c.stroke();
    }
  }
  const sway = Math.sin(t * 1.8) * s * 0.12,
    hx = -s * 0.55 + sway + (breath ? -s * 0.3 : 0),
    hy = sea ? -s * 2.05 : -s * 1.55;
  c.strokeStyle = F(col);
  c.lineWidth = W_;
  c.beginPath();
  c.moveTo(sea ? s * 0.05 : s * 0.1, sea ? -s * 0.25 : -s * 0.4);
  c.bezierCurveTo(s * 0.4, hy * 0.45, -s * 0.5, hy * 0.75, hx + s * 0.15, hy);
  c.stroke();
  c.strokeStyle = F(belly);
  c.lineWidth = W_ * 0.3;
  c.beginPath();
  c.moveTo(sea ? -s * 0.05 : 0, sea ? -s * 0.25 : -s * 0.4);
  c.bezierCurveTo(s * 0.25, hy * 0.45, -s * 0.62, hy * 0.75, hx + s * 0.05, hy + W_ * 0.2);
  c.stroke();
  if (sea) {
    c.fillStyle = F(shade(col, -0.3));
    for (let k = 1; k < 6; k++) {
      const u = k / 6,
        bx = (1 - u) ** 3 * s * 0.05 + 3 * (1 - u) ** 2 * u * s * 0.4 + 3 * (1 - u) * u * u * (-s * 0.5) + u ** 3 * (hx + s * 0.15),
        by = (1 - u) ** 3 * (-s * 0.25) + 3 * (1 - u) ** 2 * u * hy * 0.45 + 3 * (1 - u) * u * u * hy * 0.75 + u ** 3 * hy;
      c.beginPath();
      c.moveTo(bx + W_ * 0.3, by);
      c.lineTo(bx + W_ * 0.9, by - W_ * 0.4);
      c.lineTo(bx + W_ * 0.3, by - W_ * 0.5);
      c.fill();
    }
  }
  c.save();
  c.translate(hx, hy);
  const open = breath ? 0.5 : 0.15 + Math.sin(t * 2) * 0.08,
    L = sea ? s * 0.75 : s * 0.5;
  c.fillStyle = F(shade(col, 0.1));
  c.beginPath();
  c.moveTo(s * 0.15, -L * 0.25);
  c.lineTo(-L, -L * 0.12);
  c.lineTo(-L * 0.9, L * 0.02);
  c.lineTo(s * 0.15, L * 0.12);
  c.fill();
  c.save();
  c.rotate(-open * 0.3);
  c.fillStyle = F(col);
  c.beginPath();
  c.moveTo(s * 0.1, L * 0.05);
  c.lineTo(-L * 0.85, L * 0.12 + open * L * 0.6);
  c.lineTo(s * 0.1, L * 0.3);
  c.fill();
  c.restore();
  c.fillStyle = "#f1e9d8";
  for (let k = 0; k < (sea ? 5 : 2); k++) {
    c.beginPath();
    c.moveTo(-L * 0.8 + k * L * 0.15, L * 0.0);
    c.lineTo(-L * 0.75 + k * L * 0.15, L * 0.12);
    c.lineTo(-L * 0.7 + k * L * 0.15, L * 0.0);
    c.fill();
  }
  glowEye(c, -L * 0.35, -L * 0.14, s * 0.05, sea ? "#2ce8f5" : "#fee761");
  if (!sea && Math.sin(t * 5) > 0.3) {
    c.strokeStyle = "#e43b44";
    c.lineWidth = s * 0.03;
    c.beginPath();
    c.moveTo(-L * 0.9, L * 0.05);
    c.lineTo(-L * 1.2, L * 0.05);
    c.lineTo(-L * 1.3, -L * 0.03);
    c.moveTo(-L * 1.2, L * 0.05);
    c.lineTo(-L * 1.3, L * 0.12);
    c.stroke();
  }
  if (sea) {
    c.fillStyle = F(shade(col, -0.3));
    c.beginPath();
    c.moveTo(s * 0.05, -L * 0.2);
    c.lineTo(s * 0.3, -L * 0.55);
    c.lineTo(s * 0.12, -L * 0.05);
    c.fill();
  }
  if (breath && sea) {
    for (let k = 0; k < 14; k++) {
      const d = Math.random();
      c.globalAlpha = 0.8 * (1 - d);
      c.fillStyle = d < 0.5 ? "#9fd8ff" : "#0099db";
      c.beginPath();
      c.arc(-L - d * s * 1.6, (Math.random() - 0.5) * d * s * 0.5, s * (0.05 + d * 0.1), 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  c.restore();
  c.restore();
}
function drawBeast(c, x, gy, s, t, flash, { gold = false, breath = false } = {}) {
  const F = (v) => (flash ? "#fff" : v),
    col = gold ? "#feae34" : "#5a6988",
    dk = gold ? "#d77643" : "#3a4466",
    lt = gold ? "#fee761" : "#8b9bb4";
  c.save();
  c.translate(x, gy);
  if (gold) {
    c.fillStyle = "#5a6988";
    c.fillRect(-s * 1.3, -s * 0.3, s * 2.6, s * 0.3);
    c.fillStyle = "#8b9bb4";
    c.fillRect(-s * 1.3, -s * 0.3, s * 2.6, s * 0.05);
    c.translate(0, -s * 0.3);
    c.scale(0.8, 0.8);
  } else {
    c.fillStyle = "rgba(0,0,0,.4)";
    c.beginPath();
    c.ellipse(0, 0, s * 1.4, s * 0.16, 0, 0, 7);
    c.fill();
  }
  const st = gold ? 0 : t;
  c.strokeStyle = F(dk);
  c.lineWidth = s * 0.22;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(s * 1.2, -s * 1.0);
  c.quadraticCurveTo(s * 1.9, -s * 1.1 + Math.sin(st * 1.5) * s * 0.1, s * 1.75, -s * 1.95 + Math.sin(st * 1.5) * s * 0.15);
  c.stroke();
  [
    [-s * 0.85, 0],
    [-s * 0.35, 1.6],
    [s * 0.5, 3.1],
    [s * 0.95, 4.6],
  ].forEach(([lx, ph]) => {
    const lift = gold ? 0 : Math.max(0, Math.sin(st * 2 + ph)) * s * 0.06;
    c.fillStyle = F(dk);
    c.fillRect(lx - s * 0.17, -s * 0.6 - lift, s * 0.34, s * 0.6);
    c.fillStyle = "#181425";
    c.fillRect(lx - s * 0.19, -s * 0.06 - lift, s * 0.38, s * 0.06);
  });
  const g = c.createLinearGradient(0, -s * 1.7, 0, -s * 0.4);
  g.addColorStop(0, F(lt));
  g.addColorStop(1, F(dk));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(s * 0.15, -s * 1.0, s * 1.25, s * 0.62, 0, 0, 7);
  c.fill();
  if (gold) {
    c.fillStyle = "#fee761";
    for (let i = 0; i < 5; i++) {
      c.globalAlpha = Math.max(0, Math.sin(t * 3 + i * 1.3));
      c.fillRect(-s * 0.6 + i * s * 0.35, -s * 1.4 + ((i * 37) % 5) * s * 0.08, s * 0.05, s * 0.05);
    }
    c.globalAlpha = 1;
  }
  const nod = gold ? 0 : Math.sin(t * 1.3) * s * 0.05 + (breath ? s * 0.1 : 0);
  c.save();
  c.translate(-s * 1.0, -s * 0.95 + nod);
  c.fillStyle = F(col);
  c.beginPath();
  c.moveTo(s * 0.3, -s * 0.35);
  c.lineTo(-s * 0.45, -s * 0.3);
  c.lineTo(-s * 0.62, s * 0.05);
  c.lineTo(-s * 0.45, s * 0.25);
  c.lineTo(s * 0.3, s * 0.25);
  c.fill();
  c.fillStyle = F(dk);
  c.beginPath();
  c.ellipse(-s * 0.5, s * 0.02, s * 0.14, s * 0.2, 0, 0, 7);
  c.fill();
  c.fillStyle = "#181425";
  c.fillRect(-s * 0.6, -s * 0.04, s * 0.05, s * 0.05);
  c.fillStyle = gold ? "#ead4aa" : "#e8dcc0";
  if (gold) {
    [
      [-s * 0.05, 1],
      [s * 0.12, -1],
    ].forEach(([hx, d]) => {
      c.beginPath();
      c.moveTo(hx, -s * 0.3);
      c.quadraticCurveTo(hx - s * 0.2 * d, -s * 0.65, hx + s * 0.08, -s * 0.75);
      c.lineTo(hx + s * 0.06, -s * 0.3);
      c.fill();
    });
  } else {
    c.beginPath();
    c.moveTo(-s * 0.45, s * 0.2);
    c.lineTo(-s * 0.4, s * 0.42);
    c.lineTo(-s * 0.32, s * 0.2);
    c.fill();
  }
  glowEye(c, -s * 0.15, -s * 0.12, s * 0.045, gold ? "#e43b44" : "#ff4a1a");
  if (breath && !gold) {
    for (let k = 0; k < 12; k++) {
      const d = Math.random();
      c.globalAlpha = 0.7 * (1 - d);
      c.fillStyle = d < 0.5 ? "#9fd8ff" : "#c0cbdc";
      c.beginPath();
      c.arc(-s * 0.7 - d * s * 1.4, (Math.random() - 0.5) * d * s * 0.4, s * (0.04 + d * 0.08), 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  c.restore();
  c.restore();
}
function drawBossKind(c, kind, mx, gy, sc, t, flash, breath, Wd) {
  switch (kind) {
    case "serpent":
      return drawSerpent(c, mx, gy, 46 * sc, t, flash, { breath });
    case "leviata":
      return drawSerpent(c, mx + Wd * 0.02, gy, 52 * sc, t, flash, { col: "#193c3e", belly: "#2ce8f5", sea: true, breath });
    case "beemote":
      return drawBeast(c, mx + Wd * 0.03, gy, 50 * sc, t, flash, { breath });
    case "calf":
      return drawBeast(c, mx + Wd * 0.03, gy, 44 * sc, t, flash, { gold: true });
    case "dragao":
      return drawDragon(c, mx + Wd * 0.04, gy, 50 * sc, t, flash, { heads: 7, big: true, col: "#a22633", belly: "#f77622", breath, crowns: true });
    case "demon":
      return drawArchDemon(c, mx, gy, 46 * sc, t, flash, breath);
    case "demon2":
      return drawArchDemon(c, mx, gy, 40 * sc, t, flash, breath);
    default:
      return drawGiant(c, mx, gy, (kind === "golias" ? 54 : 48) * sc, t, flash, kind, breath);
  }
}

/* ================= Modo Assimilação: palavras dentro da cena ================= */

const FL = (f, c) => (f ? "#ffffff" : c);
function sShadow(c, s, w = 0.8) {
  c.fillStyle = "rgba(0,0,0,.4)";
  c.beginPath();
  c.ellipse(0, 0, s * w, s * 0.12, 0, 0, 7);
  c.fill();
}
function drawRaven(c, x, gy, s, t, f) {
  const hov = Math.sin(t * 3) * s * 0.12,
    fl = Math.sin(t * 14);
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.5);
  c.translate(0, -s * 1.5 + hov);
  c.fillStyle = FL(f, "#3a4466");
  c.beginPath();
  c.ellipse(0, 0, s * 0.5, s * 0.3, -0.2, 0, 7);
  c.fill();
  c.fillStyle = FL(f, "#262b44");
  [-1, 1].forEach((d) => {
    c.beginPath();
    c.moveTo(s * 0.1, -s * 0.1);
    c.lineTo(s * 0.2 + d * s * 0.2, -s * 0.2 - fl * s * 0.6 * d * d);
    c.lineTo(s * 0.95, -s * 0.05 - fl * s * 0.75);
    c.lineTo(s * 0.3, s * 0.12);
    c.fill();
  });
  c.beginPath();
  c.moveTo(s * 0.4, s * 0.05);
  c.lineTo(s * 0.95, s * 0.25);
  c.lineTo(s * 0.45, s * 0.2);
  c.fill();
  c.beginPath();
  c.arc(-s * 0.42, -s * 0.14, s * 0.2, 0, 7);
  c.fill();
  c.fillStyle = FL(f, "#5a6988");
  c.beginPath();
  c.moveTo(-s * 0.58, -s * 0.16);
  c.lineTo(-s * 0.95, -s * 0.04);
  c.lineTo(-s * 0.56, -s * 0.02);
  c.fill();
  glowEye(c, -s * 0.46, -s * 0.18, s * 0.04, "#e43b44");
  c.restore();
}
function drawGolem(c, x, gy, s, t, f) {
  const b = Math.sin(t * 1.6) * s * 0.03;
  c.save();
  c.translate(x, gy);
  sShadow(c, s);
  c.translate(0, b);
  const br = (x0, y0, w, h) => {
    c.fillStyle = FL(f, "#b86f50");
    c.fillRect(x0, y0, w, h);
    c.fillStyle = "#733e39";
    for (let yy = y0 + s * 0.16; yy < y0 + h; yy += s * 0.16) c.fillRect(x0, yy, w, s * 0.025);
    for (let r = 0; r * s * 0.16 < h; r++)
      for (let xx = x0 + (r % 2 ? s * 0.1 : s * 0.22); xx < x0 + w; xx += s * 0.24) c.fillRect(xx, y0 + r * s * 0.16, s * 0.025, s * 0.16);
  };
  br(-s * 0.42, -s * 0.55, s * 0.3, s * 0.55);
  br(s * 0.12, -s * 0.55, s * 0.3, s * 0.55);
  br(-s * 0.55, -s * 1.5, s * 1.1, s * 0.98);
  br(-s * 0.9, -s * 1.45, s * 0.3, s * 0.85);
  br(s * 0.6, -s * 1.45, s * 0.3, s * 0.85);
  br(-s * 0.3, -s * 1.98, s * 0.6, s * 0.48);
  glowEye(c, -s * 0.12, -s * 1.75, s * 0.05, "#f77622");
  glowEye(c, s * 0.12, -s * 1.75, s * 0.05, "#f77622");
  c.fillStyle = "#181425";
  c.fillRect(-s * 0.14, -s * 1.62, s * 0.28, s * 0.04);
  c.restore();
}
function drawIdol(c, x, gy, s, t, f) {
  const hov = Math.sin(t * 2) * s * 0.08;
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.5);
  c.translate(0, -s * 0.3 + hov);
  c.fillStyle = FL(f, "#b86f50");
  c.beginPath();
  c.moveTo(-s * 0.32, 0);
  c.lineTo(s * 0.32, 0);
  c.lineTo(s * 0.22, -s * 1.0);
  c.lineTo(-s * 0.22, -s * 1.0);
  c.fill();
  c.fillStyle = FL(f, "#d77643");
  c.beginPath();
  c.arc(0, -s * 1.25, s * 0.36, 0, 7);
  c.fill();
  c.fillRect(-s * 0.5, -s * 0.9, s * 0.2, s * 0.5);
  c.fillRect(s * 0.3, -s * 0.9, s * 0.2, s * 0.5);
  c.fillStyle = "#181425";
  c.beginPath();
  c.arc(-s * 0.14, -s * 1.28, s * 0.1, 0, 7);
  c.arc(s * 0.14, -s * 1.28, s * 0.1, 0, 7);
  c.fill();
  c.fillRect(-s * 0.1, -s * 1.1, s * 0.2, s * 0.06);
  glowEye(c, -s * 0.14, -s * 1.28, s * 0.04, "#b55088");
  glowEye(c, s * 0.14, -s * 1.28, s * 0.04, "#b55088");
  c.strokeStyle = "#733e39";
  c.lineWidth = s * 0.03;
  c.beginPath();
  c.moveTo(s * 0.05, -s * 0.9);
  c.lineTo(-s * 0.08, -s * 0.6);
  c.lineTo(s * 0.06, -s * 0.35);
  c.stroke();
  c.restore();
}
function drawJackal(c, x, gy, s, t, f, br) {
  const run = Math.sin(t * 5),
    lean = br ? -s * 0.2 : 0;
  c.save();
  c.translate(x + lean, gy);
  sShadow(c, s, 0.9);
  c.fillStyle = FL(f, "#733e39");
  [
    [-0.5, 0],
    [-0.3, 1.5],
    [0.35, 3],
    [0.55, 4.5],
  ].forEach(([lx, ph]) => c.fillRect(s * lx, -s * 0.55, s * 0.11, s * 0.55 - Math.max(0, Math.sin(t * 5 + ph)) * s * 0.08));
  c.fillStyle = FL(f, "#b86f50");
  c.beginPath();
  c.ellipse(0, -s * 0.7, s * 0.7, s * 0.26, 0, 0, 7);
  c.fill();
  c.strokeStyle = FL(f, "#b86f50");
  c.lineWidth = s * 0.12;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(s * 0.62, -s * 0.75);
  c.quadraticCurveTo(s * 1.0, -s * 0.7 + run * s * 0.08, s * 1.05, -s * 0.4);
  c.stroke();
  c.beginPath();
  c.moveTo(-s * 0.5, -s * 0.9);
  c.lineTo(-s * 0.95, -s * 1.05);
  c.lineTo(-s * 1.25, -s * 0.8);
  c.lineTo(-s * 0.9, -s * 0.68);
  c.lineTo(-s * 0.55, -s * 0.6);
  c.fill();
  c.beginPath();
  c.moveTo(-s * 0.72, -s * 1.0);
  c.lineTo(-s * 0.7, -s * 1.38);
  c.lineTo(-s * 0.55, -s * 1.0);
  c.fill();
  c.beginPath();
  c.moveTo(-s * 0.9, -s * 1.02);
  c.lineTo(-s * 0.92, -s * 1.32);
  c.lineTo(-s * 0.76, -s * 1.02);
  c.fill();
  c.fillStyle = "#f1e9d8";
  if (br) {
    c.fillRect(-s * 1.2, -s * 0.76, s * 0.05, s * 0.1);
    c.fillRect(-s * 1.08, -s * 0.74, s * 0.05, s * 0.1);
  }
  glowEye(c, -s * 0.88, -s * 0.92, s * 0.04, "#fee761");
  c.restore();
}
function drawGoat(c, x, gy, s, t, f) {
  const b = Math.sin(t * 2) * s * 0.04;
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.6);
  c.translate(0, b);
  c.fillStyle = FL(f, "#3e2731");
  c.fillRect(-s * 0.28, -s * 0.6, s * 0.16, s * 0.6);
  c.fillRect(s * 0.12, -s * 0.6, s * 0.16, s * 0.6);
  c.fillStyle = "#181425";
  c.fillRect(-s * 0.3, -s * 0.08, s * 0.2, s * 0.08);
  c.fillRect(s * 0.1, -s * 0.08, s * 0.2, s * 0.08);
  c.fillStyle = FL(f, "#733e39");
  c.beginPath();
  c.moveTo(-s * 0.4, -s * 0.55);
  c.lineTo(s * 0.4, -s * 0.55);
  c.lineTo(s * 0.5, -s * 1.45);
  c.lineTo(-s * 0.5, -s * 1.45);
  c.fill();
  c.strokeStyle = "#3e2731";
  c.lineWidth = s * 0.03;
  for (let i = 0; i < 10; i++) {
    const px = (rnd(i) - 0.5) * s * 0.8,
      py = -s * 0.6 - rnd(i + 5) * s * 0.8;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px, py + s * 0.12);
    c.stroke();
  }
  c.fillStyle = FL(f, "#733e39");
  c.fillRect(-s * 0.72, -s * 1.4, s * 0.2, s * 0.7);
  c.fillRect(s * 0.52, -s * 1.4, s * 0.2, s * 0.7);
  c.beginPath();
  c.moveTo(-s * 0.26, -s * 1.4);
  c.lineTo(s * 0.26, -s * 1.4);
  c.lineTo(s * 0.2, -s * 1.85);
  c.lineTo(-s * 0.3, -s * 1.9);
  c.lineTo(-s * 0.45, -s * 1.6);
  c.fill();
  c.fillStyle = "#c0cbdc";
  c.beginPath();
  c.moveTo(-s * 0.4, -s * 1.6);
  c.lineTo(-s * 0.3, -s * 1.2);
  c.lineTo(-s * 0.2, -s * 1.55);
  c.fill();
  c.strokeStyle = FL(f, "#ead4aa");
  c.lineWidth = s * 0.09;
  [-1, 1].forEach((d) => {
    c.beginPath();
    c.moveTo(d * s * 0.14, -s * 1.85);
    c.quadraticCurveTo(d * s * 0.5, -s * 2.3, d * s * 0.62, -s * 1.85);
    c.stroke();
  });
  glowEye(c, -s * 0.2, -s * 1.7, s * 0.045, "#e43b44");
  glowEye(c, s * 0.05, -s * 1.7, s * 0.045, "#e43b44");
  c.restore();
}
function drawFrog(c, x, gy, s, t, f) {
  const hop = Math.max(0, Math.sin(t * 4)) * s * 0.35;
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.6);
  c.translate(0, -hop);
  c.fillStyle = FL(f, "#265c42");
  c.beginPath();
  c.ellipse(s * 0.35, -s * 0.18, s * 0.3, s * 0.14, -0.4, 0, 7);
  c.ellipse(-s * 0.3, -s * 0.14, s * 0.16, s * 0.1, 0.3, 0, 7);
  c.fill();
  c.fillStyle = FL(f, "#3e8948");
  c.beginPath();
  c.ellipse(0, -s * 0.42, s * 0.52, s * 0.36, 0, 0, 7);
  c.fill();
  c.fillStyle = FL(f, "#63c74d");
  c.beginPath();
  c.ellipse(-s * 0.05, -s * 0.3, s * 0.36, s * 0.18, 0, 0, 7);
  c.fill();
  c.fillStyle = FL(f, "#3e8948");
  c.beginPath();
  c.arc(-s * 0.34, -s * 0.74, s * 0.14, 0, 7);
  c.arc(-s * 0.02, -s * 0.78, s * 0.14, 0, 7);
  c.fill();
  glowEye(c, -s * 0.36, -s * 0.75, s * 0.05, "#fee761");
  glowEye(c, -s * 0.04, -s * 0.79, s * 0.05, "#fee761");
  c.fillStyle = "#181425";
  c.fillRect(-s * 0.5, -s * 0.48, s * 0.4, s * 0.03);
  c.restore();
}
function drawLocust(c, x, gy, s, t, f) {
  const hov = Math.sin(t * 5) * s * 0.1,
    buzz = Math.sin(t * 40);
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.5);
  c.translate(0, -s * 1.1 + hov);
  c.globalAlpha *= 0.5;
  c.fillStyle = "#c0cbdc";
  c.beginPath();
  c.ellipse(s * 0.25, -s * 0.25 - buzz * s * 0.08, s * 0.55, s * 0.14, -0.3, 0, 7);
  c.ellipse(s * 0.25, -s * 0.1 + buzz * s * 0.08, s * 0.5, s * 0.12, -0.15, 0, 7);
  c.fill();
  c.globalAlpha /= 0.5;
  c.fillStyle = FL(f, "#3e8948");
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(-s * 0.1 + i * s * 0.22, 0, s * 0.16, s * 0.15 - i * s * 0.02, 0, 0, 7);
    c.fill();
  }
  c.fillStyle = FL(f, "#63c74d");
  c.beginPath();
  c.arc(-s * 0.34, -s * 0.05, s * 0.19, 0, 7);
  c.fill();
  c.strokeStyle = FL(f, "#265c42");
  c.lineWidth = s * 0.07;
  c.beginPath();
  c.moveTo(s * 0.1, s * 0.05);
  c.lineTo(s * 0.4, -s * 0.4);
  c.lineTo(s * 0.62, s * 0.3);
  c.moveTo(-s * 0.1, s * 0.1);
  c.lineTo(-s * 0.2, s * 0.35);
  c.moveTo(-s * 0.4, -s * 0.2);
  c.lineTo(-s * 0.7, -s * 0.5);
  c.stroke();
  glowEye(c, -s * 0.42, -s * 0.1, s * 0.05, "#e43b44");
  c.restore();
}
function drawScorpion(c, x, gy, s, t, f, br) {
  const w = Math.sin(t * 3) * s * 0.05;
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.9);
  c.strokeStyle = FL(f, "#3e2731");
  c.lineWidth = s * 0.06;
  for (let i = 0; i < 4; i++) {
    const lx = -s * 0.25 + i * s * 0.2;
    c.beginPath();
    c.moveTo(lx, -s * 0.25);
    c.lineTo(lx + s * 0.08, -s * 0.02 + (i % 2 ? w : -w));
    c.stroke();
  }
  c.fillStyle = FL(f, "#733e39");
  c.beginPath();
  c.ellipse(0, -s * 0.3, s * 0.5, s * 0.2, 0, 0, 7);
  c.fill();
  c.strokeStyle = FL(f, "#733e39");
  c.lineWidth = s * 0.14;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(s * 0.45, -s * 0.35);
  c.quadraticCurveTo(s * 1.0, -s * 0.5, s * 0.85, -s * 1.05);
  c.quadraticCurveTo(s * 0.6, -s * 1.5 + w, br ? -s * 0.2 : s * 0.25, br ? -s * 0.9 : -s * 1.2);
  c.stroke();
  c.fillStyle = FL(f, "#e43b44");
  const tx = br ? -s * 0.2 : s * 0.25,
    ty = br ? -s * 0.9 : -s * 1.2;
  c.beginPath();
  c.moveTo(tx, ty - s * 0.08);
  c.lineTo(tx - s * 0.22, ty + s * 0.1);
  c.lineTo(tx + s * 0.04, ty + s * 0.1);
  c.fill();
  c.lineWidth = s * 0.09;
  [-0.05, 0.12].forEach((o, i) => {
    c.strokeStyle = FL(f, "#b86f50");
    c.beginPath();
    c.moveTo(-s * 0.4, -s * 0.3);
    c.lineTo(-s * 0.8, -s * 0.45 - o * s + w * (i ? 1 : -1));
    c.stroke();
    c.fillStyle = FL(f, "#b86f50");
    c.beginPath();
    c.arc(-s * 0.9, -s * 0.47 - o * s + w * (i ? 1 : -1), s * 0.13, 0.6, 5.6);
    c.lineTo(-s * 0.9, -s * 0.47 - o * s);
    c.fill();
  });
  glowEye(c, -s * 0.3, -s * 0.38, s * 0.035, "#fee761");
  c.restore();
}
function drawSkel(c, x, gy, s, t, f, br) {
  const b = Math.sin(t * 2.4) * s * 0.03,
    B_ = "#ead4aa";
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 0.5);
  c.translate(0, b);
  c.fillStyle = FL(f, B_);
  c.fillRect(-s * 0.2, -s * 0.7, s * 0.08, s * 0.7);
  c.fillRect(s * 0.1, -s * 0.7, s * 0.08, s * 0.7);
  c.fillRect(-s * 0.24, -s * 0.76, s * 0.46, s * 0.08);
  c.fillRect(-s * 0.03, -s * 1.4, s * 0.06, s * 0.66);
  for (let i = 0; i < 4; i++) c.fillRect(-s * 0.26 + i * s * 0.01, -s * 1.35 + i * s * 0.13, s * 0.52 - i * s * 0.02, s * 0.05);
  c.save();
  c.translate(-s * 0.3, -s * 1.35);
  c.rotate(0.5 + (br ? -1.3 : Math.sin(t * 2) * 0.1));
  c.fillRect(-s * 0.04, 0, s * 0.08, s * 0.5);
  c.fillStyle = FL(f, "#8b9bb4");
  c.fillRect(-s * 0.03, s * 0.45, s * 0.06, -s * 1.1 + s * 0.45 - s * 0.45);
  c.fillRect(-s * 0.03, -s * 0.6, s * 0.06, s * 0.7);
  c.fillStyle = "#733e39";
  c.fillRect(-s * 0.14, s * 0.08, s * 0.28, s * 0.06);
  c.restore();
  c.fillStyle = FL(f, B_);
  c.fillRect(s * 0.26, -s * 1.35, s * 0.07, s * 0.5);
  c.beginPath();
  c.arc(0, -s * 1.62, s * 0.24, 0, 7);
  c.fill();
  c.fillRect(-s * 0.14, -s * 1.46, s * 0.28, s * 0.12);
  c.fillStyle = "#181425";
  c.beginPath();
  c.arc(-s * 0.1, -s * 1.64, s * 0.07, 0, 7);
  c.arc(s * 0.1, -s * 1.64, s * 0.07, 0, 7);
  c.fill();
  for (let i = 0; i < 3; i++) c.fillRect(-s * 0.1 + i * s * 0.08, -s * 1.44, s * 0.03, s * 0.1);
  glowEye(c, -s * 0.1, -s * 1.64, s * 0.03, "#2ce8f5");
  glowEye(c, s * 0.1, -s * 1.64, s * 0.03, "#2ce8f5");
  c.restore();
}
function drawSeraph(c, x, gy, s, t, f, br) {
  drawSerpent(c, x, gy, s * 0.9, t, f, { col: "#be4a2f", belly: "#fee761", breath: br });
  if (!f) for (let i = 0; i < 3; i++) flame(c, x - s * 0.3 + i * s * 0.35, gy - s * 0.25, s * 0.016, t + i);
}
function drawMobSprite(c, sp, x, gy, s, t, f, br, seed, Wd) {
  switch (sp) {
    case "imp":
      return drawImp(c, x, gy, s, t, f, seed);
    case "wraith":
      return drawWraith(c, x, gy, s, t, f, seed);
    case "dragon":
      return drawDragon(c, x + Wd * 0.03, gy, s * 0.88, t, f, { col: ["#4f7a3a", "#8a3a2a", "#3a5a8a"][seed % 3], belly: "#c9a86a", breath: br });
    case "snake":
      return drawSerpent(c, x, gy, s * 0.85, t, f, { col: ["#3e8948", "#265c42", "#733e39"][seed % 3], breath: br });
    case "raven":
      return drawRaven(c, x, gy, s * 0.85, t, f);
    case "golem":
      return drawGolem(c, x, gy, s * 0.75, t, f);
    case "idol":
      return drawIdol(c, x, gy, s * 0.95, t, f);
    case "jackal":
      return drawJackal(c, x, gy, s * 0.95, t, f, br);
    case "goat":
      return drawGoat(c, x, gy, s * 0.78, t, f);
    case "frog":
      return drawFrog(c, x, gy, s * 1.1, t, f);
    case "locust":
      return drawLocust(c, x, gy, s * 0.95, t, f);
    case "scorpion":
      return drawScorpion(c, x, gy, s * 1.05, t, f, br);
    case "seraph":
      return drawSeraph(c, x, gy, s, t, f, br);
    default:
      return drawSkel(c, x, gy, s * 0.85, t, f, br);
  }
}

function drawMob(c, m, mx, gy, sc, t, f, br, Wd) {
  let s = 34 * sc,
    x = mx;
  if (m.fled) x += (t - m.fled) * Wd * 1.4;
  if (m.type === "elite") {
    s *= 1.25;
    if (!f) for (let i = 0; i < 5; i++) flame(c, x - s * 0.9 + i * s * 0.45, gy + 2, s * (0.012 + 0.004 * (i % 2)), t + i * 1.3);
  }
  if (m.type === "fast" && !RM) {
    const a = c.globalAlpha;
    for (let i = 2; i >= 1; i--) {
      c.globalAlpha = a * 0.22;
      drawMobSprite(c, m.sp, x + i * 10, gy, s * 0.9, t - i * 0.06, false, false, m.seed, Wd);
    }
    c.globalAlpha = a;
    s *= 0.9;
  }
  if (m.type === "twin") {
    drawMobSprite(c, m.sp, x + s * 0.75, gy, s * 0.78, t + 0.5, f, br, m.seed + 1, Wd);
    drawMobSprite(c, m.sp, x - s * 0.55, gy, s * 0.78, t, f, br, m.seed, Wd);
    return;
  }
  drawMobSprite(c, m.sp, x, gy, s, t, f, br, m.seed, Wd);
}

function drawIdolBoss(c, x, gy, s, t, f, br) {
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 1.1);
  c.fillStyle = FL(f, "#3a4466");
  c.fillRect(-s * 1.0, -s * 0.3, s * 2.0, s * 0.3);
  c.fillStyle = FL(f, "#5a6988");
  c.fillRect(-s * 0.85, -s * 0.5, s * 1.7, s * 0.2);
  const g = c.createLinearGradient(0, -s * 2.4, 0, -s * 0.5);
  g.addColorStop(0, FL(f, "#8b9bb4"));
  g.addColorStop(1, FL(f, "#3a4466"));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-s * 0.7, -s * 0.5);
  c.lineTo(s * 0.7, -s * 0.5);
  c.lineTo(s * 0.5, -s * 1.7);
  c.lineTo(-s * 0.5, -s * 1.7);
  c.fill();
  c.fillRect(-s * 0.95, -s * 1.6, s * 0.3, s * 0.9);
  c.fillRect(s * 0.65, -s * 1.6, s * 0.3, s * 0.9);
  c.beginPath();
  c.arc(0, -s * 2.0, s * 0.42, 0, 7);
  c.fill();
  c.fillStyle = FL(f, "#feae34");
  c.beginPath();
  c.arc(0, -s * 2.55, s * 0.34, 0.25, Math.PI - 0.25);
  c.arc(0, -s * 2.68, s * 0.3, Math.PI - 0.5, 0.5, true);
  c.fill();
  c.fillStyle = "#181425";
  c.fillRect(-s * 0.24, -s * 2.1, s * 0.16, s * 0.1);
  c.fillRect(s * 0.08, -s * 2.1, s * 0.16, s * 0.1);
  c.fillRect(-s * 0.16, -s * 1.84, s * 0.32, br ? s * 0.14 : s * 0.05);
  glowEye(c, -s * 0.16, -s * 2.05, s * 0.06, "#b55088");
  glowEye(c, s * 0.16, -s * 2.05, s * 0.06, "#b55088");
  c.strokeStyle = "#181425";
  c.lineWidth = s * 0.03;
  c.beginPath();
  c.moveTo(s * 0.1, -s * 1.6);
  c.lineTo(-s * 0.15, -s * 1.2);
  c.lineTo(s * 0.1, -s * 0.9);
  c.lineTo(-s * 0.05, -s * 0.55);
  c.stroke();
  if (br) {
    c.globalAlpha = 0.6;
    c.fillStyle = "#b55088";
    for (let k = 0; k < 10; k++) {
      const d = Math.random();
      c.beginPath();
      c.arc(-s * 0.3 - d * s * 1.8, -s * 1.8 + (Math.random() - 0.5) * d * s * 0.6, s * (0.05 + d * 0.1), 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  smoke(c, -s * 0.8, -s * 0.5, t, 4, 6, "#68386c", 8);
  smoke(c, s * 0.8, -s * 0.5, t + 2, 4, 6, "#68386c", 8);
  c.restore();
}
function drawTerafimBoss(c, x, gy, s, t, f, br) {
  c.save();
  c.translate(x, gy);
  sShadow(c, s, 1.1);
  c.restore();
  for (let i = 0; i < 3; i++) {
    const a = t * 0.9 + i * 2.094,
      ox = Math.cos(a) * s * 0.95,
      oy = Math.sin(a * 1.3) * s * 0.2,
      back = Math.sin(a) < 0;
    if (back) {
      c.save();
      c.globalAlpha *= 0.75;
      drawIdol(c, x + ox, gy - s * 0.5 + oy, s * 0.75, t + i, f);
      c.restore();
    }
  }
  c.save();
  c.translate(x, gy - s * 0.9 + Math.sin(t * 1.5) * s * 0.06);
  c.fillStyle = FL(f, "#d77643");
  c.beginPath();
  c.ellipse(0, -s * 0.5, s * 0.5, s * 0.68, 0, 0, 7);
  c.fill();
  c.fillStyle = "#181425";
  c.beginPath();
  c.ellipse(-s * 0.2, -s * 0.62, s * 0.12, s * 0.16, 0, 0, 7);
  c.ellipse(s * 0.2, -s * 0.62, s * 0.12, s * 0.16, 0, 0, 7);
  c.fill();
  c.beginPath();
  c.ellipse(0, -s * 0.15, s * 0.2, br ? s * 0.22 : s * 0.08, 0, 0, 7);
  c.fill();
  glowEye(c, -s * 0.2, -s * 0.62, s * 0.05, "#fee761");
  glowEye(c, s * 0.2, -s * 0.62, s * 0.05, "#fee761");
  c.strokeStyle = "#733e39";
  c.lineWidth = s * 0.035;
  c.beginPath();
  c.moveTo(-s * 0.1, -s * 1.15);
  c.lineTo(s * 0.05, -s * 0.85);
  c.lineTo(-s * 0.08, -s * 0.4);
  c.stroke();
  c.restore();
  for (let i = 0; i < 3; i++) {
    const a = t * 0.9 + i * 2.094,
      ox = Math.cos(a) * s * 0.95,
      oy = Math.sin(a * 1.3) * s * 0.2;
    if (Math.sin(a) >= 0) drawIdol(c, x + ox, gy - s * 0.5 + oy, s * 0.75, t + i, f);
  }
}
const _dbk = drawBossKind;
drawBossKind = function (c, kind, mx, gy, sc, t, f, br, Wd) {
  if (kind === "demon") return drawIdolBoss(c, mx + Wd * 0.02, gy, 46 * sc, t, f, br);
  if (kind === "demon2") return drawTerafimBoss(c, mx + Wd * 0.02, gy, 44 * sc, t, f, br);
  if (kind === "nefilim") {
    c.save();
    c.globalAlpha *= 0.8;
    drawGiant(c, mx + 38 * sc, gy, 40 * sc, t + 1, f, "nefilim", false);
    c.restore();
  }
  return _dbk(c, kind, mx, gy, sc, t, f, br, Wd);
};

function rageAura(c, mx, gy, sc, t) {
  c.save();
  for (let i = 0; i < 3; i++) {
    c.globalAlpha = 0.16 - 0.04 * i + 0.05 * Math.sin(t * 6 + i);
    c.fillStyle = i ? "#a22633" : "#e43b44";
    c.beginPath();
    c.ellipse(mx, gy - 60 * sc, (70 + i * 22) * sc, (80 + i * 18) * sc, 0, 0, 7);
    c.fill();
  }
  c.restore();
}

const SKY2 = {
  garden: ["#0b1a1f", "#1f4a3c"],
  mountain: ["#0f1620", "#3a4466"],
  tower: ["#1a0d12", "#733e39"],
  ziggurat: ["#120b20", "#4a2a5a"],
  well: ["#150f14", "#6a4a2a"],
  hills: ["#0c1512", "#2f4a42"],
  pillar: ["#070a1c", "#262b6a"],
  tents: ["#12080a", "#5a1f1a"],
  pyramids: ["#14140a", "#5a5a22"],
  spring: ["#08141a", "#1f4a5a"],
  sinai: ["#0a0508", "#4a0f14"],
};
const FOGC = {
  garden: "#63c74d",
  mountain: "#8b9bb4",
  tower: "#b86f50",
  ziggurat: "#b55088",
  well: "#e4a672",
  hills: "#8b9bb4",
  pillar: "#5a6988",
  tents: "#be4a2f",
  pyramids: "#e4a672",
  spring: "#2ce8f5",
  sinai: "#a22633",
  dungeon: "#5a6988",
};
const _sceneFX = sceneFX;
sceneFX = function (c, W, H, scene, t, boss) {
  _sceneFX(c, W, H, scene, t, boss);
  c.fillStyle = "#0b0612";
  for (let i = 0; i < 3; i++) {
    const x = ((t * (5 + i * 3) + i * W * 0.4) % (W * 1.5)) - W * 0.25;
    c.globalAlpha = 0.4;
    c.beginPath();
    c.ellipse(x, H * (0.1 + i * 0.07), W * 0.2, H * 0.045, 0, 0, 7);
    c.ellipse(x + W * 0.1, H * (0.12 + i * 0.07), W * 0.14, H * 0.035, 0, 0, 7);
    c.fill();
  }
  c.fillStyle = boss ? "#a22633" : FOGC[scene] || "#8b9bb4";
  for (let i = 0; i < 4; i++) {
    const x = ((((t * (9 + i * 5) * (i % 2 ? 1 : -1) + i * W * 0.33) % (W * 1.6)) + W * 1.6) % (W * 1.6)) - W * 0.3;
    c.globalAlpha = 0.07 + 0.03 * Math.sin(t * 0.7 + i);
    c.beginPath();
    c.ellipse(x, H * (0.74 + i * 0.045), W * 0.34, H * 0.07, 0, 0, 7);
    c.fill();
  }
  c.globalAlpha = 1;
};


function drawHero(c, x, gy, s, t, flash, cls, glow) {
  const R_ = glow && ENV.relics ? ENV.relics : new Set(),
    has = (id) => R_.has(id),
    wv = RM ? 0 : Math.sin(t * 2.2),
    br = RM ? 0 : Math.sin(t * 2.4) * 0.5,
    fl = RM ? 0 : Math.sin(t * 6) * 3,
    blink = !RM && t % 4.3 < 0.13;
  c.save();
  c.translate(x, gy);
  c.fillStyle = "rgba(0,0,0,.45)";
  c.beginPath();
  c.ellipse(0, 1, 17 * s, 3.5 * s, 0, 0, 7);
  c.fill();
  const F = (col) => (flash ? "#ff9a8f" : col),
    skin = "#c28569",
    skinD = "#b86f50";
  const P = (p, col) => {
    c.fillStyle = F(col);
    c.beginPath();
    for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i] * s, p[i + 1] * s) : c.moveTo(p[i] * s, p[i + 1] * s);
    c.fill();
  };
  const R = (a, b, w, h, col) => {
    c.fillStyle = F(col);
    c.fillRect(a * s, b * s, w * s, h * s);
  };
  const C = (a, b, r, col) => {
    c.fillStyle = F(col);
    c.beginPath();
    c.arc(a * s, b * s, r * s, 0, 7);
    c.fill();
  };
  const L = (p, col, w) => {
    c.strokeStyle = F(col);
    c.lineWidth = w * s;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i] * s, p[i + 1] * s) : c.moveTo(p[i] * s, p[i + 1] * s);
    c.stroke();
  };
  const face = (a, b) => {
    C(a, b, 5.7, skin);
    P([a - 5.7, b, a - 2, b + 5.4, a + 2, b + 5.6, a - 1, b + 2, a - 4.4, b - 1], skinD);
    R(a + 1.2, b - 3.3, 3.6, 1, "#3e2731");
    if (blink) R(a + 1.8, b - 1.2, 2.6, 0.8, "#3e2731");
    else {
      R(a + 1.6, b - 2, 2.8, 2.2, "#ffffff");
      R(a + 3, b - 1.8, 1.4, 1.8, "#181425");
    }
    P([a + 5.2, b - 0.8, a + 7.2, b + 1.2, a + 5.2, b + 1.8], skin);
  };
  if (cls === "mago") {
    /* ---------- profeta ---------- */
    if (has("tabuas")) {
      c.save();
      c.translate(-13 * s, -31 * s);
      c.rotate(-0.18);
      [
        [-5, 0],
        [4, 1],
      ].forEach(([dx, dy]) => {
        c.fillStyle = "#8b9bb4";
        c.beginPath();
        c.moveTo(dx * s - 4.5 * s, dy * s + 11 * s);
        c.lineTo(dx * s - 4.5 * s, dy * s - 6 * s);
        c.arc(dx * s, dy * s - 6 * s, 4.5 * s, Math.PI, 0);
        c.lineTo(dx * s + 4.5 * s, dy * s + 11 * s);
        c.fill();
        c.fillStyle = "#c0cbdc";
        c.fillRect(dx * s + 2.5 * s, dy * s - 8 * s, 1.4 * s, 18 * s);
        c.fillStyle = "#3a4466";
        for (let k = 0; k < 4; k++) c.fillRect(dx * s - 3 * s, dy * s - 5 * s + k * 3.4 * s, 5 * s, 0.9 * s);
      });
      c.restore();
    }
    P([-7, -38, -13, -30, -18 + wv * 1.5, -5, -15 + wv, -1, -12 + wv * 1.2, -6, -9, -1, -6, -8], "#3e2731");
    P([-7, -38, -11, -30, -14 + wv, -8, -9, -10], "#733e39");
    R(-7, -1.8, 6, 1.8, "#3e2731");
    R(2, -1.8, 7.5, 1.8, "#3e2731");
    R(6.5, -2.8, 3, 1.1, skin);
    c.translate(0, br * s);
    P([-12, -1, 12, -1, 9.5, -22, 7, -37, -7, -37, -9.5, -22], "#b86f50");
    P([-12, -1, -5, -1, -6.5, -22, -7, -37, -9.5, -22], "#733e39");
    P([8, -1, 12, -1, 9.5, -22, 8, -30, 7.4, -20], "#d77643");
    L([1.5, -34, 2.6, -22, 1.6, -3], "#733e39", 0.7);
    L([-2.5, -18, -3, -3], "#733e39", 0.7);
    L([5.5, -17, 6.2, -3], "#733e39", 0.7);
    c.strokeStyle = "#733e39";
    c.lineWidth = 0.9 * s;
    for (let i = 0; i < 18; i++) {
      const px = (rnd(i) - 0.5) * 19 * s,
        py = -4 * s - rnd(i + 20) * 31 * s;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + 1.4 * s, py + 2.6 * s);
      c.stroke();
    }
    R(-12, -2.4, 24, 1.5, "#733e39");
    for (let i = 0; i < 8; i++) R(-11 + i * 3, -1, 1, 1.6, "#3e2731");
    R(-9.6, -21.4, 19.2, 2.8, "#3e2731");
    R(-1.2, -21.6, 2.8, 3.2, "#feae34");
    P([3, -18.6, 5.2, -18.6, 6.4, -10.5, 4.2, -10.5], "#3e2731");
    R(-9, -18.6, 4.6, 7.4, "#ead4aa");
    R(-9.7, -19.2, 6, 1.3, "#733e39");
    R(-9.7, -11.6, 6, 1.3, "#733e39");
    R(-8, -16.6, 2.6, 0.6, "#b86f50");
    R(-8, -14.8, 2.6, 0.6, "#b86f50");
    if (has("urim")) {
      c.fillStyle = "#feae34";
      c.fillRect(-5.5 * s, -35 * s, 11 * s, 11 * s);
      const G = ["#e43b44", "#63c74d", "#0099db", "#feae34", "#b55088", "#2ce8f5", "#f77622", "#c0cbdc", "#3e8948", "#68386c", "#e4a672", "#124e89"];
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 3; k++) {
          c.fillStyle = G[r * 3 + k];
          c.fillRect(-4.6 * s + k * 3.3 * s, -34 * s + r * 2.6 * s, 2.5 * s, 2 * s);
        }
      c.globalAlpha = 0.3 + 0.25 * Math.sin(t * 3);
      c.fillStyle = "#fee761";
      c.fillRect(-5.5 * s, -35 * s, 11 * s, 11 * s);
      c.globalAlpha = 1;
      L([-5.5, -35, -7, -38], "#feae34", 0.8);
      L([5.5, -35, 7, -38], "#feae34", 0.8);
    }
    P([-7.6, -36, -12, -33, -13.4, -22, -9.4, -21.4], "#733e39");
    C(-11.4, -20.4, 2.1, skinD);
    if (has("vara_arao")) {
      L([-11.4, -14, -11.4, -21, -17, -43], "#733e39", 1.5);
      [
        [-12.4, -24],
        [-14, -30],
        [-15.6, -36],
        [-17.2, -43],
      ].forEach(([fx, fy], i) => {
        C(fx + (i % 2 ? 2 : -2), fy, 1.9, i % 2 ? "#63c74d" : "#ffffff");
        C(fx + (i % 2 ? 2 : -2), fy, 0.7, "#f6757a");
      });
    }
    face(0.5, -42.6);
    P([-4.4, -41.2, 6.6, -40.4, 5.6, -33, 2.4, -25.4, -1, -28.6, -3.4, -34], "#c0cbdc");
    P([-4.4, -41.2, -1, -40, -0.6, -30, -3.4, -34], "#8b9bb4");
    L([2, -38, 2.2, -29], "#8b9bb4", 0.6);
    L([4.2, -38, 4, -32], "#8b9bb4", 0.6);
    R(1.6, -40.8, 5, 1.3, "#ffffff");
    P([-7.2, -44, -5.4, -49.6, 0.6, -51.4, 5.8, -48.8, 6.8, -45.6, 3, -47.2, -2, -46.6, -5, -43, -6, -36, -9.4, -32.6, -10.4, -37.4], "#ead4aa");
    P([-7.2, -44, -10.4, -37.4, -9.4, -32.6, -7.4, -36], "#e4a672");
    L([-9, -35.4, -6.6, -43], "#124e89", 0.9);
    L([-4.6, -49, 1, -50.6], "#124e89", 0.8);
    P([6, -36, 10, -34.6, 17.4, -30.4, 17.6, -26, 9.4, -27, 6, -29.4], "#b86f50");
    P([6, -29.4, 9.4, -27, 17.6, -26, 16.8, -28, 9.6, -29], "#733e39");
    C(18.4, -28, 2.5, skin);
    if (has("cajado_moises")) {
      L([19, 2, 19, -70], "#3e2731", 3.2);
      c.strokeStyle = "#0099db";
      c.lineWidth = 1.3 * s;
      c.beginPath();
      for (let k = 0; k <= 26; k++) {
        const yy = -70 * s + k * 2.6 * s,
          xx = 19 * s + Math.sin(k * 0.9 + t * 4) * 3 * s;
        k ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.stroke();
      c.globalAlpha = 0.45 + 0.25 * Math.sin(t * 4);
      C(19, -71, 4.6, "#2ce8f5");
      c.globalAlpha = 1;
      C(19, -71, 1.8, "#ffffff");
    } else {
      L([19, 2, 19.7, -20, 18.5, -40, 19.2, -58], "#733e39", 2.7);
      c.strokeStyle = F("#733e39");
      c.lineWidth = 2.7 * s;
      c.beginPath();
      c.arc(15.2 * s, -58 * s, 4 * s, 0, Math.PI * 1.15, true);
      c.stroke();
      C(19.5, -22, 1.5, "#3e2731");
      C(18.7, -41, 1.3, "#3e2731");
      L([19.9, -10, 20.1, -30], "#b86f50", 0.6);
    }
    C(18.4, -28, 1.6, skin);
  } else if (cls === "cavaleiro") {
    /* ---------- guerreiro de Israel ---------- */
    if (has("espada_golias")) {
      c.save();
      c.translate(-4 * s, -29 * s);
      c.rotate(0.7);
      c.fillStyle = "#c0cbdc";
      c.fillRect(-1.9 * s, -36 * s, 3.8 * s, 32 * s);
      c.fillStyle = "#ffffff";
      c.fillRect(-0.4 * s, -35 * s, 0.8 * s, 30 * s);
      c.fillStyle = "#feae34";
      c.fillRect(-6 * s, -4 * s, 12 * s, 2.4 * s);
      c.fillStyle = "#733e39";
      c.fillRect(-1.4 * s, -1.6 * s, 2.8 * s, 8 * s);
      c.fillStyle = "#feae34";
      c.beginPath();
      c.arc(0, 7 * s, 2 * s, 0, 7);
      c.fill();
      c.restore();
    }
    P([-9, -38, -16 + wv * 1.4, -15, -13 + wv * 1.8, -6, -9 + wv, -9, -6, -13, -5, -36], "#a22633");
    P([-9, -38, -13 + wv, -18, -9, -12, -6, -30], "#733e39");
    if (has("trombeta_sinai")) {
      c.strokeStyle = "#ead4aa";
      c.lineWidth = 3.4 * s;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-11 * s, -15 * s);
      c.quadraticCurveTo(-21 * s, -13 * s, -20 * s, -4 * s);
      c.stroke();
      c.strokeStyle = "#e4a672";
      c.lineWidth = 1.2 * s;
      c.beginPath();
      c.moveTo(-14 * s, -13.4 * s);
      c.quadraticCurveTo(-19.6 * s, -11 * s, -19 * s, -6 * s);
      c.stroke();
      c.lineCap = "butt";
    }
    R(-7, -13, 5, 13, skin);
    R(2, -13, 5, 13, skin);
    R(-7, -13, 1.6, 13, skinD);
    R(2, -13, 1.6, 13, skinD);
    R(-7.5, -9.4, 6, 6.4, "#d77643");
    R(1.5, -9.4, 6, 6.4, "#d77643");
    R(-4.6, -9.4, 1.1, 6.4, "#feae34");
    R(4.4, -9.4, 1.1, 6.4, "#feae34");
    R(-7.5, -9.4, 6, 1, "#b86f50");
    R(1.5, -9.4, 6, 1, "#b86f50");
    R(-8, -1.9, 7, 1.9, "#3e2731");
    R(1.4, -1.9, 7.8, 1.9, "#3e2731");
    L([-7, -3, -2, -2.4], "#733e39", 0.7);
    L([2, -3, 7.4, -2.4], "#733e39", 0.7);
    c.translate(0, br * s);
    P([-11, -12, 11, -12, 9.4, -21, -9.4, -21], "#ead4aa");
    P([-11, -12, -6, -12, -7, -21, -9.4, -21], "#e4a672");
    for (let k = 0; k < 6; k++) {
      R(-9.6 + k * 3.3, -21, 2.6, 7.2, k < 2 ? "#3e2731" : "#733e39");
      R(-8.8 + k * 3.3, -15.6, 1, 1, "#feae34");
    }
    P([-10, -20, 10, -20, 11, -38, -11, -38], "#733e39");
    P([-10, -20, -6.4, -20, -7, -38, -11, -38], "#3e2731");
    for (let r = 0; r < 5; r++)
      for (let k = 0; k < 6; k++) {
        const sx = -8.6 + k * 3.4 + (r % 2) * 1.7,
          sy = -36 + r * 3.4;
        if (sx > 9.4) continue;
        c.fillStyle = F(r === 0 || k > 3 ? "#feae34" : "#d77643");
        c.beginPath();
        c.arc(sx * s, sy * s, 1.5 * s, 0, Math.PI);
        c.fill();
      }
    R(-11, -22.4, 22, 2.8, "#3e2731");
    R(-1.4, -22.6, 3, 3.2, "#feae34");
    P([-9, -20, -6.8, -20, -12.6, -6, -14.8, -7], "#3e2731");
    R(-9.4, -23.6, 3, 1.6, "#feae34");
    C(-10, -37, 3.6, "#d77643");
    C(10, -37, 3.6, "#d77643");
    C(10.8, -38, 1.4, "#feae34");
    if (has("trombeta_sinai")) L([9, -38, -11, -16], "#3e2731", 0.9);
    face(0, -43.6);
    P([-4.6, -42, 6.4, -41.6, 4.8, -36.4, 0.4, -34.8, -3.8, -37], "#3e2731");
    R(1.8, -41.6, 4.6, 1.1, "#181425");
    P([-7, -45, -5.6, -50.6, 0, -53.8, 5.6, -50.6, 7, -45], "#d77643");
    P([1, -53.2, 4.8, -50.6, 5.8, -46, 3.2, -46], "#feae34");
    P([-7, -45, -5.6, -50.6, -3, -52, -4.4, -45], "#b86f50");
    R(-7.6, -46.2, 15.2, 1.9, "#b86f50");
    R(4.6, -46, 1.5, 4.8, "#b86f50");
    P([-7, -45, -4, -45, -4.6, -38.6, -6.6, -40], "#b86f50");
    R(-0.9, -56, 1.8, 2.6, "#feae34");
    if (has("lanca_josue")) {
      L([16, 4, 24, -72], "#3e2731", 2.6);
      P([24.9, -84, 21.5, -71, 27.6, -71], "#feae34");
      P([24.9, -84, 24.4, -71, 27.6, -71], "#fee761");
      P([23.6, -68, 33.4, -65 + fl * 0.6, 23.2, -62], "#a22633");
      P([23.6, -68, 29, -66.4 + fl * 0.4, 23.4, -65], "#e43b44");
    } else {
      L([16, 4, 23, -63], "#733e39", 2.6);
      P([23.1, -73, 20.4, -62, 25.7, -62], "#d77643");
      P([23.1, -73, 22.8, -62, 25.7, -62], "#feae34");
      R(20.6, -62.6, 5, 1.3, "#3e2731");
    }
    P([7, -37, 11, -35.6, 15.6, -28.6, 12.4, -26.4], skin);
    R(13.2, -31.6, 4, 3.4, "#733e39");
    C(18, -26.6, 2.5, skin);
    if (has("escudo_abraao")) {
      C(-13, -24.6, 13, "#feae34");
      C(-13, -24.6, 11, "#124e89");
      C(-9.6, -28, 6, "#0099db");
      C(-13, -24.6, 10.2, "#124e89");
      for (let i = 0; i < 10; i++) {
        const a = rnd(i) * 6.28,
          r = rnd(i + 9) * 9 * s;
        c.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + i);
        c.fillStyle = "#fee761";
        c.fillRect(-13 * s + Math.cos(a) * r - 0.8 * s, -24.6 * s + Math.sin(a) * r - 0.8 * s, 1.6 * s, 1.6 * s);
      }
      c.globalAlpha = 1;
      C(-13, -24.6, 2.4, "#fee761");
    } else {
      C(-13, -24.6, 10.6, "#d77643");
      C(-13, -24.6, 8.8, "#b86f50");
      P([-21.8, -24.6, -13, -33.4, -13, -15.8], "#733e39");
      L([-13, -33, -13, -16], "#3e2731", 0.7);
      L([-18, -31, -18, -18], "#3e2731", 0.5);
      L([-8, -31, -8, -18], "#3e2731", 0.5);
      C(-13, -24.6, 2.8, "#d77643");
      C(-12.4, -25.2, 1.2, "#feae34");
      [
        [-13, -31.6],
        [-13, -17.6],
        [-20, -24.6],
        [-6, -24.6],
      ].forEach(([a, b]) => C(a, b, 0.8, "#feae34"));
    }
  } else {
    /* ---------- juiz benjamita ---------- */
    if (has("manto_elias")) {
      c.save();
      c.translate(-2 * s, -25 * s);
      c.rotate(-0.55);
      c.fillStyle = "#733e39";
      c.fillRect(-1.3 * s, -36 * s, 2.6 * s, 47 * s);
      c.fillStyle = "#c0cbdc";
      c.beginPath();
      c.moveTo(0, -43 * s);
      c.lineTo(-2 * s, -35 * s);
      c.lineTo(2 * s, -35 * s);
      c.fill();
      c.fillStyle = "#3e2731";
      c.fillRect(-1.6 * s, -34 * s, 3.2 * s, 1.4 * s);
      c.restore();
    }
    P([-6, -35, -14 + fl * 0.3, -20, -20 + fl, -7, -16 + fl, -10, -14 + fl * 0.6, -4, -10, -9, -6, -12], "#181425");
    P([-6, -35, -12 + fl * 0.3, -20, -15 + fl * 0.7, -9, -9, -12], "#262b44");
    R(-6, -11, 4.6, 11, "#5a6988");
    R(1.6, -11, 4.6, 11, "#5a6988");
    R(-6, -11, 1.5, 11, "#3a4466");
    R(1.6, -11, 1.5, 11, "#3a4466");
    for (let k = 0; k < 3; k++) {
      L([-6, -8.6 + k * 2.8, -1.4, -9.6 + k * 2.8], "#3a4466", 0.6);
      L([1.6, -8.6 + k * 2.8, 6.2, -9.6 + k * 2.8], "#3a4466", 0.6);
    }
    R(-7, -2.5, 6.2, 2.5, "#3e2731");
    R(1, -2.5, 7, 2.5, "#3e2731");
    R(5.4, -3.3, 2.6, 1, "#733e39");
    c.translate(0, br * s);
    P([-10, -10, 10, -10, 8, -22, 8, -35, -8, -35, -8, -22], "#3a4466");
    P([-10, -10, -5, -10, -5, -22, -5.6, -35, -8, -35, -8, -22], "#262b44");
    P([6, -10, 10, -10, 8, -22, 8, -33, 6.6, -22], "#5a6988");
    R(-10, -11.5, 20, 1.5, "#5a6988");
    L([-7, -34, 7.4, -22.4], "#733e39", 1.6);
    C(0.4, -28, 1.1, "#feae34");
    R(-9.2, -22.4, 18.4, 3.2, "#a22633");
    R(-9.2, -22.4, 18.4, 1, "#e43b44");
    P([-8, -20, -12.4 + fl * 0.3, -12.4, -10 + fl * 0.3, -11.6, -6, -19], "#a22633");
    P([-6, -20, -8.6 + fl * 0.3, -9.6, -6.4 + fl * 0.3, -9.4, -4.4, -19.4], "#733e39");
    if (has("funda_davi")) {
      P([-11, -19.4, -4, -19.4, -5, -11, -10, -11], "#b86f50");
      P([-11, -19.4, -4, -19.4, -4.6, -17, -10.6, -17], "#733e39");
      for (let k = 0; k < 5; k++) C(-10 + k * 1.5, -20 - (k % 2), 1, "#c0cbdc");
    }
    if (has("punhal_eude")) {
      P([5.8, -5.4, 4.2, -17, 7.4, -17], "#ffffff");
      P([5.8, -5.4, 5.8, -17, 7.4, -17], "#c0cbdc");
      R(3, -19, 5.6, 2, "#feae34");
      R(5, -22.4, 1.6, 3.4, "#733e39");
      C(5.8, -23, 1, "#feae34");
      c.globalAlpha = Math.max(0, Math.sin(t * 2.5));
      R(5, -14, 1.2, 1.2, "#ffffff");
      c.globalAlpha = 1;
    } else {
      R(5, -17, 1.6, 8.4, "#c0cbdc");
      R(4, -19, 3.6, 2.2, "#733e39");
    }
    P([-8, -34, -11.4, -31, -11.4, -23, -8, -23], "#262b44");
    R(-11.8, -26.4, 3.8, 3, "#733e39");
    C(-9.8, -22, 2, skinD);
    face(0, -41);
    P([-5.6, -40.4, 6.6, -40.8, 6.2, -36, 0.4, -34.4, -5.2, -36.4], "#262b44");
    P([-5.6, -40.4, 6.6, -40.8, 6.4, -39.4, -5.4, -39], "#3a4466");
    P([-6.8, -42, -5.2, -47.6, 0, -49.2, 5.6, -47.4, 6.8, -43, 6.4, -41.6, -6.6, -41.6], "#5a6988");
    P([-6.8, -42, -5.2, -47.6, -2.4, -48.6, -3.6, -41.6], "#3a4466");
    R(-6.6, -44.2, 13.2, 1.7, "#8b9bb4");
    P([-6, -44, -13 + fl * 0.4, -41, -18 + fl, -35, -13 + fl * 0.5, -36.4, -6, -39], "#5a6988");
    P([-6, -42, -12 + fl * 0.4, -39.6, -14 + fl * 0.7, -36.6, -6, -39], "#3a4466");
    P([6, -34, 9.4, -33, 14.2, -29, 12.2, -26, 7, -28], "#3a4466");
    R(10.6, -30.6, 3.8, 3.2, "#733e39");
    R(10.6, -30.6, 3.8, 0.9, "#b86f50");
    const hx = 13.4,
      hy = -27,
      a = RM ? 0.6 : t * 10,
      sx = hx + Math.cos(a) * 9.5,
      sy = hy - 6 + Math.sin(a) * 5.2;
    C(hx, hy, 2.5, skin);
    if (has("cordao_raabe")) {
      c.strokeStyle = "#e43b44";
      c.lineWidth = 1.3 * s;
      c.beginPath();
      c.arc(hx * s, hy * s, 2.9 * s, 0, 7);
      c.stroke();
      c.beginPath();
      c.moveTo((hx - 2) * s, (hy + 1) * s);
      c.quadraticCurveTo((hx - 6) * s, (hy + 6) * s + fl * 0.5 * s, (hx - 4) * s + fl * 0.6 * s, (hy + 12.5) * s);
      c.stroke();
    }
    if (!RM) {
      c.globalAlpha = 0.3;
      c.strokeStyle = has("funda_davi") ? "#fee761" : "#c0cbdc";
      c.lineWidth = 0.9 * s;
      c.beginPath();
      c.ellipse(hx * s, (hy - 6) * s, 9.5 * s, 5.2 * s, 0, a - 1.6, a);
      c.stroke();
      c.globalAlpha = 1;
    }
    L([hx, hy, sx, sy], has("funda_davi") ? "#e4a672" : "#b86f50", 1);
    if (has("funda_davi")) {
      c.globalAlpha = 0.35;
      C(sx, sy, 4.2, "#fee761");
      c.globalAlpha = 1;
    }
    C(sx, sy, 2.3, has("funda_davi") ? "#fee761" : "#8b9bb4");
    C(sx + 0.6, sy - 0.6, 0.8, "#ffffff");
  }
  c.restore();
}

const FGK = {
  garden: ["leaf", "leaf", "grass"],
  mountain: ["rock", "rock", "stone"],
  tower: ["brick", "pole", "sand"],
  ziggurat: ["column", "urn", "sand"],
  well: ["bush", "rock", "sand"],
  hills: ["wall", "bush", "grass"],
  pillar: ["menhir", "rock", "stone"],
  tents: ["pole", "urn", "sand"],
  pyramids: ["obelisk", "reed", "sand"],
  spring: ["reed", "reed", "grass"],
  sinai: ["rock", "dead", "stone"],
  dungeon: ["stalag", "skull", "stone"],
};
function fgProp(c, k, x, H, d, t) {
  const B_ = "#0b0612",
    M_ = "#181425";
  c.save();
  c.translate(x, H);
  c.scale(d, 1);
  c.fillStyle = B_;
  const P = (p, col) => {
    c.fillStyle = col || B_;
    c.beginPath();
    for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i], p[i + 1]) : c.moveTo(p[i], p[i + 1]);
    c.fill();
  };
  switch (k) {
    case "rock":
      P([-10, 2, -6, -30, 6, -44, 18, -26, 30, -18, 44, 2]);
      P([6, -44, 18, -26, 10, -22, 2, -30], M_);
      break;
    case "leaf":
      for (let i = 0; i < 5; i++) {
        c.save();
        c.rotate(-1.2 + i * 0.34 + Math.sin(t * 1.3 + i) * 0.04);
        c.beginPath();
        c.ellipse(0, -34, 9, 36, 0, 0, 7);
        c.fill();
        c.restore();
      }
      break;
    case "brick":
      for (let r = 0; r < 4; r++)
        for (let i = 0; i < 5 - r; i++) {
          c.fillStyle = (r + i) % 2 ? M_ : B_;
          c.fillRect(-8 + i * 13 + r * 6, -9 - r * 9, 12, 8);
        }
      break;
    case "pole":
      c.fillRect(8, -74, 5, 76);
      c.fillRect(-6, -66, 34, 4);
      c.strokeStyle = B_;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(10, -66);
      c.lineTo(-12, 2);
      c.moveTo(26, -64);
      c.lineTo(40, 2);
      c.stroke();
      break;
    case "column":
      c.fillRect(2, -56, 20, 58);
      c.fillRect(-3, -62, 30, 7);
      P([-3, -62, 27, -62, 20, -70, 8, -66]);
      c.fillStyle = M_;
      for (let i = 0; i < 3; i++) c.fillRect(6 + i * 5, -54, 2, 52);
      break;
    case "urn":
      P([4, 2, 0, -14, 6, -26, 3, -30, 19, -30, 16, -26, 22, -14, 18, 2]);
      c.fillStyle = M_;
      c.fillRect(2, -17, 18, 2);
      break;
    case "bush":
    case "dead":
      c.strokeStyle = B_;
      c.lineWidth = 3;
      c.lineCap = "round";
      [
        [0, -40, -0.5],
        [8, -56, 0.1],
        [16, -38, 0.6],
      ].forEach(([dx, ty, a], i) => {
        c.beginPath();
        c.moveTo(8, 2);
        c.quadraticCurveTo(8 + a * 10, ty * 0.5, 8 + dx + Math.sin(t + i) * 1.2, ty);
        c.stroke();
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(8 + a * 8, ty * 0.6);
        c.lineTo(8 + a * 8 + 10 * (i % 2 ? 1 : -1), ty * 0.6 - 10);
        c.stroke();
        c.lineWidth = 3;
      });
      break;
    case "wall":
      for (let i = 0; i < 6; i++) {
        c.fillStyle = i % 2 ? M_ : B_;
        c.beginPath();
        c.ellipse(-4 + i * 9, -7 - (i % 3) * 5, 8, 6, 0, 0, 7);
        c.fill();
        c.beginPath();
        c.ellipse(i * 9, -18 + (i % 2) * 3, 7, 5, 0, 0, 7);
        c.fill();
      }
      break;
    case "menhir":
      P([-2, 2, 0, -50, 8, -60, 16, -48, 18, 2]);
      P([24, 2, 26, -28, 34, -34, 40, -24, 42, 2]);
      c.fillStyle = M_;
      c.fillRect(4, -50, 2, 46);
      break;
    case "obelisk":
      P([4, 2, 7, -66, 12, -78, 17, -66, 20, 2]);
      c.fillStyle = M_;
      for (let i = 0; i < 5; i++) c.fillRect(10, -58 + i * 11, 4, 5);
      break;
    case "reed":
      c.strokeStyle = B_;
      c.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const sw = Math.sin(t * 1.6 + i) * 3,
          h = 34 + rnd(i) * 34;
        c.beginPath();
        c.moveTo(i * 6, 2);
        c.quadraticCurveTo(i * 6 + sw * 0.4, -h * 0.5, i * 6 + sw, -h);
        c.stroke();
        c.beginPath();
        c.ellipse(i * 6 + sw, -h - 4, 2.2, 6, sw * 0.03, 0, 7);
        c.fill();
      }
      break;
    case "stalag":
      P([-6, 2, 2, -40, 8, 2]);
      P([10, 2, 18, -62, 26, 2]);
      P([28, 2, 34, -28, 40, 2]);
      break;
    case "skull":
      c.beginPath();
      c.arc(14, -10, 10, 0, 7);
      c.fill();
      c.fillRect(8, -4, 12, 7);
      c.fillStyle = "#3a4466";
      c.fillRect(9, -13, 4, 4);
      c.fillRect(16, -13, 4, 4);
      break;
  }
  c.restore();
}
function fgFX(c, W, H, scene, t) {
  const k = FGK[scene];
  if (!k) return;
  const gy = H * 0.86;
  const g = c.createLinearGradient(0, gy, 0, H);
  g.addColorStop(0, "rgba(11,6,18,0)");
  g.addColorStop(1, "rgba(11,6,18,.7)");
  c.fillStyle = g;
  c.fillRect(0, gy, W, H - gy);
  for (let i = 0; i < 46; i++) {
    const x = rnd(i + 500) * W,
      y = gy + 4 + rnd(i + 600) * (H - gy - 6);
    if (k[2] === "grass") {
      c.strokeStyle = i % 3 ? "#265c42" : "#193c3e";
      c.lineWidth = 1.5;
      const sw = Math.sin(t * 2 + x * 0.05) * 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + sw - 2, y - 6);
      c.moveTo(x, y);
      c.lineTo(x + sw + 2, y - 7);
      c.stroke();
    } else if (k[2] === "sand") {
      c.fillStyle = i % 2 ? "#3e2731" : "#181425";
      c.fillRect(x, y, i % 4 ? 3 : 6, 2);
    } else {
      c.fillStyle = i % 2 ? "#262b44" : "#181425";
      c.beginPath();
      c.ellipse(x, y, 2 + rnd(i) * 4, 1.5 + rnd(i + 3) * 2, 0, 0, 7);
      c.fill();
    }
  }
  const sc = Math.min(1.2, H / 230);
  c.save();
  c.translate(0, 0);
  fgProp(c, k[0], W * 0.005, H, 1, t);
  fgProp(c, k[1], W * 0.995, H, -1, t);
  c.restore();
}
const _sceneFX2 = sceneFX;
sceneFX = function (c, W, H, scene, t, boss) {
  const mx = W * 0.5,
    my = H * 0.16;
  for (let i = 3; i > 0; i--) {
    c.globalAlpha = 0.05;
    c.fillStyle = boss ? "#e43b44" : "#ead4aa";
    c.beginPath();
    c.arc(mx, my, 12 + i * 10, 0, 7);
    c.fill();
  }
  c.globalAlpha = 1;
  _sceneFX2(c, W, H, scene, t, boss);
};


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
