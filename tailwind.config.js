/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Tema do Tailwind do Gamida.
 * "slate" é a tinta quente da interface e "brand" é o destaque do idioma ativo.
 * As cores de "brand" vêm de variáveis CSS, então todas as classes acompanham a troca de idioma.
 *
 * O CSS é compilado para css/tailwind.css (npm run build:css) e versionado junto com o código,
 * para o app funcionar sem internet e sem o CDN do Tailwind.
 */
const brandShade = (n) => `rgb(var(--brand-${n}) / <alpha-value>)`;

module.exports = {
  // Toda classe usada no HTML ou montada no JavaScript precisa aparecer por extenso nestes arquivos
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
        hebrew: ['"SBL Hebrew"', '"Ezra SIL"', '"Noto Sans Hebrew"', '"David"', "serif"],
      },
      colors: {
        slate: {
          50: "#f8f6f1",
          100: "#f0ede6",
          200: "#e0dcd2",
          300: "#c9c4b8",
          400: "#aca79b",
          500: "#8d887d",
          600: "#5e5a52",
          700: "#413e38",
          800: "#2d2b27",
          900: "#201e1b",
          950: "#151412",
        },
        brand: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, brandShade(n)]),
        ),
      },
    },
  },
};
