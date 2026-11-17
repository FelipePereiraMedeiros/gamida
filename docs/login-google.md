# Perfis e login com Google

## O que é o perfil

Um perfil reúne tudo o que é do aluno:

- **progresso de todos os modos e práticas:** repetição espaçada, termos dominados, palavras para revisar, recorde do Sobrevivência, trilha de domínio, Chuva de Pedras, Crônicas do Escriba e dias de estudo;
- **todas as configurações:** idioma, meta diária, modo de resposta nos jogos, direção das alternativas, som e música, capítulos marcados e ordem dos capítulos.

O material de estudo (capítulos) e a versão dos dados **não** entram no perfil. Eles são o banco de dados do sistema e valem para todos os perfis do aparelho.

Na aba **Perfil** dá para:

- ver os números dos dois idiomas;
- criar, trocar, renomear e excluir perfis;
- baixar ou carregar o arquivo de perfil;
- voltar à cópia anterior depois de uma substituição.

O código está em `js/modules/profiles.js`.

## Login com Google e cópia no Google Drive do aluno

Não há servidor do Gamida. Quando o aluno entra com a conta Google, o navegador fala direto com o Google e guarda **só o arquivo de perfil** (`gamida-perfil.json`) na pasta de *dados de aplicativo* do Google Drive do próprio aluno (`appDataFolder`):

- a pasta é oculta para o aluno e só o Gamida, naquela conta, consegue lê-la;
- o Gamida não vê nenhum outro arquivo do Drive, porque pede apenas a permissão `drive.appdata`;
- o Google guarda versões anteriores do arquivo por algum tempo.

### Sincronização

| Situação | O que acontece |
|---|---|
| Primeiro login, sem arquivo na nuvem | O perfil deste aparelho sobe. |
| Aparelho sem progresso e arquivo na nuvem | O perfil da nuvem desce. |
| Só um dos lados mudou desde a última sincronização | O lado novo vale. |
| Os dois lados mudaram | O aluno escolhe: usar a versão do Drive, manter a deste aparelho ou decidir depois. Se escolher a versão do Drive, uma cópia do aparelho fica guardada. |

Com a sessão ativa, as mudanças são salvas sozinhas cerca de 20 segundos depois e também ao sair da página. A sessão do Google dura cerca de uma hora. Depois disso, o progresso continua sendo gravado no aparelho e o cartão da nuvem mostra o botão **Reconectar**.

Cada conta Google fica ligada a um perfil. Se o aluno entrar com uma conta que já pertence a outro perfil do aparelho, o Gamida troca para esse perfil.

O código está em `js/modules/cloud-sync.js` e `oauth-callback.html`.

## Como ativar (uma vez, pelo dono do Gamida)

1. Acesse o Google Cloud Console (console.cloud.google.com) e crie um projeto, por exemplo "Gamida".
2. Em **APIs e serviços → Biblioteca**, ative a **Google Drive API**.
3. Em **APIs e serviços → Tela de consentimento OAuth** (Google Auth Platform):
   - tipo **Externo**;
   - nome do app "Gamida", e-mail de suporte e logotipo, se quiser;
   - escopos: `openid`, `email`, `profile` e `.../auth/drive.appdata`, todos não confidenciais;
   - enquanto estiver em **Teste**, só entram as contas listadas em "Usuários de teste". Para liberar a todos, clique em **Publicar app**. Com escopos não confidenciais o Google costuma pedir apenas a verificação da marca (nome, logotipo, página inicial e política de privacidade).
4. Em **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - tipo **Aplicativo da Web**;
   - **Origens JavaScript autorizadas:** o endereço do site, por exemplo `https://SEU-USUARIO.github.io`;
   - **URIs de redirecionamento autorizados:** o endereço completo da página de retorno, por exemplo `https://SEU-USUARIO.github.io/gamida/oauth-callback.html`. Para testar localmente, inclua também `http://localhost:8765/oauth-callback.html`.
5. Copie o ID do cliente (termina em `.apps.googleusercontent.com`) e coloque em `GOOGLE_CLIENT_ID`, no início de `js/modules/cloud-sync.js`. O ID do cliente não é segredo: ele aparece no navegador de qualquer forma.
6. Publique o site. O botão **Entrar com Google** aparece na aba Perfil.

Para testar antes de publicar, rode este comando no console do navegador:

```js
localStorage.setItem("gamida_google_client_id", "SEU-ID.apps.googleusercontent.com")
```

Ele ativa o login só naquele navegador.

## Privacidade

A tela de consentimento pede um link de política de privacidade. Em resumo:

- o Gamida guarda o progresso do aluno no navegador e, se ele entrar com Google, numa pasta privada do Google Drive do próprio aluno;
- nenhum dado vai para servidores do Gamida;
- o aluno pode apagar o arquivo removendo o acesso do Gamida em myaccount.google.com → Segurança → Apps de terceiros.
