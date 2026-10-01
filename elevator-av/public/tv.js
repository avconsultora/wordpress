// ELEVATOR AV — animación para la tele del evento (1920×1080, loop perfecto).
// Se dibuja a 480×270 y se escala ×4 para que quede pixel perfecto.
// Abrir tv.html en pantalla completa, o grabarla con ?record=1 (renderAt(t)).
import * as S from './sprites.js?v=9';
import { qrCanvas } from './qr.js?v=9';

const QR_URL = 'https://avconsultora.marketing/sc26/';
const LW = 480, LH = 270, SCALE = 4;
// Duración del loop: múltiplo exacto de todos los ciclos (1.8 s, 1.2 s, 0.6 s,
// 0.4 s) y de los 21 pisos que sube el fondo, así no se nota el corte.
export const LOOP_S = 36;
const FLOORS_PER_LOOP = 21;
const TOWER_W = 160, TOWERS = 3;
const FH = S.FH, SLAB = S.SLAB;
const BASE = Math.round(LH * 0.72);

const screen = document.getElementById('tv');
screen.width = LW * SCALE;
screen.height = LH * SCALE;
const sctx = screen.getContext('2d');
sctx.imageSmoothingEnabled = false;
const buf = S.makeCanvas(LW, LH);
const ctx = buf.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ── gráficos pre-renderizados ──────────────────────────────────────────────
const tpl = [];
for (let i = 0; i < 7; i++) tpl.push(S.buildFloorTemplate(TOWER_W, i + 3));
const avTpl = [S.buildAvTemplate(TOWER_W, 0), S.buildAvTemplate(TOWER_W, 1)];
const cabin = S.buildCabin();
const doorPanel = S.buildAvDoorPanel();
const chars = S.officeCharacters();
const logo = S.logoCanvas();
const gift = S.iconCanvas('gift', true);
const qr = qrCanvas(QR_URL, 3, S.PAL.K, S.PAL.W); // 3 px lógicos por módulo (12 px en la tele)
const qrSize = qr.width;

const mod = (a, b) => ((a % b) + b) % b;
const isAv = (n, k) => mod(n, 7) === mod(k * 2 + 3, 7);

// ── fondo: tres torres que suben sin parar ─────────────────────────────────
function drawBackground(t) {
  const pos = 100 + (FLOORS_PER_LOOP * t) / LOOP_S;
  const off = Math.round(pos * FH);
  const glow = Math.floor(t / 0.3) & 1;
  ctx.fillStyle = S.PAL.K;
  ctx.fillRect(0, 0, LW, LH);
  const nMin = Math.floor(pos - (LH - BASE) / FH) - 1;
  const nMax = Math.ceil(pos + BASE / FH) + 1;
  for (let k = 0; k < TOWERS; k++) {
    const x0 = k * TOWER_W;
    for (let n = nMin; n <= nMax; n++) {
      const y = BASE - FH + SLAB - (n * FH - off);
      if (isAv(n, k)) {
        ctx.drawImage(avTpl[glow], x0, y);
        // personaje saludando en la puerta abierta
        const dx = x0 + S.avDoorX(TOWER_W);
        const set = chars[mod(n + k, 3)];
        const img = set.wave[Math.floor(t / 0.2) & 1];
        ctx.drawImage(img, dx - 10, y + FH - SLAB - 24);
        ctx.drawImage(doorPanel, 0, 0, S.AV_DOOR_W, S.AV_DOOR_H, dx + S.AV_DOOR_W - 6, y + FH - SLAB - S.AV_DOOR_H, 6, S.AV_DOOR_H);
      } else {
        ctx.drawImage(tpl[mod(n * 5 + k * 3, 7)], x0, y);
      }
    }
    // cables y cabina (la cámara sube con los ascensores)
    const cx = x0 + (TOWER_W >> 1);
    const cabTop = BASE - S.CAB_H;
    ctx.fillStyle = S.PAL.C2;
    ctx.fillRect(cx - 6, 0, 1, cabTop);
    ctx.fillRect(cx + 5, 0, 1, cabTop);
    ctx.drawImage(cabin, cx - (S.CAB_W >> 1), cabTop);
  }
  // oscurecer para que se lea el contenido
  ctx.fillStyle = 'rgba(11,10,16,0.7)';
  ctx.fillRect(0, 0, LW, LH);
}

// ── textos pixel ───────────────────────────────────────────────────────────
function text(str, x, y, size, color, align = 'left', shadow = null) {
  ctx.font = `${size}px PS2P`;
  ctx.textBaseline = 'top';
  const w = Array.from(str).length * size;
  const tx = Math.round(align === 'center' ? x - w / 2 : x);
  if (shadow) {
    for (const [dx, c] of shadow) { ctx.fillStyle = c; ctx.fillText(str, tx + dx, y + dx); }
  }
  ctx.fillStyle = color;
  ctx.fillText(str, tx, y);
}

