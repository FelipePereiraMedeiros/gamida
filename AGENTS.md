# Instruções do Projeto Gamida

## Diretrizes Gerais de Desenvolvimento
- **Iteração Contínua de Versão**: Para cada nova alteração, correção, refatoração ou funcionalidade implementada no sistema, **sempre itere a versão do sistema** (bump semântico) sincronizando:
  - `package.json`
  - `index.html` (`window.APP_VERSION` e `#footer-version-tag`)
  - `js/modules/state.js` (`APP_VERSION`)
  - `js/app.js` (`APP_VERSION`)
  - `js/data-loader.js` (`DataLoader.VERSION`)
  - Atalho: `node scripts/bump-version.js X.Y.Z` atualiza todos esses arquivos e o teste de integridade de uma vez.
- **Preservação de Integridade**: Execute e valide os testes automatizados existentes (`tests/`) antes de finalizar qualquer tarefa.
- **Estilos sem internet**: o app não usa CDN. O Tailwind é compilado para `css/tailwind.css`, que é versionado. Ao usar uma classe utilitária nova no `index.html` ou em `js/`, rode `npm run build:css` (uma única vez antes: `npm install`) e inclua `css/tailwind.css` no commit; `node scripts/bump-version.js` já faz essa compilação. O teste "Funcionamento sem Internet" falha se o arquivo estiver desatualizado. Escreva as classes por extenso: nomes montados por concatenação (`"bg-" + cor`) não entram no CSS compilado.
- **Proteção autoral**: o projeto é software proprietário (ver `LICENSE`). Todo arquivo-fonte novo precisa do aviso de direitos autorais no topo: rode `node scripts/license-headers.js`. Não reintroduza licenças de código aberto nem dependências carregadas de servidores externos.
