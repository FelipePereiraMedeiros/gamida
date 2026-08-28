/**
 * ==========================================================================
 * Gamida - Data Loader Module
 * Responsável pelo carregamento assíncrono dos arquivos JSON de banco de dados,
 * fallback offline/file:// e pela sincronização com o localStorage do navegador.
 * ==========================================================================
 */

const DataLoader = {
  VERSION: "2.6.0",
  cache: {},

  /**
   * Helper para extrair o termo/glifo do item (hebraico ou grego)
   * @param {Object} item
   * @returns {string}
   */
  getTerm(item) {
    if (!item) return "";
    return item.term || item.hebrew || "";
  },

  /**
   * Valida a integridade estrutural de um capítulo
   * @param {Object} chapter
   * @returns {boolean}
   */
  isValidChapter(chapter) {
    if (!chapter || typeof chapter !== "object") return false;
    if (typeof chapter.id !== "string" || !chapter.id.trim()) return false;
    if (typeof chapter.title !== "string" || !chapter.title.trim()) return false;
    const collections = [chapter.items, chapter.sentences].filter(Array.isArray);
    if (collections.length === 0) return false;
    return collections.flat().every((item) => {
      const term = item && DataLoader.getTerm(item);
      return (
        item &&
        typeof term === "string" &&
        term.trim() &&
        Array.isArray(item.translations) &&
        item.translations.length > 0 &&
        item.translations.every(
          (translation) => typeof translation === "string" && translation.trim(),
        )
      );
    });
  },

  /**
   * Valida se todos os capítulos possuem IDs únicos
   * @param {Array} chapters
   * @returns {boolean}
   */
  hasUniqueChapterIds(chapters) {
    if (!Array.isArray(chapters)) return false;
    const ids = chapters.map((c) => c && c.id);
    return ids.every((id, index) => id && ids.indexOf(id) === index);
  },

  /**
   * Valida se o capítulo do alfabeto (Capítulo 1) está presente na coleção
   * @param {Array} chapters
   * @param {'hebrew'|'greek'} language
   * @returns {boolean}
   */
  hasAlphabetChapter(chapters, language) {
    if (!Array.isArray(chapters) || chapters.length === 0) return false;
    if (language === "hebrew") {
      const chap1 = chapters.find((c) => c && c.id === "kelley_01");
      return !!(chap1 && Array.isArray(chap1.items) && chap1.items.length === 22);
    }
    if (language === "greek") {
      const chap1 = chapters.find((c) => c && c.id === "bergmann_01");
      return !!(chap1 && Array.isArray(chap1.items) && chap1.items.length === 24);
    }
    return true;
  },

  /**
   * Limpa o cache em memória
   * @param {'hebrew'|'greek'|null} [language=null]
   */
  clearCache(language = null) {
    if (language) {
      delete this.cache[language];
    } else {
      this.cache = {};
    }
  },

  /**
   * Busca os capítulos padrão correspondentes ao idioma ('hebrew' ou 'greek').
   * Suporta fetch HTTP com fallback resiliente para bundle offline / file:// protocol.
   * @param {'hebrew'|'greek'} language 
   * @returns {Promise<Array>} Array com os capítulos do idioma
   */
  async fetchDefaultChapters(language) {
    if (this.cache[language]) {
      return this.cache[language];
    }

    // 1. Tenta buscar via fetch (servidor HTTP / Web)
    try {
      const filename = language === "hebrew" ? "hebrew_chapters.json" : "greek_chapters.json";
      const res = await fetch(`./data/${filename}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cache[language] = data;
          return data;
        }
      }
    } catch (e) {
      // Fetch pode falhar em ambiente local file:// devido a restrições de CORS do navegador
      console.warn(`Fetch HTTP não disponível para ${language} (possível execução via file://). Usando data-bundle fallback.`);
    }

    // 2. Fallback offline / file:// via window.GAMIDA_DEFAULT_DATA
    if (
      typeof window !== "undefined" &&
      window.GAMIDA_DEFAULT_DATA &&
      Array.isArray(window.GAMIDA_DEFAULT_DATA[language]) &&
      window.GAMIDA_DEFAULT_DATA[language].length > 0
    ) {
      const data = window.GAMIDA_DEFAULT_DATA[language];
      this.cache[language] = data;
      return data;
    }

    // 3. Fallback Node.js (se executado em ambiente Node/testes)
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
      try {
        const fs = require("fs");
        const path = require("path");
        const filename = language === "hebrew" ? "hebrew_chapters.json" : "greek_chapters.json";
        const filePath = path.resolve(__dirname, `../data/${filename}`);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          this.cache[language] = data;
          return data;
        }
      } catch (nodeErr) {}
    }

    throw new Error(`Falha ao obter banco de dados padrão para ${language}`);
  },

  /**
   * Carrega os capítulos para a aplicação:
   * 1. Verifica se existem no localStorage, se a versão confere e se o alfabeto está presente.
   * 2. Se não existir, for inválido ou estiver desatualizado, busca do padrão (fetch/bundle).
   * @param {'hebrew'|'greek'} language 
   * @returns {Promise<Array>} Array de capítulos carregados
   */
  async loadChapters(language) {
    const version = (typeof APP_VERSION !== "undefined" && APP_VERSION) ? APP_VERSION : this.VERSION;
    const stored = localStorage.getItem(`gamida_${language}_chapters`);
    const storedVersion = localStorage.getItem(`gamida_data_version_${language}`);

    if (stored && storedVersion === version) {
      try {
        const parsed = JSON.parse(stored);
        const validatorFn = (typeof isValidChapter === "function") ? isValidChapter : this.isValidChapter;
        const uniqueFn = (typeof hasUniqueChapterIds === "function") ? hasUniqueChapterIds : this.hasUniqueChapterIds;
        if (
          Array.isArray(parsed) &&
          uniqueFn(parsed) &&
          parsed.every(validatorFn) &&
          this.hasAlphabetChapter(parsed, language)
        ) {
          return parsed;
        }
      } catch (e) {
        console.warn("Dados corrompidos ou desatualizados no localStorage. Recarregando padrão do arquivo JSON...", e);
      }
    }

    // Carrega dados padrão atualizados
    try {
      const defaults = await this.fetchDefaultChapters(language);
      const chapters = JSON.parse(JSON.stringify(defaults));
      localStorage.setItem(`gamida_${language}_chapters`, JSON.stringify(chapters));
      localStorage.setItem(`gamida_data_version_${language}`, version);
      return chapters;
    } catch (err) {
      console.error("Erro ao carregar capítulos:", err);
      // Se já houver algo em cache ou localStorage antigo, tenta usar como fallback emergencial
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (ignored) {}
      }
      throw err;
    }
  }
};
