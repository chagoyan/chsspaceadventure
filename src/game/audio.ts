// Tiny WebAudio synth for retro SFX. No assets needed.
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
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
