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
const _stateModule =
  typeof require !== "undefined"
    ? require("./state.js")
    : typeof window !== "undefined"
      ? window
      : {};
const AppState =
  (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const getTerm =
  (typeof window !== "undefined" && window.getTerm) || _stateModule.getTerm;
const escapeHTML =
  (typeof window !== "undefined" && window.escapeHTML) ||
  _stateModule.escapeHTML ||
  ((s) => String(s ?? ""));

/* ================= MOBILE MENU RETRACT / REVEAL ================= */
let isMobileMenuExpanded = false;

function toggleMobileMenu(forceState) {
  if (typeof forceState === "boolean") {
    isMobileMenuExpanded = forceState;
  } else {
    isMobileMenuExpanded = !isMobileMenuExpanded;
  }

  const targets = document.querySelectorAll(".mobile-collapsible-target");
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

  if (document.body && document.body.classList) {
    document.body.classList.toggle("study-panel-open", isMobileMenuExpanded);
  }

  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", isMobileMenuExpanded ? "true" : "false");
    toggleBtn.title = isMobileMenuExpanded
      ? "Fechar e voltar à lição"
      : "Trocar capítulo ou idioma";
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

let _tabScrollRafId = null;

function scheduleUpdateTabsScrollIndicators() {
  if (_tabScrollRafId) return;
  if (typeof requestAnimationFrame === "function") {
    _tabScrollRafId = requestAnimationFrame(() => {
      _tabScrollRafId = null;
      updateTabsScrollIndicators();
    });
  } else {
    updateTabsScrollIndicators();
  }
}

// Ouvinte de resize para recalcular indicadores de abas (otimizado via RAF e blindado contra duplicidade)
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  if (!window._tabsResizeListenerBound) {
    window._tabsResizeListenerBound = true;
    window.addEventListener("resize", scheduleUpdateTabsScrollIndicators);
  }
}

/* ================= COFFEE & PIX DONATION ================= */
let coffeeButtonTimeout = null;

function copyPixCoffee(btn) {
  const pixKey = "9e6c4330-9897-4f94-b4b4-e5a81dafe219";
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
  button.classList.remove("animate-copied-pop");
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
              <span class="font-bold text-[11px] text-white font-mono select-all break-all">9e6c4330-9897-4f94-b4b4-e5a81dafe219</span>
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
    "w-full px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white border border-emerald-400/40 transition-all duration-300 flex items-center gap-2.5 cursor-pointer animate-copied-pop";
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
          <div class="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center shrink-0 text-slate-950">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div class="flex flex-col text-left leading-tight min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-xs tracking-wide">Pague-me um café!</span>
              <span class="text-[10px] bg-black/10 px-1.5 rounded font-semibold uppercase tracking-wider">Pix</span>
            </div>
            <span class="text-[11px] font-medium">Apoie o desenvolvedor</span>
          </div>
        `;

  button.className =
    "w-full px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-slate-950 border border-amber-400/30 transition-all duration-300 flex items-center gap-2.5 cursor-pointer";
  button.title = "Apoie o desenvolvedor com um café via Pix! Clique para copiar a chave.";
}

/* ================= CHAPTER DROPDOWN & MULTI-SELECT CONTROLS ================= */
function _resolveGetSelectedChapters(state = AppState, options = {}) {
  if (typeof getSelectedChapters === "function") return getSelectedChapters(state, options);
  if (typeof window !== "undefined" && typeof window.getSelectedChapters === "function") return window.getSelectedChapters(state, options);
  if (_stateModule && typeof _stateModule.getSelectedChapters === "function") return _stateModule.getSelectedChapters(state, options);
  return state && state.currentChapter ? [state.currentChapter] : [];
}

function _resolveSetSelectedChapters(chapterIds, state = AppState) {
  if (typeof setSelectedChapters === "function") return setSelectedChapters(chapterIds, state);
  if (typeof window !== "undefined" && typeof window.setSelectedChapters === "function") return window.setSelectedChapters(chapterIds, state);
  if (_stateModule && typeof _stateModule.setSelectedChapters === "function") return _stateModule.setSelectedChapters(chapterIds, state);
  return [];
}

function _resolveToggleChapterSelection(chapterId, state = AppState) {
  if (typeof toggleChapterSelection === "function") return toggleChapterSelection(chapterId, state);
  if (typeof window !== "undefined" && typeof window.toggleChapterSelection === "function") return window.toggleChapterSelection(chapterId, state);
  if (_stateModule && typeof _stateModule.toggleChapterSelection === "function") return _stateModule.toggleChapterSelection(chapterId, state);
  return [];
}

function _resolveToggleAllChapters(state = AppState) {
  if (typeof toggleAllChapterSelection === "function") return toggleAllChapterSelection(state);
  if (typeof window !== "undefined" && typeof window.toggleAllChapterSelection === "function") return window.toggleAllChapterSelection(state);
  if (_stateModule && typeof _stateModule.toggleAllChapterSelection === "function") return _stateModule.toggleAllChapterSelection(state);
  return [];
}

function _resolveSetChapterOrder(order, state = AppState) {
  if (typeof setChapterOrder === "function") return setChapterOrder(order, state);
  if (typeof window !== "undefined" && typeof window.setChapterOrder === "function") return window.setChapterOrder(order, state);
  if (_stateModule && typeof _stateModule.setChapterOrder === "function") return _stateModule.setChapterOrder(order, state);
  if (state) state.chapterOrder = order === "desc" ? "desc" : "asc";
  return state ? state.chapterOrder : "asc";
}

function renderChapterSelectorLists() {
  if (typeof document === "undefined" || typeof AppState === "undefined") return;
  const list = document.getElementById("chapter-dropdown-list");
  const pickerChecklist = document.getElementById("practice-chapters-checklist");
  const btnText = document.getElementById("chapter-dropdown-text");
  const practiceBtnText = document.getElementById("practice-chapters-btn-text");
  const countBadge = document.getElementById("practice-picker-count-badge");

  const checkIsAlpha = typeof isAlphabetChapter === "function"
    ? isAlphabetChapter
    : (_stateModule && typeof _stateModule.isAlphabetChapter === "function"
      ? _stateModule.isAlphabetChapter
      : (c) => c && (c.id === "kelley_01" || c.id === "bergmann_01" || (c.title && c.title.toLowerCase().includes("alfabeto"))));

  const escapeFn = typeof escapeHTML === "function" ? escapeHTML : (s) => String(s || "");
  const selectedChapters = _resolveGetSelectedChapters(AppState, { order: "asc" });
  const selectedIds = new Set(selectedChapters.map((c) => c && c.id));
  const currentOrder = AppState.chapterOrder || "asc";
  const orderLabel = currentOrder === "desc" ? "Última ➔ Primeira" : "Primeira ➔ Última";

  // Atualiza textos de resumo nos botões
  if (btnText) {
    if (selectedChapters.length === 1 && selectedChapters[0]) {
      btnText.textContent = selectedChapters[0].title;
      btnText.title = selectedChapters[0].title;
    } else if (selectedChapters.length > 1) {
      const titles = selectedChapters.map((c) => c.title).join(" • ");
      btnText.textContent = `${selectedChapters.length} capítulos selecionados (${orderLabel})`;
      btnText.title = titles;
    } else if (AppState.currentChapter) {
      btnText.textContent = AppState.currentChapter.title;
      btnText.title = AppState.currentChapter.title;
    }
  }

  const mobileLabel = document.getElementById("mobile-menu-toggle-label");
  if (mobileLabel) {
    mobileLabel.textContent = selectedChapters.length > 1
      ? `${selectedChapters.length} capítulos`
      : (selectedChapters[0] || AppState.currentChapter || {}).title || "Escolher capítulo";
  }

  if (practiceBtnText) {
    if (selectedChapters.length === 1 && selectedChapters[0]) {
      practiceBtnText.textContent = selectedChapters[0].title;
      practiceBtnText.title = selectedChapters[0].title;
    } else if (selectedChapters.length > 1) {
      practiceBtnText.textContent = `${selectedChapters.length} Capítulos (${orderLabel})`;
      practiceBtnText.title = selectedChapters.map((c) => c.title).join(" • ");
    }
  }

  if (countBadge) {
    countBadge.textContent = selectedChapters.length === 1
      ? "1 selecionado"
      : `${selectedChapters.length} selecionados`;
  }

  // 1. Renderiza dropdown global do topo (#chapter-dropdown-list)
  if (list) {
    list.innerHTML = "";

    const noteLi = document.createElement("li");
    noteLi.className = "chapter-list-note";
    noteLi.textContent = selectedChapters.length > 1
      ? `${selectedChapters.length} capítulos combinados. Marque as caixas para ajustar ou toque em um nome para estudar só ele.`
      : "Marque as caixas para combinar capítulos ou toque em um nome para estudar só ele.";
    list.appendChild(noteLi);

    const vocabChapters = (AppState.chapters || []).filter((c) => c && !checkIsAlpha(c));
    if (vocabChapters.length > 1) {
      const markedCount = vocabChapters.filter((c) => selectedIds.has(c.id)).length;
      const allMarked = markedCount === vocabChapters.length;
      const allLi = document.createElement("li");
      allLi.className = "chapter-option chapter-option--all";
      allLi.innerHTML = `
        <label class="chapter-option__all">
          <span class="chapter-option__toggle">
            <input type="checkbox" id="chapter-select-all" class="chapter-option__box"${allMarked ? " checked" : ""} />
          </span>
          <span class="chapter-option__text">
            <span class="chapter-option__title">${allMarked ? "Desmarcar todos" : "Selecionar todos"}</span>
            <span class="chapter-option__meta">${allMarked
              ? "O primeiro capítulo continua marcado"
              : `${markedCount} de ${vocabChapters.length} marcados`}</span>
          </span>
        </label>
      `;
      allLi.onclick = (e) => e.stopPropagation();

      const allBox = allLi.querySelector("#chapter-select-all");
      if (allBox) {
        allBox.indeterminate = markedCount > 0 && !allMarked;
        allBox.onchange = () => {
          if (!confirmLeaveActiveSession()) {
            renderChapterSelectorLists();
            return;
          }
          toggleAllPracticeChapters();
          const again = document.getElementById("chapter-select-all");
          if (again) again.focus();
        };
      }
      list.appendChild(allLi);
    }

    (AppState.chapters || []).forEach((chap) => {
      const li = document.createElement("li");
      const isAlpha = checkIsAlpha(chap);
      const isChecked = selectedIds.has(chap.id);
      const wordsCount = (chap.items || []).length;
      const sentsCount = (chap.sentences || []).length;
      const metaText = isAlpha
        ? "Jogos do alfabeto"
        : `${wordsCount} vocábulos${sentsCount > 0 ? ` • ${sentsCount} frases` : ""}`;

      li.className = `chapter-option${isChecked ? " is-selected" : ""}`;
      // O alfabeto tem jogos próprios e não se combina com outros capítulos
      const toggleHtml = isAlpha
        ? '<span class="chapter-option__toggle" aria-hidden="true"></span>'
        : `<label class="chapter-option__toggle">
            <input type="checkbox" class="chapter-option__box" data-chapter-id="${escapeFn(chap.id)}" aria-label="Incluir ${escapeFn(chap.title)} na sessão"${isChecked ? " checked" : ""} />
          </label>`;
      li.innerHTML = `
        ${toggleHtml}
        <button type="button" class="chapter-option__main">
          <span class="chapter-option__title">${escapeFn(chap.title)}</span>
          <span class="chapter-option__meta">${metaText}</span>
          ${isAlpha ? "" : `<span class="chapter-option__mastery" data-mastery-chapter="${escapeFn(chap.id)}">${masteryLabel(chap)}</span>`}
        </button>
      `;
      li.onclick = (e) => e.stopPropagation();

      const box = li.querySelector(".chapter-option__box");
      if (box) {
        box.onchange = () => {
          if (!confirmLeaveActiveSession()) {
            box.checked = !box.checked;
            return;
          }
          togglePracticeChapter(chap.id);
          const again = list.querySelector(`.chapter-option__box[data-chapter-id="${chap.id}"]`);
          if (again) again.focus();
        };
      }

      const mainBtn = li.querySelector(".chapter-option__main");
      if (mainBtn) {
        mainBtn.onclick = () => {
          if (!confirmLeaveActiveSession()) return;
          toggleDropdown(true);
          changeGlobalChapter(chap.id);
          if (typeof window !== "undefined" && window.innerWidth < 1024 && typeof toggleMobileMenu === "function") {
            toggleMobileMenu(false);
          }
        };
      }

      list.appendChild(li);
    });
  }

  updateMasteryStats();

  // 2. Renderiza checklist do seletor na barra de prática (#practice-chapters-checklist)
  if (pickerChecklist) {
    pickerChecklist.innerHTML = "";
    (AppState.chapters || []).forEach((chap) => {
      const isAlpha = checkIsAlpha(chap);
      if (isAlpha) return; // A barra padrão exibe os capítulos de vocabulário/gramática
      const isChecked = selectedIds.has(chap.id);
      const wordsCount = (chap.items || []).length;
      const sentsCount = (chap.sentences || []).length;

      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", isChecked ? "true" : "false");
      li.setAttribute("tabindex", "0");
      li.className = `px-3.5 py-2.5 text-xs cursor-pointer transition border-l-4 flex items-center justify-between gap-2 ${isChecked ? "bg-brand-950/40 text-white font-semibold border-brand-500" : "text-slate-300 hover:bg-slate-800/70 hover:text-white border-transparent"}`;
      li.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="w-4 h-4 rounded flex items-center justify-center border text-[11px] shrink-0 transition ${isChecked ? "bg-brand-600 border-brand-400 text-white font-bold" : "bg-slate-950 border-slate-700 text-transparent"}">✓</span>
          <div class="truncate">
            <div class="truncate">${escapeFn(chap.title)}</div>
            <div class="text-[10px] text-slate-500 font-normal">${wordsCount} vocábulos${sentsCount > 0 ? ` • ${sentsCount} frases` : ""}</div>
          </div>
        </div>
        <button type="button" class="btn-picker-only shrink-0 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-brand-600 text-[10px] text-slate-300 hover:text-white font-medium transition" title="Selecionar somente este capítulo">Só este</button>
      `;
      const onlyBtn = li.querySelector(".btn-picker-only");
      if (onlyBtn) {
        onlyBtn.onclick = (e) => {
          e.stopPropagation();
          togglePracticeChapterPicker(true);
          changeGlobalChapter(chap.id);
        };
      }
      li.onclick = (e) => {
        e.stopPropagation();
        togglePracticeChapter(chap.id);
      };
      li.onkeydown = _activateOnEnterOrSpace;
      pickerChecklist.appendChild(li);
    });
  }

  updatePracticeOrderUI();
  updatePracticeOptionsSummary();
  updateReviewDueBadge();
}

