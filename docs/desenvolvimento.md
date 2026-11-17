# Desenvolvimento

## Testes

| Comando | O que roda |
|---|---|
| `npm run test:unit` | Os testes de unidade (`tests/*.test.js`), em Node, sem navegador. |
| `npm run test:py` | Os testes em Python (`tests/test_*.py`): análise de frases, restauração do hebraico, orientação de leitura. |
| `npm run e2e` | Os testes de navegador (`tests/e2e/*.e2e.js`), em Chromium, com um servidor local e sem acesso à internet. |
| `npm run test:all` | Os três, nessa ordem. |

Os testes de navegador precisam do Playwright com o Chromium. Ele não é dependência fixa do projeto, para não pesar em quem só edita conteúdo:

```bash
npm install --no-save playwright@1.63.0
```

```bash
npx playwright install chromium
```

Para rodar só um arquivo, passe parte do nome: `npm run e2e -- cronicas`.

### O que os testes de navegador cobrem

- **Aplicativo:** abre nos dois idiomas, passa por todas as abas, pratica por alternativas e não tem rolagem lateral no celular.
- **Crônicas do Escriba:** um capítulo inteiro no hebraico e no grego (criaturas, guardião, frases, progresso), o mapa de cada livro, o ataque quando o tempo acaba e a caçada completa com a palavra errada voltando no fim.
- **Perfis:** cada perfil com o próprio progresso. A sincronização com o Google desligada por padrão e, no modo de teste, com o Google simulado: subir o perfil, outro aparelho receber e perguntar qual versão manter.
- **Chuva de Pedras:** jogar, pausar, terminar e mandar os erros para a revisão.

Qualquer pedido para fora do servidor local conta como falha: o Gamida não pode depender de servidores externos.

O robô das Crônicas lê o estado da batalha por `window.__scribeBattle`. Esse gancho só existe quando a página é aberta pelos testes (`window.__GAMIDA_TEST__`).

## Integração contínua

`.github/workflows/testes.yml` roda tudo a cada envio e a cada pull request:

- testes de unidade e testes Python;
- conferência do `css/tailwind.css` compilado;
- aviso de direitos autorais em todo arquivo-fonte;
- testes de navegador.

Para impedir que um envio com teste quebrado chegue à `dev` ou à `main`, ligue a proteção de branch no GitHub (*Settings → Branches → Add rule*), exigindo que os checks "Unidade, Python e estilos" e "Testes de navegador" passem.

## Crônicas do Escriba: arte vinda da versão original

`js/modules/scribe-graphics.js` é **gerado** a partir da versão original do jogo, de José Henrique Rosseto (ver `CREDITOS.md`). Não edite esse arquivo à mão.

O código original não fica no repositório. Para atualizar a arte quando houver versão nova:

1. Salve a página da versão original (HTML) em algum lugar fora do repositório.
2. Rode `npm run cronicas:arte -- caminho/da/pagina.html`.
3. Confira as Crônicas no navegador e rode `npm run test:all`.

Para só verificar se o módulo atual bate com uma versão salva: `npm run cronicas:arte -- caminho/da/pagina.html --conferir`.

Estes arquivos partiram da versão original, mas são mantidos à mão e não são gerados:

- **`scribe-map.js`:** o mapa do Livro I veio do original; os mapas do Livro II e do Segundo Rolo são do Gamida.
- **`scribe-fx.js`:** as animações originais, com os golpes do grego acrescentados.

As fichas dos capítulos (`scribe-campaign.js`) e a história (`scribe-lore.js`) também são mantidas à mão.

## Avisos de direitos autorais

`node scripts/license-headers.js` acrescenta o aviso onde faltar. Os arquivos das Crônicas em coautoria recebem o aviso com os dois coautores (lista em `scripts/license-headers.js`).
