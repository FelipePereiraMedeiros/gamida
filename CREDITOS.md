# Créditos

## Gamida

Criação, desenvolvimento e conteúdo didático: **Felipe Pereira Medeiros**.

## Crônicas do Escriba

O jogo **Crônicas do Escriba** é obra em coautoria de **José Henrique Rosseto** e **Felipe Pereira Medeiros** (cláusula 1.5 da [LICENSE](LICENSE)). Este arquivo registra quem criou o quê.

### José Henrique Rosseto

- **Concepção do jogo:** as palavras do rolo que viram criaturas, as frases que viram guardiões, os três heróis, as relíquias, a caçada pela palavra certa e o Devorador do Esquecimento.
- **Guia do Mestre do Rolo:**
  - a consistência da parte lúdica: os sete selos, o cânone da história e a ficha de capítulo;
  - o roteiro do Livro I (do Éden ao Sinai, com seus guardiões);
  - os roteiros-base do Livro II e do Segundo Rolo.
- **Arte em pixel da versão original:**
  - cenários com céu, neblina e primeiro plano;
  - os heróis do hebraico e as relíquias no corpo deles;
  - as criaturas por região e os guardiões do Livro I;
  - a paleta de 32 cores e o contorno.
- **Mapa desenhado do Livro I.**
- **Animações da versão original:**
  - poses do herói e golpes de fogo, luz e relâmpago;
  - ataque do inimigo, letras voltando ao rolo, pilar de nível, chuva de bênçãos e clarão;
  - letreiros em tela cheia, transição entre telas, cenário do capítulo e cenas da história.
- **Mecânicas da versão original:** criaturas de elite e velozes, fúria do guardião, masmorra das palavras fracas, bestiário e desempenho.

Arquivos com essa base: `js/modules/scribe-graphics.js` (extraído da versão original pelos scripts de `scripts/cronicas/`), a parte do Livro I em `js/modules/scribe-map.js` e as animações de `js/modules/scribe-fx.js`.

### Felipe Pereira Medeiros (no Gamida)

- **Integração ao Gamida** (o motor em `scribe-chronicles.js`, as regras em `scribe-rules.js` e as utilidades comuns em `scribe-common.js`):
  - o motor de batalha ligado ao banco de dados das lições (Kelley e Bergmann);
  - as frases com análise palavra por palavra e o golpe de gramática;
  - a montagem e a digitação das traduções;
  - o tempo de resposta e o ataque quando o tempo acaba;
  - a gravação do progresso.
- **Campanha completa nos dois idiomas** (`scribe-campaign.js` e `scribe-lore.js`):
  - fichas de todas as lições, prólogo nas Tendas de Hebrom, Livro II e Segundo Rolo, com notas de honestidade;
  - pergaminhos de ensino;
  - história de chegada, falas dos guardiões, epílogos e prólogos e finais de cada livro.
- **Heróis do Segundo Rolo** (`scribe-heroes.js`): Pescador, Centurião e Fazedor de tendas, com as doze relíquias gregas no corpo.
- **Guardiões com figura própria** do Livro II e do grego (`scribe-bosses.js`).
- **Mapas desenhados** do Livro II e do Segundo Rolo e os ícones dos lugares (`scribe-map.js`).
- **Golpes dos heróis do grego:** a rede, o pilo e a carta (`scribe-fx.js`).
- **Novos modos e recursos:**
  - a caçada completa com o vocabulário inteiro do capítulo e o selo;
  - o bestiário ilustrado;
  - a opção de ver os capítulos no mapa;
  - a batalha em destaque, com os menus recolhidos e a arena maior;
  - a interface em pixel: letras pixeladas, molduras, botões, barras de vida e ícones desenhados na paleta do jogo (`css/cronicas-pixel.css`, `scripts/molduras-cronicas.js`).
- **Música e efeitos sonoros sintetizados** (`game-audio.js`).

## Fontes

As letras em pixel das Crônicas usam a Pixelify Sans (The Pixelify Sans Project Authors), sob a SIL Open Font License 1.1. Ver `fonts/web/README.md`.

## Referências

As gramáticas citadas como referência de estudo (Page H. Kelley, *Gramática do Hebraico Bíblico*; Johannes Bergmann, *Gramática do Grego do Novo Testamento*) pertencem aos respectivos autores e editoras. A citação não indica vínculo nem endosso. Os textos bíblicos nos idiomas originais são de domínio público.
