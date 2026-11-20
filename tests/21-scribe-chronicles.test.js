/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 21: Crônicas do Escriba (RPG de vocabulário, gramática e frases)
 * ==========================================================================
 */

const { TestSuite, assert, loadSourceFiles } = require('./test-utils');

const suite = new TestSuite('Módulo 21: Crônicas do Escriba');
const { html, appJs, hebrewData, greekData } = loadSourceFiles();
// Lições especiais (como o "Estudo para exame") não são capítulos da história
const storyOnly = (chapters) => chapters.filter((c) => !c.special);
const Scribe = require('../js/modules/scribe-chronicles.js');
const Campaign = require('../js/modules/scribe-campaign.js');
const Lore = require('../js/modules/scribe-lore.js');
const GameAudio = require('../js/modules/game-audio.js');
const { AppState, getTerm } = require('../js/modules/state.js');

const LANGS = [['hebrew', hebrewData, Campaign.HEBREW], ['greek', greekData, Campaign.GREEK]];

suite.test('A campanha tem um capítulo próprio para cada lição, nos dois idiomas', () => {
  LANGS.forEach(([language, chapters, table]) => {
    const campaign = Scribe.buildCampaign(chapters, language);
    assert.equal(campaign.length, storyOnly(chapters).length, `Toda lição de ${language} vira capítulo`);
    campaign.forEach(({ chapter, meta, index }) => {
      assert.equal(meta, table[chapter.id], `Lição sem capítulo próprio: ${chapter.title}`);
      ['city', 'native', 'boss', 'story'].forEach((field) => assert.isTrue(!!meta[field], `${chapter.id} sem ${field}`));
      assert.isTrue(Campaign.SCENES.includes(meta.scene), `Cenário desconhecido em ${chapter.id}`);
      assert.isTrue(!!meta.scroll.t && !!meta.scroll.tip, `Pergaminho incompleto em ${chapter.id}`);
      assert.isTrue((meta.scroll.p || []).length + (meta.scroll.rows || []).length > 0, `Pergaminho vazio em ${chapter.id}`);
      assert.equal(index, campaign.findIndex((c) => c.chapter === chapter));
    });
    assert.equal(new Set(campaign.map((c) => c.meta.city)).size, campaign.length, 'Cada capítulo tem a sua cidade');
    assert.deepEqual(Object.keys(table).filter((id) => !chapters.some((c) => c.id === id)), [], 'Capítulo de campanha sem lição');
  });
});

suite.test('Os nomes das cidades estão no alfabeto do idioma', () => {
  Object.values(Campaign.HEBREW).forEach((meta) => assert.isTrue(/^[֐-׿\s־]+$/.test(meta.native), `Nome não hebraico: ${meta.native}`));
  Object.values(Campaign.GREEK).forEach((meta) => assert.isTrue(/^[Ͱ-Ͽἀ-῿\s]+$/.test(meta.native), `Nome não grego: ${meta.native}`));
});

suite.test('Capítulo criado pelo aluno também entra na aventura', () => {
  const custom = { id: 'meu_capitulo', title: 'Lição 40 - Vocabulário extra', items: hebrewData[2].items.slice(0, 6), sentences: [] };
  const campaign = Scribe.buildCampaign([...hebrewData, custom], 'hebrew');
  const last = campaign[campaign.length - 1];
  assert.equal(last.chapter, custom);
  assert.equal(last.meta.city, 'Vocabulário extra');
  assert.isTrue(!!last.meta.scroll.t && !!last.meta.boss);
  const tiny = { id: 'curto', title: 'Curto', items: hebrewData[2].items.slice(0, 2) };
  assert.equal(Scribe.buildCampaign([tiny], 'hebrew').length, 0, 'Capítulo com menos de 4 palavras fica de fora');
});

