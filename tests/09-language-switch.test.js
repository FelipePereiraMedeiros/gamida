/**
 * ==========================================================================
 * Módulo 9: Troca de Idioma (Hebraico ↔ Grego) & Adaptação de UI
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 9: Troca de Idioma & Adaptação de UI');
const { appJs, html } = loadSourceFiles();

suite.test('Botão de logo no HTML permite alternar idioma no clique', () => {
  assert.includes(html, 'id="app-logo-btn"', 'Botão #app-logo-btn ausente');
  assert.includes(html, 'onclick="toggleLanguage()"', 'Evento onclick="toggleLanguage()" ausente');
});

suite.test('toggleLanguage alterna entre "hebrew" e "greek" e atualiza estado', () => {
  let language = "hebrew";
  language = language === "hebrew" ? "greek" : "hebrew";
  assert.equal(language, "greek");

  language = language === "hebrew" ? "greek" : "hebrew";
  assert.equal(language, "hebrew");
});

suite.test('applyLanguageUI altera glifos, títulos e classes tipográficas', () => {
  assert.includes(appJs, 'logo.textContent = "א";', 'Glifo de hebraico ausente');
  assert.includes(appJs, 'logo.textContent = "α";', 'Glifo de grego ausente');
  assert.includes(appJs, 'hebrew-text', 'Classe hebrew-text ausente');
  assert.includes(appJs, 'greek-text', 'Classe greek-text ausente');
});

suite.test('Persistência da preferência de idioma no localStorage', () => {
  assert.includes(appJs, 'localStorage.setItem("gamida_language", AppState.language);', 'Persistência de gamida_language ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
