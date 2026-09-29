// Sprites en código: matrices de caracteres + paleta. Todo se pre-renderiza
// a canvases una sola vez; el game loop solo hace drawImage.

export const PAL = {
  K: '#0b0a10',  // negro
  C1: '#23222b', // cemento oscuro
  C2: '#43414d', // cemento
  C3: '#77747f', // cemento claro
  VD: '#3a1648', // violeta oscuro
  V: '#78328a',  // violeta AV
  VL: '#c07fd6', // violeta claro
  Y: '#f6c945',  // luz de ventana
  W: '#f2ead8',  // blanco hueso
  A: '#ff7a3d',  // acento cálido (éxito)
  S: '#eeb07f',  // piel
  H: '#5a3220',  // pelo morocho
};

export const FH = 40;     // alto de un piso (px lógicos)
export const SLAB = 3;    // alto de la losa
export const SHAFT_W = 32;
export const CAB_W = 28;
export const CAB_H = 34;

// ── Logo AV pixelado desde el archivo original ──────────────────────────────
export const LOGO_18 = [
  '...#######.###..##',
  '..########.###.##.',
  '.###...###.###.##.',
  '.###..###..#####..',
  '####..###..#####..',
  '###...###..#####..',
  '###...###..####...',
  '###..####.#####...',
  '.#############....',
  '.####.####.###....',
];

export const LOGO_32 = [
  '.......###########.#####....####',
  '.....#############.#####....###.',
  '....#############..#####...####.',
  '...#####....#####..#####...###..',
  '..######....#####..#####..####..',
  '..#####.....#####..#####..###...',
  '.######....######..#####.####...',
  '.#####.....#####...#####.###....',
  '.#####.....#####...#########....',
  '######.....#####...########.....',
  '######.....#####...########.....',
  '######....#####....########.....',
  '######...######...########......',
  '.######.#######..#########......',
  '.########################.......',
  '..#######..#######.######.......',
  '...#####....####...#####........',
];

// ── Personajes (16×24) ──────────────────────────────────────────────────────
// h = pelo (rubio o morocho), s = piel, k = negro, v/d = camisa violeta, w = cuello, p = pantalón
const BODY = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhssssssh....',
  '...hsksssskh....',
  '....ssssssss....',
  '....sssssssss...',
  '.....ssssss.....',
  '......ssss......',
  '....vvwwwwvv....',
  '...vvvvwwvvvv...',
  '..vvvvvvvvvvvv..',
  '..vvdvvvvvvdvv..',
  '..vvdvvvvvvdvv..',
  '..ssdvvvvvvdss..',
  '..ss.vvvvvv.ss..',
  '.....pppppp.....',
  '.....pppppp.....',
  '.....pp..pp.....',
  '.....pp..pp.....',
  '.....pp..pp.....',
  '....kkk..kkk....',
  '................',
];

function withRows(base, rows) {
  const out = base.slice();
  for (const k in rows) out[k] = rows[k];
  return out;
}

const SMILE = '....sssskkss....';

export const CHAR_FRAMES = {
  idle: [
    withRows(BODY, { 7: SMILE }),
    withRows(BODY, { 5: '...hssssssh.....', 7: SMILE }),
  ],
  wave: [
    withRows(BODY, {
      6: '....ssssssss.ss.',
      7: '....sssskkss.ss.',
      8: '.....ssssss..vv.',
      9: '......ssss..vv..',
      10: '....vvwwwwvvv...',
      12: '..vvvvvvvvvvv...',
      13: '..vvdvvvvvvd....',
      14: '..vvdvvvvvvd....',
      15: '..ssdvvvvvvd....',
      16: '..ss.vvvvvv.....',
    }),
    withRows(BODY, {
      4: '...hhssssssh..ss',
      5: '...hsksssskh.ss.',
      6: '....ssssssss.vv.',
      7: '....sssskkss.vv.',
      8: '.....ssssss.vv..',
      9: '......ssss.vv...',
      10: '....vvwwwwvvv...',
      12: '..vvvvvvvvvvv...',
      13: '..vvdvvvvvvd....',
      14: '..vvdvvvvvvd....',
      15: '..ssdvvvvvvd....',
      16: '..ss.vvvvvv.....',
    }),
  ],
};