suite.test('Relíquias: quatro por classe e por rolo, cada uma presa ao seu capítulo, com versículo', () => {
  LANGS.forEach(([language, chapters, table]) => {
    const relics = Scribe.relicsOf(language);
    Object.keys(Campaign.CLASSES).forEach((cls) => {
      const mine = relics.filter((r) => r.cls === cls);
      assert.isTrue(mine.length >= 4, `${language}/${cls}: ${mine.length} relíquias`);
      mine.forEach((r) => {
        assert.isTrue(!!table[r.ch], `Relíquia ${r.id} em capítulo que não é do rolo`);
        assert.isTrue(chapters.some((c) => c.id === r.ch), `Relíquia ${r.id} em capítulo sem lição`);
        assert.isTrue(/\d/.test(r.ref) && !!r.desc, `Relíquia ${r.id} sem versículo ou efeito`);
        assert.equal(Scribe.relicFor(cls, r.ch), r);
      });
    });
  });
  assert.equal(Scribe.relicFor('mago', 'capitulo_inexistente'), null);
  assert.equal(new Set(Campaign.RELICS.map((r) => r.id)).size, Campaign.RELICS.length, 'Ids de relíquia únicos');
});

suite.test('Fichas do Guia do Mestre do Rolo: texto-base, guardião com versículo e desenho, criaturas', () => {
  const kinds = new Set([...require('../js/modules/scribe-graphics.js').BOSS_KINDS, ...require('../js/modules/scribe-bosses.js').KINDS]);
  LANGS.forEach(([language, , table]) => {
    const species = Campaign.SPECIES[language];
    Object.entries(table).forEach(([id, meta]) => {
      ['ref', 'bossRef', 'why', 'story'].forEach((field) => assert.isTrue(!!meta[field], `${id} sem ${field}`));
      assert.isTrue(kinds.has(meta.bossKind), `${id}: guardião sem desenho (${meta.bossKind})`);
      assert.equal(meta.creatures.length, 3, `${id}: três criaturas`);
      meta.creatures.forEach((sp) => assert.isTrue(!!species[sp] && /\d/.test(species[sp][1]), `${id}: criatura ${sp} sem versículo`));
      assert.isTrue(Campaign.BOOKS[language].some((b) => b.id === meta.book), `${id}: livro ${meta.book} inexistente`);
    });
    Campaign.BOOKS[language].forEach((book) => {
      assert.equal(table[book.last].book, book.id, `Último capítulo do ${book.short} fora do livro`);
      const lore = Lore.forBook(language, book.id);
      assert.isTrue(lore.prologue.paragraphs.length >= 3 && lore.ending.paragraphs.length >= 2, `${book.short} sem prólogo ou final`);
    });
  });
  // Livro I: o caminho do Éden ao Sinai, com os guardiões do guia
  const bookOne = Object.values(Campaign.HEBREW).filter((m) => m.book === 1).map((m) => m.boss).join(' | ');
  ['Serpente', 'Nefilins', 'Ninrode', 'Golias', 'Leviatã', 'Beemote', 'Dragão'].forEach((boss) => assert.isTrue(bookOne.includes(boss), `Livro I sem ${boss}`));
  assert.equal(Campaign.classInfo('greek', 'mago').name, 'Pescador');
  // Guardiões humanos do Livro II e do grego não repetem os gigantes do Livro I
  const giants = new Set(['abimeleque', 'ninrode', 'golias', 'nefilim']);
  const reused = [...Object.values(Campaign.HEBREW).filter((m) => m.book === 2), ...Object.values(Campaign.GREEK)]
    .filter((m) => giants.has(m.bossKind)).map((m) => m.boss);
  assert.isTrue(reused.every((b) => /Sísera|Naás|Nebuzaradã/.test(b)), `Guardiões sem figura própria: ${reused.join(', ')}`);
  assert.equal(Campaign.classInfo('hebrew', 'mago').hp[0], Campaign.CLASSES.mago.hp[0], 'O nome muda, as regras não');
});

