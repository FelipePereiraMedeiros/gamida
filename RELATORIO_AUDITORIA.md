# Relatório de Auditoria Técnica - Sistema Gamida
**Data:** 16 de setembro de 2026  
**Sistema:** Gamida - Treinador de Idiomas Bíblicos (Hebraico & Grego)  
**Versão Avaliada:** v2.6.0  
**Escopo:** Qualidade de Código, Arquitetura, Funcionalidades, Segurança, Performance e Testes

---

## 1. Sumário Executivo

O **Gamida** é uma aplicação web voltada ao ensino autônomo e prática de idiomas bíblicos (Hebraico Bíblico e Grego Koiné). O sistema se destaca pela riqueza pedagógica, design visual moderno e quantidade de recursos implementados:
- Estação do Alfabeto Gamificada (Ordem, Impostores, Sofit, Dagesh/Begadkefat);
- Modos de Prática (Digitação, Múltipla Escolha e Tradução de Sentenças);
- Simulados e Avaliação Cumulativa com diagnóstico de desempenho por capítulo;
- Repetição Espaçada (SRS) e Flashcards estilo Anki;
- Modo Morte Súbita (Sobrevivência) com histórico de recorde;
- Laboratório Estrutural de Paradigmas Gramaticais e Mapas de Preposições;
- Dicionário de vocabulário com filtro em tempo real;
- Sistema de apoio financeiro via PIX ("Pague-me um café!").

### Veredito Geral
O projeto encontra-se em estágio de **MVP avançado / Protótipo funcional robusto**, porém acumula débitos técnicos estruturais críticos. Os maiores riscos identificados concentram-se na falta de modularidade do código, fragilidades no restauro de backups, potenciais brechas de segurança (XSS), anti-patterns estatísticos em algoritmos de sorteio e uma suíte de testes desconectada do código real de produção.

---

## 2. Arquitetura e Organização do Sistema

### 2.1. Concentração em Arquivo Único (Monólito de Scripts)
- **Arquivo:** `js/app.js` (3.190 linhas, ~124 KB)
- **Problema:** Toda a aplicação (lógica de estado, regras de jogos, renderização de DOM, timers, manipuladores de eventos e persistência) está reunida em um único arquivo de mais de 3.000 linhas.
- **Impacto:**
  - Manutenção complexa e risco elevado de regressão a cada nova funcionalidade;
  - Ausência de divisão por responsabilidades (SRP - Single Responsibility Principle);
  - Dificuldade para rastrear fluxo de execução e dependências.

### 2.2. Poluição do Escopo Global e Fragmentação do Estado
- Mais de 20 variáveis de estado mutáveis soltas no escopo global (`window`):
  - `let practiceQueue = []`
  - `let assessQuestions = []`, `let assessIndex = 0`, `let assessAnswersMap = {}`
  - `let ankiQueue = []`, `let ankiCurrentCard = null`, `let ankiStats = {}`
  - `let survLives = 3`, `let survStreak = 0`, `let survQueue = []`
  - `let activeParadigm = null`, `let draggedElement = null`, `let selectedChip = null`
  - `const SimConfig = { ... }`
- **Impacto:** Concorrência entre dados contidos no objeto `AppState` e variáveis globais soltas. Resets manuais precisam lembrar de limpar cada variável individualmente (ex.: no `changeGlobalChapter`), aumentando chances de vazamento de estado entre capítulos.

### 2.3. Duplicação de Código entre Módulos
Funções idênticas foram implementadas separadamente em `js/data-loader.js` e `js/app.js`:
- `getTerm(item)`: implementada em `data-loader.js:18` e `app.js:31`;
- `isValidChapter(chapter)`: implementada em `data-loader.js:28` e `app.js:85`;
- `hasUniqueChapterIds(chapters)`: implementada em `data-loader.js:54` e `app.js:109`.

### 2.4. Acoplamento Excessivo de Eventos Inline no HTML
- O arquivo `index.html` possui mais de **50 manipuladores inline** (`onclick="..."`, `onsubmit="..."`, `oninput="..."`).
- Essa abordagem inviabiliza políticas restritivas de Content Security Policy (CSP sem `'unsafe-inline'`) e impede o isolamento modular do JavaScript.

---

## 3. Qualidade de Código e Bugs Identificados

