/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: arte em pixel
 * ==========================================================================
 * Cenários, heróis e criaturas desenhados em canvas, sem imagens externas.
 * O desenho é feito em baixa resolução e passa por uma paleta de 32 cores com
 * pontilhado e contorno, o que dá o aspecto de jogo de 8 bits.
 */

(function () {
// Quem pede menos movimento no sistema fica sem partículas e sem balanço
const RM =
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function paintBG(c, W, H, scene, idx, t) {
  const sky = SKIES[idx % 4],
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
  if (EMB.length < (boss ? 60 : 34))
    EMB.push({ x: Math.random() * W, y: H + 5, v: 12 + Math.random() * 28, s: 1 + Math.random() * 2, ph: Math.random() * 6 });
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
function drawDragon(c, x, gy, s, t, flash, { heads = 1, col = "#3d1f1a", belly = "#a8722c", big = false, breath = false } = {}) {
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
      hx = -s * 0.9 + off * s * 0.12 + sway,
      hy = -s * 1.2 + off * s * 0.35;
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

function drawHero(c, x, gy, s, t, flash, cls, glow) {
  const bob = RM ? 0 : Math.sin(t * 3) * 1.5;
  c.save();
  c.translate(x, gy + bob);
  c.fillStyle = "rgba(0,0,0,.4)";
  c.beginPath();
  c.ellipse(0, -bob + 1, 18 * s, 4 * s, 0, 0, 7);
  c.fill();
  const hurt = flash ? "#ff9a8f" : null;
  if (cls === "mago") {
    c.fillStyle = hurt || "#1f2f6b";
    c.beginPath();
    c.moveTo(-15 * s, 0);
    c.lineTo(15 * s, 0);
    c.lineTo(7 * s, -36 * s);
    c.lineTo(-7 * s, -36 * s);
    c.fill();
    c.fillStyle = "#e2b04a";
    c.fillRect(-15 * s, -3 * s, 30 * s, 3 * s);
    c.fillRect(-1.5 * s, -34 * s, 3 * s, 32 * s);
    c.fillStyle = "#d9b38c";
    c.beginPath();
    c.arc(0, -41 * s, 6.5 * s, 0, 7);
    c.fill();
    c.fillStyle = "#e8e2d4";
    c.beginPath();
    c.moveTo(-5 * s, -39 * s);
    c.lineTo(5 * s, -39 * s);
    c.lineTo(0, -27 * s);
    c.fill();
    c.fillStyle = hurt || "#1f2f6b";
    c.beginPath();
    c.moveTo(-11 * s, -44 * s);
    c.lineTo(11 * s, -44 * s);
    c.lineTo(3 * s, -70 * s);
    c.lineTo(8 * s, -74 * s);
    c.lineTo(-2 * s, -66 * s);
    c.fill();
    c.fillStyle = "#e2b04a";
    c.fillRect(-11 * s, -46 * s, 22 * s, 3 * s);
    c.strokeStyle = "#7a5a32";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(18 * s, 2);
    c.lineTo(20 * s, -62 * s);
    c.stroke();
    c.save();
    c.shadowColor = glow ? "#ffe08a" : "#7fc8ff";
    c.shadowBlur = 16;
    c.fillStyle = glow ? "#ffe08a" : "#9fd8ff";
    c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 5);
    c.beginPath();
    c.arc(20 * s, -66 * s, 5 * s, 0, 7);
    c.fill();
    c.restore();
  } else if (cls === "cavaleiro") {
    c.fillStyle = hurt || "#8a95a6";
    c.fillRect(-7 * s, -14 * s, 5 * s, 14 * s);
    c.fillRect(2 * s, -14 * s, 5 * s, 14 * s);
    c.fillStyle = hurt || "#a9b4c4";
    c.beginPath();
    c.moveTo(-12 * s, -14 * s);
    c.lineTo(12 * s, -14 * s);
    c.lineTo(10 * s, -38 * s);
    c.lineTo(-10 * s, -38 * s);
    c.fill();
    c.fillStyle = "#6b1a1a";
    c.beginPath();
    c.moveTo(-10 * s, -38 * s);
    c.lineTo(10 * s, -38 * s);
    c.lineTo(13 * s, -6 * s);
    c.lineTo(-13 * s, -6 * s);
    c.globalAlpha = 0.85;
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = "#c9d1dc";
    c.fillRect(-9 * s, -26 * s, 18 * s, 3 * s);
    c.fillStyle = hurt || "#b8c2d0";
    c.beginPath();
    c.moveTo(-8 * s, -40 * s);
    c.lineTo(8 * s, -40 * s);
    c.lineTo(8 * s, -52 * s);
    c.quadraticCurveTo(0, -58 * s, -8 * s, -52 * s);
    c.fill();
    c.fillStyle = "#111";
    c.fillRect(-6 * s, -48 * s, 12 * s, 2 * s);
    c.fillStyle = "#b02a2a";
    c.beginPath();
    c.moveTo(0, -56 * s);
    c.quadraticCurveTo(-10 * s, -66 * s, -16 * s, -52 * s);
    c.quadraticCurveTo(-8 * s, -60 * s, 0, -54 * s);
    c.fill();
    c.strokeStyle = "#dfe6f0";
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(14 * s, -18 * s);
    c.lineTo(28 * s, -54 * s);
    c.stroke();
    c.fillStyle = "#e2b04a";
    c.fillRect(10 * s, -20 * s, 10 * s, 3 * s);
    c.fillStyle = glow ? "#e2b04a" : "#5a4a2c";
    c.beginPath();
    c.ellipse(-14 * s, -24 * s, 8 * s, 11 * s, 0, 0, 7);
    c.fill();
    c.strokeStyle = "#e2b04a";
    c.lineWidth = 1.5 * s;
    c.stroke();
    c.fillStyle = "#e2b04a";
    c.beginPath();
    c.arc(-14 * s, -24 * s, 2.5 * s, 0, 7);
    c.fill();
  } else {
    c.fillStyle = hurt || "#3a4466";
    c.beginPath();
    c.moveTo(-13 * s, 0);
    c.lineTo(13 * s, 0);
    c.lineTo(8 * s, -34 * s);
    c.lineTo(-8 * s, -34 * s);
    c.fill();
    const fl = Math.sin(t * 6) * 3 * s;
    c.fillStyle = "#a22633";
    c.beginPath();
    c.moveTo(-8 * s, -34 * s);
    c.lineTo(-20 * s + fl, -6 * s);
    c.lineTo(-10 * s, -8 * s);
    c.fill();
    c.fillStyle = "#8b9bb4";
    c.fillRect(-13 * s, -16 * s, 26 * s, 3 * s);
    c.fillStyle = "#262b44";
    c.fillRect(-1 * s, -33 * s, 2 * s, 30 * s);
    c.fillStyle = hurt || "#3a4466";
    c.beginPath();
    c.moveTo(-9 * s, -34 * s);
    c.quadraticCurveTo(-10 * s, -52 * s, 0, -56 * s);
    c.quadraticCurveTo(10 * s, -52 * s, 9 * s, -34 * s);
    c.fill();
    c.fillStyle = "#0a0a10";
    c.beginPath();
    c.ellipse(-1 * s, -43 * s, 5.5 * s, 6.5 * s, 0, 0, 7);
    c.fill();
    glowEye(c, -3 * s, -44 * s, 1.3 * s, glow ? "#ffe08a" : "#e8e2d4");
    glowEye(c, 1.5 * s, -44 * s, 1.3 * s, glow ? "#ffe08a" : "#e8e2d4");
    c.fillStyle = "#7a1a24";
    c.fillRect(-6 * s, -40 * s, 11 * s, 4 * s);
    c.strokeStyle = "#cfd6e3";
    c.lineWidth = 2.5 * s;
    [
      [12, -18, 24, -30],
      [-12, -18, -22, -28],
    ].forEach(([a, b, cc, d]) => {
      c.beginPath();
      c.moveTo(a * s, b * s);
      c.lineTo(cc * s, d * s);
      c.stroke();
    });
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

/** Zera as brasas ao trocar de batalha, para não herdar as do cenário anterior */
function resetEmbers() {
  EMB = [];
}

const ScribeGraphics = {
  paintBG,
  embers,
  resetEmbers,
  vignette,
  drawImp,
  drawWraith,
  drawDragon,
  drawArchDemon,
  drawHero,
  quantize,
  buf,
  outlineOnto,
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeGraphics = ScribeGraphics;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeGraphics;
}
})();
