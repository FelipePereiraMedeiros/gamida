/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
// Devolve a resposta do Google ao Gamida. O token fica só neste navegador:
// nada é enviado para outro lugar.
(function () {
  var hash = window.location.hash || "";
  var params = new URLSearchParams(hash.replace(/^#/, ""));
  var state = params.get("state") || "";
  var viaPopup = /\.p$/.test(state);
  try {
    localStorage.setItem("gamida_google_oauth_result", JSON.stringify({ hash: hash, at: Date.now() }));
  } catch (_) {}
  // Tira o token da barra de endereço e do histórico
  try { history.replaceState(null, "", window.location.pathname); } catch (_) {}
  if (viaPopup) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "gamida-oauth", hash: hash }, window.location.origin);
      }
    } catch (_) {}
    document.getElementById("msg").textContent = "Pronto. Pode fechar esta janela e voltar ao Gamida.";
    setTimeout(function () { window.close(); }, 300);
  } else {
    window.location.replace("index.html");
  }
})();
