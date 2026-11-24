/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Módulo 26: "Estudo para exame" (modo temporário): integridade dos dados
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');
const { TestSuite, assert } = require('./test-utils');

const suite = new TestSuite('Módulo 26: Estudo para exame');
const read = (lang) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', `${lang}_chapters.json`), 'utf8'));
const exam = (lang) => read(lang).find((c) => c.id === 'estudo_exame');
const nfc = (s) => String(s || '').normalize('NFC');

suite.test('As duas línguas têm a lição do exame, marcada como especial e no fim', () => {
  ['hebrew', 'greek'].forEach((lang) => {
    const data = read(lang);
    const chap = exam(lang);
    assert.isTrue(!!chap, `${lang}: sem a lição do exame`);
    assert.equal(chap.special, 'exam');
    assert.equal(data[data.length - 1].id, 'estudo_exame', `${lang}: a lição do exame não está no fim`);
  });
});

suite.test('Hebraico: as 18 frases das provas (8 + 10), com tradução, chave, referência e análise', () => {
  const s = exam('hebrew').sentences;
  assert.equal(s.length, 18);
  assert.equal(s.filter((x) => x.group === 'prova1').length, 8);
  assert.equal(s.filter((x) => x.group === 'prova2').length, 10);
  s.forEach((x) => {
    assert.isTrue(x.translations.length > 0 && !!x.key && /^Prova [12] · \d+$/.test(x.label), `${x.hebrew}: falta tradução, chave ou rótulo`);
    assert.isTrue(Array.isArray(x.tokens) && x.tokens.length > 0, `${x.hebrew}: sem análise`);
    x.tokens.forEach((t) => {
      if (t.parts) assert.equal(nfc(t.parts.map((p) => p.segment).join('')), nfc(t.text), `${x.hebrew}: as partes não formam ${t.text}`);
      assert.isTrue(!!t.lemma && !!t.syntax_role, `${x.hebrew}: ${t.text} sem lema ou função`);
    });
  });
  assert.isTrue(exam('hebrew').items.length >= 30, 'o vocabulário das frases ficou pequeno');
});

