/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Estudar: o motor da prática
 * ==========================================================================
 * Fila de questões, digitação, alternativas, frases, favoritas, erros e o
 * atalho de Enter da prática e da Morte Súbita.
 * 
 * Script comum (sem módulo), carregado antes do js/app.js: as funções e variáveis
 * daqui são globais e conversam com as do app.js. Ver a tabela de navegação em
 * docs/desenvolvimento.md.
 */

/* ================= PRACTICE ENGINE ================= */
let practiceQueue = [];

function getAvailablePracticeCategories(state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && window.StateModule.getAvailablePracticeCategories) {
    return window.StateModule.getAvailablePracticeCategories(state);
  }
  let pool = [];
  const activeChapterId = state.currentChapter?.id;
  const chapters = state.chapters || [];
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);

  if (state.isPracticeCumulative) {
    let cumulativeChapters = chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : chapters.length,
    );
    if (activeIdx > 0) {
      cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
    }
    cumulativeChapters.forEach((chap) => {
      (chap.items || []).forEach((item) => pool.push(item));
    });
  } else {
    pool = [...(state.currentChapter?.items || [])];
  }

  pool = Array.from(new Map(pool.map((item) => [getTerm(item), item])).values());

  const available = [];
  WORD_CATEGORIES.forEach((cat) => {
    const count = pool.filter((item) => cat.match.test(item?.type || "")).length;
    if (count > 0) {
      available.push({ ...cat, count });
    }
  });

  return { total: pool.length, categories: available };
}

function getAvailableVocabCategories(state = AppState) {
  if (typeof window !== "undefined" && window.StateModule && window.StateModule.getAvailableVocabCategories) {
    return window.StateModule.getAvailableVocabCategories(state);
  }
  let wordsPool = [];
  let sentencesPool = [];
  const activeChapterId = state.currentChapter?.id;
  const chapters = state.chapters || [];
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);

  if (state.isVocabCumulative) {
    let cumulativeChapters = chapters.slice(
      0,
      activeIdx >= 0 ? activeIdx + 1 : chapters.length,
    );
    if (activeIdx > 0) {
      cumulativeChapters = cumulativeChapters.filter((c) => !isAlphabetChapter(c));
    }
    cumulativeChapters.forEach((chap) => {
      (chap.items || []).forEach((item) => wordsPool.push(item));
      (chap.sentences || []).forEach((s) => sentencesPool.push(s));
    });
  } else {
    wordsPool = [...(state.currentChapter?.items || [])];
    sentencesPool = [...(state.currentChapter?.sentences || [])];
  }

  // Deduplica palavras por termo único
  wordsPool = Array.from(new Map(wordsPool.map((item) => [getTerm(item), item])).values());
  // Deduplica frases por termo único
  sentencesPool = Array.from(new Map(sentencesPool.map((item) => [getTerm(item), item])).values());

  const categories = [];
  WORD_CATEGORIES.forEach((cat) => {
    const count = wordsPool.filter((item) => cat.match.test(item?.type || "")).length;
    if (count > 0) {
      categories.push({ ...cat, count });
    }
  });

  return {
    totalItems: wordsPool.length + sentencesPool.length,
    totalWords: wordsPool.length,
    totalSentences: sentencesPool.length,
    categories,
  };
}

function updatePracticeCategoryFilterUI() {
  if (typeof document === "undefined") return;
  const select = document.getElementById("practice-category-select");
  const container = document.getElementById("practice-category-container");
  if (!select) return;

  // Oculta o seletor se o exercício não for Digitação
  if (AppState.exerciseMode !== "typing") {
    if (container) container.classList.add("hidden");
    return;
  }
  if (container) container.classList.remove("hidden");

  const { total, categories } = getAvailablePracticeCategories();

  // Preserva a seleção se ainda estiver disponível, senão reseta para 'all'
  const currentVal = AppState.practiceCategory || "all";
  const isValidSelection = currentVal === "all" || categories.some((c) => c.id === currentVal);
  if (!isValidSelection) {
    AppState.practiceCategory = "all";
  }

  select.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = `Todas as palavras (${total})`;
  select.appendChild(optAll);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = `${cat.label} (${cat.count})`;
    select.appendChild(opt);
  });

  select.value = AppState.practiceCategory;
}

function setPracticeCategory(catId) {
  AppState.practiceCategory = catId || "all";
  AppState.currentQuestionIndex = 0;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
  if (typeof window !== "undefined" && typeof window.updatePracticeOptionsSummary === "function") {
    window.updatePracticeOptionsSummary();
  }
}

function setPracticeCumulative(isCumulative) {
  AppState.isPracticeCumulative = !!isCumulative;
  const chapters = AppState.chapters || [];
  if (chapters.length > 0 && AppState.currentChapter) {
    const activeIdx = chapters.findIndex((c) => c && c.id === AppState.currentChapter.id);
    if (isCumulative) {
      let cumul = chapters.slice(0, activeIdx >= 0 ? activeIdx + 1 : chapters.length);
      if (activeIdx > 0) cumul = cumul.filter((c) => !isAlphabetChapter(c));
      setSelectedChapters(cumul.map((c) => c.id), AppState);
    } else {
      setSelectedChapters([AppState.currentChapter.id], AppState);
    }
    if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.renderChapterSelectorLists === "function") {
      window.UIModule.renderChapterSelectorLists();
    }
  }
  updatePracticeScopeUI();
  updatePracticeCategoryFilterUI();
  AppState.currentQuestionIndex = 0;
  resetStats();
  buildPracticeQueue();
  renderCurrentQuestion();
}

function updatePracticeScopeUI() {
  if (typeof document === "undefined") return;
  const btnSingle = document.getElementById("scope-single");
  const btnCumulative = document.getElementById("scope-cumulative");
  const btnAll = document.getElementById("scope-all");
  if (!btnSingle || !btnCumulative) return;

  const selectedChaps = getSelectedChapters(AppState, { forVocab: false });
  const totalVocabChaps = Array.isArray(AppState.chapters)
    ? AppState.chapters.filter((c) => c && !isAlphabetChapter(c)).length
    : 0;
  const isAll = totalVocabChaps > 1 && selectedChaps.length === totalVocabChaps;
  const isCumulative = AppState.isPracticeCumulative || selectedChaps.length > 1;

  const setActive = (btn, isActive) => {
    if (!btn) return;
    btn.className = isActive ? "seg-btn is-active" : "seg-btn";
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  };
  const showAll = !!(isAll && btnAll);
  setActive(btnAll, showAll);
  setActive(btnCumulative, !showAll && isCumulative);
  setActive(btnSingle, !showAll && !isCumulative);
}

