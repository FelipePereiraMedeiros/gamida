# Diretriz de Versionamento Contínuo

Sempre que qualquer alteração, correção, refatoração ou nova funcionalidade for implementada no sistema:
1. **Iterar a Versão do Sistema**: Incrementar a versão semântica (patch/minor) em todos os pontos canônicos do projeto:
   - `package.json` (`version`)
   - `index.html` (`window.APP_VERSION` e `#footer-version-tag`)
   - `js/modules/state.js` (`APP_VERSION`)
   - `js/app.js` (`APP_VERSION`)
   - `js/data-loader.js` (`DataLoader.VERSION`)
2. Manter a paridade exata de versão entre todos os arquivos para garantir sincronização de cache de dados e IndexedDB.

