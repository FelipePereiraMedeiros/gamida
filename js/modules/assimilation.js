/**
 * Dicas de assimilação exibidas depois de cada resposta da prática.
 *
 * Cada dica junta, quando existe, uma âncora de memória (cognato, nome bíblico
 * ou palavra de mesma raiz) e uma regra das gramáticas usadas no curso:
 * Page H. Kelley, Hebraico Bíblico, e Johannes Bergmann, Introdução ao Grego Bíblico.
 *
 * As âncoras são procuradas pela palavra exata, com vogais e acentos, para que
 * homógrafos como אֶל/אֵל ou τις/τίς nunca recebam a dica um do outro.
 */

const HEBREW_HOOKS = {
  // Letras: o nome da letra costuma ser uma palavra comum
  "א": "O nome alef lembra אֶלֶף, “boi”.",
  "ב": "O nome bet lembra בַּיִת, “casa”.",
  "ג": "O nome gimel lembra גָּמָל, “camelo”.",
  "י": "O nome yod lembra יָד, “mão”.",
  "מ": "O nome mem lembra מַיִם, “água”.",
  "ע": "O nome ayin é a palavra עַיִן, “olho”.",
  "פ": "O nome pe é a palavra פֶּה, “boca”.",
  "ר": "O nome resh lembra רֹאשׁ, “cabeça”.",

  // Família e pessoas
  "אָב": "Está em Absalão, “pai de paz”, e em Abimeleque, “meu pai é rei”.",
  "אָח": "Acabe significa “irmão do pai”.",
  "אִישׁ": "Forma par com אִשָּׁה, “mulher” (Gn 2.23).",
  "אִשָּׁה": "Gn 2.23 joga com o som: ishá, “mulher”, vem de ish, “homem”.",
  "אָדָם": "É o nome Adão. Soa como אֲדָמָה, “solo”, de onde ele foi formado (Gn 2.7).",
  "אֲדָמָה": "Soa como אָדָם: Adão foi formado do solo (Gn 2.7).",
  "בֵּן": "Está em Benjamim, “filho da mão direita”.",
  "בַּת": "Está no nome Bate-Seba.",
  "אֱנוֹשׁ": "É o nome Enos (Gn 4.26).",
  "יֶלֶד": "Vem da mesma raiz de יָלַד, “gerar”.",
  "יָלַד": "Dela vêm יֶלֶד, “criança”, e תּוֹלְדוֹת, “gerações”.",
  "תּוֹלְדוֹת": "Abre as seções de Gênesis (Gn 2.4; 5.1). A raiz é יָלַד, “gerar”.",

  // Deus e o culto
  "אֵל": "Está em Emanuel, Daniel, Miguel e Israel.",
  "אֱלֹהִים": "Tem forma plural, em ִים, mas referido a Deus leva o verbo no singular (Gn 1.1).",
  "יְהוָה": "Por reverência a leitura tradicional é Adonai; muitas Bíblias grafam SENHOR.",
  "אֲדֹנָי": "É a leitura tradicional do nome יְהוָה.",
  "יִשְׂרָאֵל": "Termina em אֵל, “Deus” (Gn 32.28).",
  "כֹּהֵן": "É a origem do sobrenome Cohen.",
  "נָבִיא": "Nevi’im, “Profetas”, é o N de Tanakh: Torá, Nevi’im, Ketuvim.",
  "תּוֹרָה": "É a própria Torá, os cinco primeiros livros.",
  "שַׁבָּת": "Deu “sábado” em português. Liga-se a שָׁבַת, “cessar”.",
  "שָׁבַת": "Dá nome ao שַׁבָּת, o dia em que se cessa o trabalho.",
  "קָדוֹשׁ": "Mesma raiz do Kadish e do Kidush, orações de santificação.",
  "קֹדֶשׁ": "Mesma raiz de קָדוֹשׁ, “santo”.",
  "קָדַשׁ": "Mesma raiz de קָדוֹשׁ, “santo”, e קֹדֶשׁ, “santidade”.",
  "חֶסֶד": "Dá nome aos judeus hassídicos, os “piedosos”.",
  "אֱמֶת": "Mesma raiz de “amém”: aquilo que é firme.",
  "אֱמוּנָה": "Mesma raiz de “amém”: firmeza.",
  "הֶאֱמִין": "Mesma raiz de “amém”: apoiar-se no que é firme.",
  "בְּרִית": "Aparece em brit milá, a “aliança da circuncisão”.",
  "מִצְוָה": "É a palavra de Bar Mitzvá, “filho do mandamento”.",
  "מָשַׁח": "Dela vem Messias, “ungido”.",
  "כִּפֶּר": "É a raiz de Yom Kippur, o Dia da Expiação.",
  "הָלַל": "Está em aleluia: “louvai a Javé”.",
  "בֵּרַךְ": "É a raiz do nome Baruque, “bendito”.",
  "בְּרָכָה": "Mesma raiz do nome Baruque, “bendito”.",
  "כָּבוֹד": "Icabode significa “sem glória” (1Sm 4.21).",
  "כָּבֵד": "Mesma raiz de כָּבוֹד: a glória é o que “tem peso”.",
  "צְבָאוֹת": "É o “Sabaoth” de Rm 9.29 e Tg 5.4.",
  "מִזְבֵּחַ": "O מִ junta-se à raiz de זָבַח, “sacrificar”: o lugar do sacrifício.",
  "זָבַח": "Dela vêm זֶבַח, “sacrifício”, e מִזְבֵּחַ, “altar”.",
  "זֶבַח": "Vem de זָבַח, “sacrificar”, como מִזְבֵּחַ, “altar”.",
  "עָלָה": "Dela vêm aliá, “subida” a Israel, e עֹלָה, “holocausto”.",
  "עֹלָה": "Vem de עָלָה, “subir”: a oferta que sobe por inteiro.",
  "תְּפִלָּה": "Mesma raiz de הִתְפַּלֵּל, “orar”.",
  "הִתְפַּלֵּל": "Mesma raiz de תְּפִלָּה, “oração”.",
  "תֵּבָה": "Mesma palavra para a arca de Noé (Gn 6.14) e o cesto de Moisés (Êx 2.3).",
  "שׁוֹפָר": "É o shofar, a trombeta de chifre de carneiro.",

  // Lugares e natureza
  "בַּיִת": "Está em Betel, “casa de Deus”, e Belém, “casa do pão”.",
  "לֶחֶם": "Belém é Beit Lechem, “casa do pão”.",
  "הַר": "Armagedom vem de Har Megiddo, “monte de Megido” (Ap 16.16).",
  "יָם": "Yam Suf é o “mar de Juncos”, o mar do êxodo.",
  "גַּן": "Gan Eden é o “jardim do Éden”.",
  "אֶרֶץ": "Eretz Israel é a “terra de Israel”.",
  "עֵץ": "Etz Chaim é a “árvore da vida”.",
  "כֶּרֶם": "O monte Carmelo tem nome ligado a esta palavra.",
  "נֶגֶב": "É o Neguebe, a região sul de Israel.",
  "מִדְבָּר": "Bemidbar, “no deserto”, é o título hebraico de Números.",
  "מִצְרַיִם": "É o Mizraim de Gn 10.6.",
  "יְרוּשָׁלַיִם": "Pense na terminação: o final do nome soa como שָׁלוֹם, “paz”.",
  "בְּאֵר": "Berseba é Be’er Sheva, “poço do juramento” (Gn 21.31).",
  "שֶׁבַע": "Está em Berseba (Gn 21.31), onde juramento e “sete” se cruzam.",
  "נִשְׁבַּע": "Liga-se a שֶׁבַע, “sete”, como em Berseba (Gn 21.31).",
  "אֶבֶן": "Ebenézer significa “pedra de ajuda” (1Sm 7.12).",
  "עָזַר": "Está em Ebenézer (1Sm 7.12), Eliézer e Esdras.",
  "שֶׁמֶשׁ": "O nome Sansão, Shimshon, vem desta palavra.",
  "מִגְדָּל": "Madalena vem de Magdala, “torre”. A raiz é a de גָּדוֹל, “grande”.",
  "גָּדוֹל": "Mesma raiz de מִגְדָּל, “torre”: o que é grande.",
  "גָּמָל": "Deu “camelo” em português e o nome da letra gimel.",
  "שָׁמַיִם": "Rima com מַיִם, “água”; os dois têm a mesma terminação.",
  "מַיִם": "Rima com שָׁמַיִם, “céus”; os dois têm a mesma terminação.",
  "רָקִיעַ": "É a abóbada de Gn 1.6, que separa as águas.",
  "תְּהוֹם": "É o abismo de Gn 1.2.",
  "עָפָר": "Gn 3.19: “tu és pó, e ao pó tornarás”.",
  "אֶלֶף": "Dá nome à letra alef.",
  "עַיִן": "Dá nome à letra ע, ayin.",
  "פֶּה": "Dá nome à letra פ, pe.",
  "רֹאשׁ": "Rosh Hashaná é a “cabeça do ano”.",
  "שָׁנָה": "Rosh Hashaná é a “cabeça do ano”.",
  "יוֹם": "Yom Kippur é o “Dia da Expiação”.",
  "עֶרֶב": "Gn 1.5: “houve tarde e manhã”.",
  "בֹּקֶר": "Gn 1.5: “houve tarde e manhã”.",
  "כּוֹכָב": "Bar Kokhba, “filho da estrela”, é o líder judeu do século II.",
  "יָד": "A letra yod tem o nome ligado a esta palavra.",

  // Abstratos e qualidades
  "שֵׁם": "Sem, filho de Noé, chama-se “nome”. Daí a palavra “semita”.",
  "שָׁלוֹם": "Está em Salomão e em Absalão.",
  "שָׁלֵם": "Mesma raiz de שָׁלוֹם. Salém é a cidade de Melquisedeque (Gn 14.18).",
  "דָּבָר": "Devarim, “palavras”, é o título hebraico de Deuteronômio.",
  "דִּבֶּר": "Vem da mesma raiz de דָּבָר, “palavra”.",
  "טוֹב": "Está em Tobias, “Javé é bom”, e em mazal tov.",
  "מֶלֶךְ": "Está em Melquisedeque, “rei de justiça”. Vem de “ele reinou” (Kelley §17.2).",
  "מָלַךְ": "Dela vem מֶלֶךְ, “rei” (Kelley §17.2).",
  "מַלְכָּה": "É o feminino de מֶלֶךְ, “rei”.",
  "מַלְכוּת": "Mesma raiz de מֶלֶךְ, “rei”.",
  "מַלְאָךְ": "Malaquias significa “meu mensageiro”.",
  "צַדִּיק": "Mesma raiz de Melquisedeque e Zadoque.",
  "צֶדֶק": "Melquisedeque é “rei de justiça”.",
  "צְדָקָה": "Mesma raiz de צֶדֶק, “justiça”.",
  "רַב": "Dela vem “rabino”, o “mestre”.",
  "מַר": "Mara é o lugar das águas amargas (Êx 15.23; Rt 1.20).",
  "חַי": "L’chaim, “à vida”, é o brinde judaico.",
  "חָיָה": "Mesma raiz de חַי, “vivo”.",
  "חָזָק": "Ezequias e Ezequiel trazem esta raiz.",
  "חָזַק": "Ezequias e Ezequiel trazem esta raiz.",
  "גִּבּוֹר": "Gabriel traz esta raiz: “Deus é forte”.",
  "חֹדֶשׁ": "Vem de חָדָשׁ, “novo”: o mês começa na lua nova.",
  "חָדָשׁ": "Dela vem חֹדֶשׁ, “mês”: o mês começa na lua nova.",
  "חִדֵּשׁ": "Mesma raiz de חָדָשׁ, “novo”.",
  "חָטָא": "O sentido concreto é “errar o alvo” (Jz 20.16).",
  "חַטָּאת": "Vem de חָטָא, “errar o alvo”.",
  "מִשְׁפָּט": "O מִ junta-se à raiz de שָׁפַט, “julgar”.",
  "שָׁפַט": "Shofetim é o livro de Juízes. Josafá é “Javé julgou”.",
  "שׁוֹפֵט": "Shofetim é o título hebraico de Juízes.",
  "דִּין": "Daniel significa “Deus é meu juiz”.",
  "סֵפֶר": "Sefer Torá é o rolo da Torá.",
  "סוֹפֵר": "Mesma raiz de סֵפֶר, “livro”.",
  "סָפַר": "Mesma raiz de סֵפֶר, “livro”.",
  "פָּנִים": "Peniel é “face de Deus” (Gn 32.30).",
  "לִפְנֵי": "Junta לְ e פָּנִים: “para a face de”.",
  "עִם": "Emanuel é “Deus conosco”: עִם + נוּ + אֵל (Is 7.14).",
  "לֹא": "Lo-Ami significa “não meu povo” (Os 1.9).",
  "עַם": "Lo-Ami significa “não meu povo” (Os 1.9).",
  "עֶבֶד": "Obadias significa “servo de Javé”. Vem de “ele serviu” (Kelley §17.2).",
  "עָבַד": "Dela vem עֶבֶד, “servo” (Kelley §17.2). Obadias é “servo de Javé”.",
  "זֶרַע": "Vem de זָרַע, “ele semeou” (Kelley §17.2).",
  "זָרַע": "Dela vem זֶרַע, “semente” (Kelley §17.2).",
  "שַׂר": "Sara, “princesa”, traz esta raiz.",
  "גּוֹי": "Daí “goy”, usado para quem não é judeu.",
  "חָמֵשׁ": "Chumash é o nome judaico dos cinco livros da Torá.",
  "אֶחָד": "É a palavra final do Shemá (Dt 6.4).",

  // Verbos ligados a nomes
  "שָׁמַע": "É o Shemá, “Ouve, Israel” (Dt 6.4). Simeão vem dela (Gn 29.33).",
  "הָלַךְ": "Halakhá, a lei judaica, é o “caminho” por onde se anda.",
  "בָּרָא": "Gn 1.1: no Qal tem sempre Deus como sujeito.",
  "נָתַן": "Está em Natã, Natanael e Jônatas, nomes que dizem “ele deu”.",
  "רָפָא": "Rafael significa “Deus curou”.",
  "גָּאַל": "Boaz é o resgatador de Rute. Dela vem גּוֹאֵל.",
  "גּוֹאֵל": "É o título de Boaz em Rute. Vem de גָּאַל, “resgatar”.",
  "זָכַר": "Zacarias significa “Javé se lembrou”.",
  "חָנַן": "João, Yochanan, significa “Javé foi gracioso”.",
  "יָשַׁב": "Dela vem yeshivá, a escola onde se “senta” para estudar.",
  "לָמַד": "Talmude vem da mesma raiz: “estudo”.",
  "יָרָה": "É a raiz geralmente ligada a תּוֹרָה, “instrução”.",
  "שָׁכַן": "Mesma raiz da Shekhiná, a presença que habita.",
  "קוּם": "Lembre “talita cumi” em Mc 5.41: “levanta-te”.",
  "שׁוּב": "Teshuvá, “arrependimento”, é o ato de voltar.",
  "שָׁלַח": "Siloé significa “enviado” (Jo 9.7).",
  "הוֹשִׁיעַ": "Mesma raiz de Josué, Isaías, Oseias e Jesus.",
  "מוֹשִׁיעַ": "Mesma raiz de Josué, Isaías, Oseias e Jesus.",
  "יָסַף": "É o nome José: “que ele acrescente” (Gn 30.24).",
  "צָחַק": "É o nome Isaque: “ele ri” (Gn 21.6).",
  "שָׁאַל": "O nome Saul significa “pedido”.",
  "רָאָה": "Javé-Jiré, “o Senhor proverá”, usa este verbo (Gn 22.14).",
  "רוֹאֶה": "É o “vidente” de 1Sm 9.9. Vem de רָאָה, “ver”.",
  "רוֹעֶה": "Sl 23.1: “O Senhor é o meu pastor”.",
  "נוּחַ": "Noé, Noach, soa como este verbo (Gn 5.29).",
  "שִׁיר": "Shir haShirim é o Cântico dos Cânticos.",
  "רִיב": "Meribá é o lugar da “contenda” (Êx 17.7).",
  "פָּרָה": "Gn 1.28: “frutificai”, ao lado de רָבָה.",
  "רָבָה": "Gn 1.28: “multiplicai-vos”, ao lado de פָּרָה.",
  "יָצַר": "Dela vem יוֹצֵר, “oleiro”, o que dá forma.",
  "יוֹצֵר": "Vem de יָצַר, “formar”: o oleiro dá forma ao barro.",
  "אֹזֶן": "Dela vem הֶאֱזִין, “dar ouvidos”.",
  "הֶאֱזִין": "Vem de אֹזֶן, “ouvido”.",
  "פָּשַׁע": "Dela vem פֶּשַׁע, “transgressão”.",
  "פֶּשַׁע": "Vem de פָּשַׁע, “rebelar-se”.",
};

