/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Revisar e Jogar: simulado, flashcards e Morte Súbita
 * ==========================================================================
 * Ligações da tela com os motores em js/modules/assessment.js, srs.js e
 * survival.js.
 * 
 * Script comum (sem módulo), carregado antes do js/app.js: as funções e variáveis
 * daqui são globais e conversam com as do app.js. Ver a tabela de navegação em
 * docs/desenvolvimento.md.
 */

/* ================= CUMULATIVE ASSESSMENT LOGIC ================= */
// Lógica de Avaliação Cumulativa & Simulados Diagnósticos (AssessmentModule)
// Lógica principal e diagnóstico implementados em js/modules/assessment.js
var SimConfig = (typeof window !== "undefined" && window.SimConfig)
  ? window.SimConfig
  : { amount: 25, time: 0, focus: "mixed" };
var assessQuestions = (typeof window !== "undefined" && window.assessQuestions) ? window.assessQuestions : [];
var assessIndex = 0;
var assessAnswersMap = {};
let assessTimerInterval = null;
let assessTimeCount = 0;

function resetToDashboard() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.resetToDashboard === "function") {
    return window.AssessmentModule.resetToDashboard();
  }
  return null;
}

function openSimuladoConfig() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.openSimuladoConfig === "function") {
    return window.AssessmentModule.openSimuladoConfig();
  }
  return null;
}

function closeSimuladoConfig() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.closeSimuladoConfig === "function") {
    return window.AssessmentModule.closeSimuladoConfig();
  }
  return null;
}

function setSimConfig(type, value) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.setSimConfig === "function") {
    return window.AssessmentModule.setSimConfig(type, value);
  }
  return null;
}

function startSimulado() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.startSimulado === "function") {
    return window.AssessmentModule.startSimulado();
  }
  return null;
}

function startAssessmentTimer() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.startAssessmentTimer === "function") {
    return window.AssessmentModule.startAssessmentTimer();
  }
  return null;
}

function saveCurrentInputDraft() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.saveCurrentInputDraft === "function") {
    return window.AssessmentModule.saveCurrentInputDraft();
  }
  return null;
}

function renderAssessmentQuestion() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.renderAssessmentQuestion === "function") {
    return window.AssessmentModule.renderAssessmentQuestion();
  }
  return null;
}

function navigateAssessment(direction) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.navigateAssessment === "function") {
    return window.AssessmentModule.navigateAssessment(direction);
  }
  return null;
}

function jumpToAssessmentQuestion(index) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.jumpToAssessmentQuestion === "function") {
    return window.AssessmentModule.jumpToAssessmentQuestion(index);
  }
  return null;
}

function initAssessmentTracker() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.initAssessmentTracker === "function") {
    return window.AssessmentModule.initAssessmentTracker();
  }
  return null;
}

function updateAllTrackerPills() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.updateAllTrackerPills === "function") {
    return window.AssessmentModule.updateAllTrackerPills();
  }
  return null;
}

function updateTrackerPillState(idx) {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.updateTrackerPillState === "function") {
    return window.AssessmentModule.updateTrackerPillState(idx);
  }
  return null;
}

function confirmFinishAssessmentPrompt() {
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.confirmFinishAssessmentPrompt === "function") {
    return window.AssessmentModule.confirmFinishAssessmentPrompt();
  }
  return null;
}

function finishAssessment() {
  // Diagnóstico implementado em js/modules/assessment.js:
  // const chapterErrors = {};
  // Classificação: 'Revisão Urgente', 'Revisão Recomendada', 'Excelente Domínio'
  if (typeof window !== "undefined" && window.AssessmentModule && typeof window.AssessmentModule.finishAssessment === "function") {
    return window.AssessmentModule.finishAssessment();
  }
  return null;
}

/* ================= LÓGICA DO ANKI (FLASHCARDS) ================= */
// Lógica de Flashcards SRS delegada para js/modules/srs.js (SRSModule)
let ankiQueue = [];
let ankiCurrentCard = null;
let ankiStats = { hard: 0, good: 0, easy: 0 };
let ankiTotalCards = 0;

function startAnki(mode) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.startAnki === "function") {
    return window.SRSModule.startAnki(mode);
  }
  return null;
}

function renderAnkiCard() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.renderAnkiCard === "function") {
    return window.SRSModule.renderAnkiCard();
  }
  return null;
}

function revealAnki() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.revealAnki === "function") {
    return window.SRSModule.revealAnki();
  }
  return null;
}

function answerAnki(grade) {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.answerAnki === "function") {
    return window.SRSModule.answerAnki(grade);
  }
  return null;
}

function finishAnki() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.finishAnki === "function") {
    return window.SRSModule.finishAnki();
  }
  return null;
}

function openCurrentAnkiSentenceAnalysis() {
  if (typeof window !== "undefined" && window.SRSModule && typeof window.SRSModule.openCurrentAnkiSentenceAnalysis === "function") {
    return window.SRSModule.openCurrentAnkiSentenceAnalysis();
  }
  return null;
}

/* ================= FASE 3: LÓGICA DE SOBREVIVÊNCIA (MORTE SÚBITA) ================= */
// Lógica do Modo Sobrevivência delegada para js/modules/survival.js (SurvivalModule)
let survLives = 3;
let survStreak = 0;
let survQueue = [];
let survCurrent = null;

function startSurvival() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.startSurvival === "function") {
    return window.SurvivalModule.startSurvival();
  }
  return null;
}

function updateSurvivalUI() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.updateSurvivalUI === "function") {
    return window.SurvivalModule.updateSurvivalUI();
  }
  return null;
}

function nextSurvivalQuestion() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.nextSurvivalQuestion === "function") {
    return window.SurvivalModule.nextSurvivalQuestion();
  }
  return null;
}

function submitSurvivalAnswer() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.submitSurvivalAnswer === "function") {
    return window.SurvivalModule.submitSurvivalAnswer();
  }
  return null;
}

function finishSurvival(surrendered = false) {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.finishSurvival === "function") {
    return window.SurvivalModule.finishSurvival(surrendered);
  }
  return null;
}

function resetSurvival() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.resetSurvival === "function") {
    return window.SurvivalModule.resetSurvival();
  }
  return null;
}

function updateSurvivalDashboardRecord() {
  if (typeof window !== "undefined" && window.SurvivalModule && typeof window.SurvivalModule.updateSurvivalDashboardRecord === "function") {
    return window.SurvivalModule.updateSurvivalDashboardRecord();
  }
  return null;
}