/** Favoritas e Erros misturam palavras e frases na mesma fila */
function isMixedPracticeMode() {
  return AppState.exerciseMode === "favorites" || AppState.exerciseMode === "errors";
}

function buildPracticeQueue() {
  const selectedChapters = getSelectedChapters(AppState, {
    forVocab: false,
    order: AppState.chapterOrder || "asc",
  });

  if (!selectedChapters || selectedChapters.length === 0) {
    practiceQueue = [];
    return;
  }

  const orderedQueue = [];
  const seenTerms = new Set();

  selectedChapters.forEach((chap) => {
    if (!chap) return;
    let chapItems = [];

    if (AppState.exerciseMode === "favorites") {
      const favWords = (chap.items || []).filter((i) => !!i.favorite);
      const favSentences = (chap.sentences || []).filter((s) => !!s.favorite);
      chapItems = [...favWords, ...favSentences];
    } else if (AppState.exerciseMode === "errors") {
      chapItems = [...(chap.items || []), ...(chap.sentences || [])].filter(isItemInErrorList);
    } else if (AppState.exerciseMode === "sentences") {
      chapItems = (chap.sentences || []).length > 0 ? [...chap.sentences] : [];
    } else {
      chapItems = [...(chap.items || [])];
    }

    // Filtro por tipo de palavra (quando em Digitação e categoria diferente de 'all')
    if (AppState.exerciseMode === "typing" && AppState.practiceCategory && AppState.practiceCategory !== "all") {
      chapItems = chapItems.filter((item) => matchItemCategory(item, AppState.practiceCategory));
    }

    // Deduplica preservando o agrupamento e a ordem dos capítulos selecionados
    const uniqueChapItems = [];
    chapItems.forEach((item) => {
      const t = getTerm(item);
      if (!t || !seenTerms.has(t)) {
        if (t) seenTerms.add(t);
        try {
          Object.defineProperty(item, "_chapterId", { value: chap.id, writable: true, configurable: true, enumerable: false });
          Object.defineProperty(item, "_chapterTitle", { value: chap.title, writable: true, configurable: true, enumerable: false });
        } catch (_) {}
        uniqueChapItems.push(item);
      }
    });

    // Embaralha dentro de cada capítulo para manter dinamismo sem quebrar a ordem dos capítulos (Primeira ➔ Última ou Última ➔ Primeira)
    orderedQueue.push(...shuffleArray(uniqueChapItems));
  });

  // Fallback para vocabulário caso o modo frases esteja ativo em capítulos sem frases
  if (orderedQueue.length === 0 && AppState.exerciseMode === "sentences") {
    selectedChapters.forEach((chap) => {
      if (!chap) return;
      const fallbackItems = [];
      (chap.items || []).forEach((item) => {
        const t = getTerm(item);
        if (!t || !seenTerms.has(t)) {
          if (t) seenTerms.add(t);
          try {
            Object.defineProperty(item, "_chapterId", { value: chap.id, writable: true, configurable: true, enumerable: false });
            Object.defineProperty(item, "_chapterTitle", { value: chap.title, writable: true, configurable: true, enumerable: false });
          } catch (_) {}
          fallbackItems.push(item);
        }
      });
      orderedQueue.push(...shuffleArray(fallbackItems));
    });
  }

  // Lições misturadas: com mais de uma lição, um só embaralhamento para todas
  practiceQueue = AppState.mixChapters && selectedChapters.length > 1 ? shuffleArray(orderedQueue) : orderedQueue;
}

/** Nova rodada em nova ordem, sem repetir de imediato o último item da rodada anterior */
function reshufflePracticeQueue() {
  const lastTerm = getTerm(practiceQueue[practiceQueue.length - 1]);
  buildPracticeQueue();
  if (practiceQueue.length > 1 && getTerm(practiceQueue[0]) === lastTerm) {
    [practiceQueue[0], practiceQueue[1]] = [practiceQueue[1], practiceQueue[0]];
  }
}

function resetPracticeActionButtons() {
  ensureDOM();
  AppState.isPracticeAnswered = false;
  lastPracticeMiss = null;
  setOverrideButtonVisible(false);

  const btnTyping = DOM.btnSubmitTyping || (typeof document !== "undefined" ? document.getElementById("btn-submit-typing") : null);
  if (btnTyping) {
    btnTyping.innerHTML = 'Verificar ➔';
    btnTyping.className = "answer-btn";
    btnTyping.disabled = false;
  }

  const btnSentence = DOM.btnSubmitSentence || (typeof document !== "undefined" ? document.getElementById("btn-submit-sentence") : null);
  if (btnSentence) {
    btnSentence.innerHTML = 'Verificar tradução ➔';
    btnSentence.className = "answer-btn";
    btnSentence.disabled = false;
  }

  const btnNext = DOM.btnNext || (typeof document !== "undefined" ? document.getElementById("btn-next") : null);
  if (btnNext) {
    btnNext.classList.add("hidden");
  }
}

function updatePracticeActionButtonToNext() {
  // Respondida a questão, a classificação já não é dica: aparece junto da correção
  showQuestionMeta();
  ensureDOM();
  AppState.isPracticeAnswered = true;

  const isTypingActive = DOM.interfaces?.typing && !DOM.interfaces.typing.classList.contains("hidden");
  const isSentenceActive = DOM.interfaces?.sentences && !DOM.interfaces.sentences.classList.contains("hidden");
  const isChoiceActive = DOM.interfaces?.choice && !DOM.interfaces.choice.classList.contains("hidden");
  const btnNext = DOM.btnNext || (typeof document !== "undefined" ? document.getElementById("btn-next") : null);

  const nextLabelHtml = `<span>Próxima<span class="hidden sm:inline"> questão</span> ➔</span> <kbd class="hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] bg-white/20 text-white rounded font-mono font-medium ml-1">Enter</kbd>`;

  if (isTypingActive) {
    const btnTyping = DOM.btnSubmitTyping || (typeof document !== "undefined" ? document.getElementById("btn-submit-typing") : null);
    if (btnTyping) {
      btnTyping.innerHTML = nextLabelHtml;
      btnTyping.className = "answer-btn animate-pulse-once";
      btnTyping.disabled = false;
    }
    if (btnNext) btnNext.classList.add("hidden");
  } else if (isSentenceActive) {
    const btnSentence = DOM.btnSubmitSentence || (typeof document !== "undefined" ? document.getElementById("btn-submit-sentence") : null);
    if (btnSentence) {
      btnSentence.innerHTML = nextLabelHtml;
      btnSentence.className = "answer-btn animate-pulse-once";
      btnSentence.disabled = false;
    }
    if (btnNext) btnNext.classList.add("hidden");
  } else if (isChoiceActive) {
    if (btnNext) {
      btnNext.innerHTML = nextLabelHtml;
      btnNext.className = "answer-btn flex-1 md:flex-none";
      btnNext.classList.remove("hidden");
    }
  }
}

