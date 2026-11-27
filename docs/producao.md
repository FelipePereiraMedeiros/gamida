# Produção: Cloudflare Pages, login com Google e repositório privado

Roteiro para tirar o Gamida do GitHub Pages, publicar no Cloudflare Pages, ligar o perfil no Google Drive do aluno e fechar o repositório. A ordem importa: o site novo e o login entram no ar **antes** de o repositório ficar privado, e os alunos levam o progresso do endereço antigo para o novo.

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

## Fase 1: site no Cloudflare Pages

1. Crie uma conta gratuita em dash.cloudflare.com.
2. Vá em **Workers & Pages → Create → Pages → Connect to Git**. Autorize o aplicativo do Cloudflare no GitHub **só para o repositório `gamida`**.
3. Configure a montagem:
   - **Production branch:** `dev` (a mesma de hoje);
   - **Framework preset:** None;
   - **Build command:** `npm run build`;
   - **Build output directory:** `dist`;
   - **Environment variable:** `NODE_VERSION` = `22`.
4. Dê o nome `gamida` ao projeto. O endereço fica `https://gamida.pages.dev`, ou outro, se esse nome já existir.
5. Abra o endereço e confira três coisas: o app abre, funciona sem internet depois da primeira visita e aparece a opção de instalar.

Cada envio para a `dev` publica sozinho. Envios para outras branches viram prévias com endereço próprio.

**Domínio próprio (recomendado):** um domínio seu, como `gamida.com.br`, facilita a verificação do Google e não depende do nome no `pages.dev`. Ligue-o em **Custom domains** no projeto do Cloudflare.

## Fase 2: login com Google

1. Em console.cloud.google.com, crie o projeto "Gamida".
2. Em **APIs e serviços → Biblioteca**, ative a **Google Drive API**.
3. Em **Google Auth Platform**:
   - **Branding:**
     - nome "Gamida";
     - e-mail de suporte;
     - logotipo `icons/icon-512.png`;
     - página inicial `https://SEU-ENDERECO/`;
     - política de privacidade `https://SEU-ENDERECO/privacidade.html`;
     - domínio autorizado: o seu domínio, ou `gamida.pages.dev`.
   - **Audience:** External. Enquanto estiver em *Testing*, só entram as contas de **Test users**.
   - **Data access:** os escopos `openid`, `email`, `profile` e `.../auth/drive.appdata`.
   - **Clients → Create client → Web application**, com:
     - **Authorized JavaScript origins:**
       - `https://SEU-ENDERECO`;
       - `https://felipepereiramedeiros.github.io`, enquanto o endereço antigo existir.
     - **Authorized redirect URIs:**
       - `https://SEU-ENDERECO/oauth-callback.html`;
       - `https://felipepereiramedeiros.github.io/gamida/oauth-callback.html`.
4. Copie o **ID do cliente**, que termina em `.apps.googleusercontent.com`. Ele vai em `GOOGLE_CLIENT_ID`, no início de `js/modules/cloud-sync.js`, e não é segredo. O **client secret** não é usado: não o coloque no repositório nem o envie a ninguém.
5. Preencha o e-mail de contato em `privacidade.html` (marcador `{{CONTATO}}`).
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