// ── Íconos chicos (para el HUD HTML) ────────────────────────────────────────
export const ICONS = {
  soundOn: [
    '....k....',
    '...kk..k.',
    'kkkWk.k.k',
    'kWWWk..kk',
    'kWWWk..kk',
    'kkkWk.k.k',
    '...kk..k.',
    '....k....',
  ],
  soundOff: [
    '....k....',
    '...kk....',
    'kkkWk.k.k',
    'kWWWk..k.',
    'kWWWk..k.',
    'kkkWk.k.k',
    '...kk....',
    '....k....',
  ],
  gift: [
    '..kk.kk..',
    '.kAkkkAk.',
    'kkkkAkkkk',
    'kAAAWAAAk',
    'kkkkWkkkk',
    '.kVVWVVk.',
    '.kVVWVVk.',
    '.kVVWVVk.',
    '.kkkkkkk.',
  ],
  check: [
    '......k',
    '.....kW',
    'k...kW.',
    'Wk.kW..',
    '.WkW...',
    '..W....',
  ],
};

const ICON_MAP = { k: 'W', W: 'VL', A: 'A', V: 'V' };
const ICON_MAP_DARK = { k: 'K', W: 'W', A: 'A', V: 'V' };

// ── Helpers ────────────────────────────────────────────────────────────────
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

export function paint(ctx, rows, x, y, map) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const key = map ? map[ch] : ch;
      if (!key) continue;
      ctx.fillStyle = PAL[key] || key;
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
}

export function spriteCanvas(rows, map) {
  const c = makeCanvas(rows[0].length, rows.length);
  paint(c.getContext('2d'), rows, 0, 0, map);
  return c;
}

// Canvas para usar en el DOM (se escala con CSS image-rendering: pixelated).
export function iconCanvas(name, dark = false) {
  const c = spriteCanvas(ICONS[name], dark ? ICON_MAP_DARK : ICON_MAP);
  c.className = 'px-icon';
  return c;
}

export function logoCanvas(outline = true) {
  const rows = LOGO_32;
  const w = rows[0].length + 2, h = rows.length + 2;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  if (outline) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      paint(ctx, rows, 1 + dx, 1 + dy, { '#': 'W' });
    }
  }
  paint(ctx, rows, 1, 1, { '#': 'V' });
  return c;
}

export function characterCanvases(hair) {
  const map = { h: hair, s: 'S', k: 'K', v: 'V', d: 'VD', w: 'W', p: 'C1' };
  return {
    idle: CHAR_FRAMES.idle.map((f) => spriteCanvas(f, map)),
    wave: CHAR_FRAMES.wave.map((f) => spriteCanvas(f, map)),
  };
}

// ── Dígitos 3×5 para los carteles de piso ──────────────────────────────────
const DIGITS = [
  '###,#.#,#.#,#.#,###', '.#.,##.,.#.,.#.,###', '###,..#,###,#..,###', '###,..#,###,..#,###',
  '#.#,#.#,###,..#,..#', '###,#..,###,..#,###', '###,#..,###,#.#,###', '###,..#,..#,.#.,.#.',
  '###,#.#,###,#.#,###', '###,#.#,###,..#,###',
];

export function digitStrip(color) {
  const c = makeCanvas(40, 5);
  const ctx = c.getContext('2d');
  for (let d = 0; d < 10; d++) paint(ctx, DIGITS[d].split(','), d * 4, 0, { '#': color });
  return c;
}

// ── Edificio ───────────────────────────────────────────────────────────────
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function floorHash(n) {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = PAL[color] || color;
  ctx.fillRect(x, y, w, h);
}

function drawWindow(ctx, x, y, lit, r, theme) {
  const glass = theme.av ? (lit ? 'VL' : 'VD') : (lit ? 'Y' : 'K');
  rect(ctx, theme.frame, x - 1, y - 1, 16, 18);
  rect(ctx, glass, x, y, 14, 16);
  rect(ctx, theme.frame, x + 6, y, 2, 16);
  rect(ctx, theme.frame, x, y + 7, 14, 1);
  if (lit && !theme.av) {
    // cortina / silueta
    rect(ctx, 'A', x, y, 14, 2);
    if (r() < 0.5) { rect(ctx, 'C2', x + 9, y + 9, 3, 7); rect(ctx, 'C2', x + 9, y + 7, 3, 2); }
  } else if (!theme.av) {
    ctx.fillStyle = PAL.W;
    ctx.fillRect(x + 2 + Math.floor(r() * 3), y + 2 + Math.floor(r() * 3), 1, 1);
    ctx.fillRect(x + 9 + Math.floor(r() * 3), y + 10 + Math.floor(r() * 4), 1, 1);
    rect(ctx, 'C1', x + 1, y + 12, 2, 1);
  }
  rect(ctx, theme.sill, x - 1, y + 16, 16, 2);
}

function drawDoor(ctx, x, y, theme) {
  rect(ctx, theme.frame, x - 1, y - 1, 14, 25);
  rect(ctx, theme.door, x, y, 12, 24);
  rect(ctx, theme.frame, x + 2, y + 3, 8, 7);
  rect(ctx, theme.door2, x + 3, y + 4, 6, 5);
  rect(ctx, 'Y', x + 9, y + 13, 2, 2);
}