/** Barra e contagem da rodada: verde para acertos, vermelho para erros */
function updateRoundProgress() {
  if (typeof document === "undefined") return;
  const total = practiceQueue.length;
  const correct = AppState.correctCount || 0;
  const wrong = (AppState.totalAnswered || 0) - correct;
  const percent = (value) => (total > 0 ? `${Math.min(100, (value / total) * 100)}%` : "0%");

  const correctFill = document.getElementById("practice-progress-fill");
  const wrongFill = document.getElementById("practice-progress-wrong");
  if (correctFill) correctFill.style.width = percent(correct);
  if (wrongFill) wrongFill.style.width = percent(wrong);

  const tally = document.getElementById("round-tally");
  const correctEl = document.getElementById("round-tally-correct");
  const wrongEl = document.getElementById("round-tally-wrong");
  if (tally) {
    tally.classList.toggle("hidden", total === 0);
    tally.setAttribute("aria-label", `${correct} ${correct === 1 ? "acerto" : "acertos"} e ${wrong} ${wrong === 1 ? "erro" : "erros"} nesta rodada`);
  }
  if (correctEl) correctEl.textContent = correct;
  if (wrongEl) wrongEl.textContent = wrong;
  const correctWord = document.getElementById("round-tally-correct-word");
  const wrongWord = document.getElementById("round-tally-wrong-word");
  if (correctWord) correctWord.textContent = correct === 1 ? "acerto" : "acertos";
  if (wrongWord) wrongWord.textContent = wrong === 1 ? "erro" : "erros";
}

function hideRoundSummary() {
  if (typeof document === "undefined") return;
  const panel = document.getElementById("standard-practice-panel");
  const summary = document.getElementById("round-summary");
  if (panel) panel.classList.remove("is-summary");
  if (summary) summary.classList.add("hidden");
}

function roundComparisonText(delta) {
  if (delta === null) return "";
  if (delta === 0) return "mesmo resultado da rodada anterior";
  const amount = Math.abs(delta);
  return `${amount} ${amount === 1 ? "acerto" : "acertos"} a ${delta > 0 ? "mais" : "menos"} que a rodada anterior`;
}

function showRoundSummary() {
  if (typeof document === "undefined") return;
  const summary = window.StateModule.getRoundSummary(AppState);
  const panel = document.getElementById("standard-practice-panel");
  const section = document.getElementById("round-summary");
  if (!panel || !section) return;

  AppState.currentQuestion = null;
  document.getElementById("round-summary-correct").textContent = summary.correct;
  document.getElementById("round-summary-total").textContent = summary.total;
  document.getElementById("round-summary-note").textContent = [
    summary.wrong === 0 ? "Nenhum erro nesta rodada" : `${summary.accuracy}% de precisão`,
    roundComparisonText(summary.delta),
  ].filter(Boolean).join(" · ");

  const list = document.getElementById("round-summary-list");
  list.innerHTML = "";
  summary.misses.forEach((item) => {
    const li = document.createElement("li");
    const term = document.createElement("span");
    term.className = `round-summary__term ${AppState.language === "greek" ? "greek-text" : "hebrew-text"}`;
    term.dir = "auto";
    term.textContent = getTerm(item);
    const meaning = document.createElement("span");
    meaning.className = "round-summary__meaning";
    meaning.textContent = (item.translations || []).join(", ");
    li.append(term, meaning);
    list.appendChild(li);
  });
  document.getElementById("round-summary-misses").classList.toggle("hidden", summary.misses.length === 0);
  document.getElementById("btn-round-errors").classList.toggle(
    "hidden",
    summary.misses.length === 0 || AppState.exerciseMode === "errors",
  );

  panel.classList.add("is-summary");
  section.classList.remove("hidden");
  setTimeout(() => {
    const restart = document.getElementById("btn-round-restart");
    if (restart && !section.classList.contains("hidden")) restart.focus();
  }, 100);
}

function restartPracticeRound() {
  window.StateModule.startNewRound(AppState);
  AppState.currentQuestionIndex = 0;
  reshufflePracticeQueue();
  renderCurrentQuestion();
  updateStatsUI();
}

function updateRemoveErrorButton() {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("btn-practice-remove-error");
  if (btn) btn.classList.toggle("hidden", AppState.exerciseMode !== "errors" || practiceQueue.length === 0);
}

/** Mostra o radical do 2º aoristo junto da pergunta para ajudar a gravá-lo */
function renderQuestionStem(question) {
  if (typeof document === "undefined") return;
  const stemEl = document.getElementById("question-stem");
  const stemValue = document.getElementById("question-stem-value");
  if (!stemEl || !stemValue) return;
  const stem = question && typeof window !== "undefined" && window.AssimilationModule
    ? window.AssimilationModule.getSecondAoristStem(question.type)
    : null;
  stemValue.textContent = stem || "";
  stemEl.classList.toggle("hidden", !stem);
}