/* Textos das Provas 1 e 2 de Grego 2, como saíram nas provas (transcrição) */
const PROVAS_GREGO = {
  prova1: {
    vocab: ['ἵνα', 'λόγος', 'ἀπό', 'νόμος', 'δόξα', 'μήτηρ', 'σύν', 'ὑπό', 'ἕτερος', 'πιστός', 'μᾶλλον', 'ὑπέρ', 'ὅστις', 'αἴρω', 'μαρτυρέω', 'φανερόω', 'δύναμις', 'ὀπίσω', 'αὐτοί', 'υἱός'],
    text: `εὑρήκαμεν Ἰησοῦν τὸν υἱὸν τοῦ Ἰωσὴφ τὸν ἀπὸ Ναζαρέτ. εἶπεν Ναθαναήλ, Ἐκ Ναζαρὲτ δύναταί τι ἀγαθὸν εἶναι;
      Εἶδεν ὁ Ἰησοῦς τὸν Ναθαναὴλ ἐρχόμενον πρὸς αὐτὸν καὶ λέγει περὶ αὐτοῦ, Ἴδε ἀληθῶς Ἰσραηλίτης, ἐν ᾧ δόλος οὐκ ἔστιν.
      [Ἰωάννης] βλέπει τὸν Ἰησοῦν ἐρχόμενον πρὸς αὐτὸν καὶ λέγει, Ἴδε ὁ ἀμνὸς τοῦ Θεοῦ, ὁ αἴρων τὴν ἁμαρτίαν τοῦ
      κόσμου. Οὗτός ἐστιν περὶ οὗ ἐγὼ εἶπον, Ὀπίσω μου ἔρχεται ἀνὴρ ὃς ἔμπροσθέν μου γέγονεν, ὅτι πρῶτός μου ἦν.
      Κἀγὼ οὐκ ᾔδειν αὐτόν, ἀλλ’ ἵνα φανερωθῇ τῷ Ἰσραήλ, διὰ τοῦτο ἦλθον ἐγὼ ἐν ὕδατι βαπτίζων. Καὶ ἐμαρτύρησεν
      Ἰωάννης λέγων ὅτι Τεθέαμαι τὸ Πνεῦμα καταβαῖνον ὡσεὶ περιστερὰν ἐξ οὐρανοῦ, καὶ ἔμεινεν ἐπ’ αὐτόν. Κἀγὼ
      οὐκ ᾔδειν αὐτόν, ἀλλ’ ὁ πέμψας με βαπτίζειν ἐν ὕδατι, ἐκεῖνός μοι εἶπεν, Ἐφ’ ὃν ἂν ἴδῃς τὸ Πνεῦμα καταβαῖνον
      καὶ μένον ἐπ’ αὐτόν, οὗτός ἐστιν ὁ βαπτίζων ἐν Πνεύματι Ἁγίῳ. Κἀγὼ ἑώρακα ὅτι οὗτός ἐστιν ὁ υἱὸς τοῦ Θεοῦ.
      μείζων ἐστὶν ὁ ἐν ὑμῖν ἢ ὁ ἐν τῷ κόσμῳ.`,
  },
  prova2: {
    vocab: ['τις', 'Χριστός', 'ἔχω', 'ποιέω', 'ἄνθρωπος', 'ἡμέρα', 'νεκρός', 'δύναμαι', 'ὄνομα', 'πρῶτος', 'πολύς', 'ἑαυτοῦ', 'λαμβάνω', 'εἷς', 'καλέω', 'ὑπάγω', 'εὐθέως', 'σάρξ', 'βασιλεύς', 'πόλις'],
    text: `Ἐγένετο ἄνθρωπος ἀπεσταλμένος παρὰ θεοῦ, ὄνομα αὐτῷ Ἰωάννης. Οὗτος ἦλθεν εἰς μαρτυρίαν, ἵνα
      μαρτυρήσῃ περὶ τοῦ φωτός, ἵνα πάντες πιστεύσωσιν δι’ αὐτοῦ. Οὐκ ἦν ἐκεῖνος τὸ φῶς, ἀλλ’ ἵνα μαρτυρήσῃ
      περὶ τοῦ φωτός. Εἰς τὰ ἴδια ἦλθεν, καὶ οἱ ἴδιοι αὐτὸν οὐ παρέλαβον. Ὅσοι δὲ ἔλαβον αὐτόν, ἔδωκεν
      αὐτοῖς ἐξουσίαν τέκνα Θεοῦ γενέσθαι, τοῖς πιστεύουσιν εἰς τὸ ὄνομα αὐτοῦ οἳ οὐκ ἐξ αἱμάτων, οὐδὲ ἐκ
      θελήματος σαρκός, οὐδὲ ἐκ θελήματος ἀνδρός, ἀλλ’ ἐκ Θεοῦ ἐγεννήθησαν.
      Καὶ ἐδίδασκεν αὐτοὺς ἐν παραβολαῖς πολλά, καὶ ἔλεγεν αὐτοῖς ἐν τῇ διδαχῇ αὐτοῦ...
      Καὶ ἰδὼν (vendo) συκῆν (figueira) μίαν ἐπὶ τῆς ὁδοῦ, ἦλθεν ἐπ’ αὐτήν, καὶ οὐδὲν εὗρεν ἐν αὐτῇ...
      Ἐγὼ ἐβάπτισα ὑμᾶς ἐν ὕδατι, αὐτὸς δὲ βαπτίσει ὑμᾶς ἐν Πνεύματι Ἁγίῳ. Καὶ ἐγένετο ἐν ἐκείναις ταῖς
      ἡμέραις, ἦλθεν Ἰησοῦς καὶ ἐβαπτίσθη ὑπὸ Ἰωάννου εἰς τὸν Ἰορδάνην.
      Λέγω δέ, Πνεύματι περιπατεῖτε, καὶ ἐπιθυμίαν σαρκὸς οὐ μὴ (com certeza não) τελέσητε (satisfarão).
      Ἀπεκρίθη αὐτοῖς ὁ Ἰησοῦς καὶ εἶπεν, Ἀμὴν ἀμὴν λέγω ὑμῖν, ζητεῖτέ με οὐχ ὅτι εἴδετε σημεῖα, ἀλλ’ ὅτι ἐφάγετε
      ἐκ τῶν ἄρτων καὶ ἐχορτάσθητε. Εἶπεν οὖν αὐτοῖς ὁ Ἰησοῦς, Ἐγώ εἰμι ὁ ἄρτος τῆς ζωῆς.`,
  },
};
/** Compara grego sem acento, caixa, pontuação nem as glosas entre parênteses da prova */
const plainGreek = (s) => ` ${String(s || '').replace(/\([^)]*\)/g, ' ').normalize('NFD').replace(/[̀-ͯͅ]/g, '')
  .toLowerCase().replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim()} `;

