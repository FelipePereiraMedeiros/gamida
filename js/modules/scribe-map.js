/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: mapas desenhados
 * ==========================================================================
 * Um mapa por livro: Livro I (do Éden ao Sinai, vindo da versão nova do jogo),
 * Livro II (do Jordão à Babilônia) e o Segundo Rolo (de Belém a Patmos).
 * Desenhado em canvas no mesmo estilo de 8 bits do resto do jogo.
 */

(function () {
const RM =
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- Livro I: do Éden ao Sinai (mapa desenhado da versão nova do jogo) ---------- */
function terrainBook1(c, W, H, t) {
  const X = (v) => v * W,
    Y = (v) => v * H,
    P_ = (a, col) => {
      c.fillStyle = col;
      c.beginPath();
      a.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))));
      c.fill();
    },
    L_ = (a, col, w) => {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.lineJoin = "round";
      c.beginPath();
      a.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))));
      c.stroke();
    };
  c.fillStyle = "#3e2731";
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = ["#733e39", "#262b44", "#3e2731"][i % 3];
    c.fillRect(rnd(i) * W, rnd(i + 300) * H, 4, 2);
  }
  /* crescente fértil: verde ao longo dos rios e da costa */
  const green = (pts, r, col) =>
    pts.forEach(([x, y], i) => {
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(X(x), Y(y), r * W * (1 + 0.2 * rnd(i)), r * W * 0.7, 0, 0, 7);
      c.fill();
    });
  const EU = [
      [0.5, 0.04],
      [0.55, 0.24],
      [0.68, 0.44],
      [0.8, 0.58],
      [0.92, 0.77],
    ],
    TI = [
      [0.66, 0.02],
      [0.74, 0.26],
      [0.84, 0.52],
      [0.93, 0.77],
    ],
    NI = [
      [0.1, 1],
      [0.115, 0.82],
      [0.09, 0.68],
      [0.1, 0.62],
    ],
    JO = [
      [0.345, 0.33],
      [0.35, 0.46],
      [0.345, 0.56],
    ];
  const along = (a) => {
    const o = [];
    for (let i = 0; i < a.length - 1; i++)
      for (let k = 0; k < 5; k++) o.push([a[i][0] + ((a[i + 1][0] - a[i][0]) * k) / 5, a[i][1] + ((a[i + 1][1] - a[i][1]) * k) / 5]);
    return o;
  };
  green([...along(EU), ...along(TI)], 0.055, "#193c3e");
  green([...along(JO), [0.33, 0.3], [0.36, 0.25], [0.42, 0.2], [0.48, 0.14], [0.3, 0.6], [0.31, 0.45]], 0.05, "#193c3e");
  green(along(NI), 0.035, "#193c3e");
  green([...along(EU), ...along(TI)], 0.03, "#265c42");
  green([...along(JO), [0.34, 0.3], [0.4, 0.21]], 0.028, "#265c42");
  green(along(NI), 0.02, "#265c42");
  green(
    [
      [0.88, 0.3],
      [0.86, 0.26],
    ],
    0.04,
    "#3e8948",
  );
  /* montanhas do norte e do Sinai */
  [
    [0.56, 0.07, 0.08],
    [0.62, 0.1, 0.1],
    [0.7, 0.07, 0.14],
    [0.77, 0.11, 0.1],
    [0.83, 0.07, 0.08],
    [0.9, 0.12, 0.09],
    [0.95, 0.2, 0.07],
    [0.27, 0.9, 0.06],
    [0.31, 0.87, 0.07],
  ].forEach(([x, y, s]) => {
    P_(
      [
        [x - s / 2, y + s * 0.8],
        [x, y - s * 0.5],
        [x + s / 2, y + s * 0.8],
      ],
      "#5a6988",
    );
    P_(
      [
        [x, y - s * 0.5],
        [x + s / 2, y + s * 0.8],
        [x + s * 0.12, y + s * 0.8],
      ],
      "#3a4466",
    );
    P_(
      [
        [x - s * 0.12, y - s * 0.18],
        [x, y - s * 0.5],
        [x + s * 0.12, y - s * 0.18],
      ],
      "#c0cbdc",
    );
  });
  /* mares */
  const seas = [
    [
      [0, 0],
      [0.3, 0],
      [0.275, 0.2],
      [0.255, 0.38],
      [0.21, 0.55],
      [0.1, 0.63],
      [0, 0.6],
    ],
    [
      [0.14, 1],
      [0.168, 0.84],
      [0.2, 0.88],
      [0.23, 1],
    ],
    [
      [0.31, 1],
      [0.335, 0.9],
      [0.36, 1],
    ],
    [
      [1, 0.76],
      [0.94, 0.79],
      [0.9, 0.9],
      [0.94, 1],
      [1, 1],
    ],
  ];
  seas.forEach((sx) => {
    P_(sx, "#124e89");
    L_(sx, "#e4a672", 3);
    L_(sx, "#0099db", 1.2);
  });
  P_(
    [
      [0, 0],
      [0.2, 0],
      [0.17, 0.2],
      [0.12, 0.4],
      [0, 0.45],
    ],
    "#0f2a55",
  );
  for (let i = 0; i < 34; i++) {
    const x = rnd(i + 40) * W * 0.25,
      y = rnd(i + 90) * H * 0.56;
    c.globalAlpha = 0.4 + 0.6 * Math.sin(t * 2 + i);
    c.fillStyle = "#2ce8f5";
    c.fillRect(x, y, 7, 1.5);
  }
  c.globalAlpha = 1;
  [EU, TI, NI].forEach((r) => {
    L_(r, "#124e89", 5);
    L_(r, "#0099db", 2.5);
  });
  L_(JO, "#0099db", 2);
  for (let i = 0; i < 14; i++) {
    const r = [EU, TI, NI][i % 3],
      u = ((t * 0.12 + i * 0.17) % 1) * (r.length - 1),
      k = Math.floor(u),
      f = u - k;
    c.fillStyle = "#ffffff";
    c.globalAlpha = 0.8;
    c.fillRect(X(r[k][0] + (r[k + 1][0] - r[k][0]) * f) - 1, Y(r[k][1] + (r[k + 1][1] - r[k][1]) * f) - 1, 2.5, 2.5);
  }
  c.globalAlpha = 1;
}

