// Ranking y leads contra Supabase (PostgREST directo, sin supabase-js).
import { SUPABASE, EVENT_ID } from './config.js?v=6';

const TIMEOUT_MS = 8000;
const MIN_GAP_MS = 5000; // 1 envío cada 5 s por cliente
let lastSubmitAt = 0;

async function call(path, body, extraHeaders) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : 0;
  try {
    const res = await fetch(SUPABASE.url + path, {
      method: 'POST',
      headers: {
        apikey: SUPABASE.key,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined,
    });
    return res;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function newGameId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function submitScore({ gameId, nickname, score, maxFloor, durationMs }) {
  const wait = lastSubmitAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastSubmitAt = Date.now();
  const res = await call('/rest/v1/scores', {
    game_id: gameId,
    event_id: EVENT_ID,
    nickname,
    score,
    max_floor: maxFloor,
    duration_ms: Math.round(durationMs),
  }, { Prefer: 'return=minimal' });
  // 409 = esta partida ya estaba guardada (reintento después de un timeout): está bien.
  if (res.ok || res.status === 409) return true;
  throw new Error('score ' + res.status);
}

export async function fetchRanking(gameId = null) {
  const res = await call('/rest/v1/rpc/get_ranking', { p_event_id: EVENT_ID, p_game_id: gameId });
  if (!res.ok) throw new Error('ranking ' + res.status);
  const data = await res.json();
  return { top: data.top || [], me: data.me || null, total: data.total || 0 };
}

export async function submitLead({ whatsapp, nombre, nickname, score }) {
  const res = await call('/rest/v1/rpc/submit_lead', {
    p_event_id: EVENT_ID,
    p_whatsapp: whatsapp,
    p_nombre: nombre || null,
    p_nickname: nickname || null,
    p_score: score,
  });
  if (!res.ok) throw new Error('lead ' + res.status);
  return true;
}
