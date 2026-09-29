// Lógica pura del juego: sin DOM, testeable con `node --test`.
import { CONFIG, BAD_WORDS } from './config.js';

// Dificultad de una ronda. `round` = cantidad de aciertos hasta ahora (0 en la primera).
export function difficultyFor(round, cfg = CONFIG, out = {}) {
  const speed = Math.min(cfg.maxSpeed, cfg.startSpeed * Math.pow(cfg.speedMultiplier, round));
  const steps = Math.floor(round / cfg.gapGrowthEvery);
  const maxGap = Math.min(cfg.gapCap, cfg.maxGap + steps);
  const minGap = Math.min(maxGap, cfg.minGap + steps);
  const tolerance = Math.max(cfg.minHitTolerance, cfg.hitTolerance - round * cfg.toleranceStep);
  out.speed = speed;
  out.minGap = minGap;
  out.maxGap = maxGap;
  out.tolerance = tolerance;
  return out;
}

// 1 = acierto, 2 = te pasaste, 3 = te quedaste corto
export const HIT = 1, OVER = 2, SHORT = 3;

export function evaluateStop(position, target, tolerance) {
  const d = position - target;
  if (Math.abs(d) <= tolerance + 1e-9) return HIT;
  return d > 0 ? OVER : SHORT;
}

// Duración mínima teórica (ms) para hacer `score` aciertos: recorrer al menos
// (minGap - tolerancia) pisos a la velocidad de cada ronda + la transición.
// La base de datos aplica la misma cuenta con un margen (ver supabase.sql).
export function minDurationMs(score, cfg = CONFIG) {
  const d = {};
  let ms = 0;
  for (let r = 0; r < score; r++) {
    difficultyFor(r, cfg, d);
    ms += ((d.minGap - d.tolerance) / d.speed) * 1000 + cfg.roundTransitionMs;
  }
  return ms;
}

// ── Nicknames ───────────────────────────────────────────────────────────────
const NICK_ALLOWED = /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]/g;

export function cleanNickname(raw) {
  return String(raw || '')
    .replace(NICK_ALLOWED, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, 12)
    .toUpperCase();
}

function fold(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/8/g, 'b');
}

export function isBadNickname(nick, words = BAD_WORDS) {
  const folded = fold(nick);
  const compact = folded.replace(/[^a-z]/g, '');
  const tokens = folded.split(/[^a-z]+/);
  for (const w of words) {
    const fw = fold(w).replace(/[^a-z]/g, '');
    if (!fw) continue;
    if (fw.length <= 3) {
      if (tokens.includes(fw)) return true;
    } else if (compact.includes(fw)) {
      return true;
    }
  }
  return false;
}

export function moderateNickname(raw, words = BAD_WORDS) {
  const nick = cleanNickname(raw).trim();
  if (!nick || isBadNickname(nick, words)) {
    return 'JUGADOR' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  }
  return nick;
}

// ── WhatsApp ────────────────────────────────────────────────────────────────
export function normalizeWhatsapp(raw) {
  const s = String(raw || '').trim();
  const digits = s.replace(/\D/g, '');
  return (s.startsWith('+') ? '+' : '') + digits;
}

export function isValidWhatsapp(raw) {
  return /^\+?[0-9]{8,15}$/.test(normalizeWhatsapp(raw));
}

// Bolsa de frases: salen todas en orden aleatorio antes de repetir alguna,
// y la primera de una bolsa nueva nunca es igual a la última de la anterior.
// `state` = { bag: [índices pendientes], last: índice }. Se modifica en el lugar.
export function nextPhrase(state, length, rnd = Math.random) {
  if (!Array.isArray(state.bag)) state.bag = [];
  state.bag = state.bag.filter((i) => Number.isInteger(i) && i >= 0 && i < length);
  if (!state.bag.length) {
    const bag = [];
    for (let i = 0; i < length; i++) bag.push(i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    // se saca desde el final: que el próximo no sea el último mostrado
    if (length > 1 && bag[bag.length - 1] === state.last) {
      const t = bag[0]; bag[0] = bag[bag.length - 1]; bag[bag.length - 1] = t;
    }
    state.bag = bag;
  }
  state.last = state.bag.pop();
  return state.last;
}

// Frase al azar sin repetir la anterior.
export function pickIndex(length, previous, rnd = Math.random) {
  if (length <= 1) return 0;
  let i = Math.floor(rnd() * (length - 1));
  if (i >= previous && previous >= 0) i++;
  return i;
}

// Parte una frase en 1 o 2 líneas que entren en `maxChars`.
export function wrapPhrase(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const worst = Math.max(a.length, b.length);
    if (!best || worst < best.worst) best = { a, b, worst };
  }
  return best ? [best.a, best.b] : [text];
}
