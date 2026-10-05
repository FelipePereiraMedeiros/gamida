/**
 * ==========================================================================
 * Gamida - Motor de Paradigmas Gramaticais & Laboratório Estrutural
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof require !== "undefined") ? require("./state.js") : (typeof window !== "undefined" ? window : {});
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

  if (!chap || !Array.isArray(chap.paradigms) || parIdx === "" || !chap.paradigms[parIdx]) {
    resetParadigmBoard();
    return;
  }

  activeParadigm = chap.paradigms[parIdx];

  const header = document.getElementById("paradigm-header");
  if (header) header.classList.remove("hidden");
  const title = document.getElementById("paradigm-title");
  if (title) title.textContent = activeParadigm.title || "";

  const board = document.getElementById("paradigm-board");
  if (!board) return;
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
  if (!paradigm) return;
  container =
    container ||
    (typeof document !== "undefined"
      ? document.getElementById("paradigms-board") ||
        document.getElementById("paradigm-board")
      : null);
  if (!container) return;

  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";
  const table = document.createElement("table");
  table.className =
    "w-full max-w-3xl text-left border-collapse mx-auto shadow-lg bg-slate-950/40 rounded-xl overflow-hidden";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  trHead.className = "bg-slate-900 border-b border-slate-800";

  (paradigm.headers || []).forEach((h) => {
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

  (paradigm.rows || []).forEach((row) => {
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
          <div class="drop-zone border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-lg min-w-[70px] h-11 flex items-center justify-center transition-colors bg-slate-900/40 cursor-pointer" data-expected="${cellText}" data-answer="${cellText}">
          </div>
        `;
        const dropZone = td.querySelector(".drop-zone");
        if (dropZone) {
          dropZone.ondragover = onDragOver;
          dropZone.ondragleave = onDragLeave;
          dropZone.ondrop = onDropToZone;
          dropZone.onclick = onZoneClick;
        }
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  let btnContainer = document.getElementById("paradigm-action-container");
  if (!btnContainer) {
    btnContainer = document.createElement("div");
    btnContainer.id = "paradigm-action-container";
    btnContainer.className = "mt-6 text-center w-full flex flex-col items-center justify-center";
    container.appendChild(btnContainer);
  }
  btnContainer.classList.remove("hidden");
  btnContainer.innerHTML = `
    <button type="button" onclick="checkParadigmAnswers()" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/30">
      Verificar Estrutura ➔
    </button>
    <div id="paradigm-feedback" class="hidden mt-4 text-sm font-bold"></div>
  `;

  const deck = document.getElementById("paradigm-deck");
  if (deck) {
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
}

/**
 * Desenha o mapa conceitual de preposições espaciais
 * @param {Object} paradigm
 * @param {HTMLElement} container
 */
