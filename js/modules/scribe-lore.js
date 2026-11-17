/*! Gamida, Crônicas do Escriba — Copyright (c) 2026 José Henrique Rosseto e Felipe Pereira Medeiros (coautores). Todos os direitos reservados. Uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE; autoria de cada parte em CREDITOS.md. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: a história
 * ==========================================================================
 * Segue a lore do Guia do Mestre do Rolo. Nas tendas de Hebrom, o mestre
 * Kelley guardava o Rolo das Palavras. O Devorador do Esquecimento, um dragão
 * que se alimenta de toda palavra que ninguém revisa, rasgou o rolo: cada
 * palavra virou uma criatura e cada frase, um guardião. Só vence uma criatura
 * quem diz o nome certo dela.
 *
 * Cada livro tem prólogo e final. Cada capítulo tem:
 *   taunt    - o que o guardião diz ao despertar;
 *   epilogue - o trecho da crônica que volta ao rolo quando o guardião cai.
 * A chegada ao lugar é a história do capítulo (campo "story" da campanha).
 */

(function () {
const VILLAIN = { name: "o Devorador do Esquecimento", native: { hebrew: "הַשִּׁכְחָה", greek: "λήθη" } };

/* ================= Prólogos e finais, por livro ================= */
const BOOKS = {
  hebrew: {
    1: {
      prologue: {
        title: "O Rolo das Palavras",
        paragraphs: [
          "Nas tendas de Hebrom, o mestre Kelley guardava o Rolo das Palavras: cada palavra hebraica que um escriba precisa para ler a Torá.",
          "Numa noite sem lua veio o Devorador do Esquecimento. Ele se alimenta de toda palavra que não é revisada, e o rolo era o maior banquete que já tinha visto.",
          "Ele rasgou o rolo com uma garra. As letras se espalharam pela terra, e cada palavra virou uma criatura: demônios, espectros, draconídeos. As frases inteiras viraram guardiões.",
          "O mestre chamou três aprendizes: um profeta, um guerreiro de Israel e um juiz benjamita. A regra da caça é antiga: só quem diz o nome certo de uma criatura consegue vencê-la.",
          "Primeiro é preciso juntar as letras caídas ao redor das tendas. Depois a trilha vai do Éden ao Sinai: em cada lugar um pergaminho ensina, as criaturas testam o vocabulário e um guardião exige frases inteiras.",
        ],
      },
      ending: {
        title: "O rolo inteiro",
        paragraphs: [
          "O grande dragão caiu no Sinai, e o Devorador do Esquecimento caiu com ele. Da boca dos dois saíram, uma a uma, as frases que tinham engolido.",
          "Letra por letra, palavra por palavra, o rolo voltou a ser inteiro nas tendas de Hebrom.",
          "O mestre Kelley abriu o rolo, leu em voz alta בְּרֵאשִׁית בָּרָא אֱלֹהִים e o entregou a você. “Agora você lê sozinho.”",
        ],
      },
    },
    2: {
      prologue: {
        title: "Livro II: do Jordão à Babilônia",
        paragraphs: [
          "O rolo restaurado no Sinai era só a Torá. O mestre mostra as margens em branco: faltam os Profetas e os Escritos.",
          "O Grande Dragão caiu, mas o Devorador deixou crias pela terra prometida. Elas se escondem nos lugares onde Israel lutou para não esquecer.",
          "O aprendiz agora é escriba e segue o povo, da travessia do Jordão até os rios da Babilônia. Lá um salmo pergunta o que a jornada inteira pergunta: “Se eu me esquecer de ti, ó Jerusalém…” (Sl 137.5).",
        ],
      },
      ending: {
        title: "As margens preenchidas",
        paragraphs: [
          "Junto aos rios da Babilônia a estátua cai, e as harpas descem dos salgueiros.",
          "O escriba volta às tendas de Hebrom com as margens preenchidas: a Lei, os Profetas e os Escritos no mesmo rolo.",
          "O mestre Kelley lê em voz alta: “Se eu me esquecer de ti, ó Jerusalém, esqueça-se a minha destra da sua destreza” (Sl 137.5). E fecha o rolo: “Esquecer é o que o Devorador quer. Revisar é como se vence.”",
        ],
      },
    },
  },
  greek: {
    1: {
      prologue: {
        title: "O Segundo Rolo",
        paragraphs: [
          "O escriba que restaurou o rolo hebraico recebe um segundo rolo, escrito em outra letra. O mestre deste rolo é Bergmann, o autor da gramática de grego da turma.",
          "O Devorador do Esquecimento também passou por ele. As letras gregas se espalharam de Belém a Patmos: cada palavra virou uma criatura, e cada frase, um guardião.",
          "Três aprendizes seguem a trilha: o Pescador, o Centurião e o Fazedor de tendas. A regra da caça continua a mesma: só vence uma criatura quem diz o nome certo dela.",
          "A trilha começa em Belém e termina na ilha de Patmos, onde o grande dragão, a antiga serpente, guarda a última página.",
        ],
      },
      ending: {
        title: "O Segundo Rolo inteiro",
        paragraphs: [
          "Em Patmos a besta e o dragão caem, e não pela força do escriba: eles foram vencidos pelo sangue do Cordeiro e pela palavra do testemunho (Ap 12.11; 17.14). O escriba venceu as perguntas e leu o texto.",
          "Letra por letra, as palavras gregas voltam ao Segundo Rolo.",
          "O mestre Bergmann abre o rolo e lê em voz alta: Ἐν ἀρχῇ ἦν ὁ λόγος (Jo 1.1). Depois o entrega a você: “Agora você lê sozinho.”",
        ],
      },
    },
  },
};

/** Compatibilidade: prólogo e final do primeiro livro de cada idioma */
const PROLOGUE = {
  hebrew: { ...BOOKS.hebrew[1].prologue, villain: "o Devorador do Esquecimento", villainNative: VILLAIN.native.hebrew },
  greek: { ...BOOKS.greek[1].prologue, villain: "o Devorador do Esquecimento", villainNative: VILLAIN.native.greek },
};
const ENDING = { hebrew: BOOKS.hebrew[2].ending, greek: BOOKS.greek[1].ending };

/* ================= Classes ================= */
const CLASS_LORE = {
  hebrew: {
    mago: "Aprendiz no modelo de Elias, o tesbita: manto de pelos, cinto de couro e os olhos no céu (2Rs 1.8). Prefere entender a palavra antes de tocá-la.",
    cavaleiro: "Aprendiz no modelo dos valentes de Davi (2Sm 23.8). Não é o mais rápido para ler, mas nunca larga uma página pela metade.",
    assassino: "Aprendiz no modelo de Eúde, o benjamita canhoto (Jz 3.15-16). Lê depressa, bate primeiro e some antes do contra-ataque.",
  },
  greek: {
    mago: "Aprendiz no modelo de Pedro e André, pescadores do mar da Galileia (Mt 4.18). Sabe esperar a rede encher.",
    cavaleiro: "Aprendiz no modelo de Cornélio, centurião da coorte italiana (At 10.1). Disciplina antes de tudo: não sai da fileira.",
    assassino: "Aprendiz no modelo de Paulo, Áquila e Priscila, que faziam tendas (At 18.3). Trabalha com as mãos e viaja depressa.",
  },
};
// Os testes e as telas antigas pedem CLASS_LORE[classe]: vale o texto do hebraico
Object.keys(CLASS_LORE.hebrew).forEach((key) => { CLASS_LORE[key] = CLASS_LORE.hebrew[key]; });

/* ================= Relíquias ================= */
const RELIC_LORE = {
  vara_arao: "Uma vara seca que floresceu numa noite (Nm 17.8). O que parece morto na memória pode brotar de novo.",
  cajado_moises: "Estendido sobre o mar, abriu caminho (Êx 14.16). Dá tempo para atravessar a palavra antes que as águas voltem.",
  urim: "As pedras que o sacerdote levava no peitoral para as decisões difíceis (Êx 28.30). Perdoam a primeira dúvida.",
  tabuas: "Escritas pelo dedo de Deus (Êx 31.18) e escritas de novo depois de quebradas. O que se escreve outra vez vale mais.",
  lanca_josue: "Josué a manteve estendida até a batalha terminar (Js 8.18). Ensina a não baixar o braço no meio da frase.",
  escudo_abraao: "“Eu sou o teu escudo”, foi dito a Abraão (Gn 15.1). Pesa pouco e apara muito.",
  espada_golias: "Guardada atrás do éfode, embrulhada num pano. “Não há outra igual”, disse Davi ao recebê-la (1Sm 21.9).",
  trombeta_sinai: "Soou do monte cada vez mais forte (Êx 19.16). A cada criatura vencida, devolve o fôlego.",
  funda_davi: "Cinco pedras lisas do ribeiro, e uma bastou (1Sm 17.49). Premia o golpe certeiro.",
  punhal_eude: "De dois gumes, escondido sob a roupa do juiz canhoto (Jz 3.16). Ninguém o vê chegar.",
  cordao_raabe: "O fio vermelho na janela de Jericó, sinal de que aquela casa seria poupada (Js 2.18). Uma vez por capítulo, poupa você.",
  manto_elias: "Com uma aguilhada de bois, Sangar feriu seiscentos filisteus (Jz 3.31). Uma ferramenta simples nas mãos certas.",
  manto_profeta: "Caiu do céu quando Elias subiu, e Eliseu o apanhou junto ao Jordão (2Rs 2.13). Quem o veste herda a palavra.",
  arco_jonatas: "“O arco de Jônatas nunca voltou atrás” (2Sm 1.22). Dá tempo para o golpe sair inteiro.",
  queixada_sansao: "Uma queixada de jumento ainda fresca, achada no caminho (Jz 15.15). Dá força para aguentar mais.",
  rede_direita: "“Lançai a rede para o lado direito do barco, e achareis” (Jo 21.6). Uma dica no lugar certo.",
  barco_pedro: "O barco de onde se ensinava a multidão na praia (Lc 5.3). Firme o bastante para esperar a resposta.",
  moeda_peixe: "Achada na boca do primeiro peixe que subiu (Mt 17.27). Paga a primeira dívida da batalha.",
  livrinho: "Doce na boca e amargo no ventre (Ap 10.9-10). Quem come o livro aprende mais.",
  espada_espirito: "“A espada do Espírito, que é a palavra de Deus” (Ef 6.17). A arma é o próprio texto.",
  escudo_fe: "“O escudo da fé, com o qual podereis apagar todos os dardos inflamados” (Ef 6.16).",
  capacete_salvacao: "“Tomai também o capacete da salvação” (Ef 6.17). Protege quem pensa.",
  couraca_justica: "“Vestida a couraça da justiça” (Ef 6.14). A cada vitória, o fôlego volta.",
  lencos_paulo: "Lenços e aventais levados do corpo de Paulo (At 19.12). Pequenos panos, grandes efeitos.",
  cesto_damasco: "Desceram Paulo pelo muro num cesto, de noite (At 9.25). A melhor fuga é a que ninguém vê.",
  capa_troade: "“Traze a capa que deixei em Trôade” (2Tm 4.13). Para o frio da prisão e para não desistir.",
  pergaminhos: "“E os livros, especialmente os pergaminhos” (2Tm 4.13). O último pedido de quem sabia ler.",
};

/* ================= Hebraico: fala do guardião e trecho da crônica ================= */
const HEBREW = {
  kelley_01: {
    taunt: "“Cortei o rolo de Jeremias coluna por coluna e o lancei no braseiro. Você nem conhece as letras que ele tinha.”",
    epilogue: "“Toma outro rolo e escreve nele todas as palavras que estavam no primeiro” (Jr 36.28). As vinte e duas letras voltam ao rolo, da direita para a esquerda.",
  },
  kelley_03: {
    taunt: "“É assim que Deus disse? Duvide de cada palavra, e nenhuma ficará com você.”",
    epilogue: "“E o homem deu nome a todos os animais” (Gn 2.20). Os primeiros substantivos voltam ao rolo, cada um com a sua raiz.",
  },
  kelley_05: {
    taunt: "“Fomos os valentes de antigamente, homens de renome. Quem ainda se lembra dos nossos nomes?”",
    epilogue: "“E a arca repousou sobre os montes de Ararate” (Gn 8.4). O artigo volta ao rolo, e cada coisa passa a ser aquela coisa.",
  },
  kelley_06: {
    taunt: "“Babel foi o princípio do meu reino. Aqui ninguém se entende: ligue as palavras, se puder.”",
    epilogue: "“Por isso se chamou o seu nome Babel” (Gn 11.9). Preposições e conectivos voltam ao rolo, e as palavras conseguem dar as mãos.",
  },
  kelley_07: {
    taunt: "“Terá me serviu além do rio. Conte quantos somos: um, dois, muitos.”",
    epilogue: "“Olha para os céus e conta as estrelas” (Gn 15.5). Masculino e feminino, singular, plural e dual voltam ao rolo.",
  },
  kelley_08: {
    taunt: "“Raquel me escondeu na sela do camelo. Sou pequeno, mas cada adjetivo errado me faz crescer.”",
    epilogue: "“E Jacó removeu a pedra da boca do poço” (Gn 29.10). Os adjetivos voltam ao rolo, cada um concordando com o seu substantivo.",
  },
  kelley_09: {
    taunt: "“Fiz-me rei em Siquém sobre os meus irmãos. Eu, tu, ele: quem manda aqui?”",
    epilogue: "“Eu e a minha casa serviremos ao SENHOR” (Js 24.15). Os pronomes voltam ao rolo, e cada frase ganha um dono.",
  },
  kelley_10: {
    taunt: "“Puseram-me em Betel: ‘Eis os teus deuses, ó Israel.’ Solte um elo da corrente e eu fico com a casa.”",
    epilogue: "“Este lugar não é outro senão a casa de Deus” (Gn 28.17). O construto volta ao rolo, e as palavras aprendem a pertencer umas às outras.",
  },
  kelley_11: {
    taunt: "“Escolham um homem que desça a mim! A minha lança é como o eixo do tecelão. Diga de quem é cada coisa.”",
    epilogue: "Uma pedra lisa do ribeiro bastou. Os sufixos voltam ao rolo: meu, teu, dele, nosso.",
  },
  kelley_12: {
    taunt: "“Moro nas águas e engulo o que já aconteceu. Diga quem fez, ou afunde.”",
    epilogue: "“E Deus ouviu o gemido deles e se lembrou da sua aliança” (Êx 2.24). O perfeito volta ao rolo, e a história pode ser contada.",
  },
  kelley_13: {
    taunt: "“Bebo um rio inteiro e não me apresso. Quem? O quê? Quantos? Responda antes que eu beba a fonte.”",
    epilogue: "“Lançou o lenho nas águas, e as águas se tornaram doces” (Êx 15.25). As perguntas e os números voltam ao rolo.",
  },
  kelley_14: {
    taunt: "“Sete cabeças, sete troncos. Sou o senhor do Devorador e vim levar o rolo de volta.”",
    epilogue: "O Grande Dragão caiu, e o Devorador do Esquecimento caiu com ele. Da boca dos dois saíram as frases que tinham engolido, e os sete troncos voltam ao rolo.",
  },
  kelley_15: {
    taunt: "“Vejo-o, mas não agora; contemplo-o, mas não de perto. Diga o que ainda vai acontecer, se souber.”",
    epilogue: "“Uma estrela procederá de Jacó” (Nm 24.17). O imperfeito Qal volta às margens do rolo.",
  },
  kelley_16: {
    taunt: "“Seis dias vocês rodaram e eu fiquei de pé. Diga como o verbo continua, ou continue rodando.”",
    epilogue: "“O povo gritou, e o muro caiu” (Js 6.20). O imperfeito dos demais troncos volta ao rolo.",
  },
  kelley_17: {
    taunt: "“Expulsei vocês uma vez. Quem perturbou quem? Diga a quem o verbo se refere.”",
    epilogue: "“Não temas, nem te espantes” (Js 8.1). Os sufixos no verbo voltam ao rolo.",
  },
  kelley_18: {
    taunt: "“Novecentos carros de ferro! Dê a ordem certa, ou o ribeiro leva você.”",
    epilogue: "“O ribeiro de Quisom os arrastou” (Jz 5.21). O imperativo, as proibições e o coortativo voltam ao rolo.",
  },
  kelley_19: {
    taunt: "“Caí uma vez e me levantaram. Para cair de novo, você precisa dizer para quê.”",
    epilogue: "“Eis que Dagom estava caído com o rosto em terra diante da arca” (1Sm 5.3). Os infinitivos voltam ao rolo.",
  },
  kelley_20: {
    taunt: "“Gritamos desde a manhã até o meio-dia. Diga quem está fazendo o quê, ou grite conosco.”",
    epilogue: "“O SENHOR é Deus! O SENHOR é Deus!” (1Rs 18.39). Os particípios voltam ao rolo.",
  },
  kelley_21: {
    taunt: "“Fui preparado para engolir, não para devolver. Conte a história em ordem e talvez eu a devolva.”",
    epilogue: "“E o SENHOR falou ao peixe, e ele vomitou Jonas na terra” (Jn 2.10). O vav consecutivo volta ao rolo, e a história volta a correr.",
  },
  kelley_22: {
    taunt: "“Subi, sitiei, e ninguém vem socorrer. O olho direito ou a palavra certa: escolha.”",
    epilogue: "“Amanhã, quando o sol aquecer, tereis socorro” (1Sm 11.9). Os verbos de primeira gutural voltam ao rolo.",
  },
  kelley_23: {
    taunt: "“Escrevi cartas em nome do rei. Leia o que está escrito, se o א não fugir de você.”",
    epilogue: "“Conforme a palavra do SENHOR” (2Rs 9.36). Os verbos de primeira א voltam ao rolo.",
  },
  kelley_24: {
    taunt: "“A cidade clama e eu não respondo. Pergunte, peça, clame: cada verbo tem uma garganta no meio.”",
    epilogue: "“Amanhã a esta hora uma medida de flor de farinha se venderá por um siclo” (2Rs 7.1). Os verbos de gutural no meio voltam ao rolo.",
  },
  licao_25: {
    taunt: "“Ouvi que os reis subiram. Mando a resposta do alto do muro.”",
    epilogue: "“E retiraram-se dele e voltaram para a sua terra” (2Rs 3.27). Os verbos de terceira gutural voltam ao rolo.",
  },
  licao_26: {
    taunt: "“Tomei todas as cidades fortes de Judá. O que vocês têm para me pagar?”",
    epilogue: "“Pequei; retira-te de mim” (2Rs 18.14). Os verbos de terceira א voltam ao rolo.",
  },
  licao_27: {
    taunt: "“Não vos engane Ezequias! Façam paz comigo, subam, vejam: eu sei os verbos de vocês.”",
    epilogue: "“Defenderei esta cidade, para a livrar” (2Rs 19.34). Os verbos de terceira ה voltam ao rolo.",
  },
  licao_28: {
    taunt: "“Dou e tiro reis. Onde está o נ do seu verbo?”",
    epilogue: "“E o povo da terra tomou Jeoacaz e o ungiu” (2Rs 23.30). Os verbos de primeira נ voltam ao rolo.",
  },
  licao_29: {
    taunt: "“Vim, cerquei, levei. Diga a raiz de cada verbo, se ela ainda tiver três letras.”",
    epilogue: "“E Joaquim mudou as vestes da sua prisão e comeu pão diante do rei todos os dias” (2Rs 25.29). Os verbos de letra do meio fraca voltam ao rolo.",
  },
  licao_30: {
    taunt: "“Vim de Babilônia para queimar. Saia pelo caminho que quiser: as palavras ficam.”",
    epilogue: "“As misericórdias do SENHOR são a causa de não sermos consumidos” (Lm 3.22). Os verbos de primeira י voltam ao rolo.",
  },
  licao_31: {
    taunt: "“Prostrem-se e esqueçam a canção de Sião. Quem se lembra de Jerusalém numa terra estranha?”",
    epilogue: "“Se eu me esquecer de ti, ó Jerusalém, esqueça-se a minha destra da sua destreza” (Sl 137.5). As últimas raízes voltam ao rolo.",
  },
};

/* ================= Grego ================= */
const GREEK = {
  bergmann_01: {
    taunt: "“Ide e informai-vos com cuidado. Eu também quero saber o que está escrito.”",
    epilogue: "“E tu, Belém, terra de Judá” (Mt 2.6). As vinte e quatro letras voltam ao Segundo Rolo.",
  },
  bergmann_02: {
    taunt: "“Se és aprendiz, diz que estas pedras se tornem palavras.”",
    epilogue: "“Não só de pão viverá o homem, mas de toda palavra que sai da boca de Deus” (Mt 4.4). O presente volta ao rolo.",
  },
  bergmann_03: {
    taunt: "“Que temos nós contigo? Para que vieste aqui?”",
    epilogue: "“Ele ordena até aos espíritos imundos, e eles lhe obedecem” (Mc 1.27). O subjuntivo volta ao rolo.",
  },
  bergmann_04: {
    taunt: "“O barco vai afundar. Vocês vão perecer. Quem vai acalmar o mar?”",
    epilogue: "“Cala-te, aquieta-te. E o vento cessou” (Mc 4.39). O futuro volta ao rolo.",
  },
  bergmann_05: {
    taunt: "“Legião é o meu nome, porque somos muitos. Diga o caso de cada um de nós.”",
    epilogue: "“Vai para tua casa, para os teus, e anuncia-lhes” (Mc 5.19). O artigo e a segunda declinação voltam ao rolo.",
  },
  bergmann_06: {
    taunt: "“Muitas vezes o lancei no fogo e na água. Ele não fala, e você?”",
    epilogue: "“Esta casta não sai senão por meio de oração” (Mc 9.29). A primeira declinação volta ao rolo.",
  },
  bergmann_07: {
    taunt: "“Quatro dias. Ninguém sai daqui.”",
    epilogue: "“Lázaro, vem para fora!” (Jo 11.43). O último inimigo a ser destruído é a morte (1Co 15.26). Os adjetivos voltam ao rolo.",
  },
  bergmann_08: {
    taunt: "“Vós nada sabeis. Convém que um morra por todos.”",
    epilogue: "“E não somente pela nação, mas para reunir em um só corpo os filhos de Deus” (Jo 11.52). As preposições voltam ao rolo.",
  },
  bergmann_09: {
    taunt: "“Aquele que eu beijar, esse é. Quem é quem nesta noite?”",
    epilogue: "“Amigo, a que vieste?” (Mt 26.50). Os pronomes voltam ao rolo.",
  },
  bergmann_10: {
    taunt: "“Eu iludia, eles ouviam. Quanto custa a sua palavra?”",
    epilogue: "“O teu dinheiro seja contigo para perdição” (At 8.20). O imperfeito e os verbos defectivos voltam ao rolo.",
  },
  bergmann_11: {
    taunt: "“Prendi, guardei, vigiei. Como saiu daqui o meu preso?”",
    epilogue: "“E a palavra de Deus crescia e se multiplicava” (At 12.24). O segundo aoristo volta ao rolo.",
  },
  bergmann_12: {
    taunt: "“Desviei o procônsul uma vez. Você vai crer no que lê?”",
    epilogue: "“Então o procônsul creu, maravilhado da doutrina do Senhor” (At 13.12). O primeiro aoristo volta ao rolo.",
  },
  bergmann_13: {
    taunt: "“Estes homens anunciam um caminho. Eu adivinho o seu: o genitivo vai traí-lo.”",
    epilogue: "“E na mesma hora saiu” (At 16.18). A terceira declinação volta ao rolo.",
  },
  bergmann_14: {
    taunt: "“Somos de ouro, de prata e de pedra. Enquanto você olha, a cidade nos adora.”",
    epilogue: "“Nele vivemos, e nos movemos, e existimos” (At 17.28). O particípio presente volta ao rolo.",
  },
  bergmann_15: {
    taunt: "“Grande é a Ártemis dos efésios! Duas horas de grito, e ninguém ouviu o que você disse.”",
    epilogue: "“Assim a palavra do Senhor crescia poderosamente e prevalecia” (At 19.20). O particípio aoristo e o genitivo absoluto voltam ao rolo.",
  },
  bergmann_16: {
    taunt: "“Quem é você? O que fez? Batam-lhe na boca!”",
    epilogue: "“Tem bom ânimo; porque, como de mim testificaste em Jerusalém, assim importa que testifiques também em Roma” (At 23.11). Interrogativos, indefinidos e reflexivos voltam ao rolo.",
  },
  bergmann_17: {
    taunt: "“Excelentíssimo governador! O que está feito está feito, e eu tenho os autos.”",
    epilogue: "“Apelo para César” (At 25.11). O perfeito e o mais-que-perfeito voltam ao rolo.",
  },
  bergmann_18: {
    taunt: "“Catorze noites sem sol nem estrelas. Mande no vento, se puder.”",
    epilogue: "“E assim aconteceu que todos chegaram à terra a salvo” (At 27.44). O imperativo e o optativo voltam ao rolo.",
  },
  bergmann_19: {
    taunt: "“Saí do fogo e mordi. Agora é só esperar… ou não?”",
    epilogue: "“Ele, porém, sacudindo o réptil no fogo, não sofreu mal nenhum” (At 28.5). O infinitivo volta ao rolo.",
  },
  bergmann_20: {
    taunt: "“O meu nome em hebraico é Abadom, e em grego, Apoliom. Conjugue-me, se tiver coragem.”",
    epilogue: "“E foi-lhes dito que não fizessem dano à erva da terra” (Ap 9.4). Os verbos contraídos e os verbos em ‑μι voltam ao rolo.",
  },
  bergmann_21: {
    taunt: "“Um, dois, três. Contamos os reis, e você conta as palavras?”",
    epilogue: "“Eis que venho como ladrão. Bem-aventurado aquele que vigia” (Ap 16.15). O artigo e os numerais voltam ao rolo.",
  },
  bergmann_22: {
    taunt: "“Quem é semelhante à besta? Quem poderá batalhar contra ela?”",
    epilogue: "Eles o venceram pelo sangue do Cordeiro e pela palavra do seu testemunho (Ap 12.11). A vitória é do Cordeiro; o escriba venceu as perguntas e leu o texto. As orações condicionais e as partículas voltam ao rolo.",
  },
};

const GENERIC = {
  taunt: "“O Devorador me deixou aqui para guardar esta página. Diga as palavras dela, uma por uma.”",
  epilogue: "A página acrescentada volta ao rolo, costurada depois da última.",
};

/**
 * Textos da história para um capítulo; capítulos criados pelo aluno recebem os genéricos
 * @param {string} language 'hebrew' ou 'greek'
 * @param {string} chapterId
 * @returns {{taunt: string, epilogue: string}}
 */
function forChapter(language, chapterId) {
  const table = language === "greek" ? GREEK : HEBREW;
  return table[chapterId] || GENERIC;
}

/**
 * Prólogo e final de um livro
 * @param {string} language
 * @param {number} book
 * @returns {{prologue: {title: string, paragraphs: Array<string>}, ending: {title: string, paragraphs: Array<string>}}|null}
 */
function forBook(language, book) {
  const table = BOOKS[language === "greek" ? "greek" : "hebrew"];
  return table[book] || table[1] || null;
}

const ScribeLore = { VILLAIN, BOOKS, PROLOGUE, ENDING, CLASS_LORE, RELIC_LORE, HEBREW, GREEK, GENERIC, forChapter, forBook };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeLore = ScribeLore;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeLore;
}
})();