const GREEK_HOOKS = {
  // Letras
  "α": "Alfa e beta deram a palavra “alfabeto”. Alfa e ômega abrem e fecham a série (Ap 1.8).",
  "β": "Alfa e beta deram a palavra “alfabeto”.",
  "δ": "Tem forma de triângulo na maiúscula, Δ, como o delta de um rio.",
  "θ": "É a primeira letra de θεός: teologia.",
  "λ": "É a primeira letra de λόγος: lógica.",
  "π": "É o π da matemática.",
  "φ": "É a primeira letra de φωνή: fonética.",
  "χ": "É a primeira letra de Χριστός.",
  "ψ": "É a primeira letra de ψυχή: psicologia.",
  "ω": "Alfa e ômega abrem e fecham a série (Ap 1.8).",

  // Pessoas e pronomes
  "ἐγώ": "Daí “ego”.",
  "κἀγώ": "Crase de καί + ἐγώ: as vogais se fundem (Bergmann §1.5).",
  "αὐτός": "Pense em autógrafo e automóvel.",
  "ἄνθρωπος": "Pense em antropologia.",
  "ἀνήρ": "Pense em androide e poliandria.",
  "γυνή": "Pense em ginecologia.",
  "πατήρ": "Pense em patriarca.",
  "μήτηρ": "Pense em metrópole, a “cidade-mãe”.",
  "ἀδελφός": "Filadélfia é “amor fraterno”.",
  "παιδίον": "Pense em pediatra.",
  "μαθητής": "Da mesma família de matemática: o que se aprende.",
  "βασιλεύς": "Pense em basílica.",
  "βασιλεία": "Pense em basílica, o edifício “real”.",
  "γραμματεύς": "Pense em gramática.",
  "πρεσβύτερος": "Deu “presbítero”.",
  "Ἰησοῦς": "É a forma grega de Yeshua, “Javé salva”, o mesmo nome de Josué.",
  "Χριστός": "Traduz o hebraico mashiach, Messias: “ungido”.",
  "ἀμήν": "Vem do hebraico, da raiz de “firmeza”.",

  // Deus e fé
  "θεός": "Pense em teologia e ateu.",
  "κύριος": "Lembre o Kyrie eleison, “Senhor, tem piedade”.",
  "λόγος": "Pense em lógica e nas palavras em -logia.",
  "πνεῦμα": "Pense em pneu e pneumonia: ar, sopro.",
  "ψυχή": "Pense em psicologia.",
  "ἄγγελος": "Deu “anjo”: o mensageiro.",
  "δαιμόνιον": "Deu “demônio”.",
  "ἁμαρτία": "Vem de ἁμαρτάνω, “errar o alvo”.",
  "ἁμαρτάνω": "Hamartiologia é o estudo do pecado.",
  "ἁμαρτωλός": "Vem de ἁμαρτάνω, “errar o alvo”.",
  "ἀγάπη": "Ágape, a refeição de amor fraterno.",
  "ἀγαπάω": "Mesma família de ἀγάπη, ágape.",
  "ἀγαπητός": "Mesma família de ἀγάπη, ágape.",
  "πίστις": "Dela vêm πιστεύω e πιστός.",
  "πιστεύω": "Vem de πίστις, “fé”.",
  "πιστός": "Vem de πίστις, “fé”.",
  "χάρις": "Pense em carisma.",
  "χαρά": "Mesma família de χάρις e χαίρω.",
  "χαίρω": "Mesma família de χαρά, “alegria”.",
  "εὐχαριστέω": "Daí “eucaristia”: εὖ + χάρις.",
  "δόξα": "Pense em doxologia e ortodoxo.",
  "δοξάζω": "Pense em doxologia.",
  "δοκέω": "Docetismo é a heresia do “parecer”.",
  "ἐκκλησία": "Pense em eclesiástico e igreja.",
  "εὐαγγέλιον": "εὖ, “bem”, + ἄγγελος: a boa mensagem.",
  "εὐαγγελίζω": "εὖ, “bem”, + ἄγγελος: anunciar a boa mensagem.",
  "ἐπαγγελία": "Mesma família de ἄγγελος, “mensageiro”.",
  "ἀπαγγέλλω": "Mesma família de ἄγγελος, “mensageiro”.",
  "βαπτίζω": "Deu “batizar”.",
  "σωτήρ": "Soteriologia é o estudo da salvação.",
  "σωτηρία": "Soteriologia é o estudo da salvação.",
  "σῴζω": "Dela vêm σωτήρ e σωτηρία: soteriologia.",
  "εἰρήνη": "É o nome Irene.",
  "ἅγιος": "Pense em hagiografia, a vida dos santos.",
  "ἱερόν": "Pense em hierarquia, o “governo sagrado”.",
  "σάββατον": "Deu “sábado”, do hebraico שַׁבָּת.",
  "συναγωγή": "Deu “sinagoga”: σύν + ἄγω, “conduzir junto”.",
  "ἀπόστολος": "Vem de ἀποστέλλω, “enviar”.",
  "ἀποστέλλω": "Dela vem “apóstolo”, o enviado.",
  "προφήτης": "πρό + φημί: quem fala em nome de outro.",
  "μετανοέω": "μετά + νοῦς: mudar de mente. Daí metanoia.",
  "ἀνάστασις": "Dela vem o nome Anastácia.",
  "θεραπεύω": "Deu “terapia”.",
  "διακονέω": "Daí “diácono”.",
  "μαρτυρέω": "Daí “mártir”, a testemunha.",
  "μαρτυρία": "Daí “mártir”, a testemunha.",
  "κηρύσσω": "Querigma é a proclamação da mensagem.",
  "παρακαλέω": "παρά + καλέω. Daí Paracleto, o que é chamado ao lado.",
  "εὐλογέω": "εὖ + λόγος: falar bem. Daí “elogio”.",

  // Natureza e corpo
  "κόσμος": "Pense em cosmos e cosmologia.",
  "ζωή": "Pense em zoologia.",
  "γῆ": "Pense em geografia.",
  "οὐρανός": "É o nome do planeta Urano.",
  "θάλασσα": "Pense em talassoterapia.",
  "ὕδωρ": "Pense em hidratar.",
  "πῦρ": "Pense em pirotécnico.",
  "φῶς": "Pense em fotografia.",
  "λίθος": "Pense em litografia e paleolítico.",
  "ὄρος": "Pense em orografia.",
  "ἔρημος": "Pense em eremita.",
  "καρπός": "Pense em Policarpo, “muito fruto”.",
  "σπέρμα": "Da mesma família de σπείρω e de diáspora.",
  "σπείρω": "Pense em diáspora: sementes espalhadas.",
  "θηρίον": "Pense em megatério, a “grande fera”.",
  "σῶμα": "Pense em somático.",
  "σάρξ": "Pense em sarcófago, “come-carne”.",
  "αἷμα": "Pense em hemoglobina.",
  "καρδία": "Pense em cardiologia.",
  "κεφαλή": "Pense em encéfalo.",
  "ὀφθαλμός": "Pense em oftalmologista.",
  "γλῶσσα": "Pense em glossário.",
  "στόμα": "Deu “estômago”, a “boca” do órgão.",
  "χείρ": "Pense em cirurgia, trabalho manual.",
  "πούς": "Pense em pódio.",
  "πρόσωπον": "Pense em prosopopeia.",
  "νύξ": "Parente de “noite”.",
  "ἡμέρα": "Pense em efêmero, o que dura um dia.",
  "ὥρα": "Deu “hora”.",
  "χρόνος": "Pense em cronômetro.",
  "αἰών": "Daí “éon”.",
  "αἰώνιος": "Vem de αἰών: éon.",
  "γενεά": "Pense em genealogia.",
  "ἔθνος": "Pense em étnico.",

  // Vida e sociedade
  "οἶκος": "Pense em economia e ecologia.",
  "οἰκία": "Mesma família de οἶκος: economia.",
  "οἰκοδομέω": "οἶκος + construir.",
  "κατοικέω": "κατά + οἶκος: habitar.",
  "πόλις": "Pense em política e metrópole.",
  "λαός": "Pense em laico.",
  "ὄχλος": "Oclocracia é o “governo da multidão”.",
  "νόμος": "Pense em autonomia e Deuteronômio.",
  "ὁδός": "Pense em êxodo e método.",
  "ἔργον": "Pense em ergonomia e energia.",
  "ἐργάζομαι": "Vem de ἔργον: ergonomia.",
  "ἐνεργέω": "Daí “energia”.",
  "θάνατος": "Pense em eutanásia.",
  "ἀποθνῄσκω": "Mesma família de θάνατος.",
  "σοφία": "Pense em filosofia.",
  "ἀλήθεια": "ἀ + λήθη: “não esquecido”. Lembre o rio Lete, do esquecimento.",
  "ἀληθινός": "Vem de ἀλήθεια, “verdade”.",
  "φωνή": "Pense em telefone e fonética.",
  "φωνέω": "Vem de φωνή: fonética.",
  "ἀρχή": "Pense em arqueologia e monarquia.",
  "ἄρχω": "Pense em monarca.",
  "ἀρχιερεύς": "ἀρχι-, “chefe”, + ἱερεύς, “sacerdote”.",
  "δύναμις": "Pense em dinamite e dinâmica.",
  "δύναμαι": "Mesma família de δύναμις: dinâmica.",
  "δυνατός": "Mesma família de δύναμις: dinâmica.",
  "ὄνομα": "Pense em anônimo e onomástica.",
  "ῥῆμα": "Parente de retórica.",
  "γράφω": "Pense em gráfico e caligrafia.",
  "γραφή": "Vem de γράφω: gráfico.",
  "διδάσκω": "Pense em didática.",
  "διδάσκαλος": "Pense em didática.",
  "σημεῖον": "Pense em semiótica.",
  "μνημεῖον": "Pense em mnemônica: lugar de lembrança.",
  "παραβολή": "Deu “parábola”: παρά + βάλλω, “lançar ao lado”.",
  "ἄρτος": "Artoclasia é o “partir do pão”.",
  "τόπος": "Pense em topografia.",
  "κοινωνία": "O grego koiné é o grego “comum”.",
  "τέλος": "Pense em teleologia.",
  "μέρος": "Pense em polímero, “muitas partes”.",
  "τιμή": "Timóteo significa “que honra a Deus”.",
  "φυλακή": "Pense em profilaxia, a proteção.",
  "φόβος": "Pense em fobia.",
  "φοβέομαι": "Vem de φόβος: fobia.",
  "θρόνος": "Deu “trono”.",

  // Adjetivos
  "ἀγαθός": "É o nome Ágata, “a boa”.",
  "κακός": "Pense em cacofonia.",
  "καλός": "Pense em caligrafia, “escrita bela”.",
  "καινός": "Pense em Cenozoico, a era “nova”.",
  "μέγας": "Pense em megafone.",
  "μικρός": "Pense em microscópio.",
  "μόνος": "Pense em monólogo.",
  "ὀλίγος": "Pense em oligarquia.",
  "ὅλος": "Pense em holístico e holograma.",
  "πᾶς": "Pense em pandemia e panorama.",
  "πολύς": "Pense em politeísmo.",
  "νεκρός": "Pense em necrotério.",
  "ἔσχατος": "Pense em escatologia.",
  "ἕτερος": "Pense em heterogêneo.",
  "ἄλλος": "Pense em alegoria: “dizer outra coisa”.",
  "πρῶτος": "Pense em protótipo.",
  "δεύτερος": "Deuteronômio é a “segunda lei”.",
  "ἴδιος": "Pense em idioma, o que é próprio de um povo.",
  "δεξιός": "Parente de “destro”.",
  "ἄξιος": "Pense em axioma.",
  "μέσος": "Mesopotâmia é a terra “no meio dos rios”.",
  "ὅμοιος": "Pense em homeopatia.",

  // Numerais
  "δύο": "Parente de “dois”.",
  "τρεῖς": "Pense em triângulo.",
  "τέσσαρες": "Tetragrama é o nome de quatro letras.",
  "πέντε": "Pense em Pentateuco.",
  "ἑπτά": "Pense em heptágono.",
  "δώδεκα": "Pense em dodecágono.",

  // Verbos
  "ἀκούω": "Pense em acústica.",
  "ἀκολουθέω": "Daí “acólito”, o que acompanha.",
  "γινώσκω": "Pense em gnose e diagnóstico.",
  "ἐπιγινώσκω": "ἐπί reforça γινώσκω: conhecer bem (Bergmann §8.2).",
  "γίνομαι": "Pense em gênese.",
  "γεννάω": "Pense em gene.",
  "δίδωμι": "Pense em dose, “o que é dado”.",
  "παραδίδωμι": "παρά + δίδωμι: dar ao lado, entregar.",
  "ἀποδίδωμι": "ἀπό + δίδωμι: devolver, pagar.",
  "λέγω": "Pense em léxico.",
  "λύω": "Pense em análise e paralisia.",
  "ἀπολύω": "ἀπό + λύω: soltar.",
  "κρίνω": "Pense em crítica.",
  "κρίσις": "Deu “crise”: o momento do juízo.",
  "ἀποκρίνομαι": "ἀπό + κρίνω: responder depois de discernir.",
  "λαλέω": "Pense em glossolalia, “falar em línguas”.",
  "πληρόω": "Pense em pleno e plenitude.",
  "ποιέω": "Pense em poesia e poema.",
  "ὁράω": "Pense em panorama.",
  "βάλλω": "Pense em balística.",
  "ἐκβάλλω": "ἐκ + βάλλω: lançar para fora.",
  "εὑρίσκω": "É o “eureka” de Arquimedes.",
  "λαμβάνω": "Pense em sílaba, letras “tomadas juntas”.",
  "παραλαμβάνω": "παρά + λαμβάνω: tomar para junto de si.",
  "πάσχω": "Pense em patologia e paixão.",
  "ἄγω": "Pense em pedagogo, “o que conduz a criança”.",
  "συνάγω": "σύν + ἄγω: conduzir junto, como em sinagoga.",
  "ὑπάγω": "ὑπό + ἄγω: ir embora.",
  "πέμπω": "Pense em pompa, o cortejo enviado.",
  "φέρω": "Pense em metáfora e periferia.",
  "προσφέρω": "πρός + φέρω: trazer para perto.",
  "φιλέω": "Pense em filosofia e Filadélfia.",
  "μισέω": "Pense em misantropo.",
  "κρατέω": "Pense em democracia.",
  "θεωρέω": "Pense em teoria.",
  "θεάομαι": "Pense em teatro, o lugar de ver.",
  "θαυμάζω": "Taumaturgo é o que opera maravilhas.",
  "λογίζομαι": "Pense em logística.",
  "περιπατέω": "Pense em peripatético, o que ensina andando.",
  "τίθημι": "Pense em tese e síntese.",
  "ἵστημι": "Pense em êxtase e estático.",
  "ἀνίστημι": "ἀνά + ἵστημι: levantar. Daí ἀνάστασις.",
  "παρίστημι": "παρά + ἵστημι: pôr ao lado.",
  "φημί": "Pense em blasfêmia e profeta.",
  "δείκνυμι": "Pense em paradigma, o “exemplo mostrado”.",
  "ἀπόλλυμι": "Apoliom é o “destruidor” de Ap 9.11.",
  "κάθημαι": "Pense em cátedra e catedral.",
  "καθίζω": "Pense em cátedra e catedral.",
  "πειράζω": "Parente de pirata, o que “tenta” o assalto.",
  "εἰσέρχομαι": "εἰς + ἔρχομαι: ir para dentro (Bergmann §8.2).",
  "ἐξέρχομαι": "ἐκ + ἔρχομαι: ir para fora (Bergmann §8.2).",
  "διέρχομαι": "διά + ἔρχομαι: ir através (Bergmann §8.2).",
  "ἀπέρχομαι": "ἀπό + ἔρχομαι: afastar-se (Bergmann §8.2).",
  "προσέρχομαι": "πρός + ἔρχομαι: ir para perto (Bergmann §8.2).",
  "ἀναβαίνω": "ἀνά, “para cima”, + βαίνω, “andar”.",
  "καταβαίνω": "κατά, “para baixo”, + βαίνω, “andar”.",
  "ἐπιστρέφω": "ἐπί + στρέφω, “virar”. Pense em catástrofe, a “virada”.",

  // Preposições como prefixos conhecidos
  "ἀνά": "Pense em análise e anabólico: para cima.",
  "ἀντί": "É o prefixo “anti-”.",
  "ἀπό": "Pense em apóstata: quem se afasta.",
  "διά": "Pense em diálogo e diâmetro: através.",
  "ἐκ": "Pense em êxodo: para fora.",
  "ἐν": "Pense em energia: dentro da obra.",
  "εἰς": "Pense em eisegese: ler para dentro do texto.",
  "ἐπί": "Pense em epiderme: sobre a pele.",
  "κατά": "Pense em catástrofe: para baixo.",
  "μετά": "Pense em metamorfose.",
  "παρά": "Pense em paralelo: ao lado.",
  "περί": "Pense em perímetro: ao redor.",
  "πρό": "Pense em prólogo: antes.",
  "πρός": "Pense em prosélito: quem vem para perto.",
  "σύν": "Pense em sinfonia: junto.",
  "ὑπέρ": "Pense em hipertensão: acima.",
  "ὑπό": "Pense em hipodérmica: abaixo.",
  "ἔξω": "Pense em exótico.",
  "πάλιν": "Pense em palíndromo: correr de volta.",
};

