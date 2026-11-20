/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: "Estudo para exame" (MODO TEMPORÁRIO)
 * ==========================================================================
 * Modo à parte da aventura, no menu inicial das Crônicas: batalhas com o
 * conteúdo da lição "estudo_exame" (Provas 1 e 2, hebraico e grego). As
 * palavras viram criaturas e as frases das provas, o guardião.
 *
 * Não mexe na campanha: usa só a "batalha extra" do motor
 * (window.ScribeExtra.startExtraBattle), que não marca capítulo vencido nem
 * dá relíquia. Para retirar: apague este arquivo e o <script> dele no
 * index.html; o botão some do menu das Crônicas. Roteiro completo em
 * docs/desenvolvimento.md.
 */

(function () {
const CHAPTER_ID = "estudo_exame";
const STORE = "gamida_scribe_exam";
const GUARDIAN_SENTENCES = 5;
const SORTEIO_WORDS = 20;

const W = () => (typeof window !== "undefined" ? window : {});
const X = () => W().ScribeExtra;
const lang = () => (W().AppState && W().AppState.language === "greek" ? "greek" : "hebrew");
const examChapter = () => {
  const AppState = W().AppState;
  return AppState && (AppState.chapters || []).find((c) => c && c.id === CHAPTER_ID);
};

const WORD_OPTIONS = {
  hebrew: [["all", "Todas"], ["prova1", "Prova 1"], ["prova2", "Prova 2"], ["sorteio", "Sorteio de 20"], ["none", "Sem palavras"]],
  greek: [["all", "Todas (40)"], ["prova1", "Prova 1"], ["prova2", "Prova 2"], ["sorteio", "Sorteio de 20"], ["tabela", "Tabela de análise"], ["none", "Sem palavras"]],
};
const GUARDIAN_OPTIONS = [["both", "Das duas provas"], ["prova1", "Da Prova 1"], ["prova2", "Da Prova 2"], ["none", "Sem guardião"]];

function prefs() {
  const fallback = { words: "all", guardian: "both" };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(`${STORE}_${lang()}`) || "{}") };
  } catch (_) {
    return fallback;
  }
}
function savePrefs(p) {
  try {
    localStorage.setItem(`${STORE}_${lang()}`, JSON.stringify(p));
  } catch (_) {}
}

function shuffle(list) {
  const fn = W().shuffleArray;
  return typeof fn === "function" ? fn([...list]) : [...list].sort(() => Math.random() - 0.5);
}
const inProva = (x, prova) => x.group === prova || x.group === "ambas";

/** Palavras da batalha conforme a escolha */
function pickWords(chapter, which) {
  const items = (chapter.items || []).filter((i) => i && (i.translations || []).length);
  const vocab = items.filter((i) => i.kind !== "tabela");
  if (which === "none") return [];
  if (which === "tabela") return shuffle(items.filter((i) => i.kind === "tabela"));
  if (which === "sorteio") return shuffle(vocab).slice(0, SORTEIO_WORDS);
  if (which === "prova1" || which === "prova2") return shuffle(vocab.filter((i) => inProva(i, which)));
  return shuffle(vocab);
}

/** Frases do guardião: sorteadas da prova escolhida, só as que têm análise */
function pickSentences(chapter, which) {
  if (which === "none") return [];
  const all = (chapter.sentences || []).filter((s) => Array.isArray(s.tokens) && s.tokens.length);
  const pool = which === "both" ? all : all.filter((s) => inProva(s, which));
  return shuffle(pool).slice(0, GUARDIAN_SENTENCES);
}

/* ---------------- menu inicial das Crônicas ---------------- */

/** Botão no menu inicial (só quando a lição do exame existe no idioma) */
function menuHtml() {
  if (!examChapter() || !X()) return "";
  return `<div class="sc-exam-entry">
    <span class="sc-exam-entry__text"><b>Estudo para exame</b><span>Provas 1 e 2: as palavras viram criaturas e as frases das provas, o guardião. Fora da aventura: não conta capítulo.</span></span>
    <button type="button" class="sc-btn" id="sc-exam-open">Entrar</button>
  </div>`;
}

function bindMenu() {
  const btn = typeof document !== "undefined" ? document.getElementById("sc-exam-open") : null;
  if (btn) btn.onclick = showExamMenu;
}

/* ---------------- tela do exame ---------------- */

function seg(name, options, current) {
  return `<div class="sc-viewtoggle sc-exam-seg" role="group" aria-label="${name}">${options
    .map(([v, label]) => `<button type="button" class="sc-viewtoggle__btn${v === current ? " is-on" : ""}" data-exam-${name}="${v}" aria-pressed="${v === current}">${label}</button>`)
    .join("")}</div>`;
}