function renderCurrentQuestion() {
  ensureDOM();
  resetPracticeActionButtons();
  updateRemoveErrorButton();
  hideRoundSummary();
  renderQuestionStem(null);
  if (DOM.hebPrompt) DOM.hebPrompt.classList.remove("is-long", "is-message", "is-gloss");

  if (practiceQueue.length === 0) {
    AppState.currentQuestion = null;
    updateRoundProgress();
    if (DOM.hebPrompt) DOM.hebPrompt.classList.add("is-message");
    if (DOM.btnPracticeFav) {
      DOM.btnPracticeFav.classList.add("hidden");
    }
    if (AppState.exerciseMode === "errors") {
      const elsewhere = typeof window !== "undefined" && typeof window.getErrorCards === "function"
        ? window.getErrorCards().length
        : 0;
      if (DOM.hebPrompt) DOM.hebPrompt.textContent = "Nenhum erro por aqui";
      if (DOM.qCategory) DOM.qCategory.textContent = "Modo Erros";
      if (DOM.qProgress) DOM.qProgress.textContent = "0 de 0 itens";
      if (DOM.hintText) {
        const scope = AppState.isPracticeCumulative ? "nos capítulos marcados" : "neste capítulo";
        DOM.hintText.textContent = elsewhere > 0
          ? `Não há termos errados ${scope}, mas outros capítulos têm ${elsewhere === 1 ? "1 termo" : `${elsewhere} termos`} na lista.`
          : `Os termos que você errar ${scope} aparecem aqui para praticar quantas vezes quiser.`;
        DOM.hintText.classList.remove("hidden");
      }
      if (DOM.btnHint) DOM.btnHint.classList.add("hidden");
      if (DOM.banner) DOM.banner.classList.add("hidden");
      if (DOM.btnPracticeAnalysis) DOM.btnPracticeAnalysis.classList.add("hidden");
      if (DOM.interfaces) {
        Object.values(DOM.interfaces).forEach((i) => {
          if (i) i.classList.add("hidden");
        });
      }
      return;
    }

    if (AppState.exerciseMode === "favorites") {
      if (DOM.hebPrompt) DOM.hebPrompt.textContent = "Nenhuma favorita ainda";
      if (DOM.qCategory) DOM.qCategory.textContent = "Modo Favoritas";
      if (DOM.qProgress) DOM.qProgress.textContent = "0 de 0 itens";
      if (DOM.hintText) {
        DOM.hintText.innerHTML = `
          <span class="block text-slate-300 text-xs md:text-sm leading-relaxed mb-3">
            Você ainda não marcou nenhuma frase ou palavra como favorita ${AppState.isPracticeCumulative ? "nas lições acumuladas" : "neste capítulo"}.
          </span>
          <button
            type="button"
            data-on-click="switchTab('vocab')"
            class="answer-btn font-sans"
          >
            Ir para o Dicionário e favoritar itens
          </button>
        `;
        DOM.hintText.classList.remove("hidden");
      }
      if (DOM.btnHint) DOM.btnHint.classList.add("hidden");
      if (DOM.banner) DOM.banner.classList.add("hidden");
      if (DOM.btnPracticeAnalysis) DOM.btnPracticeAnalysis.classList.add("hidden");
      if (DOM.interfaces) {
        Object.values(DOM.interfaces).forEach((i) => {
          if (i) i.classList.add("hidden");
        });
      }
      return;
    }

    if (DOM.hebPrompt) DOM.hebPrompt.textContent = "Sem itens disponíveis.";
    if (DOM.qCategory) DOM.qCategory.textContent = "Sem conteúdo";
    if (DOM.qProgress) DOM.qProgress.textContent = "Nenhum item disponível";
    if (DOM.hintText) {
      DOM.hintText.textContent = "";
      DOM.hintText.classList.add("hidden");
    }
    if (DOM.btnHint) DOM.btnHint.classList.add("hidden");
    if (DOM.banner) DOM.banner.classList.add("hidden");
    if (DOM.interfaces) {
      Object.values(DOM.interfaces).forEach((i) => {
        if (i) i.classList.add("hidden");
      });
    }
    return;
  }

  if (AppState.currentQuestionIndex >= practiceQueue.length) {
    if (AppState.totalAnswered > 0) {
      showRoundSummary();
      return;
    }
    AppState.currentQuestionIndex = 0;
    reshufflePracticeQueue();
  }

  AppState.currentQuestion = practiceQueue[AppState.currentQuestionIndex];

  const isQuestionFavorite = !!AppState.currentQuestion?.favorite;
  const btnPracticeFav = DOM.btnPracticeFav || (typeof document !== "undefined" ? document.getElementById("btn-practice-fav") : null);
  if (btnPracticeFav) {
    btnPracticeFav.classList.remove("hidden");
    btnPracticeFav.innerHTML = isQuestionFavorite ? "⭐" : "☆";
    btnPracticeFav.className = `fav-btn${isQuestionFavorite ? " is-on" : ""}`;
    btnPracticeFav.title = isQuestionFavorite ? "Remover dos favoritos" : "Marcar como favorito";
  }

  const isSentenceQuestion =
    AppState.currentQuestion.type === "Frase" ||
    AppState.currentQuestion.type === "Expressão" ||
    (Array.isArray(AppState.currentQuestion.tokens) && AppState.currentQuestion.tokens.length > 0) ||
    AppState.exerciseMode === "sentences";

  if (DOM.qCategory) {
    const catLabel = AppState.currentQuestion.type || "Geral";
    DOM.qCategory.textContent = AppState.exerciseMode === "favorites" ? `${catLabel} ⭐` : catLabel;
  }
  const qChapterBadge = DOM.qChapterBadge || (typeof document !== "undefined" ? document.getElementById("question-chapter-badge") : null);
  if (qChapterBadge) {
    const chapTitle = AppState.currentQuestion._chapterTitle || AppState.currentChapter?.title || "";
    // Com um único capítulo o contexto já está no painel; o selo só informa em sessões combinadas
    const isCombinedSession = (AppState.selectedChapterIds || []).length > 1;
    if (chapTitle && isCombinedSession) {
      qChapterBadge.textContent = chapTitle;
      qChapterBadge.title = chapTitle;
      qChapterBadge.classList.remove("hidden");
    } else {
      qChapterBadge.classList.add("hidden");
    }
  }
  resetQuestionMeta();
  if (DOM.qProgress) {
    DOM.qProgress.textContent = `Item ${AppState.currentQuestionIndex + 1} de ${practiceQueue.length}`;
  }
  updateRoundProgress();
  const showsGloss = isReverseChoice();
  if (DOM.hebPrompt) {
    // Na escolha inversa a pergunta é a tradução e as alternativas são os termos originais
    const promptText = showsGloss
      ? AppState.currentQuestion.translations.join(" / ")
      : getTerm(AppState.currentQuestion);
    DOM.hebPrompt.textContent = promptText;
    DOM.hebPrompt.classList.toggle("is-gloss", showsGloss);
    // Frases longas usam corpo menor para caber sem rolagem e sem quebrar a leitura
    if (String(promptText).length > 22) DOM.hebPrompt.classList.add("is-long");
  }
  // O radical entregaria a resposta quando as alternativas são os termos originais
  if (!showsGloss) renderQuestionStem(AppState.currentQuestion);

  if (DOM.hintText) {
    DOM.hintText.textContent = AppState.currentQuestion.transliteration || "Sem transliteração para este item";
    DOM.hintText.classList.add("hidden");
  }
  // A transliteração entregaria a resposta quando as alternativas são os termos originais
  if (DOM.btnHint) DOM.btnHint.classList.toggle("hidden", showsGloss);
  if (DOM.banner) DOM.banner.classList.add("hidden");

  const isSentenceWithAnalysis = AppState.currentQuestion &&
    (AppState.language === "hebrew" || AppState.language === "greek") &&
    ((AppState.currentQuestion.tokens && AppState.currentQuestion.tokens.length > 0) ||
      AppState.currentQuestion.type === "Frase" ||
      AppState.exerciseMode === "sentences");

  const btnPracticeAnalysis = DOM.btnPracticeAnalysis || (typeof document !== "undefined" ? document.getElementById("btn-practice-analysis") : null);
  if (btnPracticeAnalysis) {
    if (isSentenceWithAnalysis) {
      btnPracticeAnalysis.classList.remove("hidden");
    } else {
      btnPracticeAnalysis.classList.add("hidden");
    }
  }

  if (DOM.interfaces) {
    Object.values(DOM.interfaces).forEach((i) => {
      if (i) i.classList.add("hidden");
    });
  }

  if (AppState.exerciseMode === "typing") {
    if (DOM.inputs && DOM.inputs.typing) {
      DOM.inputs.typing.value = "";
      DOM.inputs.typing.disabled = false;
      if (typeof DOM.inputs.typing.focus === "function") {
        focusAnswerInput(DOM.inputs.typing);
      }
    }
    if (DOM.interfaces && DOM.interfaces.typing) {
      DOM.interfaces.typing.classList.remove("hidden");
    }
  } else if (AppState.exerciseMode === "choice") {
    renderChoiceInterface();
    if (DOM.interfaces && DOM.interfaces.choice) {
      DOM.interfaces.choice.classList.remove("hidden");
    }
  } else if (AppState.exerciseMode === "sentences") {
    if (DOM.inputs && DOM.inputs.sentences) {
      DOM.inputs.sentences.value = "";
      DOM.inputs.sentences.disabled = false;
      if (typeof DOM.inputs.sentences.focus === "function") {
        focusAnswerInput(DOM.inputs.sentences);
      }
    }
    if (DOM.interfaces && DOM.interfaces.sentences) {
      DOM.interfaces.sentences.classList.remove("hidden");
    }
  } else if (isMixedPracticeMode()) {
    if (isSentenceQuestion) {
      if (DOM.inputs && DOM.inputs.sentences) {
        DOM.inputs.sentences.value = "";
        DOM.inputs.sentences.disabled = false;
        if (typeof DOM.inputs.sentences.focus === "function") {
          focusAnswerInput(DOM.inputs.sentences);
        }
      }
      if (DOM.interfaces && DOM.interfaces.sentences) {
        DOM.interfaces.sentences.classList.remove("hidden");
      }
    } else {
      if (DOM.inputs && DOM.inputs.typing) {
        DOM.inputs.typing.value = "";
        DOM.inputs.typing.disabled = false;
        if (typeof DOM.inputs.typing.focus === "function") {
          focusAnswerInput(DOM.inputs.typing);
        }
      }
      if (DOM.interfaces && DOM.interfaces.typing) {
        DOM.interfaces.typing.classList.remove("hidden");
      }
    }
  }
}