suite.test('Atributos do herói somam classe, nível e relíquias, com teto', () => {
  const knight = Scribe.heroStats({ cls: 'cavaleiro', lvl: 3, relics: [] });
  assert.equal(knight.hp, 112 + 15 * 3);
  assert.equal(knight.armor, 0.25);
  const armored = Scribe.heroStats({ cls: 'cavaleiro', lvl: 1, relics: ['escudo_abraao', 'espada_golias'] });
  assert.equal(armored.hp, 112 + 15 + 40);
  assert.equal(armored.armor, 0.4);
  const rogue = Scribe.heroStats({ cls: 'assassino', lvl: 1, relics: ['punhal_eude', 'manto_elias', 'cordao_raabe'] });
  assert.isTrue(Math.abs(rogue.dodge - 0.4) < 1e-9);
  assert.equal(rogue.revive, 1);
  assert.equal(rogue.hints, 1);
  assert.equal(Scribe.xpNeeded(4), 240);
});

suite.test('O dano cresce do primeiro ao último capítulo, em qualquer campanha', () => {
  [29, 22, 5].forEach((total) => {
    assert.equal(Scribe.monsterDamage(0, total), 10);
    assert.equal(Scribe.monsterDamage(total - 1, total), 30);
    assert.equal(Scribe.bossDamage(0, total), 16);
    assert.equal(Scribe.bossDamage(total - 1, total), 36);
  });
  assert.equal(Scribe.monsterDamage(0, 1), 10, 'Campanha de um capítulo não divide por zero');
});

suite.test('Criaturas: palavras da lição, as erradas primeiro, e duas de lições anteriores', () => {
  const chapter = hebrewData[5];
  const previous = hebrewData.slice(0, 5);
  const missed = chapter.items.slice(-2).map(getTerm);
  const stats = Object.fromEntries(missed.map((term) => [term, { r: 0, x: 2 }]));
  for (let round = 0; round < 5; round++) {
    const waves = Scribe.buildWaves(chapter, previous, stats);
    const all = waves.flat();
    assert.equal(all.length, 10, 'Oito novas e duas antigas');
    assert.equal(all.filter((w) => w.old).length, 2);
    assert.equal(new Set(all.map((w) => getTerm(w.item))).size, 10, 'Sem palavra repetida');
    const fresh = all.filter((w) => !w.old).map((w) => getTerm(w.item));
    missed.forEach((term) => assert.isTrue(fresh.includes(term), 'Palavra errada antes volta'));
    all.filter((w) => !w.old).forEach((w) => assert.isTrue(chapter.items.includes(w.item)));
  }
  assert.equal(Scribe.buildWaves(hebrewData[0], [], {}).flat().filter((w) => w.old).length, 0, 'O primeiro capítulo não tem palavras antigas');
});

suite.test('Todo guardião tem frases jogáveis, com alternativas e montagem corretas', () => {
  LANGS.forEach(([language, chapters]) => {
    AppState.chapters = chapters;
    AppState.language = language;
    const campaign = Scribe.buildCampaign(chapters, language);
    const vocab = Scribe.buildVocabIndex(chapters);
    campaign.forEach(({ chapter }, index) => {
      const sentences = Scribe.bossSentences(index, campaign);
      const hasAny = campaign.slice(0, index + 1).some((c) => (c.chapter.sentences || []).length > 0);
      assert.equal(sentences.length > 0, hasAny, `Guardião de ${chapter.id}`);
      assert.isTrue(sentences.length <= Scribe.bossSentenceCount(index, campaign.length));
      assert.equal(new Set(sentences).size, sentences.length, 'Sem frase repetida');
      const glossPool = (chapter.sentences || []).flatMap((s) => (s.tokens || []).map((t) => t.context_meaning).filter(Boolean));
      sentences.forEach((sentence) => {
        const strikes = Scribe.sentenceStrikes(sentence, vocab, chapter);
        assert.isTrue(strikes.length >= 1 && strikes.length <= 3, `Golpes de palavra em ${getTerm(sentence)}`);
        strikes.forEach((strike) => {
          const options = Scribe.strikeOptions(strike, glossPool, chapters);
          assert.equal(options.length, 4);
          assert.equal(new Set(options).size, 4, 'Alternativas distintas');
          assert.isTrue(options.includes(strike.answer), 'A resposta está entre as alternativas');
        });
        const { chunks, bank, target } = Scribe.buildSentenceBank(sentence, chapter.sentences);
        assert.isTrue(chunks.length >= 1 && chunks.length <= 7, 'De 1 a 7 pedaços para montar');
        assert.equal(chunks.join(' '), target.trim().split(/\s+/).join(' '), 'Os pedaços refazem a tradução');
        chunks.forEach((chunk) => assert.isTrue(bank.some((b) => b.text === chunk), 'Todo pedaço certo está no banco'));
        assert.isTrue(Scribe.isBuildCorrect(chunks, chunks));
        if (chunks.length > 1) assert.isTrue(!Scribe.isBuildCorrect([...chunks].reverse(), chunks), 'Ordem trocada não vale');
        assert.isTrue(!Scribe.isBuildCorrect(chunks.slice(1), chunks), 'Pedaço faltando não vale');
      });
    });
  });
});

