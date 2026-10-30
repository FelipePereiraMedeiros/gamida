/**
 * ==========================================================================
 * Módulo de Análise Morfossintática de Frases Bíblicas
 * Gamida - Biblical Language Trainer
 * 
 * Separação Estrita de Arquitetura e Pipelines:
 * 1. Hebraico Bíblico (Gramática de Page H. Kelley):
 *    - Reversão fiel e integral da anatomia original (Kelley)
 *    - Dissecação granular atômica de prefixos, partículas, raízes e sufixos pronominais
 *    - Direcionamento RTL estrito (navegação, ordem dos morfemas e maqqef)
 *    - Cards de Contexto Sintático, Inflexão e Regra Fonética / Gramatical (Kelley)
 *    - Interação completa: clique no fundo do contêiner desafixa para visão geral, hover inteligente
 * 
 * 2. Grego Bíblico (Gramática de Johannes Bergmann):
 *    - Metodologia canônica de tradução em 4 passos (§ Bergmann)
 *    - Passo 1: Identificação da classe gramatical
 *    - Passo 2: Detalhes morfológicos específicos da classe
 *    - Passo 3: Forma no vocabulário (lema/lexema) e tradução contextual
 *    - Passo 4: Linha contínua de redação fluente em português
 *    - Direcionamento LTR estrito, 10 classes canônicas, dissecação interlinear termo a termo
 * 
 * 3. Fachada Polimórfica (Dispatcher Universal):
 *    - Roteamento transparente baseado em detecção idiomática
 *    - Isolamento completo de estados (HebrewModalState / GreekModalState)
 * ==========================================================================
 */

