/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * Primeira coisa que roda, ainda no <head>: aplica o idioma salvo antes da
 * primeira pintura (evita o "piscar" de cor) e declara a versão do sistema.
 * Fica em arquivo próprio porque a política de segurança (CSP) do index.html
 * não permite script escrito dentro do HTML.
 */
window.APP_VERSION = "2.62.0";
try {
  if (localStorage.getItem("gamida_language") === "greek") {
    document.documentElement.setAttribute("data-lang", "greek");
  }
} catch (_) {}
