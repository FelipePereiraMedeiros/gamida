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

/* ---------- Música orquestral (Crônicas do Escriba): mapa, batalha e chefe ---------- */
const epic = (() => {
  let out = null;
  let wet = null;
  let timer = null;
  let theme = "map";
  let beat = 0;
  let nextTime = 0;
  let playing = false;
  // ré menor: i–III–VII–i (mapa); i–VI–iv–V (batalha); i–bII–VI–V (chefe)
  const PROGRESSION = {
    map: [[50, "m"], [53, "M"], [48, "M"], [50, "m"]],
    battle: [[50, "m"], [46, "M"], [43, "m"], [45, "M"]],
    boss: [[50, "m"], [51, "M"], [46, "M"], [45, "M"]],
  };
  const BPM = { map: 58, battle: 80, boss: 98 };
  const CHOIR = { battle: [74, 72, 70, 73], boss: [74, 75, 74, 73] };

  function setup() {
    if (!init()) return false;
    if (out) return true;
    out = ac.createGain();
    out.gain.value = 0.9;
    out.connect(master);
    // Reverberação: resposta ao impulso feita de ruído que decai
    const length = ac.sampleRate * 3.2;
    const impulse = ac.createBuffer(2, length, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
    const reverb = ac.createConvolver();
    reverb.buffer = impulse;
    wet = ac.createGain();
    wet.gain.value = 0.55;
    wet.connect(reverb);
    reverb.connect(out);
    return true;
  }
  function voice(freq, t, dur, { type = "sawtooth", vol = 0.04, att = 0.6, rel = 1.2, cut = 1100, det = 7, vib = 0 } = {}) {
    const gain = ac.createGain();
    const lowpass = ac.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = cut;
    lowpass.Q.value = 0.7;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + att);
    gain.gain.setValueAtTime(vol, t + Math.max(att, dur - rel));
    gain.gain.linearRampToValueAtTime(0, t + dur);
    [-det, det].forEach((detune) => {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      if (vib) {
        const lfo = ac.createOscillator();
        const lfoGain = ac.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = vib;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t);
        lfo.stop(t + dur + 0.1);
      }
      osc.connect(lowpass);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    });
    lowpass.connect(gain);
    gain.connect(out);
    gain.connect(wet);
  }
  function timpani(t, vol) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.setValueAtTime(92, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.5);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    osc.connect(gain);
    gain.connect(out);
    gain.connect(wet);
    osc.start(t);
    osc.stop(t + 1);
    const length = (ac.sampleRate * 0.25) | 0;
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const noiseGain = ac.createGain();
    src.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 260;
    noiseGain.gain.value = vol * 0.8;
    src.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(out);
    src.start(t);
  }
  function bell(freq, t) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc.connect(gain);
    gain.connect(wet);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 2.6);
  }
  const chord = (root, quality) => [root - 12, root, root + (quality === "m" ? 3 : 4), root + 7, root + 12];

  function schedule() {
    if (!playing || !ac) return;
    const beatDur = 60 / BPM[theme];
    while (nextTime < ac.currentTime + 0.25) {
      const bar = (beat >> 2) % 4;
      const b = beat % 4;
      const [root, quality] = PROGRESSION[theme][bar];
      if (prefs.music && !prefs.muted) {
        if (b === 0) {
          chord(root, quality).forEach((m) =>
            voice(hz(m), nextTime, beatDur * 4 + 0.3, {
              vol: theme === "map" ? 0.028 : 0.032,
              att: theme === "map" ? 1.2 : 0.5,
              cut: theme === "boss" ? 1500 : 1000,
            }));
          if (theme !== "map") voice(hz(CHOIR[theme][bar]), nextTime, beatDur * 4, { type: "triangle", vol: 0.05, att: 0.7, cut: 2400, det: 4, vib: 4 });
          if (theme === "boss") [root, root + 7, root + 12].forEach((m) => voice(hz(m), nextTime, 0.45, { vol: 0.05, att: 0.02, rel: 0.3, cut: 2600 }));
          if (theme === "map") bell(hz(root + 24 + (bar % 2 ? 7 : 0)), nextTime + beatDur * 2);
        }
        if (theme !== "map") {
          const pattern = theme === "boss" ? [0, 0, 12, 0, 7, 0, 12, 7] : [0, 0, 7, 0];
          const steps = pattern.length / 4;
          for (let k = 0; k < steps; k++) {
            const m = root - 24 + pattern[(b * steps + k) % pattern.length];
            voice(hz(m), nextTime + (k * beatDur) / steps, (beatDur / steps) * 0.9, { vol: 0.07, att: 0.01, rel: 0.12, cut: 700, det: 3 });
          }
          if (b === 0 || (theme === "boss" && b === 2)) timpani(nextTime, theme === "boss" ? 0.6 : 0.45);
          if (theme === "boss" && bar === 3 && b === 3) for (let k = 1; k < 4; k++) timpani(nextTime + (k * beatDur) / 4, 0.25 + k * 0.08);
        }
      }
      nextTime += beatDur;
      beat++;
    }
  }
  return {
    /** @param {'map'|'battle'|'boss'} name */
    play(name) {
      if (!setup()) return;
      if (playing && name === theme) return;
      theme = PROGRESSION[name] ? name : "map";
      beat = 0;
      nextTime = ac.currentTime + 0.1;
      if (!playing) {
        playing = true;
        timer = setInterval(schedule, 50);
      }
    },
    stop() {
      playing = false;
      clearInterval(timer);
      timer = null;
    },
  };
})();

const GameAudio = {
  init,
  sfx,
  chip,
  epic,
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