(function (global) {
  "use strict";

  // ==========================================================================
  // 1. MAPEAMENTO DE CATEGORIAS MORFOLÓGICAS & ESTILOS
  // ==========================================================================

  // Categorias Canônicas de Hebraico Bíblico (Page Kelley - 9 Categorias)
  const HEBREW_CATEGORY_MAP = {
    article: {
      id: "article",
      name: "Artigo Definido",
      hebrewExamples: "הַ / הָ / הֶ",
      badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 ring-cyan-400",
      glowClass: "morpheme-article",
      colorName: "Ciano",
      accentHex: "#22d3ee"
    },
    conjunction: {
      id: "conjunction",
      name: "Conjunção",
      hebrewExamples: "וְ / וּ / וָ",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/50 ring-amber-400",
      glowClass: "morpheme-conjunction",
      colorName: "Âmbar",
      accentHex: "#fbbf24"
    },
    preposition: {
      id: "preposition",
      name: "Preposição",
      hebrewExamples: "בְּ, לְ, מִן־, כְּ, עַל",
      badgeClass: "bg-blue-500/20 text-blue-300 border-blue-400/50 ring-blue-400",
      glowClass: "morpheme-preposition",
      colorName: "Azul",
      accentHex: "#60a5fa"
    },
    noun: {
      id: "noun",
      name: "Substantivo",
      hebrewExamples: "שֵׁם",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 ring-emerald-400",
      glowClass: "morpheme-noun",
      colorName: "Verde Esmeralda",
      accentHex: "#34d399"
    },
    adjective: {
      id: "adjective",
      name: "Adjetivo",
      hebrewExamples: "תֹּאַר",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-400/50 ring-purple-400",
      glowClass: "morpheme-adjective",
      colorName: "Violeta / Púrpura",
      accentHex: "#c084fc"
    },
    verb: {
      id: "verb",
      name: "Verbo",
      hebrewExamples: "פֹּעַל",
      badgeClass: "bg-orange-500/20 text-orange-300 border-orange-400/50 ring-orange-400",
      glowClass: "morpheme-verb",
      colorName: "Laranja",
      accentHex: "#fb923c"
    },
    adverb: {
      id: "adverb",
      name: "Advérbio",
      hebrewExamples: "תֹּאַר הַפֹּעַל (שָׁם / אֵיפֹה / מְאֹד)",
      badgeClass: "bg-teal-500/20 text-teal-300 border-teal-400/50 ring-teal-400",
      glowClass: "morpheme-adverb",
      colorName: "Teal / Verde-azulado",
      accentHex: "#14b8a6"
    },
    suffix: {
      id: "suffix",
      name: "Sufixo Pronominal",
      hebrewExamples: "כִּנּוּי",
      badgeClass: "bg-pink-500/20 text-pink-300 border-pink-400/50 ring-pink-400",
      glowClass: "morpheme-suffix",
      colorName: "Rosa / Magenta",
      accentHex: "#f472b6"
    },
    particle: {
      id: "particle",
      name: "Partícula / Pronome",
      hebrewExamples: "מִלִּית",
      badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-400/50 ring-indigo-400",
      glowClass: "morpheme-particle",
      colorName: "Índigo",
      accentHex: "#818cf8"
    }
  };
  const CATEGORY_MAP = HEBREW_CATEGORY_MAP;

  // Categorias Canônicas de Grego Koiné (Johannes Bergmann - 10 Classes)
  const GREEK_CATEGORY_MAP = {
    article: {
      id: "article",
      name: "Artigo Definido",
      greekExamples: "ὁ / ἡ / τό",
      badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 ring-cyan-400",
      glowClass: "morpheme-article",
      colorName: "Ciano",
      accentHex: "#22d3ee"
    },
    conjunction: {
      id: "conjunction",
      name: "Conjunção",
      greekExamples: "καί / ἀλλά / ὅτι / ἵνα / γάρ",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/50 ring-amber-400",
      glowClass: "morpheme-conjunction",
      colorName: "Âmbar",
      accentHex: "#fbbf24"
    },
    preposition: {
      id: "preposition",
      name: "Preposição",
      greekExamples: "ἐν / εἰς / ἐκ / διά / πρός",
      badgeClass: "bg-blue-500/20 text-blue-300 border-blue-400/50 ring-blue-400",
      glowClass: "morpheme-preposition",
      colorName: "Azul",
      accentHex: "#60a5fa"
    },
    noun: {
      id: "noun",
      name: "Substantivo",
      greekExamples: "λόγος / ἀγάπη / ἔργον / θεός",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 ring-emerald-400",
      glowClass: "morpheme-noun",
      colorName: "Verde Esmeralda",
      accentHex: "#34d399"
    },
    adjective: {
      id: "adjective",
      name: "Adjetivo",
      greekExamples: "ἀγαθός / ἅγιος / αἰώνιος / πιστός",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-400/50 ring-purple-400",
      glowClass: "morpheme-adjective",
      colorName: "Violeta / Púrpura",
      accentHex: "#c084fc"
    },
    verb: {
      id: "verb",
      name: "Verbo",
      greekExamples: "λέγω / λύω / εἰμί / γινώσκω",
      badgeClass: "bg-orange-500/20 text-orange-300 border-orange-400/50 ring-orange-400",
      glowClass: "morpheme-verb",
      colorName: "Laranja",
      accentHex: "#fb923c"
    },
    adverb: {
      id: "adverb",
      name: "Advérbio",
      greekExamples: "οὐ / μή / νῦν / πάλιν / οὕτως",
      badgeClass: "bg-teal-500/20 text-teal-300 border-teal-400/50 ring-teal-400",
      glowClass: "morpheme-adverb",
      colorName: "Teal / Verde-azulado",
      accentHex: "#14b8a6"
    },
    pronoun: {
      id: "pronoun",
      name: "Pronome",
      greekExamples: "ἐγώ / σύ / αὐτός / οὗτος / ὅς",
      badgeClass: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50 ring-fuchsia-400",
      glowClass: "morpheme-pronoun",
      colorName: "Fúcsia / Violeta",
      accentHex: "#d946ef"
    },
    particle: {
      id: "particle",
      name: "Partícula / Numeral",
      greekExamples: "ἄν / ἄρα / εἷς / δύο",
      badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-400/50 ring-indigo-400",
      glowClass: "morpheme-particle",
      colorName: "Índigo",
      accentHex: "#818cf8"
    },
    suffix: {
      id: "suffix",
      name: "Sufixo",
      greekExamples: "—",
      badgeClass: "bg-pink-500/20 text-pink-300 border-pink-400/50 ring-pink-400",
      glowClass: "morpheme-suffix",
      colorName: "Rosa / Magenta",
      accentHex: "#f472b6"
    }
  };

  // Classificadores de Morfemas
  function getHebrewMorphemeCategory(typeStr) {
    if (!typeStr) return "particle";
    const t = String(typeStr).toLowerCase().trim();

    if (t.includes("sufixo")) return "suffix"; // Avaliado antes de 'pronome'
    if (t.includes("preposi")) return "preposition"; // Avaliado antes de 'artigo' (ex: preposição inseparável com artigo absorvido)
    if (t.includes("artigo")) return "article";
    if (t.includes("conjun") || t.includes("vav")) return "conjunction";
    if (t.includes("verbo") || t.includes("particípio") || t.includes("participio")) return "verb";
    if (t.includes("adjetivo")) return "adjective";
    if (t.includes("advérbio") || t.includes("adverbio") || t.includes("adverbial")) return "adverb";
    if (t.includes("substantivo") || t.includes("nome próprio") || t.includes("nome proprio") || t.includes("nome divino") || t.includes("epíteto") || t.includes("epiteto")) {
      return "noun";
    }
    // Partículas, pronomes, numerais
    return "particle";
  }
  const getMorphemeCategory = getHebrewMorphemeCategory;

  function getGreekMorphemeCategory(typeStr) {
    if (!typeStr) return "particle";
    const t = String(typeStr).toLowerCase().trim();

    if (t.includes("artigo")) return "article";
    if (t.includes("conjun")) return "conjunction";
    if (t.includes("preposi")) return "preposition";
    if (t.includes("verbo") || t.includes("particípio") || t.includes("participio") || t.includes("infinitivo")) return "verb";
    if (t.includes("adjetivo")) return "adjective";
    if (t.includes("advérbio") || t.includes("adverbio") || t.includes("adverbial")) return "adverb";
    if (t.includes("pronome")) return "pronoun";
    if (t.includes("substantivo") || t.includes("nome próprio") || t.includes("nome proprio") || t.includes("nome divino")) {
      return "noun";
    }
    return "particle";
  }

  // ==========================================================================
  // 2. FUNÇÕES UTILITÁRIAS & AUXILIARES
  // ==========================================================================

  function tokenEndsWithMaqqef(token) {
    if (!token || !token.text) return false;
    const s = String(token.text).trim();
    return s.endsWith("־") || s.endsWith("-") || s.endsWith("\u05BE");
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeHebrewForSearch(str) {
    if (!str) return "";
    return String(str)
      .trim()
      .normalize("NFC")
      .replace(/[\u0591-\u05C7\u05BE\s]/g, "");
  }

  function normalizeGreekForSearch(str) {
    if (!str) return "";
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,;:·?!'’"\s]/g, "")
      .toLowerCase();
  }

  function isGreekSentence(sentence) {
    if (!sentence) {
      return typeof AppState !== "undefined" && AppState.language === "greek";
    }
    const txt = sentence.term || sentence.hebrew || sentence.greek || "";
    if (sentence.hebrew || /[\u0590-\u05FF]/.test(txt)) {
      return false;
    }
    if (sentence.greek || (sentence.id && String(sentence.id).startsWith("bergmann"))) {
      return true;
    }
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(txt)) {
      return true;
    }
    return typeof AppState !== "undefined" && AppState.language === "greek";
  }

  const _sentenceDbCache = new Map();

  /**
   * Localiza a oração completa com tokens e morfemas no banco de dados pré-carregado
   * Otimizado com índice em memória para buscas subsequentes O(1)
   * @param {Object} sentence
   * @returns {Object|null}
   */
  function findSentenceInDatabase(sentence) {
    if (!sentence) return null;
    const isGrk = isGreekSentence(sentence);
    const langPrefix = isGrk ? "grk:" : "heb:";
    const sId = sentence.id;
    const sText = (sentence.hebrew || sentence.greek || sentence.term || "").trim();
    const sNorm = normalizeHebrewForSearch(sText);
    const sGNorm = normalizeGreekForSearch(sText);

    // Consulta O(1) no índice em cache escopado por idioma
    if (sId && _sentenceDbCache.has(langPrefix + "id:" + sId)) return _sentenceDbCache.get(langPrefix + "id:" + sId);
    if (sText && _sentenceDbCache.has(langPrefix + "text:" + sText)) return _sentenceDbCache.get(langPrefix + "text:" + sText);
    if (!isGrk && sNorm && _sentenceDbCache.has(langPrefix + "norm:" + sNorm)) return _sentenceDbCache.get(langPrefix + "norm:" + sNorm);
    if (isGrk && sGNorm && _sentenceDbCache.has(langPrefix + "gnorm:" + sGNorm)) return _sentenceDbCache.get(langPrefix + "gnorm:" + sGNorm);

    const pools = [];

    // 1. window.GAMIDA_DEFAULT_DATA (bundle offline compilado)
    if (typeof window !== "undefined" && window.GAMIDA_DEFAULT_DATA) {
      if (Array.isArray(window.GAMIDA_DEFAULT_DATA.hebrew)) {
        pools.push(window.GAMIDA_DEFAULT_DATA.hebrew);
      }
      if (Array.isArray(window.GAMIDA_DEFAULT_DATA.greek)) {
        pools.push(window.GAMIDA_DEFAULT_DATA.greek);
      }
    }

    // 2. DataLoader.cache (cache em memória do DataLoader)
    if (typeof DataLoader !== "undefined" && DataLoader.cache) {
      if (Array.isArray(DataLoader.cache.hebrew)) {
        pools.push(DataLoader.cache.hebrew);
      }
      if (Array.isArray(DataLoader.cache.greek)) {
        pools.push(DataLoader.cache.greek);
      }
    }

    // 3. AppState.chapters (capítulos ativos no estado da aplicação)
    if (typeof AppState !== "undefined" && Array.isArray(AppState.chapters)) {
      pools.push(AppState.chapters);
    }

    // 4. Fallback Node.js para bateria de testes unitários
    if (typeof process !== "undefined" && process.versions && process.versions.node && pools.length === 0) {
      try {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.resolve(__dirname, "../../data/hebrew_chapters.json");
        if (fs.existsSync(filePath)) {
          pools.push(JSON.parse(fs.readFileSync(filePath, "utf8")));
        }
        const greekPath = path.resolve(__dirname, "../../data/greek_chapters.json");
        if (fs.existsSync(greekPath)) {
          pools.push(JSON.parse(fs.readFileSync(greekPath, "utf8")));
        }
      } catch (e) {
        console.warn("Fallback Node.js não pôde ler arquivos de capítulos para análise:", e.message);
      }
    }

    for (const chapters of pools) {
      for (const ch of chapters) {
        for (const s of (ch.sentences || [])) {
          if (!Array.isArray(s.tokens) || s.tokens.length === 0) continue;

          const sIsGrk = isGreekSentence(s);
          const sPrefix = sIsGrk ? "grk:" : "heb:";

          // Indexa para consultas futuras O(1) escopado por idioma
          if (s.id) _sentenceDbCache.set(sPrefix + "id:" + s.id, s);
          const t1 = (s.hebrew || "").trim();
          const t2 = (s.term || "").trim();
          const t3 = (s.greek || "").trim();
          if (t1) _sentenceDbCache.set(sPrefix + "text:" + t1, s);
          if (t2) _sentenceDbCache.set(sPrefix + "text:" + t2, s);
          if (t3) _sentenceDbCache.set(sPrefix + "text:" + t3, s);
          const n1 = normalizeHebrewForSearch(t1);
          const n2 = normalizeHebrewForSearch(t2);
          if (n1) _sentenceDbCache.set(sPrefix + "norm:" + n1, s);
          if (n2) _sentenceDbCache.set(sPrefix + "norm:" + n2, s);
          const g1 = normalizeGreekForSearch(t1 || t3);
          const g2 = normalizeGreekForSearch(t2);
          if (g1) _sentenceDbCache.set(sPrefix + "gnorm:" + g1, s);
          if (g2) _sentenceDbCache.set(sPrefix + "gnorm:" + g2, s);

          if (sIsGrk !== isGrk) continue;

          if (sId && s.id === sId) return s;
          if (sText && (t1 === sText || t2 === sText || t3 === sText)) return s;
          if (!isGrk && sNorm && (n1 === sNorm || n2 === sNorm)) return s;
          if (isGrk && sGNorm && (g1 === sGNorm || g2 === sGNorm)) return s;
        }
      }
    }

    return null;
  }

  // ==========================================================================
  // 3. PIPELINE DE ANÁLISE MORFOLÓGICA DE HEBRAICO (PAGE KELLEY)
  // ==========================================================================

  function buildHebrewFlatMorphemesList(sentence) {
    const list = [];
    if (!sentence) return list;

    // Se a frase não possuir tokens, tenta recuperá-los do banco de dados
    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      const match = findSentenceInDatabase(sentence);
      if (match && Array.isArray(match.tokens) && match.tokens.length > 0) {
        sentence.tokens = match.tokens;
        if (!sentence.syntax_type && match.syntax_type) sentence.syntax_type = match.syntax_type;
        if (!sentence.notes && match.notes) sentence.notes = match.notes;
      }
    }

    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      // Se ainda não houver tokens cadastrados, decompõe as palavras por espaços em branco
      const rawText = (sentence.hebrew || sentence.term || "").trim();
      const words = rawText.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        let gIdx = 0;
        words.forEach((w, wIdx) => {
          const synthPart = {
            segment: w,
            transliteration: wIdx === 0 ? (sentence.transliteration || "") : "",
            type: sentence.type || "Vocábulo",
            meaning: wIdx === 0 && Array.isArray(sentence.translations) ? sentence.translations[0] : (sentence.translation || `Palavra ${wIdx + 1}`)
          };
          const synthToken = {
            text: w,
            composite: false,
            word_class: sentence.type || "Vocábulo",
            syntax_role: `Segmento ${wIdx + 1}`
          };
          list.push({
            index: gIdx++,
            tokenIdx: wIdx,
            partIdx: 0,
            token: synthToken,
            part: synthPart,
            category: getHebrewMorphemeCategory(synthPart.type)
          });
        });
        return list;
      }

      // Fallback para frase atômica única
      const fallbackText = sentence.hebrew || sentence.term || "";
      const fallbackPart = {
        segment: fallbackText,
        transliteration: sentence.transliteration || "",
        type: sentence.type || "Frase",
        meaning: Array.isArray(sentence.translations) ? sentence.translations[0] : (sentence.translation || "")
      };
      const fallbackToken = {
        text: fallbackText,
        transliteration: sentence.transliteration || "",
        composite: false,
        word_class: sentence.type || "Frase",
        syntax_role: sentence.syntax_type || "Oração Integral"
      };
      list.push({
        index: 0,
        tokenIdx: 0,
        partIdx: 0,
        token: fallbackToken,
        part: fallbackPart,
        category: getHebrewMorphemeCategory(fallbackPart.type)
      });
      return list;
    }

    let globalIdx = 0;
    sentence.tokens.forEach((token, tIdx) => {
      if (token.composite === true && Array.isArray(token.parts) && token.parts.length > 0) {
        token.parts.forEach((part, pIdx) => {
          list.push({
            index: globalIdx++,
            tokenIdx: tIdx,
            partIdx: pIdx,
            token: token,
            part: part,
            category: getHebrewMorphemeCategory(part.type)
          });
        });
      } else {
        const synthPart = {
          segment: token.text,
          transliteration: token.transliteration || "",
          type: token.word_class || "Vocábulo",
          meaning: token.lemma ? `Raiz / Lexema: ${token.lemma}` : "",
          inflection: token.inflection || "",
          phonetics: token.phonetics || token.notes || ""
        };
        list.push({
          index: globalIdx++,
          tokenIdx: tIdx,
          partIdx: 0,
          token: token,
          part: synthPart,
          category: getHebrewMorphemeCategory(token.word_class)
        });
      }
    });

    return list;
  }

  function renderHebrewSentenceMorphemesHTML(sentence) {
    if (!sentence) return "";

    // Se a frase não tiver tokens, tenta recuperá-los do banco de dados
    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      const match = findSentenceInDatabase(sentence);
      if (match && Array.isArray(match.tokens) && match.tokens.length > 0) {
        sentence.tokens = match.tokens;
        if (!sentence.syntax_type && match.syntax_type) sentence.syntax_type = match.syntax_type;
        if (!sentence.notes && match.notes) sentence.notes = match.notes;
      }
    }

    let tokens = sentence.tokens;
    if (!Array.isArray(tokens) || tokens.length === 0) {
      const rawText = (sentence.hebrew || sentence.term || "").trim();
      const words = rawText.split(/\s+/).filter(Boolean);
      tokens = words.length > 0
        ? words.map((w, idx) => ({
            text: w,
            composite: false,
            word_class: sentence.type || "Frase",
            syntax_role: sentence.syntax_type || `Segmento ${idx + 1}`
          }))
        : [
            {
              text: sentence.hebrew || sentence.term || "",
              composite: false,
              word_class: sentence.type || "Frase",
              syntax_role: sentence.syntax_type || "Oração"
            }
          ];
    }

    return tokens
      .map((token, tIdx) => {
        const hasMaqqef = tokenEndsWithMaqqef(token);
        const maqqefClass = hasMaqqef ? " has-maqqef" : "";

        if ((token.composite === true || Array.isArray(token.parts)) && Array.isArray(token.parts) && token.parts.length > 0) {
          const partsHTML = token.parts
            .map((part, pIdx) => {
              const cat = getHebrewMorphemeCategory(part.type);
              const meta = HEBREW_CATEGORY_MAP[cat] || HEBREW_CATEGORY_MAP.particle;
              return `<span class="morpheme ${meta.glowClass}" data-token-idx="${tIdx}" data-part-idx="${pIdx}" title="${escapeHTML(part.type + ': ' + (part.meaning || ''))}">${escapeHTML(part.segment)}</span>`;
            })
            .join("");
          return `<span class="token-wrapper${maqqefClass}" data-token-idx="${tIdx}">${partsHTML}</span>`;
        } else {
          const cat = getHebrewMorphemeCategory(token.word_class);
          const meta = HEBREW_CATEGORY_MAP[cat] || HEBREW_CATEGORY_MAP.particle;
          return `<span class="token-wrapper${maqqefClass}" data-token-idx="${tIdx}"><span class="morpheme ${meta.glowClass}" data-token-idx="${tIdx}" data-part-idx="0" title="${escapeHTML(token.word_class || '')}">${escapeHTML(token.text)}</span></span>`;
        }
      })
      .join("");
  }

  function renderHebrewRibbonHTML(flatMorphemes) {
    if (!Array.isArray(flatMorphemes) || flatMorphemes.length === 0) return "";

    const globalChip = `
      <button
        type="button"
        class="morpheme-chip global-chip px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-mono cursor-pointer shadow-sm is-active"
        data-morpheme-idx="global"
        title="Ver estrutura sintática e tradução de toda a oração"
      >
        <span>🏛️</span>
        <span class="font-semibold">Oração Completa</span>
      </button>
    `;

    const chipsHTML = flatMorphemes.map((item, idx) => {
      const cat = item.category || "particle";
      const meta = HEBREW_CATEGORY_MAP[cat] || HEBREW_CATEGORY_MAP.particle;
      const segment = escapeHTML(item.part ? item.part.segment : "");
      const typeName = escapeHTML(meta.name || "Morfema");
      return `
        <button
          type="button"
          class="morpheme-chip px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono cursor-pointer shadow-sm"
          data-morpheme-idx="${idx}"
          data-category="${cat}"
          title="${escapeHTML((item.part ? item.part.type : '') + ': ' + (item.part && item.part.meaning ? item.part.meaning : ''))}"
        >
          <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${meta.accentHex}"></span>
          <span class="hebrew-text font-bold text-base md:text-lg text-white" dir="rtl">${segment}</span>
          <span class="text-[11px] text-slate-400 font-sans">${typeName}</span>
        </button>
      `;
    }).join("");

    return globalChip + chipsHTML;
  }

  function renderHebrewGlobalView(sentence) {
    if (!sentence) return "";

    const syntaxType = sentence.syntax_type || "Estrutura Sintática Bíblica";
    const translation = Array.isArray(sentence.translations) && sentence.translations.length > 0
      ? sentence.translations[0]
      : (sentence.translation || "Tradução não disponível");
    const notes = sentence.notes || "Oração analisada sob a ótica da gramática de Page H. Kelley. Passe o mouse ou toque nos morfemas da frase para dissecar individualmente prefixos, preposições, raízes e sufixos.";
    const translit = sentence.transliteration || "";

    return `
      <div class="space-y-4 animate-in fade-in duration-150">
        <!-- Cabeçalho da Visão Global -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono text-xs font-semibold">
              🏛️ ${escapeHTML(syntaxType)}
            </span>
            ${translit ? `<span class="font-mono text-xs text-amber-400/90">[ ${escapeHTML(translit)} ]</span>` : ""}
          </div>
          <span class="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
            Visão Global da Oração
          </span>
        </div>

        <!-- Tradução Equivalente -->
        <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div class="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Tradução Equivalente / Literal
          </div>
          <div class="text-base md:text-lg font-semibold text-white">
            "${escapeHTML(translation)}"
          </div>
        </div>

        <!-- Resumo Sintático & Pedagógico -->
        <div class="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-slate-300 text-xs md:text-sm leading-relaxed">
          <div class="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <span>📜 Resumo Sintático & Pedagógico</span>
          </div>
          <p>${escapeHTML(notes)}</p>
        </div>

        <!-- Dica Pedagógica -->
        <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span class="flex items-center gap-1.5 text-brand-400">
            <span>💡</span>
            <em>Passe o mouse sobre qualquer letra ou parte da frase para dissecar sua formação.</em>
          </span>
          <span class="hidden sm:inline font-mono text-[11px] text-slate-500">
            Toque/clique fixa o morfema
          </span>
        </div>
      </div>
    `;
  }

  function renderHebrewDissectionView(mItem, sentence) {
    if (!mItem || !mItem.part) return "";

    const { part, token, category } = mItem;
    const catMeta = HEBREW_CATEGORY_MAP[category] || HEBREW_CATEGORY_MAP.particle;
    const isPinned = HebrewModalState.pinnedIndex === mItem.index;

    // Campos anatômicos
    const segment = part.segment || "";
    const translit = part.transliteration || "";
    const partType = part.type || "Elemento Morfológico";
    const meaning = part.meaning || "";
    const inflection = part.inflection || "";
    const phonetics = part.phonetics || "";
    const tokenText = token ? token.text : "";
    const tokenTranslit = token ? token.transliteration : "";
    const tokenRole = token ? (token.syntax_role || "Componente oracional") : "";
    const tokenLemma = token && token.lemma ? token.lemma : "";

    return `
      <div class="space-y-4 animate-in fade-in duration-150">
        <!-- Cabeçalho do Morfema -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div class="flex items-center gap-3">
            <!-- Segmento em Destaque Ampliado -->
            <div class="px-3.5 py-1 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
              <span class="hebrew-text text-2xl md:text-3xl font-bold text-white tracking-wide" dir="rtl">
                ${escapeHTML(segment)}
              </span>
            </div>

            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                ${translit ? `<span class="font-mono text-xs md:text-sm text-amber-400 font-bold">[ ${escapeHTML(translit)} ]</span>` : ""}
                <span class="px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${catMeta.badgeClass}">
                  ${escapeHTML(partType)}
                </span>
              </div>
              ${meaning ? `<span class="text-xs md:text-sm text-slate-200 font-medium mt-0.5">"${escapeHTML(meaning)}"</span>` : ""}
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${isPinned ? `
              <span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono flex items-center gap-1">
                <span>📌</span> Fixado
              </span>
            ` : `
              <span class="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Hover ativo
              </span>
            `}
          </div>
        </div>

        <!-- Grade de Detalhes Morfológicos, Fonéticos e Sintáticos -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Contexto Sintático da Palavra Inteira -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 md:col-span-2">
            <div class="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span class="flex items-center gap-1.5 text-slate-300 font-bold">
                <span>🧩</span> Contexto Sintático da Palavra Inteira
              </span>
              <span class="hebrew-text text-sm font-bold text-slate-200" dir="rtl">${escapeHTML(tokenText)}</span>
            </div>
            <div class="text-xs md:text-sm text-slate-300 leading-relaxed">
              <span class="font-medium text-white">${escapeHTML(tokenRole)}</span>
              ${tokenTranslit ? `<span class="font-mono text-xs text-amber-400/90 ml-1.5">(${escapeHTML(tokenTranslit)})</span>` : ""}
              ${tokenLemma ? `<span class="text-xs text-slate-400 ml-2">Raiz / Lexema: <strong class="hebrew-text text-sm text-brand-300" dir="rtl">${escapeHTML(tokenLemma)}</strong></span>` : ""}
            </div>
          </div>

          <!-- Camada Morfológica / Inflexão (se houver) -->
          ${inflection ? `
            <div class="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-1 ${!phonetics ? 'md:col-span-2' : ''}">
              <div class="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                <span>🧬</span> Inflexão & Morfologia
              </div>
              <p class="text-xs md:text-sm text-purple-100 font-medium leading-relaxed">
                ${escapeHTML(inflection)}
              </p>
            </div>
          ` : ""}

          <!-- Regras Fonéticas e Gramaticais de Page Kelley (se houver) -->
          ${phonetics ? `
            <div class="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1 ${!inflection ? 'md:col-span-2' : ''}">
              <div class="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <span>📜</span> Regra Fonética / Gramatical (Page Kelley)
              </div>
              <p class="text-xs md:text-sm text-amber-100/90 leading-relaxed">
                ${escapeHTML(phonetics)}
              </p>
            </div>
          ` : ""}
        </div>

        <!-- Barra de Ações Rápidas do Morfema -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onclick="SentenceAnalysisModule.setActiveMorphemeIndex(null, true)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Voltar para a visão global de toda a oração"
          >
            <span>🏛️</span>
            <span>Ver Toda a Frase</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="SentenceAnalysisModule.navigateMorphemes(-1)"
              class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Morfema Anterior (Seta Direita em RTL)"
            >
              <span>◀</span>
              <span>Anterior</span>
            </button>
            <span class="text-xs text-slate-400 font-mono">
              ${mItem.index + 1} / ${HebrewModalState.flatMorphemes.length}
            </span>
            <button
              type="button"
              onclick="SentenceAnalysisModule.navigateMorphemes(+1)"
              class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Próximo Morfema (Seta Esquerda em RTL)"
            >
              <span>Próximo</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        <!-- Rodapé de Navegação do Morfema -->
        <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Partícula ${mItem.index + 1} de ${HebrewModalState.flatMorphemes.length}</span>
          <span class="font-mono text-[11px]">
            ${isPinned ? "Toque novamente para desafixar" : "Clique ou toque para travar a leitura"}
          </span>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // ESTADO & CONTROLADORES DE INTERFACE DE HEBRAICO (PAGE KELLEY)
  // ==========================================================================

  const HebrewModalState = {
    isOpen: false,
    currentSentence: null,
    flatMorphemes: [],
    activeIndex: null,
    pinnedIndex: null,
    activeElement: null
  };

  let _hebrewAnalysisRafId = null;
  let _hebrewLeaveTimeoutId = null;

  function scheduleHebrewSyncUI(immediate = false) {
    if (_hebrewAnalysisRafId) {
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(_hebrewAnalysisRafId);
      _hebrewAnalysisRafId = null;
    }
    const runSync = () => {
      _hebrewAnalysisRafId = null;
      syncHebrewMorphemeDOMHighlights();
      updateHebrewAnalysisPanel();
    };
    if (immediate || typeof requestAnimationFrame !== "function") {
      runSync();
    } else {
      _hebrewAnalysisRafId = requestAnimationFrame(runSync);
    }
  }

  function updateHebrewAnalysisPanel() {
    const panel = document.getElementById("sentence-analysis-panel");
    if (!panel) return;
    const sentence = HebrewModalState.currentSentence;
    if (!sentence) {
      panel.innerHTML = "";
      return;
    }
    const targetIndex = HebrewModalState.pinnedIndex !== null
      ? HebrewModalState.pinnedIndex
      : HebrewModalState.activeIndex;

    if (targetIndex !== null && HebrewModalState.flatMorphemes[targetIndex]) {
      panel.innerHTML = renderHebrewDissectionView(
        HebrewModalState.flatMorphemes[targetIndex],
        sentence
      );
    } else {
      panel.innerHTML = renderHebrewGlobalView(sentence);
    }
  }

  function syncModalDOMHighlights(modalState) {
    const container = document.getElementById("sentence-morphemes-container");
    const ribbon = document.getElementById("sentence-morphemes-ribbon");
    const pinBadge = document.getElementById("analysis-pinned-indicator");

    if (pinBadge) {
      if (modalState.pinnedIndex !== null) {
        pinBadge.classList.remove("hidden");
      } else {
        pinBadge.classList.add("hidden");
      }
    }

    const currentTargetIndex = modalState.pinnedIndex !== null
      ? modalState.pinnedIndex
      : modalState.activeIndex;

    if (container) {
      const morphemeEls = container.querySelectorAll(".morpheme");
      morphemeEls.forEach((el) => {
        const tIdx = parseInt(el.getAttribute("data-token-idx"), 10);
        const pIdx = parseInt(el.getAttribute("data-part-idx"), 10);

        const isActive = currentTargetIndex !== null &&
          modalState.flatMorphemes[currentTargetIndex] &&
          modalState.flatMorphemes[currentTargetIndex].tokenIdx === tIdx &&
          modalState.flatMorphemes[currentTargetIndex].partIdx === pIdx;

        const isPinned = modalState.pinnedIndex !== null &&
          modalState.flatMorphemes[modalState.pinnedIndex] &&
          modalState.flatMorphemes[modalState.pinnedIndex].tokenIdx === tIdx &&
          modalState.flatMorphemes[modalState.pinnedIndex].partIdx === pIdx;

        if (isActive) el.classList.add("is-active");
        else el.classList.remove("is-active");

        if (isPinned) el.classList.add("is-pinned");
        else el.classList.remove("is-pinned");
      });
    }

    if (ribbon) {
      const chips = ribbon.querySelectorAll(".morpheme-chip");
      chips.forEach((chip) => {
        const rawIdx = chip.getAttribute("data-morpheme-idx");
        if (rawIdx === "global") {
          const isGlobalActive = currentTargetIndex === null;
          if (isGlobalActive) {
            chip.classList.add("is-active", "border-indigo-400", "bg-indigo-950/60");
            chip.classList.remove("border-slate-800", "bg-slate-900/60");
          } else {
            chip.classList.remove("is-active", "border-indigo-400", "bg-indigo-950/60");
            chip.classList.add("border-slate-800", "bg-slate-900/60");
          }
          return;
        }

        const idx = parseInt(rawIdx, 10);
        const isActive = currentTargetIndex === idx;
        const isPinned = modalState.pinnedIndex === idx;

        if (isActive || isPinned) {
          chip.classList.add("is-active");
          if (isPinned) chip.classList.add("ring-2", "ring-amber-400");
        } else {
          chip.classList.remove("is-active", "ring-2", "ring-amber-400");
        }
      });
    }
  }

  function syncHebrewMorphemeDOMHighlights() {
    syncModalDOMHighlights(HebrewModalState);
  }

  function setActiveHebrewMorphemeIndex(idx, pin = false) {
    if (idx === null) {
      HebrewModalState.activeIndex = null;
      if (pin) HebrewModalState.pinnedIndex = null;
    } else {
      const maxIdx = HebrewModalState.flatMorphemes.length - 1;
      const safeIdx = Math.max(0, Math.min(idx, maxIdx));
      if (pin) {
        if (HebrewModalState.pinnedIndex === safeIdx) {
          HebrewModalState.pinnedIndex = null;
          HebrewModalState.activeIndex = safeIdx;
        } else {
          HebrewModalState.pinnedIndex = safeIdx;
          HebrewModalState.activeIndex = safeIdx;
        }
      } else {
        HebrewModalState.activeIndex = safeIdx;
      }
    }
    scheduleHebrewSyncUI(true);
  }

  function navigateHebrewMorphemes(direction) {
    if (!HebrewModalState.isOpen || HebrewModalState.flatMorphemes.length === 0) return;
    const total = HebrewModalState.flatMorphemes.length;
    let current = HebrewModalState.pinnedIndex !== null
      ? HebrewModalState.pinnedIndex
      : (HebrewModalState.activeIndex !== null ? HebrewModalState.activeIndex : -1);

    let next;
    if (current === -1) {
      next = direction > 0 ? 0 : total - 1;
    } else {
      next = (current + direction + total) % total;
    }
    setActiveHebrewMorphemeIndex(next, true);
  }

  function handleHebrewModalKeyDown(e) {
    if (!HebrewModalState.isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      closeHebrewSentenceAnalysisModal();
    } else if (e.key === "ArrowLeft") {
      // Em RTL (Hebraico), seta para a esquerda avança (+1)
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      navigateHebrewMorphemes(+1);
    } else if (e.key === "ArrowRight") {
      // Em RTL (Hebraico), seta para a direita volta (-1)
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      navigateHebrewMorphemes(-1);
    }
  }

  function bindHebrewMorphemeContainerEvents(container) {
    if (!container || container._hebrewMorphemeEventsBound) return;
    container._hebrewMorphemeEventsBound = true;

    container.addEventListener("mouseover", (e) => {
      const morphemeEl = e.target.closest(".morpheme");
      if (!morphemeEl) return;
      if (_hebrewLeaveTimeoutId) {
        clearTimeout(_hebrewLeaveTimeoutId);
        _hebrewLeaveTimeoutId = null;
      }
      if (HebrewModalState.pinnedIndex !== null) return;

      const tIdx = parseInt(morphemeEl.getAttribute("data-token-idx"), 10);
      const pIdx = parseInt(morphemeEl.getAttribute("data-part-idx"), 10);
      const matchIdx = HebrewModalState.flatMorphemes.findIndex(
        (m) => m.tokenIdx === tIdx && m.partIdx === pIdx
      );
      if (matchIdx !== -1) {
        setActiveHebrewMorphemeIndex(matchIdx, false);
      }
    });

    container.addEventListener("mouseout", (e) => {
      if (HebrewModalState.pinnedIndex !== null) return;
      const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".morpheme, .morpheme-chip, .token-wrapper") : null;
      if (related) return;

      if (_hebrewLeaveTimeoutId) clearTimeout(_hebrewLeaveTimeoutId);
      _hebrewLeaveTimeoutId = setTimeout(() => {
        _hebrewLeaveTimeoutId = null;
        if (HebrewModalState.pinnedIndex === null && HebrewModalState.isOpen) {
          setActiveHebrewMorphemeIndex(null, false);
        }
      }, 40);
    });

    container.addEventListener("click", (e) => {
      if (_hebrewLeaveTimeoutId) {
        clearTimeout(_hebrewLeaveTimeoutId);
        _hebrewLeaveTimeoutId = null;
      }
      const morphemeEl = e.target.closest(".morpheme");
      if (morphemeEl) {
        e.stopPropagation();
        const tIdx = parseInt(morphemeEl.getAttribute("data-token-idx"), 10);
        const pIdx = parseInt(morphemeEl.getAttribute("data-part-idx"), 10);
        const matchIdx = HebrewModalState.flatMorphemes.findIndex(
          (m) => m.tokenIdx === tIdx && m.partIdx === pIdx
        );
        if (matchIdx !== -1) {
          setActiveHebrewMorphemeIndex(matchIdx, true);
        }
      } else {
        // Clicou no fundo do contêiner da frase -> desafixa e volta para visão global
        if (HebrewModalState.pinnedIndex !== null) {
          HebrewModalState.pinnedIndex = null;
          setActiveHebrewMorphemeIndex(null, false);
        }
      }
    });
  }

  function bindHebrewRibbonEvents(ribbon) {
    if (!ribbon || ribbon._hebrewRibbonEventsBound) return;
    ribbon._hebrewRibbonEventsBound = true;

    ribbon.addEventListener("mouseover", (e) => {
      const chip = e.target.closest(".morpheme-chip");
      if (!chip) return;
      if (_hebrewLeaveTimeoutId) {
        clearTimeout(_hebrewLeaveTimeoutId);
        _hebrewLeaveTimeoutId = null;
      }
      if (HebrewModalState.pinnedIndex !== null) return;
      const rawIdx = chip.getAttribute("data-morpheme-idx");
      if (rawIdx === "global") {
        setActiveHebrewMorphemeIndex(null, false);
        return;
      }
      const idx = parseInt(rawIdx, 10);
      if (!isNaN(idx)) {
        setActiveHebrewMorphemeIndex(idx, false);
      }
    });

    ribbon.addEventListener("mouseout", (e) => {
      if (HebrewModalState.pinnedIndex !== null) return;
      const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".morpheme-chip, .morpheme, .token-wrapper") : null;
      if (related) return;
      if (_hebrewLeaveTimeoutId) clearTimeout(_hebrewLeaveTimeoutId);
      _hebrewLeaveTimeoutId = setTimeout(() => {
        _hebrewLeaveTimeoutId = null;
        if (HebrewModalState.pinnedIndex === null && HebrewModalState.isOpen) {
          setActiveHebrewMorphemeIndex(null, false);
        }
      }, 40);
    });

    ribbon.addEventListener("click", (e) => {
      if (_hebrewLeaveTimeoutId) {
        clearTimeout(_hebrewLeaveTimeoutId);
        _hebrewLeaveTimeoutId = null;
      }
      const chip = e.target.closest(".morpheme-chip");
      if (!chip) return;
      e.stopPropagation();
      const rawIdx = chip.getAttribute("data-morpheme-idx");
      if (rawIdx === "global") {
        HebrewModalState.pinnedIndex = null;
        setActiveHebrewMorphemeIndex(null, true);
        return;
      }
      const idx = parseInt(rawIdx, 10);
      if (!isNaN(idx)) {
        setActiveHebrewMorphemeIndex(idx, true);
      }
    });
  }

  function openHebrewSentenceAnalysisModal(sentence) {
    if (!sentence || typeof document === "undefined") return;

    HebrewModalState.isOpen = true;
    HebrewModalState.currentSentence = sentence;
    HebrewModalState.flatMorphemes = buildHebrewFlatMorphemesList(sentence);
    HebrewModalState.activeIndex = null;
    HebrewModalState.pinnedIndex = null;

    let modal = document.getElementById("sentence-analysis-modal");
    if (!modal) {
      modal = createDynamicModalDOM();
    }

    const titleEl = document.getElementById("analysis-modal-title");
    const subtitleEl = titleEl ? titleEl.nextElementSibling : null;
    if (titleEl) {
      titleEl.textContent = "Análise Morfossintática de Frases Hebraicas";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "Dissecação granular de partículas, raízes e morfemas (Gramática de Page Kelley)";
    }

    const container = document.getElementById("sentence-morphemes-container");
    if (container) {
      container.setAttribute("dir", "rtl");
      container.classList.remove("greek-sentence-container", "greek-text");
      container.classList.add("hebrew-sentence-container");
      container.classList.add("hebrew-text");
      container.style.direction = "rtl";
      container.style.unicodeBidi = "isolate";
      container.innerHTML = renderHebrewSentenceMorphemesHTML(sentence);
      bindHebrewMorphemeContainerEvents(container);
    }

    const ribbon = document.getElementById("sentence-morphemes-ribbon");
    if (ribbon) {
      ribbon.setAttribute("dir", "rtl");
      ribbon.style.direction = "rtl";
      ribbon.innerHTML = renderHebrewRibbonHTML(HebrewModalState.flatMorphemes);
      bindHebrewRibbonEvents(ribbon);
    }

    const legendContainer = document.getElementById("sentence-legend-container");
    if (legendContainer) {
      legendContainer.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>Artigo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Conjunção
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Preposição
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Substantivo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Adjetivo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Verbo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300">
          <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>Advérbio
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300">
          <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>Sufixo Pronominal
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Partícula / Pronome
        </span>
      `;
    }

    updateHebrewAnalysisPanel();
    syncHebrewMorphemeDOMHighlights();

    if (modal && modal.classList && typeof modal.classList.remove === "function") {
      modal.classList.remove("hidden");
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("keydown", handleHebrewModalKeyDown);
    }
  }

  function closeHebrewSentenceAnalysisModal() {
    if (typeof document === "undefined") return;
    HebrewModalState.isOpen = false;
    HebrewModalState.currentSentence = null;
    HebrewModalState.flatMorphemes = [];
    HebrewModalState.activeIndex = null;
    HebrewModalState.pinnedIndex = null;

    const modal = document.getElementById("sentence-analysis-modal");
    if (modal && modal.classList && typeof modal.classList.add === "function") {
      modal.classList.add("hidden");
    }
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("keydown", handleHebrewModalKeyDown);
    }
  }

  // ==========================================================================
  // 4. PIPELINE DE ANÁLISE MORFOLÓGICA DE GREGO (JOHANNES BERGMANN)
  // ==========================================================================

  function parseGreekStepDetails(token, sentence) {
    if (!token) return null;
    const wClass = token.word_class || "";
    const role = token.syntax_role || "";
    const text = token.text || "";
    const lemma = token.lemma || "";

    // Passo 1: Classe gramatical
    const cat = getGreekMorphemeCategory(wClass);
    const defaultClassName = (GREEK_CATEGORY_MAP[cat] && GREEK_CATEGORY_MAP[cat].name) || "Termo";
    let step1Class = (wClass && wClass !== "Vocábulo" && wClass !== "Substantivo / Vocábulo") ? wClass : defaultClassName;

    // Passo 3: Tradução contextual
    let step3Translation = "";
    if (token.context_meaning) {
      step3Translation = token.context_meaning;
    } else {
      const quoteMatch = role.match(/['"“]([^'"”]+)['"”]/);
      if (quoteMatch) {
        step3Translation = quoteMatch[1];
      } else if (token.meaning) {
        step3Translation = token.meaning;
      }
    }

    // Passo 2: Morfologia detalhada
    let step2Morphology = "";
    if (token.details && token.details.step2_morphology) {
      step2Morphology = token.details.step2_morphology;
    } else if (token.inflection) {
      step2Morphology = token.inflection;
    } else {
      // a) Dentro de parênteses antes da tradução (ex: "(nominativo feminino singular: 'esta')")
      const parenMatch = role.match(/\(([^)]+)\)/);
      if (parenMatch) {
        let inside = parenMatch[1].replace(/:\s*['"“][^'"”]+['"”]/, "");
        inside = inside.replace(/['"“][^'"”]+['"”]/, "").trim().replace(/[.:;,]+$/, "");
        if (/(?:nominativo|genitivo|dativo|acusativo|vocativo|pessoa|singular|plural)/i.test(inside)) {
          step2Morphology = inside;
        }
      }
      // b) Verbo: tempo, modo, voz, pessoa e número
      if (!step2Morphology || /verbo/i.test(wClass)) {
        const verbMatch = role.match(/(?:(?:1º|2º)\s+)?(?:Presente|Imperfeito|Futuro|Aoristo|Perfeito|Mais-que-perfeito)[^.('"]+/i);
        if (verbMatch) {
          step2Morphology = verbMatch[0].trim().replace(/[.:;,]+$/, "");
        }
      }
      // c) Preposição: com que caso é usada
      if (!step2Morphology && (/preposi/i.test(wClass) || /prep/i.test(role))) {
        const caseMatch = (wClass + " " + role).match(/rege\s+(?:o\s+)?(acusativo|dativo|genitivo)/i);
        if (caseMatch) {
          step2Morphology = `Rege caso ${caseMatch[1].toLowerCase()}`;
        } else if (/dativo/i.test(role)) {
          step2Morphology = "Usada com caso dativo";
        } else if (/genitivo/i.test(role)) {
          step2Morphology = "Usada com caso genitivo";
        } else if (/acusativo/i.test(role)) {
          step2Morphology = "Usada com caso acusativo";
        }
      }
      // d) Conjunção / Advérbio / Partícula
      if (!step2Morphology && /(?:advérbio|conjunção|partícula)/i.test(wClass)) {
        step2Morphology = wClass;
      }
    }

    // Papel sintático limpo (sem aspas e sem parênteses redundantes)
    let cleanRole = role.replace(/\([^)]*\)/g, "").replace(/['"“][^'"”]*['"”]/g, "").replace(/\s+/g, " ").trim().replace(/[.:;,]+$/, "");
    if (!cleanRole) cleanRole = role;

    // Passo 4: Tradução contínua da oração
    const continuousTranslation = sentence && Array.isArray(sentence.translations) && sentence.translations.length > 0
      ? sentence.translations[0]
      : (sentence && sentence.translation ? sentence.translation : "");

    return {
      text,
      step1Class,
      step2Morphology,
      step3Lemma: lemma,
      step3Translation,
      cleanRole,
      continuousTranslation
    };
  }

  function inferGreekWordFallback(word, idx, totalWords, sentence) {
    const cleanWord = word.replace(/[.,;:·?!'’"\s]/g, "");
    const lowerWord = normalizeGreekForSearch(cleanWord);

    // Artigos definidos
    const greekArticles = new Map([
      ["ο", { lemma: "ὁ", morph: "Nominativo masculino singular ('o')" }],
      ["η", { lemma: "ἡ", morph: "Nominativo feminino singular ('a')" }],
      ["το", { lemma: "τό", morph: "Nominativo/Acusativo neutro singular ('o')" }],
      ["του", { lemma: "ὁ", morph: "Genitivo masculino/neutro singular ('do')" }],
      ["της", { lemma: "ἡ", morph: "Genitivo feminino singular ('da')" }],
      ["τω", { lemma: "ὁ", morph: "Dativo masculino/neutro singular ('ao/para o')" }],
      ["τη", { lemma: "ἡ", morph: "Dativo feminino singular ('à/para a')" }],
      ["τον", { lemma: "ὁ", morph: "Acusativo masculino singular ('o')" }],
      ["την", { lemma: "ἡ", morph: "Acusativo feminino singular ('a')" }],
      ["οι", { lemma: "ὁ", morph: "Nominativo masculino plural ('os')" }],
      ["αι", { lemma: "ἡ", morph: "Nominativo feminino plural ('as')" }],
      ["τα", { lemma: "τό", morph: "Nominativo/Acusativo neutro plural ('os/as')" }],
      ["των", { lemma: "ὁ", morph: "Genitivo plural masculino/feminino/neutro ('dos/das')" }],
      ["τοις", { lemma: "ὁ", morph: "Dativo masculino/neutro plural ('aos/para os')" }],
      ["ταις", { lemma: "ἡ", morph: "Dativo feminino plural ('às/para as')" }],
      ["τους", { lemma: "ὁ", morph: "Acusativo masculino plural ('os')" }],
      ["τας", { lemma: "ἡ", morph: "Acusativo feminino plural ('as')" }]
    ]);
    if (greekArticles.has(lowerWord)) {
      const art = greekArticles.get(lowerWord);
      return {
        word_class: "Artigo definido",
        category: "article",
        lemma: art.lemma,
        syntax_role: `Adjunto adnominal determinante (${art.morph})`,
        inflection: art.morph.replace(/\s*\([^)]+\)/, ""),
        context_meaning: (art.morph.match(/'([^']+)'/) || [])[1] || ""
      };
    }

    // Conjunções
    const greekConjunctions = new Map([
      ["και", { lemma: "καί", meaning: "e / também" }],
      ["αλλα", { lemma: "ἀλλά", meaning: "mas / porém" }],
      ["οτι", { lemma: "ὅτι", meaning: "que / porque" }],
      ["ινα", { lemma: "ἵνα", meaning: "para que / a fim de que" }],
      ["γαρ", { lemma: "γάρ", meaning: "pois / porque" }],
      ["δε", { lemma: "δέ", meaning: "mas / e / por outro lado" }],
      ["ουν", { lemma: "οὖν", meaning: "portanto / pois" }],
      ["τε", { lemma: "τέ", meaning: "e / bem como" }],
      ["ει", { lemma: "εἰ", meaning: "se" }],
      ["εαν", { lemma: "ἐάν", meaning: "se / caso" }]
    ]);
    if (greekConjunctions.has(lowerWord)) {
      const conj = greekConjunctions.get(lowerWord);
      return {
        word_class: "Conjunção",
        category: "conjunction",
        lemma: conj.lemma,
        syntax_role: `Conector oracional ('${conj.meaning}')`,
        inflection: "Invariável",
        context_meaning: conj.meaning
      };
    }

    // Preposições
    const greekPrepositions = new Map([
      ["εν", { lemma: "ἐν", meaning: "em / dentro de", caseGov: "Rege caso dativo" }],
      ["εις", { lemma: "εἰς", meaning: "para / em direção a", caseGov: "Rege caso acusativo" }],
      ["εκ", { lemma: "ἐκ", meaning: "de / para fora de", caseGov: "Rege caso genitivo" }],
      ["εξ", { lemma: "ἐκ", meaning: "de / para fora de", caseGov: "Rege caso genitivo" }],
      ["δια", { lemma: "διά", meaning: "por meio de / por causa de", caseGov: "Rege genitivo ou acusativo" }],
      ["προς", { lemma: "πρός", meaning: "para / junto a", caseGov: "Rege caso acusativo" }],
      ["απο", { lemma: "ἀπό", meaning: "de / a partir de", caseGov: "Rege caso genitivo" }],
      ["μετα", { lemma: "μετά", meaning: "com / depois de", caseGov: "Rege genitivo ou acusativo" }],
      ["περι", { lemma: "περί", meaning: "a respeito de / acerca de", caseGov: "Rege genitivo ou acusativo" }],
      ["υπερ", { lemma: "ὑπέρ", meaning: "em favor de / acima de", caseGov: "Rege genitivo ou acusativo" }],
      ["υπο", { lemma: "ὑπό", meaning: "por / debaixo de", caseGov: "Rege genitivo ou acusativo" }],
      ["επι", { lemma: "ἐπί", meaning: "sobre / em cima de", caseGov: "Rege genitivo, dativo ou acusativo" }],
      ["παρα", { lemma: "παρά", meaning: "ao lado de / de junto de", caseGov: "Rege genitivo, dativo ou acusativo" }],
      ["συν", { lemma: "σύν", meaning: "juntamente com", caseGov: "Rege caso dativo" }],
      ["κατα", { lemma: "κατά", meaning: "segundo / conforme / contra", caseGov: "Rege genitivo ou acusativo" }]
    ]);
    if (greekPrepositions.has(lowerWord)) {
      const prep = greekPrepositions.get(lowerWord);
      return {
        word_class: "Preposição",
        category: "preposition",
        lemma: prep.lemma,
        syntax_role: `Preposição oracional. ${prep.caseGov} ('${prep.meaning}')`,
        inflection: prep.caseGov,
        context_meaning: prep.meaning
      };
    }

    // Pronomes
    const greekPronouns = new Map([
      ["αυτος", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Nominativo masculino singular ('ele / o próprio')" }],
      ["αυτη", { lemma: "αὐτή", type: "Pronome pessoal", morph: "Nominativo feminino singular ('ela / a própria')" }],
      ["αυτο", { lemma: "αὐτό", type: "Pronome pessoal", morph: "Nominativo neutro singular ('ele/ela / o próprio')" }],
      ["αυτου", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Genitivo masculino/neutro singular ('dele / de si')" }],
      ["αυτης", { lemma: "αὐτή", type: "Pronome pessoal", morph: "Genitivo feminino singular ('dela')" }],
      ["αυτω", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Dativo masculino/neutro singular ('a ele / lhe')" }],
      ["αυτη", { lemma: "αὐτή", type: "Pronome pessoal", morph: "Dativo feminino singular ('a ela / lhe')" }],
      ["αυτον", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Acusativo masculino singular ('o / ele')" }],
      ["αυτην", { lemma: "αὐτή", type: "Pronome pessoal", morph: "Acusativo feminino singular ('a / ela')" }],
      ["αυτων", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Genitivo plural ('deles / delas')" }],
      ["αυτοις", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Dativo plural ('a eles / lhes')" }],
      ["αυτους", { lemma: "αὐτός", type: "Pronome pessoal", morph: "Acusativo masculino plural ('os / eles')" }],
      ["ουτος", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Nominativo masculino singular ('este')" }],
      ["αυτη", { lemma: "αὕτη", type: "Pronome demonstrativo", morph: "Nominativo feminino singular ('esta')" }],
      ["τουτο", { lemma: "τοῦτο", type: "Pronome demonstrativo", morph: "Nominativo/Acusativo neutro singular ('isto')" }],
      ["τουτου", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Genitivo masculino/neutro singular ('deste')" }],
      ["ταυτης", { lemma: "αὕτη", type: "Pronome demonstrativo", morph: "Genitivo feminino singular ('desta')" }],
      ["τουτω", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Dativo masculino/neutro singular ('a este')" }],
      ["ταυτη", { lemma: "αὕτη", type: "Pronome demonstrativo", morph: "Dativo feminino singular ('a esta')" }],
      ["τουτον", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Acusativo masculino singular ('este')" }],
      ["ταυτην", { lemma: "αὕτη", type: "Pronome demonstrativo", morph: "Acusativo feminino singular ('esta')" }],
      ["ουτοι", { lemma: "οὗτοι", type: "Pronome demonstrativo", morph: "Nominativo masculino plural ('estes')" }],
      ["αυται", { lemma: "αὗται", type: "Pronome demonstrativo", morph: "Nominativo feminino plural ('estas')" }],
      ["ταυτα", { lemma: "ταῦτα", type: "Pronome demonstrativo", morph: "Nominativo/Acusativo neutro plural ('estas coisas / estes')" }],
      ["τουτων", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Genitivo plural ('destes / destas')" }],
      ["τουτοις", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Dativo plural ('a estes / a estas')" }],
      ["τουτους", { lemma: "οὗτος", type: "Pronome demonstrativo", morph: "Acusativo masculino plural ('estes')" }],
      ["ταυτας", { lemma: "αὕτη", type: "Pronome demonstrativo", morph: "Acusativo feminino plural ('estas')" }],
      ["εκεινος", { lemma: "ἐκεῖνος", type: "Pronome demonstrativo", morph: "Nominativo masculino singular ('aquele')" }],
      ["εκεινη", { lemma: "ἐκείνη", type: "Pronome demonstrativo", morph: "Nominativo feminino singular ('aquela')" }],
      ["εκεινο", { lemma: "ἐκεῖνο", type: "Pronome demonstrativo", morph: "Nominativo neutro singular ('aquilo')" }],
      ["εγω", { lemma: "ἐγώ", type: "Pronome pessoal", morph: "1ª pessoa singular nominativo ('eu')" }],
      ["μου", { lemma: "ἐγώ", type: "Pronome pessoal", morph: "1ª pessoa singular genitivo ('meu / de mim')" }],
      ["μοι", { lemma: "ἐγώ", type: "Pronome pessoal", morph: "1ª pessoa singular dativo ('a mim / me')" }],
      ["με", { lemma: "ἐγώ", type: "Pronome pessoal", morph: "1ª pessoa singular acusativo ('me / mim')" }],
      ["συ", { lemma: "σύ", type: "Pronome pessoal", morph: "2ª pessoa singular nominativo ('tu')" }],
      ["σου", { lemma: "σύ", type: "Pronome pessoal", morph: "2ª pessoa singular genitivo ('teu / de ti')" }],
      ["σοι", { lemma: "σύ", type: "Pronome pessoal", morph: "2ª pessoa singular dativo ('a ti / te')" }],
      ["σε", { lemma: "σύ", type: "Pronome pessoal", morph: "2ª pessoa singular acusativo ('te / ti')" }],
      ["ημεις", { lemma: "ἡμεῖς", type: "Pronome pessoal", morph: "1ª pessoa plural nominativo ('nós')" }],
      ["ημων", { lemma: "ἡμεῖς", type: "Pronome pessoal", morph: "1ª pessoa plural genitivo ('nosso / de nós')" }],
      ["ημιν", { lemma: "ἡμεῖς", type: "Pronome pessoal", morph: "1ª pessoa plural dativo ('a nós / nos')" }],
      ["ημας", { lemma: "ἡμεῖς", type: "Pronome pessoal", morph: "1ª pessoa plural acusativo ('nos / a nós')" }],
      ["υμεις", { lemma: "ὑμεῖς", type: "Pronome pessoal", morph: "2ª pessoa plural nominativo ('vós')" }],
      ["υμων", { lemma: "ὑμεῖς", type: "Pronome pessoal", morph: "2ª pessoa plural genitivo ('vosso / de vós')" }],
      ["υμιν", { lemma: "ὑμεῖς", type: "Pronome pessoal", morph: "2ª pessoa plural dativo ('a vós / vos')" }],
      ["υμας", { lemma: "ὑμεῖς", type: "Pronome pessoal", morph: "2ª pessoa plural acusativo ('vos / a vós')" }],
      ["ος", { lemma: "ὅς", type: "Pronome relativo", morph: "Nominativo masculino singular ('o qual / que')" }],
      ["η", { lemma: "ἥ", type: "Pronome relativo", morph: "Nominativo feminino singular ('a qual / que')" }],
      ["ο", { lemma: "ὅ", type: "Pronome relativo", morph: "Nominativo/Acusativo neutro singular ('o qual / que')" }],
      ["τις", { lemma: "τίς", type: "Pronome interrogativo/indefinido", morph: "Nominativo masculino/feminino singular ('quem / alguém')" }],
      ["τι", { lemma: "τί", type: "Pronome interrogativo/indefinido", morph: "Nominativo/Acusativo neutro singular ('que / algo / por que')" }]
    ]);
    if (greekPronouns.has(lowerWord)) {
      const pr = greekPronouns.get(lowerWord);
      return {
        word_class: pr.type,
        category: "pronoun",
        lemma: pr.lemma,
        syntax_role: `${pr.type} (${pr.morph})`,
        inflection: pr.morph.replace(/\s*\([^)]+\)/, ""),
        context_meaning: (pr.morph.match(/'([^']+)'/) || [])[1] || ""
      };
    }

    // Advérbios comuns
    const greekAdverbs = new Map([
      ["ου", { lemma: "οὐ", meaning: "não" }],
      ["ουκ", { lemma: "οὐ", meaning: "não" }],
      ["ουχ", { lemma: "οὐ", meaning: "não" }],
      ["μη", { lemma: "μή", meaning: "não" }],
      ["νυν", { lemma: "νῦν", meaning: "agora" }],
      ["παλιν", { lemma: "πάλιν", meaning: "novamente / de novo" }],
      ["ουτως", { lemma: "οὕτως", meaning: "assim / deste modo" }],
      ["ουτω", { lemma: "οὕτω", meaning: "assim / deste modo" }],
      ["παντοτε", { lemma: "πάντοτε", meaning: "sempre" }],
      ["ευθυς", { lemma: "εὐθύς", meaning: "imediatamente / logo" }],
      ["ποθεν", { lemma: "πόθεν", meaning: "de onde" }],
      ["που", { lemma: "ποῦ", meaning: "onde" }]
    ]);
    if (greekAdverbs.has(lowerWord)) {
      const adv = greekAdverbs.get(lowerWord);
      return {
        word_class: "Advérbio",
        category: "adverb",
        lemma: adv.lemma,
        syntax_role: `Adjunto adverbial ('${adv.meaning}')`,
        inflection: "Invariável",
        context_meaning: adv.meaning
      };
    }

    // Verbos frequentes
    const greekCommonVerbs = new Map([
      ["ην", { lemma: "εἰμί", morph: "Imperfeito do indicativo ativo, 3ª sg ('era / estava')" }],
      ["εστιν", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 3ª sg ('é / está')" }],
      ["εστι", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 3ª sg ('é / está')" }],
      ["ειμι", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 1ª sg ('sou / estou')" }],
      ["ει", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 2ª sg ('és / estás')" }],
      ["εσμεν", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 1ª pl ('somos / estamos')" }],
      ["εστε", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 2ª pl ('sois / estais')" }],
      ["εισιν", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 3ª pl ('são / estão')" }],
      ["εισι", { lemma: "εἰμί", morph: "Presente do indicativo ativo, 3ª pl ('são / estão')" }],
      ["ειναι", { lemma: "εἰμί", morph: "Infinitivo presente ativo ('ser / estar')" }],
      ["εγενετο", { lemma: "γίνομαι", morph: "2º aoristo do indicativo médio, 3ª sg ('veio a ser / houve')" }],
      ["ηλθεν", { lemma: "ἔρχομαι", morph: "2º aoristo do indicativo ativo, 3ª sg ('veio')" }],
      ["λεγει", { lemma: "λέγω", morph: "Presente do indicativo ativo, 3ª sg ('diz')" }],
      ["λεγω", { lemma: "λέγω", morph: "Presente do indicativo ativo, 1ª sg ('digo')" }],
      ["ειπεν", { lemma: "λέγω", morph: "2º aoristo do indicativo ativo, 3ª sg ('disse')" }],
      ["ελαβον", { lemma: "λαμβάνω", morph: "2º aoristo do indicativo ativo, 3ª pl ('receberam')" }],
      ["εδωκεν", { lemma: "δίδωμι", morph: "1º aoristo do indicativo ativo, 3ª sg ('deu')" }],
      ["γενεσθαι", { lemma: "γίνομαι", morph: "Infinitivo aoristo depoente ('tornar-se')" }],
      ["πιστευουσιν", { lemma: "πιστεύω", morph: "Particípio presente ativo dativo plural ('que creem')" }]
    ]);
    if (greekCommonVerbs.has(lowerWord)) {
      const v = greekCommonVerbs.get(lowerWord);
      return {
        word_class: "Verbo",
        category: "verb",
        lemma: v.lemma,
        syntax_role: `Núcleo verbal da oração. ${v.morph}`,
        inflection: v.morph.replace(/\s*\([^)]+\)/, ""),
        context_meaning: (v.morph.match(/'([^']+)'/) || [])[1] || ""
      };
    }

    // Substantivo ou adjetivo grego
    return {
      word_class: "Substantivo",
      category: "noun",
      lemma: cleanWord,
      syntax_role: `Elemento nominal da oração grega ('${cleanWord}')`,
      inflection: "Caso, gênero e número segundo a declinação",
      context_meaning: cleanWord
    };
  }

  function buildGreekFlatMorphemesList(sentence) {
    const list = [];
    if (!sentence) return list;

    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      const match = findSentenceInDatabase(sentence);
      if (match && Array.isArray(match.tokens) && match.tokens.length > 0) {
        sentence.tokens = match.tokens;
        if (!sentence.syntax_type && match.syntax_type) sentence.syntax_type = match.syntax_type;
        if (!sentence.notes && match.notes) sentence.notes = match.notes;
      }
    }

    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      const rawText = (sentence.greek || sentence.term || "").trim();
      const words = rawText.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        let gIdx = 0;
        words.forEach((w, wIdx) => {
          const inferred = inferGreekWordFallback(w, wIdx, words.length, sentence);
          const synthToken = {
            text: w,
            composite: false,
            word_class: inferred.word_class,
            syntax_role: inferred.syntax_role,
            lemma: inferred.lemma,
            inflection: inferred.inflection,
            context_meaning: inferred.context_meaning
          };
          const synthPart = {
            segment: w,
            transliteration: wIdx === 0 ? (sentence.transliteration || "") : "",
            type: inferred.word_class,
            meaning: inferred.context_meaning ? `"${inferred.context_meaning}"` : (wIdx === 0 && Array.isArray(sentence.translations) ? sentence.translations[0] : (sentence.translation || `Palavra ${wIdx + 1}`)),
            inflection: inferred.inflection,
            lemma: inferred.lemma,
            context_meaning: inferred.context_meaning,
            details: {
              step1Class: inferred.word_class,
              step2Morphology: inferred.inflection,
              step3Lemma: inferred.lemma,
              step3Translation: inferred.context_meaning,
              cleanRole: inferred.syntax_role,
              continuousTranslation: Array.isArray(sentence.translations) ? sentence.translations[0] : (sentence.translation || "")
            }
          };
          list.push({
            index: gIdx++,
            tokenIdx: wIdx,
            partIdx: 0,
            token: synthToken,
            part: synthPart,
            category: inferred.category
          });
        });
        return list;
      }

      // Fallback para frase atômica única
      const fallbackText = sentence.greek || sentence.term || "";
      const fallbackPart = {
        segment: fallbackText,
        transliteration: sentence.transliteration || "",
        type: sentence.type || "Frase",
        meaning: Array.isArray(sentence.translations) ? sentence.translations[0] : (sentence.translation || "")
      };
      const fallbackToken = {
        text: fallbackText,
        transliteration: sentence.transliteration || "",
        composite: false,
        word_class: sentence.type || "Frase",
        syntax_role: sentence.syntax_type || "Oração Integral"
      };
      list.push({
        index: 0,
        tokenIdx: 0,
        partIdx: 0,
        token: fallbackToken,
        part: fallbackPart,
        category: getGreekMorphemeCategory(fallbackPart.type)
      });
      return list;
    }

    let globalIdx = 0;
    sentence.tokens.forEach((token, tIdx) => {
      const greekDetails = parseGreekStepDetails(token, sentence);
      const resolvedCategory = getGreekMorphemeCategory(token.word_class || token.text);
      const resolvedMeta = GREEK_CATEGORY_MAP[resolvedCategory] || GREEK_CATEGORY_MAP.particle;
      const resolvedType = (greekDetails && greekDetails.step1Class && greekDetails.step1Class !== "Vocábulo" && greekDetails.step1Class !== "Substantivo / Vocábulo")
        ? greekDetails.step1Class
        : (token.word_class && token.word_class !== "Vocábulo" && token.word_class !== "Substantivo / Vocábulo"
            ? token.word_class
            : resolvedMeta.name);

      const synthPart = {
        segment: token.text,
        transliteration: token.transliteration || "",
        type: resolvedType,
        meaning: (greekDetails && greekDetails.step3Translation ? `"${greekDetails.step3Translation}"` : "") || token.context_meaning || token.meaning || (token.lemma ? `Raiz / Lexema: ${token.lemma}` : ""),
        inflection: (greekDetails && greekDetails.step2Morphology) || token.inflection || (token.details && typeof token.details.step2_morphology === "string" ? token.details.step2_morphology : ""),
        phonetics: token.notes || token.phonetics || "",
        details: token.details || greekDetails,
        lemma: token.lemma || (greekDetails ? greekDetails.step3Lemma : ""),
        lemma_meaning: token.lemma_meaning,
        context_meaning: token.context_meaning || (greekDetails ? greekDetails.step3Translation : "")
      };
      list.push({
        index: globalIdx++,
        tokenIdx: tIdx,
        partIdx: 0,
        token: token,
        part: synthPart,
        category: resolvedCategory
      });
    });

    return list;
  }

  function renderGreekSentenceMorphemesHTML(sentence) {
    if (!sentence) return "";

    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      const match = findSentenceInDatabase(sentence);
      if (match && Array.isArray(match.tokens) && match.tokens.length > 0) {
        sentence.tokens = match.tokens;
        if (!sentence.syntax_type && match.syntax_type) sentence.syntax_type = match.syntax_type;
        if (!sentence.notes && match.notes) sentence.notes = match.notes;
      }
    }

    let tokens = sentence.tokens;
    if (!Array.isArray(tokens) || tokens.length === 0) {
      const rawText = (sentence.greek || sentence.term || "").trim();
      const words = rawText.split(/\s+/).filter(Boolean);
      tokens = words.map((w, idx) => ({
        text: w,
        composite: false,
        word_class: "Termo",
        syntax_role: `Palavra ${idx + 1}`
      }));
    }

    return tokens
      .map((token, tIdx) => {
        const cat = getGreekMorphemeCategory(token.word_class || token.text);
        const meta = GREEK_CATEGORY_MAP[cat] || GREEK_CATEGORY_MAP.particle;
        const details = parseGreekStepDetails(token, sentence);
        const titleStr = details && details.step1Class ? `${details.step1Class}: ${details.step3Translation || token.text}` : (token.word_class || "");
        return `<span class="token-wrapper" data-token-idx="${tIdx}" dir="ltr" style="direction: ltr !important;"><span class="morpheme ${meta.glowClass}" data-token-idx="${tIdx}" data-part-idx="0" dir="ltr" style="direction: ltr !important;" title="${escapeHTML(titleStr)}">${escapeHTML(token.text)}</span></span>`;
      })
      .join(" ");
  }

  function renderGreekRibbonHTML(flatMorphemes) {
    if (!Array.isArray(flatMorphemes) || flatMorphemes.length === 0) return "";

    const globalChip = `
      <button
        type="button"
        class="morpheme-chip global-chip px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-mono cursor-pointer shadow-sm is-active"
        data-morpheme-idx="global"
        title="Ver estrutura sintática e tradução de toda a oração"
      >
        <span>🏛️</span>
        <span class="font-semibold">Oração Completa</span>
      </button>
    `;

    const chipsHTML = flatMorphemes.map((item, idx) => {
      const cat = item.category || "particle";
      const meta = GREEK_CATEGORY_MAP[cat] || GREEK_CATEGORY_MAP.particle;
      const segment = escapeHTML(item.part ? item.part.segment : "");
      let typeName = (item.part && item.part.type) || meta.name || "Termo";
      if (!typeName || typeName === "Vocábulo" || typeName === "Substantivo / Vocábulo") {
        typeName = meta.name || "Termo";
      }
      return `
        <button
          type="button"
          class="morpheme-chip px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono cursor-pointer shadow-sm"
          data-morpheme-idx="${idx}"
          data-category="${cat}"
          title="${escapeHTML((item.part ? item.part.type : '') + ': ' + (item.part && item.part.meaning ? item.part.meaning : ''))}"
        >
          <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${meta.accentHex}"></span>
          <span class="greek-text font-bold text-base md:text-lg text-white" dir="ltr">${segment}</span>
          <span class="text-[11px] text-slate-400 font-sans">${escapeHTML(typeName)}</span>
        </button>
      `;
    }).join("");

    return globalChip + chipsHTML;
  }

  function renderGreekGlobalView(sentence) {
    if (!sentence) return "";

    const syntaxType = sentence.syntax_type || "Estrutura Sintática Grega";
    const translation = Array.isArray(sentence.translations) && sentence.translations.length > 0
      ? sentence.translations[0]
      : (sentence.translation || "Tradução não disponível");
    const notes = sentence.notes || "Oração analisada sob a ótica da gramática de Johannes Bergmann. Observe a classe gramatical, morfologia de cada elemento, forma no vocabulário e a linha contínua de tradução fluente em português.";
    const translit = sentence.transliteration || "";
    const flatList = GreekModalState.flatMorphemes.length > 0 ? GreekModalState.flatMorphemes : buildGreekFlatMorphemesList(sentence);

    return `
      <div class="space-y-4 animate-in fade-in duration-150">
        <!-- Cabeçalho da Visão Global -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono text-xs font-semibold">
              🏛️ ${escapeHTML(syntaxType)}
            </span>
            ${translit ? `<span class="font-mono text-xs text-amber-400/90">[ ${escapeHTML(translit)} ]</span>` : ""}
          </div>
          <span class="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
            Visão Global da Oração (Johannes Bergmann)
          </span>
        </div>

        <!-- Linha Interlinear de Dissecação Termo a Termo -->
        <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div class="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span>📖</span> Dissecação Interlinear Termo a Termo
            </span>
            <span class="text-[10px] text-slate-500 font-normal">Toque ou passe o mouse para dissecar</span>
          </div>
          <div class="flex flex-wrap gap-2 items-start" dir="ltr">
            ${flatList.map((m, idx) => {
              const details = (m.part && m.part.details) || parseGreekStepDetails(m.token, sentence) || {};
              const wTrans = details.step3Translation || (m.part && m.part.meaning) || "";
              const catMeta = GREEK_CATEGORY_MAP[m.category] || GREEK_CATEGORY_MAP.particle;
              const catClass = catMeta.badgeClass || "";

              // Classificação gramatical do termo
              let tagLabel = (m.part && m.part.type) || details.step1Class || (m.token && m.token.word_class);
              if (!tagLabel || tagLabel === "Vocábulo" || tagLabel === "Substantivo / Vocábulo") {
                tagLabel = catMeta.name || "Termo";
              }
              return `
                <button
                  type="button"
                  onclick="SentenceAnalysisModule.setActiveMorphemeIndex(${idx}, true)"
                  class="interlinear-word text-left cursor-pointer group"
                  title="Dissecar ${escapeHTML(m.part ? m.part.segment : '')}"
                >
                  <span class="greek-text text-base font-bold text-white group-hover:text-cyan-300 transition" dir="ltr">
                    ${escapeHTML(m.part ? m.part.segment : '')}
                  </span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded font-mono ${catClass} mt-0.5 font-semibold">
                    ${escapeHTML(tagLabel)}
                  </span>
                  ${wTrans ? `<span class="text-[11px] text-slate-300 font-medium mt-1">"${escapeHTML(wTrans)}"</span>` : ""}
                </button>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Linha Contínua — Redação Final Fluente em Português (Passo 4 de Bergmann) -->
        <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5 continuous-translation-line">
          <div class="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span>4️⃣</span> Linha Contínua — Redação Final Fluente em Português (Passo 4 de Bergmann)
            </span>
          </div>
          <div class="text-base md:text-lg font-semibold text-white">
            "${escapeHTML(translation)}"
          </div>
          <div class="text-[10px] text-slate-400">
            <em>Use para isso a linha contínua logo abaixo: organização das palavras traduzidas para fluência em língua portuguesa.</em>
          </div>
        </div>

        <!-- Resumo Sintático & Pedagógico -->
        <div class="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-slate-300 text-xs md:text-sm leading-relaxed">
          <div class="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <span>📜 Resumo Sintático & Pedagógico (Johannes Bergmann)</span>
          </div>
          <p>${escapeHTML(notes)}</p>
        </div>

        <!-- Dica Pedagógica -->
        <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span class="flex items-center gap-1.5 text-brand-400">
            <span>💡</span>
            <em>Toque ou passe o mouse sobre qualquer palavra grega para abrir os 4 passos da análise morfológica.</em>
          </span>
          <span class="hidden sm:inline font-mono text-[11px] text-slate-500">
            Setas do teclado ◀ / ▶ navegam pelos vocábulos
          </span>
        </div>
      </div>
    `;
  }

  function renderGreekDissectionView(mItem, sentence) {
    if (!mItem || !mItem.part) return "";

    const { part, token, category } = mItem;
    const catMeta = GREEK_CATEGORY_MAP[category] || GREEK_CATEGORY_MAP.particle;
    const isPinned = GreekModalState.pinnedIndex === mItem.index;

    // Campos anatômicos
    const segment = part.segment || "";
    const translit = part.transliteration || "";
    const partType = part.type || "Elemento Morfológico";
    const meaning = part.meaning || "";
    const inflection = part.inflection || "";
    const phonetics = part.phonetics || part.notes || (token ? token.notes : "") || "";
    const tokenRole = token ? (token.syntax_role || "Componente oracional") : "";
    const tokenLemma = token && token.lemma ? token.lemma : "";

    const gd = part.details || parseGreekStepDetails(token, sentence) || {};
    let step1Class = gd.step1Class || partType;
    if (!step1Class || step1Class === "Vocábulo" || step1Class === "Substantivo / Vocábulo") {
      step1Class = catMeta.name || "Termo";
    }
    const step2Morph = gd.step2Morphology || inflection;
    const step3Trans = gd.step3Translation || meaning;
    const step3Lemma = gd.step3Lemma || tokenLemma;
    const cleanRole = gd.cleanRole || tokenRole;
    const contTrans = gd.continuousTranslation || (Array.isArray(sentence.translations) ? sentence.translations[0] : (sentence.translation || ""));

    return `
      <div class="space-y-4 animate-in fade-in duration-150">
        <!-- Cabeçalho do Morfema Grego -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div class="flex items-center gap-3">
            <!-- Segmento em Destaque Ampliado -->
            <div class="px-3.5 py-1 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
              <span class="greek-text text-2xl md:text-3xl font-bold text-white tracking-wide" dir="ltr">
                ${escapeHTML(segment)}
              </span>
            </div>

            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                ${translit ? `<span class="font-mono text-xs md:text-sm text-amber-400 font-bold">[ ${escapeHTML(translit)} ]</span>` : ""}
                <span class="px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${catMeta.badgeClass}">
                  ${escapeHTML(step1Class)}
                </span>
              </div>
              ${step3Trans ? `<span class="text-xs md:text-sm text-slate-200 font-medium mt-0.5">"${escapeHTML(step3Trans)}"</span>` : ""}
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${isPinned ? `
              <span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono flex items-center gap-1">
                <span>📌</span> Fixado
              </span>
            ` : `
              <span class="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Hover ativo
              </span>
            `}
          </div>
        </div>

        <!-- Metodologia de Tradução em 4 Passos (Johannes Bergmann) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Passo 1: Classe Gramatical -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div class="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <span>1️⃣</span> Passo 1: Classe Gramatical
            </div>
            <div class="text-xs md:text-sm text-slate-200 font-medium leading-relaxed flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md font-mono text-xs ${catMeta.badgeClass}">
                ${escapeHTML(step1Class)}
              </span>
              <span class="text-xs text-slate-400">(${catMeta.name})</span>
            </div>
          </div>

          <!-- Passo 2: Detalhes Morfológicos Conforme a Classe -->
          <div class="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-1">
            <div class="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <span>2️⃣</span> Passo 2: Morfologia & Inflexão
            </div>
            <p class="text-xs md:text-sm text-purple-100 font-medium leading-relaxed">
              ${step2Morph ? escapeHTML(step2Morph) : `<span class="text-slate-400 italic">Forma invariável / indeclinável</span>`}
            </p>
          </div>

          <!-- Passo 3: Vocabulário (Lema) & Tradução no Contexto -->
          <div class="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1.5 md:col-span-2">
            <div class="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              <span class="flex items-center gap-1.5">
                <span>3️⃣</span> Passo 3: Vocabulário (Lema) & Tradução Contextual
              </span>
              ${step3Lemma ? `<span class="greek-text text-sm font-bold text-brand-300" dir="ltr">Lema: ${escapeHTML(step3Lemma)}</span>` : ""}
            </div>
            <div class="text-xs md:text-sm text-slate-200 leading-relaxed">
              <div>
                <span class="text-slate-400">Tradução Contextual:</span>
                <strong class="text-emerald-300 font-semibold ml-1 text-sm md:text-base">"${escapeHTML(step3Trans || segment)}"</strong>
              </div>
              ${cleanRole ? `<div class="text-xs text-slate-300 mt-1">Função na Oração: <span class="text-slate-100 font-medium">${escapeHTML(cleanRole)}</span></div>` : ""}
            </div>
          </div>

          <!-- Passo 4: Linha Contínua (Redação Final Fluente em Português) -->
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1 md:col-span-2 continuous-translation-line">
            <div class="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <span>4️⃣</span> Passo 4: Linha Contínua — Redação Fluente em Português
            </div>
            <p class="text-xs md:text-sm text-slate-100 font-medium italic leading-relaxed">
              "${escapeHTML(contTrans)}"
            </p>
            <div class="text-[10px] text-slate-400">
              <em>Organização das palavras traduzidas para fluência em português (Johannes Bergmann).</em>
            </div>
          </div>

          <!-- Regra Gramatical de Bergmann (se houver) -->
          ${phonetics ? `
            <div class="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1 md:col-span-2">
              <div class="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <span>📜</span> Regra Gramatical (Johannes Bergmann)
              </div>
              <p class="text-xs md:text-sm text-amber-100/90 leading-relaxed">
                ${escapeHTML(phonetics)}
              </p>
            </div>
          ` : ""}
        </div>

        <!-- Barra de Ações Rápidas do Morfema -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onclick="SentenceAnalysisModule.setActiveMorphemeIndex(null, true)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Voltar para a visão global de toda a oração"
          >
            <span>🏛️</span>
            <span>Ver Toda a Frase</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="SentenceAnalysisModule.navigateMorphemes(-1)"
              class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Termo Anterior (Seta Esquerda em Grego LTR)"
            >
              <span>◀</span>
              <span>Anterior</span>
            </button>
            <span class="text-xs text-slate-400 font-mono">
              ${mItem.index + 1} / ${GreekModalState.flatMorphemes.length}
            </span>
            <button
              type="button"
              onclick="SentenceAnalysisModule.navigateMorphemes(+1)"
              class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Próximo Termo (Seta Direita em Grego LTR)"
            >
              <span>Próximo</span>
              <span>▶</span>
            </button>
          </div>
        </div>

        <!-- Rodapé de Navegação do Morfema -->
        <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Termo ${mItem.index + 1} de ${GreekModalState.flatMorphemes.length}</span>
          <span class="font-mono text-[11px]">
            ${isPinned ? "Toque novamente para desafixar" : "Clique ou toque para travar a leitura"}
          </span>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // ESTADO & CONTROLADORES DE INTERFACE DE GREGO (JOHANNES BERGMANN)
  // ==========================================================================

  const GreekModalState = {
    isOpen: false,
    currentSentence: null,
    flatMorphemes: [],
    activeIndex: null,
    pinnedIndex: null,
    activeElement: null
  };

  let _greekAnalysisRafId = null;
  let _greekLeaveTimeoutId = null;

  function scheduleGreekSyncUI(immediate = false) {
    if (_greekAnalysisRafId) {
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(_greekAnalysisRafId);
      _greekAnalysisRafId = null;
    }
    const runSync = () => {
      _greekAnalysisRafId = null;
      syncGreekMorphemeDOMHighlights();
      updateGreekAnalysisPanel();
    };
    if (immediate || typeof requestAnimationFrame !== "function") {
      runSync();
    } else {
      _greekAnalysisRafId = requestAnimationFrame(runSync);
    }
  }

  function updateGreekAnalysisPanel() {
    const panel = document.getElementById("sentence-analysis-panel");
    if (!panel) return;
    const sentence = GreekModalState.currentSentence;
    if (!sentence) {
      panel.innerHTML = "";
      return;
    }
    const targetIndex = GreekModalState.pinnedIndex !== null
      ? GreekModalState.pinnedIndex
      : GreekModalState.activeIndex;

    if (targetIndex !== null && GreekModalState.flatMorphemes[targetIndex]) {
      panel.innerHTML = renderGreekDissectionView(
        GreekModalState.flatMorphemes[targetIndex],
        sentence
      );
    } else {
      panel.innerHTML = renderGreekGlobalView(sentence);
    }
  }

  function syncGreekMorphemeDOMHighlights() {
    syncModalDOMHighlights(GreekModalState);
  }

  function setActiveGreekMorphemeIndex(idx, pin = false) {
    if (idx === null) {
      GreekModalState.activeIndex = null;
      if (pin) GreekModalState.pinnedIndex = null;
    } else {
      const maxIdx = GreekModalState.flatMorphemes.length - 1;
      const safeIdx = Math.max(0, Math.min(idx, maxIdx));
      if (pin) {
        if (GreekModalState.pinnedIndex === safeIdx) {
          GreekModalState.pinnedIndex = null;
          GreekModalState.activeIndex = safeIdx;
        } else {
          GreekModalState.pinnedIndex = safeIdx;
          GreekModalState.activeIndex = safeIdx;
        }
      } else {
        GreekModalState.activeIndex = safeIdx;
      }
    }
    scheduleGreekSyncUI(true);
  }

  function navigateGreekMorphemes(direction) {
    if (!GreekModalState.isOpen || GreekModalState.flatMorphemes.length === 0) return;
    const total = GreekModalState.flatMorphemes.length;
    let current = GreekModalState.pinnedIndex !== null
      ? GreekModalState.pinnedIndex
      : (GreekModalState.activeIndex !== null ? GreekModalState.activeIndex : -1);

    let next;
    if (current === -1) {
      // Em LTR, avanço (+1) começa no início da frase (à esquerda)
      next = direction > 0 ? 0 : total - 1;
    } else {
      next = (current + direction + total) % total;
    }
    setActiveGreekMorphemeIndex(next, true);
  }

  function handleGreekModalKeyDown(e) {
    if (!GreekModalState.isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      closeGreekSentenceAnalysisModal();
    } else if (e.key === "ArrowRight") {
      // Em LTR (Grego), avançar significa ir para a DIREITA (+1)
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      navigateGreekMorphemes(+1);
    } else if (e.key === "ArrowLeft") {
      // Em LTR (Grego), voltar significa ir para a ESQUERDA (-1)
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      navigateGreekMorphemes(-1);
    }
  }

  function bindGreekMorphemeContainerEvents(container) {
    if (!container || container._greekMorphemeEventsBound) return;
    container._greekMorphemeEventsBound = true;

    container.addEventListener("mouseover", (e) => {
      const morphemeEl = e.target.closest(".morpheme");
      if (!morphemeEl) return;
      if (_greekLeaveTimeoutId) {
        clearTimeout(_greekLeaveTimeoutId);
        _greekLeaveTimeoutId = null;
      }
      if (GreekModalState.pinnedIndex !== null) return;

      const tIdx = parseInt(morphemeEl.getAttribute("data-token-idx"), 10);
      const pIdx = parseInt(morphemeEl.getAttribute("data-part-idx"), 10);
      const matchIdx = GreekModalState.flatMorphemes.findIndex(
        (m) => m.tokenIdx === tIdx && m.partIdx === pIdx
      );
      if (matchIdx !== -1) {
        setActiveGreekMorphemeIndex(matchIdx, false);
      }
    });

    container.addEventListener("mouseout", (e) => {
      if (GreekModalState.pinnedIndex !== null) return;
      const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".morpheme, .morpheme-chip, .token-wrapper, .interlinear-word") : null;
      if (related) return;

      if (_greekLeaveTimeoutId) clearTimeout(_greekLeaveTimeoutId);
      _greekLeaveTimeoutId = setTimeout(() => {
        _greekLeaveTimeoutId = null;
        if (GreekModalState.pinnedIndex === null && GreekModalState.isOpen) {
          setActiveGreekMorphemeIndex(null, false);
        }
      }, 40);
    });

    container.addEventListener("click", (e) => {
      if (_greekLeaveTimeoutId) {
        clearTimeout(_greekLeaveTimeoutId);
        _greekLeaveTimeoutId = null;
      }
      const morphemeEl = e.target.closest(".morpheme");
      if (morphemeEl) {
        e.stopPropagation();
        const tIdx = parseInt(morphemeEl.getAttribute("data-token-idx"), 10);
        const pIdx = parseInt(morphemeEl.getAttribute("data-part-idx"), 10);
        const matchIdx = GreekModalState.flatMorphemes.findIndex(
          (m) => m.tokenIdx === tIdx && m.partIdx === pIdx
        );
        if (matchIdx !== -1) {
          setActiveGreekMorphemeIndex(matchIdx, true);
        }
      } else {
        // Clicou no fundo do contêiner da frase -> desafixa e volta para visão global
        if (GreekModalState.pinnedIndex !== null) {
          GreekModalState.pinnedIndex = null;
          setActiveGreekMorphemeIndex(null, false);
        }
      }
    });
  }

  function bindGreekRibbonEvents(ribbon) {
    if (!ribbon || ribbon._greekRibbonEventsBound) return;
    ribbon._greekRibbonEventsBound = true;

    ribbon.addEventListener("mouseover", (e) => {
      const chip = e.target.closest(".morpheme-chip");
      if (!chip) return;
      if (_greekLeaveTimeoutId) {
        clearTimeout(_greekLeaveTimeoutId);
        _greekLeaveTimeoutId = null;
      }
      if (GreekModalState.pinnedIndex !== null) return;
      const rawIdx = chip.getAttribute("data-morpheme-idx");
      if (rawIdx === "global") {
        setActiveGreekMorphemeIndex(null, false);
        return;
      }
      const idx = parseInt(rawIdx, 10);
      if (!isNaN(idx)) {
        setActiveGreekMorphemeIndex(idx, false);
      }
    });

    ribbon.addEventListener("mouseout", (e) => {
      if (GreekModalState.pinnedIndex !== null) return;
      const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".morpheme-chip, .morpheme, .token-wrapper, .interlinear-word") : null;
      if (related) return;
      if (_greekLeaveTimeoutId) clearTimeout(_greekLeaveTimeoutId);
      _greekLeaveTimeoutId = setTimeout(() => {
        _greekLeaveTimeoutId = null;
        if (GreekModalState.pinnedIndex === null && GreekModalState.isOpen) {
          setActiveGreekMorphemeIndex(null, false);
        }
      }, 40);
    });

    ribbon.addEventListener("click", (e) => {
      if (_greekLeaveTimeoutId) {
        clearTimeout(_greekLeaveTimeoutId);
        _greekLeaveTimeoutId = null;
      }
      const chip = e.target.closest(".morpheme-chip");
      if (!chip) return;
      e.stopPropagation();
      const rawIdx = chip.getAttribute("data-morpheme-idx");
      if (rawIdx === "global") {
        GreekModalState.pinnedIndex = null;
        setActiveGreekMorphemeIndex(null, true);
        return;
      }
      const idx = parseInt(rawIdx, 10);
      if (!isNaN(idx)) {
        setActiveGreekMorphemeIndex(idx, true);
      }
    });
  }

  function openGreekSentenceAnalysisModal(sentence) {
    if (!sentence || typeof document === "undefined") return;

    GreekModalState.isOpen = true;
    GreekModalState.currentSentence = sentence;
    GreekModalState.flatMorphemes = buildGreekFlatMorphemesList(sentence);
    GreekModalState.activeIndex = null;
    GreekModalState.pinnedIndex = null;

    let modal = document.getElementById("sentence-analysis-modal");
    if (!modal) {
      modal = createDynamicModalDOM();
    }

    const titleEl = document.getElementById("analysis-modal-title");
    const subtitleEl = titleEl ? titleEl.nextElementSibling : null;
    if (titleEl) {
      titleEl.textContent = "Análise Morfossintática de Frases Gregas";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "Metodologia de Tradução e Dissecação Interlinear (Gramática de Johannes Bergmann)";
    }

    const container = document.getElementById("sentence-morphemes-container");
    if (container) {
      container.setAttribute("dir", "ltr");
      container.classList.remove("hebrew-sentence-container", "hebrew-text");
      container.classList.add("greek-sentence-container", "greek-text");
      container.style.direction = "ltr";
      container.style.unicodeBidi = "isolate";
      container.innerHTML = renderGreekSentenceMorphemesHTML(sentence);
      bindGreekMorphemeContainerEvents(container);
    }

    const ribbon = document.getElementById("sentence-morphemes-ribbon");
    if (ribbon) {
      ribbon.setAttribute("dir", "ltr");
      ribbon.style.direction = "ltr";
      ribbon.innerHTML = renderGreekRibbonHTML(GreekModalState.flatMorphemes);
      bindGreekRibbonEvents(ribbon);
    }

    const legendContainer = document.getElementById("sentence-legend-container");
    if (legendContainer) {
      legendContainer.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>Artigo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Conjunção
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Preposição
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Substantivo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Adjetivo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Verbo
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300">
          <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>Advérbio
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300">
          <span class="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>Pronome
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Partícula
        </span>
      `;
    }

    updateGreekAnalysisPanel();
    syncGreekMorphemeDOMHighlights();

    if (modal && modal.classList && typeof modal.classList.remove === "function") {
      modal.classList.remove("hidden");
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("keydown", handleGreekModalKeyDown);
    }
  }

  function closeGreekSentenceAnalysisModal() {
    if (typeof document === "undefined") return;
    GreekModalState.isOpen = false;
    GreekModalState.currentSentence = null;
    GreekModalState.flatMorphemes = [];
    GreekModalState.activeIndex = null;
    GreekModalState.pinnedIndex = null;

    const modal = document.getElementById("sentence-analysis-modal");
    if (modal && modal.classList && typeof modal.classList.add === "function") {
      modal.classList.add("hidden");
    }
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("keydown", handleGreekModalKeyDown);
    }

    const container = document.getElementById("sentence-morphemes-container");
    if (container) {
      container.classList.remove("greek-sentence-container", "greek-text");
      container.classList.add("hebrew-sentence-container");
      container.classList.add("hebrew-text");
      container.setAttribute("dir", "rtl");
      container.style.direction = "rtl";
    }
    const ribbon = document.getElementById("sentence-morphemes-ribbon");
    if (ribbon) {
      ribbon.setAttribute("dir", "rtl");
      ribbon.style.direction = "rtl";
    }
  }

  // ==========================================================================
  // 5. DISPATCHERS UNIFICADOS (FACHADA POLIMÓRFICA)
  // ==========================================================================

  function buildFlatMorphemesList(sentence) {
    if (isGreekSentence(sentence)) {
      return buildGreekFlatMorphemesList(sentence);
    }
    return buildHebrewFlatMorphemesList(sentence);
  }

  function renderSentenceMorphemesHTML(sentence) {
    if (isGreekSentence(sentence)) {
      return renderGreekSentenceMorphemesHTML(sentence);
    }
    return renderHebrewSentenceMorphemesHTML(sentence);
  }

  function renderMorphemesRibbonHTML(flatMorphemes) {
    if (GreekModalState.isOpen || (flatMorphemes && flatMorphemes[0] && flatMorphemes[0].isGreek)) {
      return renderGreekRibbonHTML(flatMorphemes);
    }
    return renderHebrewRibbonHTML(flatMorphemes);
  }

  function renderGlobalSentenceView(sentence) {
    const s = sentence || (GreekModalState.isOpen ? GreekModalState.currentSentence : HebrewModalState.currentSentence);
    if (isGreekSentence(s)) {
      return renderGreekGlobalView(sentence);
    }
    return renderHebrewGlobalView(sentence);
  }

  function renderMorphemeDissectionView(mItem, sentence) {
    const s = sentence || (GreekModalState.isOpen ? GreekModalState.currentSentence : HebrewModalState.currentSentence);
    if (isGreekSentence(s) || (mItem && mItem.isGreek)) {
      return renderGreekDissectionView(mItem, sentence);
    }
    return renderHebrewDissectionView(mItem, sentence);
  }

  function openSentenceAnalysisModal(sentence) {
    if (isGreekSentence(sentence)) {
      if (HebrewModalState.isOpen) closeHebrewSentenceAnalysisModal();
      openGreekSentenceAnalysisModal(sentence);
    } else {
      if (GreekModalState.isOpen) closeGreekSentenceAnalysisModal();
      openHebrewSentenceAnalysisModal(sentence);
    }
  }

  function closeSentenceAnalysisModal() {
    if (GreekModalState.isOpen) closeGreekSentenceAnalysisModal();
    if (HebrewModalState.isOpen) closeHebrewSentenceAnalysisModal();
  }

  function setActiveMorphemeIndex(idx, pin = false) {
    if (GreekModalState.isOpen) {
      setActiveGreekMorphemeIndex(idx, pin);
    } else {
      setActiveHebrewMorphemeIndex(idx, pin);
    }
  }

  function navigateMorphemes(direction) {
    if (GreekModalState.isOpen) {
      navigateGreekMorphemes(direction);
    } else {
      navigateHebrewMorphemes(direction);
    }
  }

  // Proxy dinâmico para ModalState compatível com testes legados
  const ModalState = new Proxy(HebrewModalState, {
    get(target, prop) {
      if (GreekModalState.isOpen) return GreekModalState[prop];
      return HebrewModalState[prop];
    },
    set(target, prop, value) {
      if (GreekModalState.isOpen) {
        GreekModalState[prop] = value;
      } else {
        HebrewModalState[prop] = value;
      }
      return true;
    }
  });

  function createDynamicModalDOM() {
    const modal = document.createElement("div");
    modal.id = "sentence-analysis-modal";
    modal.className = "hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md";
    modal.innerHTML = `
      <div id="sentence-analysis-card" class="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div class="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">🔬</span>
            <div>
              <h3 id="analysis-modal-title" class="font-bold text-base md:text-lg text-white">Análise Morfossintática de Frases Hebraicas</h3>
              <p class="text-xs text-slate-400 font-medium">Dissecação granular de partículas, raízes e morfemas (Gramática de Page Kelley)</p>
            </div>
          </div>
          <button type="button" id="btn-close-analysis-modal" onclick="SentenceAnalysisModule.closeSentenceAnalysisModal()" class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer" title="Fechar (Esc)">✕</button>
        </div>
        <div class="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden shadow-inner">
            <div class="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-center gap-2">
              <span>Frase em Evidência</span>
              <span>•</span>
              <span id="analysis-pinned-indicator" class="text-amber-400 hidden">📌 Morfema Fixado</span>
            </div>
            <div id="sentence-morphemes-container" class="hebrew-sentence-container hebrew-text text-white py-2" dir="rtl"></div>
            <div id="sentence-morphemes-ribbon" class="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-1.5"></div>
            <div class="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-2 text-[11px]">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>Artigo
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Conjunção
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Preposição
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Substantivo
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>Adjetivo
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>Verbo
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300">
                <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>Advérbio
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300">
                <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>Sufixo Pronominal
              </span>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Partícula / Pronome
              </span>
            </div>
          </div>
          <div id="sentence-analysis-panel" class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 md:p-6 min-h-[220px] flex flex-col justify-center transition-all"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeSentenceAnalysisModal();
      }
    });

    return modal;
  }

  // ==========================================================================
  // 6. EXPORTAÇÕES DO MÓDULO (BROWSER & COMMONJS)
  // ==========================================================================

  const ModuleExports = {
    // Categorias & Mapas
    CATEGORY_MAP: HEBREW_CATEGORY_MAP,
    HEBREW_CATEGORY_MAP,
    GREEK_CATEGORY_MAP,

    // Classificação
    getMorphemeCategory,
    getHebrewMorphemeCategory,
    getGreekMorphemeCategory,

    // Utilitários
    tokenEndsWithMaqqef,
    escapeHTML,
    normalizeHebrewForSearch,
    normalizeGreekForSearch,
    isGreekSentence,
    findSentenceInDatabase,
    findHebrewSentenceInDatabase: findSentenceInDatabase,

    // Pipeline Hebraico (Page Kelley)
    buildHebrewFlatMorphemesList,
    renderHebrewSentenceMorphemesHTML,
    renderHebrewRibbonHTML,
    renderHebrewGlobalView,
    renderHebrewDissectionView,
    HebrewModalState,
    openHebrewSentenceAnalysisModal,
    closeHebrewSentenceAnalysisModal,
    setActiveHebrewMorphemeIndex,
    navigateHebrewMorphemes,

    // Pipeline Grego (Johannes Bergmann)
    parseGreekStepDetails,
    inferGreekWordFallback,
    buildGreekFlatMorphemesList,
    renderGreekSentenceMorphemesHTML,
    renderGreekRibbonHTML,
    renderGreekGlobalView,
    renderGreekDissectionView,
    GreekModalState,
    openGreekSentenceAnalysisModal,
    closeGreekSentenceAnalysisModal,
    setActiveGreekMorphemeIndex,
    navigateGreekMorphemes,

    // Despachadores Unificados
    buildFlatMorphemesList,
    renderSentenceMorphemesHTML,
    renderMorphemesRibbonHTML,
    renderGlobalSentenceView,
    renderMorphemeDissectionView,
    openSentenceAnalysisModal,
    closeSentenceAnalysisModal,
    setActiveMorphemeIndex,
    navigateMorphemes,
    ModalState
  };

  // Exposição global no navegador
  if (typeof window !== "undefined") {
    window.SentenceAnalysisModule = ModuleExports;
    window.openSentenceAnalysisModal = openSentenceAnalysisModal;
    window.closeSentenceAnalysisModal = closeSentenceAnalysisModal;
  }

  // Suporte a CommonJS para testes unitários
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ModuleExports;
  }
})(typeof window !== "undefined" ? window : global);
