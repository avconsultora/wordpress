// ELEVATOR AV — motor del juego.
// Los números de gameplay viven en config.js (CONFIG).
import { CONFIG, PHRASES, EVENT_ID } from './config.js?v=7';
import {
  difficultyFor, evaluateStop, HIT, OVER, nextPhrase, wrapPhrase,
  cleanNickname, moderateNickname, normalizeWhatsapp, isValidWhatsapp,
} from './logic.js?v=7';
import * as S from './sprites.js?v=7';
import * as sfx from './audio.js?v=7';
import { submitScore, fetchRanking, submitLead, newGameId } from './ranking.js?v=7';

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';

// ── Almacenamiento local seguro ─────────────────────────────────────────────
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } },
};
const KEY_BEST = 'eav_best';
const KEY_NICK = 'eav_nick';
const KEY_LEAD = 'eav_lead_' + EVENT_ID;
const KEY_PHRASES = 'eav_phrases';

const $ = (id) => document.getElementById(id);

if (params.get('display') === '1') {
  import('./display.js?v=7');
} else {
  boot();
}

function boot() {
  // ── Pantalla y resolución ────────────────────────────────────────────────
  const stage = $('stage');
  const screen = $('screen');
  const sctx = screen.getContext('2d');
  const buffer = document.createElement('canvas');
  let bctx = buffer.getContext('2d');
  const safeProbe = $('safe');
  const coarseLandscape = window.matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 540px)');

  let W = 184, H = 360, scale = 1, anchor = 250, hudTop = 4;
  let builtW = 0;

  // gráficos pre-renderizados
  let floorTpl = [];
  let lobbyTpl = null;
  let avTpl = [null, null];
  let sign = null;
  const cabin = S.buildCabin();
  const doorPanel = S.buildAvDoorPanel();
  const digitsW = S.digitStrip('W');
  const chars = S.officeCharacters();
  const NV = 8;

  // Chrome no re-resuelve la fuente si se asigna el mismo string: forzamos el cambio.
  function setFont() {
    bctx.font = '8px monospace';
    bctx.font = '8px PS2P';
  }

  function buildTemplates() {
    floorTpl = [];
    for (let i = 0; i < NV; i++) {
      const c = S.buildFloorTemplate(W, i + 1);
      const f = S.makeCanvas(W, S.FH);
      const fx = f.getContext('2d');
      fx.translate(W, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
      floorTpl.push(c, f);
    }
    lobbyTpl = S.buildFloorTemplate(W, 1, true);
    avTpl = [S.buildAvTemplate(W, 0), S.buildAvTemplate(W, 1)];
    sign = S.buildMiradorSign(W);
    builtW = W;
  }

  function fit() {
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && builtW) return; // no redimensionar con el teclado abierto
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 4);
    const colW = vh > vw * 1.25 ? vw : Math.min(vw, Math.round(vh * 0.56));
    // escala entera en pixeles físicos, ancho lógico ~184
    let s = Math.max(1, Math.round((colW * dpr) / 184));
    while (s > 1 && (colW * dpr) / s < 168) s--;
    let w = Math.ceil((colW * dpr) / s);
    if (w > 208) { s++; w = Math.ceil((colW * dpr) / s); }
    W = Math.max(160, w);
    H = Math.ceil((vh * dpr) / s);
    scale = s;
    anchor = Math.round(H * 0.72);
    const safeTop = safeProbe ? safeProbe.getBoundingClientRect().height : 0;
    hudTop = Math.ceil((safeTop * dpr) / s) + 4;

    stage.style.width = colW + 'px';
    stage.style.height = vh + 'px';
    stage.style.left = Math.round((vw - colW) / 2) + 'px';
    screen.width = W * s;
    screen.height = H * s;
    screen.style.width = (W * s) / dpr + 'px';
    screen.style.height = (H * s) / dpr + 'px';
    buffer.width = W;
    buffer.height = H;
    bctx = buffer.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    setFont();
    bctx.textBaseline = 'top';
    sctx.imageSmoothingEnabled = false;
    if (builtW !== W) buildTemplates();
    if (coarseLandscape.matches) pauseGame();
  }

  // ── Estado del juego ─────────────────────────────────────────────────────
  // state: intro | moving | hit | miss | over
  let state = 'intro';
  let paused = false, pausedAt = 0, pausedMs = 0;
  let pos = 1, target = 0, speed = 0, tol = 0, hits = 0, floorBase = 1;
  let stateT = 0, hitFrom = 0, missKind = 0;
  let lastT = 0, acceptAfter = 0, clock = 0;
  let gameId = '', gameStart = 0, durationMs = 0, maxFloor = 1;
  const diff = {};
  // bolsa de frases, guardada para que tampoco se repitan entre partidas
  const phraseState = { bag: [], last: -1 };
  try { Object.assign(phraseState, JSON.parse(store.get(KEY_PHRASES) || '{}')); } catch (e) { /* */ }
  // animación de la oficina AV
  const office = { floor: -1, t: 0, who: 0, lines: [''], active: false };
  let prevAvFloor = -1;
  // debug
  let fps = 60, fpsAcc = 0, fpsN = 0;

  // HUD: strings cacheados (solo se regeneran cuando cambia el valor)
  let hudHits = -1, hudHitsStr = '00', hudFloor = -1, hudFloorStr = '1';

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function startGame() {
    hits = 0; pos = 1; floorBase = 1;
    gameId = newGameId();
    gameStart = performance.now();
    pausedMs = 0;
    office.active = false; office.floor = -1; prevAvFloor = -1;
    saved = false; saving = false;
    hideScreens();
    startRound();
    acceptAfter = performance.now() + 150;
  }

  function startRound() {
    difficultyFor(hits, CONFIG, diff);
    speed = diff.speed;
    tol = diff.tolerance;
    const gap = diff.minGap + Math.floor(Math.random() * (diff.maxGap - diff.minGap + 1));
    target = floorBase + gap;
    state = 'moving';
    stateT = 0;
    sfx.humStart(speed);
  }

  function stopAt(t) {
    const now = performance.now();
    if (!(t > 0) || Math.abs(t - now) > 1000) t = now;
    if (t < acceptAfter) return;
    // posición exacta al momento del tap (entre frames)
    let dt = (t - lastT) / 1000;
    if (dt < -0.05) dt = -0.05;
    if (dt > 0.1) dt = 0.1;
    pos += speed * dt;
    const r = evaluateStop(pos, target, tol);
    if (r === HIT) onHit(); else onMiss(r);
  }

  function onHit() {
    hits++;
    state = 'hit';
    stateT = 0;
    hitFrom = pos;
    sfx.humStop();
    sfx.ding();
    prevAvFloor = office.floor;
    office.floor = target;
    office.t = 0;
    office.active = true;
    office.who = (hits - 1) % chars.length; // un personaje distinto por piso, en orden
    office.lines = wrapPhrase(PHRASES[nextPhrase(phraseState, PHRASES.length)], 14);
    store.set(KEY_PHRASES, JSON.stringify(phraseState));
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) { /* */ } }
  }

  function onMiss(kind) {
    state = 'miss';
    missKind = kind;
    stateT = 0;
    durationMs = performance.now() - gameStart - pausedMs;
    maxFloor = Math.max(1, Math.floor(pos));
    sfx.humStop();
    sfx.error();
  }

  function update(dt) {
    clock += dt;
    if (office.active) {
      office.t += dt;
      if (office.t > 2400) office.active = false;
    }
    if (state === 'moving') {
      pos += (speed * dt) / 1000;
      if (pos > target + tol + CONFIG.overshootLimit) onMiss(OVER);
    } else if (state === 'hit') {
      stateT += dt;
      pos = stateT < 150 ? hitFrom + (target - hitFrom) * (stateT / 150) : target;
      if (stateT >= CONFIG.roundTransitionMs) {
        pos = target;
        floorBase = target;
        startRound();
      }
    } else if (state === 'miss') {
      stateT += dt;
      if (stateT >= CONFIG.missRevealMs) showGameOver();
    }
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!lastT) lastT = t;
    let dt = t - lastT;
    lastT = t;
    if (dt > 100) dt = 100;
    if (dt < 0) dt = 0;
    if (!paused) update(dt);
    if (DEBUG) { fpsAcc += dt; fpsN++; if (fpsAcc >= 500) { fps = Math.round((fpsN * 1000) / fpsAcc); fpsAcc = 0; fpsN = 0; } }
    render();
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const FH = S.FH, SLAB = S.SLAB;

  function drawNumber(ctx, n, x, y, strip) {
    // dígitos 3×5, alineados a la derecha en x
    let cx = x;
    do {
      const d = n % 10;
      cx -= 4;
      ctx.drawImage(strip, d * 4, 0, 3, 5, cx, y, 3, 5);
      n = (n / 10) | 0;
    } while (n > 0);
  }

  function isAvFloor(n) {
    return n === target && state !== 'intro' || n === office.floor || n === prevAvFloor;
  }

  function render() {
    const ctx = bctx;
    const cx = W >> 1;
    const sl = cx - (S.SHAFT_W >> 1);
    const cam = Math.round(-pos * FH) - anchor;
    const glow = ((clock / 140) | 0) & 1;

    ctx.fillStyle = S.PAL.K;
    ctx.fillRect(0, 0, W, H);

    // pisos visibles
    const nMin = Math.max(1, Math.floor((SLAB - cam - H) / FH) - 1);
    const nMax = Math.ceil((SLAB - cam) / FH);
    for (let n = nMin; n <= nMax; n++) {
      const top = -(n + 1) * FH + SLAB - cam;
      const av = isAvFloor(n);
      let tpl;
      if (av) tpl = avTpl[glow];
      else if (n === 1) tpl = lobbyTpl;
      else tpl = floorTpl[S.floorHash(n) % floorTpl.length];
      ctx.drawImage(tpl, 0, top);
      // cartel con el número de piso
      ctx.fillStyle = av ? S.PAL.VD : S.PAL.C1;
      ctx.fillRect(sl - 16, top + 6, 13, 7);
      drawNumber(ctx, n, sl - 4, top + 7, digitsW);
      if (av) drawOffice(ctx, n, top);
    }

    // calle debajo del piso 1
    const ground = -FH + SLAB - cam;
    if (ground < H) {
      ctx.fillStyle = S.PAL.C3; ctx.fillRect(0, ground, W, 4);
      ctx.fillStyle = S.PAL.C1; ctx.fillRect(0, ground + 4, W, H - ground);
      ctx.fillStyle = S.PAL.Y;
      for (let x = 4; x < W; x += 16) ctx.fillRect(x, ground + 18, 8, 2);
    }

    // cables + cabina
    const cabTop = anchor - S.CAB_H;
    ctx.fillStyle = S.PAL.C2;
    ctx.fillRect(cx - 6, 0, 1, cabTop);
    ctx.fillRect(cx + 5, 0, 1, cabTop);
    let shake = 0;
    if (state === 'miss' && stateT < 320) shake = ((stateT / 40) | 0) & 1 ? 1 : -1;
    ctx.drawImage(cabin, cx - (S.CAB_W >> 1) + shake, cabTop);
    // cartel miradorTEC en la vereda del primer piso, adelante del ascensor
    const signY = ground - sign.canvas.height + 3;
    if (signY < H && signY + sign.canvas.height > 0) ctx.drawImage(sign.canvas, sign.x, signY);

    if (state === 'hit' && stateT < 140) {
      ctx.fillStyle = S.PAL.A;
      ctx.fillRect(cx - (S.CAB_W >> 1) - 2, cabTop - 2, S.CAB_W + 4, 2);
      ctx.fillRect(cx - (S.CAB_W >> 1) - 2, anchor, S.CAB_W + 4, 2);
      ctx.fillRect(cx - (S.CAB_W >> 1) - 2, cabTop, 2, S.CAB_H);
      ctx.fillRect(cx + (S.CAB_W >> 1), cabTop, 2, S.CAB_H);
    }
    if (state === 'hit' && stateT < 700) {
      ctx.fillStyle = S.PAL.A;
      ctx.fillText('+1', cx - 8, cabTop - 12 - ((stateT / 40) | 0));
    }
    if (state === 'miss') {
      // marcar dónde estaba el piso AV
      const ty = -target * FH - cam;
      if (((stateT / 120) | 0) & 1) {
        ctx.fillStyle = S.PAL.A;
        ctx.fillRect(sl - 6, ty - 1, S.SHAFT_W + 12, 2);
      }
    }

    if (office.active && office.t > 380 && office.t < 1750) drawBubble(ctx, office.floor, cam);

    if (state !== 'intro' && state !== 'over') drawHud(ctx);
    if (DEBUG) drawDebug(ctx, cam);

    sctx.drawImage(buffer, 0, 0, W, H, 0, 0, W * scale, H * scale);
  }

  function officeDoorOpen(t) {
    if (t < 180) return t / 180;
    if (t < 1900) return 1;
    if (t < 2080) return 1 - (t - 1900) / 180;
    return 0;
  }

  function charX(t, dx) {
    const inX = dx + 3, outX = dx - 14;
    if (t < 180) return inX;
    if (t < 380) return Math.round(inX + (outX - inX) * ((t - 180) / 200));
    if (t < 1700) return outX;
    if (t < 1900) return Math.round(outX + (inX - outX) * ((t - 1700) / 200));
    return inX;
  }

  function drawOffice(ctx, n, top) {
    const dx = S.avDoorX(W);
    const dy = top + FH - SLAB - S.AV_DOOR_H;
    const animating = office.active && office.floor === n;
    const t = animating ? office.t : 0;
    const open = animating ? officeDoorOpen(t) : 0;
    if (animating && t >= 180 && t < 1900) {
      const x = charX(t, dx);
      const set = chars[office.who];
      let img;
      if (t < 380 || t >= 1700) img = set.idle[((t / 90) | 0) & 1];
      else img = set.wave[((t / 160) | 0) & 1];
      ctx.drawImage(img, x, top + FH - SLAB - 24);
    }
    const pw = Math.round(S.AV_DOOR_W * (1 - open));
    if (pw > 0) ctx.drawImage(doorPanel, 0, 0, S.AV_DOOR_W, S.AV_DOOR_H, dx + S.AV_DOOR_W - pw, dy, pw, S.AV_DOOR_H);
  }

  function drawBubble(ctx, n, cam) {
    const lines = office.lines;
    const len = lines.length === 1 ? lines[0].length : Math.max(lines[0].length, lines[1].length);
    const bw = len * 8 + 8;
    const bh = lines.length * 10 + 6;
    const surface = -n * FH - cam;
    const x = charX(office.t, S.avDoorX(W));
    const headY = surface - 24;
    let bx = x + 8 - (bw >> 1);
    if (bx + bw > W - 2) bx = W - 2 - bw;
    if (bx < 2) bx = 2;
    const by = headY - bh - 5;
    ctx.fillStyle = S.PAL.K;
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = S.PAL.W;
    ctx.fillRect(bx, by, bw, bh);
    // colita
    const tx = x + 8;
    ctx.fillRect(tx - 2, by + bh, 5, 1);
    ctx.fillRect(tx - 1, by + bh + 1, 3, 1);
    ctx.fillRect(tx, by + bh + 2, 1, 2);
    ctx.fillStyle = S.PAL.K;
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], bx + 4, by + 4 + i * 10);
  }

  function drawHud(ctx) {
    if (hits !== hudHits) { hudHits = hits; hudHitsStr = pad2(hits); }
    const f = Math.max(1, Math.floor(pos + 1e-6));
    if (f !== hudFloor) { hudFloor = f; hudFloorStr = '' + f; }
    ctx.fillStyle = S.PAL.K;
    ctx.fillRect(0, 0, W, hudTop + 12);
    ctx.fillStyle = S.PAL.V;
    ctx.fillRect(0, hudTop + 12, W, 1);
    ctx.fillStyle = S.PAL.W;
    ctx.fillText('ACIERTOS:', 4, hudTop);
    ctx.fillStyle = S.PAL.Y;
    ctx.fillText(hudHitsStr, 4 + 80, hudTop);
    const fx = W - 4 - hudFloorStr.length * 8;
    ctx.fillStyle = S.PAL.Y;
    ctx.fillText(hudFloorStr, fx, hudTop);
    ctx.fillStyle = S.PAL.W;
    ctx.fillText('PISO:', fx - 44, hudTop);
  }

  function drawDebug(ctx, cam) {
    // banda de tolerancia en el hueco
    if (state === 'moving' || state === 'hit') {
      const cx = W >> 1;
      const y0 = Math.round(-(target + tol) * FH - cam);
      const y1 = Math.round(-(target - tol) * FH - cam);
      ctx.fillStyle = 'rgba(255,122,61,0.35)';
      ctx.fillRect(cx - 18, y0, 36, y1 - y0);
    }
    const y = H - 52;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, y - 2, 120, 50);
    ctx.fillStyle = S.PAL.Y;
    ctx.fillText('POS ' + pos.toFixed(2), 2, y);
    ctx.fillText('OBJ ' + target + ' +-' + tol.toFixed(2), 2, y + 10);
    ctx.fillText('VEL ' + speed.toFixed(2), 2, y + 20);
    ctx.fillText('DIF ' + (pos - target).toFixed(2), 2, y + 30);
    ctx.fillText('FPS ' + fps, 2, y + 40);
  }

  // ── Input ────────────────────────────────────────────────────────────────
  stage.addEventListener('pointerdown', (e) => {
    if (paused) {
      if (!coarseLandscape.matches) { e.preventDefault(); resumeGame(); }
      return;
    }
    if (state === 'moving') {
      e.preventDefault();
      stopAt(e.timeStamp);
    }
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.code === 'Space' || e.code === 'Enter') {
      if (paused) { resumeGame(); e.preventDefault(); return; }
      if (state === 'moving') { e.preventDefault(); stopAt(e.timeStamp); }
    }
  });

  // Cada toque despierta el audio si el navegador lo suspendió.
  ['pointerdown', 'touchend', 'click'].forEach((ev) => {
    document.addEventListener(ev, sfx.unlock, { capture: true, passive: true });
  });

  // Nada de zoom, menú contextual ni selección.
  ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach((ev) => {
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  });

  // ── Pausa ────────────────────────────────────────────────────────────────
  function pauseGame() {
    if (paused || (state !== 'moving' && state !== 'hit')) return;
    paused = true;
    pausedAt = performance.now();
    sfx.humStop();
    show('pause');
  }

  function resumeGame() {
    if (!paused || coarseLandscape.matches) return;
    paused = false;
    pausedMs += performance.now() - pausedAt;
    lastT = 0;
    acceptAfter = performance.now() + 250;
    $('pause').classList.remove('on');
    if (state === 'moving') sfx.humStart(speed);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseGame(); sfx.suspend(); } else { sfx.resume(); lastT = 0; }
  });
  window.addEventListener('blur', pauseGame);
  window.addEventListener('pagehide', pauseGame);

  // ── Pantallas HTML ───────────────────────────────────────────────────────
  const screens = ['intro', 'pause', 'over', 'rank'];

  function hideScreens() { screens.forEach((s) => $(s).classList.remove('on')); }

  function show(id) {
    screens.forEach((s) => $(s).classList.toggle('on', s === id));
    const el = $(id);
    el.scrollTop = 0;
    // evitar taps accidentales justo cuando aparece la pantalla
    el.classList.add('guard');
    setTimeout(() => el.classList.remove('guard'), 350);
  }

  // Íconos y logo pixel en el DOM
  const logo = S.logoCanvas();
  logo.className = 'logo';
  $('introLogo').replaceWith(logo);
  $('snd').appendChild(S.iconCanvas('soundOff'));

  $('play').addEventListener('click', () => { sfx.blip(); startGame(); });
  document.querySelectorAll('.again').forEach((b) => b.addEventListener('click', () => { sfx.blip(); startGame(); }));

  $('snd').addEventListener('pointerdown', (e) => e.stopPropagation());
  $('snd').addEventListener('click', (e) => {
    e.stopPropagation();
    const on = sfx.toggle();
    const btn = $('snd');
    btn.replaceChildren(S.iconCanvas(on ? 'soundOn' : 'soundOff'));
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Apagar sonido' : 'Prender sonido');
    if (on) { sfx.blip(); if (state === 'moving' && !paused) sfx.humStart(speed); }
  });

  // ── Game over ────────────────────────────────────────────────────────────
  let saving = false, saved = false, lastScore = 0;
  const nickInput = $('nick');
  nickInput.value = cleanNickname(store.get(KEY_NICK) || '');
  nickInput.addEventListener('input', () => {
    const v = cleanNickname(nickInput.value);
    if (v !== nickInput.value) nickInput.value = v;
    $('nickHint').hidden = true;
  });

  function showGameOver() {
    state = 'over';
    lastScore = hits;
    $('overTitle').textContent = missKind === OVER ? 'TE PASASTE' : 'TE QUEDASTE CORTO';
    $('overFloor').textContent = `Llegaste al piso ${maxFloor}`;
    $('overHits').textContent = `Aciertos: ${pad2(hits)}`;
    const best = parseInt(store.get(KEY_BEST) || '0', 10) || 0;
    const isRecord = hits > best && hits > 0;
    if (isRecord) store.set(KEY_BEST, String(hits));
    $('overRecord').hidden = !isRecord;
    $('saveErr').hidden = true;
    $('nickHint').hidden = true;
    $('saveBtn').textContent = 'GUARDAR Y VER RANKING';
    $('saveBtn').disabled = false;
    mountConsulta('overConsulta');
    show('over');
    if (isRecord) sfx.record(); else sfx.gameOver();
  }

  $('saveForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (saving) return;
    if (saved) { showRanking(); return; }
    const raw = cleanNickname(nickInput.value).trim();
    if (!raw) {
      $('nickHint').hidden = false;
      nickInput.focus();
      return;
    }
    nickInput.blur();
    store.set(KEY_NICK, raw);
    const nickname = moderateNickname(raw);
    saving = true;
    $('saveErr').hidden = true;
    $('saveBtn').textContent = 'GUARDANDO…';
    $('saveBtn').disabled = true;
    try {
      await submitScore({ gameId, nickname, score: lastScore, maxFloor, durationMs });
      saved = true;
      showRanking();
    } catch (err) {
      $('saveErr').hidden = false;
      $('saveBtn').textContent = 'REINTENTAR';
    } finally {
      saving = false;
      $('saveBtn').disabled = false;
    }
  });

  // ── Ranking ──────────────────────────────────────────────────────────────
  async function showRanking() {
    const list = $('rankList');
    list.replaceChildren();
    $('rankMe').hidden = true;
    $('rankState').textContent = 'CARGANDO…';
    $('rankState').hidden = false;
    $('rankRetry').hidden = true;
    mountConsulta('rankConsulta');
    show('rank');
    try {
      const data = await fetchRanking(gameId);
      renderRanking(list, data.top, data.me);
      $('rankState').hidden = true;
      if (data.me) {
        $('rankMe').textContent = `TU PUESTO: #${data.me.pos}`;
        $('rankMe').hidden = false;
      }
    } catch (err) {
      $('rankState').textContent = 'No pudimos cargar el ranking';
      $('rankRetry').hidden = false;
    }
  }
  $('rankRetry').addEventListener('click', showRanking);

  // ── Consulta gratis ──────────────────────────────────────────────────────
  const consulta = $('consulta');
  const cBtn = $('cBtn'), cPanel = $('cPanel'), cDone = $('cDone'), cAsked = $('cAsked');
  const cWa = $('cWa'), cName = $('cName'), cSend = $('cSend'), cErr = $('cErr');
  cBtn.prepend(S.iconCanvas('gift', true));
  cAsked.append(S.iconCanvas('check'));
  const doneChar = chars[0].wave.map((c) => { const k = c.cloneNode(); k.getContext('2d').drawImage(c, 0, 0); k.className = 'px-icon wave-char'; return k; });
  let doneTimer = 0, cSending = false;

  // El botón aparece desde consultaMinScore aciertos y no desaparece:
  // aunque ya la haya pedido, puede volver a abrirlo (la base no duplica el WhatsApp).
  function mountConsulta(containerId) {
    $(containerId).appendChild(consulta);
    consulta.hidden = lastScore < CONFIG.consultaMinScore;
    clearInterval(doneTimer);
    cDone.hidden = true;
    cPanel.hidden = true;
    cBtn.hidden = false;
    cAsked.hidden = !store.get(KEY_LEAD);
  }

  cBtn.addEventListener('click', () => {
    cBtn.hidden = true;
    cPanel.hidden = false;
    cErr.hidden = true;
    if (!cName.value) cName.value = cleanNickname(nickInput.value) || '';
    cSend.textContent = 'SOLICITAR';
  });
  $('cNo').addEventListener('click', () => { cPanel.hidden = true; cBtn.hidden = false; });

  cPanel.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cSending) return;
    if (!isValidWhatsapp(cWa.value)) {
      cErr.textContent = 'Revisá el número (mínimo 8 dígitos).';
      cErr.hidden = false;
      return;
    }
    cSending = true;
    cErr.hidden = true;
    cSend.textContent = 'ENVIANDO…';
    cSend.disabled = true;
    try {
      await submitLead({
        whatsapp: normalizeWhatsapp(cWa.value),
        nombre: cName.value.trim().slice(0, 40),
        nickname: cleanNickname(nickInput.value).trim() || null,
        score: lastScore,
      });
      store.set(KEY_LEAD, '1');
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      cPanel.hidden = true;
      cDone.hidden = false;
      cDone.querySelector('.wave-slot').replaceChildren(doneChar[0]);
      let f = 0;
      clearInterval(doneTimer);
      doneTimer = setInterval(() => {
        f ^= 1;
        cDone.querySelector('.wave-slot').replaceChildren(doneChar[f]);
      }, 200);
      sfx.ding();
      setTimeout(() => {
        clearInterval(doneTimer);
        cDone.hidden = true;
        cBtn.hidden = false;
        cAsked.hidden = false;
      }, 2600);
    } catch (err) {
      cErr.textContent = 'No pudimos enviarlo.';
      cErr.hidden = false;
      cSend.textContent = 'REINTENTAR';
    } finally {
      cSending = false;
      cSend.disabled = false;
    }
  });

  // ── Arranque ─────────────────────────────────────────────────────────────
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
  coarseLandscape.addEventListener && coarseLandscape.addEventListener('change', fit);
  fit();
  requestAnimationFrame(frame);
  window.__eavBooted = true;
  if (document.fonts && document.fonts.load) {
    document.fonts.load('8px PS2P').then(setFont).catch(() => {});
    document.fonts.ready.then(setFont).catch(() => {});
  }

  // exponer para pruebas manuales en la consola
  if (DEBUG) window.EAV = { get state() { return state; }, get pos() { return pos; }, get target() { return target; }, get tol() { return tol; }, get speed() { return speed; }, get hits() { return hits; }, stopAt, startGame };
}

export function renderRanking(list, top, me) {
  list.replaceChildren();
  if (!top.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Todavía no hay nadie. ¡Sé el #1!';
    list.appendChild(li);
    return;
  }
  for (const row of top) {
    const li = document.createElement('li');
    li.className = 'p' + row.pos + (me && me.nickname === row.nickname ? ' me' : '');
    const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = row.pos;
    const nick = document.createElement('span'); nick.className = 'nick'; nick.textContent = row.nickname;
    const sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = row.score;
    li.append(pos, nick, sc);
    list.appendChild(li);
  }
}
