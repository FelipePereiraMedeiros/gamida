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
- **Uso sem internet:** depois da primeira visita o app abre e funciona sem conexão nos dois idiomas (fontes incluídas); aberto direto do disco (file://), usa o pacote de dados; num servidor normal, o pacote de 1,5 MB não é baixado.
- **Hoje e progresso unificado:** o painel leva ao Caminho do domínio e, com palavras vencidas, à revisão; pode ser ocultado no dia. Acerto digitado nas Crônicas soma ao domínio da palavra.
- **Segurança:** todas as ações da página apontam para funções existentes e funcionam com a CSP ligada. Um capítulo importado com HTML malicioso em todo texto passa por todas as telas (prática, correção, análise da frase, dicionário, tabelas, simulado, trilha, morfologia, Chuva de Pedras, Crônicas, perfil) sem injetar nada. O perfil percebe mudanças sem interceptar o armazenamento, e uma segunda aba aberta é avisada.

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

## Segurança

- **Política de segurança de conteúdo (CSP)** no `index.html`: só roda script do próprio site (`script-src 'self'`), sem `eval` e sem JavaScript dentro do HTML. O Google só entra em `connect-src`, para a sincronização do perfil (desligada até ser ativada). A página `oauth-callback.html` tem uma CSP ainda mais fechada.
- **Ações sem JavaScript no HTML:** em vez de `onclick="f('x')"`, use `data-on-click="f('x')"` (também `data-on-change`, `data-on-input`, `data-on-submit`, `data-on-keydown` e `data-on-scroll`). Quem lê esses atributos é `js/modules/actions.js`. Ele não executa o texto como código: aceita só uma chamada de função, com textos, números, `true`/`false`/`null`, `this`, `this.value`, `this.checked` ou `event`. Um elemento com `role="button"` e `data-on-click` também responde a Enter e Espaço.
- **Escape único:** todo texto vindo de dado entra no HTML por `escapeHTML` (`js/modules/html.js`). As outras cópias foram removidas, e o teste de segurança acusa se alguma voltar.
- **Script inicial** (idioma antes da primeira pintura e `APP_VERSION`): `js/boot.js`.
- **Perfis:** as mudanças são percebidas comparando as chaves do perfil a cada 1,5 s, sem mexer em `Storage.prototype`. Com o Gamida aberto em duas abas, aparece um aviso; se a outra aba gravar progresso, o aviso oferece recarregar.

## Aplicativo instalável e sem internet

- **`manifest.webmanifest`:** nome, cores e ícones. Os ícones (`icons/`) são gerados por `node scripts/build-icons.js`, que precisa do Playwright.
- **`sw.js`:** o service worker. Na primeira visita ele guarda no aparelho a página, os estilos, os scripts, as fontes, os ícones e os dados dos capítulos (cerca de 70 arquivos); depois disso, tudo é servido do aparelho. Cada versão do Gamida tem o próprio cache. Quando uma versão nova termina de baixar, o app mostra "Versão nova do Gamida pronta" com o botão Atualizar.
- **A lista de arquivos e a versão do cache** são geradas por `node scripts/build-sw.js`, que o `bump-version.js` já roda. O teste "Funcionamento sem Internet" acusa se o `sw.js` ficar desatualizado.
- **`js/modules/pwa.js`:** registra o service worker e mostra o aviso de atualização.
- **Pacote de dados:** `data/data-bundle.js` só é carregado quando o app é aberto direto do disco, onde a busca dos arquivos JSON falha.
- **Quadros por segundo:** as telas animadas das Crônicas desenham no máximo 30 quadros por segundo (10 com "reduzir movimento"), para poupar a bateria do celular.
- **Lembrete de cópia:** com progresso e mais de 14 dias sem cópia (arquivo baixado ou nuvem), o app lembra de baixar o arquivo de perfil. O aluno pode adiar por 7 dias.

## Painel "Hoje" e progresso unificado

- **`js/modules/today.js`:** no topo da aba Praticar, um único próximo passo. A ordem é: revisar as palavras vencidas (ou, sem vencidas, as erradas), o próximo capítulo liberado do Caminho do domínio e o próximo capítulo das Crônicas. Os outros passos ficam em "Depois", junto com a meta do dia e os dias seguidos. "Ocultar hoje" esconde o painel até o dia seguinte. Ele é redesenhado ao abrir o app, ao voltar à aba Praticar e ao voltar à janela.
- **Domínio:** continua sendo 3 acertos seguidos escrevendo a resposta. Agora o acerto digitado nos jogos (Chuva de Pedras e Crônicas, com "Resposta: digitar") também conta. Acerto por alternativa não conta, como na prática. Erro em qualquer modo manda a palavra para a lista de erros.
- **Selo da caçada completa:** aparece no Caminho do domínio ("★ caçada completa nas Crônicas").

## Navegação (onde fica cada coisa)

| Item | Seção | O que tem |
|---|---|---|
| **Estudar** | `#tab-practice` | Painel "Hoje" e a prática (digitação, escolha, frases, favoritas, erros; alfabeto na Lição I) |
| **Revisar** | `#tab-assessment`, lado `review` | Revisão (Revisão Inteligente, Caminho do domínio, Mago da Morfologia) e Prova (Simulado) |
| **Jogar** | `#tab-assessment`, lado `play` | Chuva de Pedras, Morte Súbita e Crônicas do Escriba |
| **Consultar** | `#tab-vocab` e `#tab-paradigms` | Dicionário e Tabelas e grafos, com a chave `#consult-switch` entre os dois (Tabelas fica apagado em capítulo sem tabelas) |
| **Perfil** | `#tab-profile` e `#tab-manage` | Perfil, meta de estudo, perfis do aparelho, arquivo de perfil e "Gerenciar conteúdo" (editor de capítulos e backup, para quem precisa) |

- **Revisar e Jogar** são os dois lados do mesmo painel: `switchTab("review")` e `switchTab("play")` mostram os grupos com o `data-hub` correspondente. `switchTab("assessment")` vale como Revisar.
- **Critério para pôr algo novo:** pense no que o aluno quer fazer naquela hora (estudar, revisar, jogar, consultar). Ferramenta de bastidor fica no Perfil, fora da navegação principal.
- **Celular:** a entrada de capítulo das Crônicas mostra os botões logo depois da história, com o pergaminho recolhido. No Perfil, os quadros de números e de configurações começam recolhidos.
- **Leitores de tela:**
  - a arena das Crônicas descreve em texto quem luta contra quem, com a vida de cada um;
  - a Chuva de Pedras anuncia a pedra em foco (`#sr-target-text`);
  - os ícones decorativos têm `aria-hidden`.

## Organização do código

O app não usa módulos ES: cada arquivo é um `<script>` comum, na ordem do `index.html`.

- **`js/app.js`:** estado, início, navegação (`switchTab`), utilidades, SRS, troca de idioma, alfabeto e o menu do celular.
- **`js/screens/`:** uma tela por arquivo, carregados antes do `app.js`. As funções e variáveis são globais e conversam com as do `app.js`:
  - `practice.js`: Estudar (o motor da prática e o atalho de Enter);
  - `review.js`: Revisar e Jogar (simulado, flashcards, Morte Súbita);
  - `consult.js`: Consultar (dicionário e tabelas);
  - `manage.js`: Gerenciar conteúdo (restaurar, importar, exportar, editor de capítulos).
- **Crônicas do Escriba:**
  - `scribe-rules.js`: as regras sem tela (capítulos, ondas, dano, nível, perguntas do guardião, progresso salvo); é o que os testes de unidade exercitam;
  - `scribe-chronicles.js`: o motor e as telas;
  - `scribe-common.js`: o que os módulos de desenho repetiam (reduzir movimento, `rnd`, `esc`).

Os testes que conferem o código-fonte leem o `app.js` junto com `js/screens/` (`tests/test-utils.js`). Arquivo novo em `js/` entra sozinho na lista do service worker ao rodar `node scripts/build-sw.js`.
