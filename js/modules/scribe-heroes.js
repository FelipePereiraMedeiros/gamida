/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: heróis do Segundo Rolo (grego)
 * ==========================================================================
 * Pescador (Mt 4.18), Centurião (At 10.1) e Fazedor de tendas (At 18.3),
 * desenhados no mesmo estilo dos heróis do hebraico: formas simples em
 * coordenadas de "pixel" que depois passam pela paleta de 32 cores.
 * Cada relíquia do Segundo Rolo aparece no corpo do herói quando conquistada.
 */

(function () {
const { RM, rnd } = (typeof window !== "undefined" && window.ScribeCommon) || require("./scribe-common.js");

/**
 * Desenha um herói grego
 * @param {CanvasRenderingContext2D} c
 * @param {number} x posição horizontal
 * @param {number} gy linha do chão
 * @param {number} s escala
 * @param {number} t tempo em segundos
 * @param {boolean} flash herói atingido
 * @param {"mago"|"cavaleiro"|"assassino"} cls
 * @param {Set<string>} [relics] relíquias conquistadas
 */
function drawGreekHero(c, x, gy, s, t, flash, cls, relics) {
  const has = (id) => !!relics && relics.has(id);
  const wv = RM ? 0 : Math.sin(t * 2.2);
  const br = RM ? 0 : Math.sin(t * 2.4) * 0.5;
  const fl = RM ? 0 : Math.sin(t * 6) * 3;
  const blink = !RM && t % 4.3 < 0.13;
  const glow = RM ? 0.6 : 0.45 + 0.3 * Math.sin(t * 3);
  c.save();
  c.translate(x, gy);
  c.fillStyle = "rgba(0,0,0,.45)";
  c.beginPath();
  c.ellipse(0, 1, 17 * s, 3.5 * s, 0, 0, 7);
  c.fill();
  const F = (col) => (flash ? "#ff9a8f" : col);
  const skin = "#c28569";
  const skinD = "#b86f50";
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
  const halo = (a, b, r, col) => {
    c.globalAlpha = glow * 0.5;
    C(a, b, r, col);
    c.globalAlpha = 1;
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
  const sandals = (col) => {
    R(-7.5, -1.8, 6.4, 1.8, col);
    R(1.6, -1.8, 7.6, 1.8, col);
    L([-6.6, -5, -2, -1.8], col, 0.6);
    L([2.4, -5, 7, -1.8], col, 0.6);
  };

  if (cls === "mago") {
    /* ---------- Pescador (Mt 4.18) ---------- */
    // Rede às costas: com a relíquia, cheia de peixes (Jo 21.6.11)
    const full = has("rede_direita");
    c.save();
    c.globalAlpha = 1;
    P([-6, -36, -17 + wv, -26, -19 + wv * 1.2, -8, -9, -6], full ? "#5a6988" : "#3a4466");
    c.strokeStyle = F("#8b9bb4");
    c.lineWidth = 0.6 * s;
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.moveTo((-7 - k * 2) * s, -35 * s);
      c.lineTo((-12 - k * 1.2 + wv) * s, -7 * s);
      c.stroke();
      c.beginPath();
      c.moveTo(-6 * s, (-32 + k * 4.4) * s);
      c.lineTo((-18 + wv) * s, (-26 + k * 3.4) * s);
      c.stroke();
    }
    if (full) {
      for (let k = 0; k < 5; k++) {
        const fx = -16 + rnd(k) * 8 + wv;
        const fy = -24 + k * 3.6;
        P([fx - 2.6, fy, fx + 1.4, fy - 1.3, fx + 2.6, fy, fx + 1.4, fy + 1.3], k % 2 ? "#c0cbdc" : "#8b9bb4");
        P([fx + 2.6, fy, fx + 4, fy - 1.3, fx + 4, fy + 1.3], "#5a6988");
      }
      halo(-13, -20, 9, "#2ce8f5");
    }
    c.restore();
    // Pernas nuas e sandálias
    R(-6, -12, 4.6, 12, skin);
    R(1.8, -12, 4.6, 12, skin);
    R(-6, -12, 1.4, 12, skinD);
    R(1.8, -12, 1.4, 12, skinD);
    sandals("#733e39");
    c.translate(0, br * s);
    // Túnica curta, mangas arregaçadas
    P([-10.5, -10, 10.5, -10, 9, -24, 7.4, -36, -7.4, -36, -9, -24], "#4b5d7a");
    P([-10.5, -10, -5, -10, -6, -24, -7.4, -36, -9, -24], "#3a4466");
    P([6, -10, 10.5, -10, 9, -24, 7.4, -32], "#5a6988");
    L([-9, -12, 9, -12], "#262b44", 0.8);
    // Cinto de corda
    R(-9.4, -22, 18.8, 2.2, "#b86f50");
    L([-2, -20, -3.4, -15, -2.2, -13], "#b86f50", 0.8);
    // Peixe com a moeda (Mt 17.27)
    if (has("moeda_peixe")) {
      P([3, -19.6, 6.6, -16, 8.4, -11, 5.4, -12.6, 2.4, -17], "#8b9bb4");
      P([5.4, -12.6, 8.4, -11, 7.2, -8.6], "#5a6988");
      C(3.6, -19, 1.5, "#feae34");
      c.globalAlpha = glow;
      C(3.6, -19, 2.6, "#fee761");
      c.globalAlpha = 1;
    }
    // O livrinho preso ao peito (Ap 10.9-10)
    if (has("livrinho")) {
      halo(-2.6, -29, 5.6, "#fee761");
      R(-5.4, -32, 5.6, 6.4, "#a22633");
      R(-5, -31.6, 4.8, 5.6, "#ead4aa");
      L([-2.6, -31.6, -2.6, -26.2], "#733e39", 0.5);
      L([-7, -36, -2.6, -32], "#3e2731", 0.6);
    }
    // Braço de trás segura a rede
    P([-7, -35, -11.6, -31, -12.2, -24, -9, -23.6], skin);
    C(-10.8, -23, 2, skinD);
    // Cabeça: barba cheia e lenço amarrado
    face(0.5, -42.6);
    P([-4.6, -41, 6.4, -40.4, 5.6, -35, 1.6, -33.6, -2.6, -35, -4.6, -38], "#3e2731");
    R(1.6, -40.6, 4.6, 1.1, "#181425");
    P([-6.6, -44, -5.4, -49.8, 0.6, -51.2, 5.8, -48.6, 6.6, -45.6, -1, -46.4], "#ead4aa");
    R(-6.8, -46.4, 13.4, 1.6, "#0099db");
    P([-6.6, -44, -9 + wv * 0.6, -37, -7.4 + wv * 0.6, -36.6, -5, -43], "#ead4aa");
    // Braço da frente e remo (ou mastro com vela: barco de Pedro, Lc 5.3)
    P([6, -35.4, 10, -34, 16.6, -29.6, 16.8, -26, 9.4, -27, 6, -29.4], skin);
    if (has("barco_pedro")) {
      L([19, 3, 19, -66], "#733e39", 2.2);
      L([19, -60, 11, -60], "#733e39", 1);
      P([19.6, -64, 31 + wv * 1.4, -58, 31 + wv * 1.6, -38, 19.6, -40], "#ead4aa");
      P([19.6, -64, 24 + wv, -61, 24 + wv, -41, 19.6, -40], "#e4a672");
      L([21, -52, 30 + wv * 1.5, -50], "#a22633", 1.2);
      halo(25, -51, 10, "#fee761");
    } else {
      L([19, 4, 19.6, -50], "#733e39", 2.2);
      P([17.2, -50, 22, -50, 21.2, -62, 18, -62], "#b86f50");
      L([19.6, -52, 19.6, -60], "#733e39", 0.6);
    }
    C(18.4, -27.6, 2.4, skin);
    C(18.4, -27.6, 1.5, skinD);
  } else if (cls === "cavaleiro") {
    /* ---------- Centurião (At 10.1) ---------- */
    const gold = has("couraca_justica");
    // Capa vermelha
    P([-8, -37, -15 + wv * 1.4, -16, -13 + wv * 1.8, -4, -8 + wv, -7, -6, -14, -5, -35], "#a22633");
    P([-8, -37, -12 + wv, -18, -8, -12, -6, -30], "#733e39");
    // Pernas e cáligas
    R(-6.6, -12.5, 4.8, 12.5, skin);
    R(2, -12.5, 4.8, 12.5, skin);
    R(-6.6, -12.5, 1.5, 12.5, skinD);
    R(2, -12.5, 1.5, 12.5, skinD);
    R(-7.6, -6, 6.6, 6, "#733e39");
    R(1.2, -6, 7.6, 6, "#733e39");
    for (let k = 0; k < 3; k++) {
      L([-7.4, -5 + k * 1.6, -1.4, -5.6 + k * 1.6], "#3e2731", 0.5);
      L([1.4, -5 + k * 1.6, 8.4, -5.6 + k * 1.6], "#3e2731", 0.5);
    }
    c.translate(0, br * s);
    // Saiote de tiras de couro (ptéryges)
    P([-10.6, -11.5, 10.6, -11.5, 9.6, -21, -9.6, -21], "#a22633");
    for (let k = 0; k < 6; k++) {
      R(-9.8 + k * 3.4, -21, 2.6, 9.6, "#733e39");
      R(-9.4 + k * 3.4, -13.6, 1.8, 1.4, "#feae34");
    }
    // Couraça: de bronze, ou de ouro (couraça da justiça, Ef 6.14)
    P([-10, -20, 10, -20, 11, -38, -11, -38], gold ? "#feae34" : "#8b9bb4");
    P([-10, -20, -6.4, -20, -7, -38, -11, -38], gold ? "#f77622" : "#5a6988");
    if (gold) {
      L([-5, -31, -1, -28, 3, -31], "#f77622", 0.8);
      L([-1, -28, -1, -22], "#f77622", 0.8);
      halo(0, -29, 10, "#fee761");
    } else {
      for (let k = 0; k < 4; k++) L([-10.4, -24 - k * 3.6, 10.4, -24 - k * 3.6], "#3a4466", 0.8);
    }
    R(-11, -22.4, 22, 2.6, "#3e2731");
    R(-1.4, -22.6, 3, 3.2, "#feae34");
    // Ombreiras e condecorações (phalerae)
    C(-10, -37, 3.6, gold ? "#feae34" : "#c0cbdc");
    C(10, -37, 3.6, gold ? "#feae34" : "#c0cbdc");
    if (!gold) [[-4, -33], [3, -33], [-0.5, -28]].forEach(([a, b]) => C(a, b, 1.2, "#feae34"));
    // Cabeça: rosto barbeado e capacete de crista transversal (capacete da salvação: Ef 6.17)
    face(0, -43.6);
    R(1.6, -40, 4.2, 0.9, "#733e39");
    const helm = has("capacete_salvacao");
    P([-7, -44.6, -5.8, -50.6, 0, -53.6, 5.8, -50.6, 7, -44.6], helm ? "#feae34" : "#8b9bb4");
    P([-7, -44.6, -5.8, -50.6, -3, -52, -4.4, -44.6], helm ? "#f77622" : "#5a6988");
    R(-7.6, -45.6, 15.2, 1.6, helm ? "#f77622" : "#5a6988");
    P([-6.6, -44.6, -3.6, -44.6, -4.2, -38, -6.4, -39.4], helm ? "#f77622" : "#5a6988");
    // Crista de lado a lado, como a dos centuriões
    P([-9.6, -52, -7, -57.6, 7, -57.6, 9.6, -52, 6, -53.6, -6, -53.6], helm ? "#ffffff" : "#e43b44");
    L([-7, -55.4, 7, -55.4], helm ? "#c0cbdc" : "#a22633", 0.7);
    if (helm) halo(0, -52, 9, "#fee761");
    // Escudo retangular curvo (escudo da fé, Ef 6.16)
    const faith = has("escudo_fe");
    P([-23, -38, -5, -38, -4, -10, -22, -10], faith ? "#feae34" : "#a22633");
    P([-21.4, -36.4, -6.6, -36.4, -5.8, -11.6, -20.6, -11.6], faith ? "#124e89" : "#a22633");
    P([-23, -38, -19, -38, -18.6, -10, -22, -10], faith ? "#f77622" : "#733e39");
    C(-13.6, -24, 3, faith ? "#fee761" : "#feae34");
    L([-13.6, -35, -13.6, -13], faith ? "#feae34" : "#feae34", 0.8);
    L([-21, -24, -6, -24], "#feae34", 0.8);
    if (faith) {
      // Os dardos inflamados apagados no escudo
      [[-19, -32, 0.4], [-9, -17, -0.3], [-17, -15, 0.6]].forEach(([a, b, r]) => {
        c.save();
        c.translate(a * s, b * s);
        c.rotate(r);
        c.fillStyle = F("#3e2731");
        c.fillRect(-0.4 * s, -6 * s, 0.8 * s, 6 * s);
        c.globalAlpha = 0.35;
        c.fillStyle = "#c0cbdc";
        c.fillRect(-1.2 * s, (-10 - (RM ? 0 : (t * 4) % 3)) * s, 2.4 * s, 2.4 * s);
        c.restore();
      });
      halo(-13.6, -24, 13, "#fee761");
    }
    // Braço da frente: bastão de videira ou a espada do Espírito (Ef 6.17)
    P([7, -37, 11, -35.6, 15.6, -28.6, 12.4, -26.4], skin);
    if (has("espada_espirito")) {
      L([18, -27, 21, -71], "#c0cbdc", 2.6);
      L([18.2, -30, 20.8, -68], "#ffffff", 0.8);
      R(15.2, -29.6, 6.4, 1.8, "#feae34");
      c.globalAlpha = glow;
      L([18, -30, 21, -73], "#2ce8f5", 4.4);
      c.globalAlpha = 1;
      for (let k = 0; k < 4; k++) C(19 + k * 0.5, -40 - k * 7, 0.6, "#124e89");
    } else {
      L([13, 2, 22, -54], "#733e39", 1.6);
      for (let k = 0; k < 5; k++) C(13 + k * 2 + 1, -6 - k * 11, 0.9, "#3e2731");
      C(22, -54, 1.4, "#3e2731");
    }
    C(18, -26.6, 2.5, skin);
    C(18, -26.6, 1.5, skinD);
  } else {
    /* ---------- Fazedor de tendas (At 18.3) ---------- */
    // Capa de viagem deixada em Trôade (2Tm 4.13): pesada e com capuz
    const cloak = has("capa_troade");
    P([-6, -36, -14 + fl * 0.3, -18, -18 + fl * 0.6, -3, -9, -5, -6, -12], cloak ? "#68386c" : "#5d275d");
    P([-6, -36, -12 + fl * 0.3, -18, -13 + fl * 0.5, -6, -9, -10], cloak ? "#3e2731" : "#3e2731");
    // Cesto de Damasco às costas (At 9.25)
    if (has("cesto_damasco")) {
      P([-19, -36, -8, -36, -9, -18, -18, -18], "#b86f50");
      for (let k = 0; k < 5; k++) L([-19, -33 + k * 3.4, -8, -33 + k * 3.4], "#733e39", 0.8);
      for (let k = 0; k < 4; k++) L([-17 + k * 2.6, -36, -16.6 + k * 2.4, -18], "#733e39", 0.6);
      L([-14, -36, -9, -46], "#ead4aa", 0.7);
    }
    // Pernas, calças de viagem e sandálias
    R(-6, -11, 4.6, 11, skin);
    R(1.6, -11, 4.6, 11, skin);
    R(-6, -11, 1.4, 11, skinD);
    R(1.6, -11, 1.4, 11, skinD);
    sandals("#3e2731");
    c.translate(0, br * s);
    // Túnica de lã cor de terra
    P([-10.4, -10, 10.4, -10, 8.6, -22, 8, -35, -8, -35, -8.6, -22], "#9e6a3d");
    P([-10.4, -10, -5, -10, -5.4, -22, -5.6, -35, -8, -35, -8.6, -22], "#733e39");
    P([6, -10, 10.4, -10, 8.6, -22, 8, -33, 6.6, -22], "#b86f50");
    // Lenços e aventais (At 19.12) amarrados ao cinto
    R(-9.6, -22.4, 19.2, 2.6, "#3e2731");
    if (has("lencos_paulo")) {
      P([-6, -20, 2, -20, 1, -10, -5, -10], "#ead4aa");
      P([2.4, -20, 7 + fl * 0.3, -14, 4.6 + fl * 0.3, -12, 1.8, -19], "#ffffff");
      P([-8.4, -20, -11 + fl * 0.3, -13, -9 + fl * 0.3, -12, -6.6, -19], "#ffffff");
      halo(-1, -15, 7, "#fee761");
    }
    // Bolsa a tiracolo; com os pergaminhos (2Tm 4.13) saindo dela
    L([-6, -35, 6, -18], "#3e2731", 1.1);
    P([3, -19, 10, -19, 10.4, -12, 3.4, -12], "#733e39");
    R(3, -19, 7.4, 1.6, "#3e2731");
    if (has("pergaminhos")) {
      [[4.4, -24], [6.8, -25.6], [8.8, -23.4]].forEach(([a, b]) => {
        R(a - 0.9, b, 1.8, 6, "#ead4aa");
        C(a, b, 1.1, "#e4a672");
      });
      halo(6.8, -21, 6, "#fee761");
    }
    // Rolo de pano de tenda no ombro
    c.save();
    c.translate(-7 * s, -35 * s);
    c.rotate(-0.5);
    c.fillStyle = F("#ead4aa");
    c.fillRect(-11 * s, -2.6 * s, 18 * s, 5.2 * s);
    c.fillStyle = F("#b86f50");
    c.fillRect(-11 * s, 1 * s, 18 * s, 1.6 * s);
    c.fillStyle = F("#733e39");
    for (let k = 0; k < 3; k++) c.fillRect((-9 + k * 6) * s, -2.6 * s, 1 * s, 5.2 * s);
    c.restore();
    // Cabeça: calva na testa e barba escura, como a tradição o pinta
    face(0.5, -42.6);
    P([-4.6, -41.4, 6.4, -40.6, 5.4, -34.6, 1.6, -32.6, -2.6, -34.6, -4.6, -38], "#3e2731");
    R(1.6, -40.6, 4.6, 1.1, "#181425");
    P([-6, -44, -5.4, -47.4, -3, -48.6, -2, -46, -4.4, -42], "#3e2731");
    if (cloak) P([-7, -44, -5, -50.6, 1, -51.6, 5.4, -49, 2, -48.4, -3, -48.6, -5.4, -42, -6.4, -36, -8.4, -38], "#68386c");
    // Braço da frente com a sovela de costurar couro
    P([6, -35, 10, -33.6, 16.2, -29.6, 16.4, -26, 9.4, -27, 6, -29.4], "#9e6a3d");
    C(18, -27.6, 2.4, skin);
    L([18.6, -28, 26, -36], "#c0cbdc", 1);
    R(16.4, -29.4, 3, 2.6, "#733e39");
    L([26, -36, 27, -37 + (RM ? 0 : Math.sin(t * 5))], "#ead4aa", 0.5);
    C(18, -27.6, 1.5, skinD);
  }
  c.restore();
}

const ScribeHeroes = { drawGreekHero };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeHeroes = ScribeHeroes;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeHeroes;
}
})();
