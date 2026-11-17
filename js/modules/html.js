/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Escape de texto para HTML (uma implementação só)
 * ==========================================================================
 * Todo texto que vem de dado (capítulos, traduções, frases, nomes de perfil,
 * arquivos importados) passa por aqui antes de entrar em innerHTML.
 */

(function () {
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;", "`": "&#096;" };

/** Escapa &, <, >, aspas e crase. null e undefined viram texto vazio. */
function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (ch) => MAP[ch]);
}

const GamidaHTML = { escapeHTML };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.GamidaHTML = GamidaHTML;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = GamidaHTML;
}
})();