/* ================= Mapas do Gamida: Livro II e Segundo Rolo ================= */
/*
 * Muitos capítulos acontecem a poucos quilômetros uns dos outros (Jericó e as
 * planícies de Moabe; Getsêmani, a casa de Caifás e a fortaleza em Jerusalém).
 * Por isso a Terra Santa aparece ampliada, como nos mapas antigos de peregrinos,
 * e o resto do mundo em escala menor, separado por uma moldura.
 */
function mapTools(c, W, H) {
  const X = (v) => v * W;
  const Y = (v) => v * H;
  return {
    X, Y,
    P(a, col) {
      c.fillStyle = col;
      c.beginPath();
      a.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))));
      c.closePath();
      c.fill();
    },
    L(a, col, w) {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.beginPath();
      a.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))));
      c.stroke();
    },
    E(x, y, rx, ry, col) {
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(X(x), Y(y), rx * W, ry * H, 0, 0, 7);
      c.fill();
    },
  };
}

/** Chão de pergaminho escuro, com pontilhado */
function landBase(c, W, H, seed) {
  c.fillStyle = "#3e2731";
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = ["#733e39", "#262b44", "#3e2731"][i % 3];
    c.fillRect(rnd(i + seed) * W, rnd(i + seed + 300) * H, 4, 2);
  }
}

function sea(T, c, W, H, t, poly, seed) {
  T.P(poly, "#124e89");
  T.L([...poly, poly[0]], "#e4a672", 3);
  T.L([...poly, poly[0]], "#0099db", 1.2);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0;
  const h = Math.max(...ys) - y0;
  c.save();
  c.beginPath();
  poly.forEach(([x, y], i) => (i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H)));
  c.clip();
  for (let i = 0; i < 26; i++) {
    c.globalAlpha = 0.35 + 0.5 * Math.sin(t * 2 + i + seed);
    c.fillStyle = "#2ce8f5";
    c.fillRect((x0 + rnd(i + seed) * w) * W, (y0 + rnd(i + seed + 50) * h) * H, 7, 1.5);
  }
  c.restore();
  c.globalAlpha = 1;
}

function river(T, c, W, H, t, pts, seed) {
  T.L(pts, "#124e89", 5);
  T.L(pts, "#0099db", 2.5);
  for (let i = 0; i < 4; i++) {
    const u = ((t * 0.12 + i * 0.25 + seed) % 1) * (pts.length - 1);
    const k = Math.floor(u);
    const f = u - k;
    c.fillStyle = "#ffffff";
    c.globalAlpha = 0.8;
    c.fillRect(T.X(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f) - 1, T.Y(pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f) - 1, 2.5, 2.5);
  }
  c.globalAlpha = 1;
}

function greens(T, pts, r, col) {
  pts.forEach(([x, y], i) => T.E(x, y, r * (1 + 0.2 * rnd(i)), r * 1.4, col));
}

function mountains(T, list) {
  list.forEach(([x, y, s]) => {
    T.P([[x - s / 2, y + s * 0.8], [x, y - s * 0.5], [x + s / 2, y + s * 0.8]], "#5a6988");
    T.P([[x, y - s * 0.5], [x + s / 2, y + s * 0.8], [x + s * 0.12, y + s * 0.8]], "#3a4466");
    T.P([[x - s * 0.12, y - s * 0.18], [x, y - s * 0.5], [x + s * 0.12, y - s * 0.18]], "#c0cbdc");
  });
}

function dunes(c, W, H, x0, y0, x1, y1, seed) {
  for (let i = 0; i < 40; i++) {
    const x = (x0 + rnd(i + seed) * (x1 - x0)) * W;
    const y = (y0 + rnd(i + seed + 70) * (y1 - y0)) * H;
    c.fillStyle = i % 2 ? "#be4a2f" : "#b86f50";
    c.globalAlpha = 0.55;
    c.fillRect(x, y, 10, 2);
    c.fillRect(x + 3, y - 2, 4, 2);
  }
  c.globalAlpha = 1;
}