suite.test('O último guardião é mais longo que os outros', () => {
  assert.equal(Scribe.bossSentenceCount(3, 29), 5);
  assert.equal(Scribe.bossSentenceCount(28, 29), 8);
  const campaign = Scribe.buildCampaign(hebrewData, 'hebrew');
  assert.equal(Scribe.bossSentences(campaign.length - 1, campaign).length, 8, 'Completa com frases de lições anteriores');
});

suite.test('Golpe de gramática lê tronco, pessoa, tempo e caso da análise', () => {
  const piel = { word_class: 'Verbo', syntax_role: "Núcleo do predicado. 1ª pessoa comum do plural do perfeito Pi'el ('falamos')." };
  assert.equal(Scribe.hebrewStem(piel), 'Piel');
  assert.equal(Scribe.verbPerson(piel), 'nós');
  assert.equal(Scribe.hebrewStem({ word_class: 'Verbo', syntax_role: "3ª pessoa masculino singular do perfeito Hif'il." }), 'Hifil');
  assert.equal(Scribe.hebrewStem({ word_class: 'Verbo', syntax_role: 'Imperfeito Hitpael, 3ms.' }), 'Hitpael');
  assert.equal(Scribe.hebrewStem({ word_class: 'Verbo', syntax_role: 'Perfeito Qal.' }), 'Qal');
  assert.equal(Scribe.verbPerson({ syntax_role: '3ª pessoa feminino singular do perfeito Qal' }), 'ela');
  assert.equal(Scribe.verbPerson({ syntax_role: '3ª pessoa comum do plural' }), 'eles');
  assert.equal(Scribe.verbPerson({ syntax_role: 'Sujeito da oração' }), null);

  const present = { word_class: 'Verbo', inflection: 'Presente do indicativo ativo, 3ª pessoa singular' };
  assert.equal(Scribe.greekTense(present), 'Presente');
  assert.equal(Scribe.verbPerson(present), 'ele');
  assert.equal(Scribe.greekTense({ inflection: 'Imperfeito do indicativo ativo' }), 'Imperfeito');
  assert.equal(Scribe.greekTense({ inflection: 'Mais-que-perfeito ativo' }), 'Mais-que-perfeito');
  assert.equal(Scribe.greekCase({ inflection: 'Acusativo masculino singular' }), 'Acusativo');

  const question = Scribe.grammarQuestion(piel, 'hebrew');
  assert.isTrue(['tronco', 'pessoa'].includes(question.kind));
  assert.equal(question.options.length, 4);
  assert.isTrue(question.options.includes(question.answer));
  assert.equal(Scribe.grammarQuestion(piel, 'hebrew', () => false), null, 'Antes da lição que ensina, não pergunta');
  assert.equal(Scribe.grammarQuestion({ word_class: 'Substantivo', syntax_role: 'Sujeito' }, 'hebrew'), null);
  const noun = Scribe.grammarQuestion({ word_class: 'Substantivo', inflection: 'Genitivo feminino singular' }, 'greek');
  assert.equal(noun.kind, 'caso');
  assert.equal(noun.answer, 'Genitivo');
});

