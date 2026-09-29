// ELEVATOR AV — configuración.
// Este es el único archivo que hace falta tocar para ajustar el juego o cambiar de evento.

// ── Gameplay ────────────────────────────────────────────────────────────────
// Si cambiás startSpeed, speedMultiplier, maxSpeed, minGap, gapGrowthEvery,
// hitTolerance o roundTransitionMs, actualizá también las constantes de la
// función min_duration_ms() en supabase.sql (anti-trampa).
export const CONFIG = {
  startSpeed: 1.6,        // pisos/seg en la ronda 1
  speedMultiplier: 1.09,  // multiplicador de velocidad por acierto
  maxSpeed: 9,            // tope de velocidad (pisos/seg)
  minGap: 3,              // pisos mínimos entre objetivos
  maxGap: 6,              // pisos máximos entre objetivos
  gapGrowthEvery: 5,      // cada N aciertos, minGap y maxGap suben 1
  gapCap: 10,             // tope de maxGap (y de minGap)
  hitTolerance: 0.30,     // tolerancia inicial, en fracción de piso
  minHitTolerance: 0.18,  // la tolerancia nunca baja de acá
  toleranceStep: 0.006,   // cuánto baja la tolerancia por acierto
  overshootLimit: 1.5,    // pisos de más antes de terminar la partida sola
  roundTransitionMs: 1100,// pausa de festejo entre rondas
  missRevealMs: 750,      // cuánto se ve el error antes de la pantalla de game over
  consultaMinScore: 1,    // aciertos para ganar la consulta gratis (0 = siempre)
};

// ── Evento y ranking ───────────────────────────────────────────────────────
export const EVENT_ID = 'evento-2026';   // cambialo para arrancar un ranking nuevo

export const SUPABASE = {
  url: 'https://iwoplqimdafucvghfovk.supabase.co',
  key: 'sb_publishable_6YrNsvV6anwQYaIkpBI21w_Vj28dNvH', // publishable / anon: es pública
};

// URL que codifica el QR de la vista de pantalla grande (?display=1).
export const GAME_URL = 'https://juego.avconsultora.marketing/';

export const BRAND_URL = 'https://avconsultora.marketing';

export const DISPLAY_REFRESH_MS = 10000;

// ── Frases del globo (máx ~26 caracteres; si no entran, van en 2 líneas) ─────
export const PHRASES = [
  '¡Eso es estrategia!',
  '¡Buen timing!',
  '¡Encontraste el nicho!',
  '¡Cliente adentro!',
  '¡Objetivo cumplido!',
  '¡El algoritmo te ama!',
  '¡Caso de éxito!',
  '¡Marketing en serio!',
  '¡Un piso más y facturamos!',
  '¡Cerraste la venta!',
  '¡Esa campaña escala!',
  '¡Aprobado por marketing!',
  '¡Sin reunión previa!',
  '¡Justo a tiempo!',
  '¡Ni un piso de más!',
];

// ── Moderación de nicknames ─────────────────────────────────────────────────
// Se comparan sin acentos, sin espacios y con "leet" normalizado (0→o, 1→i, 4→a…).
// Las palabras de 3 letras o menos solo matchean como palabra entera.
// La base tiene su propia lista (tabla banned_words), que es la que manda.
export const BAD_WORDS = [
  'puto', 'puta', 'putita', 'trolo', 'trola', 'forro', 'forra', 'pelotudo', 'pelotuda',
  'boludo', 'boluda', 'concha', 'conchuda', 'chota', 'pija', 'verga', 'garcha', 'poronga',
  'orto', 'culo', 'culiado', 'cogida', 'coger', 'mogolico', 'mogolica', 'idiota', 'imbecil',
  'tarado', 'tarada', 'pajero', 'pajera', 'sorete', 'mierda', 'cagon', 'cagona', 'hdp',
  'hijodeputa', 'malparido', 'gil', 'gila', 'negro de mierda', 'villero', 'sidoso', 'nazi',
  'hitler', 'marica', 'maricon', 'puton', 'teta', 'tetas', 'pene', 'vagina', 'porno', 'sexo',
  'fuck', 'shit', 'bitch', 'dick', 'cunt', 'nigger', 'nigga', 'faggot',
];