/** Moldura da parte ampliada, com a legenda */
function insetFrame(c, W, H, x0, x1) {
  c.fillStyle = "#0b0612";
  c.fillRect(x0 * W - 3, 0, 6, H);
  c.fillStyle = "#733e39";
  c.fillRect(x0 * W - 1, 0, 2, H);
  for (let y = 8; y < H; y += 22) {
    c.fillStyle = "#feae34";
    c.fillRect(x0 * W - 2, y, 4, 4);
  }
  void x1;
}

/* ---------- Livro II: do Jordão à Babilônia ---------- */
function terrainBook2(c, W, H, t) {
  const T = mapTools(c, W, H);
  landBase(c, W, H, 900);
  // Canaã ampliada (à esquerda) e o caminho até a Mesopotâmia (à direita)
  greens(T, [[0.3, 0.2], [0.25, 0.3], [0.28, 0.45], [0.2, 0.55], [0.35, 0.1], [0.45, 0.25], [0.5, 0.4], [0.2, 0.15]], 0.06, "#193c3e");
  greens(T, [[0.3, 0.2], [0.27, 0.32], [0.36, 0.16], [0.47, 0.3]], 0.035, "#265c42");
  dunes(c, W, H, 0.55, 0.62, 0.66, 0.98, 11);
  dunes(c, W, H, 0.7, 0.35, 0.82, 0.6, 31);
  greens(T, [[0.84, 0.1], [0.86, 0.3], [0.88, 0.5], [0.92, 0.7], [0.95, 0.85], [0.78, 0.2], [0.82, 0.45]], 0.04, "#193c3e");
  mountains(T, [[0.17, 0.2, 0.05], [0.24, 0.42, 0.05], [0.3, 0.52, 0.045], [0.5, 0.66, 0.05], [0.54, 0.74, 0.05], [0.68, 0.06, 0.06], [0.76, 0.05, 0.05], [0.96, 0.08, 0.05]]);
  // Mar Grande (Mediterrâneo)
  sea(T, c, W, H, t, [[0, 0], [0.13, 0], [0.12, 0.13], [0.09, 0.2], [0.11, 0.24], [0.1, 0.42], [0.07, 0.62], [0.045, 0.82], [0.03, 1], [0, 1]], 3);
  // Mar da Galileia e Mar Morto
  sea(T, c, W, H, t, [[0.405, 0.06], [0.43, 0.05], [0.44, 0.1], [0.425, 0.14], [0.405, 0.12]], 7);
  sea(T, c, W, H, t, [[0.4, 0.6], [0.445, 0.59], [0.455, 0.72], [0.44, 0.9], [0.41, 0.88], [0.405, 0.72]], 9);
  river(T, c, W, H, t, [[0.42, 0.0], [0.415, 0.05]], 0.1);
  river(T, c, W, H, t, [[0.425, 0.14], [0.43, 0.22], [0.415, 0.32], [0.43, 0.42], [0.415, 0.52], [0.42, 0.6]], 0.3);
  // Ribeiro de Quisom, que desce para o mar ao pé do Carmelo
  river(T, c, W, H, t, [[0.31, 0.24], [0.24, 0.22], [0.16, 0.2], [0.11, 0.19]], 0.6);
  // Orontes, Tigre e Eufrates
  river(T, c, W, H, t, [[0.7, 0.36], [0.69, 0.22], [0.71, 0.1], [0.69, 0.0]], 0.2);
  river(T, c, W, H, t, [[0.8, 0.0], [0.86, 0.14], [0.88, 0.32], [0.92, 0.5], [0.97, 0.72], [1, 0.8]], 0.4);
  river(T, c, W, H, t, [[0.74, 0.0], [0.77, 0.2], [0.82, 0.4], [0.86, 0.6], [0.9, 0.74], [0.96, 0.84], [1, 0.86]], 0.8);
  insetFrame(c, W, H, 0.62, 1);
}

