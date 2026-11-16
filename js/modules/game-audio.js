/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Som dos jogos (efeitos e música sintetizados no navegador)
 * ==========================================================================
 * Nenhum arquivo de áudio: tudo é gerado com a Web Audio API, então funciona
 * sem internet. Usado pela Chuva de Pedras e pelas Crônicas do Escriba.
 */

(function () {
const PREFS_KEY = "gamida_game_audio";
let prefs = { muted: false, music: true };
try {
  if (typeof localStorage !== "undefined") {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    if (stored && typeof stored === "object") prefs = { muted: !!stored.muted, music: stored.music !== false };
  }
} catch (_) {}

function savePrefs() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (_) {}
}

let ac = null;
let master = null;

/** Cria o contexto de áudio no primeiro gesto do aluno (exigência dos navegadores) */
function init() {
  if (typeof window === "undefined") return false;
  if (!ac) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      ac = new Ctx();
      master = ac.createGain();
      master.gain.value = 0.55;
      master.connect(ac.destination);
    } catch (_) {
      ac = null;
      return false;
    }
  }
  if (ac.state === "suspended") ac.resume().catch(() => {});
  return true;
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function tone(freq, delay, dur, type, vol, slideTo) {
  if (!ac || prefs.muted) return;
  const now = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol || 0.25, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.03);
}

function noise(delay, dur, vol, cutoff) {
  if (!ac || prefs.muted) return;
  const length = Math.max(1, (ac.sampleRate * dur) | 0);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff || 1200;
  const gain = ac.createGain();
  gain.gain.value = vol || 0.3;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(ac.currentTime + delay);
}

const sfx = {
  hit(combo) {
    const base = 523 * Math.pow(1.1225, (combo || 1) - 1);
    noise(0, 0.14, 0.28, 2600);
    tone(base, 0, 0.13, "triangle", 0.22);
    tone(base * 1.5, 0.05, 0.2, "triangle", 0.18);
  },
  wrong() {
    tone(196, 0, 0.28, "sawtooth", 0.12, 110);
    tone(147, 0.02, 0.28, "square", 0.06, 82);
  },
  wall() {
    noise(0, 0.4, 0.55, 380);
    tone(95, 0, 0.4, "sine", 0.45, 42);
  },
  combo() {
    [784, 988, 1319].forEach((f, i) => tone(f, i * 0.055, 0.11, "square", 0.07));
  },
  level() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.24, "triangle", 0.22));
    noise(0.3, 0.25, 0.1, 5000);
  },
  over() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.4, "triangle", 0.24));
  },
  start() {
    [392, 523].forEach((f, i) => tone(f, i * 0.08, 0.16, "triangle", 0.18));
  },
  tick() {
    tone(880, 0, 0.05, "square", 0.05);
  },
  fanfare() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.3, "triangle", 0.22));
  },
};

