/**
 * ==========================================================================
 * Gamida - Biblical Language Trainer
 * Módulo de Interface e Componentes de UI (ui.js)
 * ==========================================================================
 * Responsável por:
 *  - Dropdown customizado de seleção de capítulos
 *  - Navegação entre abas e scroll horizontal da barra de abas
 *  - Menu mobile responsivo (retração / revelação)
 *  - Botão de doação PIX (copiar com animação e feedback)
 *  - Tabela de vocabulário e dicionário dinâmico
 * ==========================================================================
 */

(function () {
/* ================= MOBILE MENU RETRACT / REVEAL ================= */
let isMobileMenuExpanded = false;

function toggleMobileMenu(forceState) {
  if (typeof forceState === "boolean") {
    isMobileMenuExpanded = forceState;
  } else {
    isMobileMenuExpanded = !isMobileMenuExpanded;
  }

  const targets = document.querySelectorAll(".mobile-collapsible-target");
  const toggleIcon = document.getElementById("mobile-menu-toggle-icon");
  const toggleLabel = document.getElementById("mobile-menu-toggle-label");
  const toggleBtn = document.getElementById("mobile-menu-toggle-btn");

  targets.forEach((el) => {
    if (isMobileMenuExpanded) {
      el.classList.remove("hidden");
      el.classList.add("animate-fadeIn");
    } else {
      el.classList.add("hidden");
      el.classList.remove("animate-fadeIn");
    }
  });

  if (toggleIcon) {
    if (isMobileMenuExpanded) {
      toggleIcon.classList.add("rotate-180");
    } else {
      toggleIcon.classList.remove("rotate-180");
    }
  }

  if (toggleLabel) {
    toggleLabel.textContent = isMobileMenuExpanded ? "Recolher" : "Menu";
  }

  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", isMobileMenuExpanded ? "true" : "false");
    toggleBtn.title = isMobileMenuExpanded
      ? "Clique para recolher o menu e focar na lição"
      : "Puxe para baixo para revelar o menu";
    if (isMobileMenuExpanded) {
      toggleBtn.classList.remove("animate-pull-indicator");
    } else {
      toggleBtn.classList.add("animate-pull-indicator");
    }
  }

  if (isMobileMenuExpanded) {
    setTimeout(updateTabsScrollIndicators, 60);
  }
}

/* ================= CAROUSEL TABS HORIZONTAL SCROLL INDICATORS ================= */
function scrollTabs(direction) {
  const container = document.getElementById("navbar-tabs-container");
  if (!container) return;
  const scrollAmount = direction === "right" ? 160 : -160;
  container.scrollBy({ left: scrollAmount, behavior: "smooth" });
}

function updateTabsScrollIndicators() {
  const container = document.getElementById("navbar-tabs-container");
  const leftBtn = document.getElementById("tabs-scroll-left-btn");
  const rightBtn = document.getElementById("tabs-scroll-right-btn");
  const leftFade = document.getElementById("tabs-fade-left");
  const rightFade = document.getElementById("tabs-fade-right");

  if (!container) return;

  // Tolerância de 4px para lidar com arredondamentos de subpixel
  const hasOverflow = container.scrollWidth > container.clientWidth + 4;
  const isScrolledToStart = container.scrollLeft <= 4;
  const isScrolledToEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 6;

  const showLeft = hasOverflow && !isScrolledToStart;
  const showRight = hasOverflow && !isScrolledToEnd;

  if (leftBtn) {
    if (showLeft) {
      leftBtn.classList.remove("hidden");
      leftBtn.classList.add("flex");
    } else {
      leftBtn.classList.add("hidden");
      leftBtn.classList.remove("flex");
    }
  }
  if (leftFade) {
    if (showLeft) {
      leftFade.classList.remove("hidden");
    } else {
      leftFade.classList.add("hidden");
    }
  }

  if (rightBtn) {
    if (showRight) {
      rightBtn.classList.remove("hidden");
      rightBtn.classList.add("flex");
    } else {
      rightBtn.classList.add("hidden");
      rightBtn.classList.remove("flex");
    }
  }
  if (rightFade) {
    if (showRight) {
      rightFade.classList.remove("hidden");
    } else {
      rightFade.classList.add("hidden");
    }
  }
}

// Ouvinte de resize para recalcular indicadores de abas
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    updateTabsScrollIndicators();
  });
}

