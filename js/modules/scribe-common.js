/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: utilidades comuns
 * ==========================================================================
 * O que os módulos de desenho e o motor do jogo repetiam cada um por conta:
 * o pedido de "reduzir movimento" do sistema, o acaso fixo dos desenhos
 * (rnd: o mesmo número para a mesma semente, para a arte não tremer) e o
 * escape de texto para HTML.
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

const ScribeCommon = {
  reducedMotion,
  // Lido uma vez ao carregar, como faziam os módulos de desenho
  RM: reducedMotion(),
  rnd,
  esc,
};

if (typeof window !== "undefined") window.ScribeCommon = ScribeCommon;
if (typeof module !== "undefined" && module.exports) module.exports = ScribeCommon;
})();