suite.test('Grego: só entra o que está nas Provas 1 e 2 (palavras, frases e tabela)', () => {
  const chap = exam('greek');
  ['prova1', 'prova2'].forEach((prova) => {
    const { vocab, text } = PROVAS_GREGO[prova];
    const words = chap.items.filter((i) => i.kind === 'vocab' && i.group === prova).map((i) => plainGreek(i.term.split(/[,(/]/)[0]));
    assert.deepEqual(words.sort(), vocab.map(plainGreek).sort(), `${prova}: vocabulário diferente do da prova`);
    const plainText = plainGreek(text);
    chap.sentences.filter((s) => s.group === prova).forEach((s) => {
      assert.isTrue(plainText.includes(plainGreek(s.term)), `${s.id} não está no texto da ${prova}: ${s.term}`);
    });
    chap.items.filter((i) => i.kind === 'tabela' && i.group === prova).forEach((i) => {
      assert.isTrue(plainText.includes(plainGreek(i.term)), `Tabela da ${prova} com forma de fora da prova: ${i.term}`);
    });
  });
  const groups = [...chap.items, ...chap.sentences].map((x) => x.group);
  assert.isTrue(groups.every((g) => g === 'prova1' || g === 'prova2'), 'Item do grego sem prova de origem');
});

suite.test('Grego: 40 palavras (20 + 20) com a resposta do gabarito primeiro', () => {
  const items = exam('greek').items.filter((i) => i.kind === 'vocab');
  assert.equal(items.length, 40);
  assert.equal(items.filter((i) => i.group === 'prova1').length, 20);
  assert.equal(items.filter((i) => i.group === 'prova2').length, 20);
  const logos = items.find((i) => i.term.startsWith('λόγος'));
  assert.deepEqual(logos.translations.slice(0, 2), ['palavra', 'verbo']);
  const eis = items.find((i) => i.term.startsWith('εἷς'));
  assert.equal(eis.translations[0], 'um', 'εἷς confundido com a preposição εἰς');
});

suite.test('Grego: a tabela de análise traz classificação e chave; as frases têm tradução, chave e análise', () => {
  const chap = exam('greek');
  const table = chap.items.filter((i) => i.kind === 'tabela');
  assert.isTrue(table.length >= 30);
  table.forEach((i) => assert.isTrue(/—/.test(i.type) && !!i.key && !!i.label, `${i.term}: falta classificação ou chave`));
  chap.sentences.forEach((x) => {
    assert.isTrue(x.translations.length > 0 && !!x.key && !!x.group, `${x.term}: falta tradução, chave ou prova`);
    assert.isTrue(Array.isArray(x.tokens) && x.tokens.length > 0, `${x.term}: sem análise`);
  });
  assert.isTrue(chap.sentences.some((x) => x.ref === 'Jo 6.26'), 'faltou Jo 6.26');
});

suite.test('Grego: "Raízes" traz só as 40 palavras e "Forma do léxico" pede o dicionário de cada forma da tabela', () => {
  const ExamMode = require('../js/modules/exam-mode.js');
  const chap = exam('greek');
  const raizes = ExamMode.filterWords(chap.items, 'raizes');
  assert.equal(raizes.length, 40, 'Raízes: as 40 palavras do vocabulário das provas');
  assert.isTrue(raizes.every((i) => i.kind === 'vocab'), 'Raízes sem formas da tabela');
  const tabela = chap.items.filter((i) => i.kind === 'tabela');
  tabela.forEach((i) => assert.isTrue(/^[\u0370-\u03FF\u1F00-\u1FFF]/.test(nfc(i.lexico || '')), `Forma da tabela sem léxico: ${i.term}`));
  // Quando a chave do gabarito diz o léxico, o campo concorda com ela
  tabela.forEach((i) => {
    const m = /Léxico ([^\s.,(]+)/.exec(i.key || '');
    if (m) assert.equal(nfc(i.lexico.split(',')[0].trim()), nfc(m[1]), `Léxico diferente da chave em ${i.term}`);
  });
  const lexico = ExamMode.filterWords(chap.items, 'lexico');
  assert.equal(lexico.length, tabela.length);
  lexico.forEach((q, n) => {
    assert.equal(q.kind, 'lexico');
    assert.equal(q.term, tabela[n].term);
    assert.equal(q.translations[0], tabela[n].lexico, 'A resposta é a forma do léxico');
    assert.isTrue(q.translations.includes(tabela[n].lexico.split(',')[0].trim()), 'Aceita só a palavra, sem genitivo e artigo');
  });
  assert.equal(tabela[0].kind, 'tabela', 'A forma do léxico não muda o item da tabela');
});

module.exports = suite;

if (require.main === module) {
  suite.run();
}
