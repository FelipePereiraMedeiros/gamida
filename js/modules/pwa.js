/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Aplicativo instalável e sem internet
 * ==========================================================================
 * Registra o service worker (sw.js), que guarda o Gamida no aparelho. Quando
 * uma versão nova termina de baixar, mostra "Versão nova do Gamida pronta" com
 * o botão Atualizar (o aluno escolhe a hora, para não perder uma resposta).
 */

(function () {
let updateRequested = false;

function showUpdate(worker) {
  if (typeof document === "undefined" || document.getElementById("gamida-update")) return;
  const bar = document.createElement("div");
  bar.id = "gamida-update";
  bar.className = "other-tab-warning";
  bar.setAttribute("role", "status");
  const text = document.createElement("span");
  text.textContent = "Versão nova do Gamida pronta.";
  const update = document.createElement("button");
  update.type = "button";
  update.className = "btn-secondary";
  update.textContent = "Atualizar";
  update.addEventListener("click", () => {
    updateRequested = true;
    worker.postMessage("atualizar");
  });
  const later = document.createElement("button");
  later.type = "button";
  later.className = "btn-secondary";
  later.textContent = "Depois";
  later.addEventListener("click", () => bar.remove());
  bar.append(text, update, later);
  document.body.appendChild(bar);
}

function register() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // A versão nova assumiu depois do "Atualizar": recarrega uma vez
    if (reloading || !updateRequested) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.register("sw.js").then((reg) => {
    const watch = (worker) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker);
      });
    };
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
    watch(reg.installing);
    reg.addEventListener("updatefound", () => watch(reg.installing));
  }).catch((err) => console.warn("Aviso: o modo sem internet não pôde ser ativado:", err.message));
}

if (typeof window !== "undefined") {
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { register };
}
})();