/* ---------- Música chiptune (Chuva de Pedras): frígio dominante, 4 compassos em laço ---------- */
const chip = (() => {
  const R = null;
  const MELODY = [
    76, R, 74, R, 72, R, 71, R, 72, 71, 69, R, 68, R, 69, R,
    71, R, R, R, 68, R, 65, R, 64, R, 65, 68, 71, R, R, R,
    76, R, 74, R, 72, R, 74, R, 76, R, 77, R, 76, 74, 72, R,
    71, R, 72, 71, 69, 68, 65, R, 64, R, R, R, 64, R, R, R,
  ];
  const ROOTS = [45, 40, 41, 40];
  let bus = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;
  let bpm = 138;
  let playing = false;
  let hatBuffer = null;

  function note(freq, t, dur, type, vol) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  function kick(t) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(t);
    osc.stop(t + 0.16);
  }
  function hat(t, vol) {
    if (!hatBuffer) {
      const length = (ac.sampleRate * 0.05) | 0;
      hatBuffer = ac.createBuffer(1, length, ac.sampleRate);
      const data = hatBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const src = ac.createBufferSource();
    src.buffer = hatBuffer;
    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    src.start(t);
  }
  function schedule() {
    if (!ac || !playing) return;
    const stepDur = 60 / bpm / 4;
    while (nextTime < ac.currentTime + 0.12) {
      if (!prefs.muted && prefs.music) {
        const bar = (step >> 4) % 4;
        const i = step % 16;
        const m = MELODY[step % 64];
        if (m !== null) note(hz(m), nextTime, stepDur * 1.7, "square", 0.07);
        if (i % 2 === 0) note(hz(ROOTS[bar] + ((i / 2) % 2 ? 12 : 0)), nextTime, stepDur * 1.6, "triangle", 0.16);
        if (i === 0 || i === 8) kick(nextTime);
        if (i % 2 === 0) hat(nextTime, i % 4 === 2 ? 0.09 : 0.05);
      }
      nextTime += stepDur;
      step++;
    }
  }
  return {
    start() {
      if (!init() || playing) return;
      if (!bus) {
        bus = ac.createGain();
        bus.gain.value = 0.55;
        bus.connect(master);
      }
      playing = true;
      nextTime = ac.currentTime + 0.08;
      timer = setInterval(schedule, 25);
      schedule();
    },
    stop() {
      playing = false;
      clearInterval(timer);
      timer = null;
    },
    reset() {
      step = 0;
      bpm = 138;
    },
    /** A música acelera junto com a fase */
    setLevel(level) {
      bpm = Math.min(186, 138 + (level - 1) * 6);
    },
  };
})();

/* ---------- Trilha das Crônicas do Escriba ----------
 * Um pequeno sequenciador: cada tema é uma progressão de acordes, uma melodia
 * escrita em graus da escala, um dedilhado, um baixo e uma percussão.
 * A escala muda com o idioma: no hebraico, o modo frígio dominante (Ahavá Rabá,
 * o som das melodias de sinagoga); no grego, o modo dórico dos antigos.
 * Como a melodia é escrita em graus, o mesmo tema soa "hebraico" ou "grego".
 */