const HEBREW_STEMS = {
  "Pi'el": "ativo intensivo ou causativo",
  "Nif'al": "passivo simples ou reflexivo",
  "Hif'il": "ativo causativo",
  "Hitpa'el": "reflexivo",
};

const SENTENCE_CONTENT_CLASS = /subst|verbo|adjet|nome/i;
const HEBREW_POINTS = /[֑-ֽֿ-ׇ]/g;
const HEBREW_GUTTURALS = "אהחע";

function normalizeKeys(map) {
  return Object.keys(map).reduce((acc, key) => {
    acc[key.normalize("NFC")] = map[key];
    return acc;
  }, {});
}

const HOOKS = {
  hebrew: normalizeKeys(HEBREW_HOOKS),
  greek: normalizeKeys(GREEK_HOOKS),
};

function getItemTerm(item) {
  return String(item.hebrew || item.term || "").normalize("NFC").trim();
}

/** Primeira forma do verbete: "θεός, -οῦ, ὁ" vira "θεός" e "οὕτω(ς)" vira "οὕτω" */
function getHeadword(term) {
  return term.split(/[\s,/([]/)[0];
}

function stripMarks(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function hebrewConsonants(term) {
  return term.replace(HEBREW_POINTS, "");
}

function isSegolate(term) {
  const clusters = term.match(/[א-ת][֑-ׇ]*/g) || [];
  if (clusters.length !== 3) return false;
  const hasVowel = (cluster, vowels) => vowels.some((v) => cluster.includes(v));
  const firstOk = hasVowel(clusters[0], ["ֶ", "ֵ", "ֹ", "ַ"]);
  if (!firstOk) return false;
  if (hasVowel(clusters[1], ["ֶ"])) return true;
  const hasGuttural = HEBREW_GUTTURALS.includes(clusters[1][0]) || HEBREW_GUTTURALS.includes(clusters[2][0]);
  return hasGuttural && hasVowel(clusters[1], ["ַ"]);
}

function hebrewVerbRule(term, type) {
  const stem = Object.keys(HEBREW_STEMS).find((name) => type.includes(name));
  if (stem) {
    const root = type.match(/\[([^\]]+)\]/);
    const rootText = root ? ` Raiz: ${root[1]}.` : "";
    return `${stem}: tronco ${HEBREW_STEMS[stem]} (Kelley §36).${rootText}`;
  }
  const letters = hebrewConsonants(term);
  const isHollow = letters.length === 3 && "וי".includes(letters[1]) && !/[ַָ]/.test(term);
  if (isHollow) return "Verbo Ayin Vav/Ayin Yod: a vogal longa no meio é a marca da classe (Kelley §74).";
  if (term.endsWith("ה")) return "O ה final marca um verbo Lamed He (Kelley §72).";
  if (letters[0] === "נ") return "O נ inicial marca um verbo Pe Nun; ele pode se assimilar (Kelley §73).";
  if (letters[0] === "י") return "O י inicial marca um verbo Pe Vav/Pe Yod (Kelley §75).";
  if (letters.length === 3) {
    return `A forma de dicionário é o perfeito Qal, 3ª masc. sing.: grave a raiz ${letters} (Kelley §29.2).`;
  }
  return "";
}

function hebrewNounRule(term, type) {
  const isFeminine = /\(f\b/.test(type);
  if (isFeminine && /ָ[ּׁׂ]*ה$/.test(term)) {
    return "A terminação ָה é a marca mais comum do feminino (Kelley §18.2).";
  }
  if (isFeminine && term.endsWith("ת")) {
    return "A terminação ת também marca o feminino (Kelley §18.2).";
  }
  if (isSegolate(term)) {
    const gender = isFeminine ? " Gênero feminino: grave junto com a palavra." : "";
    return `Segolado: acento na 1ª sílaba e segol ou patah na 2ª (Kelley §25).${gender}`;
  }
  if (isFeminine) return "Feminino sem terminação típica: grave o gênero junto com a palavra (Kelley §18.2).";
  return "";
}

function hebrewRule(term, type) {
  if (/^Verbo/.test(type)) return hebrewVerbRule(term, type);
  if (/^Substantivo/.test(type)) return hebrewNounRule(term, type);
  if (/^Pronome Demonstrativo/.test(type)) return "Pronome demonstrativo: concorda com o nome a que se refere (Kelley §24).";
  if (/^Pronome Pessoal/.test(type)) return "Pronome pessoal independente: compare com as outras pessoas do quadro (Kelley §23).";
  return "";
}

function greekVerbRule(head, type) {
  const aorist = type.match(/2º Aoristo: ([^)]+)\)/);
  if (aorist) return `2º aoristo: radical ${aorist[1]}, diferente do presente (Bergmann §11.2).`;
  const plain = stripMarks(head);
  if (plain.endsWith("μι")) return "Verbo em -μι: um grupo pequeno, mas de uso muito frequente (Bergmann §20.4).";
  if (plain.endsWith("μαι")) return "Depoente: forma média ou passiva com sentido ativo (Bergmann §10.4).";
  if (/(αω|εω|οω)$/.test(plain)) return "Verbo contraído: a vogal do tema se funde com a terminação (Bergmann §20.1).";
  return "";
}

function greekNounRule(term) {
  const parts = term.split(",").map((part) => stripMarks(part).trim());
  if (parts.length < 3) return "";
  const [nominative, genitive, article] = parts;
  const isSecondDeclensionGenitive = genitive === "-ου";

  if (isSecondDeclensionGenitive && /ης$|ας$/.test(nominative)) {
    return "Masculino da 1ª declinação, com genitivo em -ου (Bergmann §6.1).";
  }
  if (isSecondDeclensionGenitive && nominative.endsWith("ον")) {
    return "2ª declinação: os terminados em -ον são neutros (Bergmann §5.5).";
  }
  if (isSecondDeclensionGenitive && nominative.endsWith("ος")) {
    return article === "η"
      ? "2ª declinação, mas feminino: a exceção à regra do -ος masculino (Bergmann §5.5)."
      : "2ª declinação: a maioria dos terminados em -ος é masculina (Bergmann §5.5).";
  }
  if (/^-?\S*(ης|ας)$/.test(genitive) && article === "η") {
    return "1ª declinação: tema em -α ou -η, em geral feminino (Bergmann §6.1).";
  }
  return "3ª declinação: o radical aparece no genitivo, por isso grave as duas formas (Bergmann §13.1).";
}

function greekRule(term, head, type) {
  if (/^Verbo/.test(type)) return greekVerbRule(head, type);
  if (/^Substantivo/.test(type)) return greekNounRule(term);
  if (/^Adjetivo/.test(type) && term.includes(",")) {
    return "Adjetivo: flexiona como os substantivos e concorda em gênero, número e caso (Bergmann §7.2).";
  }
  if (/^Preposição/.test(type)) return "O sentido da preposição depende do caso que ela rege (Bergmann §8.1).";
  return "";
}

function hebrewLetterRule(type) {
  const notes = [];
  const final = type.match(/Sofit: (\S+?)\)/);
  if (/Gutural/.test(type)) notes.push("É uma das guturais (Kelley §13).");
  if (/Begadkefat/.test(type)) notes.push("É uma das letras BeGaD KeFaT.");
  if (final) notes.push(`No fim da palavra escreve-se ${final[1]}.`);
  return notes.join(" ");
}

