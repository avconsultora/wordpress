// Sonido chiptune con Web Audio. Arranca muteado; el AudioContext se crea
// recién en el gesto del botón de sonido (requisito de iOS).

let ctx = null;
let master = null;
let enabled = false;
let hum = null, humGain = null;

export function isEnabled() { return enabled; }

export function toggle() {
  enabled = !enabled;
  if (enabled) {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { enabled = false; return false; }
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.18;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { enabled = false; }
  } else {
    humStop();
  }
  return enabled;
}

// Pausar el audio si la pestaña se oculta.
export function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
export function resume() { if (ctx && enabled && ctx.state === 'suspended') ctx.resume(); }

function tone(type, freq, start, dur, vol = 0.5, slideTo = 0) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.setValueAtTime(vol, start + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(master);
  o.start(start); o.stop(start + dur + 0.02);
}

function ready() { return enabled && ctx && ctx.state === 'running'; }

// Zumbido del ascensor: sube de pitch con la velocidad.
export function humStart(speed) {
  if (!ready()) return;
  if (!hum) {
    hum = ctx.createOscillator();
    humGain = ctx.createGain();
    hum.type = 'triangle';
    humGain.gain.value = 0;
    hum.connect(humGain); humGain.connect(master);
    hum.start();
  }
  const t = ctx.currentTime;
  hum.frequency.setTargetAtTime(55 + speed * 16, t, 0.05);
  humGain.gain.setTargetAtTime(0.35, t, 0.03);
}

export function humStop() {
  if (!hum || !ctx) return;
  humGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
}

export function ding() {
  if (!ready()) return;
  const t = ctx.currentTime;
  tone('square', 1319, t, 0.08, 0.35);
  tone('square', 1976, t + 0.07, 0.22, 0.3);
}

export function error() {
  if (!ready()) return;
  const t = ctx.currentTime;
  tone('square', 220, t, 0.25, 0.4, 70);
}

export function gameOver() {
  if (!ready()) return;
  const t = ctx.currentTime + 0.25;
  [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, t + i * 0.14, 0.14, 0.6));
}

export function record() {
  if (!ready()) return;
  const t = ctx.currentTime;
  [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone('square', f, t + i * 0.08, 0.1, 0.3));
}

export function blip() {
  if (!ready()) return;
  tone('square', 880, ctx.currentTime, 0.05, 0.25);
}