/* ---------- Segundo Rolo: de Belém a Patmos ---------- */
function terrainRolo2(c, W, H, t) {
  const T = mapTools(c, W, H);
  landBase(c, W, H, 1200);
  // Mediterrâneo inteiro (à esquerda), com as costas da Europa, da Ásia Menor e da África
  sea(T, c, W, H, t, [[0, 0.3], [0.06, 0.22], [0.1, 0.12], [0.15, 0.02], [0.2, 0.0], [0.18, 0.1], [0.21, 0.2], [0.23, 0.26], [0.27, 0.36], [0.3, 0.22], [0.33, 0.14], [0.36, 0.16], [0.4, 0.2], [0.44, 0.32], [0.5, 0.4], [0.56, 0.38], [0.6, 0.42], [0.6, 0.86], [0.4, 0.8], [0.25, 0.84], [0.1, 0.78], [0, 0.82]], 2);
  // Itália, Sicília, Grécia, Creta e Chipre
  T.P([[0, 0.0], [0.08, 0.0], [0.07, 0.12], [0.04, 0.22], [0.02, 0.3], [0, 0.32]], "#3e2731");
  T.P([[0.02, 0.36], [0.08, 0.35], [0.07, 0.41], [0.03, 0.42]], "#3e2731");
  T.P([[0.04, 0.47], [0.055, 0.465], [0.056, 0.485], [0.042, 0.49]], "#3e2731");
  T.P([[0.24, 0.42], [0.33, 0.41], [0.34, 0.44], [0.25, 0.46]], "#3e2731");
  T.P([[0.45, 0.5], [0.53, 0.47], [0.55, 0.5], [0.49, 0.54], [0.45, 0.53]], "#3e2731");
  [[0.31, 0.3], [0.33, 0.27], [0.36, 0.32], [0.3, 0.38], [0.38, 0.36]].forEach(([x, y], i) => T.E(x, y, 0.006 + 0.003 * (i % 2), 0.012, "#3e2731"));
  greens(T, [[0.03, 0.08], [0.2, 0.26], [0.28, 0.08], [0.45, 0.25], [0.5, 0.48], [0.04, 0.38]], 0.03, "#265c42");
  mountains(T, [[0.2, 0.12, 0.05], [0.25, 0.18, 0.04], [0.48, 0.1, 0.05], [0.55, 0.16, 0.05], [0.4, 0.06, 0.04]]);
  dunes(c, W, H, 0.05, 0.86, 0.58, 0.98, 41);
  // Terra Santa ampliada (à direita)
  T.P([[0.62, 0], [1, 0], [1, 1], [0.62, 1]], "#3e2731");
  sea(T, c, W, H, t, [[0.62, 0], [0.7, 0], [0.69, 0.2], [0.665, 0.3], [0.68, 0.34], [0.665, 0.5], [0.65, 0.7], [0.635, 1], [0.62, 1]], 5);
  greens(T, [[0.8, 0.12], [0.78, 0.3], [0.76, 0.42], [0.74, 0.55], [0.88, 0.2], [0.94, 0.28]], 0.035, "#193c3e");
  greens(T, [[0.8, 0.14], [0.86, 0.12], [0.77, 0.32]], 0.02, "#265c42");
  mountains(T, [[0.87, 0.02, 0.05], [0.72, 0.22, 0.035], [0.74, 0.5, 0.035], [0.8, 0.56, 0.035], [0.97, 0.6, 0.04]]);
  dunes(c, W, H, 0.82, 0.78, 0.98, 0.98, 61);
  sea(T, c, W, H, t, [[0.84, 0.17], [0.875, 0.16], [0.885, 0.22], [0.87, 0.27], [0.845, 0.25]], 8);
  sea(T, c, W, H, t, [[0.86, 0.68], [0.9, 0.67], [0.905, 0.82], [0.89, 0.97], [0.865, 0.95], [0.86, 0.8]], 12);
  river(T, c, W, H, t, [[0.87, 0.06], [0.865, 0.16]], 0.2);
  river(T, c, W, H, t, [[0.87, 0.27], [0.88, 0.36], [0.865, 0.46], [0.88, 0.56], [0.87, 0.68]], 0.5);
  insetFrame(c, W, H, 0.62, 1);
}

/* ---------- rota, rosa dos ventos e moldura (todos os mapas) ---------- */
function drawRoute(c, W, H, t, pts, done) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const mxp = (x0 + x1) / 2 + (y1 - y0) * 0.12;
    const myp = (y0 + y1) / 2 - (x1 - x0) * 0.12;
    const n = Math.max(5, Math.round(Math.hypot((x1 - x0) * W, (y1 - y0) * H) / 8));
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mxp + u * u * x1;
      const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * myp + u * u * y1;
      c.fillStyle = "#0b0612";
      c.fillRect(x * W - 2.5, y * H - 2.5, 5, 5);
      c.fillStyle = done[i] ? "#feae34" : "#8b9bb4";
      c.globalAlpha = done[i] ? 0.65 + 0.35 * Math.sin(t * 4 - k * 0.6 - i) : 0.8;
      c.fillRect(x * W - 1.5, y * H - 1.5, 3, 3);
      c.globalAlpha = 1;
    }
  }
}

function drawCompassFrame(c, W, H, cxF, cyF) {
  const cx = cxF * W;
  const cy = cyF * H;
  c.fillStyle = "#ead4aa";
  c.beginPath();
  c.moveTo(cx, cy - 16);
  c.lineTo(cx + 4, cy);
  c.lineTo(cx, cy + 16);
  c.lineTo(cx - 4, cy);
  c.fill();
  c.beginPath();
  c.moveTo(cx - 16, cy);
  c.lineTo(cx, cy - 4);
  c.lineTo(cx + 16, cy);
  c.lineTo(cx, cy + 4);
  c.fill();
  c.fillStyle = "#a22633";
  c.beginPath();
  c.moveTo(cx, cy - 16);
  c.lineTo(cx + 4, cy);
  c.lineTo(cx - 4, cy);
  c.fill();
  c.strokeStyle = "#0b0612";
  c.lineWidth = 8;
  c.strokeRect(0, 0, W, H);
  c.strokeStyle = "#733e39";
  c.lineWidth = 3;
  c.strokeRect(5, 5, W - 10, H - 10);
  c.fillStyle = "#feae34";
  [[5, 5], [W - 11, 5], [5, H - 11], [W - 11, H - 11]].forEach(([a, b]) => c.fillRect(a, b, 6, 6));
}

