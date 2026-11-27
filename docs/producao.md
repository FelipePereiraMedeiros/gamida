# Produção: Cloudflare, login com Google e repositório privado

Roteiro para tirar o Gamida do GitHub Pages, publicar no Cloudflare, ligar o perfil no Google Drive do aluno e fechar o repositório. A ordem importa: o site novo e o login entram no ar **antes** de o repositório ficar privado, e os alunos levam o progresso do endereço antigo para o novo.

## O que o repositório já traz

| Peça | Onde |
|---|---|
| Montagem do que vai ao ar (`dist/`, só arquivos do aplicativo) | `npm run build` → `scripts/build-dist.js` |
| Cabeçalhos de segurança e de cache do Cloudflare | `_headers` (copiado para `dist/`) |
| Política de privacidade (o Google exige) | `privacidade.html`, ligada no rodapé e no cartão da nuvem |
| Login com Google e cópia do perfil no Drive do aluno | `js/modules/cloud-sync.js`, `oauth-callback.html` (detalhes em `docs/login-google.md`) |
| Aplicativo instalável e sem internet | `manifest.webmanifest`, `sw.js`, `js/modules/pwa.js` |
| Aviso de endereço novo no endereço antigo | `js/modules/new-home.js` (desligado até `NEW_HOME_URL` ser preenchido) |

O teste `tests/27-producao.test.js` confere essas peças a cada envio.

## Fase 1: site no Cloudflare (feito em 27/11/2026)

O projeto foi criado como **Worker com arquivos estáticos** (o painel atual do Cloudflare cria Workers no lugar de Pages). Endereço: `https://gamida.gasperfpm.workers.dev`.

Configuração do Worker:

- **Settings → Build:**
  - Production branch: `dev`;
  - Build command: `npm run build`;
  - Deploy command: `npx wrangler deploy`;
  - Root directory: `/`;
  - API token: o criado pelo próprio painel ("Create new token").
- **Variável de montagem:** `NODE_VERSION` = `22`.

O que vai ao ar e como é servido fica no repositório:

- `wrangler.jsonc`:
  - publica `dist/`;
  - `html_handling: "none"` serve `index.html` e `oauth-callback.html` pelo nome exato, sem o redirecionamento 307 para o endereço sem `.html`. O service worker recusa resposta redirecionada, e o retorno do login precisa ser o endereço registrado no Google;
  - `not_found_handling: "none"` responde 404 ao que não existe.
- `_redirects`: `/ /index.html 200` faz a raiz abrir o aplicativo sem redirecionar.
- `_headers`: cabeçalhos de segurança e de cache.

Cada envio para a `dev` publica sozinho em um ou dois minutos.

**Domínio próprio (recomendado):** um domínio seu, como `gamida.com.br`, facilita a verificação do Google e não muda nunca. Ligue-o em **Domains** no Worker.

## Fase 2: login com Google

1. Em console.cloud.google.com, crie o projeto "Gamida".
2. Em **APIs e serviços → Biblioteca**, ative a **Google Drive API**.
3. Em **Google Auth Platform**:
   - **Branding:**
     - nome "Gamida";
     - e-mail de suporte;
     - logotipo `icons/icon-512.png`;
     - página inicial `https://gamida.gasperfpm.workers.dev/`;
     - política de privacidade `https://gamida.gasperfpm.workers.dev/privacidade.html`;
     - termos de uso `https://gamida.gasperfpm.workers.dev/termos.html`;
     - domínio autorizado: o seu domínio, ou `gamida.pages.dev`.
   - **Audience:** External. Enquanto estiver em *Testing*, só entram as contas de **Test users**.
   - **Data access:** os escopos `openid`, `email`, `profile` e `.../auth/drive.appdata`.
   - **Clients → Create client → Web application**, com:
     - **Authorized JavaScript origins:**
       - `https://gamida.gasperfpm.workers.dev`;
       - `https://felipepereiramedeiros.github.io`, enquanto o endereço antigo existir.
     - **Authorized redirect URIs:**
       - `https://gamida.gasperfpm.workers.dev/oauth-callback.html`;
       - `https://felipepereiramedeiros.github.io/gamida/oauth-callback.html`.
4. Copie o **ID do cliente**, que termina em `.apps.googleusercontent.com`. Ele vai em `GOOGLE_CLIENT_ID`, no início de `js/modules/cloud-sync.js`, e não é segredo. O **client secret** não é usado: não o coloque no repositório nem o envie a ninguém.
5. Preencha o e-mail de contato em `privacidade.html` e `termos.html` (marcador `{{CONTATO}}`).
6. Teste num navegador de computador, com o console aberto:

   ```js
   localStorage.setItem("gamida_google_preview", "1")
   ```

   Depois, faça o login na aba Perfil. A conta precisa estar em Test users.
7. **Publique o app** em Audience → *Publish app*. O Google confere a marca: nome, logotipo, página inicial, política e domínio. Para isso, o domínio precisa estar verificado no Google Search Console. Depois de aprovado, mude `CLOUD_SYNC_ENABLED` para `true` e publique.

Não ligue `CLOUD_SYNC_ENABLED` antes da publicação: em *Testing*, quem não está na lista de Test users vê "acesso bloqueado".

## Fase 3: levar os alunos para o endereço novo

O progresso fica guardado no navegador, preso ao endereço do site. No endereço novo, o aluno começa vazio até trazer o perfil.

1. Com o login publicado (fase 2), preencha `NEW_HOME_URL` em `js/modules/new-home.js` com o endereço novo e publique. Os dois endereços recebem a versão, porque ainda saem da mesma branch.
2. No endereço antigo, o aluno vê o aviso e escolhe um caminho:
   - entrar com Google na aba Perfil, abrir o endereço novo e entrar com a mesma conta;
   - ou baixar o arquivo de perfil no endereço antigo e carregá-lo no novo.
3. Deixe os dois endereços no ar por duas ou três semanas.

## Fase 4: repositório privado

1. Confirme que o Cloudflare publica a cada envio e que a migração terminou.
2. No GitHub, vá em **Settings → Pages** e desligue o GitHub Pages.
3. Vá em **Settings → General → Danger Zone → Change visibility → Private**.
4. Depois disso:
   - **Cloudflare:** continua publicando, porque o aplicativo dele tem acesso ao repositório.
   - **GitHub Actions:** num repositório privado do plano Free, há uma cota mensal de minutos; os testes do Gamida cabem nela com folga.
   - **Proteção de branch:** em repositório privado no plano Free, ela não existe. Os testes continuam rodando a cada envio, mas não bloqueiam.
   - **LICENSE e README:** apontam o repositório como contato. Para quem não tem acesso, troque pelo e-mail de suporte.

## Instalar o aplicativo

- **Android (Chrome):** menu ⋮ → *Instalar aplicativo*.
- **iPhone/iPad (Safari):** Compartilhar → *Adicionar à Tela de Início*.
- **Computador (Chrome ou Edge):** ícone de instalar na barra de endereço.

Instalado, o Gamida abre em janela própria e funciona sem internet. O login com Google, no aplicativo instalado, acontece na própria tela e volta sozinho.

## Conta do aluno

A conta do aluno é a conta Google dele. O perfil, com o progresso e as configurações, fica num arquivo na pasta oculta de dados de aplicativo do Google Drive do próprio aluno. Não há servidor nem banco de dados do Gamida: não há senhas para guardar, e o Gamida não enxerga nada além desse arquivo. A sessão do Google dura cerca de uma hora. Depois disso, o progresso segue salvo no aparelho e o botão **Reconectar** retoma a sincronização com um toque.
