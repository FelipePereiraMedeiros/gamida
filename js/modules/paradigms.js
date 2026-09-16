/**
 * ==========================================================================
 * Gamida - Motor de Paradigmas Gramaticais & Laboratório Estrutural
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof window !== "undefined" && window.AppState) ? window : (typeof require !== "undefined" ? require("./state.js") : {});
const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;

let activeParadigm = null;
let draggedElement = null;
let selectedChip = null;

/**
 * Controla a visibilidade da aba de paradigmas na barra de navegação
 */
function updateParadigmsVisibility() {
  if (typeof document === "undefined") return;
  const btnParadigms = document.getElementById("nav-btn-paradigms");
  if (!btnParadigms) return;

  const hasParadigms =
    AppState.currentChapter &&
    Array.isArray(AppState.currentChapter.paradigms) &&
    AppState.currentChapter.paradigms.length > 0;

  if (AppState.language === "hebrew" || !hasParadigms) {
    btnParadigms.style.display = "none";
    if (AppState.currentTab === "paradigms" && typeof window !== "undefined" && typeof window.switchTab === "function") {
      window.switchTab("practice");
    }
  } else {
    btnParadigms.style.display = "";
  }

  if (typeof window !== "undefined" && typeof window.updateTabsScrollIndicators === "function") {
    setTimeout(window.updateTabsScrollIndicators, 50);
  }
}

/**
 * Renderiza o esqueleto principal do paradigma selecionado
 */
function renderParadigmSkeleton() {
  if (typeof document === "undefined") return;
  const chap = AppState.currentChapter;
  const parSelect = document.getElementById("paradigm-select");
  const parIdx = parSelect ? parSelect.value : "";

  if (!chap || parIdx === "") {
    resetParadigmBoard();
    return;
  }

  activeParadigm = chap.paradigms[parIdx];

  document.getElementById("paradigm-header").classList.remove("hidden");
  document.getElementById("paradigm-title").textContent = activeParadigm.title;

  const board = document.getElementById("paradigm-board");
  board.innerHTML = "";

  if (activeParadigm.type === "table") {
    renderTableView(activeParadigm, board);
  } else if (activeParadigm.type === "diagram") {
    renderDiagramView(activeParadigm, board);
  }
}

/**
 * Constrói a tabela gramatical com zonas de encaixe e o deck de fichas
 * @param {Object} paradigm
 * @param {HTMLElement} container
 */