suite.test('Resposta digitada aceita o sentido na frase e os do verbete', () => {
  const { evaluateAnswer } = require('../js/modules/evaluation.js');
  const strike = { answer: 'vê', item: { translations: ['ver', 'olhar', 'contemplar'] } };
  assert.deepEqual(Scribe.strikeAccepted(strike), ['vê', 'ver', 'olhar', 'contemplar']);
  assert.deepEqual(Scribe.strikeAccepted({ answer: 'João', item: null }), ['João']);
  assert.deepEqual(Scribe.strikeAccepted({ answer: 'ver', item: { translations: ['ver', 'olhar'] } }), ['ver', 'olhar'], 'Sem repetir');
  const accepted = Scribe.strikeAccepted(strike);
  assert.equal(evaluateAnswer('ve', accepted).status, 'correct', 'Sem acento também vale');
  assert.equal(evaluateAnswer('olhar', accepted).status, 'correct');
  assert.equal(evaluateAnswer('ouvir', accepted).status, 'incorrect');
});

suite.test('Frases longas são montadas em grupos de palavras', () => {
  assert.deepEqual(Scribe.chunkTranslation('ele é justo e reto'), ['ele', 'é', 'justo', 'e', 'reto']);
  const long = 'Comendo eles, tendo tomado Jesus o pão e tendo agradecido, partiu e dando aos discípulos, disse: Tomem, comam; isto é o meu corpo.';
  const chunks = Scribe.chunkTranslation(long);
  assert.isTrue(chunks.length <= 7);
  assert.equal(chunks.join(' '), long);
  assert.deepEqual(Scribe.chunkTranslation(''), []);
  assert.isTrue(Scribe.isBuildCorrect(['Ele É', 'justo'], ['ele é', 'justo.']), 'Caixa e pontuação não contam');
});

suite.test('Progresso corrompido é saneado e o backup só traz avanço', () => {
  const clean = Scribe.sanitizeProgress({ cls: 'dragão', done: { kelley_03: true, kelley_05: 0 }, lvl: -3, xp: 'x', potions: 2.9, relics: ['urim', 'falsa'], stats: null });
  assert.equal(clean.cls, null);
  assert.deepEqual(clean.done, { kelley_03: true });
  assert.equal(clean.lvl, 1);
  assert.equal(clean.xp, 0);
  assert.equal(clean.potions, 2);
  assert.deepEqual(clean.relics, ['urim']);
  assert.deepEqual(clean.stats, {});
  assert.deepEqual(Scribe.sanitizeProgress(null).done, {});
});

suite.test('Toda lição tem a sua parte da história, nos dois idiomas', () => {
  [['hebrew', hebrewData, Lore.HEBREW], ['greek', greekData, Lore.GREEK]].forEach(([language, chapters, table]) => {
    storyOnly(chapters).forEach((chapter) => {
      const lore = Lore.forChapter(language, chapter.id);
      assert.equal(lore, table[chapter.id], `Lição sem história própria: ${chapter.title}`);
      ['taunt', 'epilogue'].forEach((field) => {
        assert.isTrue(typeof lore[field] === 'string' && lore[field].length > 20, `${chapter.id} sem ${field}`);
      });
      assert.isTrue(/^“.*”$/.test(lore.taunt), `A fala do guardião de ${chapter.id} vem entre aspas`);
    });
    assert.deepEqual(Object.keys(table).filter((id) => !chapters.some((c) => c.id === id)), [], 'História sem lição');
    assert.isTrue(Lore.PROLOGUE[language].paragraphs.length >= 3, 'Prólogo curto demais');
    assert.isTrue(Lore.ENDING[language].paragraphs.length >= 2, 'Final curto demais');
    assert.isTrue(!!Lore.VILLAIN.name && !!Lore.VILLAIN.native[language]);
  });
  assert.equal(Lore.forChapter('hebrew', 'capitulo_do_aluno'), Lore.GENERIC, 'Capítulo criado pelo aluno usa a história genérica');
});

