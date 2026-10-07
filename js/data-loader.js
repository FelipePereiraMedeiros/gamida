/**
 * ==========================================================================
 * Gamida - Data Loader Module
 * Responsável pelo carregamento assíncrono dos arquivos JSON de banco de dados,
 * fallback offline/file:// e pela sincronização com o localStorage do navegador.
 * ==========================================================================
 */

const DataLoader = {
  get VERSION() {
    return (typeof window !== "undefined" && window.APP_VERSION) || "2.7.1";
  },
  cache: {},

  /**
   * Helper para extrair o termo/glifo do item (hebraico ou grego)
   * @param {Object} item
   * @returns {string}
   */
  getTerm(item) {
    if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.getTerm === "function") {
      return window.StateModule.getTerm(item);
    }
    if (!item) return "";
    return item.term || item.hebrew || "";
  },

  /**
   * Valida a integridade estrutural de um capítulo
   * @param {Object} chapter
   * @returns {boolean}
   */
  isValidChapter(chapter) {
    if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.isValidChapter === "function") {
      return window.StateModule.isValidChapter(chapter);
    }
    if (typeof isValidChapter === "function" && isValidChapter !== DataLoader.isValidChapter) {
      return isValidChapter(chapter);
    }
    if (!chapter || typeof chapter !== "object") return false;
    if (typeof chapter.id !== "string" || !chapter.id.trim()) return false;
    if (typeof chapter.title !== "string" || !chapter.title.trim()) return false;
    const collections = [chapter.items, chapter.sentences].filter(Array.isArray);
    if (collections.length === 0) return false;
    const allItems = collections.flat();
    if (allItems.length === 0) return false; // Impede capítulos vazios sem vocabulário
    return allItems.every((item) => {
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
    if (typeof window !== "undefined" && window.StateModule && typeof window.StateModule.hasUniqueChapterIds === "function") {
      return window.StateModule.hasUniqueChapterIds(chapters);
    }
    if (typeof hasUniqueChapterIds === "function" && hasUniqueChapterIds !== DataLoader.hasUniqueChapterIds) {
      return hasUniqueChapterIds(chapters);
    }
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

    // 1. Tenta buscar via fetch (servidor HTTP / Web) com validação de versão
    try {
      const filename = language === "hebrew" ? "hebrew_chapters.json" : "greek_chapters.json";
      const version = (typeof APP_VERSION !== "undefined" && APP_VERSION) ? APP_VERSION : this.VERSION;
      const res = await fetch(`./data/${filename}?v=${encodeURIComponent(version)}`);
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
      } catch (nodeErr) {
        console.warn(`Fallback Node.js não pôde ler o arquivo de dados para ${language}:`, nodeErr.message);
      }
    }

    throw new Error(`Falha ao obter banco de dados padrão para ${language}`);
  },

  /**
   * Camada de armazenamento assíncrona (IndexedDB com fallback para localStorage)
   */
  storage: {
    _db: null,
    _mem: {},
    isAvailable() {
      return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
    },
    async _getDB() {
      if (!this.isAvailable()) return null;
      if (this._db) return this._db;
      return new Promise((resolve) => {
        try {
          const req = window.indexedDB.open("gamida_db", 1);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("keyval")) {
              db.createObjectStore("keyval");
            }
          };
          req.onsuccess = (e) => {
            this._db = e.target.result;
            resolve(this._db);
          };
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    },
    async getItem(key) {
      const db = await this._getDB();
      if (db) {
        try {
          const res = await new Promise((resolve, reject) => {
            const tx = db.transaction("keyval", "readonly");
            const store = tx.objectStore("keyval");
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
            req.onerror = () => reject(req.error);
          });
          if (res !== null) return res;
        } catch (e) {
          console.warn("Aviso ao ler do IndexedDB:", e);
        }
      }
      if (typeof localStorage !== "undefined") {
        const item = localStorage.getItem(key);
        if (item !== null && item !== undefined) return item;
      }
      return this._mem[key] !== undefined ? this._mem[key] : null;
    },
    async setItem(key, val) {
      const strVal = typeof val === "string" ? val : JSON.stringify(val);
      this._mem[key] = strVal;
      const db = await this._getDB();
      if (db) {
        try {
          await new Promise((resolve, reject) => {
            const tx = db.transaction("keyval", "readwrite");
            const store = tx.objectStore("keyval");
            const req = store.put(val, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        } catch (e) {
          console.warn("Aviso ao gravar no IndexedDB:", e);
        }
      }
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(key, strVal);
        } catch (storageErr) {
          console.warn("Aviso ao espelhar no localStorage (cota excedida ou restrição de storage):", storageErr);
        }
      }
    },
    async removeItem(key) {
      delete this._mem[key];
      const db = await this._getDB();
      if (db) {
        try {
          await new Promise((resolve, reject) => {
            const tx = db.transaction("keyval", "readwrite");
            const store = tx.objectStore("keyval");
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        } catch (e) {
          console.warn("Aviso ao remover do IndexedDB:", e);
        }
      }
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      }
    },
  },

  /**
   * Salva uma coleção de capítulos no storage unificado
   * @param {'hebrew'|'greek'} language
   * @param {Array} chapters
   * @param {string} [version=null]
   */
  async saveChapters(language, chapters, version = null) {
    const v = version || ((typeof APP_VERSION !== "undefined" && APP_VERSION) ? APP_VERSION : this.VERSION);
    await this.storage.setItem(`gamida_${language}_chapters`, JSON.stringify(chapters));
    await this.storage.setItem(`gamida_data_version_${language}`, v);
  },

  /**
   * Carrega os capítulos para a aplicação:
   * 1. Verifica se existem no storage unificado (IndexedDB/localStorage), se a versão confere e se o alfabeto está presente.
   * 2. Se não existir, for inválido ou estiver desatualizado, busca do padrão (fetch/bundle).
   * 3. Aplica o padrão Overlay: preserva customizações e edições explícitas do usuário mesmo após migrações de versão.
   * @param {'hebrew'|'greek'} language 
   * @returns {Promise<Array>} Array de capítulos carregados
   */
  async loadChapters(language) {
    const version = (typeof APP_VERSION !== "undefined" && APP_VERSION) ? APP_VERSION : this.VERSION;
    const stored = await this.storage.getItem(`gamida_${language}_chapters`);
    const storedVersion = await this.storage.getItem(`gamida_data_version_${language}`);
    const validatorFn = (typeof isValidChapter === "function") ? isValidChapter : this.isValidChapter;
    const uniqueFn = (typeof hasUniqueChapterIds === "function") ? hasUniqueChapterIds : this.hasUniqueChapterIds;

    let parsedStored = null;
    if (stored) {
      try {
        const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
        if (
          Array.isArray(parsed) &&
          uniqueFn(parsed) &&
          parsed.every(validatorFn) &&
          this.hasAlphabetChapter(parsed, language)
        ) {
          parsedStored = parsed;
        }
      } catch (e) {
        console.warn("Dados corrompidos no storage. Recarregando padrão...", e);
      }
    }

    // No Hebraico, garante que TODAS as frases possuem tokens estruturados (migração estrita de versão/dados)
    const hasMorphologyTokens = language !== "hebrew" || (
      Array.isArray(parsedStored) &&
      parsedStored.every((c) => !Array.isArray(c.sentences) || c.sentences.length === 0 || c.sentences.every((s) => Array.isArray(s.tokens) && s.tokens.length > 0))
    );

    if (parsedStored && storedVersion === version && hasMorphologyTokens) {
      return parsedStored;
    }

    // Carrega dados padrão atualizados preservando customizações do usuário (Overlay Pattern)
    try {
      const defaults = await this.fetchDefaultChapters(language);
      let chapters = JSON.parse(JSON.stringify(defaults));

      if (parsedStored) {
        const storedMap = new Map(parsedStored.map((c) => [c && c.id, c]));

        // 1. Preserva capítulos padrão modificados pelo usuário
        chapters = defaults.map((defChap) => {
          const storedChap = storedMap.get(defChap.id);
          if (storedChap && (storedChap._userModified === true || storedChap._custom === true)) {
            console.info(`Migração de versão: preservada customização do usuário no capítulo padrão ${defChap.id}.`);
            return storedChap;
          }
          return defChap;
        });

        // 2. Preserva capítulos novos adicionados pelo usuário
        const defaultIds = new Set(defaults.map((c) => c && c.id));
        const customChapters = parsedStored.filter((c) => c && !defaultIds.has(c.id));
        if (customChapters.length > 0) {
          chapters = [...chapters, ...customChapters];
          console.info(`Migração de versão: ${customChapters.length} capítulo(s) customizado(s) preservado(s).`);
        }
      }

      await this.saveChapters(language, chapters, version);
      return chapters;
    } catch (err) {
      console.error("Erro ao carregar capítulos:", err);
      // Se houver dados válidos já em memória/storage, usa como fallback emergencial
      if (parsedStored) {
        return parsedStored;
      }
      throw err;
    }
  }
};

if (typeof window !== "undefined") {
  window.DataLoader = DataLoader;
  window.GamidaStorage = DataLoader.storage;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = DataLoader;
}