/* ---------- Dica: a classificação do termo (e a lição, em sessões com várias) ---------- */
const metaNodes = () => (typeof document === "undefined" ? {} : {
  info: document.getElementById("question-meta"),
  btn: document.getElementById("btn-show-meta"),
  badge: document.getElementById("question-chapter-badge"),
});

/** Nova questão: a dica volta a ficar escondida. Sem nada a dizer (só "Frase"), nem o botão aparece. */
function resetQuestionMeta() {
  const { info, btn, badge } = metaNodes();
  if (!info || !btn) return;
  const type = (AppState.currentQuestion && AppState.currentQuestion.type) || "";
  const onlyObvious = /^(Frase|Expressão)$/.test(type) && (!badge || badge.classList.contains("hidden"));
  info.classList.add("hidden");
  btn.classList.toggle("hidden", onlyObvious || !type && (!badge || badge.classList.contains("hidden")));
  btn.setAttribute("aria-expanded", "false");
}

/** Mostra a dica (pelo botão, ou sozinha depois da resposta) */
function showQuestionMeta() {
  const { info, btn } = metaNodes();
  if (!info || !btn) return;
  if (btn.classList.contains("hidden") && info.classList.contains("hidden")) return;
  info.classList.remove("hidden");
  btn.classList.add("hidden");
  btn.setAttribute("aria-expanded", "true");
}

function toggleHint() {
  DOM.hintText.classList.toggle("hidden");
  DOM.btnHint.classList.toggle("hidden");
}

/** Direção da múltipla escolha: "forward" (original ➔ português) ou "reverse" (português ➔ original) */
function getChoiceDirection() {
  return AppState.choiceDirection === "reverse" ? "reverse" : "forward";
}

function isReverseChoice() {
  return AppState.exerciseMode === "choice" && getChoiceDirection() === "reverse";
}

function loadChoiceDirection() {
  try {
    AppState.choiceDirection =
      typeof localStorage !== "undefined" && localStorage.getItem("gamida_choiceDirection") === "reverse"
        ? "reverse"
        : "forward";
  } catch (_) {
    AppState.choiceDirection = "forward";
  }
}

function setChoiceDirection(direction) {
  AppState.choiceDirection = direction === "reverse" ? "reverse" : "forward";
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem("gamida_choiceDirection", AppState.choiceDirection);
  } catch (_) {}
  updateChoiceDirectionUI();
  if (AppState.exerciseMode === "choice") {
    AppState.currentQuestionIndex = 0;
    resetStats();
    buildPracticeQueue();
    renderCurrentQuestion();
  }
  if (typeof window !== "undefined" && typeof window.updatePracticeOptionsSummary === "function") {
    window.updatePracticeOptionsSummary();
  }
}

