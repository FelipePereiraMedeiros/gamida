/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Crônicas do Escriba: conteúdo da campanha
 * ==========================================================================
 * Um capítulo da aventura para cada lição do Gamida, nos dois idiomas:
 * cidade, guardião, uma linha de história e o pergaminho que ensina a
 * gramática da lição antes da batalha. As palavras e as frases das batalhas
 * vêm dos dados das lições, não deste arquivo.
 *
 * Nos textos dos pergaminhos, trechos em hebraico ou grego são detectados
 * pelo alfabeto e recebem a fonte do idioma na hora de exibir.
 */

(function () {
/* ================= Classes e relíquias ================= */
const CLASSES = {
  mago: {
    name: "Mago",
    desc: "Lê as palavras como quem lê o céu. Mais tempo para golpes críticos e uma revelação grátis por batalha.",
    hp: [78, 10], crit: 6.5, armor: 0, dodge: 0, hints: 1,
    perks: ["Janela de crítico: 6,5 s", "1 dica grátis por batalha", "Vida baixa"],
  },
  cavaleiro: {
    name: "Cavaleiro",
    desc: "Armadura pesada e paciência. Aguenta mais erros e sofre menos dano.",
    hp: [112, 15], crit: 5, armor: 0.25, dodge: 0, hints: 0,
    perks: ["Vida alta", "−25% de dano recebido", "Janela de crítico: 5 s"],
  },
  assassino: {
    name: "Assassino",
    desc: "Rápido e esquivo. Críticos rendem mais XP e um em cada cinco golpes inimigos erra.",
    hp: [90, 12], crit: 4, armor: 0, dodge: 0.2, hints: 0, critXP: 6,
    perks: ["20% de esquiva", "+6 XP por crítico", "Janela de crítico: 4 s"],
  },
};

// Cada classe encontra quatro relíquias ao longo da campanha (slot 0 a 3)
const RELICS = [
  { id: "vara_arao", cls: "mago", slot: 0, name: "Vara de Arão", ref: "Nm 17.8", desc: "+1 dica grátis por batalha", fx: { hints: 1 } },
  { id: "cajado_moises", cls: "mago", slot: 1, name: "Cajado de Moisés", ref: "Êx 14.16", desc: "+2 s na janela de crítico", fx: { crit: 2 } },
  { id: "urim", cls: "mago", slot: 2, name: "Urim e Tumim", ref: "Êx 28.30", desc: "O primeiro erro de cada batalha não causa dano", fx: { ward: 1 } },
  { id: "tabuas", cls: "mago", slot: 3, name: "Tábuas da Lei", ref: "Êx 31.18", desc: "+25% de XP", fx: { xp: 0.25 } },
  { id: "lanca_josue", cls: "cavaleiro", slot: 0, name: "Lança de Josué", ref: "Js 8.18", desc: "+1 s na janela de crítico", fx: { crit: 1 } },
  { id: "escudo_abraao", cls: "cavaleiro", slot: 1, name: "Escudo de Abraão", ref: "Gn 15.1", desc: "−15% de dano recebido", fx: { armor: 0.15 } },
  { id: "espada_golias", cls: "cavaleiro", slot: 2, name: "Espada de Golias", ref: "1Sm 21.9", desc: "+40 de vida máxima", fx: { hp: 40 } },
  { id: "trombeta_sinai", cls: "cavaleiro", slot: 3, name: "Trombeta do Sinai", ref: "Êx 19.16", desc: "Cura 12 de vida a cada criatura vencida", fx: { regen: 12 } },
  { id: "funda_davi", cls: "assassino", slot: 0, name: "Funda de Davi", ref: "1Sm 17.49", desc: "+6 XP extra por crítico", fx: { critXP: 6 } },
  { id: "punhal_eude", cls: "assassino", slot: 1, name: "Punhal de Eúde", ref: "Jz 3.16", desc: "+10% de esquiva", fx: { dodge: 0.1 } },
  { id: "cordao_raabe", cls: "assassino", slot: 2, name: "Cordão escarlate de Raabe", ref: "Js 2.18", desc: "Uma ressurreição por capítulo", fx: { revive: 1 } },
  { id: "manto_elias", cls: "assassino", slot: 3, name: "Manto de Elias", ref: "2Rs 2.13", desc: "+10% de esquiva e +1 dica por batalha", fx: { dodge: 0.1, hints: 1 } },
];
// Em que ponto da campanha cada relíquia aparece (fração do caminho)
const RELIC_MILESTONES = [0.2, 0.4, 0.7, 1];

/* ================= Hebraico: de Éden a Jerusalém ================= */
const HEBREW = {
  kelley_01: {
    city: "Quedem", native: "קֶדֶם", scene: "dunes", boss: "Guardião das Letras",
    story: "Antes das palavras vieram as letras. A leste do jardim, vinte e duas criaturas guardam a porta do rolo.",
    scroll: {
      t: "O alfabeto: 22 consoantes",
      p: [
        "O hebraico se escreve da direita para a esquerda, só com consoantes. As vogais são os pontinhos acrescentados depois.",
        "Cinco letras mudam de forma no fim da palavra: ך ם ן ף ץ.",
        "Seis letras (ב ג ד כ פ ת) têm som duro quando levam um ponto dentro, o dagesh. As guturais א ה ח ע (e o ר) nunca levam dagesh.",
      ],
      tip: "Cuidado com as parecidas: ב e כ · ד e ר · ה e ח · ו, ז e ן · ס e ם.",
    },
  },
  kelley_03: {
    city: "Éden", native: "עֵדֶן", scene: "garden", boss: "Guardião do Jardim",
    story: "O rolo do mestre Kelley se rasgou e as palavras fugiram como criaturas. A primeira trilha começa no jardim.",
    scroll: {
      t: "Raízes: o esqueleto das palavras",
      p: ["Quase toda palavra hebraica nasce de uma raiz de 3 consoantes. As vogais (os pontinhos) e as letras extras dão o sentido exato."],
      rows: [["מלך", "raiz “reinar”"], ["מֶלֶךְ", "rei"], ["מָלַךְ", "ele reinou"], ["מַלְכוּת", "reino"]],
      after: ["Substantivos femininos costumam terminar em ־ָה: אִשָּׁה mulher, שָׁנָה ano."],
      tip: "וְ colado no começo da palavra é o conectivo “e”: וְאִשָּׁה = e mulher.",
    },
  },
  kelley_05: {
    city: "Ararate", native: "אֲרָרָט", scene: "mountain", boss: "Sentinela do Monte",
    story: "As criaturas subiram as encostas do Ararate. Lá em cima, o artigo esconde quem é quem.",
    scroll: {
      t: "O artigo הַ",
      p: ["O hebraico tem só o artigo definido: הַ + dagesh (pontinho) na letra seguinte. Não existe “um/uma”: sem artigo, traduza com “um”."],
      rows: [["מֶלֶךְ", "um rei"], ["הַמֶּלֶךְ", "o rei"], ["הָאָרֶץ", "a terra (antes de א ע ר vira הָ)"]],
      after: ["Com preposição, o ה some e deixa a vogal: בַּבַּיִת “na casa”, לַמֶּלֶךְ “ao rei”."],
      tip: "Sem artigo = “um/uma”. Com artigo = “o/a”.",
    },
  },
  kelley_06: {
    city: "Babel", native: "בָּבֶל", scene: "tower", boss: "Arquiteto de Babel",
    story: "Na torre de Babel as palavras se misturam. Preposições e conectivos ligam tudo.",
    scroll: {
      t: "Preposições e conectivos",
      p: [
        "Preposições coladas: בְּ em · לְ para, a · כְּ como. Soltas: מִן de · עִם com · עַל sobre · אֶל para · בֵּין entre · לִפְנֵי diante de.",
        "מִן encurta: מִ + dagesh (מִיַּד da mão).",
        "O conectivo וְ muda de forma: וּ antes de ב, מ, פ e de shevá · וַ antes de אֲ · וֵ antes de אֱ. Sempre “e” (às vezes “mas”).",
      ],
      tip: "אֵין = “não há”. לֹא = “não” (nega o verbo).",
    },
  },
  kelley_07: {
    city: "Ur", native: "אוּר", scene: "ziggurat", boss: "Sacerdote de Ur",
    story: "Em Ur, as criaturas se multiplicaram: agora vêm em pares e bandos.",
    scroll: {
      t: "Gênero e número",
      rows: [["masculino plural", "־ִים", "סוּסִים"], ["feminino plural", "־וֹת", "סוּסוֹת"], ["dual (pares)", "־ַיִם", "עֵינַיִם"]],
      after: ["Irregulares frequentes: אָבוֹת pais (masculino com ־וֹת) · נָשִׁים mulheres · בָּנִים filhos."],
      tip: "מַיִם (água) e שָׁמַיִם (céu) têm forma de dual, mas não são “pares”.",
    },
  },
  kelley_08: {
    city: "Harã", native: "חָרָן", scene: "well", boss: "Mercador de Harã",
    story: "No poço de Harã as palavras ganharam adjetivos: grandes, maus, sábios.",
    scroll: {
      t: "Adjetivos: atributivo × predicativo",
      p: [
        "Atributivo (descreve): vem depois do substantivo e copia o artigo. הַמֶּלֶךְ הַטּוֹב = o rei bom.",
        "Predicativo (afirma): sem artigo, geralmente antes. Traduza com “é”. טוֹב הַמֶּלֶךְ = o rei é bom.",
      ],
      tip: "O adjetivo concorda em gênero: רוּחַ רָעָה (espírito é feminino).",
    },
  },
  kelley_09: {
    city: "Siquém", native: "שְׁכֶם", scene: "hills", boss: "Juiz de Siquém",
    story: "Em Siquém as criaturas falam em primeira pessoa e apontam: este, aquele, nós.",
    scroll: {
      t: "Pronomes e demonstrativos",
      p: [
        "אֲנִי eu · אַתָּה tu · הוּא ele · הִיא ela · אֲנַחְנוּ nós · אַתֶּם vós · הֵם eles",
        "זֶה este · זֹאת esta · אֵלֶּה estes · הַהוּא aquele",
      ],
      rows: [["הַדְּבָרִים הָאֵלֶּה", "estas palavras (artigo nos dois)"], ["אֵלֶּה הַדְּבָרִים", "estas são as palavras (sem artigo, antes)"]],
      tip: "הוּא sem artigo = “ele”. Com artigo depois de substantivo = “aquele”.",
    },
  },
  kelley_10: {
    city: "Betel", native: "בֵּית־אֵל", scene: "pillar", boss: "Vigia da Escada",
    story: "Em Betel as palavras se prendem umas às outras em correntes: o construto.",
    scroll: {
      t: "Estado construto: “X de Y”",
      p: ["Duas palavras grudadas formam “X de Y”. A primeira muda de forma e nunca tem artigo; a última define a cadeia."],
      rows: [["בָּנִים ← בְּנֵי", "־ִים vira ־ֵי"], ["תּוֹרָה ← תּוֹרַת", "־ָה vira ־ַת"], ["דָּבָר ← דְּבַר", "as vogais encurtam"]],
      tip: "Terminou em ־ֵי antes de outro substantivo? É plural: עַבְדֵי הַמֶּלֶךְ = os servos do rei.",
    },
  },
  kelley_11: {
    city: "Hebrom", native: "חֶבְרוֹן", scene: "tents", boss: "Patriarca de Hebrom",
    story: "Nas tendas de Hebrom tudo tem dono: meu, teu, dele, nosso.",
    scroll: {
      t: "Sufixos: os pronomes colados",
      rows: [
        ["", "com singular", "com plural (yod)"],
        ["meu", "־ִי", "־ַי"], ["teu", "־ְךָ", "־ֶיךָ"], ["dele", "־וֹ", "־ָיו"],
        ["nosso", "־נוּ", "־ֵינוּ"], ["vosso", "־כֶם", "־ֵיכֶם"], ["deles", "־הֶם", "־ֵיהֶם"],
      ],
      after: ["לְ + sufixo = posse: לִי meu, לָנוּ nosso."],
      tip: "אֹתוֹ (com o) = “o”, objeto · אִתּוֹ (com i) = “com ele”.",
    },
  },
  kelley_12: {
    city: "Egito", native: "מִצְרַיִם", scene: "pyramids", boss: "Faraó das Raízes",
    story: "No Egito as palavras começaram a agir: os verbos despertaram.",
    scroll: {
      t: "O verbo: perfeito Qal",
      p: ["Perfeito = ação completa (passado). A desinência diz quem fez:"],
      rows: [
        ["ele", "שָׁמַר", "—"], ["ela", "שָׁמְרָה", "־ָה"], ["tu", "שָׁמַרְתָּ", "־תָּ"], ["eu", "שָׁמַרְתִּי", "־תִּי"],
        ["eles", "שָׁמְרוּ", "־וּ"], ["vós", "שְׁמַרְתֶּם", "־תֶּם"], ["nós", "שָׁמַרְנוּ", "־נוּ"],
      ],
      tip: "וְ + perfeito no começo da frase costuma ser futuro: וְשָׁמַר = e guardará.",
    },
  },
  kelley_13: {
    city: "Mara", native: "מָרָה", scene: "spring", boss: "Esfinge das Perguntas",
    story: "Em Mara as águas eram amargas, e as criaturas só falam por perguntas.",
    scroll: {
      t: "Perguntas e números",
      p: [
        "הֲ pergunta sim/não · הֲלֹא “não…?” · מִי quem · מָה o quê · אַיֵּה onde · אֵיךְ como · מֵאַיִן de onde",
        "Ordinais terminam em ־ִי: שְׁבִיעִי sétimo.",
      ],
      tip: "הֲ (vogal curta, sem dagesh) = pergunta · הַ + dagesh = artigo.",
    },
  },
  kelley_14: {
    city: "Sinai", native: "סִינַי", scene: "sinai", boss: "Dragão dos Sete Troncos",
    story: "No Sinai a raiz se transforma: a mesma palavra muda de força conforme o tronco.",
    scroll: {
      t: "Os 7 troncos verbais",
      rows: [
        ["Qal", "שָׁמַר", "simples"], ["Nifal", "נִשְׁמַר", "נִ antes = passivo"], ["Piel", "דִּבֵּר", "i + dagesh no meio"],
        ["Pual", "בֻּקַּשׁ", "u + dagesh = passivo do Piel"], ["Hitpael", "הִתְהַלֵּךְ", "הִתְ = reflexivo"],
        ["Hifil", "הִבְדִּיל", "הִ + י = causativo"], ["Hofal", "הָמְלַךְ", "הָ (ho) = passivo do Hifil"],
      ],
      tip: "Conte as letras: 3 = Qal/Piel/Pual · נ+3 = Nifal · ה+3 = Hifil/Hofal · הת+3 = Hitpael. Raiz que começa com נ ou ה (נָפַל, הָלַךְ) é Qal.",
    },
  },
  kelley_15: {
    city: "Cades", native: "קָדֵשׁ", scene: "dunes", boss: "Espia do Deserto",
    story: "Em Cades o povo olha para a frente. As criaturas agora falam do que ainda vai acontecer.",
    scroll: {
      t: "Imperfeito Qal: os prefixos",
      p: ["Imperfeito = ação incompleta: futuro, costume ou desejo. Quem age aparece no prefixo (e às vezes no sufixo):"],
      rows: [
        ["ele", "יִשְׁמֹר"], ["ela / tu (m.)", "תִּשְׁמֹר"], ["tu (f.)", "תִּשְׁמְרִי"], ["eu", "אֶשְׁמֹר"],
        ["eles", "יִשְׁמְרוּ"], ["vós", "תִּשְׁמְרוּ"], ["nós", "נִשְׁמֹר"],
      ],
      tip: "Os quatro prefixos são א י ת נ. O perfeito marca a pessoa no fim; o imperfeito, no começo.",
    },
  },
  kelley_16: {
    city: "Moabe", native: "מוֹאָב", scene: "hills", boss: "Vidente de Moabe",
    story: "Das colinas de Moabe se vê a terra inteira. Cada tronco tem o seu jeito de falar do futuro.",
    scroll: {
      t: "Imperfeito nos demais troncos",
      rows: [
        ["Nifal", "יִשָּׁמֵר", "dagesh na 1ª letra da raiz"], ["Piel", "יְדַבֵּר", "shevá no prefixo + dagesh no meio"],
        ["Pual", "יְדֻבַּר", "shevá no prefixo + u"], ["Hitpael", "יִתְהַלֵּךְ", "יִתְ antes da raiz"],
        ["Hifil", "יַבְדִּיל", "a no prefixo + י"], ["Hofal", "יָבְדַּל", "o no prefixo"],
      ],
      tip: "Olhe a vogal do prefixo: shevá = Piel ou Pual · patah = Hifil · hireq = Qal, Nifal ou Hitpael.",
    },
  },
  kelley_17: {
    city: "Jordão", native: "יַרְדֵּן", scene: "sea", boss: "Barqueiro do Jordão",
    story: "Na travessia do Jordão ninguém vai sozinho: o verbo carrega o seu objeto nas costas.",
    scroll: {
      t: "Sufixos pronominais no verbo",
      p: ["O objeto direto pode vir colado ao verbo. No perfeito Qal, 3ª pessoa:"],
      rows: [
        ["guardou-me", "שְׁמָרַנִי"], ["guardou-te", "שְׁמָרְךָ"], ["guardou-o", "שְׁמָרוֹ"],
        ["guardou-a", "שְׁמָרָהּ"], ["guardou-nos", "שְׁמָרָנוּ"], ["guardou-os", "שְׁמָרָם"],
      ],
      after: ["O mesmo sentido com a marca de objeto: אֹתִי, אֹתְךָ, אֹתוֹ."],
      tip: "־נִי no verbo = “me”. ־ִי no substantivo = “meu”.",
    },
  },
  kelley_18: {
    city: "Jericó", native: "יְרִיחוֹ", scene: "walls", boss: "Arauto das Trombetas",
    story: "Diante de Jericó só se ouvem ordens: marchem, toquem, gritem.",
    scroll: {
      t: "Imperativo e proibições",
      p: ["O imperativo é o imperfeito de 2ª pessoa sem o prefixo:"],
      rows: [["tu (m.)", "שְׁמֹר"], ["tu (f.)", "שִׁמְרִי"], ["vós (m.)", "שִׁמְרוּ"], ["vós (f.)", "שְׁמֹרְנָה"]],
      after: [
        "O imperativo nunca é negado. Proibição permanente: לֹא + imperfeito (לֹא תִּגְנֹב, não furtarás). Proibição imediata: אַל + imperfeito (אַל־תִּירָא, não temas).",
        "Coortativo (1ª pessoa, com ־ָה): אֶשְׁמְרָה, “que eu guarde”.",
      ],
      tip: "נָא depois do verbo suaviza a ordem: “por favor”.",
    },
  },
  kelley_19: {
    city: "Gilgal", native: "גִּלְגָּל", scene: "pillar", boss: "Guardião das Doze Pedras",
    story: "Em Gilgal doze pedras lembram o que foi feito. Aqui o verbo vira nome.",
    scroll: {
      t: "Infinitivo construto e absoluto",
      p: [
        "Construto (שְׁמֹר): o “guardar”. Recebe preposições e sufixos: לִשְׁמֹר para guardar · בִּשְׁמֹר ao guardar · בְּשָׁמְרוֹ quando ele guardou.",
        "Absoluto (שָׁמוֹר): reforça um verbo da mesma raiz. שָׁמוֹר תִּשְׁמֹר = certamente guardarás · מוֹת תָּמוּת = certamente morrerás.",
      ],
      tip: "לְ + infinitivo construto quase sempre indica finalidade: “para…”.",
    },
  },
  kelley_20: {
    city: "Siló", native: "שִׁלֹה", scene: "tabernacle", boss: "Sacerdote de Siló",
    story: "No tabernáculo de Siló o serviço nunca para: há sempre alguém guardando, servindo, cantando.",
    scroll: {
      t: "Particípios",
      p: ["O particípio é um adjetivo verbal: descreve quem está fazendo (ativo) ou o que foi feito (passivo)."],
      rows: [
        ["Qal ativo", "שֹׁמֵר", "que guarda, guardando"], ["feminino", "שֹׁמֶרֶת", ""], ["plural", "שֹׁמְרִים", ""],
        ["Qal passivo", "שָׁמוּר", "guardado (בָּרוּךְ bendito)"],
      ],
      after: ["Nos outros troncos começa com מ: מְדַבֵּר (Piel), מַבְדִּיל (Hifil), מִתְהַלֵּךְ (Hitpael). O Nifal usa נ: נִשְׁמָר."],
      tip: "Holem logo depois da 1ª consoante é a marca do particípio ativo do Qal. Com artigo vira substantivo: הַשֹּׁמֵר, o guarda.",
    },
  },
  kelley_21: {
    city: "Belém", native: "בֵּית־לֶחֶם", scene: "hills", boss: "Ceifeiro de Belém",
    story: "Nos campos de Belém as histórias se contam em fila: e foi, e viu, e disse.",
    scroll: {
      t: "O vav consecutivo",
      p: [
        "Na narrativa, וַ + dagesh + imperfeito conta o passado em sequência: וַיֹּאמֶר e disse · וַיִּשְׁמֹר e guardou.",
        "E וְ + perfeito continua um futuro ou uma ordem: וְשָׁמַרְתָּ e guardarás.",
        "A cadeia começa com uma forma e segue com a outra: perfeito → vav + imperfeito; imperfeito → vav + perfeito.",
      ],
      tip: "וַיְהִי = “e aconteceu”. É assim que muitas histórias começam.",
    },
  },
  kelley_22: {
    city: "Gibeá", native: "גִּבְעָה", scene: "tents", boss: "Lanceiro de Gibeá",
    story: "Em Gibeá as raízes começam a tropeçar: a primeira letra é gutural e não aceita as regras de sempre.",
    scroll: {
      t: "Verbos fracos: Pe Gutural",
      p: ["A 1ª letra da raiz é א ה ח ע. A gutural não aceita shevá simples nem dagesh:"],
      rows: [
        ["shevá composto", "עָמַד ← יַעֲמֹד", "prefixo com a"], ["verbo de estado", "חָזַק ← יֶחֱזַק", "prefixo com e"],
        ["sem dagesh (Nifal)", "יֵעָמֵד", "a vogal do prefixo alonga"], ["perfeito, vós", "עֲמַדְתֶּם", "shevá composto"],
      ],
      tip: "Vogal “cheia” no prefixo e um shevá composto logo depois? A raiz começa com gutural.",
    },
  },
  kelley_23: {
    city: "Ramá", native: "רָמָה", scene: "mountain", boss: "Profeta de Ramá",
    story: "Em Ramá mora o profeta: “assim disse”. O verbo dizer é o rei desta montanha.",
    scroll: {
      t: "Verbos fracos: Pe Alef",
      p: [
        "Cinco verbos com א inicial (אָמַר dizer, אָכַל comer, אָבַד perecer, אָבָה querer, אָפָה assar) fazem o imperfeito Qal com o no prefixo, e o א fica mudo: יֹאמַר, יֹאכַל.",
        "Na 1ª pessoa sobra um só א: אֹמַר, direi. Com vav consecutivo: וַיֹּאמֶר, e disse.",
        "Os outros verbos com א inicial seguem a regra das guturais: יֶאֱסֹף.",
      ],
      tip: "וַיֹּאמֶר é a forma verbal mais comum da Bíblia Hebraica. Decore-a.",
    },
  },
  kelley_24: {
    city: "Elá", native: "אֵלָה", scene: "hills", boss: "Gigante do Vale",
    story: "No vale de Elá o gigante desafia: a gutural está no meio da raiz e não se dobra.",
    scroll: {
      t: "Verbos fracos: Ayin Gutural",
      p: ["A 2ª letra da raiz é gutural (ou ר). Ela não aceita o dagesh do Piel, do Pual e do Hitpael:"],
      rows: [
        ["a vogal alonga", "בֵּרַךְ · יְבָרֵךְ", "Piel: abençoou, abençoará"], ["Pual", "בֹּרַךְ", "foi abençoado"],
        ["ou nada muda", "נִחַם", "dagesh “implícito”"], ["shevá composto", "שָׁאֲלוּ · יִשְׁאֲלוּ", "sob a gutural"],
      ],
      after: ["No imperfeito Qal a gutural prefere a: יִשְׁאַל."],
      tip: "Piel sem dagesh no meio? Veja se a letra do meio é gutural ou ר.",
    },
  },
  licao_25: {
    city: "Adulão", native: "עֲדֻלָּם", scene: "mountain", boss: "Fugitivo da Caverna",
    story: "Na caverna de Adulão a gutural se esconde no fundo da raiz e puxa um “a” para perto de si.",
    scroll: {
      t: "Verbos fracos: Lamed Gutural",
      p: ["A 3ª letra da raiz é ח ou ע. A gutural quer um a antes dela:"],
      rows: [
        ["imperfeito Qal", "יִשְׁלַח · יִשְׁמַע", "a em vez de o"], ["patah furtivo", "שֹׁלֵחַ · שָׁלוּחַ", "depois de vogal longa"],
        ["infinitivo", "לִשְׁמֹעַ", "para ouvir"], ["perfeito, tu (f.)", "שָׁלַחַתְּ", ""],
      ],
      tip: "O patah furtivo se lê antes da gutural: רוּחַ é “rúach”.",
    },
  },
  licao_26: {
    city: "En-Gedi", native: "עֵין גֶּדִי", scene: "spring", boss: "Caçador de En-Gedi",
    story: "Nas fontes de En-Gedi o א final cala: está escrito, mas ninguém o ouve.",
    scroll: {
      t: "Verbos fracos: Lamed Alef",
      p: ["A 3ª letra da raiz é א. No fim da sílaba ele fica mudo e a vogal anterior alonga:"],
      rows: [
        ["perfeito", "מָצָא", "encontrou"], ["tu / eu", "מָצָאתָ · מָצָאתִי", "ת sem dagesh"],
        ["imperfeito", "יִמְצָא", ""], ["infinitivo", "לִמְצֹא", ""], ["particípio", "מֹצֵא", ""],
      ],
      tip: "Depois do א mudo, o ת das desinências perde o dagesh.",
    },
  },
  licao_27: {
    city: "Sião", native: "צִיּוֹן", scene: "walls", boss: "Sentinela de Sião",
    story: "Nos muros de Sião constrói-se e sobe-se. Os verbos mais usados da língua terminam em ה.",
    scroll: {
      t: "Verbos fracos: Lamed He",
      p: ["O ה final é só uma letra-vogal: a raiz antiga terminava em י, que reaparece antes das desinências."],
      rows: [
        ["perfeito", "גָּלָה · גָּלִיתָ · גָּלוּ", "o י volta"], ["imperfeito", "יִגְלֶה · יִגְלוּ", "termina em ־ֶה"],
        ["forma curta", "וַיִּבֶן · וַיַּעַשׂ · וַיַּרְא", "com vav consecutivo"], ["infinitivo", "לִבְנוֹת · לִרְאוֹת", "termina em ־וֹת"],
      ],
      tip: "Só duas consoantes visíveis depois de וַיּ? Procure um Lamed He: וַיַּרְא vem de רָאָה.",
    },
  },
  licao_28: {
    city: "Gibeão", native: "גִּבְעוֹן", scene: "tabernacle", boss: "Sábio de Gibeão",
    story: "Em Gibeão pede-se sabedoria e ela é dada. Mas o נ do começo da raiz some sem aviso.",
    scroll: {
      t: "Verbos fracos: Pe Nun",
      p: ["O נ inicial, quando fica sem vogal, é assimilado pela letra seguinte e vira um dagesh:"],
      rows: [
        ["imperfeito", "נָפַל ← יִפֹּל", "cair"], ["imperativo", "נָגַשׁ ← גַּשׁ", "o נ cai"],
        ["dar", "יִתֵּן · תֵּן · תֵּת", "de נָתַן"], ["tomar", "יִקַּח · קַח", "לָקַח imita os Pe Nun"],
        ["Hifil", "הִגִּיד · הִצִּיל", "contou, livrou"],
      ],
      tip: "Dagesh na 1ª letra depois do prefixo e só duas letras de raiz? Suspeite de um נ assimilado.",
    },
  },
  licao_29: {
    city: "Carmelo", native: "כַּרְמֶל", scene: "mountain", boss: "Profeta do Fogo",
    story: "No Carmelo o fogo consome tudo, até a letra do meio. Sobram raízes de duas consoantes.",
    scroll: {
      t: "Verbos fracos: Ayin Vav e Ayin Yod",
      p: ["A letra do meio é ו ou י e desaparece em quase todas as formas. O dicionário cita o infinitivo: קוּם levantar, שִׂים pôr, בּוֹא vir."],
      rows: [
        ["perfeito", "קָם · קָמָה · קַמְתָּ", "levantou-se"], ["imperfeito", "יָקוּם · יָשִׂים · יָבוֹא", ""],
        ["vav consecutivo", "וַיָּקָם", "e levantou-se"], ["Hifil", "הֵקִים · יָקִים", "fez levantar"],
      ],
      tip: "No Qal, particípio e perfeito são iguais: קָם pode ser “levantou-se” ou “que se levanta”. מֵת = morreu.",
    },
  },
  licao_30: {
    city: "Samaria", native: "שֹׁמְרוֹן", scene: "walls", boss: "Rei de Samaria",
    story: "Em Samaria os reis sentam, saem e descem. O י do começo da raiz não fica para ver.",
    scroll: {
      t: "Verbos fracos: Pe Vav e Pe Yod",
      p: ["A raiz começa com י (antigo ו). No imperfeito, no imperativo e no infinitivo do Qal ele cai:"],
      rows: [
        ["sentar", "יָשַׁב ← יֵשֵׁב · שֵׁב · שֶׁבֶת", ""], ["saber", "יָדַע ← יֵדַע · דַּע · דַּעַת", ""],
        ["sair", "יָצָא ← יֵצֵא · צֵא · צֵאת", ""], ["andar", "הָלַךְ ← יֵלֵךְ · לֵךְ · לֶכֶת", "imita os Pe Vav"],
      ],
      after: ["No Nifal e no Hifil o ו antigo reaparece: נוֹלַד nasceu · הוֹשִׁיב fez sentar · הוֹצִיא fez sair."],
      tip: "Prefixo com e longo e só duas letras depois (יֵשֵׁב, יֵלֵךְ)? É Pe Vav.",
    },
  },
  licao_31: {
    city: "Jerusalém", native: "יְרוּשָׁלַיִם", scene: "temple", boss: "Leviatã do Rolo",
    story: "Em Jerusalém o rolo quase se fecha. O último guardião tem raízes dobradas e todas as lições na memória.",
    scroll: {
      t: "Verbos fracos: Ayin Duplo",
      p: ["A 2ª e a 3ª letras da raiz são iguais (סבב, rodear). As duas se fundem numa só, e o dagesh aparece quando há desinência:"],
      rows: [
        ["perfeito", "סָבַב ou סַב · סַבּוֹתָ · סַבּוּ", "vogal de ligação וֹ"], ["imperfeito", "יָסֹב ou יִסֹּב", ""],
        ["Hifil", "הֵסֵב · יָסֵב", "fez rodear"], ["nomes", "רַב · רַבִּים — עַם · עַמִּים", "o dagesh volta no plural"],
      ],
      tip: "Raiz de duas letras com dagesh na segunda quando há sufixo? É Ayin Duplo.",
    },
  },
};

/* ================= Grego: de Belém a Patmos ================= */
const GREEK = {
  bergmann_01: {
    city: "Belém", native: "Βηθλέεμ", scene: "hills", boss: "Guardião das Letras",
    story: "O códice do mestre Bergmann se desfez e as letras fugiram pelos campos de Belém. Tudo começa por elas.",
    scroll: {
      t: "O alfabeto: 24 letras",
      p: [
        "Sete vogais: α ε η ι ο υ ω. ε e ο são sempre breves; η e ω, sempre longas.",
        "Toda palavra que começa com vogal leva um espírito: ἁ (áspero, soa “h”) ou ἀ (brando, mudo).",
        "O sigma tem duas formas: σ no começo e no meio, ς no fim da palavra.",
        "Ditongos: αι ει οι υι αυ ευ ου. O iota subscrito (ᾳ ῃ ῳ) se escreve, mas não se pronuncia.",
      ],
      tip: "γ antes de γ, κ, χ ou ξ soa “n”: ἄγγελος é “ánguelos”.",
    },
  },
  bergmann_02: {
    city: "Nazaré", native: "Ναζαρέθ", scene: "tents", boss: "Vigia de Nazaré",
    story: "Em Nazaré as palavras aprendem a agir. Cada verbo diz, na própria terminação, quem está falando.",
    scroll: {
      t: "Presente do indicativo ativo",
      rows: [
        ["eu solto", "λύω", "nós soltamos", "λύομεν"], ["tu soltas", "λύεις", "vós soltais", "λύετε"],
        ["ele solta", "λύει", "eles soltam", "λύουσι(ν)"],
      ],
      after: ["A terminação já indica a pessoa. Os pronomes ἐγώ (eu), σύ (tu), ἡμεῖς (nós), ὑμεῖς (vós) só aparecem para dar ênfase."],
      tip: "O ν entre parênteses é móvel: aparece antes de vogal ou no fim da frase.",
    },
  },
  bergmann_03: {
    city: "Jordão", native: "Ἰορδάνης", scene: "sea", boss: "Barqueiro do Jordão",
    story: "À beira do Jordão fala-se do que pode vir a ser: para que, se, quando.",
    scroll: {
      t: "Presente do subjuntivo",
      p: ["O subjuntivo expressa possibilidade. A marca é a vogal longa (ω ou η) na terminação:"],
      rows: [["λύω", "λύωμεν"], ["λύῃς", "λύητε"], ["λύῃ", "λύωσι(ν)"]],
      after: ["Aparece depois de ἵνα (para que) e ἐάν (se), e em exortações: λύωμεν = soltemos!"],
      tip: "O indicativo se nega com οὐ; os demais modos, com μή.",
    },
  },
  bergmann_04: {
    city: "Deserto", native: "ἔρημος", scene: "dunes", boss: "Tentador do Deserto",
    story: "No deserto pergunta-se pelo amanhã. As criaturas escondem um σ antes da terminação.",
    scroll: {
      t: "Futuro do indicativo",
      p: ["Futuro = tema + σ + terminações do presente: λύσω, λύσεις, λύσει, λύσομεν, λύσετε, λύσουσι(ν)."],
      rows: [
        ["π, β, φ + σ", "ψ", "βλέπω → βλέψω"], ["κ, γ, χ + σ", "ξ", "ἄγω → ἄξω"], ["τ, δ, θ + σ", "σ", "πείθω → πείσω"],
      ],
      tip: "O futuro de εἰμί (sou) é ἔσομαι: ἔσται = será.",
    },
  },
  bergmann_05: {
    city: "Caná", native: "Κανά", scene: "well", boss: "Mestre-sala de Caná",
    story: "Na festa de Caná cada convidado tem o seu lugar. A terminação diz o papel de cada palavra na frase.",
    scroll: {
      t: "O artigo e a 2ª declinação",
      rows: [
        ["nominativo (sujeito)", "ὁ λόγος", "οἱ λόγοι"], ["genitivo (“de”)", "τοῦ λόγου", "τῶν λόγων"],
        ["dativo (“a, para”)", "τῷ λόγῳ", "τοῖς λόγοις"], ["acusativo (objeto)", "τὸν λόγον", "τοὺς λόγους"],
      ],
      after: ["Neutros: τὸ ἔργον, plural τὰ ἔργα. No neutro, nominativo e acusativo são sempre iguais."],
      tip: "A ordem das palavras é livre. Quem manda é o caso, e o artigo ajuda a reconhecê-lo.",
    },
  },
  bergmann_06: {
    city: "Cafarnaum", native: "Καφαρναούμ", scene: "sea", boss: "Centurião de Cafarnaum",
    story: "Em Cafarnaum uma palavra basta. Mas as femininas trocam de vogal conforme a companhia.",
    scroll: {
      t: "A 1ª declinação",
      rows: [
        ["nominativo", "ἡ ἀρχή", "αἱ ἀρχαί"], ["genitivo", "τῆς ἀρχῆς", "τῶν ἀρχῶν"],
        ["dativo", "τῇ ἀρχῇ", "ταῖς ἀρχαῖς"], ["acusativo", "τὴν ἀρχήν", "τὰς ἀρχάς"],
      ],
      after: [
        "Depois de ε, ι ou ρ o tema mantém α: ἡ καρδία, τῆς καρδίας.",
        "Há masculinos na 1ª declinação: ὁ προφήτης, τοῦ προφήτου.",
      ],
      tip: "O genitivo plural da 1ª declinação é sempre ‑ῶν, com circunflexo.",
    },
  },
  bergmann_07: {
    city: "Galileia", native: "Γαλιλαία", scene: "hills", boss: "Pescador da Galileia",
    story: "Às margens da Galileia tudo ganha qualidade: bom, mau, santo, fiel.",
    scroll: {
      t: "Adjetivos",
      p: [
        "O adjetivo concorda com o substantivo em gênero, número e caso: ἀγαθός, ἀγαθή, ἀγαθόν.",
        "Atributivo (com o artigo antes do adjetivo): ὁ ἀγαθὸς λόγος ou ὁ λόγος ὁ ἀγαθός = a boa palavra.",
        "Predicativo (adjetivo fora do artigo): ἀγαθὸς ὁ λόγος ou ὁ λόγος ἀγαθός = a palavra é boa.",
      ],
      tip: "Artigo + adjetivo sem substantivo vira nome: οἱ ἀγαθοί = os bons.",
    },
  },
  bergmann_08: {
    city: "Samaria", native: "Σαμάρεια", scene: "well", boss: "Guardiã do Poço",
    story: "Junto ao poço de Samaria as pequenas palavras decidem tudo: em, de, para, por meio de.",
    scroll: {
      t: "Preposições",
      p: ["Com um só caso: ἐν + dativo (em) · εἰς + acusativo (para dentro de) · ἐκ + genitivo (de dentro de) · ἀπό + genitivo (de) · πρός + acusativo (para) · σύν + dativo (com)."],
      rows: [
        ["", "+ genitivo", "+ acusativo"], ["διά", "por meio de", "por causa de"], ["μετά", "com", "depois de"],
        ["κατά", "contra", "segundo"], ["ὑπό", "por (agente)", "debaixo de"], ["περί", "a respeito de", "ao redor de"],
      ],
      tip: "Antes de vogal a preposição perde a sua: δι᾽ αὐτοῦ, μετ᾽ ἐμοῦ, ἀπ᾽ ἀρχῆς.",
    },
  },
  bergmann_09: {
    city: "Betânia", native: "Βηθανία", scene: "garden", boss: "Vigia do Sepulcro",
    story: "Em Betânia chama-se cada um pelo nome: eu, tu, ele, este, aquele.",
    scroll: {
      t: "Pronomes pessoais, demonstrativos e relativo",
      rows: [
        ["eu", "ἐγώ, μου, μοι, με"], ["tu", "σύ, σου, σοι, σε"], ["ele, ela", "αὐτός, αὐτή, αὐτό"],
        ["este", "οὗτος, αὕτη, τοῦτο"], ["aquele", "ἐκεῖνος, ἐκείνη, ἐκεῖνο"], ["que, o qual", "ὅς, ἥ, ὅ"],
      ],
      after: ["O demonstrativo fica fora do artigo: οὗτος ὁ λόγος = esta palavra."],
      tip: "ὁ αὐτὸς λόγος = a mesma palavra. αὐτὸς ὁ λόγος = a própria palavra.",
    },
  },
  bergmann_10: {
    city: "Jericó", native: "Ἰεριχώ", scene: "walls", boss: "Publicano de Jericó",
    story: "Na estrada de Jericó conta-se o que ia acontecendo: andava, ensinava, seguia.",
    scroll: {
      t: "Imperfeito e verbos defectivos",
      p: ["Imperfeito = ação contínua no passado. Aumento ἐ + tema do presente + terminações secundárias:"],
      rows: [["ἔλυον", "ἐλύομεν"], ["ἔλυες", "ἐλύετε"], ["ἔλυε(ν)", "ἔλυον"]],
      after: [
        "Verbo que começa com vogal alonga a vogal: ἀκούω → ἤκουον. Nos compostos o aumento vem depois da preposição: ἐκβάλλω → ἐξέβαλλον.",
        "Defectivos (depoentes) têm forma média e sentido ativo: ἔρχομαι = venho; ἠρχόμην = eu vinha.",
      ],
      tip: "ἔλυον é “eu soltava” ou “eles soltavam”. O contexto decide.",
    },
  },
  bergmann_11: {
    city: "Jerusalém", native: "Ἰερουσαλήμ", scene: "temple", boss: "Escriba do Templo",
    story: "No templo os verbos mais antigos trocam de rosto para contar o que aconteceu de uma vez.",
    scroll: {
      t: "2º aoristo",
      p: ["O aoristo vê a ação como um todo. No 2º aoristo o tema muda; o aumento e as terminações são os do imperfeito:"],
      rows: [
        ["λαμβάνω", "ἔλαβον", "tomei"], ["λέγω", "εἶπον", "disse"], ["ἔρχομαι", "ἦλθον", "vim"], ["ὁράω", "εἶδον", "vi"],
      ],
      after: ["No subjuntivo não há aumento: λάβω, λάβῃς, λάβῃ."],
      tip: "ἐλάμβανον (imperfeito) × ἔλαβον (aoristo): só o tema distingue os dois.",
    },
  },
  bergmann_12: {
    city: "Getsêmani", native: "Γεθσημανί", scene: "garden", boss: "Guarda do Horto",
    story: "No horto, uma noite só. O aoristo regular marca o fato com as letras σα.",
    scroll: {
      t: "1º aoristo",
      p: ["Aumento + tema + σα:"],
      rows: [["ἔλυσα", "ἐλύσαμεν"], ["ἔλυσας", "ἐλύσατε"], ["ἔλυσε(ν)", "ἔλυσαν"]],
      after: ["O σ se funde com a consoante do tema como no futuro: βλέπω → ἔβλεψα. Subjuntivo (sem aumento): λύσω, λύσῃς, λύσῃ."],
      tip: "λύσω pode ser futuro do indicativo ou aoristo do subjuntivo. Depois de ἵνα ou ἐάν é subjuntivo.",
    },
  },
  bergmann_13: {
    city: "Gólgota", native: "Γολγοθᾶ", scene: "mountain", boss: "Centurião da Cruz",
    story: "No Gólgota as palavras mostram o que são por dentro: o tema verdadeiro só aparece no genitivo.",
    scroll: {
      t: "A 3ª declinação",
      p: ["O tema se descobre tirando ‑ος do genitivo: σάρξ, σαρκός → tema σαρκ‑."],
      rows: [
        ["nominativo", "σάρξ", "σάρκες"], ["genitivo", "σαρκός", "σαρκῶν"], ["dativo", "σαρκί", "σαρξί(ν)"], ["acusativo", "σάρκα", "σάρκας"],
      ],
      after: [
        "Neutros em ‑μα: σῶμα, σώματος, plural σώματα. Parentesco: πατήρ, πατρός.",
        "O dativo indica a quem, com quê ou onde; o acusativo, o objeto direto ou a extensão.",
      ],
      tip: "Decore cada substantivo com o genitivo: é ele que mostra o tema.",
    },
  },
  bergmann_14: {
    city: "Emaús", native: "Ἐμμαοῦς", scene: "hills", boss: "Peregrino de Emaús",
    story: "No caminho de Emaús conversa-se andando. Duas ações ao mesmo tempo pedem um particípio.",
    scroll: {
      t: "Particípio presente",
      rows: [
        ["ativo", "λύων, λύουσα, λῦον", "genitivo λύοντος, λυούσης"], ["médio e passivo", "λυόμενος, ‑η, ‑ον", ""],
      ],
      after: [
        "Uso adverbial (sem artigo): acompanha o verbo principal. λέγων = dizendo, enquanto dizia.",
        "O particípio presente indica ação simultânea à do verbo principal. O futuro (λύσων) é raro e indica propósito.",
      ],
      tip: "O particípio se nega com μή, não com οὐ.",
    },
  },
  bergmann_15: {
    city: "Damasco", native: "Δαμασκός", scene: "walls", boss: "Perseguidor de Damasco",
    story: "Na estrada de Damasco, depois de cair, levantou-se. Uma ação veio antes da outra.",
    scroll: {
      t: "Particípio aoristo e genitivo absoluto",
      rows: [
        ["1º aoristo", "λύσας, λύσασα, λῦσαν", "genitivo λύσαντος"], ["2º aoristo", "λαβών, λαβοῦσα, λαβόν", ""], ["passivo", "λυθείς", ""],
      ],
      after: [
        "Não tem aumento e indica ação anterior: “tendo soltado”, “depois de soltar”.",
        "Com artigo o particípio vira adjetivo ou nome: ὁ πιστεύων = aquele que crê.",
        "Genitivo absoluto: particípio e sujeito no genitivo, soltos do resto da frase. ταῦτα αὐτοῦ λαλοῦντος = enquanto ele falava estas coisas.",
      ],
      tip: "No genitivo absoluto o sujeito do particípio é diferente do sujeito da oração principal.",
    },
  },
  bergmann_16: {
    city: "Antioquia", native: "Ἀντιόχεια", scene: "ziggurat", boss: "Mestre de Antioquia",
    story: "Em Antioquia todos perguntam: quem? o quê? alguém? uns aos outros?",
    scroll: {
      t: "Interrogativos, indefinidos, reflexivos e recíproco",
      rows: [
        ["quem? o quê? por quê?", "τίς, τί", "acento sempre agudo"], ["alguém, algo, certo", "τις, τι", "sem acento próprio"],
        ["de mim mesmo", "ἐμαυτοῦ", ""], ["de ti mesmo", "σεαυτοῦ", ""], ["de si mesmo", "ἑαυτοῦ", ""], ["uns aos outros", "ἀλλήλων", ""],
      ],
      tip: "Só o acento separa τίς (quem?) de τις (alguém).",
    },
  },
  bergmann_17: {
    city: "Filipos", native: "Φίλιπποι", scene: "tower", boss: "Carcereiro de Filipos",
    story: "Na prisão de Filipos as portas se abriram e ficaram abertas. O que foi feito continua valendo.",
    scroll: {
      t: "Perfeito e mais-que-perfeito",
      p: ["Perfeito = ação concluída cujo resultado permanece. Reduplicação + tema + κα:"],
      rows: [["λέλυκα", "λελύκαμεν"], ["λέλυκας", "λελύκατε"], ["λέλυκε(ν)", "λελύκασι(ν)"]],
      after: [
        "Médio e passivo: λέλυμαι. γέγραπται = está escrito.",
        "A reduplicação repete a 1ª consoante com ε. As aspiradas perdem o sopro: φ → πεφ‑, θ → τεθ‑, χ → κεχ‑. Diante de vogal, a vogal alonga: ἠγάπηκα.",
        "Mais-que-perfeito: (ἐ)λελύκειν, eu tinha soltado.",
      ],
      tip: "οἶδα (sei) tem forma de perfeito e sentido de presente.",
    },
  },
  bergmann_18: {
    city: "Atenas", native: "Ἀθῆναι", scene: "temple", boss: "Filósofo do Areópago",
    story: "No Areópago discute-se e ordena-se. As criaturas falam em ordens e desejos.",
    scroll: {
      t: "Imperativo e optativo",
      rows: [
        ["", "presente (continue)", "aoristo (faça)"], ["2ª singular", "λῦε", "λῦσον"], ["3ª singular", "λυέτω", "λυσάτω"],
        ["2ª plural", "λύετε", "λύσατε"], ["3ª plural", "λυέτωσαν", "λυσάτωσαν"],
      ],
      after: [
        "Proibição: μή + imperativo presente (pare de…) ou μή + subjuntivo aoristo (não faça).",
        "O optativo expressa desejo: μὴ γένοιτο = de modo nenhum!",
      ],
      tip: "λύετε pode ser indicativo (soltais) ou imperativo (soltai). O contexto decide.",
    },
  },
  bergmann_19: {
    city: "Corinto", native: "Κόρινθος", scene: "pillar", boss: "Sofista de Corinto",
    story: "Em Corinto correm para ganhar o prêmio. O verbo vira nome: o correr, o crer, o viver.",
    scroll: {
      t: "O infinitivo",
      rows: [
        ["presente", "λύειν", "λύεσθαι (médio e passivo)"], ["aoristo", "λῦσαι · λαβεῖν", "λυθῆναι (passivo)"], ["perfeito", "λελυκέναι", ""],
      ],
      after: [
        "O sujeito do infinitivo fica no acusativo.",
        "Com artigo e preposição: ἐν τῷ + infinitivo = enquanto · μετὰ τό = depois de · διὰ τό = porque · εἰς τό, πρὸς τό = a fim de · πρὸ τοῦ = antes de.",
      ],
      tip: "ὥστε + infinitivo indica resultado: “de modo que”.",
    },
  },
  bergmann_20: {
    city: "Éfeso", native: "Ἔφεσος", scene: "temple", boss: "Ourives de Éfeso",
    story: "Nas oficinas de Éfeso os metais se fundem. As vogais também: duas viram uma.",
    scroll: {
      t: "Verbos contraídos e verbos em ‑μι",
      rows: [
        ["tema em ε", "ε+ε = ει · ε+ο = ου", "ποιῶ, ποιεῖς, ποιοῦμεν"], ["tema em α", "α+ε = α · α+ο = ω", "ἀγαπῶ, ἀγαπᾷς, ἀγαπῶμεν"],
        ["tema em ο", "ο+ε = ου · ο+ει = οι", "πληρῶ, πληροῖς, πληροῦμεν"],
      ],
      after: [
        "Fora do presente e do imperfeito a vogal do tema alonga: ποιήσω, ἀγαπήσω, πληρώσω.",
        "Verbos em ‑μι reduplicam com ι no presente: δίδωμι (dou), τίθημι (ponho), ἵστημι (ponho de pé). Aoristo: ἔδωκα, ἔθηκα.",
      ],
      tip: "εἰμί no presente: εἰμί, εἶ, ἐστί(ν), ἐσμέν, ἐστέ, εἰσί(ν).",
    },
  },
  bergmann_21: {
    city: "Roma", native: "Ῥώμη", scene: "walls", boss: "Pretoriano de Roma",
    story: "Em Roma tudo é contado e apontado: o primeiro, os doze, um só.",
    scroll: {
      t: "Usos do artigo e numerais",
      p: [
        "O artigo transforma qualquer coisa em nome: οἱ τοῦ Χριστοῦ = os de Cristo · τὰ ἄνω = as coisas do alto.",
        "ὁ δέ = “e ele”. ὁ μέν … ὁ δέ = um … o outro.",
      ],
      rows: [
        ["um", "εἷς, μία, ἕν", "genitivo ἑνός, μιᾶς, ἑνός"], ["dois, três, quatro", "δύο, τρεῖς, τέσσαρες", ""],
        ["doze", "δώδεκα", ""], ["primeiro, segundo, terceiro", "πρῶτος, δεύτερος, τρίτος", ""],
      ],
      tip: "οὐδείς (ninguém) é οὐδέ + εἷς: “nem um”.",
    },
  },
  bergmann_22: {
    city: "Patmos", native: "Πάτμος", scene: "sea", boss: "Dragão do Apocalipse",
    story: "Na ilha de Patmos o códice quase se fecha. O último guardião fala por condições: se… então.",
    scroll: {
      t: "Orações condicionais e partículas",
      rows: [
        ["1ª classe (real)", "εἰ + indicativo", "“se é assim…”"], ["2ª classe (irreal)", "εἰ + passado … ἄν + passado", "“se fosse… seria”"],
        ["3ª classe (provável)", "ἐάν + subjuntivo", "“se acontecer…”"], ["4ª classe (remota)", "εἰ + optativo", "“se acontecesse…”"],
      ],
      after: ["Partículas: μέν … δέ (por um lado … por outro) · γάρ (pois) · οὖν (portanto) · ἄν (marca a contingência)."],
      tip: "μέν e ἄν muitas vezes não se traduzem: o sentido aparece na frase inteira.",
    },
  },
};

const SCENES = ["garden", "mountain", "tower", "ziggurat", "well", "hills", "pillar", "tents", "pyramids", "sea", "spring", "sinai", "dunes", "walls", "tabernacle", "temple"];

/**
 * Dados da campanha para um capítulo. Capítulos sem entrada própria (criados pelo aluno)
 * ganham um capítulo genérico, para a aventura cobrir todo o conteúdo que existir.
 * @param {string} language 'hebrew' ou 'greek'
 * @param {Object} chapter capítulo do Gamida
 * @param {number} index posição na campanha
 */
function getChapterMeta(language, chapter, index) {
  const table = language === "greek" ? GREEK : HEBREW;
  const meta = chapter && table[chapter.id];
  if (meta) return meta;
  const title = String((chapter && chapter.title) || "Capítulo extra");
  return {
    city: title.replace(/^Li[cç][aã]o\s+[IVXLCDM\d]+\s*[-–—:]\s*/i, "").slice(0, 28) || "Terra desconhecida",
    native: language === "greek" ? "γῆ" : "אֶרֶץ",
    scene: SCENES[index % SCENES.length],
    boss: "Guardião sem nome",
    story: "Uma página acrescentada ao rolo. As palavras dela também fugiram e precisam voltar.",
    scroll: {
      t: title,
      p: ["Este capítulo foi acrescentado ao material. Revise o vocabulário dele no Dicionário antes de entrar em batalha."],
      tip: "As criaturas deste capítulo usam as palavras e as frases que você cadastrou.",
    },
  };
}

const ScribeCampaign = { CLASSES, RELICS, RELIC_MILESTONES, HEBREW, GREEK, SCENES, getChapterMeta };

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.ScribeCampaign = ScribeCampaign;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ScribeCampaign;
}
})();