function renderDiagramView(paradigm, container) {
  if (!paradigm) return;
  container =
    container ||
    (typeof document !== "undefined"
      ? document.getElementById("paradigms-board") ||
        document.getElementById("paradigm-board")
      : null);
  if (!container) return;

  const textClass =
    AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  const wrapper = document.createElement("div");
  wrapper.className =
    "w-full max-w-4xl mx-auto flex flex-col items-center";

  if (paradigm.concept) {
    const conceptTitle = document.createElement("h4");
    conceptTitle.className =
      "text-brand-400 font-bold text-sm uppercase tracking-widest mb-6";
    conceptTitle.textContent = paradigm.concept;
    wrapper.appendChild(conceptTitle);
  }

  const stage = document.createElement("div");
  stage.className =
    "relative w-full pb-[75%] md:pb-[60%] bg-slate-950 rounded-2xl shadow-inner border border-slate-800/80 overflow-hidden mb-8";

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

  // Suporte resiliente a paradigm.elements (schema JSON) e paradigm.zones
  const items = Array.isArray(paradigm.elements)
    ? paradigm.elements.map((el) => ({
        term: el.term,
        desc: el.spatial_relation || (layoutMap[el.term] ? layoutMap[el.term].desc : el.term),
      }))
    : (Array.isArray(paradigm.zones)
        ? paradigm.zones.map((z) => ({
            term: z.expected,
            desc: z.desc || (layoutMap[z.expected] ? layoutMap[z.expected].desc : z.expected),
          }))
        : Object.keys(layoutMap).map((k) => ({ term: k, desc: layoutMap[k].desc })));

  items.forEach((item) => {
    allAnswers.push(item.term);
    const coords = layoutMap[item.term] || { x: 50, y: 50 };
    zonesHtml += `
      <div class="group absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-10" style="left: ${coords.x}%; top: ${coords.y}%;">
        <span class="text-[10px] text-slate-300 font-bold mb-1 bg-slate-900/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-700/60 transition-transform group-hover:scale-105 pointer-events-none">${item.desc}</span>
        <div class="drop-zone border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-lg min-w-[56px] px-2 h-[34px] flex items-center justify-center transition-colors bg-slate-900/80 shadow-sm cursor-pointer" data-expected="${item.term}" data-answer="${item.term}">
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

  let btnContainer = document.getElementById("paradigm-action-container");
  if (!btnContainer) {
    btnContainer = document.createElement("div");
    btnContainer.id = "paradigm-action-container";
    btnContainer.className = "mt-6 text-center w-full flex flex-col items-center justify-center";
    wrapper.appendChild(btnContainer);
  }
  btnContainer.classList.remove("hidden");
  btnContainer.innerHTML = `
    <button type="button" onclick="checkParadigmAnswers()" class="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/30">
      Verificar Esquema ➔
    </button>
    <div id="paradigm-feedback" class="hidden mt-4 text-sm font-bold"></div>
  `;

  const deck = document.getElementById("paradigm-deck");
  if (deck) {
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
    const expected = (zone.getAttribute("data-expected") || zone.getAttribute("data-answer") || "").trim();
    const chip = zone.querySelector(".drag-chip") || zone.children[0];

    zone.classList.remove(
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
      "border-slate-600",
      "border-solid",
      "border-dashed",
      "border-slate-700",
    );

    if (chip) {
      filledCount++;
      const chipText = (chip.textContent || "").trim();
      if (chipText === expected) {
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
    feedback.textContent = "🎉 Perfeito! Você completou a estrutura corretamente.";
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
  const actionContainer = document.getElementById("paradigm-action-container");

  if (header) header.classList.add("hidden");
  if (deck) {
    deck.classList.add("hidden");
    deck.innerHTML = "";
  }
  if (actionContainer) {
    actionContainer.classList.add("hidden");
    actionContainer.innerHTML = "";
  }
  if (!board) return;

  const hasParadigms =
    AppState.currentChapter &&
    Array.isArray(AppState.currentChapter.paradigms) &&
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

  const descMap = {};
  if (Array.isArray(paradigm.elements)) {
    paradigm.elements.forEach((el) => {
      if (el && el.term) descMap[el.term] = el.spatial_relation;
    });
  }

  for (const [term, data] of Object.entries(layoutMap)) {
    const desc = descMap[term] || data.desc;
    html += `
       <div class="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style="left: ${data.x}%; top: ${data.y}%;">
          <span class="text-[10px] text-slate-400 font-bold mb-1 bg-slate-900/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-700/50">${desc}</span>
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

  const chipId = e.dataTransfer ? e.dataTransfer.getData("text/plain") : null;
  const chip = chipId ? document.getElementById(chipId) : draggedElement;

  if (chip) {
    const deck = document.getElementById("paradigm-deck");
    const existingChip = zone.querySelector(".drag-chip");
    if (existingChip && existingChip !== chip && deck) {
      deck.appendChild(existingChip);
    }

    const prevZone = chip.parentElement;
    if (prevZone && prevZone !== zone && prevZone.classList.contains("drop-zone")) {
      prevZone.classList.remove(
        "border-solid",
        "border-slate-600",
        "border-emerald-500",
        "bg-emerald-900/20",
        "border-rose-500",
        "bg-rose-900/20",
      );
      prevZone.classList.add("border-dashed", "border-slate-700");
    }

    zone.appendChild(chip);
    zone.classList.remove(
      "border-dashed",
      "border-slate-700",
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
    );
    zone.classList.add("border-solid", "border-slate-600");
  }
}

function onDropToDeck(e) {
  e.preventDefault();
  const deck = e.currentTarget;
  deck.classList.remove("border-brand-500", "bg-brand-500/10");

  const chipId = e.dataTransfer ? e.dataTransfer.getData("text/plain") : null;
  const chip = chipId ? document.getElementById(chipId) : draggedElement;

  if (chip) {
    const parentZone = chip.parentElement;
    if (parentZone && parentZone.classList.contains("drop-zone")) {
      parentZone.classList.remove(
        "border-solid",
        "border-slate-600",
        "border-emerald-500",
        "bg-emerald-900/20",
        "border-rose-500",
        "bg-rose-900/20",
      );
      parentZone.classList.add("border-dashed", "border-slate-700");
    }
    deck.appendChild(chip);
  }
}

/* ================= HANDLERS DE CLIQUE / TOQUE (SUPORTE MOBILE) ================= */

function onChipClick(e) {
  e.stopPropagation();
  const chip = e.currentTarget;

  if (chip.parentElement && chip.parentElement.classList.contains("drop-zone")) {
    const zone = chip.parentElement;
    const deck = document.getElementById("paradigm-deck");
    if (deck) deck.appendChild(chip);

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
    const deck = document.getElementById("paradigm-deck");
    const existingChip = zone.querySelector(".drag-chip");
    if (existingChip && existingChip !== selectedChip && deck) {
      deck.appendChild(existingChip);
    }

    const prevZone = selectedChip.parentElement;
    if (prevZone && prevZone !== zone && prevZone.classList.contains("drop-zone")) {
      prevZone.classList.remove(
        "border-solid",
        "border-slate-600",
        "border-emerald-500",
        "bg-emerald-900/20",
        "border-rose-500",
        "bg-rose-900/20",
      );
      prevZone.classList.add("border-dashed", "border-slate-700");
    }

    zone.appendChild(selectedChip);
    zone.classList.remove(
      "border-dashed",
      "border-slate-700",
      "border-emerald-500",
      "bg-emerald-900/20",
      "border-rose-500",
      "bg-rose-900/20",
    );
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
  window.ParadigmsModule = {
    updateParadigmsVisibility,
    renderParadigmSkeleton,
    renderTableView,
    renderDiagramView,
    checkParadigmAnswers,
    resetParadigmBoard,
    getStaticDiagramHTML,
    getStaticParadigmTableHTML,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDropToZone,
    onDropToDeck,
    onChipClick,
    clearChipSelection,
    onZoneClick,
  };
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
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDropToZone,
    onDropToDeck,
    onChipClick,
    clearChipSelection,
    onZoneClick,
  };
}
})();
