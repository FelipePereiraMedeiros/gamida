# Instruções do Projeto Gamida

## Diretrizes Gerais de Desenvolvimento
- **Iteração Contínua de Versão**: Para cada nova alteração, correção, refatoração ou funcionalidade implementada no sistema, **sempre itere a versão do sistema** (bump semântico) sincronizando:
  - `package.json`
  - `index.html` (`window.APP_VERSION` e `#footer-version-tag`)
  - `js/modules/state.js` (`APP_VERSION`)
  - `js/app.js` (`APP_VERSION`)
  - `js/data-loader.js` (`DataLoader.VERSION`)
- **Preservação de Integridade**: Execute e valide os testes automatizados existentes (`tests/`) antes de finalizar qualquer tarefa.

