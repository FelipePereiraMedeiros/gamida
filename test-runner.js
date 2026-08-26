/**
 * ==========================================================================
 * Gamida - Master Test Runner
 * Orquestrador Principal da Suíte de Testes Automatizados
 * Executa todos os módulos ou módulos individuais
 * ==========================================================================
 */

const path = require('path');
const { colors } = require('./tests/test-utils');

// Carregar todos os módulos de teste
const modules = [
  { id: 1, name: 'Camada de Dados & Capítulos', file: './tests/01-data-layer.test.js' },
  { id: 2, name: 'Motor de Avaliação Linguística', file: './tests/02-evaluation-engine.test.js' },
  { id: 3, name: 'Motor de Prática & Modos', file: './tests/03-practice-engine.test.js' },
  { id: 4, name: 'Sistema SRS & Anki Flashcards', file: './tests/04-srs-anki.test.js' },
  { id: 5, name: 'Avaliação Cumulativa & Simulados', file: './tests/05-assessment-engine.test.js' },
  { id: 6, name: 'Modo Sobrevivência (Morte Súbita)', file: './tests/06-survival-engine.test.js' },
  { id: 7, name: 'Paradigmas & Esquemas Gramaticais', file: './tests/07-paradigms-engine.test.js' },
  { id: 8, name: 'Dicionário & Busca em Tempo Real', file: './tests/08-vocab-dictionary.test.js' },
  { id: 9, name: 'Troca de Idioma & UI', file: './tests/09-language-switch.test.js' },
  { id: 10, name: 'Menu Mobile & Carrossel de Abas', file: './tests/10-mobile-carousel.test.js' },
  { id: 11, name: 'Apoio ("Pague-me um café!" & PIX)', file: './tests/11-coffee-pix.test.js' },
];

async function run() {
  const args = process.argv.slice(2);
  const targetArg = args[0];

  let selectedModules = modules;

  if (targetArg && targetArg !== 'all') {
    const modId = parseInt(targetArg, 10);
    if (!isNaN(modId)) {
      selectedModules = modules.filter(m => m.id === modId);
    } else {
      selectedModules = modules.filter(m => 
        m.name.toLowerCase().includes(targetArg.toLowerCase()) || 
        m.file.toLowerCase().includes(targetArg.toLowerCase())
      );
    }

    if (selectedModules.length === 0) {
      console.log(`${colors.red}Nenhum módulo encontrado para o filtro: "${targetArg}"${colors.reset}`);
      console.log(`Módulos disponíveis:`);
      modules.forEach(m => console.log(`  [${m.id}] ${m.name}`));
      process.exit(1);
    }
  }

  console.log(`\n${colors.bright}${colors.cyan}==================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Gamida - Suíte Geral de Testes Automatizados (Módulo a Módulo)  ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}==================================================================${colors.reset}`);

  let totalTestsCount = 0;
  let totalPassedCount = 0;
  let totalFailedCount = 0;
  const suiteSummaries = [];

  for (const m of selectedModules) {
    const suite = require(m.file);
    const summary = await suite.run();
    suiteSummaries.push(summary);
    totalTestsCount += summary.total;
    totalPassedCount += summary.passed;
    totalFailedCount += summary.failed;
  }

  console.log(`\n${colors.bright}${colors.cyan}==================================================================${colors.reset}`);
  console.log(`${colors.bright}Resumo Geral da Execução:${colors.reset}`);
  console.log(`Módulos Executados: ${colors.bright}${selectedModules.length} de ${modules.length}${colors.reset}`);
  console.log(`Total de Casos:     ${colors.bright}${totalTestsCount}${colors.reset}`);
  console.log(`Passaram:           ${colors.green}${totalPassedCount}${colors.reset}`);
  console.log(`Falharam:           ${totalFailedCount > 0 ? colors.red : colors.gray}${totalFailedCount}${colors.reset}`);

  const passRate = totalTestsCount > 0 ? ((totalPassedCount / totalTestsCount) * 100).toFixed(1) : '100.0';
  console.log(`Taxa de Sucesso:    ${passRate === '100.0' ? colors.green : colors.yellow}${passRate}%${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}==================================================================${colors.reset}\n`);

  if (totalFailedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