/* ---------- ícones dos lugares ---------- */
function placeIcon(c, kind, x, y, t, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const T = (p, col) => {
    c.fillStyle = col;
    c.beginPath();
    for (let k = 0; k < p.length; k += 2) k ? c.lineTo(p[k], p[k + 1]) : c.moveTo(p[k], p[k + 1]);
    c.fill();
  };
  const R = (a, b, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(a, b, w, h);
  };
  const C = (a, b, r, col) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(a, b, r, 0, 7);
    c.fill();
  };
  const flameAt = (a, b) => {
    C(a, b, 2.6 + Math.sin(t * 8), "#f77622");
    C(a, b - 1.6 - Math.abs(Math.sin(t * 9)) * 1.6, 1.5, "#fee761");
  };
  const tent = (a, col, dark) => {
    T([a - 9, 0, a, -14, a + 9, 0], col);
    T([a, -14, a + 9, 0, a + 3, 0], dark);
    R(a - 1, -6, 2, 6, "#181425");
  };
  switch (kind) {
    case "garden":
      R(-2, -10, 4, 10, "#733e39");
      C(0, -15, 9, "#265c42");
      C(-6, -11, 6, "#3e8948");
      C(6, -11, 6, "#3e8948");
      C(3, -14, 1.8, "#e43b44");
      C(-4, -10, 1.8, "#e43b44");
      break;
    case "ark":
      T([-16, 0, 0, -22, 16, 0], "#5a6988");
      T([-5, -15, 0, -22, 5, -15], "#ffffff");
      R(-7, -27, 14, 5, "#733e39");
      R(-4, -31, 8, 4, "#b86f50");
      break;
    case "ziggurat":
      for (let k = 0; k < 5; k++) R(-11 + k * 2, -5 - k * 5, 22 - k * 4, 5, k % 2 ? "#733e39" : "#b86f50");
      R(-1, -28, 2, 4, "#3e2731");
      break;
    case "ur":
      R(-14, -6, 28, 6, "#68386c");
      R(-10, -12, 20, 6, "#b55088");
      R(-6, -18, 12, 6, "#68386c");
      R(-1, -18, 2, 18, "#feae34");
      break;
    case "well":
      R(-8, -7, 16, 7, "#8b9bb4");
      R(-6, -5, 12, 3, "#124e89");
      R(-8, -18, 2, 11, "#733e39");
      R(6, -18, 2, 11, "#733e39");
      T([-11, -17, 0, -24, 11, -17], "#733e39");
      break;
    case "oak":
      C(-7, 0, 9, "#265c42");
      C(8, 0, 11, "#3e8948");
      R(-12, 0, 34, 6, "#262b44");
      R(6, -18, 3, 10, "#733e39");
      C(7.5, -20, 6, "#193c3e");
      break;
    case "ladder":
      R(-12, -8, 7, 8, "#8b9bb4");
      c.strokeStyle = "#feae34";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-2, 0);
      c.lineTo(8, -26);
      c.moveTo(4, 0);
      c.lineTo(14, -26);
      for (let k = 0; k < 5; k++) {
        c.moveTo(0 + k * 2, -4 - k * 5);
        c.lineTo(6 + k * 2, -4 - k * 5);
      }
      c.stroke();
      break;
    case "tents":
      T([-15, 0, -6, -15, 3, 0], "#733e39");
      T([0, 0, 9, -18, 18, 0], "#b86f50");
      R(8, -7, 2, 7, "#181425");
      flameAt(-2, -2);
      break;
    case "scrolltent":
      // As tendas de Hebrom e o rolo rasgado no chão (prólogo)
      tent(-4, "#b86f50", "#733e39");
      R(4, -4, 12, 4, "#ead4aa");
      T([16, -4, 19, -6, 18, -1, 16, 0], "#ead4aa");
      R(6, -3, 6, 0.8, "#733e39");
      break;
    case "pyramids":
      T([-18, 0, -6, -20, 6, 0], "#feae34");
      T([-6, -20, 6, 0, 0, 0], "#d77643");
      T([2, 0, 11, -14, 20, 0], "#e4a672");
      break;
    case "palm":
      R(-10, -3, 20, 4, "#0099db");
      c.strokeStyle = "#733e39";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(4, 0);
      c.quadraticCurveTo(7, -12, 4, -20);
      c.stroke();
      for (let k = 0; k < 5; k++) {
        c.fillStyle = "#3e8948";
        c.beginPath();
        c.ellipse(4 + Math.cos(-2.6 + k * 0.55) * 7, -20 + Math.sin(-2.6 + k * 0.55) * 4, 7, 2, -2.6 + k * 0.55, 0, 7);
        c.fill();
      }
      break;
    case "sinai":
      T([-17, 0, -2, -24, 14, 0], "#3e2731");
      T([-2, -24, 14, 0, 4, 0], "#181425");
      C(-2, -25, 4 + Math.sin(t * 8), "#e43b44");
      C(-2, -27, 2.4, "#fee761");
      C(-6 + Math.sin(t * 3) * 2, -32, 2, "#f77622");
      break;
    case "camp":
      tent(-7, "#ead4aa", "#c0cbdc");
      tent(7, "#e4a672", "#b86f50");
      break;
    case "walls":
    case "fortress":
      R(-14, -14, 28, 14, kind === "walls" ? "#b86f50" : "#8b9bb4");
      for (let k = 0; k < 5; k++) R(-14 + k * 6, -18, 4, 4, kind === "walls" ? "#b86f50" : "#8b9bb4");
      R(-3, -8, 6, 8, "#181425");
      R(-14, -9, 28, 1, kind === "walls" ? "#733e39" : "#5a6988");
      break;
    case "ruin":
      [[-10, -4], [-3, -4], [4, -4], [-6, -9], [1, -9], [-2, -14]].forEach(([a, b], k) => R(a, b, 6, 5, k % 2 ? "#8b9bb4" : "#5a6988"));
      break;
    case "river":
      R(-14, -4, 28, 4, "#0099db");
      R(-10, -2, 6, 1, "#ffffff");
      // carro de ferro quebrado na margem
      C(6, -8, 4, "#5a6988");
      C(6, -8, 1.5, "#181425");
      R(-4, -13, 10, 4, "#3a4466");
      break;
    case "temple":
      T([-14, -16, 0, -24, 14, -16], "#c0cbdc");
      R(-12, -16, 24, 2, "#8b9bb4");
      for (let k = 0; k < 4; k++) R(-11 + k * 7, -14, 3, 12, "#c0cbdc");
      R(-14, -2, 28, 2, "#8b9bb4");
      break;
    case "column":
      R(-12, -2, 24, 2, "#8b9bb4");
      R(-8, -20, 4, 18, "#c0cbdc");
      R(4, -14, 4, 12, "#c0cbdc");
      R(-10, -22, 8, 2, "#8b9bb4");
      break;
    case "altar":
      for (let k = 0; k < 3; k++) R(-9 + k * 1, -4 - k * 4, 18 - k * 2, 4, k % 2 ? "#5a6988" : "#8b9bb4");
      flameAt(0, -16);
      C(0, -22, 2 + Math.sin(t * 6), "#e43b44");
      break;
    case "fish":
      R(-16, -3, 32, 3, "#0099db");
      c.fillStyle = "#5a6988";
      c.beginPath();
      c.ellipse(-2, -9, 11, 6, 0, 0, 7);
      c.fill();
      T([8, -9, 15, -15, 15, -3], "#3a4466");
      C(-8, -10, 1.4, "#ffffff");
      break;
    case "palace":
      R(-12, -14, 24, 14, "#68386c");
      R(-14, -16, 28, 3, "#feae34");
      R(-4, -24, 8, 8, "#68386c");
      T([-5, -24, 0, -30, 5, -24], "#feae34");
      R(-2, -8, 4, 8, "#181425");
      R(6, -12, 3, 3, "#fee761");
      break;
    case "battle":
      c.strokeStyle = "#c0cbdc";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-10, -2);
      c.lineTo(10, -22);
      c.moveTo(10, -2);
      c.lineTo(-10, -22);
      c.stroke();
      R(-6, -9, 12, 2, "#feae34");
      C(0, -12, 2 + Math.sin(t * 5), "#e43b44");
      break;
    case "fire":
      R(-12, -10, 24, 10, "#5a6988");
      for (let k = 0; k < 3; k++) {
        C(-8 + k * 8, -12, 3 + Math.sin(t * 8 + k), "#f77622");
        C(-8 + k * 8, -15 - Math.abs(Math.sin(t * 7 + k)) * 2, 2, "#fee761");
      }
      break;
    case "willow":
      R(-14, -3, 28, 3, "#0099db");
      R(-1, -18, 3, 15, "#733e39");
      for (let k = 0; k < 6; k++) {
        c.strokeStyle = "#3e8948";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(0, -18);
        c.quadraticCurveTo(-10 + k * 4, -22, -11 + k * 4.4, -6);
        c.stroke();
      }
      // a harpa pendurada (Sl 137.2)
      c.strokeStyle = "#feae34";
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(7, -12, 4, -1.5, 1.5);
      c.stroke();
      break;
    case "star":
      R(-10, -8, 20, 8, "#b86f50");
      R(-3, -5, 6, 5, "#181425");
      T([-12, -8, 0, -14, 12, -8], "#733e39");
      C(0, -26, 3 + Math.sin(t * 4), "#fee761");
      R(-0.5, -32, 1, 12, "#fee761");
      R(-6, -26.5, 12, 1, "#fee761");
      break;
    case "desert":
      T([-16, 0, -6, -8, 4, 0], "#d77643");
      T([0, 0, 9, -11, 18, 0], "#e4a672");
      R(-10, -12, 2, 8, "#3e8948");
      R(-12, -9, 6, 1.6, "#3e8948");
      break;
    case "house":
      R(-10, -12, 20, 12, "#b86f50");
      R(-12, -14, 24, 3, "#733e39");
      R(-3, -8, 6, 8, "#181425");
      R(4, -10, 3, 3, "#fee761");
      break;
    case "boat":
      R(-16, -3, 32, 3, "#0099db");
      T([-12, -7, 12, -7, 8, -2, -8, -2], "#733e39");
      R(-1, -24, 2, 17, "#3e2731");
      T([1, -23, 11 + Math.sin(t * 3), -12, 1, -9], "#ead4aa");
      break;
    case "tomb":
      T([-14, 0, -6, -16, 10, -16, 16, 0], "#5a6988");
      C(0, -6, 5, "#181425");
      C(9, -4, 4, "#8b9bb4");
      break;
    case "mountain":
      T([-16, 0, -2, -24, 14, 0], "#5a6988");
      T([-6, -17, -2, -24, 2, -17], "#ffffff");
      R(-12, -2, 24, 2, "#0099db");
      break;
    case "olive":
      R(-1, -12, 3, 12, "#733e39");
      C(-5, -15, 6, "#5a6988");
      C(5, -14, 6, "#8b9bb4");
      C(0, -19, 5, "#3a4466");
      C(-6, -14, 1, "#ead4aa");
      C(4, -17, 1, "#ead4aa");
      break;
    case "storm":
      R(-16, -3, 32, 3, "#124e89");
      C(-6, -20, 7, "#3a4466");
      C(4, -22, 8, "#262b44");
      if (t % 2.2 < 0.25) {
        c.strokeStyle = "#fee761";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(2, -16);
        c.lineTo(-2, -9);
        c.lineTo(3, -8);
        c.lineTo(-1, -2);
        c.stroke();
      }
      T([-8, -4, 8, -4, 4, -1, -6, -1], "#733e39");
      break;
    case "viper":
      R(-12, -3, 24, 3, "#b86f50");
      C(-4, -5, 4, "#f77622");
      C(-4, -7, 2, "#fee761");
      c.strokeStyle = "#3e8948";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(4, -2);
      c.quadraticCurveTo(12, -6, 6, -10);
      c.quadraticCurveTo(0, -14, 8, -17);
      c.stroke();
      break;
    case "abyss":
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = ["#68386c", "#262b44", "#b55088"][k];
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, -8, 14 - k * 4, 6 - k * 1.6, (RM ? 0 : t) + k, 0, 5);
        c.stroke();
      }
      C(0, -8, 2.4, "#0b0612");
      break;
    case "scroll":
      R(-4, -18, 18, 14, "#ead4aa");
      C(-4, -11, 3, "#e4a672");
      C(14, -11, 3, "#e4a672");
      for (let k = 0; k < 3; k++) R(-1, -15 + k * 3.4, 12, 1, "#733e39");
      C(5, -26, 2 + Math.sin(t * 4), "#fee761");
      break;
    default:
      C(0, -8, 5, "#feae34");
  }
  c.restore();
}

