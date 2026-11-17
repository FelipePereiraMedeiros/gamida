/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Ações da interface sem JavaScript embutido no HTML
 * ==========================================================================
 * Em vez de onclick="setExerciseMode('choice')", os elementos levam
 * data-on-click="setExerciseMode('choice')". Este módulo escuta os eventos uma
 * vez só, no documento, e chama a função indicada.
 *
 * Por que: a política de segurança de conteúdo (CSP) do index.html proíbe
 * qualquer JavaScript escrito dentro do HTML. Assim, mesmo que um texto
 * malicioso conseguisse entrar na página, ele não teria como rodar código.
 *
 * O texto da ação NÃO é executado como código: é lido por um analisador
 * mínimo que só aceita "funcao(arg, ...)" ou "Objeto.funcao(arg, ...)", com
 * argumentos que são textos entre aspas, números, true/false/null, this,
 * this.value, this.checked ou event. Qualquer outra coisa é recusada.
 */

(function () {
const EVENTS = ["click", "change", "input", "submit", "keydown", "scroll"];
const CALL_RE = /^\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(([\s\S]*)\)\s*;?\s*$/;

/** Separa os argumentos pelas vírgulas que não estão dentro de aspas */
function splitArgs(text) {
  const args = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === "\\" && i + 1 < text.length) {
        current += text[++i];
      } else if (ch === quote) {
        quote = null;
      }
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
    } else if (ch === ",") {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (quote) throw new Error("aspas sem fechar");
  if (current.trim() || args.length) args.push(current.trim());
  return args;
}

/** Lê "funcao('a', 1, this.value)" sem executar nada */
function parseAction(source) {
  const m = CALL_RE.exec(String(source || ""));
  if (!m) throw new Error(`ação inválida: ${source}`);
  const args = splitArgs(m[2]).map((arg) => {
    if (/^'(?:[^'\\]|\\.)*'$/.test(arg) || /^"(?:[^"\\]|\\.)*"$/.test(arg)) {
      return { value: arg.slice(1, -1).replace(/\\(.)/g, "$1") };
    }
    if (/^[+-]?\d+(\.\d+)?$/.test(arg)) return { value: Number(arg) };
    if (arg === "true") return { value: true };
    if (arg === "false") return { value: false };
    if (arg === "null") return { value: null };
    if (["this", "this.value", "this.checked", "event"].includes(arg)) return { ref: arg };
    throw new Error(`argumento não aceito: ${arg}`);
  });
  return { path: m[1].split("."), args };
}

const cache = new Map();
function actionFor(source) {
  if (!cache.has(source)) cache.set(source, parseAction(source));
  return cache.get(source);
}

/** Procura a função pelo caminho a partir de window (ex.: SentenceAnalysisModule.navigateMorphemes) */
function resolve(path) {
  let owner = window;
  let fn = window;
  for (const part of path) {
    owner = fn;
    fn = fn == null ? undefined : fn[part];
  }
  return typeof fn === "function" ? { fn, owner } : null;
}

function run(source, element, event) {
  let action;
  try {
    action = actionFor(source);
  } catch (err) {
    console.warn("Gamida:", err.message);
    return;
  }
  const target = resolve(action.path);
  if (!target) {
    console.warn(`Gamida: função não encontrada para a ação ${source}`);
    return;
  }
  const values = action.args.map((a) => {
    if (!a.ref) return a.value;
    if (a.ref === "this") return element;
    if (a.ref === "this.value") return element.value;
    if (a.ref === "this.checked") return element.checked;
    return event;
  });
  target.fn.apply(target.owner === window ? element : target.owner, values);
}

function handle(event) {
  const attr = `data-on-${event.type}`;
  let node = event.target;
  // scroll não sobe na árvore: vale só o próprio elemento
  if (event.type === "scroll") {
    if (node && node.getAttribute && node.hasAttribute(attr)) run(node.getAttribute(attr), node, event);
    return;
  }
  while (node && node !== document) {
    if (node.getAttribute && node.hasAttribute(attr)) {
      if (node.disabled) return;
      run(node.getAttribute(attr), node, event);
      return;
    }
    node = node.parentNode;
  }
}

/** Elemento com role="button" e ação de clique responde a Enter e Espaço, como um botão */
function keyboardActivation(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const el = event.target;
  if (!el || !el.getAttribute || el.getAttribute("role") !== "button" || !el.hasAttribute("data-on-click")) return;
  if (el.tagName === "BUTTON" || el.tagName === "A") return;
  event.preventDefault();
  run(el.getAttribute("data-on-click"), el, event);
}

let installed = false;
function install() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  EVENTS.forEach((type) => document.addEventListener(type, handle, type === "scroll"));
  document.addEventListener("keydown", keyboardActivation);
}

const GamidaActions = { parseAction, splitArgs, install };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.GamidaActions = GamidaActions;
  install();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = GamidaActions;
}
})();
