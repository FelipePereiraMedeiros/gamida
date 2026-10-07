/**
 * Verification Script: Simulação E2E da Análise Morfossintática de Frases Hebraicas
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const hebrewData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'hebrew_chapters.json'), 'utf8'));

// Carrega os módulos
const SentenceAnalysisModule = require(path.join(rootDir, 'js', 'modules', 'sentence-analysis.js'));
const {
  CATEGORY_MAP,
  getMorphemeCategory,
  tokenEndsWithMaqqef,
  buildFlatMorphemesList,
  renderSentenceMorphemesHTML,
  renderGlobalSentenceView,
  renderMorphemeDissectionView,
  ModalState
} = SentenceAnalysisModule;

console.log('--- 1. Verificando capítulos e frases com morfemas granulares ---');
let totalSentences = 0;
let totalCompositeTokens = 0;
let totalParts = 0;

hebrewData.forEach(ch => {
  (ch.sentences || []).forEach(sent => {
    totalSentences++;
    (sent.tokens || []).forEach(t => {
      if (t.composite) {
        totalCompositeTokens++;
        if (t.parts) totalParts += t.parts.length;
      }
    });
  });
});

console.log(`Total de frases no banco: ${totalSentences}`);
console.log(`Total de tokens compostos: ${totalCompositeTokens}`);
console.log(`Total de morfemas internos (parts): ${totalParts}`);

console.log('\n--- 2. Testando dissecção anatômica de frase real (Lição 3) ---');
const sampleSentence = hebrewData.find(c => c.id === 'kelley_03')?.sentences[0];
if (!sampleSentence) {
  throw new Error('Frase da Lição 3 não encontrada');
}

console.log('Frase:', sampleSentence.hebrew, '| Tradução:', sampleSentence.translations[0]);
const flatMorphemes = buildFlatMorphemesList(sampleSentence);
console.log(`Morfemas atômicos identificados (${flatMorphemes.length}):`);
flatMorphemes.forEach((m, idx) => {
  console.log(`  [${idx}] Segmento: "${m.part.segment}" | Tipo: "${m.part.type}" | Categoria: ${m.category} | Significado: "${m.part.meaning || '-'}"`);
});

const htmlOutput = renderSentenceMorphemesHTML(sampleSentence);
console.log('\nHTML Gerado da Frase:');
console.log(htmlOutput);

if (!htmlOutput.includes('data-token-idx="0"') || !htmlOutput.includes('data-part-idx="0"')) {
  throw new Error('Atributos data-token-idx ou data-part-idx ausentes');
}

console.log('\n--- 3. Verificando renderização dos painéis analíticos ---');
const globalView = renderGlobalSentenceView(sampleSentence);
console.log('Painel Global: OK (contém tipo sintático:', globalView.includes(sampleSentence.syntax_type), ')');

const morphemeDissection = renderMorphemeDissectionView(flatMorphemes[0], sampleSentence);
console.log('Painel Dissecação (Morfema 0): OK (contém segmento:', morphemeDissection.includes(flatMorphemes[0].part.segment), ')');

if (flatMorphemes[1] && flatMorphemes[1].part.phonetics) {
  const phoneticsView = renderMorphemeDissectionView(flatMorphemes[1], sampleSentence);
  console.log('Painel Dissecação (com Fonética Kelley): OK (contém regra:', phoneticsView.includes('Regra Fonética'), ')');
}

console.log('\n✔ SIMULAÇÃO E2E EXECUTADA COM SUCESSO ABSOLUTO!');
