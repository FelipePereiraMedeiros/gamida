/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Aviso de endereço novo (mudança do GitHub Pages para o Cloudflare)
 * ==========================================================================
 * O progresso fica no navegador, preso ao endereço do site: no endereço novo o
 * aluno começa vazio. Por isso, quem abre o Gamida no endereço antigo vê um
 * aviso para levar o perfil (entrar com Google ou baixar o arquivo de perfil)
 * e um link para o endereço novo.
 *
 * DESLIGADO enquanto NEW_HOME_URL estiver vazio. Para ligar: coloque o endereço
 * novo (ex.: "https://gamida.pages.dev/") e publique no endereço antigo.
 * Passo a passo em docs/producao.md. Depois que o endereço antigo sair do ar,
 * este arquivo e o <script> dele no index.html podem ser apagados.
 */

(function () {
/** Endereço novo do Gamida; vazio = aviso desligado */
const NEW_HOME_URL = "";
/** Endereços antigos, onde o aviso aparece */
const OLD_HOST = /\.github\.io$/i;
const DISMISS_KEY = "gamida_new_home_dismissed";

function shouldShow(host = typeof location !== "undefined" ? location.hostname : "", url = NEW_HOME_URL) {
  if (!url || !OLD_HOST.test(host || "")) return false;
  try {
    return new URL(url).hostname !== host;
  } catch (_) {
    return false;
  }
}

function esc(text) {
  const H = typeof window !== "undefined" && window.GamidaHTML;
  return H ? H.escapeHTML(text) : String(text);
}

function render() {
  if (typeof document === "undefined" || !shouldShow() || document.getElementById("new-home")) return;
  try {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
  } catch (_) {}
  const box = document.createElement("section");
  box.id = "new-home";
  box.className = "new-home";
  box.setAttribute("role", "region");
  box.setAttribute("aria-label", "O Gamida mudou de endereço");
  box.innerHTML = `<p class="new-home__text"><b>O Gamida mudou de endereço:</b> <a href="${esc(NEW_HOME_URL)}" rel="noopener">${esc(NEW_HOME_URL.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>.
    O seu progresso está guardado neste endereço. Antes de ir, leve o seu perfil: na aba <b>Perfil</b>, entre com Google (ou baixe o arquivo de perfil) e, no endereço novo, entre com a mesma conta (ou carregue o arquivo).</p>
    <div class="new-home__row">
      <button type="button" class="answer-btn" id="new-home-profile">Levar meu perfil</button>
      <a class="btn-secondary" id="new-home-go" href="${esc(NEW_HOME_URL)}" rel="noopener">Abrir o endereço novo</a>
      <button type="button" class="link-btn" id="new-home-later">Agora não</button>
    </div>`;
  document.body.insertBefore(box, document.body.firstChild);
  box.querySelector("#new-home-profile").addEventListener("click", () => {
    if (typeof window.switchTab === "function") window.switchTab("profile");
  });
  box.querySelector("#new-home-later").addEventListener("click", () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch (_) {}
    box.remove();
  });
}

const NewHome = { NEW_HOME_URL, shouldShow, render };

if (typeof window !== "undefined") {
  window.NewHome = NewHome;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
}
if (typeof module !== "undefined" && module.exports) module.exports = NewHome;
})();