suite.test('Cada classe e cada relíquia tem a sua história', () => {
  ['hebrew', 'greek'].forEach((language) => Object.keys(Campaign.CLASSES).forEach((cls) => assert.isTrue(!!Lore.CLASS_LORE[language][cls], `Classe sem história: ${language}/${cls}`)));
  Campaign.RELICS.forEach((relic) => assert.isTrue(!!Lore.RELIC_LORE[relic.id], `Relíquia sem história: ${relic.name}`));
  assert.equal(Object.keys(Lore.RELIC_LORE).length, Campaign.RELICS.length);
});

suite.test('Trilha: todo tema está bem escrito e todo cenário tem música de batalha', () => {
  const themes = GameAudio.epic.describe();
  const names = themes.map((t) => t.name);
  ['prologue', 'map', 'scroll', 'field', 'desert', 'water', 'mount', 'city', 'boss', 'final'].forEach((name) => {
    assert.isTrue(names.includes(name), `Tema ausente: ${name}`);
  });
  themes.forEach((theme) => {
    assert.equal(theme.bars, 4, `${theme.name}: quatro compassos`);
    assert.isTrue(theme.melodyBars.every((steps) => steps === 8), `${theme.name}: melodia com 8 colcheias por compasso`);
    assert.isTrue(theme.melodyBars.length === 0 || theme.melodyBars.length === 4, `${theme.name}: melodia de 4 compassos ou nenhuma`);
    assert.equal(theme.bassSteps, 8, `${theme.name}: baixo com 8 colcheias`);
    assert.isTrue(theme.drumSteps.every((steps) => steps === 8), `${theme.name}: percussão com 8 colcheias`);
    assert.isTrue(theme.arpSteps === 0 || theme.arpSteps === 8, `${theme.name}: dedilhado com 8 colcheias`);
    assert.isTrue(theme.degrees.every((d) => Number.isInteger(d) && d >= -7 && d <= 14), `${theme.name}: graus fora da tessitura`);
    assert.isTrue(theme.melodyBars.length === 0 || ['flute', 'reed', 'horn'].includes(theme.lead), `${theme.name}: timbre da melodia`);
  });
  Campaign.SCENES.forEach((scene) => {
    assert.isTrue(names.includes(GameAudio.epic.themeForScene(scene)), `Cenário sem música: ${scene}`);
    assert.isTrue(!!GameAudio.epic.SCENE_THEME[scene], `Cenário sem tema próprio: ${scene}`);
  });
  const battleThemes = new Set(Campaign.SCENES.map((scene) => GameAudio.epic.themeForScene(scene)));
  assert.equal(battleThemes.size, 5, 'Cinco ambientes de batalha: campo, deserto, água, monte e cidade');
});

suite.test('Quem já jogava não revê o prólogo à força; quem começa agora, sim', () => {
  assert.equal(Scribe.sanitizeProgress({ cls: 'mago', lvl: 3 }).seenIntro, true, 'Progresso antigo, com herói escolhido');
  assert.equal(Scribe.sanitizeProgress({}).seenIntro, false, 'Aventura nova');
  assert.equal(Scribe.sanitizeProgress({ cls: 'mago', seenIntro: false }).seenIntro, false);
  assert.equal(Scribe.sanitizeProgress({ seenEnding: true }).seenEnding, true);
  const books = Scribe.sanitizeProgress({ cls: 'mago', story: { p2: true, e1: 1, x9: true }, seen: { imp: 2, raven: -1 }, kills: { imp: 'x' } });
  assert.deepEqual(books.story, { p2: true, e1: true, p1: true }, 'Prólogos e finais lidos de cada livro');
  assert.deepEqual(books.seen, { imp: 2 });
  assert.deepEqual(books.kills, {});
});