function updateChoiceDirectionUI() {
  if (typeof document === "undefined") return;
  const container = document.getElementById("practice-direction-container");
  if (container) container.classList.toggle("hidden", AppState.exerciseMode !== "choice");
  const original = AppState.language === "greek" ? "Grego" : "Hebraico";
  const direction = getChoiceDirection();
  [["forward", `${original} ➔ Português`], ["reverse", `Português ➔ ${original}`]].forEach(([dir, label]) => {
    const btn = document.getElementById(`direction-${dir}`);
    if (!btn) return;
    btn.textContent = label;
    btn.className = dir === direction ? "seg-btn is-active" : "seg-btn";
    btn.setAttribute("aria-pressed", dir === direction ? "true" : "false");
  });
}

function renderChoiceInterface() {
  DOM.interfaces.choice.innerHTML = "";
  const isReverse = isReverseChoice();
  const build = typeof window !== "undefined" && window.StateModule && window.StateModule.buildChoiceOptions;
  const options = typeof build === "function"
    ? build(AppState.currentQuestion, AppState.chapters, { direction: getChoiceDirection() })
    : [];
  const termClass = AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `choice-btn hover:border-brand-500 active:scale-[0.99]${isReverse ? ` choice-btn--term ${termClass}` : ""}`;
    btn.setAttribute("data-key", String(idx + 1));
    if (opt.isCorrect) btn.dataset.correct = "1";
    btn.textContent = opt.text;
    btn.onclick = () => {
      if (AppState.isPracticeAnswered) {
        nextQuestion();
        return;
      }
      btn.dataset.picked = "1";
      checkPracticeAnswer(opt.text, opt);
    };
    DOM.interfaces.choice.appendChild(btn);
  });
}

function submitAnswer(e) {
  if (e) e.preventDefault();
  if (AppState.isPracticeAnswered) {
    nextQuestion();
    return;
  }
  checkPracticeAnswer(DOM.inputs.typing.value);
}

function submitSentenceAnswer(e) {
  if (e) e.preventDefault();
  if (AppState.isPracticeAnswered) {
    nextQuestion();
    return;
  }
  checkPracticeAnswer(DOM.inputs.sentences.value);
}

function showAssimilationTip(question) {
  const tipEl = document.getElementById("feedback-tip");
  const tipText = document.getElementById("feedback-tip-text");
  if (!tipEl || !tipText) return;
  const tip = typeof window !== "undefined" && window.AssimilationModule
    ? window.AssimilationModule.getAssimilationTip(question, AppState.language)
    : null;
  tipText.textContent = tip ? tip.text : "";
  tipEl.classList.toggle("hidden", !tip);
}

/** Reconhecer entre opções é mais fácil que lembrar: Escolha não conta para o domínio */
function registerMasteryHit() {
  return AppState.exerciseMode !== "choice" && recordMasteryHit(AppState.currentQuestion);
}

function correctAnswerTitle(justMastered) {
  if (justMastered) return "Termo dominado!";
  if (AppState.streak > 0 && AppState.streak % 5 === 0) return `${AppState.streak} seguidas!`;
  return "Excelente! Tradução Correta!";
}

/** Erro mais recente da prática, guardado para poder ser desfeito pelo aluno */
let lastPracticeMiss = null;

/**
 * Mostra, nas frases, o que bateu, o que sobrou e o que faltou em relação à tradução mais próxima
 * @param {string|null} userAnswer null esconde a comparação
 * @param {Array<string>} [acceptedList]
 */
function renderSentenceDiff(userAnswer, acceptedList) {
  if (typeof document === "undefined") return;
  const box = document.getElementById("feedback-diff");
  const userEl = document.getElementById("feedback-diff-user");
  const expectedEl = document.getElementById("feedback-diff-expected");
  if (!box || !userEl || !expectedEl) return;
  const compare = typeof window !== "undefined" && window.EvaluationModule && window.EvaluationModule.compareSentenceWords;
  const diff = userAnswer != null && typeof compare === "function" ? compare(userAnswer, acceptedList) : null;
  const banner = document.getElementById("feedback-banner");
  if (banner) banner.classList.toggle("is-stacked", !!diff);
  if (!diff) {
    box.classList.add("hidden");
    return;
  }
  const paint = (el, words, missClass) => {
    el.textContent = "";
    words.forEach((w) => {
      const span = document.createElement("span");
      span.className = `feedback-diff__word ${w.matched ? "is-match" : missClass}`;
      span.textContent = w.text;
      el.appendChild(span);
    });
  };
  paint(userEl, diff.userWords, "is-extra");
  paint(expectedEl, diff.expectedWords, "is-missing");
  box.classList.remove("hidden");
}

function setOverrideButtonVisible(isVisible) {
  if (typeof document === "undefined") return;
  const btn = document.getElementById("btn-feedback-override");
  if (btn) btn.classList.toggle("hidden", !isVisible);
}

/**
 * O aluno declara que a tradução dele equivale à esperada: o erro é desfeito e vira acerto.
 * Só vale para frases, onde há mais de uma tradução fiel possível.
 */
function overrideCurrentPracticeMiss() {
  const miss = lastPracticeMiss;
  if (!miss || miss.question !== AppState.currentQuestion || !AppState.isPracticeAnswered) return;
  lastPracticeMiss = null;

  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.restoreRetention === "function") {
    window.SRSModule.restoreRetention(miss.retention);
  }
  const missIdx = AppState.roundMisses.lastIndexOf(miss.question);
  if (missIdx !== -1) AppState.roundMisses.splice(missIdx, 1);
  AppState.correctCount++;
  AppState.streak = miss.streak + 1;
  registerMasteryHit();

  const icon = document.getElementById("feedback-icon");
  const title = document.getElementById("feedback-title");
  DOM.banner.classList.remove("bg-rose-950/80", "border-rose-500/50");
  DOM.banner.classList.add("bg-emerald-950/80", "border-emerald-500/50");
  if (icon) icon.textContent = "✅";
  if (title) {
    title.textContent = "Contada como acerto";
    title.className = "font-bold text-sm text-emerald-400";
  }
  setOverrideButtonVisible(false);
  updateRemoveErrorButton();
  updateRoundProgress();
  updateStatsUI();
}

/**
 * @param {string} userAnswer
 * @param {{isCorrect: boolean, term: string, translations: Array<string>}} [pickedOption] alternativa clicada na múltipla escolha
 */
