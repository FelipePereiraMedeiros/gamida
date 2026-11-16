/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: a história
 * ==========================================================================
 * O enredo que costura a aventura. Um aprendiz de escriba vê o rolo do mestre
 * ser desfeito pelo Esquecimento, a névoa que apaga tudo o que não é repetido,
 * e sai pelo caminho das próprias histórias para trazer as palavras de volta.
 *
 * Cada capítulo tem três textos:
 *   lore     - a chegada à cidade (lida antes do pergaminho);
 *   taunt    - o que o guardião diz ao despertar;
 *   epilogue - o trecho da crônica que volta ao rolo quando o guardião cai.
 * Os trechos vencidos ficam guardados no Grimório, formando a crônica inteira.
 */

(function () {
const PROLOGUE = {
  hebrew: {
    title: "O rolo rasgado",
    villain: "Shikhchá",
    villainNative: "שִׁכְחָה",
    paragraphs: [
      "Você é aprendiz na casa do mestre Kelley, o último escriba que ainda copia o rolo inteiro à mão. Todas as noites ele repete a mesma frase antes de apagar a lâmpada: “O que não se repete, a névoa leva.”",
      "Uma noite a lâmpada ficou acesa e ninguém repetiu nada. Pela janela entrou Shikhchá, o Esquecimento. Não tem rosto nem voz: é uma névoa que se deita sobre a escrita e a desfaz. Quando amanheceu, o rolo estava em branco.",
      "As palavras não morreram. Ganharam pernas, asas e dentes, e fugiram cada uma para o lugar da história de onde tinha saído. As frases, que são mais fortes, viraram guardiões.",
      "O mestre lhe entregou a pena, um frasco de óleo e o rolo vazio. “Vá atrás delas. Comece pelas letras, a leste do jardim, e só pare em Jerusalém. Cada palavra que você disser em voz alta volta a ser sua.”",
    ],
  },
  greek: {
    title: "O códice em branco",
    villain: "Lete",
    villainNative: "Λήθη",
    paragraphs: [
      "Você é aprendiz na oficina do mestre Bergmann, que guarda o último códice copiado inteiro à mão. Ele tem um costume: lê uma página em voz alta todas as manhãs. “Palavra lida é palavra que fica”, diz.",
      "Numa manhã de viagem ninguém leu. Pela fresta da porta entrou Lete, o Esquecimento, o rio que os antigos diziam correr debaixo da terra. Aqui ele vem como névoa: passa sobre a tinta e a leva embora. Ao meio-dia o códice estava em branco.",
      "As palavras fugiram, cada uma para a cidade onde foi dita pela primeira vez. Viraram criaturas. As frases inteiras, que não se deixam levar tão fácil, viraram guardiões.",
      "O mestre lhe deu a pena, um frasco de óleo e o códice vazio. “Siga o caminho da própria história: de Belém até a ilha de Patmos. O que você ler em voz alta, a névoa não leva de novo.”",
    ],
  },
};

const ENDING = {
  hebrew: {
    title: "O rolo restaurado",
    paragraphs: [
      "No pátio do templo a névoa se desfaz. Debaixo dela não havia monstro nenhum: só um rolo empoeirado, esquecido num canto, como aquele que o sacerdote achou nos dias do rei Josias.",
      "Você volta à casa do mestre com o rolo cheio. Ele o desenrola devagar, lê a primeira linha e a última, e não diz nada por um tempo.",
      "Depois lhe devolve a pena. “Não é meu, é seu. Shikhchá volta todas as noites. Agora é você quem acende a lâmpada e repete.”",
    ],
  },
  greek: {
    title: "O códice completo",
    paragraphs: [
      "Na ilha, o dragão se desfaz em névoa e a névoa em nada. Sobre a pedra fica uma única ordem, a mesma que João ouviu ali: “Escreve o que vês.”",
      "Você atravessa o mar de volta com o códice cheio. O mestre Bergmann abre numa página qualquer e lê em voz alta, como todas as manhãs.",
      "Depois empurra o códice para o seu lado da mesa. “Lete não desiste. Amanhã cedo, quem lê é você.”",
    ],
  },
};

const CLASS_LORE = {
  mago: "Cresceu entre os que contavam as estrelas e descobriu que as letras também formam constelações. Não tem pressa: prefere entender a palavra antes de tocá-la.",
  cavaleiro: "Foi guarda da porta da casa do mestre. Não é o mais rápido para ler, mas nunca largou uma página pela metade. Erra, apanha e continua de pé.",
  assassino: "Era mensageiro: decorava recados inteiros porque não podia levá-los escritos. Lê depressa, bate primeiro e some antes do contra-ataque.",
};

const RELIC_LORE = {
  vara_arao: "Uma vara seca que floresceu numa noite. Lembra que o que parece morto na memória pode brotar de novo.",
  cajado_moises: "Estendido sobre o mar, abriu caminho. Dá tempo para atravessar a palavra antes que as águas voltem.",
  urim: "As pedras que o sacerdote consultava nas decisões difíceis. Perdoam a primeira dúvida.",
  tabuas: "Escritas duas vezes: as primeiras se quebraram. O que se escreve de novo, vale mais.",
  lanca_josue: "Josué a manteve estendida até a batalha terminar. Ensina a não baixar o braço no meio da frase.",
  escudo_abraao: "“Eu sou o teu escudo”, foi dito a Abraão. Pesa pouco e apara muito.",
  espada_golias: "Guardada atrás do éfode, embrulhada num pano. “Não há outra igual”, disse Davi ao recebê-la.",
  trombeta_sinai: "Soou do monte cada vez mais forte. A cada criatura vencida, devolve o fôlego.",
  funda_davi: "Cinco pedras lisas do ribeiro e uma só bastou. Premia o golpe certeiro.",
  punhal_eude: "De dois gumes, escondido sob a roupa do juiz canhoto. Ninguém o vê chegar.",
  cordao_raabe: "O fio vermelho na janela de Jericó, sinal de que aquela casa seria poupada. Uma vez por capítulo, poupa você.",
  manto_elias: "Caiu do céu quando o profeta subiu, e Eliseu o apanhou. Quem o veste herda dois dons.",
};

/* ================= Hebraico ================= */
const HEBREW = {
  kelley_01: {
    lore: "A leste do jardim, a névoa chegou primeiro às letras. Sem elas nenhuma palavra fica de pé, então Shikhchá as soltou no deserto, vinte e duas criaturas pequenas que mudam de forma quando chegam ao fim da linha.",
    taunt: "“Você não sabe nem o meu nome. Como pretende ler o resto?”",
    epilogue: "As vinte e duas letras voltam ao rolo e se alinham da direita para a esquerda. A página deixa de estar em branco: agora está pronta.",
  },
  kelley_03: {
    lore: "No jardim, o primeiro homem deu nome a tudo o que tinha fôlego: foi a primeira lição de vocabulário do mundo. As criaturas daqui são esses nomes, pai, mãe, filho, povo, que se esconderam entre as árvores.",
    taunt: "“Eu guardo a porta com uma espada que se revolve. Diga os nomes, um por um, ou volte.”",
    epilogue: "“E o homem deu nome a todos os animais.” Os primeiros substantivos voltam ao rolo, cada um com a sua raiz de três letras.",
  },
  kelley_05: {
    lore: "As águas baixaram e a arca pousou nos montes de Ararate. Dali se vê tudo de novo pela primeira vez: a terra, o céu, a luz. As criaturas se escondem atrás de um pequeno ה e fingem ser coisas quaisquer.",
    taunt: "“Um monte ou o monte? Enquanto você não souber a diferença, não passa.”",
    epilogue: "“E a arca repousou sobre os montes de Ararate.” O artigo volta ao rolo, e cada coisa passa a ser aquela coisa.",
  },
  kelley_06: {
    lore: "Na planície de Sinear os homens disseram: “Edifiquemos uma cidade e uma torre.” Foi ali que as línguas se confundiram. As palavras pequenas, as que ligam uma coisa à outra, ainda rondam os tijolos.",
    taunt: "“Em, para, como, de, com, sobre… Eu embaralhei todas. Desembaralhe.”",
    epilogue: "A torre fica inacabada, mas as ligações voltam: em, para, de, com. As palavras do rolo já conseguem dar as mãos.",
  },
  kelley_07: {
    lore: "De Ur dos caldeus saiu um homem a quem foi dito: “Conta as estrelas, se as podes contar.” Aqui as palavras se multiplicam, aos pares e aos bandos, e mudam de terminação para confundir a contagem.",
    taunt: "“Um cavalo, uma égua, cavalos, éguas, dois olhos. Quantos somos? Conte direito.”",
    epilogue: "“Assim será a tua descendência.” Masculino e feminino, singular, plural e dual voltam ao rolo, cada um com a sua marca.",
  },
  kelley_08: {
    lore: "Junto ao poço de Harã, Jacó viu Raquel chegar com as ovelhas, e o texto para tudo para dizer como ela era. É a terra dos adjetivos: bom, mau, grande, sábio. Eles seguem o substantivo como a sombra segue o viajante.",
    taunt: "“O rei bom ou o rei é bom? Pese bem. Eu só vendo a quem sabe a diferença.”",
    epilogue: "A pedra da boca do poço é removida. Os adjetivos voltam ao rolo, cada um concordando com o seu substantivo.",
  },
  kelley_09: {
    lore: "Em Siquém Josué reuniu as tribos e falou em primeira pessoa: “Eu e a minha casa serviremos ao SENHOR.” O povo respondeu: “Nós também.” As criaturas daqui apontam o dedo: eu, tu, este, aquele.",
    taunt: "“Quem fala? Com quem? De quem? Responda, e eu julgo.”",
    epilogue: "Uma grande pedra é erguida debaixo do carvalho, por testemunha. Os pronomes voltam ao rolo e cada frase ganha um dono.",
  },
  kelley_10: {
    lore: "Jacó dormiu com uma pedra por travesseiro e viu uma escada que tocava o céu. Ao acordar chamou o lugar de Betel, “casa de Deus”: duas palavras presas uma à outra. É assim que as criaturas andam aqui, acorrentadas aos pares.",
    taunt: "“Casa de Deus, porta do céu, filhos de Israel. Solte um elo errado e a corrente inteira cai sobre você.”",
    epilogue: "“Este lugar não é outro senão a casa de Deus.” O construto volta ao rolo, e as palavras aprendem a pertencer umas às outras.",
  },
  kelley_11: {
    lore: "Em Hebrom, Abraão pesou quatrocentos siclos de prata por um campo e uma caverna: a primeira terra que foi dele. Nas tendas tudo tem dono, e o dono vem colado no fim da palavra.",
    taunt: "“Meu campo, tua prata, a caverna dele. Diga de quem é cada coisa, forasteiro.”",
    epilogue: "O campo e a caverna são confirmados como propriedade. Os sufixos voltam ao rolo: meu, teu, dele, nosso.",
  },
  kelley_12: {
    lore: "No Egito as palavras deixaram de ser coisas e passaram a fazer coisas. O povo contava aos filhos o que tinha acontecido: ele ouviu, ele viu, ele lembrou. São ações já completas, e a terminação diz quem as fez.",
    taunt: "“Eu não conheci José, e não conheço você. Diga quem fez, ou sirva.”",
    epilogue: "“E Deus ouviu o gemido deles e se lembrou da sua aliança.” O perfeito volta ao rolo, e a história pode enfim ser contada.",
  },
  kelley_13: {
    lore: "Três dias depois do mar, o povo chegou a Mara e não pôde beber, porque as águas eram amargas. E murmuraram: “Que havemos de beber?” Desde então as criaturas daqui só falam perguntando.",
    taunt: "“Quem? O quê? Onde? Por quê? Quantos? Responda às minhas e eu respondo à sua.”",
    epilogue: "Um lenho é lançado nas águas e elas se tornam doces. As perguntas e os números voltam ao rolo.",
  },
  kelley_14: {
    lore: "Ao pé do Sinai há trovões, relâmpagos e som de trombeta. Aqui a mesma raiz ganha sete forças: age, sofre a ação, intensifica, faz fazer. O dragão que guarda o monte tem uma cabeça para cada tronco.",
    taunt: "“Sete cabeças, sete troncos. Corte a errada e outra nasce no lugar.”",
    epilogue: "“Todo o povo viu os trovões.” Os sete troncos voltam ao rolo, e uma só raiz passa a valer por sete.",
  },
  kelley_15: {
    lore: "De Cades partiram doze homens para espiar a terra. Voltaram com um cacho de uvas e duas versões do futuro: “subiremos” e “não poderemos subir”. As criaturas daqui falam do que ainda não aconteceu.",
    taunt: "“Vi gigantes naquela terra. Você subirá? Diga no tempo certo.”",
    epilogue: "“Subamos e possuamos a terra, porque certamente prevaleceremos.” O imperfeito volta ao rolo, e a história ganha um amanhã.",
  },
  kelley_16: {
    lore: "Do alto de Moabe um vidente foi chamado para amaldiçoar e só conseguiu abençoar: “Vejo-o, mas não agora.” Daquelas colinas se enxerga longe, e cada tronco tem o seu jeito de dizer o que virá.",
    taunt: "“Ele será guardado? Falará? Fará separar? Diga qual tronco, e eu lhe mostro o caminho.”",
    epilogue: "“Uma estrela procederá de Jacó.” O futuro dos sete troncos volta ao rolo.",
  },
  kelley_17: {
    lore: "Diante do Jordão em cheia, os sacerdotes ergueram a arca nos ombros e as águas pararam. Ninguém atravessa sozinho: o verbo também carrega o seu objeto colado às costas.",
    taunt: "“Guardou-me, guardou-te, guardou-o. Quem leva quem? Erre, e o rio leva você.”",
    epilogue: "O povo passa a pé enxuto. Os sufixos do verbo voltam ao rolo: uma palavra só diz quem fez e a quem.",
  },
  kelley_18: {
    lore: "Sete dias em volta de Jericó, sem uma palavra. No sétimo veio a ordem: “Gritai!” Aqui tudo é mandado ou proibido, e as criaturas obedecem a quem sabe dar a ordem na forma certa.",
    taunt: "“Marche! Toque! Cale-se! Não se aproxime! Eu só obedeço a ordens bem dadas.”",
    epilogue: "“O povo gritou, e o muro caiu.” O imperativo e as proibições voltam ao rolo.",
  },
  kelley_19: {
    lore: "Em Gilgal, doze pedras tiradas do meio do rio foram postas de pé, “para que os vossos filhos perguntem”. É o lugar do lembrar. Aqui o verbo vira nome: o guardar, o passar, o atravessar.",
    taunt: "“Para guardar, ao guardar, certamente guardar. Diga para que serve cada pedra.”",
    epilogue: "“Estas pedras serão por memorial para sempre.” Os dois infinitivos voltam ao rolo.",
  },
  kelley_20: {
    lore: "Em Siló a lâmpada ainda não se apagara, e um menino dormia perto da arca. O serviço ali nunca para: sempre há alguém guardando, servindo, ouvindo. As criaturas são ações que não terminam.",
    taunt: "“Estou guardando esta tenda desde antes de você nascer. Quem é o que guarda e quem é o guardado?”",
    epilogue: "“Fala, porque o teu servo ouve.” Os particípios voltam ao rolo, e a ação passa a ter rosto.",
  },
  kelley_21: {
    lore: "“E aconteceu, nos dias em que os juízes julgavam, que houve fome na terra.” Assim começa a história de Belém, e assim começam quase todas: e foi, e viu, e disse. As criaturas daqui andam em fila, presas por um pequeno ו.",
    taunt: "“E veio, e colheu, e ajuntou. Solte um elo da história e ela para. Conte-a até o fim.”",
    epilogue: "“E ela foi, e chegou, e apanhava espigas no campo.” O vav consecutivo volta ao rolo, e a narrativa volta a correr.",
  },
  kelley_22: {
    lore: "Em Gibeá, Saul se assenta debaixo de uma tamargueira com a lança na mão. As raízes daqui tropeçam logo no primeiro passo: a primeira letra é gutural e não aceita as vogais de sempre.",
    taunt: "“A minha lança não erra a primeira letra. E a sua língua?”",
    epilogue: "“E Saul ficou de pé no meio do povo.” Os verbos de primeira gutural voltam ao rolo.",
  },
  kelley_23: {
    lore: "Em Ramá mora o profeta, e todo o Israel vem ouvi-lo. Cada frase dele começa do mesmo jeito: “Assim disse.” O verbo dizer manda nesta montanha, com um א que se escreve e não se ouve.",
    taunt: "“Eu disse, tu disseste, ele dirá. Você ouviu o א? Ninguém ouve. Mas ele está lá.”",
    epilogue: "“E disse Samuel a todo o povo.” A forma verbal mais repetida de todo o rolo volta ao seu lugar.",
  },
  kelley_24: {
    lore: "No vale de Elá, dois exércitos se olham de um monte ao outro, e toda manhã um gigante desce para perguntar e desafiar. Aqui a gutural fica no meio da raiz e, como ele, não se dobra.",
    taunt: "“Escolham um homem que desça a mim! Quarenta dias perguntei. Você tem resposta?”",
    epilogue: "Uma pedra lisa do ribeiro basta. Os verbos de gutural no meio voltam ao rolo.",
  },
  licao_25: {
    lore: "Na caverna de Adulão juntaram-se a Davi todos os que estavam em aperto. É um bom lugar para se esconder, e a gutural do fim da raiz faz o mesmo: fica no fundo e puxa um “a” para perto de si.",
    taunt: "“Fui enviado, ouvi, fugi. Chegue ao fundo da palavra e me ache, se puder.”",
    epilogue: "“E todo homem em aperto se ajuntou a ele.” Os verbos de terceira gutural voltam ao rolo.",
  },
  licao_26: {
    lore: "Nas rochas das cabras monteses, em En-Gedi, Davi achou o rei dormindo e não o tocou: cortou só a ponta do manto. O א do fim da raiz é como ele ali, presente e em silêncio.",
    taunt: "“Você me achou? Leia o que está escrito, não o que se ouve.”",
    epilogue: "“Eis que hoje os teus olhos viram.” Os verbos de terceira א voltam ao rolo.",
  },
  licao_27: {
    lore: "Davi tomou a fortaleza de Sião, habitou nela e edificou ao redor. Subir, ver, fazer, construir: os verbos que mais trabalham na língua terminam em ה e perdem essa letra quando têm pressa.",
    taunt: "“E subiu, e viu, e fez. Para onde foi a última letra? Diga-me e as portas se abrem.”",
    epilogue: "“E Davi edificou ao redor.” Os verbos de terceira ה voltam ao rolo: os mais usados de todos.",
  },
  licao_28: {
    lore: "Em Gibeão, de noite, foi dito a Salomão: “Pede o que queres que eu te dê.” Ele pediu um coração que ouve. O verbo dar é o senhor deste lugar, e o seu נ some logo no começo.",
    taunt: "“Dou, darás, dê. Onde está o נ? Quem pede certo, recebe.”",
    epilogue: "“Eis que te dou um coração sábio.” Os verbos de primeira נ voltam ao rolo.",
  },
  licao_29: {
    lore: "No Carmelo, um profeta sozinho diante de quatrocentos e cinquenta. O fogo desceu e consumiu o holocausto, a lenha, as pedras e até a água. Nas raízes daqui o fogo come a letra do meio.",
    taunt: "“Levanta-te! Vem! Volta! Sobraram duas letras. Você reconhece a raiz pelas cinzas?”",
    epilogue: "“Sobe, come e bebe, porque há ruído de abundante chuva.” Os verbos de letra do meio fraca voltam ao rolo.",
  },
  licao_30: {
    lore: "Onri comprou um monte e nele edificou Samaria. Dali os reis de Israel se assentam, saem para a guerra e descem. Sentar, sair, descer, saber: todos começam com י, e o י não fica para ver o fim.",
    taunt: "“Senta-te, sai, desce, sabe! Quatro ordens e nenhuma começa como devia. Entendeu?”",
    epilogue: "“E chamou Samaria à cidade que edificou.” Os verbos de primeira י voltam ao rolo.",
  },
  licao_31: {
    lore: "Jerusalém, enfim. No templo em reforma, a névoa é mais densa do que em qualquer outro lugar: é ali que Shikhchá guarda o que roubou. O último guardião dá voltas sobre si mesmo, como as raízes de letras dobradas, e sabe todas as lições que você aprendeu.",
    taunt: "“Eu sou tudo o que você deixou de repetir. Rodeei esta cidade antes de você nascer. Mostre-me que se lembra.”",
    epilogue: "“Achei o livro da Lei na casa do SENHOR.” O rolo estava ali o tempo todo, debaixo da poeira. As últimas raízes voltam ao lugar.",
  },
};

/* ================= Grego ================= */
const GREEK = {
  bergmann_01: {
    lore: "Nos campos de Belém, pastores vigiam o rebanho de noite. A névoa de Lete passou primeiro por aqui e soltou as letras pelo pasto: vinte e quatro criaturas, do alfa ao ômega, algumas com sopro, outras sem.",
    taunt: "“Do alfa ao ômega, quantas somos? Quem não nos conhece não lê nada.”",
    epilogue: "“Não temam: trago uma boa notícia.” As vinte e quatro letras voltam ao códice, com espíritos e acentos no lugar.",
  },
  bergmann_02: {
    lore: "Em Nazaré o menino crescia e os dias eram todos parecidos: alguém ouve, alguém vê, alguém diz. É a terra do presente. Aqui o verbo mostra, só pela terminação, quem está agindo.",
    taunt: "“Eu vejo, tu vês, ele vê. Quem está vigiando agora? Responda sem pronome.”",
    epilogue: "“E o menino crescia e se fortalecia.” O presente volta ao códice, e as palavras começam a agir.",
  },
  bergmann_03: {
    lore: "À beira do Jordão um homem vestido de pelos de camelo anuncia o que está para vir. Tudo aqui é “para que” e “se”: fala-se do que pode ser, ainda não do que é.",
    taunt: "“Para que você atravesse, é preciso que diga. Se errar, o rio decide.”",
    epilogue: "“Para que todos cressem por meio dele.” O subjuntivo volta ao códice, e com ele a possibilidade.",
  },
  bergmann_04: {
    lore: "Quarenta dias no deserto, e uma voz que só fala em condições e promessas: “Tudo isto te darei.” A resposta veio também no futuro: “Não só de pão viverá o homem.” As criaturas daqui escondem um σ antes da terminação.",
    taunt: "“Tudo isto lhe darei, se você se prostrar. O que você fará?”",
    epilogue: "“Ao Senhor teu Deus adorarás.” O futuro volta ao códice.",
  },
  bergmann_05: {
    lore: "Em Caná há uma festa de casamento e seis talhas de pedra. O mestre-sala prova e chama o noivo. Numa festa cada um tem o seu lugar à mesa, e numa frase também: a terminação diz quem serve, quem recebe e de quem é o vinho.",
    taunt: "“O servo, do servo, ao servo. Quem trouxe o vinho? Diga o caso e eu o deixo entrar.”",
    epilogue: "“Tu guardaste o bom vinho até agora.” O artigo e a segunda declinação voltam ao códice.",
  },
  bergmann_06: {
    lore: "Em Cafarnaum um centurião manda dizer: “Dize somente uma palavra.” Ele entende de ordens: diz a um “vai”, e ele vai. As palavras femininas daqui também obedecem, mas trocam de vogal conforme quem vem antes.",
    taunt: "“Tenho soldados às minhas ordens. A glória, da glória, à glória: ponha-as em forma.”",
    epilogue: "“Nem mesmo em Israel achei tamanha fé.” A primeira declinação volta ao códice.",
  },
  bergmann_07: {
    lore: "Do barco, perto da praia, conta-se a história de um semeador. Uma parte da semente caiu em terra boa. À beira do mar da Galileia tudo ganha qualidade: boa, má, fiel, santo, pequeno.",
    taunt: "“A terra boa ou a terra é boa? Lance a rede do lado certo.”",
    epilogue: "“E deu fruto: cem, sessenta e trinta por um.” Os adjetivos voltam ao códice, cada um concordando com o seu nome.",
  },
  bergmann_08: {
    lore: "Ao meio-dia, junto ao poço de Jacó, uma mulher vem tirar água. A conversa é toda feita de palavras pequenas: de onde, para onde, em que monte, por meio de quem. Em Samaria as preposições decidem o sentido.",
    taunt: "“Deste poço ou daquele monte? Em Jerusalém ou em espírito? Uma palavra pequena muda tudo.”",
    epilogue: "“Em espírito e em verdade.” As preposições voltam ao códice, cada uma com o seu caso.",
  },
  bergmann_09: {
    lore: "Em Betânia há uma pedra sobre um túmulo e gente chorando. A frase que se ouve ali começa por um pronome que ninguém esperava: “Eu sou.” Eu, tu, ele, este, aquele: cada um é chamado pelo nome.",
    taunt: "“Quem é este? De quem é a voz? A quem ela chama? Aponte, e eu rolo a pedra.”",
    epilogue: "“Lázaro, vem para fora!” Os pronomes voltam ao códice.",
  },
  bergmann_10: {
    lore: "Na entrada de Jericó um homem rico e de pouca altura procurava ver quem passava, e não conseguia por causa da multidão. Correu adiante e subiu numa figueira. Aqui se conta o que ia acontecendo, sem pressa de terminar.",
    taunt: "“Eu cobrava, eu contava, eu guardava. E você, o que vinha fazendo?”",
    epilogue: "“Hoje veio a salvação a esta casa.” O imperfeito volta ao códice.",
  },
  bergmann_11: {
    lore: "Em Jerusalém, no pátio do templo, os verbos mais antigos da língua contam o que aconteceu de uma vez: veio, viu, disse, tomou. Para isso trocam de rosto, e os escribas do lugar se orgulham de reconhecê-los.",
    taunt: "“λέγω vira εἶπον. ὁράω vira εἶδον. Você decorou, ou vai adivinhar?”",
    epilogue: "“E, tendo vindo, viu a cidade e chorou sobre ela.” O segundo aoristo volta ao códice.",
  },
  bergmann_12: {
    lore: "No horto das oliveiras, uma noite só. Vieram com lanternas, tochas e armas. O que aconteceu ali, aconteceu de uma vez, e a língua marca o fato com duas letras: σα.",
    taunt: "“Vigiei, prendi, levei. Uma noite, um golpe. Mostre o seu.”",
    epilogue: "“Não se faça a minha vontade, mas a tua.” O primeiro aoristo volta ao códice.",
  },
  bergmann_13: {
    lore: "No lugar chamado Caveira, a terra tremeu e as rochas se partiram. Um soldado que estava de frente viu tudo. As palavras daqui são como as rochas: só mostram o que têm por dentro quando se abrem no genitivo.",
    taunt: "“Carne, da carne. Corpo, do corpo. Eu vi o que havia por dentro. E você?”",
    epilogue: "“Verdadeiramente este era Filho de Deus.” A terceira declinação volta ao códice.",
  },
  bergmann_14: {
    lore: "Dois discípulos caminham para Emaús, conversando e discutindo, e um terceiro se põe a andar com eles. Duas ações ao mesmo tempo: é o que o particípio sabe fazer.",
    taunt: "“Andando, falando, partindo o pão. O que eu fazia enquanto você olhava?”",
    epilogue: "“Não ardia o nosso coração, quando ele nos falava pelo caminho?” O particípio presente volta ao códice.",
  },
  bergmann_15: {
    lore: "Perto de Damasco, ao meio-dia, uma luz. Tendo caído por terra, ele ouviu uma voz; tendo-se levantado, não via nada. Uma coisa veio antes da outra, e a língua diz isso sem precisar de “depois”.",
    taunt: "“Tendo perseguido, tendo prendido, tendo chegado até aqui. E você, tendo aprendido o quê?”",
    epilogue: "“Levanta-te e entra na cidade.” O particípio aoristo e o genitivo absoluto voltam ao códice.",
  },
  bergmann_16: {
    lore: "Em Antioquia os discípulos ganharam um nome, e a cidade inteira perguntava: quem são estes? O que ensinam? Havia ali profetas e mestres. As criaturas do lugar perguntam, respondem “alguém” e falam umas das outras.",
    taunt: "“Quem? Alguém. Quem? Ninguém. Um acento separa os dois. Você o ouve?”",
    epilogue: "“Em Antioquia foram pela primeira vez chamados cristãos.” Interrogativos, indefinidos e reflexivos voltam ao códice.",
  },
  bergmann_17: {
    lore: "À meia-noite, na prisão de Filipos, dois presos cantavam. Veio um terremoto: as portas se abriram, e abertas ficaram. O que foi feito continua valendo. É o tempo perfeito.",
    taunt: "“As portas estão abertas, as correntes estão soltas. O que está escrito, você leu?”",
    epilogue: "“Crê no Senhor Jesus e serás salvo.” O perfeito volta ao códice, e o que foi escrito permanece.",
  },
  bergmann_18: {
    lore: "Em Atenas há um altar “ao Deus desconhecido”, e no Areópago ninguém faz outra coisa senão dizer e ouvir novidades. Discute-se e ordena-se. As criaturas daqui falam em mandamentos e em desejos.",
    taunt: "“Fale! Prove! Que jamais aconteça! Um bom orador conhece os modos.”",
    epilogue: "“Agora ele ordena a todos, em todo lugar, que se arrependam.” O imperativo e o optativo voltam ao códice.",
  },
  bergmann_19: {
    lore: "Em Corinto correm no estádio, e todos correm, mas um só leva o prêmio. Ali o verbo vira nome: o correr, o lutar, o receber. Quem domina o infinitivo corre sem tropeçar.",
    taunt: "“Correr, ter corrido, ser coroado. Eu discurso sobre tudo. Você alcança?”",
    epilogue: "“Correi de tal modo que o alcanceis.” O infinitivo volta ao códice.",
  },
  bergmann_20: {
    lore: "Em Éfeso um ourives de prata junta os do ofício e a cidade inteira grita por duas horas. Nas oficinas os metais se fundem, e nos verbos daqui as vogais também: duas viram uma.",
    taunt: "“Eu fundo prata; a língua funde vogais. ε mais ο dá o quê? Depressa!”",
    epilogue: "“Assim a palavra do Senhor crescia e prevalecia.” Os verbos contraídos e os verbos em ‑μι voltam ao códice.",
  },
  bergmann_21: {
    lore: "Em Roma, um preso vive numa casa alugada com o soldado que o guarda, e recebe a todos. Na capital tudo é contado e apontado: o primeiro, o segundo, os doze, um só.",
    taunt: "“Um prisioneiro, dois anos, uma corrente. Conte comigo e aponte com o artigo.”",
    epilogue: "“Pregando com toda a ousadia, sem impedimento algum.” O artigo e os numerais voltam ao códice.",
  },
  bergmann_22: {
    lore: "A ilha chamada Patmos. Aqui Lete juntou tudo o que roubou, e aqui o códice quase se fecha. O último guardião tem sete cabeças e fala só por condições: se… então. Conhece todas as lições por onde você passou.",
    taunt: "“Se você se lembrasse, teria vencido. Se se lembrar agora, vencerá. Qual das duas?”",
    epilogue: "“Escreve, pois, as coisas que viste.” A última página volta ao códice. Não ficou nenhuma em branco.",
  },
};

const GENERIC = {
  lore: "Uma página que não estava no rolo do mestre, acrescentada depois. A névoa não faz distinção: levou estas palavras também.",
  taunt: "“Ninguém me deu nome. Isso não me faz mais fraco.”",
  epilogue: "A página acrescentada volta ao rolo, costurada depois da última.",
};

/**
 * Textos da história para um capítulo; capítulos criados pelo aluno recebem os genéricos
 * @param {string} language 'hebrew' ou 'greek'
 * @param {string} chapterId
 * @returns {{lore: string, taunt: string, epilogue: string}}
 */
function forChapter(language, chapterId) {
  const table = language === "greek" ? GREEK : HEBREW;
  return table[chapterId] || GENERIC;
}

const ScribeLore = { PROLOGUE, ENDING, CLASS_LORE, RELIC_LORE, HEBREW, GREEK, GENERIC, forChapter };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeLore = ScribeLore;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeLore;
}
})();