function _activateOnEnterOrSpace(e) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.click();
  }
}

/**
 * Pede confirmação antes de sair de um simulado em andamento, cujas respostas seriam perdidas.
 * @returns {boolean} true quando é seguro prosseguir
 */
function confirmLeaveActiveSession() {
  if (typeof document === "undefined" || typeof window === "undefined") return true;
  const active = document.getElementById("assessment-active");
  if (!active || active.classList.contains("hidden")) return true;
  if (typeof window.confirm !== "function") return true;
  return window.confirm("Sair do simulado agora? As respostas desta prova serão perdidas.");
}

/* ================= OPÇÕES DA SESSÃO DE PRÁTICA ================= */
function togglePracticeOptions(forceState) {
  if (typeof document === "undefined") return;
  const panel = document.getElementById("practice-options-panel");
  const btn = document.getElementById("btn-practice-options");
  if (!panel) return;
  const shouldOpen = typeof forceState === "boolean" ? forceState : panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !shouldOpen);
  if (btn) btn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
}

function updatePracticeOptionsSummary() {
  if (typeof document === "undefined" || typeof AppState === "undefined") return;
  const summary = document.getElementById("practice-options-summary");
  if (!summary) return;

  const count = _resolveGetSelectedChapters(AppState, { order: "asc" }).length;
  const parts = [count > 1 ? `${count} capítulos` : "1 capítulo"];
  if (count > 1) parts.push(AppState.chapterOrder === "desc" ? "Última ➔ Primeira" : "Primeira ➔ Última");

  const select = document.getElementById("practice-category-select");
  if (AppState.exerciseMode === "typing" && AppState.practiceCategory && AppState.practiceCategory !== "all" && select && select.selectedOptions && select.selectedOptions[0]) {
    parts.push(select.selectedOptions[0].textContent.replace(/\s*\(\d+\)\s*$/, ""));
  }
  summary.textContent = parts.join(" · ");
}