function drawPainting(ctx, x, y, r) {
  rect(ctx, 'Y', x, y, 12, 9);
  rect(ctx, 'K', x + 1, y + 1, 10, 7);
  const c = r() < 0.5 ? 'A' : 'VL';
  rect(ctx, c, x + 2, y + 5, 8, 2);
  rect(ctx, 'W', x + 7, y + 2, 2, 2);
}

function drawStairs(ctx, x, y, w, theme) {
  // escalera de fondo en diagonal, estilo Elevator Action
  const steps = Math.floor(w / 4);
  for (let i = 0; i < steps; i++) {
    rect(ctx, theme.stair, x + i * 4, y + FH - SLAB - 4 - Math.round(i * 4 * ((FH - SLAB - 10) / w)), 5, 2);
  }
  rect(ctx, theme.stairRail, x, y + 6, 1, FH - SLAB - 6);
}

function drawLamp(ctx, x, y, theme) {
  rect(ctx, theme.frame, x, y, 4, 2);
  rect(ctx, 'Y', x + 1, y + 2, 2, 2);
}

const GRAY = {
  wall: 'C2', wall2: 'C1', trim: 'C3', frame: 'C1', sill: 'C3', door: 'C1', door2: 'C2',
  slabTop: 'C3', slab: 'C1', stair: 'C1', stairRail: 'C1', brick: 'C1', brick2: 'K', av: false,
};
const PURPLE = {
  wall: 'V', wall2: 'VD', trim: 'VL', frame: 'VD', sill: 'VL', door: 'VD', door2: 'V',
  slabTop: 'VL', slab: 'VD', stair: 'VD', stairRail: 'VD', brick: 'VD', brick2: 'K', av: true,
};

function drawFloorBase(ctx, W, theme) {
  const cx = W >> 1;
  const sl = cx - (SHAFT_W >> 1), sr = cx + (SHAFT_W >> 1);
  rect(ctx, theme.wall, 0, 0, W, FH);
  // techo y zócalo
  rect(ctx, theme.wall2, 0, 0, W, 2);
  rect(ctx, theme.trim, 0, 2, W, 1);
  rect(ctx, theme.wall2, 0, FH - SLAB - 6, W, 6);
  rect(ctx, theme.trim, 0, FH - SLAB - 7, W, 1);
  // losa
  rect(ctx, theme.slab, 0, FH - SLAB, W, SLAB);
  rect(ctx, theme.slabTop, 0, FH - SLAB, W, 1);
  // muros exteriores de ladrillo
  for (const bx of [0, W - 4]) {
    rect(ctx, theme.brick, bx, 0, 4, FH);
    for (let by = 0; by < FH; by += 4) rect(ctx, theme.brick2, bx + ((by >> 2) & 1) * 2, by, 1, 1);
  }
  // hueco del ascensor
  rect(ctx, 'K', sl, 0, SHAFT_W, FH);
  rect(ctx, 'C1', sl + 1, 0, 2, FH);
  rect(ctx, 'C1', sr - 3, 0, 2, FH);
  rect(ctx, 'C1', sl, FH - SLAB, SHAFT_W, 1);
  rect(ctx, theme.frame, sl - 2, 0, 2, FH);
  rect(ctx, theme.frame, sr, 0, 2, FH);
  return { sl, sr };
}

// Plantilla de un piso gris. `seed` define qué objetos aparecen.
export function buildFloorTemplate(W, seed, lobby = false) {
  const c = makeCanvas(W, FH);
  const ctx = c.getContext('2d');
  const r = rng(seed * 7919 + 13);
  const { sl, sr } = drawFloorBase(ctx, W, GRAY);
  const zones = [[6, sl - 19], [sr + 4, W - 6]];
  const top = 8;
  for (let z = 0; z < 2; z++) {
    let [x0, x1] = zones[z];
    if (lobby) {
      // puerta de vidrio doble
      const dx = z === 0 ? x0 + 10 : x1 - 34;
      rect(ctx, 'C1', dx - 1, top - 1, 26, 30);
      rect(ctx, 'Y', dx, top, 24, 29);
      rect(ctx, 'C1', dx + 11, top, 2, 29);
      rect(ctx, 'W', dx + 2, top + 2, 1, 6);
      rect(ctx, 'W', dx + 15, top + 2, 1, 6);
      continue;
    }
    let x = x0 + Math.floor(r() * 4);
    while (x < x1 - 14) {
      const room = x1 - x;
      const pick = r();
      if (pick < 0.38 && room >= 16) {
        drawWindow(ctx, x + 1, top + 2, r() < 0.55, r, GRAY);
        x += 18 + Math.floor(r() * 5);
      } else if (pick < 0.62 && room >= 14) {
        drawDoor(ctx, x + 1, FH - SLAB - 25, GRAY);
        x += 16 + Math.floor(r() * 5);
      } else if (pick < 0.75 && room >= 24) {
        drawStairs(ctx, x, 0, 24, GRAY);
        x += 26;
      } else if (pick < 0.88 && room >= 13) {
        drawPainting(ctx, x + 1, top + 5, r);
        x += 15;
      } else {
        drawLamp(ctx, x + 2, top - 3, GRAY);
        x += 8 + Math.floor(r() * 6);
      }
    }
  }
  return c;
}