function checkPracticeAnswer(userAnswer, pickedOption) {
  if (typeof window !== "undefined" && typeof window.recordActivity === "function") window.recordActivity();
  lastPracticeMiss = null;
  setOverrideButtonVisible(false);
  renderSentenceDiff(null);
  const isSentenceQuestion =
    AppState.exerciseMode === "sentences" ||
    AppState.currentQuestion?.type === "Frase" ||
    AppState.currentQuestion?.type === "Expressão" ||
    (Array.isArray(AppState.currentQuestion?.tokens) && AppState.currentQuestion.tokens.length > 0);
  const isReverse = !!pickedOption && isReverseChoice();
  const questionTerm = getTerm(AppState.currentQuestion);
  const shownTranslations = typeof window !== "undefined" && window.EvaluationModule && typeof window.EvaluationModule.getDisplayTranslations === "function"
    ? window.EvaluationModule.getDisplayTranslations(AppState.currentQuestion.translations)
    : AppState.currentQuestion.translations;
  const allTranslations = shownTranslations.join('" / "');
  // Na múltipla escolha o acerto é da alternativa, não do texto: vale para as duas direções
  const evalResult = pickedOption
    ? { status: pickedOption.isCorrect ? "correct" : "incorrect", expected: isReverse ? questionTerm : shownTranslations.join(" / ") }
    : evaluateAnswer(
      userAnswer,
      AppState.currentQuestion.translations,
      { isSentence: isSentenceQuestion },
    );
  AppState.totalAnswered++;

  const icon = document.getElementById("feedback-icon");
  const title = document.getElementById("feedback-title");
  const detail = document.getElementById("feedback-detail");

  DOM.banner.classList.remove(
    "hidden",
    "bg-emerald-950/80",
    "border-emerald-500/50",
    "bg-rose-950/80",
    "border-rose-500/50",
    "bg-amber-950/80",
    "border-amber-500/50",
  );

  if (evalResult.status === "correct") {
    AppState.correctCount++;
    AppState.streak++;
    DOM.banner.classList.add(
      "bg-emerald-950/80",
      "border-emerald-500/50",
    );
    icon.textContent = "✅";
    title.textContent = correctAnswerTitle(registerMasteryHit());
    title.className = "font-bold text-sm text-emerald-400";
    detail.textContent = isReverse
      ? `${questionTerm} significa "${allTranslations}".`
      : `Tradução esperada: "${allTranslations}"`;
  } else if (evalResult.status === "typo") {
    AppState.correctCount++; // Pontua como acerto
    AppState.streak++;
    registerMasteryHit();
    DOM.banner.classList.add("bg-amber-950/80", "border-amber-500/50");
    icon.textContent = "⚠️";
    title.textContent = "Atenção: Erro de Digitação ou Pontuação?";
    title.className = "font-bold text-sm text-amber-400";
    detail.textContent = `Sua resposta foi aceita, mas o ideal é: "${evalResult.expected}". (Você digitou: "${userAnswer}")`;
  } else {
    const canOverride = isSentenceQuestion && String(userAnswer || "").trim().length > 0 && AppState.exerciseMode !== "choice";
    if (canOverride) {
      lastPracticeMiss = {
        question: AppState.currentQuestion,
        streak: AppState.streak,
        retention: typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.snapshotRetention === "function"
          ? window.SRSModule.snapshotRetention(AppState.currentQuestion)
          : null,
      };
      setOverrideButtonVisible(true);
    }
    AppState.streak = 0;
    AppState.roundMisses.push(AppState.currentQuestion);
    recordSRSError(getTerm(AppState.currentQuestion)); // Manda pro Anki
    DOM.banner.classList.add("bg-rose-950/80", "border-rose-500/50");
    icon.textContent = "❌";
    title.textContent = "Incorreto";
    title.className = "font-bold text-sm text-rose-400";
    // Agora mostra TODAS as traduções possíveis!
    detail.textContent = `Traduções aceitas: "${evalResult.expected}" (Você respondeu: "${userAnswer || "em branco"}")`;
    if (pickedOption) {
      // Dizer o que a alternativa escolhida significa ensina mais do que só apontar a certa
      const pickedGloss = (pickedOption.translations || []).join('" / "');
      detail.textContent = isReverse
        ? `A resposta é ${questionTerm}. Você escolheu ${pickedOption.term}, que significa "${pickedGloss}".`
        : `Traduções aceitas: "${allTranslations}". Você escolheu "${userAnswer}", que traduz ${pickedOption.term}.`;
    }
    if (canOverride) {
      // A comparação palavra a palavra já mostra as duas versões; o texto só orienta a leitura
      renderSentenceDiff(userAnswer, AppState.currentQuestion.translations);
      const altCount = AppState.currentQuestion.translations.length - 1;
      detail.textContent = altCount > 0
        ? `Compare com a tradução mais próxima (há mais ${altCount === 1 ? "1 aceita" : `${altCount} aceitas`}). Se a sua diz o mesmo com outras palavras, conte como acerto.`
        : "Compare com a tradução esperada. Se a sua diz o mesmo com outras palavras, conte como acerto.";
    }
  }

  showAssimilationTip(AppState.currentQuestion);
  updateRoundProgress();

  DOM.inputs.typing.disabled = true;
  DOM.inputs.sentences.disabled = true;

  // Desabilita e estiliza botões de múltipla escolha se estiverem presentes
  if (DOM.interfaces && DOM.interfaces.choice) {
    const choiceButtons = DOM.interfaces.choice.querySelectorAll("button");
    choiceButtons.forEach((b) => {
      b.disabled = true;
      b.classList.remove("hover:border-brand-500", "active:scale-[0.99]");
      if (b.dataset.correct === "1") {
        b.classList.add("border-emerald-500", "bg-emerald-950/40", "text-emerald-200");
      } else if (b.dataset.picked === "1") {
        b.classList.add("border-rose-500", "bg-rose-950/40", "text-rose-200");
      } else {
        b.classList.add("opacity-50");
      }
    });
  }

  // Transforma o botão "Verificar" em "Próxima Questão" e ajusta estado
  updatePracticeActionButtonToNext();

  const isSentenceWithAnalysis = AppState.currentQuestion &&
    (AppState.language === "hebrew" || AppState.language === "greek") &&
    ((AppState.currentQuestion.tokens && AppState.currentQuestion.tokens.length > 0) ||
      AppState.currentQuestion.type === "Frase" ||
      AppState.exerciseMode === "sentences");

  const btnFeedbackAnalysis = DOM.btnFeedbackAnalysis || (typeof document !== "undefined" ? document.getElementById("btn-feedback-analysis") : null);
  if (btnFeedbackAnalysis) {
    if (isSentenceWithAnalysis) {
      btnFeedbackAnalysis.classList.remove("hidden");
    } else {
      btnFeedbackAnalysis.classList.add("hidden");
    }
  }

  updateStatsUI();
}