/* ================= ERROS PENDENTES DE REVISÃO ================= */
function countPendingErrors() {
  if (typeof window !== "undefined" && typeof window.getErrorCards === "function") {
    return window.getErrorCards().length;
  }
  return 0;
}

function masteryLabel(chapter) {
  if (typeof window === "undefined" || typeof window.getMasterySummary !== "function") return "";
  const { mastered, total } = window.getMasterySummary([chapter]);
  return mastered > 0 ? `${mastered} de ${total} dominados` : "";
}

/** Atualiza o domínio na barra lateral e na lista de capítulos */
function updateMasteryStats() {
  if (typeof document === "undefined" || typeof window === "undefined" || typeof window.getMasterySummary !== "function") return;
  const { mastered, total, review } = window.getMasterySummary(_resolveGetSelectedChapters(AppState, { order: "asc" }));
  const masteredEl = document.getElementById("stat-mastered");
  const reviewEl = document.getElementById("stat-review");
  if (masteredEl) masteredEl.textContent = `${mastered}/${total}`;
  if (reviewEl) reviewEl.textContent = review;

  if (typeof document.querySelectorAll !== "function") return;
  document.querySelectorAll("[data-mastery-chapter]").forEach((el) => {
    const chapter = (AppState.chapters || []).find((c) => c && c.id === el.dataset.masteryChapter);
    if (chapter) el.textContent = masteryLabel(chapter);
  });
}

function updateReviewDueBadge() {
  if (typeof document === "undefined") return;
  updateMasteryStats();
  const errors = countPendingErrors();
  const label = errors === 1 ? "1 palavra errada para revisar" : `${errors} palavras erradas para revisar`;
  const badge = document.getElementById("nav-review-badge");
  const cardStat = document.getElementById("review-due-card");
  const errorsBtn = document.getElementById("btn-review-errors");
  const errorsCount = document.getElementById("review-errors-count");
  if (badge) {
    badge.textContent = errors > 99 ? "99+" : String(errors);
    badge.classList.toggle("hidden", errors === 0);
    badge.setAttribute("aria-label", label);
    badge.title = `${label}. Abra Avaliar e use a Revisão de Erros para limpar.`;
  }
  if (cardStat) {
    cardStat.textContent = `${label}. Marque “Lembrei” ou “Fácil” para limpar o aviso.`;
    cardStat.classList.toggle("hidden", errors === 0);
  }
  if (errorsBtn) errorsBtn.disabled = errors === 0;
  if (errorsCount) errorsCount.textContent = errors > 0 ? `(${errors})` : "";
}