suite.test('Todos os capítulos ficam abertos para revisão, na ordem das lições', () => {
  const source = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'modules', 'scribe-chronicles.js'), 'utf8');
  const start = source.indexOf('function isUnlocked(');
  assert.isTrue(start > 0 && source.slice(start, start + 320).includes('return true;'), 'Nenhum capítulo pode ficar bloqueado');
  [['hebrew', hebrewData], ['greek', greekData]].forEach(([language, chapters]) => {
    const campaign = Scribe.buildCampaign(chapters, language);
    assert.deepEqual(campaign.map((c) => c.chapter.id), storyOnly(chapters).map((c) => c.id), 'Capítulos na ordem das lições');
    campaign.forEach(({ chapter }, index) => {
      const waves = Scribe.buildWaves(chapter, campaign.slice(0, index).map((c) => c.chapter), {});
      waves.flat().filter((w) => !w.old).forEach((w) => assert.isTrue(chapter.items.includes(w.item), 'Criaturas novas são da própria lição'));
    });
  });
});

suite.test('Tempo esgotado: criaturas e guardiões atacam, em todas as perguntas', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'js/modules/scribe-chronicles.js'), 'utf8');
  const body = (name) => src.slice(src.indexOf(`function ${name}(`), src.indexOf('\n}\n', src.indexOf(`function ${name}(`)));
  assert.includes(body('startTimer'), 'timeAttack()', 'Fim da barra não ataca');
  assert.includes(body('timeAttack'), 'hurt(', 'Ataque do tempo sem dano');
  ['askMob', 'bossTurn', 'bossBuild', 'rushTurn'].forEach((fn) => assert.includes(body(fn), 'startTimer(', `${fn} sem barra de tempo`));
});

suite.test('Mapa desenhado: todo capítulo tem lugar no mapa do seu livro, longe dos vizinhos', () => {
  const Map_ = require('../js/modules/scribe-map.js');
  LANGS.forEach(([language, , table]) => {
    Campaign.BOOKS[language].forEach((book) => {
      const def = Map_.mapFor(language, book.id);
      assert.isTrue(!!def, `${language}: ${book.short} sem mapa`);
      const ids = Object.keys(table).filter((id) => table[id].book === book.id);
      ids.forEach((id) => assert.isTrue(!!def.places[id], `${id} fora do mapa do ${book.short}`));
      assert.deepEqual(Object.keys(def.places).filter((id) => !ids.includes(id)), [], 'Lugar no mapa sem capítulo');
      const pts = ids.map((id) => def.places[id]);
      pts.forEach(([x, y]) => assert.isTrue(x > 0.03 && x < 0.97 && y > 0.05 && y < 0.95, `Lugar na borda do mapa (${x}, ${y})`));
      // No celular (340 × 420) os botões de 22 px não se encostam
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.max(Math.abs(pts[i][0] - pts[j][0]) * 340, Math.abs(pts[i][1] - pts[j][1]) * 420);
        assert.isTrue(d >= 23, `${ids[i]} e ${ids[j]} se sobrepõem no mapa`);
      }
    });
  });
  assert.includes(html, 'js/modules/scribe-map.js', 'Mapa não carregado');
});