/* ================= COFFEE & PIX DONATION ================= */
let coffeeButtonTimeout = null;

function copyPixCoffee(btn) {
  const pixKey = "10971140669";
  const button = btn || (typeof document !== "undefined" ? document.getElementById("btn-coffee") : null);

  // Copiar chave PIX para a área de transferência
  if (typeof navigator !== "undefined" && navigator.clipboard && (typeof window !== "undefined" && window.isSecureContext)) {
    navigator.clipboard.writeText(pixKey).catch(() => fallbackCopyPix(pixKey));
  } else {
    fallbackCopyPix(pixKey);
  }

  function fallbackCopyPix(text) {
    if (typeof document === "undefined") return;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Falha ao copiar PIX via execCommand:", err);
    }
    document.body.removeChild(textArea);
  }

  if (!button) return;

  // Limpar temporizador anterior se já estiver ativo
  if (coffeeButtonTimeout) {
    clearTimeout(coffeeButtonTimeout);
  }

  // Animação de pop/pulso
  button.classList.remove("animate-copied-pop", "coffee-btn-glow");
  void button.offsetWidth; // Força reflow para reiniciar animação
  button.classList.add("animate-copied-pop");

  // Altera texto e disposição interna estruturada
  button.innerHTML = `
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300 shadow-sm">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex flex-col text-left leading-tight min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">Pix:</span>
              <span class="font-bold text-xs text-white font-mono tracking-wide select-all">10971140669</span>
              <span class="text-[9px] bg-emerald-400/30 text-emerald-100 border border-emerald-300/50 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0">Copiado!</span>
            </div>
            <div class="text-[10px] text-emerald-100/90 font-medium truncate flex items-center gap-1.5 mt-0.5">
              <span class="truncate">Felipe Pereira Medeiros</span>
              <span class="text-emerald-400/60">•</span>
              <span class="text-emerald-200 font-semibold shrink-0">NuBank</span>
            </div>
          </div>
        `;

  button.className =
    "w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition-all duration-300 flex items-center justify-center sm:justify-start gap-2.5 cursor-pointer animate-copied-pop shrink-0";
  button.title = "Chave PIX copiada para a área de transferência! Clique novamente para recopiar.";

  // Restaura o botão após 8 segundos
  coffeeButtonTimeout = setTimeout(() => {
    resetCoffeeButton(button);
  }, 8000);
}

function resetCoffeeButton(button) {
  if (!button && typeof document !== "undefined") button = document.getElementById("btn-coffee");
  if (!button) return;

  button.innerHTML = `
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-amber-100 shadow-sm">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div class="flex flex-col text-left leading-tight min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-xs text-white tracking-wide">Pague-me um café!</span>
              <span class="text-[9px] bg-amber-400/25 text-amber-100 border border-amber-300/30 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">Pix</span>
            </div>
            <span class="text-[10px] text-amber-100/80 font-normal">Apoie o desenvolvedor</span>
          </div>
        `;

  button.className =
    "w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 border border-amber-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center sm:justify-start gap-2.5 cursor-pointer coffee-btn-glow shrink-0";
  button.title = "Apoie o desenvolvedor com um café via Pix! Clique para copiar a chave.";
}