function setupGlobalChapterDropdown() {
  if (typeof AppState === "undefined") return;

  // Restaura ordenação salva por idioma
  if (typeof localStorage !== "undefined") {
    const savedOrder = localStorage.getItem(`gamida_chapterOrder_${AppState.language}`);
    if (savedOrder === "asc" || savedOrder === "desc") {
      AppState.chapterOrder = savedOrder;
    }
  }

  // Restaura capítulos selecionados salvos por idioma
  let restoredIds = null;
  if (typeof localStorage !== "undefined") {
    try {
      const rawSelected = localStorage.getItem(`gamida_selectedChaps_${AppState.language}`);
      if (rawSelected) {
        const parsed = JSON.parse(rawSelected);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id) => (AppState.chapters || []).some((c) => c && c.id === id));
          if (valid.length > 0) restoredIds = valid;
        }
      }
    } catch (_) {}
  }

  const savedChap = typeof localStorage !== "undefined"
    ? localStorage.getItem(`gamida_lastChap_${AppState.language}`)
    : null;
  const activeChap =
    (AppState.chapters || []).find((c) => c.id === savedChap) ||
    (AppState.chapters || [])[0];

  if (restoredIds && restoredIds.length > 1) {
    AppState.isPracticeCumulative = true;
    AppState.isVocabCumulative = true;
    _resolveSetSelectedChapters(restoredIds, AppState);
    refreshAfterChapterSelectionChange();
  } else if (activeChap) {
    changeGlobalChapter(activeChap.id);
  } else {
    renderChapterSelectorLists();
  }
}

function toggleDropdown(forceClose = false) {
  const list = document.getElementById("chapter-dropdown-list");
  const btn = document.querySelector("#custom-chapter-selector > button");
  if (!list) return;
  if (forceClose) {
    list.classList.add("hidden");
  } else {
    list.classList.toggle("hidden");
  }
  if (btn) {
    const isExpanded = !list.classList.contains("hidden");
    btn.setAttribute("aria-expanded", String(isExpanded));
  }
}

function togglePracticeChapterPicker(eventOrForceClose = false) {
  if (eventOrForceClose && typeof eventOrForceClose.stopPropagation === "function") {
    eventOrForceClose.stopPropagation();
  }
  const forceClose = typeof eventOrForceClose === "boolean" ? eventOrForceClose : false;
  const menu = document.getElementById("practice-chapters-dropdown-menu");
  const btn = document.getElementById("btn-practice-chapter-picker");
  if (!menu) return;
  if (forceClose) {
    menu.classList.add("hidden");
  } else {
    menu.classList.toggle("hidden");
  }
  if (btn) {
    const isExpanded = !menu.classList.contains("hidden");
    btn.setAttribute("aria-expanded", String(isExpanded));
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    toggleDropdown(true);
    togglePracticeChapterPicker(true);
    if (isMobileMenuExpanded) toggleMobileMenu(false);
  });

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("custom-chapter-selector");
    if (dropdown && !dropdown.contains(e.target)) {
      toggleDropdown(true);
    }
    const pickerWrapper = document.getElementById("practice-chapter-picker-wrapper");
    if (pickerWrapper && !pickerWrapper.contains(e.target)) {
      togglePracticeChapterPicker(true);
    }
  });
}

function refreshAfterChapterSelectionChange() {
  if (typeof AppState === "undefined") return;

  if (typeof resetToDashboard === "function") {
    try {
      resetToDashboard();
    } catch (e) {
      console.warn("Aviso ao resetar sessões anteriores:", e);
    }
  }

  renderChapterSelectorLists();
  if (typeof updatePracticeScopeUI === "function") updatePracticeScopeUI();
  updateVocabScopeUI();
  updatePracticeOrderUI();

  // 1. Atualiza Praticar
  AppState.currentQuestionIndex = 0;
  AppState.currentQuestion = null;
  if (typeof resetStats === "function") resetStats();
  if (typeof updatePracticeChapterView === "function") updatePracticeChapterView();
  if (typeof updatePracticeCategoryFilterUI === "function") updatePracticeCategoryFilterUI();
  if (typeof buildPracticeQueue === "function") buildPracticeQueue();
  if (typeof renderCurrentQuestion === "function") renderCurrentQuestion();

  // 2. Atualiza Dicionário
  lastRenderedVocabChapter = null;
  if (typeof renderVocabTable === "function") renderVocabTable();

  // 3. Atualiza Paradigmas
  if (typeof updateParadigmsVisibility === "function") updateParadigmsVisibility();
  const parSelect = document.getElementById("paradigm-select");
  if (parSelect && AppState.currentChapter) {
    parSelect.innerHTML = '<option value="">Selecione a tabela ou grafo...</option>';
    const selectedChaps = _resolveGetSelectedChapters(AppState);
    let allParadigms = [];
    selectedChaps.forEach((ch) => {
      if (ch && Array.isArray(ch.paradigms)) {
        ch.paradigms.forEach((p) => allParadigms.push(p));
      }
    });
    if (allParadigms.length === 0 && AppState.currentChapter.paradigms) {
      allParadigms = AppState.currentChapter.paradigms;
    }
    allParadigms.forEach((par, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = par.title;
      parSelect.appendChild(opt);
    });
  }
  if (typeof resetParadigmBoard === "function") resetParadigmBoard();
}

function changeGlobalChapter(chapterId) {
  if (!chapterId || typeof AppState === "undefined") return;

  const found = (AppState.chapters || []).find((c) => c.id === chapterId);
  if (found) {
    AppState.currentChapter = found;
    AppState.activeChapterId = found.id;
    AppState.isPracticeCumulative = false;
    AppState.isVocabCumulative = false;
    _resolveSetSelectedChapters([found.id], AppState);
    refreshAfterChapterSelectionChange();
  }
}

function togglePracticeChapter(chapterId) {
  if (!chapterId || typeof AppState === "undefined") return;
  _resolveToggleChapterSelection(chapterId, AppState);
  refreshAfterChapterSelectionChange();
}

function selectAllPracticeChapters() {
  if (typeof AppState === "undefined") return;
  const checkIsAlpha = typeof isAlphabetChapter === "function"
    ? isAlphabetChapter
    : (c) => c && (c.id === "kelley_01" || c.id === "bergmann_01" || (c.title && c.title.toLowerCase().includes("alfabeto")));
  const vocabIds = (AppState.chapters || [])
    .filter((c) => c && !checkIsAlpha(c))
    .map((c) => c.id);
  const targetIds = vocabIds.length > 0 ? vocabIds : (AppState.chapters || []).map((c) => c.id);
  AppState.isPracticeCumulative = true;
  AppState.isVocabCumulative = true;
  _resolveSetSelectedChapters(targetIds, AppState);
  refreshAfterChapterSelectionChange();
}

function toggleAllPracticeChapters() {
  if (typeof AppState === "undefined") return;
  _resolveToggleAllChapters(AppState);
  refreshAfterChapterSelectionChange();
}

