/**
 * ==========================================================================
 * Gamida - Data Bundle Builder
 * Compila os arquivos JSON (hebrew_chapters.json e greek_chapters.json)
 * no bundle offline data/data-bundle.js
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '..', 'data');
const hebrewPath = path.join(dataDir, 'hebrew_chapters.json');
const greekPath = path.join(dataDir, 'greek_chapters.json');
const bundlePath = path.join(dataDir, 'data-bundle.js');

try {
  console.log('Lendo dados dos capítulos...');
  const hebrewRaw = fs.readFileSync(hebrewPath, 'utf8');
  const greekRaw = fs.readFileSync(greekPath, 'utf8');

  // Validação dos JSONs
  const hebrewData = JSON.parse(hebrewRaw);
  const greekData = JSON.parse(greekRaw);

  if (!Array.isArray(hebrewData) || hebrewData.length === 0) {
    throw new Error('hebrew_chapters.json não é um array válido ou está vazio');
  }
  if (!Array.isArray(greekData) || greekData.length === 0) {
    throw new Error('greek_chapters.json não é um array válido ou está vazio');
  }

  const bundleContent = `/**
 * Gamida Data Bundle - Offline & Standalone Fallback
 * Gerado automaticamente via scripts/build-bundle.js
 * Data: ${new Date().toISOString()}
 */
window.GAMIDA_DEFAULT_DATA = {
  hebrew: ${JSON.stringify(hebrewData, null, 2)},
  greek: ${JSON.stringify(greekData, null, 2)}
};
`;

  fs.writeFileSync(bundlePath, bundleContent, 'utf8');
  console.log(`✔ Bundle offline gerado com sucesso em: ${bundlePath}`);
  console.log(`  - Hebraico: ${hebrewData.length} capítulos`);
  console.log(`  - Grego: ${greekData.length} capítulos`);
} catch (err) {
  console.error('✖ Erro ao gerar bundle de dados:', err.message);
  process.exit(1);
}
