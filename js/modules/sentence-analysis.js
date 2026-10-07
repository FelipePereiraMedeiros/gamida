/**
 * ==========================================================================
 * Módulo de Análise Morfossintática de Frases Hebraicas (Page Kelley)
 * Gamida - Biblical Language Trainer
 * 
 * Dissecação granular de partículas, raízes e morfemas no nível atômico.
 * Suporta navegação por mouse (hover), touch (pin/unpin) e teclado RTL.
 * ==========================================================================
 */

(function (global) {
  "use strict";

  // Mapeamento Canônico de Categorias Morfológicas para Cores & Estilos
  const CATEGORY_MAP = {
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

  /**
   * Classifica o tipo de partícula/palavra em uma das 8 categorias canônicas
   * @param {string} typeStr
   * @returns {"article"|"conjunction"|"preposition"|"noun"|"adjective"|"verb"|"suffix"|"particle"}
   */
  function getMorphemeCategory(typeStr) {
    if (!typeStr) return "particle";
    const t = String(typeStr).toLowerCase().trim();

    if (t.includes("sufixo")) return "suffix"; // Avaliado antes de 'pronome'
    if (t.includes("preposi")) return "preposition"; // Avaliado antes de 'artigo' (ex: preposição inseparável com artigo absorvido)
    if (t.includes("artigo")) return "article";
    if (t.includes("conjun") || t.includes("vav")) return "conjunction";
    if (t.includes("verbo") || t.includes("particípio") || t.includes("participio")) return "verb";
    if (t.includes("adjetivo")) return "adjective";
    if (t.includes("substantivo") || t.includes("nome próprio") || t.includes("nome proprio") || t.includes("nome divino") || t.includes("epíteto") || t.includes("epiteto")) {
      return "noun";
    }
    // Partículas, pronomes, advérbios, numerais
    return "particle";
  }

  /**
   * Verifica se o token hebraico termina com o traço Maqqef (־ ou -)
   * @param {Object} token
   * @returns {boolean}
   */
  function tokenEndsWithMaqqef(token) {
    if (!token || !token.text) return false;
    const s = String(token.text).trim();
    return s.endsWith("־") || s.endsWith("-") || s.endsWith("\u05BE");
  }

  /**
   * Escapa caracteres especiais para inserção segura em HTML
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Estado interno do Modal
  const ModalState = {
    isOpen: false,
    currentSentence: null,
    flatMorphemes: [], // Array de { index, tokenIdx, partIdx, token, part, category }
    activeIndex: null, // Índice ativo (hover ou teclado)
    pinnedIndex: null, // Índice fixado via toque/clique
    activeElement: null
  };

  /**
   * Normalização e remoção de nikkud/maqqef/espaços para busca flexível
   * @param {string} str
   * @returns {string}
   */
  function normalizeHebrewForSearch(str) {
    if (!str) return "";
    return String(str)
      .trim()
      .normalize("NFC")
      .replace(/[\u0591-\u05C7\u05BE\s]/g, "");
  }

  /**
   * Localiza a oração completa com tokens e morfemas no banco de dados pré-carregado
   * @param {Object} sentence
   * @returns {Object|null}
   */
  function findSentenceInDatabase(sentence) {
    if (!sentence) return null;
    const sId = sentence.id;
    const sText = (sentence.hebrew || sentence.term || "").trim();
    const sNorm = normalizeHebrewForSearch(sText);

    const pools = [];

    // 1. window.GAMIDA_DEFAULT_DATA.hebrew (bundle offline compilado)
    if (typeof window !== "undefined" && window.GAMIDA_DEFAULT_DATA && Array.isArray(window.GAMIDA_DEFAULT_DATA.hebrew)) {
      pools.push(window.GAMIDA_DEFAULT_DATA.hebrew);
    }

    // 2. DataLoader.cache.hebrew (cache em memória do DataLoader)
    if (typeof DataLoader !== "undefined" && DataLoader.cache && Array.isArray(DataLoader.cache.hebrew)) {
      pools.push(DataLoader.cache.hebrew);
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
      } catch (e) {}
    }

    for (const chapters of pools) {
      for (const ch of chapters) {
        for (const s of (ch.sentences || [])) {
          if (!Array.isArray(s.tokens) || s.tokens.length === 0) continue;
          if (sId && s.id === sId) return s;
          if (sText && (s.hebrew === sText || s.term === sText)) return s;
          if (sNorm && (normalizeHebrewForSearch(s.hebrew) === sNorm || normalizeHebrewForSearch(s.term) === sNorm)) {
            return s;
          }
        }
      }
    }

    return null;
  }

  /**
   * Constrói a lista plana de morfemas em ordem de leitura hebraica
   * @param {Object} sentence
   * @returns {Array}
   */
  function buildFlatMorphemesList(sentence) {
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
            category: getMorphemeCategory(synthPart.type)
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
        category: getMorphemeCategory(fallbackPart.type)
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
            category: getMorphemeCategory(part.type)
          });
        });
      } else {
        const synthPart = {
          segment: token.text,
          transliteration: token.transliteration || "",
          type: token.word_class || "Vocábulo",
          meaning: token.lemma ? `Raiz / Lexema: ${token.lemma}` : "",
          inflection: token.inflection || "",
          phonetics: token.phonetics || ""
        };
        list.push({
          index: globalIdx++,
          tokenIdx: tIdx,
          partIdx: 0,
          token: token,
          part: synthPart,
          category: getMorphemeCategory(token.word_class)
        });
      }
    });

    return list;
  }

  /**
   * Renderiza a marcação HTML da frase hebraica com dissecção granular
   * - Tokens simples: <span class="morpheme" data-token-idx="..." data-part-idx="0">{token.text}</span>
   * - Tokens compostos: <span class="token-wrapper"><span class="morpheme" data-token-idx="..." data-part-idx="i">{part.segment}</span>...</span>
   * - Espaçamento zero entre morfemas do mesmo token;
   * - Espaço padrão apenas entre token-wrapper adjacentes (zero após Maqqef).
   * @param {Object} sentence
   * @returns {string} HTML string
   */
  function renderSentenceMorphemesHTML(sentence) {
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
              const cat = getMorphemeCategory(part.type);
              const meta = CATEGORY_MAP[cat] || CATEGORY_MAP.particle;
              return `<span class="morpheme ${meta.glowClass}" data-token-idx="${tIdx}" data-part-idx="${pIdx}" title="${escapeHTML(part.type + ': ' + (part.meaning || ''))}">${escapeHTML(part.segment)}</span>`;
            })
            .join("");
          return `<span class="token-wrapper${maqqefClass}" data-token-idx="${tIdx}">${partsHTML}</span>`;
        } else {
          const cat = getMorphemeCategory(token.word_class);
          const meta = CATEGORY_MAP[cat] || CATEGORY_MAP.particle;
          return `<span class="token-wrapper${maqqefClass}" data-token-idx="${tIdx}"><span class="morpheme ${meta.glowClass}" data-token-idx="${tIdx}" data-part-idx="0" title="${escapeHTML(token.word_class || '')}">${escapeHTML(token.text)}</span></span>`;
        }
      })
      .join("");
  }

  /**
   * Renderiza a Barra Interativa de Fragmentos (Morpheme Ribbon) com botões para cada morfema
   * @param {Array} flatMorphemes
   * @returns {string} HTML string
   */
  function renderMorphemesRibbonHTML(flatMorphemes) {
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
      const meta = CATEGORY_MAP[cat] || CATEGORY_MAP.particle;
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

  /**
   * Renderiza a Visão Global da Oração (quando nenhum morfema está em foco)
   * @param {Object} sentence
   * @returns {string} HTML string
   */
  function renderGlobalSentenceView(sentence) {
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

  /**
   * Renderiza a Dissecação Anatômica do Morfema
   * @param {Object} mItem
   * @param {Object} sentence
   * @returns {string} HTML string
   */
  function renderMorphemeDissectionView(mItem, sentence) {
    if (!mItem || !mItem.part) return "";

    const { part, token, category } = mItem;
    const catMeta = CATEGORY_MAP[category] || CATEGORY_MAP.particle;
    const isPinned = ModalState.pinnedIndex === mItem.index;

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
              ${mItem.index + 1} / ${ModalState.flatMorphemes.length}
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
          <span>Partícula ${mItem.index + 1} de ${ModalState.flatMorphemes.length}</span>
          <span class="font-mono text-[11px]">
            ${isPinned ? "Toque novamente para desafixar" : "Clique ou toque para travar a leitura"}
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Atualiza o painel inferior de análise dinamicamente
   */
  function updateAnalysisPanel() {
    if (typeof document === "undefined") return;
    const panel = document.getElementById("sentence-analysis-panel");
    if (!panel) return;

    const pinnedIndicator = document.getElementById("analysis-pinned-indicator");
    if (pinnedIndicator) {
      if (ModalState.pinnedIndex !== null) {
        pinnedIndicator.classList.remove("hidden");
      } else {
        pinnedIndicator.classList.add("hidden");
      }
    }

    const targetIdx = ModalState.pinnedIndex !== null
      ? ModalState.pinnedIndex
      : ModalState.activeIndex;

    if (targetIdx !== null && ModalState.flatMorphemes[targetIdx]) {
      const mItem = ModalState.flatMorphemes[targetIdx];
      panel.innerHTML = renderMorphemeDissectionView(mItem, ModalState.currentSentence);
    } else {
      panel.innerHTML = renderGlobalSentenceView(ModalState.currentSentence);
    }
  }

  /**
   * Atualiza as classes visuais de destaque (.is-active, .is-pinned) nos elementos do DOM
   */
  function syncMorphemeDOMHighlights() {
    if (typeof document === "undefined") return;
    const container = document.getElementById("sentence-morphemes-container");
    const ribbon = document.getElementById("sentence-morphemes-ribbon");

    const targetIdx = ModalState.pinnedIndex !== null
      ? ModalState.pinnedIndex
      : ModalState.activeIndex;

    // 1. Destaque dos morfemas na frase hebraica
    if (container) {
      const morphemeEls = container.querySelectorAll(".morpheme");
      morphemeEls.forEach((el) => {
        const tIdx = parseInt(el.getAttribute("data-token-idx"), 10);
        const pIdx = parseInt(el.getAttribute("data-part-idx"), 10);

        if (targetIdx !== null) {
          const activeItem = ModalState.flatMorphemes[targetIdx];
          if (activeItem && activeItem.tokenIdx === tIdx && activeItem.partIdx === pIdx) {
            el.classList.add("is-active");
            if (ModalState.pinnedIndex !== null) {
              el.classList.add("is-pinned");
            } else {
              el.classList.remove("is-pinned");
            }
            return;
          }
        }
        el.classList.remove("is-active", "is-pinned");
      });
    }

    // 2. Destaque dos chips na barra interativa de fragmentos
    if (ribbon) {
      const chips = ribbon.querySelectorAll(".morpheme-chip");
      chips.forEach((chip) => {
        const rawIdx = chip.getAttribute("data-morpheme-idx");
        if (rawIdx === "global") {
          if (targetIdx === null) {
            chip.classList.add("is-active");
          } else {
            chip.classList.remove("is-active", "is-pinned");
          }
          return;
        }

        const idx = parseInt(rawIdx, 10);
        if (idx === targetIdx) {
          chip.classList.add("is-active");
          if (ModalState.pinnedIndex !== null) {
            chip.classList.add("is-pinned");
          } else {
            chip.classList.remove("is-pinned");
          }
        } else {
          chip.classList.remove("is-active", "is-pinned");
        }
      });
    }
  }

  /**
   * Define o morfema ativo ou fixado e sincroniza a UI
   * @param {number|null} idx
   * @param {boolean} pin
   */
  function setActiveMorphemeIndex(idx, pin = false) {
    if (pin) {
      if (idx === null) {
        ModalState.pinnedIndex = null;
        ModalState.activeIndex = null;
      } else if (ModalState.pinnedIndex === idx) {
        // Desafixa se clicou no mesmo morfema já fixado
        ModalState.pinnedIndex = null;
        ModalState.activeIndex = idx;
      } else {
        ModalState.pinnedIndex = idx;
        ModalState.activeIndex = idx;
      }
    } else {
      ModalState.activeIndex = idx;
    }

    syncMorphemeDOMHighlights();
    updateAnalysisPanel();
  }

  /**
   * Navega entre os morfemas respeitando a orientação hebraica RTL
   * @param {number} direction +1 para próximo (ArrowLeft em RTL), -1 para anterior (ArrowRight em RTL)
   */
  function navigateMorphemes(direction) {
    if (!ModalState.isOpen || ModalState.flatMorphemes.length === 0) return;

    const total = ModalState.flatMorphemes.length;
    let current = ModalState.pinnedIndex !== null
      ? ModalState.pinnedIndex
      : (ModalState.activeIndex !== null ? ModalState.activeIndex : -1);

    let next;
    if (current === -1) {
      // Início da frase hebraica (à direita)
      next = direction > 0 ? 0 : total - 1;
    } else {
      next = (current + direction + total) % total;
    }

    setActiveMorphemeIndex(next, true); // Fixa para leitura estável
  }

  /**
   * Listener de teclado global para o modal (ArrowLeft, ArrowRight, Escape)
   */
  function handleModalKeyDown(e) {
    if (!ModalState.isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeSentenceAnalysisModal();
    } else if (e.key === "ArrowLeft") {
      // Em RTL, a leitura avança para a ESQUERDA
      e.preventDefault();
      navigateMorphemes(+1);
    } else if (e.key === "ArrowRight") {
      // Em RTL, voltar significa ir para a DIREITA
      e.preventDefault();
      navigateMorphemes(-1);
    }
  }

  /**
   * Abre o Modal de Análise Morfossintática com a frase especificada
   * @param {Object} sentence
   */
  function openSentenceAnalysisModal(sentence) {
    if (!sentence || typeof document === "undefined") return;

    ModalState.isOpen = true;
    ModalState.currentSentence = sentence;
    ModalState.flatMorphemes = buildFlatMorphemesList(sentence);
    ModalState.activeIndex = null;
    ModalState.pinnedIndex = null;

    let modal = document.getElementById("sentence-analysis-modal");
    if (!modal) {
      modal = createDynamicModalDOM();
    }

    const container = document.getElementById("sentence-morphemes-container");
    if (container) {
      container.innerHTML = renderSentenceMorphemesHTML(sentence);
      bindMorphemeContainerEvents(container);
    }

    const ribbon = document.getElementById("sentence-morphemes-ribbon");
    if (ribbon) {
      ribbon.innerHTML = renderMorphemesRibbonHTML(ModalState.flatMorphemes);
      bindRibbonEvents(ribbon);
    }

    updateAnalysisPanel();
    syncMorphemeDOMHighlights();

    if (modal && modal.classList && typeof modal.classList.remove === "function") {
      modal.classList.remove("hidden");
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("keydown", handleModalKeyDown);
    }
  }

  /**
   * Fecha o Modal de Análise Morfossintática
   */
  function closeSentenceAnalysisModal() {
    if (typeof document === "undefined") return;
    ModalState.isOpen = false;
    ModalState.currentSentence = null;
    ModalState.flatMorphemes = [];
    ModalState.activeIndex = null;
    ModalState.pinnedIndex = null;

    const modal = document.getElementById("sentence-analysis-modal");
    if (modal && modal.classList && typeof modal.classList.add === "function") {
      modal.classList.add("hidden");
    }

    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("keydown", handleModalKeyDown);
    }
  }

  /**
   * Associa eventos de mouse, toque e clique nos morfemas renderizados na frase hebraica
   * @param {HTMLElement} container
   */
  function bindMorphemeContainerEvents(container) {
    if (!container || container._morphemeEventsBound) return;
    container._morphemeEventsBound = true;

    // Delegação de eventos no container para performance otimizada
    container.addEventListener("mouseover", (e) => {
      const morphemeEl = e.target.closest(".morpheme");
      if (!morphemeEl) return;
      const tIdx = parseInt(morphemeEl.getAttribute("data-token-idx"), 10);
      const pIdx = parseInt(morphemeEl.getAttribute("data-part-idx"), 10);
      const matchIdx = ModalState.flatMorphemes.findIndex(
        (m) => m.tokenIdx === tIdx && m.partIdx === pIdx
      );
      if (matchIdx !== -1 && ModalState.pinnedIndex === null) {
        setActiveMorphemeIndex(matchIdx, false);
      }
    });

    container.addEventListener("mouseout", (e) => {
      // Se o cursor estiver apenas navegando entre partes do mesmo morfema ou morfeams contíguos, não limpa
      const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".morpheme, .morpheme-chip") : null;
      if (related) return;

      if (ModalState.pinnedIndex === null) {
        setActiveMorphemeIndex(null, false);
      }
    });

    container.addEventListener("click", (e) => {
      const morphemeEl = e.target.closest(".morpheme");
      if (morphemeEl) {
        e.stopPropagation();
        const tIdx = parseInt(morphemeEl.getAttribute("data-token-idx"), 10);
        const pIdx = parseInt(morphemeEl.getAttribute("data-part-idx"), 10);
        const matchIdx = ModalState.flatMorphemes.findIndex(
          (m) => m.tokenIdx === tIdx && m.partIdx === pIdx
        );
        if (matchIdx !== -1) {
          setActiveMorphemeIndex(matchIdx, true);
        }
      } else {
        // Clicou no fundo do contêiner da frase -> desafixa e volta para visão global
        if (ModalState.pinnedIndex !== null) {
          ModalState.pinnedIndex = null;
          setActiveMorphemeIndex(null, false);
        }
      }
    });
  }

  /**
   * Associa eventos aos chips da barra de fragmentos (ribbon)
   * @param {HTMLElement} ribbon
   */
  function bindRibbonEvents(ribbon) {
    if (!ribbon || ribbon._ribbonEventsBound) return;
    ribbon._ribbonEventsBound = true;

    ribbon.addEventListener("mouseover", (e) => {
      const chip = e.target.closest(".morpheme-chip");
      if (!chip) return;
      const rawIdx = chip.getAttribute("data-morpheme-idx");
      if (rawIdx === "global") {
        if (ModalState.pinnedIndex === null) {
          setActiveMorphemeIndex(null, false);
        }
        return;
      }
      const idx = parseInt(rawIdx, 10);
      if (!isNaN(idx) && ModalState.pinnedIndex === null) {
        setActiveMorphemeIndex(idx, false);
      }
    });

    ribbon.addEventListener("mouseout", (e) => {
      const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".morpheme-chip, .morpheme") : null;
      if (related) return;

      if (ModalState.pinnedIndex === null) {
        setActiveMorphemeIndex(null, false);
      }
    });

    ribbon.addEventListener("click", (e) => {
      const chip = e.target.closest(".morpheme-chip");
      if (!chip) return;
      e.stopPropagation();
      const rawIdx = chip.getAttribute("data-morpheme-idx");
      if (rawIdx === "global") {
        ModalState.pinnedIndex = null;
        setActiveMorphemeIndex(null, true);
        return;
      }
      const idx = parseInt(rawIdx, 10);
      if (!isNaN(idx)) {
        setActiveMorphemeIndex(idx, true);
      }
    });
  }

  /**
   * Criação defensiva do container do modal caso não esteja pré-renderizado no HTML
   */
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
            <div id="sentence-morphemes-container" class="hebrew-sentence-container text-white py-2" dir="rtl"></div>
            <div id="sentence-morphemes-ribbon" class="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-1.5"></div>
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

  // Exportação para o ecossistema Gamida
  const ModuleExports = {
    CATEGORY_MAP,
    getMorphemeCategory,
    tokenEndsWithMaqqef,
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
