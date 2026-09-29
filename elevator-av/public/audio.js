// Sonido chiptune con Web Audio. Arranca muteado; el AudioContext se crea
// recién en el gesto del botón de sonido (requisito de iOS).

let ctx = null;
let master = null;
let enabled = false;
let hum = null, humGain = null;
let silentEl = null;

// WAV de silencio en loop: en iPhone hace que el sonido salga aunque la
// tecla lateral esté en silencio (pasa la sesión de audio a "reproducción").
const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

export function isEnabled() { return enabled; }

function create() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);
  return true;
}

// Se llama dentro de un gesto (tap/click): despierta el audio donde el
// navegador lo tenga suspendido o interrumpido.
export function unlock() {
  if (!enabled || !ctx) return;
  try {
    // iOS 17+: pedir sesión de reproducción (ignora la tecla de silencio)
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    // buffer vacío: algunos Android/iOS viejos solo desbloquean así
    const b = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(ctx.destination);
    src.start(0);
    if (!navigator.audioSession) {
      if (!silentEl) {
        silentEl = new Audio(SILENT_WAV);
        silentEl.loop = true;
        silentEl.setAttribute('playsinline', '');
        silentEl.volume = 0.01;
      }
      if (silentEl.paused) silentEl.play().catch(() => {});
    }
  } catch (e) { /* sin audio: el juego sigue igual */ }
}

export function toggle() {
  enabled = !enabled;
  if (enabled) {
    try {
      if (!ctx && !create()) { enabled = false; return false; }
      unlock();
    } catch (e) { enabled = false; }
  } else {
    humStop();
    if (silentEl) silentEl.pause();
  }
  return enabled;
}

// Pausar el audio si la pestaña se oculta.
export function suspend() {
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  if (silentEl) silentEl.pause();
}
export function resume() { unlock(); }

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

function ready() {
  if (!enabled || !ctx || ctx.state === 'closed') return false;
  // si quedó suspendido/interrumpido, se reprograma igual: suena al reanudar
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return true;
}

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