function greekLetterRule(item, type) {
  const final = type.match(/Final: (\S+?)\)/);
  if (final) return `No fim da palavra escreve-se ${final[1]}.`;
  return item.sound ? `Som: ${item.sound}.` : "";
}

/** Os dados guardam variantes sem acento para a correção; a dica mostra a forma acentuada */
function getDisplayTranslation(item) {
  const translations = Array.isArray(item.translations) ? item.translations : [];
  const first = translations[0];
  if (!first) return "";
  const plain = stripMarks(first);
  return translations.find((t) => t !== first && stripMarks(t) === plain) || first;
}

function pronunciationTip(item, language) {
  const translit = item.transliteration;
  if (!translit) return "";
  const translation = getDisplayTranslation(item);
  const meaning = translation ? ` pensando em “${translation}”` : "";
  const target = language === "greek" ? "grego" : "hebraico";
  return `Diga “${translit}” em voz alta${meaning}. Depois repita no sentido inverso, do português para o ${target}.`;
}

function sentenceTip(item, language) {
  const hooks = HOOKS[language];
  const tokens = item.tokens.map((token) => {
    const lemma = String(token.lemma || token.text || "").normalize("NFC").trim();
    return { lemma, wordClass: String(token.word_class || ""), hook: hooks[lemma] };
  });
  const withHook = tokens.filter((token) => token.hook);
  const keyword = withHook.find((token) => SENTENCE_CONTENT_CLASS.test(token.wordClass)) || withHook[0];
  if (keyword) {
    return { kind: "frase", text: `Palavra-chave ${keyword.lemma}: ${keyword.hook}` };
  }
  const translit = item.transliteration ? ` Leia em voz alta: “${item.transliteration}”.` : "";
  return { kind: "frase", text: `Ache primeiro o verbo e depois quem pratica a ação.${translit}` };
}

