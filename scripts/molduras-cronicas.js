/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Gera as molduras em pixel da interface das Crônicas do Escriba (bordas de
 * painel, botão, placa do HUD, pergaminho...) como SVG embutido no CSS.
 * Uso: node scripts/molduras-cronicas.js   (reescreve o bloco gerado em css/cronicas-pixel.css)
 *
 * Cada moldura é uma grade de 12×12 "pixels": canto cortado, contorno escuro,
 * luz em cima e à esquerda, sombra embaixo e à direita, e o miolo. O CSS usa
 * border-image com corte de 4 e borda de 8px: cada pixel da arte vira 2px na tela,
 * a mesma escala da arena.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "css", "cronicas-pixel.css");

// Contorno, luz, sombra, miolo (cores da paleta do jogo); "a" = opacidade do miolo
const FRAMES = {
  panel: { o: "#181425", l: "#3a4466", d: "#0e0b17", f: "#262b44" },
  raised: { o: "#181425", l: "#5a6988", d: "#262b44", f: "#3a4466" },
  hover: { o: "#181425", l: "#8b9bb4", d: "#3a4466", f: "#5a6988" },
  pressed: { o: "#181425", l: "#262b44", d: "#5a6988", f: "#3a4466" },
  gold: { o: "#181425", l: "#fee761", d: "#b86f50", f: "#feae34" },
  goldHover: { o: "#181425", l: "#ffffff", d: "#f77622", f: "#fee761" },
  ok: { o: "#181425", l: "#63c74d", d: "#193c3e", f: "#265c42" },
  bad: { o: "#181425", l: "#e43b44", d: "#3e2731", f: "#a22633" },
  slot: { o: "#181425", l: "#0e0b17", d: "#3a4466", f: "#181425" },
  hud: { o: "#181425", l: "#5a6988", d: "#0e0b17", f: "#181425", a: 0.86 },
  hudBoss: { o: "#181425", l: "#b55088", d: "#3e2731", f: "#181425", a: 0.86 },
  focus: { o: "#181425", l: "#feae34", d: "#b86f50", f: "#262b44" },
  parchment: { o: "#3e2731", l: "#f4e4c1", d: "#c28569", f: "#ead4aa" },
  blood: { o: "#181425", l: "#a22633", d: "#0e0b17", f: "#3e2731" },
  stage: { o: "#0e0b17", l: "#5a6988", d: "#262b44", f: "#181425" },
};

function frameSVG({ o, l, d, f, a = 1 }) {
  const N = 12;
  let rects = "";
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const corner = (x === 0 || x === N - 1) && (y === 0 || y === N - 1);
      if (corner) continue;
      let c;
      let op = 1;
      if (x === 0 || y === 0 || x === N - 1 || y === N - 1) c = o;
      else if (x === N - 2 || y === N - 2) c = d;
      else if (x === 1 || y === 1) c = l;
      else {
        c = f;
        op = a;
      }
      rects += `<rect x='${x}' y='${y}' width='1' height='1' fill='${c}'${op < 1 ? ` fill-opacity='${op}'` : ""}/>`;
    }
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' shape-rendering='crispEdges'>${rects}</svg>`;
}

const uri = (svg) => `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;

function block() {
  const lines = Object.entries(FRAMES).map(([name, spec]) => `  --scf-${name}: ${uri(frameSVG(spec))};`);
  return `/* <gerado por scripts/molduras-cronicas.js: não edite à mão> */\n.sc-wrap, .sc-menu-btn, .sc-bannerfx {\n${lines.join("\n")}\n}\n/* </gerado> */`;
}

const RE = /\/\* <gerado por scripts\/molduras-cronicas\.js: não edite à mão> \*\/[\s\S]*?\/\* <\/gerado> \*\//;
const css = fs.readFileSync(FILE, "utf8");
if (!RE.test(css)) throw new Error("Bloco gerado não encontrado em css/cronicas-pixel.css");
fs.writeFileSync(FILE, css.replace(RE, block()));
console.log(`css/cronicas-pixel.css: ${Object.keys(FRAMES).length} molduras`);