function nextQuestion() {
  AppState.currentQuestionIndex++;
  renderCurrentQuestion();
}

function openCurrentPracticeSentenceAnalysis() {
  if (!AppState.currentQuestion) return;
  if (typeof openSentenceAnalysisModal === "function") {
    openSentenceAnalysisModal(AppState.currentQuestion);
  } else if (typeof window !== "undefined" && window.SentenceAnalysisModule && typeof window.SentenceAnalysisModule.openSentenceAnalysisModal === "function") {
    window.SentenceAnalysisModule.openSentenceAnalysisModal(AppState.currentQuestion);
  }
}

function toggleCurrentPracticeFavorite() {
  if (!AppState.currentQuestion) return;
  if (typeof toggleItemFavorite === "function") {
    toggleItemFavorite(AppState.currentQuestion);
  } else if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.toggleItemFavorite === "function") {
    window.UIModule.toggleItemFavorite(AppState.currentQuestion);
  }
  const isFav = !!AppState.currentQuestion.favorite;
  const btn = document.getElementById("btn-practice-fav");
  if (btn) {
    btn.innerHTML = isFav ? "⭐" : "☆";
    btn.className = `fav-btn${isFav ? " is-on" : ""}`;
    btn.title = isFav ? "Remover dos favoritos" : "Marcar como favorito";
  }
}

/** Tira o termo atual da lista de erros e segue para o próximo */
function removeCurrentPracticeError() {
  if (!AppState.currentQuestion || AppState.exerciseMode !== "errors") return;
  removeFromErrorList(AppState.currentQuestion);
  practiceQueue.splice(AppState.currentQuestionIndex, 1);
  renderCurrentQuestion();
}

function resetStats() {
  AppState.score = 0;
  AppState.streak = 0;
  AppState.totalAnswered = 0;
  AppState.correctCount = 0;
  AppState.roundMisses = [];
  AppState.previousRound = null;
  AppState.isPracticeAnswered = false;
  updateStatsUI();

  if (typeof document !== "undefined") {
    const alphaScore = document.getElementById("alphabet-score-indicator");
    const alphaProgress = document.getElementById("alphabet-progress-indicator");
    const alphaCombo = document.getElementById("alphabet-combo-badge");
    if (alphaScore) alphaScore.textContent = "⭐ Pontos: 0";
    if (alphaProgress) alphaProgress.textContent = "Streak: 0";
    if (alphaCombo) alphaCombo.classList.add("hidden");
  }
}

function updateStatsUI() {
  document.getElementById("stat-streak").textContent = AppState.streak;
  document.getElementById("stat-score").textContent = AppState.score;
  // Sem respostas ainda não há precisão a mostrar: "100%" sugeriria um resultado que não existe
  document.getElementById("stat-accuracy").textContent =
    AppState.totalAnswered > 0
      ? `${Math.round((AppState.correctCount / AppState.totalAnswered) * 100)}%`
      : "—";
  if (typeof window !== "undefined" && typeof window.updateReviewDueBadge === "function") {
    window.updateReviewDueBadge();
  }
}

// Interceptador global da tecla ENTER (Modo Sobrevivência e Modo de Prática)
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented) return;
    const modal = document.getElementById("sentence-analysis-modal");
    if (modal && !modal.classList.contains("hidden")) return;

    // 1. Modo Sobrevivência
    const survActive = document.getElementById("survival-active");
    if (
      survActive &&
      !survActive.classList.contains("hidden") &&
      e.key === "Enter"
    ) {
      const input = document.getElementById("survival-input");
      if (document.activeElement === input) {
        e.preventDefault();
        submitSurvivalAnswer();
      }
      return;
    }

    const typingTarget = document.activeElement;
    const isTypingField =
      typingTarget &&
      (typingTarget.tagName === "INPUT" || typingTarget.tagName === "TEXTAREA" || typingTarget.tagName === "SELECT");

    // Revisão: Espaço revela o cartão; 1, 2 e 3 classificam a lembrança
    const ankiActive = document.getElementById("anki-active");
    if (ankiActive && !ankiActive.classList.contains("hidden") && !isTypingField) {
      const ankiBack = document.getElementById("anki-back");
      const isRevealed = ankiBack && !ankiBack.classList.contains("hidden");
      if (!isRevealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        revealAnki();
      } else if (isRevealed && ["1", "2", "3"].includes(e.key)) {
        e.preventDefault();
        answerAnki({ 1: "hard", 2: "good", 3: "easy" }[e.key]);
      }
      return;
    }

    // 2. Modo de Prática Padrão
    const tabPractice = document.getElementById("tab-practice");
    const stdPanel = document.getElementById("standard-practice-panel");
    const isPracticeVisible = tabPractice && !tabPractice.classList.contains("hidden");
    const isStdPanelVisible = stdPanel && !stdPanel.classList.contains("hidden");

    // Múltipla escolha: teclas 1 a 4 respondem sem o mouse
    if (isPracticeVisible && isStdPanelVisible && !isTypingField && !AppState.isPracticeAnswered && /^[1-4]$/.test(e.key)) {
      const choicePanel = DOM.interfaces && DOM.interfaces.choice;
      if (choicePanel && !choicePanel.classList.contains("hidden")) {
        const option = choicePanel.querySelector(`[data-key="${e.key}"]`);
        if (option) {
          e.preventDefault();
          option.click();
        }
      }
      return;
    }

    if (isPracticeVisible && isStdPanelVisible && e.key === "Enter") {
      // Enter em um botão de ação do feedback aciona o botão, não a próxima questão
      if (document.activeElement && document.activeElement.id === "btn-feedback-analysis") return;

      // Se a resposta já foi verificada, QUALQUER tecla Enter avança imediatamente para a próxima questão
      if (AppState.isPracticeAnswered) {
        e.preventDefault();
        nextQuestion();
        return;
      }

      // Se ainda não foi verificada e o usuário está no textarea de frases:
      // Enter sem Shift submete a tradução (Shift+Enter permite quebra de linha)
      if (
        DOM.inputs &&
        DOM.inputs.sentences &&
        document.activeElement === DOM.inputs.sentences
      ) {
        if (!e.shiftKey) {
          e.preventDefault();
          submitSentenceAnswer();
          return;
        }
      }
    }
  });
}