export const AV_DOOR_W = 22, AV_DOOR_H = 30;

// Panel de la puerta de la oficina AV (con el logo violeta sobre blanco hueso).
export function buildAvDoorPanel() {
  const c = makeCanvas(AV_DOOR_W, AV_DOOR_H);
  const ctx = c.getContext('2d');
  rect(ctx, 'W', 0, 0, AV_DOOR_W, AV_DOOR_H);
  rect(ctx, 'VL', 0, 0, 1, AV_DOOR_H);
  paint(ctx, LOGO_18, 2, 5, { '#': 'V' });
  rect(ctx, 'VL', 2, 19, 18, 1);
  rect(ctx, 'V', 17, 21, 2, 2);
  return c;
}

// Piso AV: todo violeta, con brillo. phase 0/1 alterna el brillo.
export function buildAvTemplate(W, phase) {
  const c = makeCanvas(W, FH);
  const ctx = c.getContext('2d');
  const { sl, sr } = drawFloorBase(ctx, W, PURPLE);
  const glow = phase ? 'W' : 'VL';
  // bandas de luz
  rect(ctx, glow, 0, 2, W, 1);
  rect(ctx, glow, 0, FH - SLAB, W, 1);
  // ventanas violetas encendidas a la izquierda
  const r = rng(99);
  let x = 8;
  while (x + 16 < sl - 26) { drawWindow(ctx, x, 10, true, r, { ...PURPLE, frame: 'VD' }); x += 22; }
  // logo grande en la pared izquierda, cerca del hueco
  paint(ctx, LOGO_18, sl - 22, 20, { '#': phase ? 'W' : 'VL' });
  // marco de la puerta de la oficina (la hoja se dibuja aparte, animada)
  const dx = avDoorX(W);
  rect(ctx, 'VD', dx - 2, FH - SLAB - AV_DOOR_H - 2, AV_DOOR_W + 4, AV_DOOR_H + 2);
  rect(ctx, 'K', dx, FH - SLAB - AV_DOOR_H, AV_DOOR_W, AV_DOOR_H);
  // cartel luminoso arriba de la puerta
  rect(ctx, phase ? 'A' : 'Y', dx + 4, 3, AV_DOOR_W - 8, 2);
  // lámparas de parada
  rect(ctx, phase ? 'A' : 'Y', sl - 5, FH - SLAB - 5, 3, 3);
  rect(ctx, phase ? 'A' : 'Y', sr + 2, FH - SLAB - 5, 3, 3);
  // piso a la derecha después de la puerta: ventana
  if (W - (dx + AV_DOOR_W) > 22) drawWindow(ctx, dx + AV_DOOR_W + 5, 10, true, r, PURPLE);
  return c;
}

export function avDoorX(W) {
  const sr = (W >> 1) + (SHAFT_W >> 1);
  return sr + 12;
}

// Cabina del ascensor.
export function buildCabin() {
  const c = makeCanvas(CAB_W, CAB_H);
  const ctx = c.getContext('2d');
  rect(ctx, 'K', 0, 0, CAB_W, CAB_H);
  rect(ctx, 'C3', 1, 1, CAB_W - 2, CAB_H - 2);
  rect(ctx, 'C2', 1, 1, CAB_W - 2, 4);
  rect(ctx, 'Y', (CAB_W >> 1) - 2, 2, 4, 2);
  // ventana con el pasajero
  rect(ctx, 'K', 5, 7, CAB_W - 10, 11);
  rect(ctx, 'C1', 6, 8, CAB_W - 12, 9);
  const px = (CAB_W >> 1) - 3;
  rect(ctx, 'H', px, 10, 6, 2);
  rect(ctx, 'S', px, 12, 6, 3);
  rect(ctx, 'V', px - 1, 15, 8, 2);
  // puertas
  rect(ctx, 'C2', 3, 19, CAB_W - 6, CAB_H - 21);
  rect(ctx, 'K', CAB_W >> 1, 19, 1, CAB_H - 21);
  // franja violeta
  rect(ctx, 'V', 1, 23, CAB_W - 2, 2);
  rect(ctx, 'W', 1, CAB_H - 3, CAB_W - 2, 1);
  return c;
}