/* ================= Os mapas de cada livro ================= */
/*
 * places: capítulo → [x, y, ícone], em frações da largura e da altura do mapa.
 * As posições seguem a geografia, mas sem escala (ver a nota no início).
 */
const MAPS = {
  hebrew: {
    1: {
      terrain: terrainBook1,
      compass: [0.07, 0.13],
      iconSide: true,
      labels: [["Grande Mar", 8, 30], ["Mesopotâmia", 66, 40], ["Canaã", 40, 47], ["Egito", 4, 86]],
      places: {
        kelley_01: [0.25, 0.66, "scrolltent"],
        kelley_03: [0.88, 0.3, "garden"],
        kelley_05: [0.7, 0.13, "ark"],
        kelley_06: [0.8, 0.52, "ziggurat"],
        kelley_07: [0.9, 0.68, "ur"],
        kelley_08: [0.52, 0.2, "well"],
        kelley_09: [0.36, 0.4, "oak"],
        kelley_10: [0.35, 0.5, "ladder"],
        kelley_11: [0.34, 0.61, "tents"],
        kelley_12: [0.12, 0.74, "pyramids"],
        kelley_13: [0.21, 0.84, "palm"],
        kelley_14: [0.29, 0.93, "sinai"],
      },
    },
    2: {
      terrain: terrainBook2,
      compass: [0.58, 0.9],
      labels: [["Grande Mar", 1, 50], ["Canaã", 20, 94], ["Moabe", 47, 90], ["Síria", 66, 22], ["Assíria", 80, 30], ["Babilônia", 82, 88], ["Deserto", 68, 66]],
      places: {
        kelley_15: [0.51, 0.5, "camp"],
        kelley_16: [0.36, 0.52, "walls"],
        kelley_17: [0.27, 0.45, "ruin"],
        kelley_18: [0.2, 0.27, "river"],
        kelley_19: [0.08, 0.7, "temple"],
        kelley_20: [0.12, 0.13, "altar"],
        kelley_21: [0.87, 0.16, "fish"],
        kelley_22: [0.52, 0.29, "fortress"],
        kelley_23: [0.38, 0.2, "palace"],
        kelley_24: [0.23, 0.37, "walls"],
        licao_25: [0.53, 0.78, "fortress"],
        licao_26: [0.17, 0.76, "fortress"],
        licao_27: [0.26, 0.6, "walls"],
        licao_28: [0.29, 0.13, "battle"],
        licao_29: [0.7, 0.42, "camp"],
        licao_30: [0.32, 0.69, "fire"],
        licao_31: [0.93, 0.64, "willow"],
      },
    },
  },
  greek: {
    1: {
      terrain: terrainRolo2,
      compass: [0.56, 0.9],
      labels: [["Macedônia", 16, 3], ["Ásia", 44, 9], ["Grande Mar", 22, 62], ["Terra Santa", 74, 2], ["Judeia", 66, 92], ["Galileia", 84, 40]],
      places: {
        bergmann_01: [0.8, 0.85, "star"],
        bergmann_02: [0.94, 0.9, "desert"],
        bergmann_03: [0.8, 0.13, "house"],
        bergmann_04: [0.86, 0.22, "boat"],
        bergmann_05: [0.95, 0.27, "tomb"],
        bergmann_06: [0.92, 0.1, "mountain"],
        bergmann_07: [0.94, 0.62, "tomb"],
        bergmann_08: [0.73, 0.6, "palace"],
        bergmann_09: [0.86, 0.56, "olive"],
        bergmann_10: [0.77, 0.43, "well"],
        bergmann_11: [0.8, 0.68, "palace"],
        bergmann_12: [0.47, 0.5, "column"],
        bergmann_13: [0.3, 0.11, "walls"],
        bergmann_14: [0.24, 0.31, "column"],
        bergmann_15: [0.43, 0.24, "temple"],
        bergmann_16: [0.71, 0.76, "fortress"],
        bergmann_17: [0.7, 0.36, "palace"],
        bergmann_18: [0.16, 0.56, "storm"],
        bergmann_19: [0.05, 0.47, "viper"],
        bergmann_20: [0.33, 0.68, "abyss"],
        bergmann_21: [0.76, 0.27, "battle"],
        bergmann_22: [0.37, 0.37, "scroll"],
      },
    },
  },
};