function _setSegmentActive(btn, isActive) {
  if (!btn) return;
  btn.className = isActive ? "seg-btn is-active" : "seg-btn";
  if (typeof btn.setAttribute === "function") btn.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function updatePracticeOrderUI() {
  if (typeof document === "undefined" || typeof AppState === "undefined") return;
  const isDesc = AppState.chapterOrder === "desc";
  const pairs = [
    ["order-asc", "order-desc"],
    ["vocab-order-asc", "vocab-order-desc"],
  ];
  pairs.forEach(([ascId, descId]) => {
    const btnAsc = document.getElementById(ascId);
    const btnDesc = document.getElementById(descId);
    if (btnAsc && btnDesc) {
      _setSegmentActive(btnDesc, isDesc);
      _setSegmentActive(btnAsc, !isDesc);
    }
  });
}

function setPracticeChapterOrder(order) {
  if (typeof AppState === "undefined") return "asc";
  _resolveSetChapterOrder(order, AppState);
  renderChapterSelectorLists();
  updatePracticeOrderUI();
  AppState.currentQuestionIndex = 0;
  if (typeof resetStats === "function") resetStats();
  if (typeof buildPracticeQueue === "function") buildPracticeQueue();
  if (typeof renderCurrentQuestion === "function") renderCurrentQuestion();
  lastRenderedVocabChapter = null;
  if (typeof renderVocabTable === "function") renderVocabTable();
  return AppState.chapterOrder;
}

/* ================= VOCABULARY DICTIONARY TABLE ================= */
let lastRenderedVocabChapter = null;

function setVocabCumulative(isCumulative) {
  if (typeof AppState !== "undefined") {
    AppState.isVocabCumulative = !!isCumulative;
    const chapters = AppState.chapters || [];
    if (chapters.length > 0 && AppState.currentChapter) {
      const activeIdx = chapters.findIndex((c) => c && c.id === AppState.currentChapter.id);
      if (isCumulative) {
        const checkIsAlpha = typeof isAlphabetChapter === "function"
          ? isAlphabetChapter
          : (c) => c && (c.id === "kelley_01" || c.id === "bergmann_01" || (c.title && c.title.toLowerCase().includes("alfabeto")));
        let cumul = chapters.slice(0, activeIdx >= 0 ? activeIdx + 1 : chapters.length);
        if (activeIdx > 0) cumul = cumul.filter((c) => !checkIsAlpha(c));
        _resolveSetSelectedChapters(cumul.map((c) => c.id), AppState);
      } else {
        _resolveSetSelectedChapters([AppState.currentChapter.id], AppState);
      }
      renderChapterSelectorLists();
    }
  }
  updateVocabScopeUI();
  updateVocabCategoryFilterUI();
  lastRenderedVocabChapter = null;
  renderVocabTable();
}

function setVocabCategory(catId) {
  if (typeof AppState !== "undefined") {
    AppState.vocabCategory = catId || "all";
  }
  lastRenderedVocabChapter = null;
  renderVocabTable();
}

function updateVocabScopeUI() {
  if (typeof document === "undefined") return;
  const btnSingle = document.getElementById("vocab-scope-single");
  const btnCumulative = document.getElementById("vocab-scope-cumulative");
  const btnAll = document.getElementById("vocab-scope-all");
  if (!btnSingle || !btnCumulative) return;

  const selectedChaps = typeof AppState !== "undefined" ? _resolveGetSelectedChapters(AppState, { forVocab: true }) : [];
  const totalVocabChaps = typeof AppState !== "undefined" && Array.isArray(AppState.chapters)
    ? AppState.chapters.filter((c) => c && c.id !== "kelley_01" && c.id !== "bergmann_01").length
    : 0;
  const isAll = totalVocabChaps > 1 && selectedChaps.length === totalVocabChaps;
  const isCumulative = typeof AppState !== "undefined" && (AppState.isVocabCumulative || selectedChaps.length > 1);

  const showAll = !!(isAll && btnAll);
  _setSegmentActive(btnAll, showAll);
  _setSegmentActive(btnCumulative, !showAll && isCumulative);
  _setSegmentActive(btnSingle, !showAll && !isCumulative);
}

function updateVocabCategoryFilterUI() {
  if (typeof document === "undefined") return;
  const select = document.getElementById("vocab-category-select");
  if (!select) return;

  const getCatsFn = typeof getAvailableVocabCategories === "function"
    ? getAvailableVocabCategories
    : (typeof window !== "undefined" && window.getAvailableVocabCategories
      ? window.getAvailableVocabCategories
      : () => ({ totalItems: 0, totalWords: 0, totalSentences: 0, totalFavorites: 0, categories: [] }));

  const { totalItems, totalWords, totalSentences, totalFavorites = 0, categories } = getCatsFn();

  const currentVal = (typeof AppState !== "undefined" && AppState.vocabCategory) || "all";
  const isValidSelection =
    currentVal === "all" ||
    currentVal === "favorites" ||
    currentVal === "words" ||
    currentVal === "sentences" ||
    categories.some((c) => c.id === currentVal);

  if (!isValidSelection && typeof AppState !== "undefined") {
    AppState.vocabCategory = "all";
  }

  select.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = `Todos os itens (${totalItems})`;
  select.appendChild(optAll);

  const optFav = document.createElement("option");
  optFav.value = "favorites";
  optFav.textContent = `⭐ Apenas Favoritos (${totalFavorites})`;
  select.appendChild(optFav);

  if (totalWords > 0) {
    const optWords = document.createElement("option");
    optWords.value = "words";
    optWords.textContent = `Apenas Palavras (${totalWords})`;
    select.appendChild(optWords);
  }

  if (totalSentences > 0) {
    const optSentences = document.createElement("option");
    optSentences.value = "sentences";
    optSentences.textContent = `Apenas Frases / Expr. (${totalSentences})`;
    select.appendChild(optSentences);
  }

  if (categories.length > 0) {
    const optGroup = document.createElement("optgroup");
    optGroup.label = "Classes Gramaticais";
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = `${cat.label} (${cat.count})`;
      optGroup.appendChild(opt);
    });
    select.appendChild(optGroup);
  }

  select.value = (typeof AppState !== "undefined" && AppState.vocabCategory) || "all";
}

/**
 * Alterna o estado de favorito de um vocábulo ou frase e persiste no storage
 * @param {Object} item
 */