/* ================= CHAPTER DROPDOWN CONTROLS ================= */
function setupGlobalChapterDropdown() {
  const list = document.getElementById("chapter-dropdown-list");
  const btnText = document.getElementById("chapter-dropdown-text");
  if (!list || !btnText || typeof AppState === "undefined") return;

  list.innerHTML = "";

  const checkIsAlpha = typeof isAlphabetChapter === "function"
    ? isAlphabetChapter
    : (c) => c && (c.id === "kelley_01" || c.id === "bergmann_01" || (c.title && c.title.toLowerCase().includes("alfabeto")));

  AppState.chapters.forEach((chap) => {
    const li = document.createElement("li");
    const isAlpha = checkIsAlpha(chap);
    li.className = isAlpha
      ? "px-4 py-3.5 text-sm text-brand-300 font-semibold bg-indigo-950/20 hover:bg-slate-800 hover:text-white cursor-pointer transition border-l-4 border-indigo-500 hover:border-brand-400 flex items-center justify-between"
      : "px-4 py-3.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white hover:font-bold cursor-pointer transition border-l-4 border-transparent hover:border-brand-500";

    if (isAlpha) {
      li.innerHTML = `<span>${chap.title}</span><span class="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">🔤 Alfabeto</span>`;
    } else {
      li.textContent = chap.title;
    }

    li.onclick = () => {
      toggleDropdown(true);
      changeGlobalChapter(chap.id);
      if (typeof window !== "undefined" && window.innerWidth < 768 && typeof toggleMobileMenu === "function") {
        toggleMobileMenu(false);
      }
    };
    list.appendChild(li);
  });

  const savedChap = typeof localStorage !== "undefined"
    ? localStorage.getItem(`gamida_lastChap_${AppState.language}`)
    : null;
  const activeChap =
    AppState.chapters.find((c) => c.id === savedChap) ||
    AppState.chapters[0];

  if (activeChap) {
    changeGlobalChapter(activeChap.id);
  }
}

function toggleDropdown(forceClose = false) {
  const list = document.getElementById("chapter-dropdown-list");
  if (!list) return;
  if (forceClose) {
    list.classList.add("hidden");
  } else {
    list.classList.toggle("hidden");
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("custom-chapter-selector");
    if (dropdown && !dropdown.contains(e.target)) {
      toggleDropdown(true);
    }
  });
}

function changeGlobalChapter(chapterId) {
  if (!chapterId || typeof AppState === "undefined") return;

  const found = AppState.chapters.find((c) => c.id === chapterId);
  if (found) {
    AppState.currentChapter = found;

    const btnText = document.getElementById("chapter-dropdown-text");
    if (btnText) {
      btnText.textContent = found.title;
      btnText.title = found.title;
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`gamida_lastChap_${AppState.language}`, found.id);
    }

    if (typeof assessTimerInterval !== "undefined" && assessTimerInterval) {
      clearInterval(assessTimerInterval);
    }
    if (typeof assessQuestions !== "undefined") assessQuestions.length = 0;
    if (typeof assessIndex !== "undefined") window.assessIndex = 0;
    if (typeof assessAnswersMap !== "undefined") window.assessAnswersMap = {};
    if (typeof ankiQueue !== "undefined") ankiQueue.length = 0;
    if (typeof ankiCurrentCard !== "undefined") window.ankiCurrentCard = null;
    if (typeof survQueue !== "undefined") survQueue.length = 0;
    if (typeof survCurrent !== "undefined") window.survCurrent = null;

    if (typeof resetToDashboard === "function") resetToDashboard();

    // 1. Atualiza Praticar
    AppState.currentQuestionIndex = 0;
    AppState.currentQuestion = null;
    if (typeof resetStats === "function") resetStats();
    if (typeof buildPracticeQueue === "function") buildPracticeQueue();
    if (typeof updatePracticeChapterView === "function") updatePracticeChapterView();

    // 2. Atualiza Dicionário
    lastRenderedVocabChapter = null;
    renderVocabTable();

    // 3. Atualiza Paradigmas
    if (typeof updateParadigmsVisibility === "function") updateParadigmsVisibility();
    const parSelect = document.getElementById("paradigm-select");
    if (parSelect) {
      parSelect.innerHTML = '<option value="">Selecione o Esquema / Tabela...</option>';
      if (found.paradigms && found.paradigms.length > 0) {
        found.paradigms.forEach((par, idx) => {
          const opt = document.createElement("option");
          opt.value = idx;
          opt.textContent = par.title;
          parSelect.appendChild(opt);
        });
      }
    }
    if (typeof resetParadigmBoard === "function") resetParadigmBoard();
  }
}

/* ================= VOCABULARY DICTIONARY TABLE ================= */
let lastRenderedVocabChapter = null;