/** Mapa do livro (ou null se o livro não tem mapa) */
function mapFor(language, book) {
  const lang = language === "greek" ? "greek" : "hebrew";
  return (MAPS[lang] && MAPS[lang][book]) || null;
}

/**
 * Desenha um quadro do mapa.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} opts { language, book, chapterIds (na ordem da campanha), done (Set), selId, hero(ctx, x, gy, scale, t) }
 */
function renderMap(canvas, opts) {
  const g = typeof window !== "undefined" ? window.ScribeGraphics : null;
  const def = mapFor(opts.language, opts.book);
  if (!g || !def || !canvas) return;
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
  const low = g.buf("map", lw, lh);
  const lc = low.getContext("2d");
  const spr = g.buf("map-spr", lw, lh);
  const sc = spr.getContext("2d");
  lc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.clearRect(0, 0, lw, lh);
  sc.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
  def.terrain(lc, W, H, t);
  const ids = opts.chapterIds.filter((id) => def.places[id]);
  drawRoute(lc, W, H, t, ids.map((id) => def.places[id]), ids.map((id) => opts.done.has(id)));
  drawCompassFrame(lc, W, H, def.compass[0], def.compass[1]);
  ids.forEach((id) => {
    const [x, y, kind] = def.places[id];
    if (def.iconSide) placeIcon(sc, kind, x * W + (x > 0.8 ? -34 : 34), y * H + 12, t, 1.35);
    else placeIcon(sc, kind, x * W, y * H - 15, t, 0.85);
  });
  const sel = def.places[opts.selId];
  if (sel && opts.hero) {
    const [x, y] = sel;
    const side = x > 0.8 ? -1 : 1;
    if (def.iconSide) opts.hero(sc, x * W + side * 34, y * H + 18, 0.8, t);
    else opts.hero(sc, x * W + side * 24, y * H + 16, 0.55, t);
  }
  lc.setTransform(1, 0, 0, 1, 0, 0);
  g.outlineOnto(lc, spr, "#0b0612");
  g.quantize(lc, lw, lh);
  const c = canvas.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  c.drawImage(low, 0, 0, lw, lh, 0, 0, lw * PX * dpr, lh * PX * dpr);
}

const ScribeMap = { MAPS, mapFor, renderMap, placeIcon };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeMap = ScribeMap;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeMap;
}
})();
