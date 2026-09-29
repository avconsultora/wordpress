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
  H: '#5a3220',  // pelo castaño (pasajero de la cabina)
  HK: '#16141c', // pelo negro
  R: '#7a1c38',  // rulos bordó
  RL: '#b0385e', // brillo de los rulos
  LB: '#d8405a', // labios
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
  '....hhgghhhh....',
  '...hhghhhhhhh...',
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

// Chica con rulos (16×24): g = brillo del pelo, r = labios
const GIRL = [
  '.....hhhhhh.....',
  '...hhghhhhghh...',
  '..hhhhhhhhhhhh..',
  '..hghhhhhhhhgh..',
  '.hhhhssssssshhh.',
  '.hghsksssskshgh.',
  '.hhhsssssssshhh.',
  '.hghsssrrssshgh.',
  '.hhhhsssssshhh..',
  '.hgh..ssss..hgh.',
  '.hhhvvwwwwvvhhh.',
  '..hvvvvwwvvvvh..',
  '..vvvvvvvvvvvv..',
  '..vvdvvvvvvdvv..',
  '..vvdvvvvvvdvv..',
  '..ssdvvvvvvdss..',
  '..ss.vvvvvv.ss..',
  '....vvvvvvvv....',
  '...vvvvvvvvvv...',
  '.....ss..ss.....',
  '.....ss..ss.....',
  '.....ss..ss.....',
  '....kkk..kkk....',
  '................',
];

const GIRL_ARM = {
  10: '.hhhvvwwwwvvv...',
  11: '..hvvvvwwvvvv...',
  12: '..vvvvvvvvvvv...',
  13: '..vvdvvvvvvd....',
  14: '..vvdvvvvvvd....',
  15: '..ssdvvvvvvd....',
  16: '..ss.vvvvvv.....',
};

