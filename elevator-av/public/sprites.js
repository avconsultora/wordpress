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
// miradorTEC: minúsculas geométricas finas, la pelotita rayada y TEC en mayúsculas (7 filas).
const MT_GLYPHS = {
  m: ['.......', '.......', '.##.##.', '#..#..#', '#..#..#', '#..#..#', '#..#..#'],
  i: ['#', '.', '#', '#', '#', '#', '#'],
  r: ['....', '....', '.###', '#...', '#...', '#...', '#...'],
  a: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.####'],
  d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  '°': ['.##.', '#.##', '##.#', '.##.', '....', '....', '....'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  E: ['####', '#...', '#...', '###.', '#...', '#...', '####'],
  C: ['.###', '#...', '#...', '#...', '#...', '#...', '.###'],
};

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

export const MIRADORTEC = composeText(MT_GLYPHS, 'mirador°TEC');
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

// Paño de vidrio entre columnas, con parantes finos y luces de techo.
function drawGlassBay(ctx, x0, x1, lit, r, theme, extras = true) {
  const y0 = 4, y1 = FH - SLAB;
  const w = x1 - x0;
  if (w < 6) return;
  if (lit === 2) {
    // oficina bien iluminada: vidrio cálido con parantes oscuros y alguien adentro
    rect(ctx, 'Y', x0, y0, w, y1 - y0);
    rect(ctx, 'W', x0, y0, w, 1);
    for (let x = x0 + 6 + Math.floor(r() * 3); x < x1 - 2; x += 7) rect(ctx, 'C1', x, y0, 1, y1 - y0);
    rect(ctx, 'C1', x0, y0 + 7, w, 1);
    if (r() < 0.6) {
      const px = x0 + 3 + Math.floor(r() * Math.max(1, w - 8));
      rect(ctx, 'C1', px, y1 - 11, 3, 3);
      rect(ctx, 'C1', px - 1, y1 - 8, 5, 5);
      rect(ctx, 'C1', px, y1 - 3, 1, 3);
      rect(ctx, 'C1', px + 2, y1 - 3, 1, 3);
    }
    return;
  }
  rect(ctx, lit ? theme.glassLit : theme.glassDark, x0, y0, w, y1 - y0);
  if (lit) {
    // luces rectangulares del techo, como en la foto
    for (let x = x0 + 2 + Math.floor(r() * 3); x + 3 < x1; x += 8) rect(ctx, theme.light, x, y0 + 2, 3, 1);
  } else {
    // reflejo en el vidrio oscuro
    const rx = x0 + 2 + Math.floor(r() * Math.max(1, w - 8));
    rect(ctx, theme.mullion, rx, y0 + 6, 1, 1);
    rect(ctx, theme.mullion, rx + 1, y0 + 5, 1, 1);
  }
  if (extras) {
    const pick = r();
    if (pick < 0.22 && w > 14) {
      // diagonal de estructura
      const len = Math.min(w - 2, y1 - y0 - 2);
      for (let i = 0; i < len; i++) rect(ctx, theme.brace, x0 + 1 + i, y0 + 1 + Math.round(i * (y1 - y0 - 3) / len), 2, 1);
    } else if (pick < 0.55 && lit) {
      // alguien adentro
      const px = x0 + 3 + Math.floor(r() * Math.max(1, w - 8));
      rect(ctx, theme.person, px, y1 - 11, 3, 3);
      rect(ctx, theme.person, px - 1, y1 - 8, 5, 5);
      rect(ctx, theme.person, px, y1 - 3, 1, 3);
      rect(ctx, theme.person, px + 2, y1 - 3, 1, 3);
    } else if (pick < 0.72 && w > 18) {
      // escalera de fondo
      for (let i = 0; i * 4 < w - 4; i++) rect(ctx, theme.mullion, x0 + 2 + i * 4, y1 - 4 - i * 4, 5, 1);
    }
  }
  // parantes verticales y travesaños
  for (let x = x0 + 7 + Math.floor(r() * 3); x < x1 - 2; x += 8) rect(ctx, theme.mullion, x, y0, 1, y1 - y0);
  rect(ctx, theme.mullion, x0, y0 + 7, w, 1);
  rect(ctx, theme.mullion, x0, y1 - 6, w, 1);
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

// Divide una zona en paños separados por una columna central.
function drawZone(ctx, x0, x1, r, theme) {
  const mid = x0 + (((x1 - x0) / 2) | 0) - 2;
  const pick = () => { const v = r(); return v < 0.22 ? 2 : v < 0.65 ? 1 : 0; };
  drawGlassBay(ctx, x0, mid, pick(), r, theme);
  drawGlassBay(ctx, mid + 4, x1, pick(), r, theme);
  drawColumn(ctx, mid, theme);
}

// Planta baja abierta sobre columnas, con el cartel miradorTEC.
function drawLobby(ctx, W, sl, sr, r) {
  const y1 = FH - SLAB;
  // interior en sombra bajo el edificio, con luces en el techo
  rect(ctx, 'C1', 5, 4, sl - 7, y1 - 4);
  rect(ctx, 'C1', sr + 2, 4, W - sr - 7, y1 - 4);
  for (let x = 7; x < W - 6; x += 6) if (x < sl - 3 || x > sr + 2) rect(ctx, 'Y', x, 5, 2, 1);
  // entrada vidriada al fondo (derecha)
  const gx = sr + 6, gw = W - 5 - 4 - gx;
  rect(ctx, 'Y', gx, 12, gw, y1 - 12);
  for (let x = gx + 5; x < gx + gw; x += 6) rect(ctx, 'C1', x, 12, 1, y1 - 12);
  rect(ctx, 'C1', gx, 12, gw, 1);
  rect(ctx, 'K', gx + 8, y1 - 9, 2, 2);
  rect(ctx, 'K', gx + 7, y1 - 7, 4, 7);
  // brillo cálido en el piso
  for (let x = gx; x < gx + gw; x += 3) rect(ctx, 'A', x, y1 - 1, 1, 1);
  // pilotes
  drawColumn(ctx, sr + 2, GRAY);
  drawColumn(ctx, W - 5 - 4 - 1, GRAY);
  drawColumn(ctx, 5 + (((sl - 7) / 2) | 0), GRAY);
  // cartel de hormigón con el logo miradorTEC
  const lw = MIRADORTEC[0].length;
  const bw = lw + 6, bh = MIRADORTEC.length + 6;
  const bx = Math.max(1, Math.min(6, sl - 3 - bw));
  const by = y1 - bh;
  rect(ctx, 'C3', bx, by, bw, bh);
  rect(ctx, 'C2', bx + 1, by + 1, bw - 2, bh - 2);
  rect(ctx, 'C1', bx, by + bh - 1, bw, 1);
  paint(ctx, MIRADORTEC, bx + 3, by + 3, { '#': 'W' });
  // luz que baña el cartel
  rect(ctx, 'Y', bx + 4, by - 1, 2, 1);
  rect(ctx, 'Y', bx + bw - 6, by - 1, 2, 1);
}

// Plantilla de un piso gris. `seed` define qué aparece en cada paño.
export function buildFloorTemplate(W, seed, lobby = false) {
  const c = makeCanvas(W, FH);
  const ctx = c.getContext('2d');
  const r = rng(seed * 7919 + 13);
  const { sl, sr } = drawFloorBase(ctx, W, GRAY);
  if (lobby) {
    drawLobby(ctx, W, sl, sr, r);
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
  drawGlassBay(ctx, 5, tx - 5, true, r, PURPLE, false);
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
  if (W - 5 - gx > 8) { drawColumn(ctx, gx - 2, PURPLE, 2); drawGlassBay(ctx, gx, W - 5, true, r, PURPLE, false); }
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