### 3.1. [CRÍTICO] Exceção por falta de sanitização em `evaluateAnswer`
- **Localização:** `js/app.js:348`
```javascript
function evaluateAnswer(userAnswer, acceptedList) {
  // 1. Limpa qualquer parênteses da resposta do usuário também (por segurança)
  const cleanUser = userAnswer.replace(/\(.*?\)/g, "");
```
- **Diagnóstico:** Se `userAnswer` for `null` ou `undefined`, a aplicação sofre um erro em tempo de execução: `TypeError: Cannot read properties of undefined (reading 'replace')`.
- **Inconsistência:** O teste correspondente (`tests/02-evaluation-engine.test.js:45`) tratou isso como `(userAnswer || "").replace(...)`, mas o código em produção permaneceu desprotegido.

### 3.2. [CRÍTICO] Descarte de Dados na Restauração de Backup JSON
- **Localização:** `js/app.js:819`
```javascript
function saveChapterFromJSON() {
  ...
  const parsed = JSON.parse(jsonText);
  const newChap = Array.isArray(parsed) ? parsed[0] : parsed;
```
- **Diagnóstico:** A função `exportChaptersJSON()` gera um arquivo com o array completo de capítulos (`AppState.chapters`). Quando o usuário tenta restaurar seu backup colando o JSON no editor e clicando em "Salvar Capítulo", a função extrai apenas o primeiro item (`parsed[0]`), **descartando silenciosamente todos os outros capítulos do backup**.

### 3.3. [ALERTA] Anti-pattern de Sorteio com `.sort(() => 0.5 - Math.random())`
- **Localização:** `js/app.js:1098, 1104, 1110, 1124, 1457, 1458, 1616, 1650`
- **Diagnóstico:** O método `.sort(() => 0.5 - Math.random())` é matematicamente enviesado, não garante probabilidade uniforme e viola a transitividade exigida pelos motores JavaScript modernos.
- **Incoerência:** O projeto já contém a implementação correta de Fisher-Yates na função `shuffleArray(arr)` (`js/app.js:426`), mas não a utiliza nos simulados, flashcards e modo sobrevivência.

### 3.4. Dessincronização de Estado na Troca de Idioma (`toggleLanguage`)
- **Localização:** `js/app.js:694`
```javascript
async function toggleLanguage() {
  AppState.language = AppState.language === "hebrew" ? "greek" : "hebrew";
  updateParadigmsVisibility(); // Disparado aqui!
  ...
  await loadChapters();
```
- **Diagnóstico:** A visibilidade da aba de paradigmas é recalculada antes de os novos capítulos serem carregados pela Promise `loadChapters()`.

### 3.5. Validação Permissiva em Capítulos Vazios
- **Localização:** `js/data-loader.js:32-34` e `js/app.js:90-94`
- Em `isValidChapter`, coleções vazias `items: []` e `sentences: []` são validadas com `collections.flat().every(...)`, que retorna `true` para arrays vazios. Um capítulo sem vocabulário é aceito e causa divisões por zero ou loops infinitos durante a prática.

---

## 4. Segurança e Vulnerabilidades

### 4.1. [VULNERABILIDADE] Injeção de Código HTML/DOM-based XSS
- **Localização:** `js/app.js:1405` (Relatório do Simulado) e `js/app.js:880-889` (Dicionário)
```javascript
// Linha 1405:
box.innerHTML = `
  ...
  <span class="text-slate-500 block text-[10px] uppercase font-semibold">Sua Resposta:</span>
  <span class="${userTextCol} font-medium">${ans.userAnswer}</span>
`;
```
- **Vulnerabilidade:** A variável `ans.userAnswer` (digitada pelo usuário) é concatenada diretamente em `innerHTML` sem sanitização ou escape de entidades HTML (`<`, `>`, `&`, `"`). Se um usuário digitar `<img src=x onerror=...>`, o script será executado no contexto da página.
- O mesmo padrão ocorre na renderização do vocabulário se um capítulo JSON malicioso for importado.

---

## 5. Performance e Recursos de Rede

### 5.1. Requisição Quebrada (HTTP 400 Bad Request) na Fonte SBL Hebrew
- **Localização:** `index.html:21`
```html
<link href="https://fonts.googleapis.com/css2?family=SBL+Hebrew&display=swap" rel="stylesheet" />
```
- **Diagnóstico:** A fonte **SBL Hebrew** é distribuída exclusivamente pela Society of Biblical Literature e **não está disponível no Google Fonts**. Essa requisição falha com `HTTP 400 Bad Request` a cada carregamento de página.
- **Desperdício de Tráfego:** A fonte oficial **Noto Sans Hebrew** já é baixada na linha 17, mas **não foi incluída** na declaração CSS de `.hebrew-text` em `css/styles.css:27`, resultando na queda para fontes serifadas genéricas descalibradas do sistema operacional.