export const GIRL_FRAMES = {
  idle: [GIRL, withRows(GIRL, { 5: '.hghsssssssshgh.' })],
  wave: [
    withRows(GIRL, {
      ...GIRL_ARM,
      6: '.hhhsssssssshss.',
      7: '.hghsssrrssshss.',
      8: '.hhhhsssssshhvv.',
      9: '.hgh..ssss..vv..',
    }),
    withRows(GIRL, {
      ...GIRL_ARM,
      4: '.hhhhssssssshhss',
      5: '.hghsksssskshss.',
      6: '.hhhsssssssshvv.',
      7: '.hghsssrrsssvv..',
      8: '.hhhhssssssvv...',
      9: '.hgh..ssss.vv...',
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

export function characterCanvases(hair, shine = hair, frames = CHAR_FRAMES) {
  const map = { h: hair, g: shine, s: 'S', k: 'K', v: 'V', d: 'VD', w: 'W', p: 'C1', r: 'LB' };
  return {
    idle: frames.idle.map((f) => spriteCanvas(f, map)),
    wave: frames.wave.map((f) => spriteCanvas(f, map)),
  };
}

// Los tres personajes de la oficina AV, en el orden en que salen.
export function officeCharacters() {
  return [
    characterCanvases('Y'),                   // rubio
    characterCanvases('HK', 'C2'),            // morocho, pelo negro
    characterCanvases('R', 'RL', GIRL_FRAMES), // chica con rulos bordó
  ];
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

// ── Textos pixel dibujados a mano ──────────────────────────────────────────
// Marketing: mismo trazo fino, con descendente para la g (9 filas).
const MK_GLYPHS = {
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#', '.....', '.....'],
  a: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.####', '.....', '.....'],
  r: ['....', '....', '.###', '#...', '#...', '#...', '#...', '....', '....'],
  k: ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#', '....', '....'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.###.', '.....', '.....'],
  t: ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#', '...', '...'],
  i: ['#', '.', '#', '#', '#', '#', '#', '.', '.'],
  n: ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#', '....', '....'],
  g: ['.....', '.....', '.####', '#...#', '#...#', '#...#', '.####', '....#', '.###.'],
};

function composeText(glyphs, text) {
  const chars = Array.from(text);
  const h = glyphs[chars[0]].length;
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(chars.map((ch) => glyphs[ch][y]).join('.'));
  return rows;
}

export const MARKETING = composeText(MK_GLYPHS, 'Marketing');

// ── Edificio (estilo fachada miradorTEC: marco de hormigón + paños de vidrio) ──
const GRAY = {
  wall: 'C2', beam: 'C3', beamShade: 'C1', col: 'C3', colShade: 'C2', frame: 'C1',
  slabTop: 'C3', slab: 'C1', glassDark: 'K', glassLit: 'C1', mullion: 'C2', light: 'Y',
  person: 'C2', brace: 'C3', av: false,
};
const PURPLE = {
  wall: 'V', beam: 'VD', beamShade: 'K', col: 'VD', colShade: 'K', frame: 'VD',
  slabTop: 'VL', slab: 'VD', glassDark: 'VD', glassLit: 'VL', mullion: 'V', light: 'W',
  person: 'V', brace: 'VD', av: true,
};

function drawColumn(ctx, x, theme, w = 4) {
  rect(ctx, theme.col, x, 0, w, FH - SLAB);
  rect(ctx, theme.colShade, x + w - 1, 4, 1, FH - SLAB - 4);
}

// Ventana de 4 paños altos (como la referencia): divisiones verticales finas y
// un solo travesaño en el 1er paño (abajo) y en el 3ro (arriba).
// state: 0 = oscura, 1 = encendida, 2 = oficina bien iluminada.
function drawWindow(ctx, x0, x1, state, r, theme, people = true) {
  const y0 = 4, y1 = FH - SLAB;
  const w = x1 - x0, h = y1 - y0;
  if (w < 6) return;
  const bright = state === 2;
  const line = bright ? 'C1' : theme.mullion;
  rect(ctx, bright ? 'Y' : state ? theme.glassLit : theme.glassDark, x0, y0, w, h);
  if (bright) rect(ctx, 'W', x0, y0, w, 1);
  const n = w >= 36 ? 4 : w >= 20 ? 3 : 2;
  const px = [];
  for (let i = 0; i <= n; i++) px.push(x0 + Math.round((i * w) / n));
  // luces de techo en cada paño
  if (state === 1) for (let i = 0; i < n; i++) rect(ctx, theme.light, px[i] + 2, y0 + 2, Math.max(2, px[i + 1] - px[i] - 5), 1);
  // alguien adentro
  if (state && people && r() < 0.5) {
    const i = Math.floor(r() * n);
    const x = px[i] + 3 + Math.floor(r() * Math.max(1, px[i + 1] - px[i] - 8));
    const c = bright ? 'C1' : theme.person;
    rect(ctx, c, x, y1 - 11, 3, 3);
    rect(ctx, c, x - 1, y1 - 8, 5, 5);
    rect(ctx, c, x, y1 - 3, 1, 3);
    rect(ctx, c, x + 2, y1 - 3, 1, 3);
  }
  if (!state) {
    // reflejo en el vidrio oscuro
    const rx = x0 + 3 + Math.floor(r() * Math.max(1, w - 8));
    rect(ctx, theme.mullion, rx, y0 + 6, 1, 1);
    rect(ctx, theme.mullion, rx + 1, y0 + 5, 1, 1);
  }
  for (let i = 1; i < n; i++) rect(ctx, line, px[i], y0, 1, h);
  rect(ctx, line, x0, y0 + Math.round(h * 0.72), px[1] - x0, 1);
  if (n >= 3) rect(ctx, line, px[2], y0 + Math.round(h * 0.28), px[3] - px[2], 1);
}

function drawFloorBase(ctx, W, theme) {
  const cx = W >> 1;
  const sl = cx - (SHAFT_W >> 1), sr = cx + (SHAFT_W >> 1);
  rect(ctx, theme.wall, 0, 0, W, FH);
  // viga de hormigón (techo) y losa
  rect(ctx, theme.beam, 0, 0, W, 3);
  rect(ctx, theme.beamShade, 0, 3, W, 1);
  rect(ctx, theme.slab, 0, FH - SLAB, W, SLAB);
  rect(ctx, theme.slabTop, 0, FH - SLAB, W, 1);
  // columnas del marco exterior
  drawColumn(ctx, 0, theme, 5);
  drawColumn(ctx, W - 5, theme, 5);
  // hueco del ascensor
  rect(ctx, 'K', sl, 0, SHAFT_W, FH);
  rect(ctx, 'C1', sl + 1, 0, 2, FH);
  rect(ctx, 'C1', sr - 3, 0, 2, FH);
  rect(ctx, 'C1', sl, FH - SLAB, SHAFT_W, 1);
  rect(ctx, theme.frame, sl - 2, 0, 2, FH);
  rect(ctx, theme.frame, sr, 0, 2, FH);
  return { sl, sr };
}

// Una ventana grande por zona.
function drawZone(ctx, x0, x1, r, theme) {
  const v = r();
  drawWindow(ctx, x0, x1, v < 0.25 ? 2 : v < 0.7 ? 1 : 0, r, theme);
}

// Planta baja abierta sobre pilotes (el cartel miradorTEC se dibuja aparte, adelante).
function drawLobby(ctx, W, sl, sr) {
  const y1 = FH - SLAB;
  // interior en sombra bajo el edificio, con luces en el techo
  rect(ctx, 'C1', 5, 4, sl - 7, y1 - 4);
  rect(ctx, 'C1', sr + 2, 4, W - sr - 7, y1 - 4);
  for (let x = 7; x < W - 6; x += 6) if (x < sl - 3 || x > sr + 2) rect(ctx, 'Y', x, 5, 2, 1);
  // entrada vidriada iluminada al fondo (izquierda)
  const gx = 12, gw = sl - 8 - gx;
  rect(ctx, 'Y', gx, 12, gw, y1 - 12);
  rect(ctx, 'W', gx, 12, gw, 1);
  const n = 4;
  for (let i = 1; i < n; i++) rect(ctx, 'C1', gx + Math.round((i * gw) / n), 12, 1, y1 - 12);
  rect(ctx, 'K', gx + 8, y1 - 9, 2, 2);
  rect(ctx, 'K', gx + 7, y1 - 7, 4, 7);
  for (let x = gx; x < gx + gw; x += 3) rect(ctx, 'A', x, y1 - 1, 1, 1);
  // pilotes
  drawColumn(ctx, 5 + 2, GRAY);
  drawColumn(ctx, sl - 7, GRAY);
  drawColumn(ctx, sr + 8, GRAY);
  drawColumn(ctx, W - 5 - 12, GRAY);
}

// Logo miradorTEC grande (10 filas), dibujado a mano.
const MT_BIG = {
  m: ['.........', '.........', '.........', '.###.###.', '#...#...#', '#...#...#', '#...#...#', '#...#...#', '#...#...#', '#...#...#'],
  i: ['.', '#', '.', '#', '#', '#', '#', '#', '#', '#'],
  r: ['.....', '.....', '.....', '.####', '#....', '#....', '#....', '#....', '#....', '#....'],
  a: ['.......', '.......', '.......', '.#####.', '#.....#', '#.....#', '#.....#', '#.....#', '#....##', '.####.#'],
  d: ['......#', '......#', '......#', '.######', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '.######'],
  o: ['.......', '.......', '.......', '.#####.', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '.#####.'],
  '°': ['.####.', '######', '#.....', '######', '.####.', '......', '......', '......', '......', '......'],
  T: ['#######', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...'],
  E: ['######', '#.....', '#.....', '#.....', '#####.', '#.....', '#.....', '#.....', '#.....', '######'],
  C: ['.#####', '#.....', '#.....', '#.....', '#.....', '#.....', '#.....', '#.....', '#.....', '.#####'],
};
export const MIRADORTEC_BIG = composeText(MT_BIG, 'mirador°TEC');

// Cartel de hormigón con el logo: va en la vereda del primer piso, a la derecha,
// tapando la mitad del ascensor. Devuelve el canvas y su x.
export function buildMiradorSign(W) {
  const lw = MIRADORTEC_BIG[0].length;
  const cx = W >> 1;
  const bw = Math.max(lw + 8, W - 3 - cx);
  const bh = MIRADORTEC_BIG.length + 9;
  const c = makeCanvas(bw, bh + 2);
  const ctx = c.getContext('2d');
  // luz que baña el cartel desde abajo
  rect(ctx, 'Y', 3, 0, 2, 1);
  rect(ctx, 'Y', bw - 5, 0, 2, 1);
  rect(ctx, 'C3', 0, 2, bw, bh);
  rect(ctx, 'C2', 1, 3, bw - 2, bh - 3);
  rect(ctx, 'W', 1, 3, bw - 2, 1);
  rect(ctx, 'C1', 0, bh + 1, bw, 1);
  paint(ctx, MIRADORTEC_BIG, bw - 4 - lw, 7, { '#': 'W' });
  // detalle azul de la placa lateral, como en la foto
  rect(ctx, 'VL', bw - 3, 6, 1, 3);
  return { canvas: c, x: W - 3 - bw };
}

// Plantilla de un piso gris. `seed` define qué aparece en cada paño.
export function buildFloorTemplate(W, seed, lobby = false) {
  const c = makeCanvas(W, FH);
  const ctx = c.getContext('2d');
  const r = rng(seed * 7919 + 13);
  const { sl, sr } = drawFloorBase(ctx, W, GRAY);
  if (lobby) {
    drawLobby(ctx, W, sl, sr);
    return c;
  }
  drawZone(ctx, 5, sl - 2, r, GRAY);
  drawZone(ctx, sr + 2, W - 5, r, GRAY);
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
  const r = rng(99);
  // bandas de luz
  rect(ctx, glow, 0, 3, W, 1);
  rect(ctx, glow, 0, FH - SLAB, W, 1);
  // izquierda: paño de vidrio encendido + pared con "Marketing" en blanco
  const mw = MARKETING[0].length;
  const tx = sl - 5 - mw;
  drawWindow(ctx, 5, tx - 5, 1, r, PURPLE, false);
  drawColumn(ctx, tx - 5, PURPLE);
  paint(ctx, MARKETING, tx, 15, { '#': 'W' });
  // marco de la puerta de la oficina (la hoja se dibuja aparte, animada)
  const dx = avDoorX(W);
  rect(ctx, 'VD', dx - 2, FH - SLAB - AV_DOOR_H - 2, AV_DOOR_W + 4, AV_DOOR_H + 2);
  rect(ctx, 'K', dx, FH - SLAB - AV_DOOR_H, AV_DOOR_W, AV_DOOR_H);
  // cartel luminoso arriba de la puerta
  rect(ctx, phase ? 'A' : 'Y', dx + 4, 4, AV_DOOR_W - 8, 2);
  // lámparas de parada
  rect(ctx, phase ? 'A' : 'Y', sl - 5, FH - SLAB - 5, 3, 3);
  rect(ctx, phase ? 'A' : 'Y', sr + 2, FH - SLAB - 5, 3, 3);
  // derecha de la puerta: paño de vidrio violeta
  const gx = dx + AV_DOOR_W + 4;
  if (W - 5 - gx > 8) { drawColumn(ctx, gx - 2, PURPLE, 2); drawWindow(ctx, gx, W - 5, 1, r, PURPLE, false); }
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
