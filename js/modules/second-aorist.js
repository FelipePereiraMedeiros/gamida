/**
 * ==========================================================================
 * Gamida - Radicais do 2º Aoristo (Grego Koiné)
 * ==========================================================================
 * Tabela de estudo dos verbos cujo aoristo é formado sobre um radical próprio,
 * diferente do radical do presente. Lista, traduções, radicais e ocorrências no NT
 * seguem o vocabulário da Lição 11 de Bergmann. Cada verbete traz:
 *  - lemma: forma de dicionário (1ª sg do presente)
 *  - aorist: 1ª sg do indicativo aoristo (forma principal)
 *  - stem: radical do 2º aoristo
 *  - infinitive: infinitivo aoristo
 *  - translations: tradução no infinitivo (português)
 *  - pastTranslations: tradução da forma do aoristo (1ª sg), também aceita na prática
 *  - frequency: ocorrências no NT (conforme a gramática)
 */

(function () {
const SECOND_AORIST_VERBS = [
  { lemma: "ἄγω", lemmaTranslit: "agō", aorist: "ἤγαγον", aoristTranslit: "ēgagon", stem: "ἀγαγ-", infinitive: "ἀγαγεῖν", infinitiveTranslit: "agagein", translations: ["conduzir", "guiar", "ir"], pastTranslations: ["conduzi", "guiei"], frequency: 67 },
  { lemma: "ἁμαρτάνω", lemmaTranslit: "hamartanō", aorist: "ἥμαρτον", aoristTranslit: "hēmarton", stem: "ἁμαρτ-", infinitive: "ἁμαρτεῖν", infinitiveTranslit: "hamartein", translations: ["errar o alvo", "pecar"], pastTranslations: ["errei o alvo", "pequei"], frequency: 43 },
  { lemma: "ἀποθνῄσκω", lemmaTranslit: "apothnēskō", aorist: "ἀπέθανον", aoristTranslit: "apethanon", stem: "θαν-", infinitive: "ἀποθανεῖν", infinitiveTranslit: "apothanein", translations: ["morrer"], pastTranslations: ["morri"], frequency: 111 },
  { lemma: "ἀπόλλυμι", lemmaTranslit: "apollymi", aorist: "ἀπωλόμην", aoristTranslit: "apōlomēn", stem: "ἀπολ-", infinitive: "ἀπολέσθαι", infinitiveTranslit: "apolesthai", translations: ["destruir", "perecer"], pastTranslations: ["pereci"], frequency: 91, note: "2º aoristo médio (sentido intransitivo: perecer)" },
  { lemma: "ἀποστέλλω", lemmaTranslit: "apostellō", aorist: "ἀπεστάλην", aoristTranslit: "apestalēn", stem: "σταλ-", infinitive: "ἀποσταλῆναι", infinitiveTranslit: "apostalēnai", translations: ["enviar"], pastTranslations: ["fui enviado"], frequency: 132, note: "2º aoristo passivo (o ativo é ἀπέστειλα)" },
  { lemma: "βάλλω", lemmaTranslit: "ballō", aorist: "ἔβαλον", aoristTranslit: "ebalon", stem: "βαλ-", infinitive: "βαλεῖν", infinitiveTranslit: "balein", translations: ["jogar", "lançar"], pastTranslations: ["joguei", "lancei"], frequency: 122 },
  { lemma: "γίνομαι", lemmaTranslit: "ginomai", aorist: "ἐγενόμην", aoristTranslit: "egenomēn", stem: "γεν-", infinitive: "γενέσθαι", infinitiveTranslit: "genesthai", translations: ["ser", "vir a ser", "tornar-se", "acontecer"], pastTranslations: ["fui", "vim a ser", "tornei-me", "me tornei", "aconteci"], frequency: 670, note: "depoente: 2º aoristo médio" },
  { lemma: "ἐγείρω", lemmaTranslit: "egeirō", aorist: "ἠγέρθην", aoristTranslit: "ēgerthēn", stem: "ἐγερ-", infinitive: "ἐγερθῆναι", infinitiveTranslit: "egerthēnai", translations: ["levantar", "erguer", "despertar", "acordar", "ressuscitar"], pastTranslations: ["fui levantado", "levantei-me", "me levantei", "despertei", "acordei", "ressuscitei", "fui ressuscitado"], frequency: 144, note: "no NT o aoristo aparece sobretudo no passivo ἠγέρθην ('ressuscitou')" },
  { lemma: "ἔρχομαι", lemmaTranslit: "erchomai", aorist: "ἦλθον", aoristTranslit: "ēlthon", stem: "ἐλθ-", infinitive: "ἐλθεῖν", infinitiveTranslit: "elthein", translations: ["ir", "vir"], pastTranslations: ["fui", "vim"], frequency: 636, note: "depoente no presente, aoristo ativo" },
  { lemma: "ἐσθίω", lemmaTranslit: "esthiō", aorist: "ἔφαγον", aoristTranslit: "ephagon", stem: "φαγ-", infinitive: "φαγεῖν", infinitiveTranslit: "phagein", translations: ["comer"], pastTranslations: ["comi"], frequency: 158 },
  { lemma: "εὑρίσκω", lemmaTranslit: "heuriskō", aorist: "εὗρον", aoristTranslit: "heuron", stem: "εὑρ-", infinitive: "εὑρεῖν", infinitiveTranslit: "heurein", translations: ["achar", "encontrar"], pastTranslations: ["achei", "encontrei"], frequency: 176 },
  { lemma: "ἔχω", lemmaTranslit: "echō", aorist: "ἔσχον", aoristTranslit: "eschon", stem: "σχ-", infinitive: "σχεῖν", infinitiveTranslit: "schein", translations: ["ter", "segurar", "possuir", "estar"], pastTranslations: ["tive", "segurei", "possuí", "estive"], frequency: 711 },
  { lemma: "λαμβάνω", lemmaTranslit: "lambanō", aorist: "ἔλαβον", aoristTranslit: "elabon", stem: "λαβ-", infinitive: "λαβεῖν", infinitiveTranslit: "labein", translations: ["tomar", "receber"], pastTranslations: ["tomei", "recebi"], frequency: 260 },
  { lemma: "λέγω", lemmaTranslit: "legō", aorist: "εἶπον", aoristTranslit: "eipon", stem: "εἰπ-", infinitive: "εἰπεῖν", infinitiveTranslit: "eipein", translations: ["dizer", "falar"], pastTranslations: ["disse", "falei"], frequency: 2262, note: "radical de outra raiz (supletivo)" },
  { lemma: "ὁράω", lemmaTranslit: "horaō", aorist: "εἶδον", aoristTranslit: "eidon", stem: "ἰδ-", infinitive: "ἰδεῖν", infinitiveTranslit: "idein", translations: ["ver", "perceber", "contemplar"], pastTranslations: ["vi", "percebi", "contemplei"], frequency: 449, note: "radical de outra raiz (supletivo)" },
  { lemma: "πάσχω", lemmaTranslit: "paschō", aorist: "ἔπαθον", aoristTranslit: "epathon", stem: "παθ-", infinitive: "παθεῖν", infinitiveTranslit: "pathein", translations: ["sofrer", "padecer"], pastTranslations: ["sofri", "padeci"], frequency: 42 },
  { lemma: "πίνω", lemmaTranslit: "pinō", aorist: "ἔπιον", aoristTranslit: "epion", stem: "πι-", infinitive: "πιεῖν", infinitiveTranslit: "piein", translations: ["beber"], pastTranslations: ["bebi"], frequency: 73 },
  { lemma: "πίπτω", lemmaTranslit: "piptō", aorist: "ἔπεσον", aoristTranslit: "epeson", stem: "πεσ-", infinitive: "πεσεῖν", infinitiveTranslit: "pesein", translations: ["cair"], pastTranslations: ["caí"], frequency: 90 },
];

function escapeHTML(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Cópia da lista em ordem alfabética do lema */
function getSecondAoristVerbs() {
  return SECOND_AORIST_VERBS.map((v) => ({ ...v, translations: [...v.translations], pastTranslations: [...(v.pastTranslations || [])] }));
}

/**
 * Converte a tabela em itens de prática: o aluno vê a forma do aoristo e
 * digita a tradução (no infinitivo ou na forma do passado).
 */
function buildSecondAoristQuestions() {
  return SECOND_AORIST_VERBS.map((v) => ({
    term: v.aorist,
    transliteration: `${v.aoristTranslit} · radical ${v.stem}`,
    translations: [...v.translations, ...(v.pastTranslations || [])],
    type: "2º Aoristo",
    lemma: v.lemma,
    stem: v.stem,
    infinitive: v.infinitive,
    secondAorist: true,
  }));
}

/** Resumo exibido após responder: lema, radical, infinitivo e tradução */
function describeSecondAorist(item) {
  if (!item) return "";
  const v = SECOND_AORIST_VERBS.find((x) => x.aorist === item.term || x.lemma === item.lemma);
  if (!v) return "";
  return `${v.aorist} ← ${v.lemma} · radical ${v.stem} · inf. ${v.infinitive}`;
}

function renderSecondAoristTableHTML(filter = "") {
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = norm(filter).trim();
  const rows = SECOND_AORIST_VERBS.filter((v) => {
    if (!q) return true;
    return [v.lemma, v.lemmaTranslit, v.aorist, v.aoristTranslit, v.stem, v.infinitive, v.infinitiveTranslit, ...v.translations]
      .some((f) => norm(f).includes(q));
  });
  if (rows.length === 0) {
    return `<tr><td colspan="6" class="px-5 py-6 text-center text-slate-400">Nenhum verbo encontrado.</td></tr>`;
  }
  return rows
    .map(
      (v) => `
      <tr class="hover:bg-slate-800/40">
        <td class="px-5 py-3"><span class="greek-text text-base text-white">${escapeHTML(v.lemma)}</span><span class="aorist-sub">${escapeHTML(v.lemmaTranslit)}</span></td>
        <td class="px-5 py-3"><span class="greek-text text-base text-white">${escapeHTML(v.aorist)}</span><span class="aorist-sub">${escapeHTML(v.aoristTranslit)}</span></td>
        <td class="px-5 py-3"><span class="greek-text text-base font-semibold aorist-stem">${escapeHTML(v.stem)}</span>${v.note ? `<span class="aorist-sub">${escapeHTML(v.note)}</span>` : ""}</td>
        <td class="px-5 py-3"><span class="greek-text text-base text-white">${escapeHTML(v.infinitive)}</span><span class="aorist-sub">${escapeHTML(v.infinitiveTranslit)}</span></td>
        <td class="px-5 py-3 text-slate-200">${escapeHTML(v.translations.join(", "))}</td>
        <td class="px-5 py-3 text-right text-slate-400 tabular-nums">${escapeHTML(Number(v.frequency || 0).toLocaleString("pt-BR"))}</td>
      </tr>`,
    )
    .join("");
}

const api = {
  SECOND_AORIST_VERBS,
  getSecondAoristVerbs,
  buildSecondAoristQuestions,
  describeSecondAorist,
  renderSecondAoristTableHTML,
};

if (typeof window !== "undefined") {
  window.SecondAoristModule = api;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
})();