### 5.2. Dependência do Tailwind Play CDN em Produção
- **Localização:** `index.html:12` (`https://cdn.tailwindcss.com`)
- O Play CDN do Tailwind é indicado oficialmente apenas para testes rápidos e desenvolvimento. Em produção:
  - Processa e compila estilos no cliente via JS a cada reload;
  - Aumenta o tempo de renderização (FOUC);
  - Quebra o suporte a uso offline em ambientes locais sem internet.

---

## 6. Engenharia de Testes e Garantia de Qualidade (QA)

### 6.1. Fragilidade da Suíte de Testes (Node.js)
Ao analisar os testes automatizados da pasta `tests/`:
1. **Testes de String ("Smoke tests sintéticos"):** Em arquivos como `03-practice-engine.test.js`, `07-paradigms-engine.test.js` e `10-mobile-carousel.test.js`, os testes usam `assert.includes(appJs, 'function ...')`. Eles checam a presença textual da declaração, mas não testam a execução real da função.
2. **Divergência Crítica de Regra de Negócio (SRS/Anki):**
   - No teste `tests/04-srs-anki.test.js:16`, a função mock `processAnkiGrade` define que a avaliação `"hard"` agenda o cartão para **1 dia depois**.
   - No código real de produção (`js/app.js:1540`), `"hard"` agenda a revisão para **60 segundos depois** (`Date.now() + 60 * 1000`). O teste passa validando uma regra diferente da real.
3. **Testes Tautológicos:** Em `tests/06-survival-engine.test.js:12-29`, o teste instancia variáveis locais isoladas (`let survLives = 3`) e faz operações aritméticas básicas, sem testar o motor do jogo.

### 6.2. Ausência de Ambiente de Testes Integrado
- O repositório não conta com `package.json`, inviabilizando a execução de comandos padronizados como `npm test` ou `npm run lint`.

---

## 7. Acessibilidade (a11y) e Usabilidade

1. **Campos sem rótulo acessível:**
   - `#input-answer` não possui `<label>` ou `aria-label`.
   - `#input-sentence` possui label visual, porém desprovido do atributo `for="input-sentence"`.
2. **Direção do Texto e BiDi (Bidirecional):**
   - O elemento raiz ou contêiner de entrada não altera o atributo `dir="rtl"` dinamicamente ao trocar para o hebraico, gerando saltos incorretos de sinais de pontuação.
3. **Diálogos Nativos Bloqueantes:**
   - Chamadas nativas a `alert()` e `confirm()` bloqueiam a thread principal do navegador e quebram a imersão visual do design dark.

---

## 8. Plano de Ação e Recomendações Priorizadas

### Fase 1: Correções Imediatas (Segurança e Estabilidade)
- [ ] **Sanitização de XSS:** Implementar função `escapeHTML` para campos interpolados em `innerHTML` ou utilizar `textContent` para entradas do usuário.
- [ ] **Correção do `evaluateAnswer`:** Adicionar fallback para entradas nulas/indefinidas: `(userAnswer || "").replace(/\(.*?\)/g, "")`.
- [ ] **Correção das Fontes:** Remover a URL inexistente do Google Fonts e adicionar `"Noto Sans Hebrew"` como fallback prioritário em `css/styles.css`.
- [ ] **Ajuste na Importação de Backup:** Permitir que `saveChapterFromJSON()` receba e salve um array com múltiplos capítulos.
- [ ] **Unificação de Shuffling:** Substituir `.sort(() => 0.5 - Math.random())` pela função `shuffleArray()`.

### Fase 2: Modernização Arquitetural
- [ ] **Inicialização do Projeto Node:** Criar `package.json` com scripts de desenvolvimento e testes.
- [ ] **Modularização do Código:** Decompor `js/app.js` em módulos ES (`src/core/`, `src/engines/`, `src/ui/`).
- [ ] **Tailwind Compilado:** Substituir o CDN do Tailwind por build estático gerado via CLI ou Vite, viabilizando funcionamento 100% offline.

### Fase 3: Reformulação dos Testes
- [ ] **Testes Funcionais Reais:** Atualizar a suíte de testes para importar diretamente os módulos e funções puras de produção.
- [ ] **Alinhamento do SRS:** Sincronizar as regras do teste com a lógica real de repetição espaçada.