function toggleItemFavorite(item) {
  if (!item || typeof AppState === "undefined") return;
  item.favorite = !item.favorite;

  // Marca o capítulo atual como modificado pelo aluno
  if (AppState.currentChapter) {
    AppState.currentChapter._userModified = true;
  }

  // Sincroniza em todos os capítulos caso o mesmo termo apareça
  if (Array.isArray(AppState.chapters)) {
    const termFn = typeof getTerm === "function" ? getTerm : (i) => i.term || i.hebrew || "";
    const targetTerm = termFn(item);
    AppState.chapters.forEach((chap) => {
      const matchWord = (chap.items || []).find((i) => termFn(i) === targetTerm);
      if (matchWord) {
        matchWord.favorite = item.favorite;
        chap._userModified = true;
      }
      const matchSent = (chap.sentences || []).find((s) => termFn(s) === targetTerm);
      if (matchSent) {
        matchSent.favorite = item.favorite;
        chap._userModified = true;
      }
    });
  }

  // Persiste no storage unificado
  if (typeof saveChaptersToStorage === "function") {
    saveChaptersToStorage();
  } else if (typeof window !== "undefined" && typeof window.saveChaptersToStorage === "function") {
    window.saveChaptersToStorage();
  }

  // Se o filtro ativo no dicionário for 'favorites', re-renderiza a tabela
  if (AppState.vocabCategory === "favorites") {
    lastRenderedVocabChapter = null;
    renderVocabTable();
  } else {
    // Atualiza contadores nas opções do filtro
    updateVocabCategoryFilterUI();
    // Atualiza visualmente o botão na linha do DOM correspondente
    if (typeof document !== "undefined") {
      const rows = document.querySelectorAll("#vocab-table-body tr");
      const termFn = typeof getTerm === "function" ? getTerm : (i) => i.term || i.hebrew || "";
      const targetTerm = termFn(item);
      rows.forEach((r) => {
        const firstCell = r.querySelector("td");
        if (firstCell && firstCell.textContent.trim() === targetTerm.trim()) {
          const btn = r.querySelector(".btn-vocab-favorite");
          if (btn) {
            const isFav = !!item.favorite;
            btn.innerHTML = isFav ? "⭐" : "☆";
            btn.className = `btn-vocab-favorite fav-btn${isFav ? " is-on" : ""}`;
            btn.title = isFav ? "Remover dos favoritos" : "Marcar como favorito";
          }
          const normFn = typeof normalizeText === "function" ? normalizeText : (s) => String(s || "").toLowerCase().trim();
          const translitText = item.transliteration || "-";
          const typeText = item.type || "Geral";
          let translationsText = Array.isArray(item.translations) ? item.translations.join(" / ") : item.translations || "";
          r.setAttribute("data-search", normFn(`${targetTerm} ${translitText} ${translationsText} ${typeText} ${Array.isArray(item.tokens) ? "" : item.notes || ""} ${item.favorite ? "favorito favorita estrela star" : ""}`));
        }
      });
    }
  }

  // Se a interface de prática estiver ativa e no modo de favoritas, sincroniza
  if (AppState.exerciseMode === "favorites") {
    if (typeof buildPracticeQueue === "function") buildPracticeQueue();
    else if (typeof window !== "undefined" && typeof window.buildPracticeQueue === "function") window.buildPracticeQueue();

    if (typeof renderCurrentQuestion === "function") renderCurrentQuestion();
    else if (typeof window !== "undefined" && typeof window.renderCurrentQuestion === "function") window.renderCurrentQuestion();
  }
}

