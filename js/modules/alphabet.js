/**
 * ==========================================================================
 * Gamida - Motor Gamificado do Alfabeto (Alef-Bet Hebraico & Alfabeto Grego)
 * ==========================================================================
 */

(function () {
const _stateModule = (typeof window !== "undefined" && window.AppState) ? window : (typeof require !== "undefined" ? require("./state.js") : {});
const AppState = (typeof window !== "undefined" && window.AppState) || _stateModule.AppState;
const isAlphabetChapter = (typeof window !== "undefined" && window.isAlphabetChapter) || _stateModule.isAlphabetChapter;
const shuffleArray = (typeof window !== "undefined" && window.shuffleArray) || _stateModule.shuffleArray;
const updateStatsUI = (typeof window !== "undefined" && window.updateStatsUI) || _stateModule.updateStatsUI;

const AlphabetGameEngine = {
  hebrewAlphabet: [
    { order: 1, glyph: "א", name: "Alef", sound: "Mudo / Oclusiva glotal", translit: "alef", value: 1 },
    { order: 2, glyph: "ב", name: "Bet", sound: "B (com dagesh) / V (sem)", translit: "bet", value: 2, begadkefat: true, dagesh: "בּ" },
    { order: 3, glyph: "ג", name: "Gimel", sound: "G (duro como em gato)", translit: "gimel", value: 3, begadkefat: true, dagesh: "גּ" },
    { order: 4, glyph: "ד", name: "Dalet", sound: "D (como em dado)", translit: "dalet", value: 4, begadkefat: true, dagesh: "דּ" },
    { order: 5, glyph: "ה", name: "He", sound: "H (aspirado)", translit: "he", value: 5, guttural: true },
    { order: 6, glyph: "ו", name: "Vav", sound: "V (como em vida)", translit: "vav", value: 6 },
    { order: 7, glyph: "ז", name: "Zayin", sound: "Z (como em zebra)", translit: "zayin", value: 7 },
    { order: 8, glyph: "ח", name: "Het", sound: "Kh (gutural áspero)", translit: "het", value: 8, guttural: true },
    { order: 9, glyph: "ט", name: "Tet", sound: "T (enfático)", translit: "tet", value: 9 },
    { order: 10, glyph: "י", name: "Yod", sound: "Y / I (semivogal)", translit: "yod", value: 10 },
    { order: 11, glyph: "כ", name: "Kaf", sound: "K (com dagesh) / Kh (sem)", translit: "kaf", value: 20, begadkefat: true, dagesh: "כּ", sofit: "ך" },
    { order: 12, glyph: "ל", name: "Lamed", sound: "L (como em luz)", translit: "lamed", value: 30 },
    { order: 13, glyph: "מ", name: "Mem", sound: "M (como em mar)", translit: "mem", value: 40, sofit: "ם" },
    { order: 14, glyph: "נ", name: "Nun", sound: "N (como em navio)", translit: "nun", value: 50, sofit: "ן" },
    { order: 15, glyph: "ס", name: "Samekh", sound: "S (como em sol)", translit: "samekh", value: 60 },
    { order: 16, glyph: "ע", name: "Ayin", sound: "Gutural profunda", translit: "ayin", value: 70, guttural: true },
    { order: 17, glyph: "פ", name: "Pe", sound: "P (com dagesh) / F (sem)", translit: "pe", value: 80, begadkefat: true, dagesh: "פּ", sofit: "ף" },
    { order: 18, glyph: "צ", name: "Tsade", sound: "Ts (como em pizza)", translit: "tsade", value: 90, sofit: "ץ" },
    { order: 19, glyph: "ק", name: "Qof", sound: "Q / K (como em quase)", translit: "qof", value: 100 },
    { order: 20, glyph: "ר", name: "Resh", sound: "R (suave como em caro)", translit: "resh", value: 200 },
    { order: 21, glyph: "ש", name: "Shin / Sin", sound: "Sh / S", translit: "shin/sin", value: 300 },
    { order: 22, glyph: "ת", name: "Tav", sound: "T (como em terra)", translit: "tav", value: 400, begadkefat: true, dagesh: "תּ" }
  ],

  hebrewTwinGroups: [
    { target: "ד", name: "Dalet", twins: ["ר", "ך", "ו"], tip: "Dalet (ד) possui uma ponta saliente no canto superior direito. Resh (ר) é totalmente arredondada." },
    { target: "ר", name: "Resh", twins: ["ד", "ך", "ו"], tip: "Resh (ר) tem o canto superior direito contínuo e curvado sem nenhuma ponta." },
    { target: "ה", name: "He", twins: ["ח", "ת", "ח"], tip: "He (ה) tem abertura evidente no canto superior esquerdo da perna esquerda." },
    { target: "ח", name: "Het", twins: ["ה", "ת", "ה"], tip: "Het (ח) é completamente fechada no topo por uma barra horizontal contínua." },
    { target: "ת", name: "Tav", twins: ["ה", "ח", "ח"], tip: "Tav (ת) tem um pezinho saliente e curvado na perna esquerda." },
    { target: "ב", name: "Bet", twins: ["כ", "נ", "ם"], tip: "Bet (ב) tem uma base projetada para a direita além da haste vertical." },
    { target: "כ", name: "Kaf", twins: ["ב", "פ", "נ"], tip: "Kaf (כ) tem cantos arredondados sem ponta na base inferior." },
    { target: "ו", name: "Vav", twins: ["ז", "ן", "י"], tip: "Vav (ו) é uma haste vertical simples de altura padrão." },
    { target: "ז", name: "Zayin", twins: ["ו", "ן", "ר"], tip: "Zayin (ז) tem uma pequena coroa horizontal centralizada no topo." },
    { target: "ן", name: "Nun Sofit", twins: ["ו", "ז", "ר"], tip: "Nun Sofit (ן) é uma haste vertical longa que ultrapassa a linha base para baixo." },
    { target: "ם", name: "Mem Sofit", twins: ["ס", "מ", "ט"], tip: "Mem Sofit (ם) é quadrangular e reto; Samekh (ס) é circular e arredondado." },
    { target: "ס", name: "Samekh", twins: ["ם", "מ", "ט"], tip: "Samekh (ס) é ovalada/redonda no topo e na base; Mem Sofit (ם) é reta e quadrada." },
    { target: "ע", name: "Ayin", twins: ["צ", "ץ", "ש"], tip: "Ayin (ע) tem o traço direito inclinado para dentro sem apoiar na base." },
    { target: "צ", name: "Tsade", twins: ["ע", "ץ", "ש"], tip: "Tsade (צ) tem o bracinho direito voltado para cima e apoiado na base horizontal." }
  ],

  greekAlphabet: [
    { order: 1, glyph: "α", uppercase: "Α", name: "Alpha", sound: "A", translit: "a" },
    { order: 2, glyph: "β", uppercase: "Β", name: "Beta", sound: "B", translit: "b" },
    { order: 3, glyph: "γ", uppercase: "Γ", name: "Gamma", sound: "G", translit: "g" },
    { order: 4, glyph: "δ", uppercase: "Δ", name: "Delta", sound: "D", translit: "d" },
    { order: 5, glyph: "ε", uppercase: "Ε", name: "Epsilon", sound: "E (breve)", translit: "e" },
    { order: 6, glyph: "ζ", uppercase: "Ζ", name: "Zeta", sound: "Z / Dz", translit: "z" },
    { order: 7, glyph: "η", uppercase: "Η", name: "Eta", sound: "Ê (longo)", translit: "ē" },
    { order: 8, glyph: "θ", uppercase: "Θ", name: "Theta", sound: "Th (aspirado)", translit: "th" },
    { order: 9, glyph: "ι", uppercase: "Ι", name: "Iota", sound: "I", translit: "i" },
    { order: 10, glyph: "κ", uppercase: "Κ", name: "Kappa", sound: "K", translit: "k" },
    { order: 11, glyph: "λ", uppercase: "Λ", name: "Lambda", sound: "L", translit: "l" },
    { order: 12, glyph: "μ", uppercase: "Μ", name: "Mu", sound: "M", translit: "m" },
    { order: 13, glyph: "ν", uppercase: "Ν", name: "Nu", sound: "N", translit: "n" },
    { order: 14, glyph: "ξ", uppercase: "Ξ", name: "Xi", sound: "X / Ks", translit: "x" },
    { order: 15, glyph: "ο", uppercase: "Ο", name: "Omicron", sound: "O (breve)", translit: "o" },
    { order: 16, glyph: "π", uppercase: "Π", name: "Pi", sound: "P", translit: "p" },
    { order: 17, glyph: "ρ", uppercase: "Ρ", name: "Rho", sound: "R", translit: "r" },
    { order: 18, glyph: "σ", uppercase: "Σ", name: "Sigma", sound: "S", translit: "s", final: "ς" },
    { order: 19, glyph: "τ", uppercase: "Τ", name: "Tau", sound: "T", translit: "t" },
    { order: 20, glyph: "υ", uppercase: "Υ", name: "Upsilon", sound: "U / Y (ü)", translit: "y" },
    { order: 21, glyph: "φ", uppercase: "Φ", name: "Phi", sound: "Ph / F", translit: "ph" },
    { order: 22, glyph: "χ", uppercase: "Χ", name: "Chi", sound: "Ch / Kh", translit: "ch" },
    { order: 23, glyph: "ψ", uppercase: "Ψ", name: "Psi", sound: "Ps", translit: "ps" },
    { order: 24, glyph: "ω", uppercase: "Ω", name: "Omega", sound: "Ô (longo)", translit: "ō" }
  ],

  greekTwinGroups: [
    { target: "ν", name: "Nu", twins: ["υ", "γ", "κ"], tip: "Nu (ν) parece 'v' mas equivale ao som 'n' (como em navio); Upsilon (υ) é arredondado." },
    { target: "υ", name: "Upsilon", twins: ["ν", "γ", "μ"], tip: "Upsilon (υ) tem base curvada e arredondada, parecendo um cálice." },
    { target: "η", name: "Eta", twins: ["μ", "π", "ν"], tip: "Eta (η) parece 'n' com a perna direita alongada para baixo; é a vogal 'ê' longa." },
    { target: "ρ", name: "Rho", twins: ["β", "φ", "θ"], tip: "Rho (ρ) parece 'p' mas equivale ao 'r' vibrante." },
    { target: "χ", name: "Chi", twins: ["κ", "γ", "λ"], tip: "Chi (χ) parece 'x' mas tem som gutural aspirado /kh/." },
    { target: "θ", name: "Theta", twins: ["ο", "φ", "σ"], tip: "Theta (θ) é um círculo cortado horizontalmente no meio." },
    { target: "φ", name: "Phi", twins: ["ψ", "θ", "ρ"], tip: "Phi (φ) é um círculo cortado verticalmente no meio." },
    { target: "ψ", name: "Psi", twins: ["φ", "υ", "ξ"], tip: "Psi (ψ) é um tridente com haste central vertical." },
    { target: "ξ", name: "Xi", twins: ["ζ", "ε", "ψ"], tip: "Xi (ξ) são três curvas horizontais empilhadas." },
    { target: "ς", name: "Sigma Final", twins: ["σ", "ο", "δ"], tip: "Sigma final (ς) é usado estritamente na última letra de palavras gregas." }
  ],

  currentChallenge: null,
  answered: false,

  getCurrentList() {
    return AppState.language === "hebrew" ? this.hebrewAlphabet : this.greekAlphabet;
  },

  getTwinGroups() {
    return AppState.language === "hebrew" ? this.hebrewTwinGroups : this.greekTwinGroups;
  },

  init(submode = "order") {
    AppState.alphabetSubmode = submode;
    this.answered = false;
    this.nextChallenge();
  },

  nextChallenge() {
    this.answered = false;
    const submode = AppState.alphabetSubmode || "order";
    const feedbackBanner = document.getElementById("alphabet-feedback-banner");
    if (feedbackBanner) feedbackBanner.classList.add("hidden");

    if (submode === "order") {
      this.currentChallenge = this.generateOrderChallenge();
    } else if (submode === "impostors") {
      this.currentChallenge = this.generateImpostorChallenge();
    } else if (submode === "shapes") {
      this.currentChallenge = this.generateShapesChallenge();
    } else {
      this.currentChallenge = this.generateOrderChallenge();
    }

    this.renderChallenge();
  },

  generateOrderChallenge() {
    const list = this.getCurrentList();
    const maxOrder = list.length;

    const randIdx = Math.floor(Math.random() * list.length);
    const target = list[randIdx];

    let askAfter = Math.random() > 0.5;
    if (target.order === 1) askAfter = true;
    if (target.order === maxOrder) askAfter = false;

    const correctOrder = askAfter ? target.order + 1 : target.order - 1;
    const correctLetter = list.find((l) => l.order === correctOrder);

    const otherLetters = list.filter((l) => l.order !== correctOrder && l.order !== target.order);
    const shuffledOthers = shuffleArray(otherLetters);
    const distractors = shuffledOthers.slice(0, 3);

    const options = shuffleArray([
      { glyph: correctLetter.glyph, isCorrect: true },
      ...distractors.map((d) => ({
        glyph: d.glyph,
        isCorrect: false,
      })),
    ]);

    const dirText = askAfter ? "DEPOIS" : "ANTES";
    const instruction = `Quem vem <span class="text-amber-400 font-bold">${dirText}</span> da letra em destaque na ordem alfabética?`;

    return {
      badge: `🎯 Ordem Alfabética`,
      instruction: instruction,
      targetGlyph: target.glyph,
      targetSubtext: `Letra ${target.name} (Som: ${target.sound})`,
      options: options,
      explanation: `Na ordem alfabética, a letra que vem ${dirText.toLowerCase()} do <strong>${target.name} (${target.glyph})</strong> é <strong>${correctLetter.name} (${correctLetter.glyph})</strong> (${correctLetter.order}ª posição).`,
    };
  },

  generateImpostorChallenge() {
    const groups = this.getTwinGroups();
    const group = groups[Math.floor(Math.random() * groups.length)];
    const list = this.getCurrentList();

    const uniqueTwins = Array.from(
      new Set(group.twins.filter((t) => t !== group.target)),
    );
    const shuffledTwins = shuffleArray(uniqueTwins);

    const distractors = shuffledTwins.slice(0, 3);
    if (distractors.length < 3) {
      const extraPool = list
        .map((l) => l.glyph)
        .filter((g) => g !== group.target && !distractors.includes(g));
      const shuffledExtra = shuffleArray(extraPool);
      while (distractors.length < 3 && shuffledExtra.length > 0) {
        distractors.push(shuffledExtra.pop());
      }
    }

    const options = shuffleArray([
      { glyph: group.target, isCorrect: true },
      ...distractors.map((t) => ({
        glyph: t,
        isCorrect: false,
      })),
    ]);

    return {
      badge: "⚖️ Detector de Impostores",
      instruction: `Qual destes glifos é a letra <span class="text-emerald-400 font-bold font-sans">${group.name}</span>?`,
      targetGlyph: "⚖️",
      targetSubtext: `Letra ${group.name} (Atenção aos detalhes do traçado!)`,
      options: options,
      explanation: group.tip,
    };
  },

  generateShapesChallenge() {
    if (AppState.language === "hebrew") {
      const isSofit = Math.random() > 0.4;
      if (isSofit) {
        const sofitLetters = [
          { regular: "כ", sofit: "ך", name: "Kaf", order: 11 },
          { regular: "מ", sofit: "ם", name: "Mem", order: 13 },
          { regular: "נ", sofit: "ן", name: "Nun", order: 14 },
          { regular: "פ", sofit: "ף", name: "Pe", order: 17 },
          { regular: "צ", sofit: "ץ", name: "Tsade", order: 18 },
        ];
        const target = sofitLetters[Math.floor(Math.random() * sofitLetters.length)];
        const askSofit = Math.random() > 0.5;

        if (askSofit) {
          const otherSofits = shuffleArray(sofitLetters.filter((s) => s.sofit !== target.sofit));
          const options = shuffleArray([
            { glyph: target.sofit, isCorrect: true },
            ...otherSofits.slice(0, 3).map((o) => ({
              glyph: o.sofit,
              isCorrect: false,
            })),
          ]);
          return {
            badge: "🔄 Formas Finais (Sofit)",
            instruction: `Qual é a <span class="text-indigo-400 font-bold">forma final (Sofit)</span> correta para a letra em destaque?`,
            targetGlyph: target.regular,
            targetSubtext: `Letra ${target.name} (Posição inicial/medial)`,
            options: options,
            explanation: `A letra <strong>${target.name} (${target.regular})</strong> transforma-se em <strong>${target.sofit}</strong> quando ocorre na última posição de uma palavra.`,
          };
        } else {
          const otherRegulars = shuffleArray(sofitLetters.filter((s) => s.regular !== target.regular));
          const options = shuffleArray([
            { glyph: target.regular, isCorrect: true },
            ...otherRegulars.slice(0, 3).map((o) => ({
              glyph: o.regular,
              isCorrect: false,
            })),
          ]);
          return {
            badge: "🔄 Formas Finais (Sofit)",
            instruction: `Esta é uma letra Sofit (final). Qual é a sua <span class="text-indigo-400 font-bold">forma regular (inicial/medial)</span>?`,
            targetGlyph: target.sofit,
            targetSubtext: `Letra ${target.name} Sofit (Final de palavra)`,
            options: options,
            explanation: `A forma Sofit <strong>${target.sofit}</strong> corresponde à letra regular <strong>${target.regular} (${target.name})</strong>.`,
          };
        }
      } else {
        const begadkefat = [
          { letter: "בּ", name: "Bet", sound: "B (som oclusivo forte como em bola)", wrong: "V (som fricativo suave como em vida)" },
          { letter: "ב", name: "Bet (Vet)", sound: "V (som fricativo suave como em vida)", wrong: "B (som oclusivo forte como em bola)" },
          { letter: "כּ", name: "Kaf", sound: "K (som oclusivo como em casa)", wrong: "Kh (som gutural como em Bach)" },
          { letter: "כ", name: "Kaf (Khaf)", sound: "Kh (som gutural como em Bach)", wrong: "K (som oclusivo como em casa)" },
          { letter: "פּ", name: "Pe", sound: "P (som oclusivo como em pato)", wrong: "F (som fricativo como em foto)" },
          { letter: "פ", name: "Pe (Fe)", sound: "F (som fricativo como em foto)", wrong: "P (som oclusivo como em pato)" },
        ];
        const item = begadkefat[Math.floor(Math.random() * begadkefat.length)];
        const options = shuffleArray([
          { glyph: "🔊", subtext: item.sound, isCorrect: true, isTextCard: true },
          { glyph: "❌", subtext: item.wrong, isCorrect: false, isTextCard: true },
        ]);
        return {
          badge: "🔄 Regra do Dagesh (Begadkefat)",
          instruction: `Qual é o <span class="text-amber-400 font-bold">som fonético</span> correto desta letra?`,
          targetGlyph: item.letter,
          targetSubtext: `Letra ${item.name}`,
          options: options,
          explanation: `A letra <strong>${item.letter} (${item.name})</strong> produz o som: <strong>${item.sound}</strong>.`,
        };
      }
    } else {
      const list = this.greekAlphabet;
      const target = list[Math.floor(Math.random() * list.length)];
      const askLower = Math.random() > 0.5;
      const otherLetters = shuffleArray(list.filter((l) => l.order !== target.order));

      if (askLower) {
        const options = shuffleArray([
          { glyph: target.glyph, isCorrect: true },
          ...otherLetters.slice(0, 3).map((o) => ({
            glyph: o.glyph,
            isCorrect: false,
          })),
        ]);
        return {
          badge: "🔄 Maiúsculas & Minúsculas",
          instruction: `Qual é a <span class="text-amber-400 font-bold">forma minúscula</span> correspondente a esta letra maiúscula?`,
          targetGlyph: target.uppercase,
          targetSubtext: `Letra ${target.name} (Maiúscula)`,
          options: options,
          explanation: `A letra maiúscula <strong>${target.uppercase}</strong> (${target.name}) corresponde à minúscula <strong>${target.glyph}</strong>.`,
        };
      } else {
        const options = shuffleArray([
          { glyph: target.uppercase, isCorrect: true },
          ...otherLetters.slice(0, 3).map((o) => ({
            glyph: o.uppercase,
            isCorrect: false,
          })),
        ]);
        return {
          badge: "🔄 Maiúsculas & Minúsculas",
          instruction: `Qual é a <span class="text-amber-400 font-bold">forma maiúscula</span> correspondente a esta letra minúscula?`,
          targetGlyph: target.glyph,
          targetSubtext: `Letra ${target.name} (Minúscula)`,
          options: options,
          explanation: `A letra minúscula <strong>${target.glyph}</strong> (${target.name}) corresponde à maiúscula <strong>${target.uppercase}</strong>.`,
        };
      }
    }
  },

  renderChallenge() {
    if (!this.currentChallenge || typeof document === "undefined") return;
    const c = this.currentChallenge;

    const badgeEl = document.getElementById("alphabet-game-badge");
    const instEl = document.getElementById("alphabet-instruction");
    const targetGlyphEl = document.getElementById("alphabet-target-glyph");
    const targetSubtextEl = document.getElementById("alphabet-target-subtext");
    const gridEl = document.getElementById("alphabet-options-grid");
    const scoreEl = document.getElementById("alphabet-score-indicator");
    const comboBadge = document.getElementById("alphabet-combo-badge");
    const progressEl = document.getElementById("alphabet-progress-indicator");

    if (badgeEl) badgeEl.textContent = c.badge;
    if (instEl) instEl.innerHTML = c.instruction;
    if (targetGlyphEl) {
      targetGlyphEl.textContent = c.targetGlyph;
      targetGlyphEl.className = `${AppState.language === "hebrew" ? "hebrew-text" : "greek-text"} text-5xl md:text-7xl font-bold text-white tracking-wide leading-relaxed drop-shadow-lg transition-transform animate-letter-glow select-none`;
    }
    if (targetSubtextEl) targetSubtextEl.textContent = c.targetSubtext;

    if (scoreEl) scoreEl.textContent = `⭐ Pontos: ${AppState.score || 0}`;
    if (progressEl) progressEl.textContent = `Streak: ${AppState.streak || 0}`;

    if (comboBadge) {
      if (AppState.streak >= 2) {
        comboBadge.classList.remove("hidden");
        comboBadge.textContent = `🔥 Combo x${AppState.streak}`;
      } else {
        comboBadge.classList.add("hidden");
      }
    }

    if (!gridEl) return;
    gridEl.innerHTML = "";

    const fontClass = AppState.language === "hebrew" ? "hebrew-text" : "greek-text";

    c.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "alphabet-card-hover group relative bg-slate-950/80 hover:bg-slate-800 border-2 border-slate-800 hover:border-brand-500/80 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center transition-all duration-200 shadow-md cursor-pointer text-center";
      btn.onclick = () => this.checkAnswer(idx, btn);

      if (opt.isTextCard) {
        btn.innerHTML = `
          <div class="text-2xl mb-1">${opt.glyph}</div>
          <div class="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white leading-tight">${opt.subtext || ""}</div>
        `;
      } else {
        const subtextHtml = opt.subtext
          ? `<div class="text-[11px] md:text-xs font-mono text-slate-400 group-hover:text-slate-200 leading-tight mt-1">${opt.subtext}</div>`
          : "";
        btn.innerHTML = `
          <div class="${fontClass} text-4xl md:text-5xl font-bold text-white group-hover:text-brand-300 transition-colors select-none leading-normal py-1">${opt.glyph}</div>
          ${subtextHtml}
        `;
      }

      gridEl.appendChild(btn);
    });
  },

  checkAnswer(selectedIndex) {
    if (this.answered || !this.currentChallenge) return;
    this.answered = true;

    const opt = this.currentChallenge.options[selectedIndex];
    const isCorrect = opt && opt.isCorrect;

    AppState.totalAnswered = (AppState.totalAnswered || 0) + 1;

    const gridEl = document.getElementById("alphabet-options-grid");
    const buttons = gridEl ? gridEl.querySelectorAll("button") : [];

    buttons.forEach((b, i) => {
      b.disabled = true;
      const optionData = this.currentChallenge.options[i];
      if (optionData.isCorrect) {
        b.className = "group relative bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-500/20";
      } else if (i === selectedIndex && !isCorrect) {
        b.className = "group relative bg-rose-950/60 border-2 border-rose-500 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-rose-500/20 animate-shake-wrong";
      } else {
        b.className = "group relative bg-slate-950/40 border-2 border-slate-800/60 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center opacity-40";
      }
    });

    if (isCorrect) {
      AppState.correctCount = (AppState.correctCount || 0) + 1;
      AppState.streak = (AppState.streak || 0) + 1;
      const pointsEarned = 10 * Math.min(AppState.streak, 5);
      AppState.score = (AppState.score || 0) + pointsEarned;
      this.renderFeedback(true, `+${pointsEarned} pts! ${this.currentChallenge.explanation}`);
    } else {
      AppState.streak = 0;
      this.renderFeedback(false, this.currentChallenge.explanation);
    }

    updateStatsUI();

    const scoreEl = document.getElementById("alphabet-score-indicator");
    const comboBadge = document.getElementById("alphabet-combo-badge");
    const progressEl = document.getElementById("alphabet-progress-indicator");

    if (scoreEl) scoreEl.textContent = `⭐ Pontos: ${AppState.score}`;
    if (progressEl) progressEl.textContent = `Streak: ${AppState.streak}`;
    if (comboBadge) {
      if (AppState.streak >= 2) {
        comboBadge.classList.remove("hidden");
        comboBadge.textContent = `🔥 Combo x${AppState.streak}`;
      } else {
        comboBadge.classList.add("hidden");
      }
    }
  },

  renderFeedback(isCorrect, explanation) {
    const banner = document.getElementById("alphabet-feedback-banner");
    const icon = document.getElementById("alphabet-feedback-icon");
    const title = document.getElementById("alphabet-feedback-title");
    const detail = document.getElementById("alphabet-feedback-detail");

    if (!banner || !icon || !title || !detail) return;

    banner.classList.remove("hidden");

    if (isCorrect) {
      banner.className =
        "mt-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all bg-emerald-950/80 border-emerald-500/50 text-emerald-200 animate-fadeIn";
      icon.textContent = "🎯";
      title.textContent = "Excelente! Resposta Correta!";
      detail.innerHTML = explanation;
    } else {
      banner.className =
        "mt-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all bg-rose-950/80 border-rose-500/50 text-rose-200 animate-fadeIn";
      icon.textContent = "💡";
      title.textContent = "Atenção ao detalhe!";
      detail.innerHTML = explanation;
    }
  },
};