function showExamMenu() {
  const x = X();
  const chapter = examChapter();
  if (!x || !chapter) return;
  x.transition();
  x.music("map");
  const p = prefs();
  const words = pickWords(chapter, p.words).length;
  const sentences = Math.min(GUARDIAN_SENTENCES, pickSentences({ sentences: chapter.sentences }, p.guardian === "none" ? "both" : p.guardian).length);
  const greek = lang() === "greek";
  x.setScreen(`<div class="sc-card sc-exam">
    <span class="sc-eyebrow">Modo à parte da aventura</span>
    <h3 class="sc-h sc-h--big">Estudo para exame</h3>
    <p class="sc-story sc-story--left">${greek
      ? "Grego 2, Provas 1 e 2. O exame sorteia 20 das 40 palavras, traz uma tabela de análise e questões das provas."
      : "Hebraico 2, Provas 1 e 2. As frases das provas, com o vocabulário delas."}
      As palavras viram criaturas; as frases, o guardião. Seu herói, o nível e o XP valem aqui, mas nenhum capítulo da aventura muda.</p>
    <b class="sc-exam-label">Criaturas</b>
    ${seg("words", WORD_OPTIONS[lang()], p.words)}
    <b class="sc-exam-label">Guardião</b>
    ${seg("guardian", GUARDIAN_OPTIONS, p.guardian)}
    <p class="sc-muted sc-small">${p.words === "none" ? "Sem criaturas" : `${words} ${words === 1 ? "criatura" : "criaturas"}`}${p.guardian === "none" ? " · sem guardião" : ` · guardião com ${sentences} ${sentences === 1 ? "frase sorteada" : "frases sorteadas"}`}</p>
    <div class="sc-row sc-row--actions">
      <button type="button" class="sc-btn" id="sc-exam-go" ${p.words === "none" && p.guardian === "none" ? "disabled" : ""}>Batalhar</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-exam-map">Voltar ao mapa</button>
    </div>
  </div>`);
  document.querySelectorAll("#sc-screen [data-exam-words]").forEach((btn) => {
    btn.onclick = () => {
      savePrefs({ ...prefs(), words: btn.dataset.examWords });
      showExamMenu();
    };
  });
  document.querySelectorAll("#sc-screen [data-exam-guardian]").forEach((btn) => {
    btn.onclick = () => {
      savePrefs({ ...prefs(), guardian: btn.dataset.examGuardian });
      showExamMenu();
    };
  });
  const go = document.getElementById("sc-exam-go");
  if (go) go.onclick = startExamBattle;
  const back = document.getElementById("sc-exam-map");
  if (back) back.onclick = () => x.showMap();
}

/** Monta e começa a batalha com a escolha atual */
function startExamBattle() {
  const x = X();
  const chapter = examChapter();
  if (!x || !chapter) return;
  const p = prefs();
  const greek = lang() === "greek";
  x.startExtraBattle({
    id: CHAPTER_ID,
    title: "Estudo para exame",
    words: pickWords(chapter, p.words),
    sentences: pickSentences(chapter, p.guardian),
    boss: "Guardião das Provas",
    taunt: "Cada frase que você traduziu nas provas volta agora. Mostre que aprendeu!",
    tip: greek
      ? "A preposição decide o caso: εἰς + acusativo, ἐν + dativo, ἐκ + genitivo. Depois de ἵνα, subjuntivo."
      : "Tem verbo? Sem verbo, supra “ser” ou “estar”. Yod antes do sufixo = plural.",
    onEnd: showResult,
    onBack: showExamMenu,
  });
}

function showResult({ count, sentences, xp }) {
  const x = X();
  if (!x) return;
  x.setScreen(`<div class="sc-card sc-card--center">
    <span class="sc-muted">Estudo para exame</span>
    <div class="sc-big">${sentences ? "Guardião das Provas vencido" : "Ondas vencidas"}</div>
    <p class="sc-muted">${count} ${count === 1 ? "palavra" : "palavras"}${sentences ? ` · ${sentences} ${sentences === 1 ? "frase" : "frases"}` : ""} · +${xp} XP</p>
    <div class="sc-row">
      <button type="button" class="sc-btn" id="sc-exam-again">Batalhar de novo</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-exam-menu">Mudar a escolha</button>
      <button type="button" class="sc-btn sc-btn--ghost" id="sc-exam-map">Mapa</button>
    </div>
  </div>`);
  document.getElementById("sc-exam-again").onclick = startExamBattle;
  document.getElementById("sc-exam-menu").onclick = showExamMenu;
  document.getElementById("sc-exam-map").onclick = () => x.showMap();
}

const ScribeExam = { CHAPTER_ID, menuHtml, bindMenu, showExamMenu, startExamBattle, pickWords, pickSentences };

if (typeof window !== "undefined") window.ScribeExam = ScribeExam;
if (typeof module !== "undefined" && module.exports) module.exports = ScribeExam;
})();