/**
 * Monta a dica de um item da prática.
 * @param {object} item questão atual (palavra, letra ou frase)
 * @param {string} language "hebrew" ou "greek"
 * @returns {{kind: string, text: string}|null}
 */
function getAssimilationTip(item, language) {
  if (!item) return null;
  const lang = language === "greek" ? "greek" : "hebrew";

  if (Array.isArray(item.tokens) && item.tokens.length > 0) {
    return sentenceTip(item, lang);
  }

  const term = getItemTerm(item);
  if (!term) return null;
  const type = String(item.type || "");
  const head = getHeadword(term);
  const hook = HOOKS[lang][head] || "";

  const isLetter = /^(Consoante|Vogal)/.test(type);
  let rule;
  if (isLetter) {
    rule = lang === "greek" ? greekLetterRule(item, type) : hebrewLetterRule(type);
  } else {
    rule = lang === "greek" ? greekRule(term, head, type) : hebrewRule(head, type);
  }

  const text = [hook, rule, item.notes].filter(Boolean).join(" ") || pronunciationTip(item, lang);
  if (!text) return null;
  return { kind: hook ? "memoria" : rule || item.notes ? "gramatica" : "pronuncia", text };
}

const AssimilationModule = { getAssimilationTip, getHeadword, HOOKS };

if (typeof window !== "undefined") {
  window.AssimilationModule = AssimilationModule;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = AssimilationModule;
}