function setAlphabetSubmode(submode) {
  AppState.alphabetSubmode = submode;
  const modes = ["order", "impostors", "shapes", "classic"];
  modes.forEach((m) => {
    const btn = document.getElementById(`alpha-mode-${m}`);
    if (btn) {
      if (m === submode) {
        btn.className =
          "px-3 py-1.5 rounded-lg font-medium transition bg-brand-600 text-white flex items-center gap-1.5 shadow-sm";
      } else {
        btn.className =
          "px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200 flex items-center gap-1.5";
      }
    }
  });

  updatePracticeChapterView();
}

function nextAlphabetChallenge() {
  AlphabetGameEngine.nextChallenge();
}

function updatePracticeChapterView() {
  if (typeof document === "undefined") return;
  const isAlpha = isAlphabetChapter(AppState.currentChapter);
  const stdControls = document.getElementById("standard-mode-controls");
  const alphaControls = document.getElementById("alphabet-mode-controls");
  const stdPanel = document.getElementById("standard-practice-panel");
  const alphaPanel = document.getElementById("alphabet-game-panel");
  const btnSentences = document.getElementById("mode-sentences");

  const hasSentences =
    AppState.currentChapter &&
    Array.isArray(AppState.currentChapter.sentences) &&
    AppState.currentChapter.sentences.length > 0;

  if (btnSentences) {
    if (!hasSentences) {
      btnSentences.classList.add("hidden");
      if (AppState.exerciseMode === "sentences") {
        AppState.exerciseMode = "typing";
        ["typing", "choice", "sentences"].forEach((m) => {
          const btn = document.getElementById(`mode-${m}`);
          if (btn) {
            btn.className =
              m === "typing"
                ? "px-3 py-1.5 rounded-lg font-medium transition bg-brand-600 text-white"
                : "px-3 py-1.5 rounded-lg font-medium transition text-slate-400 hover:text-slate-200";
          }
        });
      }
    } else {
      btnSentences.classList.remove("hidden");
    }
  }

  if (isAlpha) {
    if (stdControls) stdControls.classList.add("hidden");
    if (alphaControls) alphaControls.classList.remove("hidden");

    if (AppState.alphabetSubmode === "classic") {
      if (stdPanel) stdPanel.classList.remove("hidden");
      if (alphaPanel) alphaPanel.classList.add("hidden");
      if (typeof window !== "undefined" && typeof window.renderCurrentQuestion === "function") {
        window.renderCurrentQuestion();
      }
    } else {
      if (stdPanel) stdPanel.classList.add("hidden");
      if (alphaPanel) alphaPanel.classList.remove("hidden");
      AlphabetGameEngine.init(AppState.alphabetSubmode);
    }
  } else {
    if (stdControls) stdControls.classList.remove("hidden");
    if (alphaControls) alphaControls.classList.add("hidden");
    if (stdPanel) stdPanel.classList.remove("hidden");
    if (alphaPanel) alphaPanel.classList.add("hidden");
    if (typeof window !== "undefined" && typeof window.renderCurrentQuestion === "function") {
      window.renderCurrentQuestion();
    }
  }
}

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.AlphabetGameEngine = AlphabetGameEngine;
  window.setAlphabetSubmode = setAlphabetSubmode;
  window.nextAlphabetChallenge = nextAlphabetChallenge;
  window.updatePracticeChapterView = updatePracticeChapterView;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AlphabetGameEngine,
    setAlphabetSubmode,
    nextAlphabetChallenge,
    updatePracticeChapterView,
  };
}
})();