function renderVocabTable() {
  const tbody = document.getElementById("vocab-table-body");
  if (!tbody || typeof AppState === "undefined" || !AppState.currentChapter) return;

  if (lastRenderedVocabChapter === AppState.currentChapter.id) return;

  tbody.innerHTML = "";

  const allItems = [
    ...(AppState.currentChapter.items || []),
    ...(AppState.currentChapter.sentences || []),
  ];

  const escapeFn = typeof escapeHTML === "function"
    ? escapeHTML
    : (str) => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const termFn = typeof getTerm === "function"
    ? getTerm
    : (item) => item.term || item.hebrew || "";

  allItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-800/40 transition";

    const isSentence = item.type === "Frase" || item.type === "Expressão";
    const termText = termFn(item);
    const translitText = item.transliteration || "-";
    const typeText = item.type || "Geral";
    let translationsText = Array.isArray(item.translations)
      ? item.translations.join(" / ")
      : item.translations || "Tradução ausente";

    const textClass = AppState.language === "hebrew"
      ? "hebrew-text text-2xl md:text-3xl"
      : "greek-text text-lg md:text-xl";

    tr.innerHTML = `
            <td class="px-6 py-4 ${textClass} font-bold text-white">${escapeFn(termText)}</td>
            <td class="px-6 py-4 font-mono text-xs text-amber-400">${escapeFn(translitText)}</td>
            <td class="px-6 py-4 font-medium text-slate-200">${escapeFn(translationsText)}</td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 rounded-full ${isSentence ? "bg-indigo-900/60 border-indigo-700 text-indigo-300" : "bg-slate-800 border-slate-700 text-slate-400"} border text-[10px] font-mono">
                ${escapeFn(typeText)}
              </span>
            </td>
          `;
    tbody.appendChild(tr);
  });

  // Paradigmas no final da tabela
  if (
    AppState.currentChapter.paradigms &&
    AppState.currentChapter.paradigms.length > 0
  ) {
    AppState.currentChapter.paradigms.forEach((paradigm) => {
      const trParadigm = document.createElement("tr");
      trParadigm.className = "bg-slate-900/10";

      const tdParadigm = document.createElement("td");
      tdParadigm.colSpan = 4;
      tdParadigm.className = "p-2 md:p-6 border-t border-slate-800/80";

      if (paradigm.type === "table" && typeof getStaticParadigmTableHTML === "function") {
        tdParadigm.innerHTML = getStaticParadigmTableHTML(paradigm);
      } else if (paradigm.type === "diagram" && typeof getStaticDiagramHTML === "function") {
        tdParadigm.innerHTML = getStaticDiagramHTML(paradigm);
      }

      trParadigm.appendChild(tdParadigm);
      tbody.appendChild(trParadigm);
    });
  }

  lastRenderedVocabChapter = AppState.currentChapter.id;
}

function filterVocabTable() {
  const searchInput = document.getElementById("vocab-search");
  if (!searchInput) return;
  const normFn = typeof normalizeText === "function"
    ? normalizeText
    : (str) => String(str || "").toLowerCase().trim();
  const query = normFn(searchInput.value);
  document.querySelectorAll("#vocab-table-body tr").forEach((tr) => {
    tr.style.display = normFn(tr.textContent).includes(query)
      ? ""
      : "none";
  });
}

/* ================= COMPATIBILIDADE GLOBAL ================= */
if (typeof window !== "undefined") {
  window.isMobileMenuExpanded = isMobileMenuExpanded;
  window.toggleMobileMenu = toggleMobileMenu;
  window.scrollTabs = scrollTabs;
  window.updateTabsScrollIndicators = updateTabsScrollIndicators;
  window.coffeeButtonTimeout = coffeeButtonTimeout;
  window.copyPixCoffee = copyPixCoffee;
  window.resetCoffeeButton = resetCoffeeButton;
  window.setupGlobalChapterDropdown = setupGlobalChapterDropdown;
  window.toggleDropdown = toggleDropdown;
  window.changeGlobalChapter = changeGlobalChapter;
  window.lastRenderedVocabChapter = lastRenderedVocabChapter;
  window.renderVocabTable = renderVocabTable;
  window.filterVocabTable = filterVocabTable;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isMobileMenuExpanded,
    toggleMobileMenu,
    scrollTabs,
    updateTabsScrollIndicators,
    coffeeButtonTimeout,
    copyPixCoffee,
    resetCoffeeButton,
    setupGlobalChapterDropdown,
    toggleDropdown,
    changeGlobalChapter,
    lastRenderedVocabChapter,
    renderVocabTable,
    filterVocabTable,
  };
}
})();