function renderVocabTable() {
  const tbody = document.getElementById("vocab-table-body");
  if (!tbody || typeof AppState === "undefined" || !AppState.currentChapter) return;

  const selectedChapters = _resolveGetSelectedChapters(AppState, {
    forVocab: true,
    order: AppState.chapterOrder || "asc",
  });
  const selectedKey = selectedChapters.map((c) => c && c.id).join(",");
  const cacheKey = `${AppState.currentChapter.id}_sel_${selectedKey}_ord_${AppState.chapterOrder || "asc"}_cumul_${!!AppState.isVocabCumulative}_cat_${AppState.vocabCategory || "all"}`;
  if (lastRenderedVocabChapter === cacheKey) return;

  // Atualiza controles de UI de filtro
  updateVocabScopeUI();
  updatePracticeOrderUI();
  updateVocabCategoryFilterUI();

  tbody.innerHTML = "";

  let wordsPool = [];
  let sentencesPool = [];

  selectedChapters.forEach((chap) => {
    if (!chap) return;
    (chap.items || []).forEach((item) => wordsPool.push(item));
    (chap.sentences || []).forEach((s) => sentencesPool.push(s));
  });

  const termFn = typeof getTerm === "function"
    ? getTerm
    : (item) => item.term || item.hebrew || "";

  // Deduplica itens por termo único
  wordsPool = Array.from(new Map(wordsPool.map((item) => [termFn(item), item])).values());
  sentencesPool = Array.from(new Map(sentencesPool.map((item) => [termFn(item), item])).values());

  const categoryFilter = AppState.vocabCategory || "all";
  let displayList = [];

  const matchCatFn = typeof matchItemCategory === "function"
    ? matchItemCategory
    : (typeof window !== "undefined" && window.matchItemCategory ? window.matchItemCategory : () => true);

  if (categoryFilter === "all") {
    displayList = [...wordsPool, ...sentencesPool];
  } else if (categoryFilter === "favorites") {
    displayList = [...wordsPool, ...sentencesPool].filter((item) => !!item.favorite);
  } else if (categoryFilter === "words") {
    displayList = [...wordsPool];
  } else if (categoryFilter === "sentences") {
    displayList = [...sentencesPool];
  } else {
    // Filtro por classe gramatical específica (substantivo, verbo, etc.)
    displayList = wordsPool.filter((item) => matchCatFn(item, categoryFilter));
  }

  const escapeFn = typeof escapeHTML === "function"
    ? escapeHTML
    : (str) => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const hasFragment = typeof document !== "undefined" && typeof document.createDocumentFragment === "function";
  const fragment = hasFragment ? document.createDocumentFragment() : tbody;
  const normFn = typeof normalizeText === "function"
    ? normalizeText
    : (str) => String(str || "").toLowerCase().trim();

  if (displayList.length === 0) {
    const trEmpty = document.createElement("tr");
    const emptyMsg = categoryFilter === "favorites"
      ? "Nenhum item marcado como favorito ainda. Clique no ícone de estrela (☆) para favoritar palavras e frases!"
      : "Nenhum item encontrado para os filtros selecionados.";
    trEmpty.className = "vocab-empty";
    trEmpty.innerHTML = `
      <td colspan="5" class="px-6 py-10 text-center text-slate-400 text-sm">
        ${emptyMsg}
      </td>
    `;
    fragment.appendChild(trEmpty);
  } else {
    displayList.forEach((item) => {
      const tr = document.createElement("tr");
      tr.className = "vocab-row hover:bg-slate-800/40 transition";

      const isSentence = item.type === "Frase" || item.type === "Expressão" || (Array.isArray(item.tokens) && item.tokens.length > 0);
      const canAnalyze = (AppState.language === "hebrew" || AppState.language === "greek") && ((item.tokens && item.tokens.length > 0) || isSentence);
      const termText = termFn(item);
      const translitText = item.transliteration || "-";
      const typeText = item.type || "Geral";
      const isFavorite = !!item.favorite;
      let translationsText = Array.isArray(item.translations)
        ? item.translations.join(" / ")
        : item.translations || "Tradução ausente";

      // Cache de busca no atributo data-search para evitar layout thrashing ao digitar
      const searchHaystack = normFn(`${termText} ${translitText} ${translationsText} ${typeText} ${isSentence ? "" : item.notes || ""} ${isFavorite ? "favorito favorita estrela star" : ""}`);
      tr.setAttribute("data-search", searchHaystack);

      const textClass = AppState.language === "hebrew"
        ? "hebrew-text text-2xl md:text-3xl"
        : "greek-text text-lg md:text-xl";

      tr.innerHTML = `
        <td class="vocab-cell-term px-5 py-3 ${textClass} font-bold text-white">${escapeFn(termText)}</td>
        <td class="vocab-cell-translit px-5 py-3 font-mono text-xs text-amber-400">${escapeFn(translitText)}</td>
        <td class="vocab-cell-trans px-5 py-3 font-medium text-slate-200">${escapeFn(translationsText)}${!isSentence && item.notes ? `<span class="vocab-note">${escapeFn(item.notes)}</span>` : ""}</td>
        <td class="vocab-cell-type px-5 py-3">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full ${isSentence ? "bg-indigo-900/60 border-indigo-700 text-indigo-300" : "bg-slate-800 border-slate-700 text-slate-400"} border text-[10px] font-mono">
              ${escapeFn(typeText)}
            </span>
            ${canAnalyze ? `
              <button
                type="button"
                class="btn-vocab-analyze px-2.5 py-1 rounded-full bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-[10px] text-indigo-300 hover:text-white transition cursor-pointer font-mono inline-flex items-center gap-1 shadow-sm"
                title="${AppState.language === "greek" ? "Abrir Análise Morfológica em 4 Passos (Johannes Bergmann)" : "Abrir Análise Morfossintática Granular (Page Kelley)"}"
              >
                Análise
              </button>
            ` : ""}
          </div>
        </td>
        <td class="vocab-cell-fav px-3 py-3 text-center">
          <button
            type="button"
            class="btn-vocab-favorite fav-btn${isFavorite ? " is-on" : ""}"
            title="${isFavorite ? "Remover dos favoritos" : "Marcar como favorito"}"
            aria-label="${isFavorite ? "Desfavoritar" : "Favoritar"}"
          >
            ${isFavorite ? "⭐" : "☆"}
          </button>
        </td>
      `;

      const btnFav = tr.querySelector(".btn-vocab-favorite");
      if (btnFav) {
        btnFav.onclick = (e) => {
          e.stopPropagation();
          toggleItemFavorite(item);
        };
      }

      if (canAnalyze) {
        const btnAnalyze = tr.querySelector(".btn-vocab-analyze");
        if (btnAnalyze) {
          btnAnalyze.onclick = (e) => {
            e.stopPropagation();
            if (typeof openSentenceAnalysisModal === "function") {
              openSentenceAnalysisModal(item);
            } else if (typeof window !== "undefined" && window.SentenceAnalysisModule && typeof window.SentenceAnalysisModule.openSentenceAnalysisModal === "function") {
              window.SentenceAnalysisModule.openSentenceAnalysisModal(item);
            }
          };
        }
      }

      fragment.appendChild(tr);
    });
  }

  // Paradigmas no final da tabela (apenas se não estiver filtrando estritamente frases)
  if (categoryFilter !== "sentences") {
    let paradigmsToRender = [];
    selectedChapters.forEach((chap) => {
      if (chap && chap.paradigms && chap.paradigms.length > 0) {
        chap.paradigms.forEach((p) => paradigmsToRender.push(p));
      }
    });

    if (paradigmsToRender.length > 0) {
      paradigmsToRender.forEach((paradigm) => {
        const trParadigm = document.createElement("tr");
        trParadigm.className = "paradigm-row bg-slate-900/10";
        trParadigm.setAttribute("data-search", normFn(paradigm.title || paradigm.name || "paradigma"));

        const tdParadigm = document.createElement("td");
        tdParadigm.colSpan = 5;
        tdParadigm.className = "p-2 md:p-6 border-t border-slate-800/80";

        if (paradigm.type === "table" && typeof getStaticParadigmTableHTML === "function") {
          tdParadigm.innerHTML = getStaticParadigmTableHTML(paradigm);
        } else if (paradigm.type === "diagram" && typeof getStaticDiagramHTML === "function") {
          tdParadigm.innerHTML = getStaticDiagramHTML(paradigm);
        }

        trParadigm.appendChild(tdParadigm);
        fragment.appendChild(trParadigm);
      });
    }
  }

  // Inserção atômica em lote (reduz reflow a uma única operação)
  if (hasFragment) {
    tbody.appendChild(fragment);
  }

  lastRenderedVocabChapter = cacheKey;

  // Aplica filtro textual existente após desenhar linhas
  filterVocabTable(true);
}

let _vocabFilterTimeout = null;

function filterVocabTable(immediate = false) {
  const isInputEvent = typeof window !== "undefined" && window.event && window.event.type === "input";
  const shouldDebounce = !immediate && isInputEvent;

  const runFilter = () => {
    _vocabFilterTimeout = null;
    const searchInput = document.getElementById("vocab-search");
    if (!searchInput) return;
    const normFn = typeof normalizeText === "function"
      ? normalizeText
      : (str) => String(str || "").toLowerCase().trim();
    const query = normFn(searchInput.value);

    const rows = document.querySelectorAll("#vocab-table-body tr");
    let visibleItems = 0;
    rows.forEach((tr) => {
      const cached = tr.getAttribute("data-search");
      const isMatch = cached !== null
        ? (!query || cached.includes(query))
        : (!query || normFn(tr.textContent).includes(query));
      tr.style.display = isMatch ? "" : "none";
      if (isMatch && tr.classList && tr.classList.contains("vocab-row")) visibleItems++;
    });

    const countEl = document.getElementById("vocab-result-count");
    if (countEl) countEl.textContent = visibleItems === 1 ? "1 item" : `${visibleItems} itens`;
    const emptyEl = document.getElementById("vocab-empty-search");
    if (emptyEl) emptyEl.classList.toggle("hidden", !(query && visibleItems === 0));
  };

  if (shouldDebounce) {
    if (_vocabFilterTimeout) clearTimeout(_vocabFilterTimeout);
    _vocabFilterTimeout = setTimeout(runFilter, 100);
  } else {
    if (_vocabFilterTimeout) {
      clearTimeout(_vocabFilterTimeout);
      _vocabFilterTimeout = null;
    }
    runFilter();
  }
}

