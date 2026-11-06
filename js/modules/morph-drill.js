/**
 * ==========================================================================
 * Gamida - Mago da Morfologia: análise morfológica com caixas de seleção (Grego)
 * ==========================================================================
 * Cada questão mostra uma palavra dentro da frase de uma lição de Bergmann.
 * O aluno marca nas caixas de seleção a classe gramatical e as categorias
 * que se aplicam (caso, gênero, número, pessoa, tempo, modo e voz) e deixa
 * em branco as que não se aplicam, como numa prova de análise morfológica.
 *
 * O gabarito vem dos próprios tokens das frases (inflection, word_class e
 * syntax_role). Quando o dado não informa uma categoria, ela não é corrigida.
 */

(function () {
  // ------------------------------------------------------------------------
  // 1. Categorias e opções
  // ------------------------------------------------------------------------
  const FIELDS = [
    { key: "classe", label: "Classe", single: true, options: ["Substantivo", "Adjetivo", "Artigo", "Pronome", "Verbo", "Preposição", "Conjunção", "Advérbio", "Partícula", "Numeral", "Interjeição"] },
    { key: "caso", label: "Caso", options: ["Nominativo", "Genitivo", "Dativo", "Acusativo", "Vocativo"] },
    { key: "genero", label: "Gênero", options: ["Masculino", "Feminino", "Neutro"] },
    { key: "numero", label: "Número", options: ["Singular", "Plural"] },
    { key: "pessoa", label: "Pessoa", options: ["1ª", "2ª", "3ª"] },
    { key: "tempo", label: "Tempo", options: ["Presente", "Imperfeito", "Futuro", "Aoristo", "Perfeito", "Mais-que-perfeito"] },
    { key: "modo", label: "Modo", options: ["Indicativo", "Subjuntivo", "Imperativo", "Optativo", "Infinitivo", "Particípio"] },
    { key: "voz", label: "Voz", options: ["Ativa", "Média", "Passiva"] }
  ];
  const FIELD_KEYS = FIELDS.map((f) => f.key);
  const MORPH_KEYS = FIELD_KEYS.filter((k) => k !== "classe");

  // Valor "não se aplica": o grupo deve ficar sem nenhuma caixa marcada
  const NA = "—";

  const CLASS_PATTERNS = [
    ["Verbo", /verbo|partic[ií]pio|infinitivo/i],
    ["Artigo", /artigo/i],
    ["Pronome", /pronome/i],
    ["Substantivo", /substantivo|\bnome\b/i],
    ["Adjetivo", /adjetivo/i],
    ["Numeral", /numeral/i],
    ["Preposição", /preposi[çc][ãa]o/i],
    ["Conjunção", /conjun[çc][ãa]o/i],
    ["Advérbio", /adv[ée]rbio/i],
    ["Partícula", /part[ií]cula/i],
    ["Interjeição", /interjei[çc][ãa]o/i]
  ];

  const INVARIABLE_CLASSES = ["Preposição", "Conjunção", "Advérbio", "Partícula", "Interjeição"];

  // ------------------------------------------------------------------------
  // 2. Extração do gabarito a partir do token
  // ------------------------------------------------------------------------
  function detectClasses(wordClass) {
    const wc = String(wordClass || "");
    // "Verbo de ligação", "Particípio verbal substantivado": é verbo, não substantivo
    if (/^(?:verbo|partic[ií]pio|infinitivo)/i.test(wc.trim())) return ["Verbo"];
    // "Artigo substantivador" continua sendo artigo
    if (/^artigo/i.test(wc.trim())) return ["Artigo"];
    // "Advérbio substantivado", "Adjetivo substantivado": a classe é a de origem
    const cleaned = wc.replace(/substantivad[oa]r?/gi, "");
    const found = [];
    CLASS_PATTERNS.forEach(([name, re]) => {
      if (re.test(cleaned) && !found.includes(name)) found.push(name);
    });
    // Adjetivo ou pronome substantivado também pode ser analisado como substantivo
    if (/substantivad/i.test(wc) && found.some((c) => c === "Adjetivo" || c === "Pronome") && !found.includes("Substantivo")) {
      found.push("Substantivo");
    }
    // "Advérbio numeral ordinal" e "Numeral ordinal / adjetivo" ficam com as duas leituras
    return found;
  }

  function uniq(list) {
    return list.filter((v, i) => list.indexOf(v) === i);
  }

  function findCases(text) {
    const out = [];
    const re = /\b(nominativo|genitivo|dativo|acusativo|vocativo)\b/gi;
    let m;
    while ((m = re.exec(text))) {
      const v = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      out.push(v);
    }
    return uniq(out);
  }

  function findGenders(text) {
    const out = [];
    if (/\bmasculin[oa]s?\b|\bmasc\b\.?/i.test(text)) out.push("Masculino");
    if (/\bfeminin[oa]s?\b|\bfem\b\.?/i.test(text)) out.push("Feminino");
    if (/\bneutr[oa]s?\b/i.test(text)) out.push("Neutro");
    return out;
  }

  function findNumbers(text) {
    const out = [];
    if (/\bsingular\b|\bsg\b/i.test(text)) out.push("Singular");
    if (/\bplural\b|\bpl\b/i.test(text)) out.push("Plural");
    return out;
  }

  function findPersons(text) {
    const out = [];
    const re = /\b([123])\s*[ªa]\s*(?:pessoa|p\b|sg\b|pl\b|singular|plural)/gi;
    let m;
    while ((m = re.exec(text))) out.push(`${m[1]}ª`);
    return uniq(out);
  }

  function findTense(text) {
    const m = String(text).match(/mais-que-perfeito|\bimperfeito\b|\bperfeito\b|\bpresente\b|\bfuturo\b|\baoristo\b/i);
    if (!m) return [];
    const t = m[0].toLowerCase();
    const map = { "mais-que-perfeito": "Mais-que-perfeito", imperfeito: "Imperfeito", perfeito: "Perfeito", presente: "Presente", futuro: "Futuro", aoristo: "Aoristo" };
    return [map[t]];
  }

  function findMood(text) {
    const m = String(text).match(/\bindicativo\b|\bsubjuntivo\b|\bimperativo\b|\boptativo\b|\binfinitivo\b|\bpartic[ií]pio\b/i);
    if (!m) return [];
    const t = m[0].toLowerCase().replace("í", "i");
    const map = { indicativo: "Indicativo", subjuntivo: "Subjuntivo", imperativo: "Imperativo", optativo: "Optativo", infinitivo: "Infinitivo", participio: "Particípio" };
    return [map[t]];
  }

  function findVoices(text) {
    const s = String(text);
    if (/m[ée]di[oa][\s-]*(?:\/|e|-)?\s*passiv[oa]/i.test(s)) return ["Média", "Passiva"];
    const out = [];
    if (/\bativ[oa]\b/i.test(s)) out.push("Ativa");
    if (/\bm[ée]di[oa]\b/i.test(s)) out.push("Média");
    if (/\bpassiv[oa]\b/i.test(s)) out.push("Passiva");
    return out;
  }

  // Trecho do syntax_role que descreve a própria palavra (entre parênteses ou a locução verbal)
  function roleMorphSnippet(role, isVerb) {
    const r = String(role || "");
    const parts = [];
    const parenRe = /\(([^)]+)\)/g;
    let m;
    while ((m = parenRe.exec(r))) {
      const inside = m[1].replace(/['"“‘][^'"”’]*['"”’]/g, "");
      if (/(nominativo|genitivo|dativo|acusativo|vocativo|pessoa|singular|plural|presente|aoristo|futuro|perfeito|imperfeito|partic[ií]pio|infinitivo)/i.test(inside)) {
        parts.push(inside);
      }
    }
    if (isVerb) {
      // No verbo o papel sintático descreve a própria forma: usa as frases que trazem tempo ou modo
      r.replace(/['"“‘][^'"”’]*['"”’]/g, "").split(/\.\s+/).forEach((piece) => {
        if (/(presente|imperfeito|futuro|aoristo|perfeito|indicativo|subjuntivo|imperativo|optativo|infinitivo|partic[ií]pio)/i.test(piece)) parts.push(piece);
      });
    }
    return parts.join("; ");
  }

  /**
   * Gabarito de um token. Cada campo é:
   *  - array de valores aceitos (qualquer um deles conta como certo),
   *  - [NA] quando a categoria não se aplica (grupo deve ficar vazio),
   *  - null quando o dado não informa (o campo não é corrigido).
   */
  function extractGreekMorphology(token) {
    if (!token || !token.text) return null;
    const classes = detectClasses(token.word_class);
    if (classes.length === 0) return null;

    const wc = String(token.word_class || "");
    const inflection = String(token.inflection || "");
    const isVerb = classes.includes("Verbo");
    const snippet = roleMorphSnippet(token.syntax_role, isVerb);
    // Primeiro a flexão explícita; o papel sintático completa o que faltar
    const sources = [inflection, `${wc} ${snippet}`];
    const pick = (finder) => {
      for (const src of sources) {
        const v = finder(src);
        if (v.length) return v;
      }
      return null;
    };

    const res = { classe: classes };
    MORPH_KEYS.forEach((k) => (res[k] = [NA]));

    const invariable = classes.every((c) => INVARIABLE_CLASSES.includes(c));
    if (invariable) return res;

    if (isVerb) {
      const mood = pick(findMood) || (/partic[ií]pio/i.test(wc) ? ["Particípio"] : /infinitivo/i.test(wc) ? ["Infinitivo"] : null);
      res.modo = mood;
      res.tempo = pick(findTense);
      res.voz = pick(findVoices);
      const moodVal = mood && mood[0];
      if (moodVal === "Particípio") {
        res.caso = pick(findCases);
        res.genero = pick(findGenders);
        res.numero = pick(findNumbers);
      } else if (moodVal === "Infinitivo") {
        // infinitivo: sem pessoa, caso, gênero ou número
      } else {
        res.pessoa = pick(findPersons);
        res.numero = pick(findNumbers);
      }
      return res;
    }

    // Nominais: artigo, substantivo, adjetivo, pronome e numeral
    const indeclinable = /indeclin[áa]vel/i.test(wc) || /indeclin[áa]vel|invari[áa]vel/i.test(inflection);
    res.caso = pick(findCases);
    res.genero = pick(findGenders);
    res.numero = pick(findNumbers);
    if (classes.includes("Pronome")) {
      res.pessoa = pick(findPersons);
      if (!res.pessoa && !/pessoal|reflexivo|possessivo/i.test(wc)) res.pessoa = [NA];
      // ἐγώ, σύ, ἡμεῖς e ὑμεῖς não distinguem gênero
      if (!res.genero && /pessoal/i.test(wc) && res.pessoa && res.pessoa.every((p) => p === "1ª" || p === "2ª")) res.genero = [NA];
    }
    // Numeral cardinal indeclinável ou nome indeclinável sem caso informado
    if (indeclinable && !res.caso) {
      res.caso = null;
    }
    return res;
  }

  // ------------------------------------------------------------------------
  // 3. Banco de questões
  // ------------------------------------------------------------------------
  function cleanWord(text) {
    return String(text || "").replace(/[.,;:·?!;'’"“”()\[\]]/g, "").trim();
  }

  function isInvariable(expected) {
    return MORPH_KEYS.every((k) => expected[k] && expected[k].length === 1 && expected[k][0] === NA);
  }

  function gradedCount(expected) {
    return FIELD_KEYS.filter((k) => Array.isArray(expected[k])).length;
  }

  /**
   * Monta as questões das lições escolhidas.
   * @param {Array} chapters capítulos do grego
   * @param {Object} [opts] { chapterIds, includeInvariable }
   */
  function buildQuestions(chapters, opts = {}) {
    const ids = Array.isArray(opts.chapterIds) && opts.chapterIds.length ? new Set(opts.chapterIds) : null;
    const includeInvariable = !!opts.includeInvariable;
    const out = [];
    (chapters || []).forEach((chap) => {
      if (!chap || (ids && !ids.has(chap.id))) return;
      (chap.sentences || []).forEach((sentence, sIdx) => {
        const tokens = Array.isArray(sentence.tokens) ? sentence.tokens : [];
        tokens.forEach((token, tIdx) => {
          if (!cleanWord(token.text)) return;
          const expected = extractGreekMorphology(token);
          if (!expected) return;
          const invariable = isInvariable(expected);
          if (invariable && !includeInvariable) return;
          // Flexionada sem nenhuma categoria morfológica conhecida: não serve de questão
          if (!invariable && MORPH_KEYS.every((k) => expected[k] === null || expected[k][0] === NA)) return;
          out.push({
            id: `${chap.id}:${sentence.id || sIdx}:${tIdx}`,
            chapterId: chap.id,
            chapterTitle: chap.title || chap.id,
            sentenceText: sentence.term || sentence.greek || "",
            sentenceTranslation: Array.isArray(sentence.translations) ? sentence.translations[0] || "" : sentence.translation || "",
            tokens: tokens.map((t) => t.text),
            tokenIndex: tIdx,
            word: cleanWord(token.text),
            lemma: String(token.lemma || "").toLowerCase(),
            meaning: token.context_meaning || "",
            wordClass: token.word_class || "",
            inflection: token.inflection || "",
            role: token.syntax_role || "",
            expected
          });
        });
      });
    });
    return out;
  }

  // ------------------------------------------------------------------------
  // 4. Correção
  // ------------------------------------------------------------------------
  /**
   * Corrige as caixas marcadas.
   * @param {Object} expected gabarito de extractGreekMorphology
   * @param {Object} answers { campo: [valores marcados] }
   * @returns {{fields: Object, correct: number, total: number, allCorrect: boolean}}
   */
  function checkAnswer(expected, answers) {
    const fields = {};
    let correct = 0;
    let total = 0;
    FIELD_KEYS.forEach((key) => {
      const exp = expected ? expected[key] : null;
      const marked = Array.isArray(answers && answers[key]) ? answers[key] : [];
      if (!Array.isArray(exp)) {
        fields[key] = { status: "skip", expected: null, marked };
        return;
      }
      total++;
      let ok;
      if (exp.length === 1 && exp[0] === NA) {
        ok = marked.length === 0;
      } else if (key === "classe") {
        ok = marked.length === 1 && exp.includes(marked[0]);
      } else {
        // Formas ambíguas (ex.: nominativo/acusativo neutro): basta marcar uma leitura possível
        ok = marked.length > 0 && marked.every((v) => exp.includes(v));
      }
      if (ok) correct++;
      fields[key] = { status: ok ? "ok" : "wrong", expected: exp, marked };
    });
    return { fields, correct, total, allCorrect: total > 0 && correct === total };
  }

  function describeExpected(exp) {
    if (!Array.isArray(exp)) return "não informado";
    if (exp.length === 1 && exp[0] === NA) return "não se aplica";
    return exp.join(" ou ");
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ------------------------------------------------------------------------
  // 5. Interface
  // ------------------------------------------------------------------------
  const STORAGE_KEY = "gamida_morph_drill_prefs";
  const session = {
    queue: [],
    index: 0,
    results: [],
    answered: false,
    prefs: { chapterIds: null, amount: 15, includeInvariable: false }
  };

  function getChapters() {
    const st = typeof window !== "undefined" ? window.AppState : null;
    return (st && Array.isArray(st.chapters) ? st.chapters : []).filter((c) => Array.isArray(c.sentences) && c.sentences.length > 0);
  }

  function isGreek() {
    const st = typeof window !== "undefined" ? window.AppState : null;
    return !!st && st.language === "greek";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function byId(id) {
    return typeof document !== "undefined" ? document.getElementById(id) : null;
  }

  function show(id, visible) {
    const el = byId(id);
    if (el) el.classList.toggle("hidden", !visible);
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) Object.assign(session.prefs, JSON.parse(raw));
    } catch (e) { /* preferências são opcionais */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session.prefs));
    } catch (e) { /* preferências são opcionais */ }
  }

  function hideOtherAssessViews() {
    ["assess-dashboard", "assess-config", "assessment-active", "assessment-results", "anki-active", "anki-results", "survival-active", "survival-results", "path-overview", "path-active", "path-complete"].forEach((id) => show(id, false));
  }

  function shortTitle(title) {
    return String(title || "").replace(/^Lição\s+(\d+)\s*-\s*/i, "$1 · ");
  }

  /** Abre a tela de configuração (lições, quantidade, invariáveis) */
  function openMorphDrill() {
    if (typeof document === "undefined") return;
    if (!isGreek()) {
      alert("O Mago da Morfologia está disponível para o grego. Troque o idioma no topo da tela.");
      return;
    }
    loadPrefs();
    hideOtherAssessViews();
    show("morph-active", false);
    show("morph-results", false);
    show("morph-config", true);
    renderConfig();
  }

  function renderConfig() {
    const list = byId("morph-chapter-list");
    if (!list) return;
    const chapters = getChapters();
    const valid = new Set(chapters.map((c) => c.id));
    let selected = Array.isArray(session.prefs.chapterIds) ? session.prefs.chapterIds.filter((id) => valid.has(id)) : [];
    if (selected.length === 0) selected = chapters.map((c) => c.id);
    session.prefs.chapterIds = selected;
    const sel = new Set(selected);

    const allMarked = sel.size === chapters.length;
    list.innerHTML = `
      <label class="morph-chap morph-chap--all">
        <input type="checkbox" class="chapter-option__box" id="morph-chap-all"${allMarked ? " checked" : ""} />
        <span>${allMarked ? "Desmarcar todas" : "Marcar todas"} <small>${sel.size} de ${chapters.length}</small></span>
      </label>
      ${chapters.map((c) => {
        const count = buildQuestions([c], { includeInvariable: session.prefs.includeInvariable }).length;
        return `
        <label class="morph-chap">
          <input type="checkbox" class="chapter-option__box" data-morph-chap="${esc(c.id)}"${sel.has(c.id) ? " checked" : ""} />
          <span>${esc(shortTitle(c.title))} <small>${count} palavras</small></span>
        </label>`;
      }).join("")}
    `;
    const allBox = byId("morph-chap-all");
    if (allBox) {
      allBox.indeterminate = sel.size > 0 && !allMarked;
      allBox.onchange = () => {
        session.prefs.chapterIds = allMarked ? [] : chapters.map((c) => c.id);
        if (allMarked) session.prefs.chapterIds = [chapters[0] && chapters[0].id].filter(Boolean);
        savePrefs();
        renderConfig();
        const again = byId("morph-chap-all");
        if (again) again.focus();
      };
    }
    list.querySelectorAll("[data-morph-chap]").forEach((box) => {
      box.onchange = () => {
        const id = box.getAttribute("data-morph-chap");
        const set = new Set(session.prefs.chapterIds || []);
        if (box.checked) set.add(id);
        else set.delete(id);
        if (set.size === 0) {
          box.checked = true;
          return;
        }
        session.prefs.chapterIds = chapters.map((c) => c.id).filter((cid) => set.has(cid));
        savePrefs();
        renderConfig();
        const again = list.querySelector(`[data-morph-chap="${id}"]`);
        if (again) again.focus();
      };
    });

    document.querySelectorAll("[data-morph-amount]").forEach((btn) => {
      const val = btn.getAttribute("data-morph-amount");
      const isOn = String(session.prefs.amount) === val;
      btn.classList.toggle("is-on", isOn);
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");
    });
    const inv = byId("morph-include-invariable");
    if (inv) inv.checked = !!session.prefs.includeInvariable;

    const total = buildQuestions(chapters, { chapterIds: session.prefs.chapterIds, includeInvariable: session.prefs.includeInvariable }).length;
    const info = byId("morph-scope-info");
    if (info) info.textContent = `${total} palavras disponíveis nas lições marcadas.`;
  }

  function setMorphAmount(val) {
    session.prefs.amount = val === "max" ? "max" : parseInt(val, 10) || 15;
    savePrefs();
    renderConfig();
  }

  function toggleMorphInvariable(checked) {
    session.prefs.includeInvariable = !!checked;
    savePrefs();
    renderConfig();
  }

  function startMorphDrill(customQueue) {
    let queue = customQueue;
    if (!Array.isArray(queue)) {
      const pool = buildQuestions(getChapters(), {
        chapterIds: session.prefs.chapterIds,
        includeInvariable: session.prefs.includeInvariable
      });
      queue = shuffle(pool);
      if (session.prefs.amount !== "max") queue = queue.slice(0, session.prefs.amount);
    }
    if (queue.length === 0) {
      alert("Nenhuma palavra disponível nas lições marcadas.");
      return;
    }
    session.queue = queue;
    session.index = 0;
    session.results = [];
    hideOtherAssessViews();
    show("morph-config", false);
    show("morph-results", false);
    show("morph-active", true);
    renderQuestion();
  }

  function renderQuestion() {
    const q = session.queue[session.index];
    const box = byId("morph-question");
    if (!q || !box) return;
    session.answered = false;

    const progress = byId("morph-progress");
    if (progress) progress.textContent = `${session.index + 1} de ${session.queue.length}`;
    const score = byId("morph-score");
    if (score) {
      const ok = session.results.filter((r) => r.allCorrect).length;
      score.textContent = `${ok} certas`;
    }

    const sentenceHtml = q.tokens
      .map((t, i) => (i === q.tokenIndex ? `<mark class="morph-target">${esc(t)}</mark>` : esc(t)))
      .join(" ");

    const groups = FIELDS.map((f) => `
      <fieldset class="morph-group" data-morph-field="${f.key}">
        <legend class="morph-group__label">${f.label}${f.single ? "" : ' <span class="morph-group__hint">em branco se não se aplica</span>'}</legend>
        <div class="morph-group__opts">
          ${f.options.map((opt) => `
            <label class="morph-opt">
              <input type="checkbox" class="chapter-option__box" value="${esc(opt)}" data-field="${f.key}" />
              <span>${esc(opt)}</span>
            </label>`).join("")}
        </div>
        <p class="morph-group__feedback" aria-live="polite"></p>
      </fieldset>`).join("");

    box.innerHTML = `
      <p class="morph-chapter">${esc(q.chapterTitle)}</p>
      <p class="morph-sentence greek-text" lang="grc">${sentenceHtml}</p>
      <p class="morph-word">Analise: <strong class="greek-text" lang="grc">${esc(q.word)}</strong></p>
      <div class="morph-groups">${groups}</div>
      <div id="morph-answer-box" class="morph-answer hidden"></div>
    `;

    // Classe: só uma caixa marcada por vez
    box.querySelectorAll('input[data-field="classe"]').forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        box.querySelectorAll('input[data-field="classe"]').forEach((other) => {
          if (other !== input) other.checked = false;
        });
      });
    });

    const action = byId("morph-action");
    if (action) {
      action.textContent = "Verificar";
      action.onclick = submitMorphAnswer;
    }
  }

  function collectAnswers() {
    const answers = {};
    FIELD_KEYS.forEach((k) => (answers[k] = []));
    const box = byId("morph-question");
    if (!box) return answers;
    box.querySelectorAll("input[data-field]").forEach((input) => {
      if (input.checked) answers[input.getAttribute("data-field")].push(input.value);
    });
    return answers;
  }

  function submitMorphAnswer() {
    if (session.answered) return nextMorphQuestion();
    const q = session.queue[session.index];
    if (!q) return;
    const answers = collectAnswers();
    if (answers.classe.length === 0) {
      alert("Marque pelo menos a classe gramatical.");
      return;
    }
    const result = checkAnswer(q.expected, answers);
    session.answered = true;
    session.results.push({ question: q, answers, ...result });

    const box = byId("morph-question");
    FIELDS.forEach((f) => {
      const group = box.querySelector(`[data-morph-field="${f.key}"]`);
      if (!group) return;
      const r = result.fields[f.key];
      group.classList.add(`is-${r.status}`);
      group.querySelectorAll("input").forEach((input) => {
        input.disabled = true;
        const exp = r.expected || [];
        if (exp.includes(input.value)) input.closest(".morph-opt").classList.add("is-expected");
        if (input.checked && r.status === "wrong" && !exp.includes(input.value)) input.closest(".morph-opt").classList.add("is-wrong");
      });
      const fb = group.querySelector(".morph-group__feedback");
      if (fb) {
        if (r.status === "skip") fb.textContent = "Não corrigido: a lição não informa esta categoria.";
        else if (r.status === "ok") fb.textContent = "Certo.";
        else fb.textContent = `Gabarito: ${describeExpected(r.expected)}.`;
      }
    });

    const ans = byId("morph-answer-box");
    if (ans) {
      ans.innerHTML = `
        <p class="morph-answer__title">${result.allCorrect ? "Análise completa correta!" : `${result.correct} de ${result.total} categorias certas`}</p>
        <dl class="morph-answer__list">
          <dt>Forma léxica</dt><dd class="greek-text" lang="grc">${esc(q.lemma || "—")}</dd>
          ${q.inflection ? `<dt>Análise</dt><dd>${esc(q.wordClass)}. ${esc(q.inflection)}</dd>` : `<dt>Classe</dt><dd>${esc(q.wordClass)}</dd>`}
          ${q.meaning ? `<dt>Sentido</dt><dd>${esc(q.meaning)}</dd>` : ""}
          <dt>Função</dt><dd>${esc(q.role)}</dd>
          ${q.sentenceTranslation ? `<dt>Tradução</dt><dd>${esc(q.sentenceTranslation)}</dd>` : ""}
        </dl>`;
      ans.classList.remove("hidden");
      ans.classList.toggle("is-ok", result.allCorrect);
    }

    const action = byId("morph-action");
    if (action) {
      action.textContent = session.index + 1 < session.queue.length ? "Próxima" : "Ver resultado";
      action.onclick = nextMorphQuestion;
      action.focus();
    }
    const score = byId("morph-score");
    if (score) score.textContent = `${session.results.filter((r) => r.allCorrect).length} certas`;
  }

  function nextMorphQuestion() {
    if (session.index + 1 < session.queue.length) {
      session.index++;
      renderQuestion();
      const box = byId("morph-question");
      if (box && typeof box.scrollIntoView === "function") box.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      finishMorphDrill();
    }
  }

  /** Acerto por categoria ao longo da rodada */
  function summarize(results) {
    const perField = {};
    FIELD_KEYS.forEach((k) => (perField[k] = { ok: 0, total: 0 }));
    let fieldsOk = 0;
    let fieldsTotal = 0;
    results.forEach((r) => {
      FIELD_KEYS.forEach((k) => {
        const f = r.fields[k];
        if (!f || f.status === "skip") return;
        perField[k].total++;
        fieldsTotal++;
        if (f.status === "ok") {
          perField[k].ok++;
          fieldsOk++;
        }
      });
    });
    return {
      words: results.length,
      wordsCorrect: results.filter((r) => r.allCorrect).length,
      fieldsOk,
      fieldsTotal,
      percent: fieldsTotal ? Math.round((fieldsOk / fieldsTotal) * 100) : 0,
      perField
    };
  }

  function finishMorphDrill() {
    show("morph-active", false);
    show("morph-results", true);
    const box = byId("morph-results-body");
    if (!box) return;
    const sum = summarize(session.results);
    const misses = session.results.filter((r) => !r.allCorrect);
    const rows = FIELDS.filter((f) => sum.perField[f.key].total > 0).map((f) => {
      const p = sum.perField[f.key];
      const pct = Math.round((p.ok / p.total) * 100);
      return `<li><span>${f.label}</span><span class="morph-bar"><span style="width:${pct}%"></span></span><span>${p.ok}/${p.total}</span></li>`;
    }).join("");

    box.innerHTML = `
      <p class="round-summary__eyebrow">Mago da Morfologia</p>
      <p class="round-summary__score"><strong>${sum.percent}%</strong> das categorias</p>
      <p class="round-summary__note">${sum.wordsCorrect} de ${sum.words} palavras com análise completa correta.</p>
      <ul class="morph-stats">${rows}</ul>
      ${misses.length ? `
        <div class="round-summary__misses">
          <p class="round-summary__heading">Para revisar</p>
          <ul class="round-summary__list">
            ${misses.map((r) => {
              const wrong = FIELDS.filter((f) => r.fields[f.key].status === "wrong").map((f) => `${f.label}: ${describeExpected(r.fields[f.key].expected)}`);
              return `<li><span class="round-summary__term greek-text" lang="grc">${esc(r.question.word)}</span><span class="round-summary__meaning">${esc(wrong.join(" · "))}</span></li>`;
            }).join("")}
          </ul>
        </div>` : ""}
      <div class="round-summary__actions">
        ${misses.length ? '<button type="button" class="answer-btn" onclick="retryMorphMisses()">Refazer as erradas</button>' : ""}
        <button type="button" class="${misses.length ? "btn-secondary" : "answer-btn"}" onclick="startMorphDrill()">Nova rodada</button>
        <button type="button" class="btn-secondary" onclick="openMorphDrill()">Trocar lições</button>
        <button type="button" class="btn-secondary" onclick="resetToDashboard()">Voltar à Central</button>
      </div>`;
  }

  function retryMorphMisses() {
    const misses = session.results.filter((r) => !r.allCorrect).map((r) => r.question);
    startMorphDrill(shuffle(misses));
  }

  function quitMorphDrill() {
    if (session.results.length > 0 && session.index < session.queue.length) {
      finishMorphDrill();
      return;
    }
    show("morph-active", false);
    show("morph-config", false);
    show("morph-results", false);
    if (typeof window !== "undefined" && typeof window.resetToDashboard === "function") window.resetToDashboard();
  }

  /** Mostra o cartão apenas no grego */
  function updateMorphCardVisibility() {
    const card = byId("morph-mode-card");
    if (card) card.classList.toggle("hidden", !isGreek());
    if (isGreek()) return;
    const open = ["morph-config", "morph-active", "morph-results"].filter((id) => {
      const el = byId(id);
      return el && !el.classList.contains("hidden");
    });
    if (open.length === 0) return;
    open.forEach((id) => show(id, false));
    if (typeof window !== "undefined" && typeof window.resetToDashboard === "function") window.resetToDashboard();
  }

  const MorphDrillModule = {
    FIELDS,
    NA,
    detectClasses,
    extractGreekMorphology,
    buildQuestions,
    checkAnswer,
    summarize,
    describeExpected,
    openMorphDrill,
    startMorphDrill,
    submitMorphAnswer,
    nextMorphQuestion,
    finishMorphDrill,
    retryMorphMisses,
    quitMorphDrill,
    setMorphAmount,
    toggleMorphInvariable,
    updateMorphCardVisibility
  };

  if (typeof window !== "undefined") {
    window.MorphDrillModule = MorphDrillModule;
    window.openMorphDrill = openMorphDrill;
    window.startMorphDrill = startMorphDrill;
    window.submitMorphAnswer = submitMorphAnswer;
    window.retryMorphMisses = retryMorphMisses;
    window.quitMorphDrill = quitMorphDrill;
    window.setMorphAmount = setMorphAmount;
    window.toggleMorphInvariable = toggleMorphInvariable;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = MorphDrillModule;
  }
})();
