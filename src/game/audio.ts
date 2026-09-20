// Tiny WebAudio synth for retro SFX. No assets needed.
let ctx: AudioContext | null = null;
let muted = false;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicTrack = 0;

export function setMuted(m: boolean) {
  muted = m;
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(m ? 0 : 0.055, ctx.currentTime, 0.05);
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function musicNote(destination: AudioNode, frequency: number, duration: number, volume: number, type: OscillatorType) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function startMusic(track = 1) {
  const c = ac();
  if (!c || (musicTimer !== null && musicTrack === track)) return;
  stopMusic();
  musicTrack = track;
  musicGain = c.createGain();
  musicGain.gain.value = muted ? 0 : 0.055;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3000;
  musicGain.connect(filter).connect(c.destination);
  const tracks = [
    { bass: [110, 110, 146.8, 130.8], lead: [440, 523, 659, 523, 587, 523, 440, 392], step: 210 },
    { bass: [98, 98, 130.8, 116.5], lead: [587, 523, 440, 523, 587, 698, 587, 523], step: 190 },
    { bass: [82.4, 123.5, 98, 110], lead: [659, 587, 494, 587, 659, 784, 659, 494], step: 175 },
  ];
  const song = tracks[Math.max(0, Math.min(tracks.length - 1, track - 1))] ?? tracks[0];
  if (!song) return;
  let step = 0;
  musicTimer = window.setInterval(() => {
    if (muted || !musicGain) return;
    const index = step % 8;
    const lead = song.lead[index] ?? 440;
    musicNote(musicGain, lead, song.step / 1000 * 1.35, 0.13, "square");
    if (index % 2 === 0) {
      const bass = song.bass[Math.floor(step / 2) % song.bass.length] ?? 110;
      musicNote(musicGain, bass, song.step / 1000 * 2, 0.25, "triangle");
    }
    if (index === 0 || index === 4) musicNote(musicGain, 70, 0.12, 0.28, "sine");
    step++;
  }, song.step);
}

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
  musicGain?.disconnect();
  musicGain = null;
  musicTrack = 0;
}

function beep(freq: number, dur: number, type: OscillatorType = "square", vol = 0.05, slide = 0) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export const sfx = {
  shoot: () => beep(880, 0.08, "square", 0.03, -400),
  hit: () => beep(160, 0.15, "sawtooth", 0.06, -80),
  explosion: () => {
    beep(90, 0.4, "sawtooth", 0.09, -60);
    beep(55, 0.5, "triangle", 0.09, -30);
  },
  pickup: () => {
    beep(520, 0.09, "square", 0.05);
    setTimeout(() => beep(780, 0.12, "square", 0.05), 80);
  },
  commit: () => {
    beep(440, 0.1, "square", 0.05);
    setTimeout(() => beep(660, 0.1, "square", 0.05), 100);
    setTimeout(() => beep(880, 0.18, "square", 0.05), 200);
  },
  error: () => beep(200, 0.2, "square", 0.05, -60),
  typing: () => beep(1200, 0.02, "square", 0.012),
  alarm: () => {
    beep(700, 0.15, "square", 0.05, -200);
    setTimeout(() => beep(700, 0.15, "square", 0.05, -200), 250);
  },
};