function applyLanguageUI() {
  if (typeof document === "undefined") return;
  const logo = document.getElementById("app-logo-btn");
  const subtitle = document.getElementById("app-subtitle");
  const footnoteEl = document.getElementById("app-grammar-footnote");
  const langSwitch = document.getElementById("app-language-switch");

  if (document.documentElement && typeof document.documentElement.setAttribute === "function") {
    document.documentElement.setAttribute("data-lang", AppState.language);
  }
  if (langSwitch) {
    langSwitch.setAttribute(
      "aria-label",
      AppState.language === "hebrew"
        ? "Idioma atual: Hebraico. Trocar para Grego"
        : "Idioma atual: Grego. Trocar para Hebraico",
    );
  }

  const textElements = [
    document.getElementById("hebrew-prompt"),
    document.getElementById("alphabet-target-glyph"),
    document.getElementById("assess-hebrew"),
    document.getElementById("anki-hebrew"),
    document.getElementById("survival-hebrew"),
    document.getElementById("surv-last-heb"),
  ];

  if (AppState.language === "hebrew") {
    if (logo) {
      logo.textContent = "א";
    }
    if (subtitle) subtitle.textContent = "Treinador de Hebraico";

    if (footnoteEl) {
      footnoteEl.innerHTML =
        'Este sistema é uma ferramenta complementar de estudo e prática que segue a <strong class="text-slate-200 font-semibold">"Gramática do Hebraico Bíblico"</strong> de <strong class="text-slate-200 font-semibold">Page H. Kelley</strong> (Editora Sinodal)';
    }

    textElements.forEach((el) => {
      if (el) {
        el.classList.remove("greek-text");
        el.classList.add("hebrew-text");
      }
    });
  } else {
    if (logo) {
      logo.textContent = "α";
    }
    if (subtitle) subtitle.textContent = "Treinador de Grego Koiné";

    if (footnoteEl) {
      footnoteEl.innerHTML =
        'Este sistema é uma ferramenta complementar de estudo e prática que segue a <strong class="text-slate-200 font-semibold">"Gramática do Grego do Novo Testamento"</strong> de <strong class="text-slate-200 font-semibold">Johannes Bergmann</strong> (Editora Thomas Nelson Brasil)';
    }

    textElements.forEach((el) => {
      if (el) {
        el.classList.remove("hebrew-text");
        el.classList.add("greek-text");
      }
    });
  }
}

function toggleLanguage(targetLang = null) {
  if (targetLang === "hebrew" || targetLang === "greek") {
    AppState.language = targetLang;
  } else {
    AppState.language = AppState.language === "hebrew" ? "greek" : "hebrew";
  }
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("gamida_language", AppState.language);
    } catch (err) {
      console.warn("Aviso ao salvar idioma no localStorage:", err);
    }
  }
  if (typeof resetStats === "function") resetStats();
  AppState.practiceCategory = "all";
  AppState.isPracticeCumulative = false;
  lastRenderedVocabChapter = null;
  applyLanguageUI();
  if (typeof setupGlobalChapterDropdown === "function") {
    setupGlobalChapterDropdown();
  }
  return AppState.language;
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
  window.renderChapterSelectorLists = renderChapterSelectorLists;
  window.toggleDropdown = toggleDropdown;
  window.togglePracticeChapterPicker = togglePracticeChapterPicker;
  window.changeGlobalChapter = changeGlobalChapter;
  window.togglePracticeChapter = togglePracticeChapter;
  window.selectAllPracticeChapters = selectAllPracticeChapters;
  window.toggleAllPracticeChapters = toggleAllPracticeChapters;
  window.setPracticeChapterOrder = setPracticeChapterOrder;
  window.updatePracticeOrderUI = updatePracticeOrderUI;
  window.lastRenderedVocabChapter = lastRenderedVocabChapter;
  window.setVocabCumulative = setVocabCumulative;
  window.setVocabCategory = setVocabCategory;
  window.updateVocabScopeUI = updateVocabScopeUI;
  window.updateVocabCategoryFilterUI = updateVocabCategoryFilterUI;
  window.renderVocabTable = renderVocabTable;
  window.filterVocabTable = filterVocabTable;
  window.toggleItemFavorite = toggleItemFavorite;
  window.applyLanguageUI = applyLanguageUI;
  window.toggleLanguage = toggleLanguage;
  window.togglePracticeOptions = togglePracticeOptions;
  window.updatePracticeOptionsSummary = updatePracticeOptionsSummary;
  window.updateReviewDueBadge = updateReviewDueBadge;
  window.confirmLeaveActiveSession = confirmLeaveActiveSession;
  window.UIModule = {
    isMobileMenuExpanded,
    toggleMobileMenu,
    scrollTabs,
    updateTabsScrollIndicators,
    scheduleUpdateTabsScrollIndicators,
    coffeeButtonTimeout,
    copyPixCoffee,
    resetCoffeeButton,
    setupGlobalChapterDropdown,
    renderChapterSelectorLists,
    toggleDropdown,
    togglePracticeChapterPicker,
    changeGlobalChapter,
    togglePracticeChapter,
    selectAllPracticeChapters,
    toggleAllPracticeChapters,
    setPracticeChapterOrder,
    updatePracticeOrderUI,
    lastRenderedVocabChapter,
    setVocabCumulative,
    setVocabCategory,
    updateVocabScopeUI,
    updateVocabCategoryFilterUI,
    renderVocabTable,
    filterVocabTable,
    toggleItemFavorite,
    applyLanguageUI,
    toggleLanguage,
    togglePracticeOptions,
    updatePracticeOptionsSummary,
    countPendingErrors,
    updateReviewDueBadge,
    confirmLeaveActiveSession,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isMobileMenuExpanded,
    toggleMobileMenu,
    scrollTabs,
    updateTabsScrollIndicators,
    scheduleUpdateTabsScrollIndicators,
    coffeeButtonTimeout,
    copyPixCoffee,
    resetCoffeeButton,
    setupGlobalChapterDropdown,
    renderChapterSelectorLists,
    toggleDropdown,
    togglePracticeChapterPicker,
    changeGlobalChapter,
    togglePracticeChapter,
    selectAllPracticeChapters,
    toggleAllPracticeChapters,
    setPracticeChapterOrder,
    updatePracticeOrderUI,
    lastRenderedVocabChapter,
    setVocabCumulative,
    setVocabCategory,
    updateVocabScopeUI,
    updateVocabCategoryFilterUI,
    renderVocabTable,
    filterVocabTable,
    toggleItemFavorite,
    applyLanguageUI,
    toggleLanguage,
    togglePracticeOptions,
    updatePracticeOptionsSummary,
    countPendingErrors,
    updateReviewDueBadge,
    confirmLeaveActiveSession,
  };
}
})();
