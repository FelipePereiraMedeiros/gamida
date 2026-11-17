# Instruções do Projeto Gamida

## Diretrizes Gerais de Desenvolvimento
- **Iteração Contínua de Versão**: Para cada nova alteração, correção, refatoração ou funcionalidade implementada no sistema, **sempre itere a versão do sistema** (bump semântico) sincronizando:
  - `package.json`
  - `js/boot.js` (`window.APP_VERSION`) e `index.html` (`#footer-version-tag`)
  - `js/modules/state.js` (`APP_VERSION`)
  - `js/app.js` (`APP_VERSION`)
  - `js/data-loader.js` (`DataLoader.VERSION`)
  - Atalho: `node scripts/bump-version.js X.Y.Z` atualiza todos esses arquivos e o teste de integridade de uma vez.
- **Preservação de Integridade**: Execute e valide os testes automatizados antes de finalizar qualquer tarefa: `npm run test:unit` e `npm run test:py` sempre; `npm run e2e` (testes de navegador) quando mexer em telas, jogos ou perfis. O CI (`.github/workflows/testes.yml`) roda tudo a cada envio. Detalhes em `docs/desenvolvimento.md`.
- **Estilos sem internet**: o app não usa CDN. O Tailwind é compilado para `css/tailwind.css`, que é versionado. Ao usar uma classe utilitária nova no `index.html` ou em `js/`, rode `npm run build:css` (uma única vez antes: `npm install`) e inclua `css/tailwind.css` no commit; `node scripts/bump-version.js` já faz essa compilação. O teste "Funcionamento sem Internet" falha se o arquivo estiver desatualizado. Escreva as classes por extenso: nomes montados por concatenação (`"bg-" + cor`) não entram no CSS compilado.
- **Proteção autoral**: o projeto é software proprietário (ver `LICENSE`). Todo arquivo-fonte novo precisa do aviso de direitos autorais no topo: rode `node scripts/license-headers.js`. Não reintroduza licenças de código aberto nem dependências carregadas de servidores externos.
- **Crônicas do Escriba (coautoria)**: o jogo é obra em coautoria de José Henrique Rosseto e Felipe Pereira Medeiros (`LICENSE`, cláusula 1.5; `CREDITOS.md`). Ao acrescentar algo ao jogo, registre a autoria em `CREDITOS.md` e na tela de créditos. `js/modules/scribe-graphics.js` é gerado por `scripts/cronicas/extrair-arte.js`: não edite à mão.
- **Segurança (CSP)**: o `index.html` proíbe JavaScript dentro do HTML. Não use `onclick="..."` (nem `onchange`, `onsubmit`...): use `data-on-click="funcao('arg')"`, lido por `js/modules/actions.js` (aceita só chamada de função com textos, números, `this`, `this.value`, `this.checked` e `event`). Todo texto vindo de dado entra no HTML por `escapeHTML` (`js/modules/html.js`).