// ── botón "JUGÁ Y GANÁ" con la animación del botón de consulta gratis ──────
function phase(t, period) { return mod(t, period) / period; }

function hopOffset(t) {
  const p = phase(t, 1.8);
  if (p >= 0.66 && p < 0.72) return -2;
  if (p >= 0.78 && p < 0.84) return -1;
  return 0;
}

function wiggleAngle(t) {
  const p = phase(t, 1.8);
  if (p >= 0.64 && p < 0.70) return -12;
  if (p >= 0.70 && p < 0.76) return 12;
  if (p >= 0.76 && p < 0.82) return -8;
  return 0;
}

function sparkle(t, x, y, delay) {
  const p = phase(t - delay, 1.2);
  if (p >= 0.66) return;
  const s = p < 0.33 ? 4 : 2;
  const o = (4 - s) >> 1;
  ctx.fillStyle = S.PAL.Y;
  ctx.fillRect(x + o - 1, y + o - 1, s + 2, s + 2);
  ctx.fillStyle = S.PAL.W;
  ctx.fillRect(x + o, y + o, s, s);
}

function drawButton(t, cx, top) {
  const label = 'JUGÁ Y GANÁ';
  const tw = Array.from(label).length * 16;
  const w = tw + 18 + 8 + 30, h = 38;
  const x = Math.round(cx - w / 2);
  const y = top + hopOffset(t);
  const ring = phase(t, 0.6) < 0.5 ? S.PAL.W : S.PAL.Y;
  ctx.fillStyle = ring; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = S.PAL.K; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = S.PAL.A; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffc09a'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h);
  ctx.fillStyle = '#b8481a'; ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x + w - 2, y, 2, h);
  // regalo que se sacude
  const gx = x + 15, gy = y + ((h - 18) >> 1);
  const ang = wiggleAngle(t);
  ctx.save();
  ctx.translate(gx + 9, gy + 9);
  if (ang) ctx.rotate((ang * Math.PI) / 180);
  ctx.drawImage(gift, -9, -9, 18, 18);
  ctx.restore();
  text(label, gx + 18 + 8, y + 11, 16, S.PAL.K);
  // destellos en esquinas opuestas
  sparkle(t, x - 9, y - 9, 0);
  sparkle(t, x + w + 5, y + h + 5, 0.6);
}

// ── composición ────────────────────────────────────────────────────────────
function drawUI(t) {
  // columna izquierda: título, logo, consigna, botón
  const lc = 150;
  text('ELEVATOR', lc, 22, 24, S.PAL.W, 'center', [[4, S.PAL.VD], [2, S.PAL.V]]);
  const lw = logo.width * 4, lh = logo.height * 4;
  ctx.drawImage(logo, Math.round(lc - lw / 2), 56, lw, lh);
  text('Frená el ascensor', lc, 146, 8, S.PAL.W, 'center', [[1, S.PAL.K]]);
  text('en el piso AV.', lc, 158, 8, S.PAL.W, 'center', [[1, S.PAL.K]]);
  drawButton(t, lc, 184);
  text('una consulta gratis con AV', lc, 236, 8, S.PAL.VL, 'center', [[1, S.PAL.K]]);

  // columna derecha: QR con marco violeta
  const qx = 390 - (qrSize >> 1), qy = 34;
  ctx.fillStyle = S.PAL.V; ctx.fillRect(qx - 4, qy - 4, qrSize + 8, qrSize + 8);
  ctx.fillStyle = S.PAL.VL; ctx.fillRect(qx - 4, qy - 4, qrSize + 8, 1);
  ctx.drawImage(qr, qx, qy);
  const qc = qx + qrSize / 2;
  text('ESCANEÁ', qc, qy + qrSize + 14, 16, S.PAL.Y, 'center', [[2, S.PAL.VD]]);
  text('y jugá desde tu celu', qc, qy + qrSize + 38, 8, S.PAL.W, 'center', [[1, S.PAL.K]]);

  text('AV Marketing Integral · avconsultora.marketing', LW / 2, LH - 12, 8, S.PAL.C3, 'center', [[1, S.PAL.K]]);
}

export function renderAt(seconds) {
  const t = mod(seconds, LOOP_S);
  drawBackground(t);
  drawUI(t);
  sctx.drawImage(buf, 0, 0, LW, LH, 0, 0, LW * SCALE, LH * SCALE);
}

window.renderAt = renderAt;
window.LOOP_S = LOOP_S;

const recording = new URLSearchParams(location.search).get('record') === '1';
document.fonts.load('16px PS2P').then(() => {
  window.__tvReady = true;
  if (recording) { renderAt(0); return; }
  const t0 = performance.now();
  const loop = (now) => { renderAt((now - t0) / 1000); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
