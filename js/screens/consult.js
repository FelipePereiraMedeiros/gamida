/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Consultar: dicionário e tabelas
 * ==========================================================================
 * Tabela do vocabulário e as tabelas e grafos de paradigmas (motor em
 * js/modules/paradigms.js).
 * 
 * Script comum (sem módulo), carregado antes do js/app.js: as funções e variáveis
 * daqui são globais e conversam com as do app.js. Ver a tabela de navegação em
 * docs/desenvolvimento.md.
 */

/* ================= VOCABULARY DICTIONARY TABLE ================= */
let lastRenderedVocabChapter = null;

function setVocabCumulative(isCumulative) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.setVocabCumulative === "function") {
    return window.UIModule.setVocabCumulative(isCumulative);
  }
  return null;
}

function setVocabCategory(catId) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.setVocabCategory === "function") {
    return window.UIModule.setVocabCategory(catId);
  }
  return null;
}

function updateVocabScopeUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updateVocabScopeUI === "function") {
    return window.UIModule.updateVocabScopeUI();
  }
  return null;
}

function updateVocabCategoryFilterUI() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.updateVocabCategoryFilterUI === "function") {
    return window.UIModule.updateVocabCategoryFilterUI();
  }
  return null;
}

function renderVocabTable() {
  // === INJEÇÃO DOS PARADIGMAS NO FINAL DA LISTA ===
  // Delegado para o UIModule utilizando getStaticParadigmTableHTML
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.renderVocabTable === "function") {
    return window.UIModule.renderVocabTable();
  }
  return null;
}

function filterVocabTable() {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.filterVocabTable === "function") {
    return window.UIModule.filterVocabTable();
  }
  return null;
}

function toggleItemFavorite(item) {
  if (typeof window !== "undefined" && window.UIModule && typeof window.UIModule.toggleItemFavorite === "function") {
    return window.UIModule.toggleItemFavorite(item);
  }
  return null;
}

/* ================= TAB 5: MOTOR DE PARADIGMAS & ARRASTAR ================= */
// Motor de paradigmas gramaticais delegado para js/modules/paradigms.js (ParadigmsModule)
let activeParadigm = null;
let draggedElement = null;
let selectedChip = null;

function renderParadigmSkeleton() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.renderParadigmSkeleton === "function") {
    return window.ParadigmsModule.renderParadigmSkeleton();
  }
  return null;
}

function renderTableView(paradigm, container) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.renderTableView === "function") {
    return window.ParadigmsModule.renderTableView(paradigm, container);
  }
  return null;
}

function renderDiagramView(paradigm, container) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.renderDiagramView === "function") {
    return window.ParadigmsModule.renderDiagramView(paradigm, container);
  }
  return null;
}

function onDragStart(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragStart === "function") {
    return window.ParadigmsModule.onDragStart(e);
  }
  return null;
}

function onDragEnd(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragEnd === "function") {
    return window.ParadigmsModule.onDragEnd(e);
  }
  return null;
}

function onDragOver(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragOver === "function") {
    return window.ParadigmsModule.onDragOver(e);
  }
  return null;
}

function onDragLeave(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDragLeave === "function") {
    return window.ParadigmsModule.onDragLeave(e);
  }
  return null;
}

function onDropToZone(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDropToZone === "function") {
    return window.ParadigmsModule.onDropToZone(e);
  }
  return null;
}

function onDropToDeck(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onDropToDeck === "function") {
    return window.ParadigmsModule.onDropToDeck(e);
  }
  return null;
}

function onChipClick(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onChipClick === "function") {
    return window.ParadigmsModule.onChipClick(e);
  }
  return null;
}

function clearChipSelection() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.clearChipSelection === "function") {
    return window.ParadigmsModule.clearChipSelection();
  }
  return null;
}

function onZoneClick(e) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.onZoneClick === "function") {
    return window.ParadigmsModule.onZoneClick(e);
  }
  return null;
}

function checkParadigmAnswers() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.checkParadigmAnswers === "function") {
    return window.ParadigmsModule.checkParadigmAnswers();
  }
  return null;
}

function resetParadigmBoard() {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.resetParadigmBoard === "function") {
    return window.ParadigmsModule.resetParadigmBoard();
  }
  return null;
}

function getStaticDiagramHTML(paradigm) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.getStaticDiagramHTML === "function") {
    return window.ParadigmsModule.getStaticDiagramHTML(paradigm);
  }
  return "";
}

function getStaticParadigmTableHTML(paradigm) {
  if (typeof window !== "undefined" && window.ParadigmsModule && typeof window.ParadigmsModule.getStaticParadigmTableHTML === "function") {
    return window.ParadigmsModule.getStaticParadigmTableHTML(paradigm);
  }
  return "";
}