function renderTableView(paradigm, container) {
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";
  const table = document.createElement("table");
  table.className =
    "w-full max-w-3xl text-left border-collapse mx-auto shadow-lg bg-slate-950/40 rounded-xl overflow-hidden";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  trHead.className = "bg-slate-900 border-b border-slate-800";

  paradigm.headers.forEach((h) => {
    const th = document.createElement("th");
    th.className =
      "px-4 py-3 text-brand-400 font-bold text-xs uppercase tracking-wider text-center";
    th.textContent = h;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.className = "divide-y divide-slate-800/60";

  let allAnswers = [];

  paradigm.rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-900/30 transition";

    row.forEach((cellText, cellIdx) => {
      const td = document.createElement("td");
      td.className = "p-2.5 text-center align-middle";

      if (cellIdx === 0) {
        td.innerHTML = `<span class="font-bold text-slate-300 text-[11px] uppercase tracking-wider">${cellText}</span>`;
      } else {
        allAnswers.push(cellText);
        td.innerHTML = `
                <div class="drop-zone border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-lg h-11 flex items-center justify-center transition-colors bg-slate-900/40 cursor-pointer" data-expected="${cellText}">
                </div>
              `;
        const dropZone = td.querySelector(".drop-zone");
        dropZone.ondragover = onDragOver;
        dropZone.ondragleave = onDragLeave;
        dropZone.ondrop = onDropToZone;
        dropZone.onclick = onZoneClick;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  const btnContainer = document.getElementById("paradigm-action-container");
  btnContainer.innerHTML = `
          <button type="button" onclick="checkParadigmAnswers()" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/30">
            Verificar Estrutura ➔
          </button>
          <div id="paradigm-feedback" class="hidden mt-4 text-sm font-bold"></div>
        `;

  const deck = document.getElementById("paradigm-deck");
  deck.classList.remove("hidden");
  deck.innerHTML = "";

  deck.ondragover = onDragOver;
  deck.ondragleave = onDragLeave;
  deck.ondrop = onDropToDeck;

  allAnswers = shuffleArray(allAnswers);
  allAnswers.forEach((ans, i) => {
    const chip = document.createElement("div");
    chip.className = `drag-chip ${textClass} inline-flex items-center justify-center w-fit cursor-grab bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-1.5 px-4 text-sm rounded-lg shadow-sm transition-transform active:scale-95 select-none`;
    chip.draggable = true;
    chip.id = `chip-${i}`;
    chip.textContent = ans;
    chip.ondragstart = onDragStart;
    chip.ondragend = onDragEnd;
    chip.onclick = onChipClick;
    deck.appendChild(chip);
  });
}

/**
 * Desenha o mapa conceitual de preposições espaciais
 * @param {Object} paradigm
 * @param {HTMLElement} container
 */
function renderDiagramView(paradigm, container) {
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  const wrapper = document.createElement("div");
  wrapper.className =
    "w-full max-w-4xl mx-auto flex flex-col items-center";

  const conceptTitle = document.createElement("h4");
  conceptTitle.className =
    "text-brand-400 font-bold text-sm uppercase tracking-widest mb-6";
  conceptTitle.textContent = paradigm.concept;
  wrapper.appendChild(conceptTitle);

  const stage = document.createElement("div");
  stage.className =
    "relative w-full pb-[75%] md:pb-[60%] bg-slate-950 rounded-2xl shadow-inner border border-slate-800/80 overflow-hidden mb-8";

  const layoutMap = {
    ἐν: { x: 50, y: 50 },
    εἰς: { x: 28, y: 50 },
    ἐκ: { x: 72, y: 50 },
    διά: { x: 50, y: 66 },
    ὑπέρ: { x: 50, y: 14 },
    ὑπό: { x: 50, y: 86 },
    ἐπί: { x: 50, y: 31 },
    ἀνά: { x: 14, y: 35 },
    κατά: { x: 86, y: 75 },
    πρός: { x: 38, y: 32 },
    ἀπό: { x: 62, y: 68 },
    πρό: { x: 8, y: 50 },
    ἀντί: { x: 14, y: 66 },
    σύν: { x: 86, y: 15 },
    μετά: { x: 88, y: 44 },
    περί: { x: 66, y: 28 },
  };

  const svgVisuals = `
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
          </defs>
          <circle cx="400" cy="300" r="90" fill="#1e293b" stroke="#334155" stroke-width="4" stroke-dasharray="10 5"/>
          <path d="M 150 300 L 350 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
          <path d="M 450 300 L 650 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
          <path d="M 250 400 L 550 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" stroke-dasharray="4 4" />
          <path d="M 250 80 L 550 80" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <path d="M 250 520 L 550 520" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <circle cx="400" cy="210" r="8" fill="#3b82f6" />
          <path d="M 400 130 L 400 200" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
          <path d="M 110 450 L 110 150" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <path d="M 690 150 L 690 450" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <path d="M 260 160 L 330 230" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
          <path d="M 470 370 L 540 440" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#arrow-blue)" />
          <rect x="70" y="285" width="10" height="30" fill="#64748b" />
          <circle cx="50" cy="300" r="8" fill="#3b82f6" />
          <path d="M 50 400 L 100 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <path d="M 170 400 L 120 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <circle cx="680" cy="90" r="8" fill="#3b82f6" />
          <circle cx="705" cy="90" r="8" fill="#3b82f6" />
          <path d="M 680 260 L 740 260" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
          <circle cx="660" cy="260" r="8" fill="#3b82f6" />
          <path d="M 320 210 A 130 130 0 1 1 270 370" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#arrow)" />
        </svg>
      `;

  let zonesHtml = "";
  let allAnswers = [];

  paradigm.zones.forEach((zone) => {
    allAnswers.push(zone.expected);
    const coords = layoutMap[zone.expected] || { x: 50, y: 50 };
    zonesHtml += `
            <div class="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style="left: ${coords.x}%; top: ${coords.y}%;">
              <span class="text-[10px] text-slate-400 font-bold mb-1 bg-slate-900/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-700/50">${zone.desc}</span>
              <div class="drop-zone border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-lg min-w-[50px] px-2 h-[32px] flex items-center justify-center transition-colors bg-slate-900/60 shadow-sm cursor-pointer" data-expected="${zone.expected}">
              </div>
            </div>
          `;
  });

  stage.innerHTML = svgVisuals + zonesHtml;
  wrapper.appendChild(stage);
  container.appendChild(wrapper);

  stage.querySelectorAll(".drop-zone").forEach((dz) => {
    dz.ondragover = onDragOver;
    dz.ondragleave = onDragLeave;
    dz.ondrop = onDropToZone;
    dz.onclick = onZoneClick;
  });

  const btnContainer = document.getElementById("paradigm-action-container");
  btnContainer.innerHTML = `
          <button type="button" onclick="checkParadigmAnswers()" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/30">
            Verificar Esquema ➔
          </button>
          <div id="paradigm-feedback" class="hidden mt-4 text-sm font-bold"></div>
        `;

  const deck = document.getElementById("paradigm-deck");
  deck.classList.remove("hidden");
  deck.innerHTML = "";

  deck.ondragover = onDragOver;
  deck.ondragleave = onDragLeave;
  deck.ondrop = onDropToDeck;

  allAnswers = shuffleArray(allAnswers);
  allAnswers.forEach((ans, i) => {
    const chip = document.createElement("div");
    chip.className = `drag-chip ${textClass} inline-flex items-center justify-center w-fit cursor-grab bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-1 px-3 text-sm rounded-lg shadow-sm transition-transform active:scale-95 select-none`;
    chip.draggable = true;
    chip.id = `chip-diag-${i}`;
    chip.textContent = ans;
    chip.ondragstart = onDragStart;
    chip.ondragend = onDragEnd;
    chip.onclick = onChipClick;
    deck.appendChild(chip);
  });
}

/**
 * Valida o posicionamento de todas as fichas nas zonas
 */
function checkParadigmAnswers() {
  if (typeof document === "undefined") return;
  const zones = document.querySelectorAll("#paradigm-board .drop-zone");
  let allCorrect = true;
  let filledCount = 0;

  zones.forEach((zone) => {
    const expected = zone.getAttribute("data-expected");
    const chip = zone.children[0];

    zone.classList.remove(
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
      "border-slate-600",
    );

    if (chip) {
      filledCount++;
      if (chip.textContent === expected) {
        zone.classList.add(
          "border-emerald-500",
          "bg-emerald-900/20",
          "border-solid",
        );
      } else {
        zone.classList.add(
          "border-rose-500",
          "bg-rose-900/20",
          "border-solid",
        );
        allCorrect = false;
      }
    } else {
      zone.classList.add("border-dashed", "border-slate-700");
      allCorrect = false;
    }
  });

  const feedback = document.getElementById("paradigm-feedback");
  if (!feedback) return;
  feedback.classList.remove("hidden");

  if (filledCount < zones.length) {
    feedback.textContent = "⚠️ Preencha todos os espaços antes de verificar!";
    feedback.className = "mt-4 text-sm font-bold text-amber-400";
  } else if (allCorrect) {
    feedback.textContent = "🎉 Perfeito! Você completou a tabela corretamente.";
    feedback.className = "mt-4 text-sm font-bold text-emerald-400";
  } else {
    feedback.textContent =
      "❌ Ainda há erros. Tente reposicionar as fichas destacadas em vermelho!";
    feedback.className = "mt-4 text-sm font-bold text-rose-400";
  }
}

/**
 * Restaura o painel inicial de paradigmas
 */
function resetParadigmBoard() {
  if (typeof document === "undefined") return;
  const header = document.getElementById("paradigm-header");
  const deck = document.getElementById("paradigm-deck");
  const board = document.getElementById("paradigm-board");

  if (header) header.classList.add("hidden");
  if (deck) deck.classList.add("hidden");
  if (!board) return;

  const hasParadigms =
    AppState.currentChapter &&
    AppState.currentChapter.paradigms &&
    AppState.currentChapter.paradigms.length > 0;

  board.innerHTML = `
     <div class="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center text-3xl mb-2">🧩</div>
     <h3 class="text-xl font-bold text-white">Laboratório Estrutural</h3>
     <p class="text-sm text-slate-400 max-w-md mx-auto">
       ${hasParadigms
      ? "Neste modo você treina o reconhecimento visual das terminações e regras. Selecione um paradigma acima para iniciar."
      : "Nenhuma estrutura ou paradigma disponível para este módulo ainda."
    }
     </p>
  `;
}

/**
 * Retorna o HTML de visualização estática do diagrama de preposições para uso no Dicionário
 * @param {Object} paradigm
 * @returns {string}
 */
function getStaticDiagramHTML(paradigm) {
  const layoutMap = {
    ἐν: { x: 50, y: 50, desc: "Dentro" },
    εἰς: { x: 28, y: 50, desc: "Para dentro" },
    ἐκ: { x: 72, y: 50, desc: "Para fora" },
    διά: { x: 50, y: 66, desc: "Através" },
    ὑπέρ: { x: 50, y: 14, desc: "Acima / Sobre (sem contato)" },
    ὑπό: { x: 50, y: 86, desc: "Debaixo / Sob" },
    ἐπί: { x: 50, y: 31, desc: "Sobre (com contato)" },
    ἀνά: { x: 14, y: 35, desc: "Para cima" },
    κατά: { x: 86, y: 75, desc: "Para baixo" },
    πρός: { x: 38, y: 32, desc: "Em direção a" },
    ἀπό: { x: 62, y: 68, desc: "Afastando-se" },
    πρό: { x: 8, y: 50, desc: "Na frente" },
    ἀντί: { x: 14, y: 66, desc: "Em oposição" },
    σύν: { x: 86, y: 15, desc: "Junto de / Companhia" },
    μετά: { x: 88, y: 44, desc: "Com / Associação" },
    περί: { x: 66, y: 28, desc: "Ao redor" },
  };

  let html = `
    <div class="w-full max-w-4xl mx-auto flex flex-col items-center my-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
      <h4 class="text-slate-300 font-bold text-sm uppercase tracking-widest mb-6">${paradigm.title}</h4>
      <div class="relative w-full pb-[75%] md:pb-[60%] bg-slate-950 rounded-2xl shadow-inner border border-slate-800/80 overflow-hidden">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="static-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker id="static-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
          </defs>
          <circle cx="400" cy="300" r="90" fill="#1e293b" stroke="#334155" stroke-width="4" stroke-dasharray="10 5"/>
          <path d="M 150 300 L 350 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
          <path d="M 450 300 L 650 300" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
          <path d="M 250 400 L 550 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" stroke-dasharray="4 4" />
          <path d="M 250 80 L 550 80" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <path d="M 250 520 L 550 520" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <circle cx="400" cy="210" r="8" fill="#3b82f6" />
          <path d="M 400 130 L 400 200" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
          <path d="M 110 450 L 110 150" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <path d="M 690 150 L 690 450" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <path d="M 260 160 L 330 230" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
          <path d="M 470 370 L 540 440" stroke="#3b82f6" stroke-width="4" fill="none" marker-end="url(#static-arrow-blue)" />
          <rect x="70" y="285" width="10" height="30" fill="#64748b" />
          <circle cx="50" cy="300" r="8" fill="#3b82f6" />
          <path d="M 50 400 L 100 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <path d="M 170 400 L 120 400" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <circle cx="680" cy="90" r="8" fill="#3b82f6" />
          <circle cx="705" cy="90" r="8" fill="#3b82f6" />
          <path d="M 680 260 L 740 260" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
          <circle cx="660" cy="260" r="8" fill="#3b82f6" />
          <path d="M 320 210 A 130 130 0 1 1 270 370" stroke="#64748b" stroke-width="4" fill="none" marker-end="url(#static-arrow)" />
        </svg>
  `;

  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  for (const [term, data] of Object.entries(layoutMap)) {
    html += `
       <div class="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style="left: ${data.x}%; top: ${data.y}%;">
          <span class="text-[10px] text-slate-400 font-bold mb-1 bg-slate-900/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-700/50">${data.desc}</span>
          <div class="${textClass} flex items-center justify-center min-w-[50px] px-3 h-[32px] rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-bold text-sm shadow-md">
               ${term}
          </div>
       </div>
     `;
  }

  html += `</div></div>`;
  return html;
}

/**
 * Retorna o HTML de visualização estática da tabela de paradigmas para o Dicionário
 * @param {Object} paradigm
 * @returns {string}
 */
function getStaticParadigmTableHTML(paradigm) {
  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";
  let html = `
    <div class="w-full max-w-4xl mx-auto flex flex-col items-center my-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg">
      <h4 class="text-slate-300 font-bold text-sm uppercase tracking-widest mb-6 text-center">${paradigm.title}</h4>
      <div class="w-full overflow-x-auto rounded-xl border border-slate-700/50">
        <table class="w-full text-left border-collapse min-w-[400px]">
          <thead>
            <tr class="bg-slate-950">
  `;

  paradigm.headers.forEach((h) => {
    html += `<th class="px-4 py-4 border-b border-slate-700 text-brand-400 text-xs font-bold uppercase tracking-wider text-center">${h}</th>`;
  });

  html += `
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 bg-slate-900/50">
  `;

  paradigm.rows.forEach((row) => {
    html += `<tr class="hover:bg-slate-800/40 transition">`;
    row.forEach((cellText, cellIdx) => {
      if (cellIdx === 0) {
        html += `<td class="p-3 text-center align-middle bg-slate-950/40 w-24 border-r border-slate-800/60"><span class="font-bold text-slate-400 text-[11px] uppercase tracking-wider">${cellText}</span></td>`;
      } else {
        html += `<td class="p-3 text-center align-middle ${textClass} text-lg font-bold text-slate-100">${cellText}</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  return html;
}

/* ================= HANDLERS DE ARRASTAR E SOLTAR (DRAG & DROP) ================= */

function onDragStart(e) {
  draggedElement = e.currentTarget;
  e.dataTransfer.setData("text/plain", e.currentTarget.id);
  e.dataTransfer.effectAllowed = "move";
  e.currentTarget.classList.add("opacity-40");
}

function onDragEnd(e) {
  e.currentTarget.classList.remove("opacity-40");
  draggedElement = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.add("border-brand-500", "bg-brand-500/10");
}

function onDragLeave(e) {
  e.currentTarget.classList.remove("border-brand-500", "bg-brand-500/10");
}

function onDropToZone(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove("border-brand-500", "bg-brand-500/10");

  const chipId = e.dataTransfer.getData("text/plain");
  const chip = document.getElementById(chipId);

  if (chip) {
    if (zone.children.length > 0) {
      document.getElementById("paradigm-deck").appendChild(zone.children[0]);
    }
    zone.appendChild(chip);
    zone.classList.remove("border-dashed", "border-slate-700");
    zone.classList.add("border-solid", "border-slate-600");
  }
}

function onDropToDeck(e) {
  e.preventDefault();
  const deck = e.currentTarget;
  deck.classList.remove("border-brand-500", "bg-brand-500/10");

  const chipId = e.dataTransfer.getData("text/plain");
  const chip = document.getElementById(chipId);

  if (chip) {
    const parentZone = chip.parentElement;
    if (parentZone && parentZone.classList.contains("drop-zone")) {
      parentZone.classList.remove("border-solid", "border-slate-600");
      parentZone.classList.add("border-dashed", "border-slate-700");
    }
    deck.appendChild(chip);
  }
}

/* ================= HANDLERS DE CLIQUE / TOQUE (SUPORTE MOBILE) ================= */

function onChipClick(e) {
  e.stopPropagation();
  const chip = e.currentTarget;

  if (chip.parentElement.classList.contains("drop-zone")) {
    const zone = chip.parentElement;
    document.getElementById("paradigm-deck").appendChild(chip);

    zone.classList.remove(
      "border-solid",
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
      "border-slate-600",
    );
    zone.classList.add("border-dashed", "border-slate-700");

    if (selectedChip === chip) clearChipSelection();
    return;
  }

  if (selectedChip === chip) {
    clearChipSelection();
  } else {
    clearChipSelection();
    selectedChip = chip;
    chip.classList.add("ring-4", "ring-brand-500", "scale-110", "z-50");
  }
}

function clearChipSelection() {
  if (selectedChip) {
    selectedChip.classList.remove(
      "ring-4",
      "ring-brand-500",
      "scale-110",
      "z-50",
    );
    selectedChip = null;
  }
}

function onZoneClick(e) {
  const zone = e.currentTarget;

  if (selectedChip) {
    if (zone.children.length > 0) {
      document.getElementById("paradigm-deck").appendChild(zone.children[0]);
    }
    zone.appendChild(selectedChip);
    zone.classList.remove("border-dashed", "border-slate-700");
    zone.classList.add("border-solid", "border-slate-600");
    clearChipSelection();
  }
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.updateParadigmsVisibility = updateParadigmsVisibility;
  window.renderParadigmSkeleton = renderParadigmSkeleton;
  window.renderTableView = renderTableView;
  window.renderDiagramView = renderDiagramView;
  window.checkParadigmAnswers = checkParadigmAnswers;
  window.resetParadigmBoard = resetParadigmBoard;
  window.getStaticDiagramHTML = getStaticDiagramHTML;
  window.getStaticParadigmTableHTML = getStaticParadigmTableHTML;
  window.onDragStart = onDragStart;
  window.onDragEnd = onDragEnd;
  window.onDragOver = onDragOver;
  window.onDragLeave = onDragLeave;
  window.onDropToZone = onDropToZone;
  window.onDropToDeck = onDropToDeck;
  window.onChipClick = onChipClick;
  window.clearChipSelection = clearChipSelection;
  window.onZoneClick = onZoneClick;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    updateParadigmsVisibility,
    renderParadigmSkeleton,
    renderTableView,
    renderDiagramView,
    checkParadigmAnswers,
    resetParadigmBoard,
    getStaticDiagramHTML,
    getStaticParadigmTableHTML,
  };
}
})();