const epic = (() => {
  let out = null;
  let wet = null;
  let timer = null;
  let theme = null;
  let themeName = "";
  let flavor = "hebrew";
  let step = 0;
  let nextTime = 0;
  let playing = false;

  const MODES = {
    hebrew: [0, 1, 4, 5, 7, 8, 10], // frígio dominante
    greek: [0, 2, 3, 5, 7, 9, 10], // dórico
  };
  const STEPS_PER_BAR = 8; // colcheias

  /* Notação da melodia, uma colcheia por símbolo: número = grau da escala
   * (7 = oitava acima, -1 = um grau abaixo da tônica), "-" = segura a nota, "." = pausa.
   * Percussão: k = tímpano, t = tof (pandeiro de moldura), h = chocalho, "." = silêncio.
   * Baixo: x = fundamental, f = quinta, "." = silêncio. */
  const THEMES = {
    // Abertura: chamado de trompa sobre um tapete grave
    prologue: {
      bpm: 70, root: 50, chords: [0, 5, 3, 4], lead: "horn", pad: true,
      melody: ["0 - - - - - 4 -", "7 - - - 5 - - -", "3 - - 5 7 - - -", "8 - 6 - 4 - - -"],
      bass: "x.......", drums: ["k.......", "........", "k.......", "....k.kk"],
    },
    // Mapa: caminhada calma, lira dedilhada e flauta
    map: {
      bpm: 80, root: 50, chords: [0, 5, 6, 0], lead: "flute", arp: [0, 1, 2, 1, 0, 1, 2, 1], bell: true,
      melody: ["4 - - - 2 - 0 -", "5 - - - 7 - - -", "6 - - 5 3 - - -", "2 - 1 - 0 - - ."],
      bass: "x...f...", drums: ["t...t.t.", "t...t...", "t...t.t.", "t...t..."],
    },
    // Pergaminho: só a lira, para ler em paz
    scroll: {
      bpm: 66, root: 50, chords: [0, 3, 5, 4], arp: [0, 1, 2, 3, 2, 1, 2, 1], pad: true, bell: true,
      melody: [], bass: "x.......", drums: [],
    },
    // Campos, jardins e tendas: dança de roda
    field: {
      bpm: 116, root: 50, chords: [0, 3, 6, 0], lead: "flute", arp: [0, 2, 1, 2, 0, 2, 1, 2],
      melody: ["4 - 2 4 5 4 2 0", "3 - 5 7 5 3 5 -", "6 - 5 6 8 6 5 3", "4 2 1 2 0 - . ."],
      bass: "x..x..f.", drums: ["k.t.k.tt", "k.t.k.t.", "k.t.k.tt", "k.ttk.t."],
    },
    // Deserto, pirâmides e zigurates: caravana, melodia sinuosa de palheta
    desert: {
      bpm: 100, root: 48, chords: [0, 1, 0, 6], lead: "reed", arp: [0, 2, 0, 1, 0, 2, 0, 1],
      melody: ["0 - - 1 2 1 0 -", "1 - 3 2 1 - 0 1", "2 - 4 - 5 4 2 1", "-1 - 0 1 0 - . ."],
      bass: "x..x.x..", drums: ["k..tk.t.", "k..tk.th", "k..tk.t.", "k.htk.tt"],
    },
    // Mar, rio e fontes: ondas de dedilhado
    water: {
      bpm: 120, root: 52, chords: [0, 5, 3, 4], lead: "flute", arp: [0, 1, 2, 3, 2, 1, 2, 3],
      melody: ["0 2 4 7 4 2 4 -", "5 7 9 7 5 - 4 5", "3 5 7 5 3 - 2 3", "4 - 6 4 1 - 0 -"],
      bass: "x...x.f.", drums: ["k.h.t.h.", "k.h.t.hh", "k.h.t.h.", "k.h.t.tt"],
    },
    // Montes e o Sinai: tímpanos e trompas, passo pesado
    mount: {
      bpm: 92, root: 45, chords: [0, 0, 5, 4], lead: "horn", pad: true,
      melody: ["0 - - - 4 - - -", "7 - - 6 4 - - -", "5 - - - 7 - 9 -", "8 - 6 - 4 - - ."],
      bass: "x...x...", drums: ["k...k.k.", "k...k...", "k...k.k.", "k..kk.kk"],
    },
    // Cidades, muralhas e templos: marcha com fanfarra
    city: {
      bpm: 126, root: 50, chords: [0, 6, 5, 4], lead: "horn", arp: [0, 2, 1, 2, 0, 2, 1, 2],
      melody: ["0 0 4 - 7 - 4 -", "6 6 8 - 10 - 8 -", "5 5 7 - 9 7 5 -", "4 - 6 8 7 - . ."],
      bass: "x.x.f.x.", drums: ["k.tkk.t.", "k.tkk.tt", "k.tkk.t.", "k.tktktt"],
    },
    // Guardião: ostinato no baixo, melodia urgente
    boss: {
      bpm: 138, root: 50, chords: [0, 1, 0, 4], lead: "reed", pad: true,
      melody: ["7 . 7 8 7 . 4 5", "8 . 8 9 8 . 5 6", "7 6 5 4 5 6 7 -", "8 - 6 - 4 2 1 0"],
      bass: "xxfxxxfx", drums: ["k.tktktt", "k.tktkt.", "k.tktktt", "kktktktt"],
    },
    // Último guardião: o tema do guardião mais rápido, um tom acima e dobrado em oitava
    final: {
      bpm: 152, root: 52, chords: [0, 1, 0, 4], lead: "reed", pad: true, double: true,
      melody: ["7 . 7 8 7 . 4 5", "8 . 8 9 8 . 5 6", "7 6 5 4 5 6 7 -", "8 - 6 - 4 2 1 0"],
      bass: "xxfxxxfx", drums: ["kktktktt", "k.tktktt", "kktktktt", "kkkktttt"],
    },
  };
  // Cenário de cada capítulo → tema de batalha
  const SCENE_THEME = {
    garden: "field", hills: "field", tents: "field",
    dunes: "desert", pyramids: "desert", ziggurat: "desert",
    sea: "water", spring: "water", well: "water",
    mountain: "mount", sinai: "mount", pillar: "mount",
    walls: "city", tower: "city", temple: "city", tabernacle: "city",
  };
  // Toques curtos, fora do laço: graus da escala e duração em colcheias
  const STINGS = {
    victory: { bpm: 132, lead: "horn", notes: [[0, 1], [2, 1], [4, 1], [7, 2], [4, 1], [7, 4]], roll: true },
    relic: { bpm: 150, lead: "pluck", notes: [[0, 1], [2, 1], [4, 1], [7, 1], [9, 1], [11, 1], [14, 3]], bell: true },
    defeat: { bpm: 80, lead: "horn", notes: [[4, 2], [3, 2], [1, 2], [0, 5]], low: true },
    chapter: { bpm: 110, lead: "flute", notes: [[4, 1], [5, 1], [7, 2], [9, 1], [7, 3]] },
  };

  function setup() {
    if (!init()) return false;
    if (out) return true;
    out = ac.createGain();
    out.gain.value = 0.9;
    out.connect(master);
    // Reverberação: resposta ao impulso feita de ruído que decai
    const length = ac.sampleRate * 2.6;
    const impulse = ac.createBuffer(2, length, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
    const reverb = ac.createConvolver();
    reverb.buffer = impulse;
    wet = ac.createGain();
    wet.gain.value = 0.4;
    wet.connect(reverb);
    reverb.connect(out);
    return true;
  }

  /** Nota (MIDI) de um grau da escala do idioma, a partir da tônica do tema */
  function degreeToMidi(root, degree) {
    const mode = MODES[flavor] || MODES.hebrew;
    const octave = Math.floor(degree / 7);
    return root + mode[((degree % 7) + 7) % 7] + 12 * octave;
  }

  /** Voz sustentada: dois osciladores levemente desafinados, filtro e envelope */
  function voice(freq, t, dur, { type = "sawtooth", vol = 0.04, att = 0.05, rel = 0.12, cut = 1400, det = 5, vib = 0, dry = 1 } = {}) {
    const gain = ac.createGain();
    const lowpass = ac.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = cut;
    lowpass.Q.value = 0.7;
    const hold = Math.max(att + 0.01, dur - rel);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + att);
    gain.gain.setValueAtTime(vol, t + hold);
    gain.gain.linearRampToValueAtTime(0, t + hold + rel);
    [-det, det].forEach((detune) => {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      if (vib) {
        const lfo = ac.createOscillator();
        const lfoGain = ac.createGain();
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = vib;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t + Math.min(0.15, dur / 2));
        lfo.stop(t + hold + rel + 0.05);
      }
      osc.connect(lowpass);
      osc.start(t);
      osc.stop(t + hold + rel + 0.05);
    });
    lowpass.connect(gain);
    if (dry) gain.connect(out);
    gain.connect(wet);
  }

  // Timbres da melodia: flauta, palheta (como um aulo ou uma zurna) e trompa (como um shofar)
  const LEADS = {
    flute: (freq, t, dur) => voice(freq, t, dur, { type: "triangle", vol: 0.13, att: 0.04, rel: 0.1, cut: 3200, det: 3, vib: 5 }),
    reed: (freq, t, dur) => voice(freq, t, dur, { type: "square", vol: 0.065, att: 0.02, rel: 0.08, cut: 1900, det: 6, vib: 6 }),
    horn: (freq, t, dur) => voice(freq, t, dur, { type: "sawtooth", vol: 0.09, att: 0.07, rel: 0.18, cut: 1100, det: 7, vib: 3 }),
    pluck: (freq, t) => pluck(freq, t, 0.3),
  };

  /** Corda dedilhada (lira, harpa): ataque seco e queda rápida */
  function pluck(freq, t, vol = 0.09) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const lowpass = ac.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.value = freq;
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(3600, t);
    lowpass.frequency.exponentialRampToValueAtTime(700, t + 0.5);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(out);
    gain.connect(wet);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  function timpani(t, vol) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.setValueAtTime(96, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.35);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(out);
    gain.connect(wet);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  let noiseBuffer = null;
  /** Ruído filtrado: com filtro grave é o tof (pandeiro de moldura); agudo, o chocalho */
  function noiseHit(t, vol, freq, dur, type) {
    if (!noiseBuffer) {
      const length = (ac.sampleRate * 0.3) | 0;
      noiseBuffer = ac.createBuffer(1, length, ac.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    src.buffer = noiseBuffer;
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = 1.2;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
  const tof = (t, vol) => noiseHit(t, vol, 520, 0.14, "bandpass");
  const shaker = (t, vol) => noiseHit(t, vol, 6500, 0.05, "highpass");

  function bell(freq, t) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    osc.connect(gain);
    gain.connect(wet);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 2.3);
  }

  /** Lê a melodia de um compasso: [{step, degree, length}] */
  function parseBar(bar) {
    const tokens = String(bar || "").trim().split(/\s+/).filter(Boolean);
    const notes = [];
    tokens.forEach((token, index) => {
      if (token === "-" || token === ".") return;
      let length = 1;
      while (tokens[index + length] === "-") length++;
      notes.push({ step: index, degree: Number(token), length });
    });
    return notes;
  }
  const parsedCache = new Map();
  function melodyBar(name, barIndex) {
    const key = `${name}:${barIndex}`;
    if (!parsedCache.has(key)) parsedCache.set(key, parseBar(THEMES[name].melody[barIndex]));
    return parsedCache.get(key);
  }

  function schedule() {
    if (!playing || !ac || !theme) return;
    const stepDur = 60 / theme.bpm / 2;
    while (nextTime < ac.currentTime + 0.2) {
      const bar = Math.floor(step / STEPS_PER_BAR) % theme.chords.length;
      const s = step % STEPS_PER_BAR;
      const chordRoot = theme.chords[bar];
      const t = nextTime;
      if (prefs.music && !prefs.muted) {
        // Tapete de acordes, uma vez por compasso
        if (theme.pad && s === 0) {
          [0, 2, 4].forEach((third) =>
            voice(hz(degreeToMidi(theme.root - 12, chordRoot + third)), t, stepDur * STEPS_PER_BAR + 0.2, { vol: 0.022, att: 0.5, rel: 0.6, cut: 900, det: 8 }));
        }
        // Dedilhado sobre as notas do acorde
        if (theme.arp) {
          const tone = theme.arp[s];
          pluck(hz(degreeToMidi(theme.root, chordRoot + tone * 2)), t, 0.06);
        }
        // Melodia
        if (theme.melody.length) {
          melodyBar(themeName, bar % theme.melody.length).filter((n) => n.step === s).forEach((n) => {
            const freq = hz(degreeToMidi(theme.root + 12, n.degree));
            LEADS[theme.lead](freq, t, stepDur * n.length * 0.96);
            if (theme.double) LEADS.flute(freq * 2, t, stepDur * n.length * 0.9);
          });
        }
        // Baixo
        const bassMark = theme.bass[s];
        if (bassMark === "x" || bassMark === "f") {
          const degree = chordRoot + (bassMark === "f" ? 4 : 0);
          voice(hz(degreeToMidi(theme.root - 24, degree)), t, stepDur * 0.9, { type: "triangle", vol: 0.16, att: 0.01, rel: 0.08, cut: 600, det: 2, dry: 1 });
        }
        // Percussão
        const drumBar = theme.drums.length ? theme.drums[bar % theme.drums.length] : "";
        const hit = drumBar[s];
        if (hit === "k") timpani(t, 0.38);
        else if (hit === "t") tof(t, 0.32);
        else if (hit === "h") shaker(t, 0.12);
        if (theme.bell && s === 4 && bar % 2 === 1) bell(hz(degreeToMidi(theme.root + 24, chordRoot + 4)), t);
      }
      nextTime += stepDur;
      step++;
    }
  }

  return {
    SCENE_THEME,
    themeNames: () => Object.keys(THEMES),
    /** O idioma define a escala: 'hebrew' ou 'greek' */
    setFlavor(language) {
      flavor = language === "greek" ? "greek" : "hebrew";
    },
    /** Tema de batalha para o cenário de um capítulo */
    themeForScene(scene) {
      return SCENE_THEME[scene] || "field";
    },
    /** @param {string} name tema em laço; nomes antigos ('battle') continuam valendo */
    play(name) {
      const wanted = THEMES[name] ? name : name === "battle" ? "field" : "map";
      if (!setup()) return;
      if (playing && wanted === themeName) return;
      themeName = wanted;
      theme = THEMES[wanted];
      step = 0;
      nextTime = ac.currentTime + 0.12;
      if (!playing) {
        playing = true;
        timer = setInterval(schedule, 40);
      }
    },
    stop() {
      playing = false;
      themeName = "";
      clearInterval(timer);
      timer = null;
    },
    current: () => (playing ? themeName : ""),
    /** Toque curto por cima (ou no lugar) da música: vitória, relíquia, derrota, capítulo */
    sting(name) {
      const sting = STINGS[name];
      if (!sting || !setup() || prefs.muted) return;
      const stepDur = 60 / sting.bpm / 2;
      let t = ac.currentTime + 0.05;
      sting.notes.forEach(([degree, length]) => {
        const midi = degreeToMidi(sting.low ? 50 : 62, degree);
        LEADS[sting.lead](hz(midi), t, stepDur * length * 0.95);
        if (sting.lead !== "pluck") pluck(hz(midi), t, 0.05);
        t += stepDur * length;
      });
      if (sting.roll) [0, 1, 2, 3].forEach((k) => timpani(ac.currentTime + 0.05 + k * stepDur * 0.5, 0.25 + k * 0.08));
      if (sting.bell) bell(hz(degreeToMidi(86, 0)), t - stepDur * 2);
    },
    /** Só para os testes: valida a escrita de todos os temas */
    describe() {
      return Object.entries(THEMES).map(([name, def]) => ({
        name,
        bars: def.chords.length,
        melodyBars: def.melody.map((bar) => String(bar).trim().split(/\s+/).length),
        degrees: def.melody.flatMap((bar) => parseBar(bar).map((n) => n.degree)),
        bassSteps: def.bass.length,
        drumSteps: def.drums.map((bar) => bar.length),
        arpSteps: def.arp ? def.arp.length : 0,
        lead: def.lead || null,
      }));
    },
  };
})();

const GameAudio = {
  init,
  sfx,
  chip,
  epic,
  /** Nó de saída, para medir o nível do som nos testes */
  getOutputNode: () => master,
  isMuted: () => prefs.muted,
  isMusicOn: () => prefs.music,
  toggleMute() {
    prefs.muted = !prefs.muted;
    savePrefs();
    return prefs.muted;
  },
  toggleMusic() {
    prefs.music = !prefs.music;
    savePrefs();
    return prefs.music;
  },
  stopAll() {
    chip.stop();
    epic.stop();
  },
};

// Suporte universal (Browser Global / Node CommonJS)
if (typeof window !== "undefined") {
  window.GameAudio = GameAudio;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = GameAudio;
}
})();
