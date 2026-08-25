/**
 * ==========================================================================
 * Gamida - Data Loader Module
 * Responsável pelo carregamento assíncrono dos arquivos JSON de banco de dados
 * e pela sincronização com o localStorage do navegador.
 * ==========================================================================
 */

const DataLoader = {
  cache: {},

  /**
   * Busca o arquivo JSON correspondente ao idioma ('hebrew' ou 'greek')
   * @param {'hebrew'|'greek'} language 
   * @returns {Promise<Array>} Array com os capítulos do idioma
   */
  async fetchDefaultChapters(language) {
    if (this.cache[language]) {
      return this.cache[language];
    }
    const filename = language === "hebrew" ? "hebrew_chapters.json" : "greek_chapters.json";
    const res = await fetch(`./data/${filename}`);
    if (!res.ok) {
      throw new Error(`Falha ao obter banco de dados (${res.status} ${res.statusText})`);
    }
    const data = await res.json();
    this.cache[language] = data;
    return data;
  },

  /**
   * Carrega os capítulos para a aplicação:
   * 1. Verifica se existem no localStorage e se a versão confere.
   * 2. Se não existir ou for inválido, busca do arquivo JSON via fetch.
   * @param {'hebrew'|'greek'} language 
   * @returns {Promise<Array>} Array de capítulos carregados
   */
  async loadChapters(language) {
    const stored = localStorage.getItem(`gamida_${language}_chapters`);
    const storedVersion = localStorage.getItem(`gamida_data_version_${language}`);

    if (stored && storedVersion === APP_VERSION) {
      try {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          hasUniqueChapterIds(parsed) &&
          parsed.every(isValidChapter)
        ) {
          return parsed;
        }
      } catch (e) {
        console.warn("Dados corrompidos no localStorage. Recarregando padrão do arquivo JSON...", e);
      }
    }

    // Carrega dados padrão do arquivo JSON
    try {
      const defaults = await this.fetchDefaultChapters(language);
      const chapters = JSON.parse(JSON.stringify(defaults));
      localStorage.setItem(`gamida_${language}_chapters`, JSON.stringify(chapters));
      localStorage.setItem(`gamida_data_version_${language}`, APP_VERSION);
      return chapters;
    } catch (err) {
      console.error("Erro ao carregar capítulos a partir do arquivo JSON:", err);
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