suite.test('Animações da versão nova: golpe de cada classe, letras da palavra e cenas de cada livro', () => {
  const FX = require('../js/modules/scribe-fx.js');
  ['hebrew', 'greek'].forEach((language) => Object.keys(Campaign.CLASSES).forEach((cls) => {
    const kind = FX.attackFor(language, cls);
    assert.isTrue(!!FX.ATTACK_TIME[kind] && !!FX.ATTACK_COLOR[kind], `${language}/${cls} sem golpe`);
  }));
  // Os heróis do grego têm golpes próprios: rede, pilo e carta
  assert.deepEqual(['mago', 'cavaleiro', 'assassino'].map((cls) => FX.attackFor('greek', cls)), ['rede', 'pilo', 'carta']);
  assert.deepEqual(['mago', 'cavaleiro', 'assassino'].map((cls) => FX.attackFor('hebrew', cls)), ['fogo', 'luz', 'raio']);
  assert.deepEqual(FX.lettersOf('הַשָּׁמַיִם'), ['ה', 'ש', 'מ', 'י', 'ם'], 'Letras hebraicas sem sinais');
  assert.deepEqual(FX.lettersOf('λόγος, -ου, ὁ'), ['λ', 'ο', 'γ', 'ο', 'ς', 'ο', 'υ', 'ο'], 'Letras gregas sem acentos');
  const pose = FX.heroPose({ k: 'atk', t0: 0, d: 0.3 }, 0.15);
  assert.isTrue(pose.rot > 0 && pose.dx > 0, 'Pose de ataque inclina o herói para a frente');
  LANGS.forEach(([language]) => Campaign.BOOKS[language].forEach((book) => {
    const lore = Lore.forBook(language, book.id);
    ['prologue', 'ending'].forEach((part) => {
      const slides = FX.slidesFor(language, book.id, part);
      assert.equal(slides.length, lore[part].paragraphs.length, `${language} ${book.short} ${part}: um quadro por parágrafo`);
    });
  }));
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'js/modules/scribe-chronicles.js'), 'utf8');
  ['heroStrike(', 'fx.drawProj(', 'fx.drawEnemyFX(', 'fx.drawLetters(', 'storyScenes(', 'chapterBannerLoop(', 'announce("Você caiu"'].forEach((hook) => assert.includes(src, hook, `Animação não ligada: ${hook}`));
});

suite.test('Caçada completa: todas as palavras do capítulo viram criaturas, as erradas primeiro', () => {
  LANGS.forEach(([language, chapters]) => chapters.forEach((chapter) => {
    const words = Scribe.buildCampaign([chapter], language).length ? chapter : null;
    if (!words) return;
    const stats = {};
    const all = (chapter.items || []).map(getTerm).filter(Boolean);
    if (all[3]) stats[all[3]] = { r: 0, x: 2, s: 0 };
    const waves = Scribe.buildFullWaves(chapter, stats);
    const terms = waves.flat().map((w) => getTerm(w.item));
    assert.equal(new Set(terms).size, terms.length, `${chapter.id}: palavra repetida`);
    const expected = new Set((chapter.items || []).filter((i) => getTerm(i) && (i.translations || []).length).map(getTerm));
    assert.equal(terms.length, expected.size, `${chapter.id}: faltou palavra na caçada`);
    assert.isTrue(waves.every((w) => w.length >= 1 && w.length <= Scribe.FULL_WAVE), 'Ondas de até seis');
    if (all[3] && expected.has(all[3])) assert.equal(terms[0], all[3], 'A palavra errada vem primeiro');
  }));
  assert.deepEqual(Scribe.sanitizeProgress({ full: { kelley_03: true, x: 0 } }).full, { kelley_03: true }, 'Selo guardado no progresso');
});

suite.test('Crônicas do Escriba está ligada à tela de Avaliar e ao backup', () => {
  assert.includes(html, 'data-on-click="openScribeChronicles()"', 'Cartão do modo ausente');
  assert.includes(html, 'id="scribe-view"', 'Tela do jogo ausente');
  ['scribe-campaign.js', 'scribe-lore.js', 'scribe-graphics.js', 'scribe-heroes.js', 'scribe-bosses.js', 'scribe-map.js', 'scribe-fx.js', 'scribe-chronicles.js'].forEach((file) => {
    assert.includes(html, `js/modules/${file}`, `${file} não carregado`);
  });
  assert.isTrue(html.indexOf('scribe-campaign.js') < html.indexOf('scribe-chronicles.js'), 'A campanha carrega antes do motor');
  assert.isTrue(html.indexOf('scribe-lore.js') < html.indexOf('scribe-chronicles.js'), 'A história carrega antes do motor');
  assert.includes(appJs, 'ScribeModule.loadProgress(AppState.language)', 'Backup não leva o progresso da aventura');
  assert.includes(appJs, 'mergeProgress(AppState.language, parsed.scribe)', 'Backup não restaura a aventura');
  assert.includes(html, 'data-on-click="scribeToggleTyping()"', 'Opção de digitar a resposta ausente');
});

module.exports = suite;
if (require.main === module) {
  suite.run();
}
