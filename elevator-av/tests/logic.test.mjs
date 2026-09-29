import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, PHRASES } from '../public/config.js';
import {
  difficultyFor, evaluateStop, HIT, OVER, SHORT, minDurationMs, cleanNickname,
  moderateNickname, isBadNickname, normalizeWhatsapp, isValidWhatsapp, pickIndex, wrapPhrase, nextPhrase,
} from '../public/logic.js';

test('la primera ronda usa los valores iniciales', () => {
  const d = difficultyFor(0);
  assert.equal(d.speed, CONFIG.startSpeed);
  assert.equal(d.minGap, CONFIG.minGap);
  assert.equal(d.maxGap, CONFIG.maxGap);
  assert.equal(d.tolerance, CONFIG.hitTolerance);
});

test('la velocidad sube y respeta el tope', () => {
  let prev = 0;
  for (let r = 0; r < 200; r++) {
    const { speed } = difficultyFor(r);
    assert.ok(speed >= prev);
    assert.ok(speed <= CONFIG.maxSpeed);
    prev = speed;
  }
  assert.equal(difficultyFor(100).speed, CONFIG.maxSpeed);
});

test('los gaps crecen cada gapGrowthEvery y no pasan de 10', () => {
  assert.equal(difficultyFor(4).minGap, 3);
  assert.equal(difficultyFor(5).minGap, 4);
  assert.equal(difficultyFor(5).maxGap, 7);
  for (let r = 0; r < 200; r++) {
    const d = difficultyFor(r);
    assert.ok(d.maxGap <= 10 && d.minGap <= d.maxGap);
  }
});

test('la tolerancia baja poco y nunca pasa el mínimo', () => {
  assert.ok(difficultyFor(10).tolerance < CONFIG.hitTolerance);
  assert.equal(difficultyFor(150).tolerance, CONFIG.minHitTolerance);
  // la velocidad escala más que la tolerancia
  const s = difficultyFor(20).speed / difficultyFor(0).speed;
  const t = difficultyFor(0).tolerance / difficultyFor(20).tolerance;
  assert.ok(s > t * 2);
});

test('evaluateStop distingue acierto, pasarse y quedarse corto', () => {
  assert.equal(evaluateStop(12, 12, 0.3), HIT);
  assert.equal(evaluateStop(12.3, 12, 0.3), HIT);
  assert.equal(evaluateStop(11.7, 12, 0.3), HIT);
  assert.equal(evaluateStop(12.31, 12, 0.3), OVER);
  assert.equal(evaluateStop(11.69, 12, 0.3), SHORT);
});

test('duración mínima crece con el score', () => {
  assert.equal(minDurationMs(0), 0);
  assert.ok(minDurationMs(1) > 1000);
  assert.ok(minDurationMs(20) > minDurationMs(10));
});

test('nicknames: caracteres, largo y mayúsculas', () => {
  assert.equal(cleanNickname('  ñandú<script>'), 'ÑANDÚSCRIPT');
  assert.equal(cleanNickname('abcdefghijklmnop'), 'ABCDEFGHIJKL');
  assert.equal(cleanNickname('Juan  Pérez!!'), 'JUAN PÉREZ');
});

test('nicknames: filtro de malas palabras', () => {
  assert.ok(isBadNickname('PUT0 AMO'));
  assert.ok(isBadNickname('el pelotudo'));
  assert.ok(isBadNickname('HDP'));
  assert.ok(!isBadNickname('GILBERTO'));
  assert.ok(!isBadNickname('MARTINA'));
  assert.match(moderateNickname('forrO'), /^JUGADOR\d{4}$/);
  assert.match(moderateNickname(''), /^JUGADOR\d{4}$/);
  assert.equal(moderateNickname('Sofi'), 'SOFI');
});

test('whatsapp: normaliza y valida', () => {
  assert.equal(normalizeWhatsapp('+54 9 11-2345-6789'), '+5491123456789');
  assert.ok(isValidWhatsapp('+54 9 11-2345-6789'));
  assert.ok(isValidWhatsapp('11 2345 6789'));
  assert.ok(!isValidWhatsapp('+54 123'));
  assert.ok(!isValidWhatsapp('+54 9 11 2345 6789 12345'));
});

test('frases: no repite la anterior', () => {
  for (let prev = 0; prev < 15; prev++) {
    for (let k = 0; k < 50; k++) assert.notEqual(pickIndex(15, prev), prev);
  }
});

test('frases: todas entran en 2 líneas de 14 caracteres', () => {
  for (const p of PHRASES) {
    const lines = wrapPhrase(p, 14);
    assert.ok(lines.length <= 2);
    for (const l of lines) assert.ok(l.length <= 14, p);
  }
});

test('sprites: todas las filas tienen el mismo ancho', async () => {
  const S = await import('../public/sprites.js');
  const check = (name, rows, w) => rows.forEach((r, i) => assert.equal(r.length, w ?? rows[0].length, `${name} fila ${i}`));
  for (const k of ['idle', 'wave']) S.CHAR_FRAMES[k].forEach((f, i) => { assert.equal(f.length, 24); check(`${k}${i}`, f, 16); });
  check('logo18', S.LOGO_18, 18);
  check('logo32', S.LOGO_32, 32);
  for (const k in S.ICONS) check(k, S.ICONS[k]);
});

test('frases: salen todas antes de repetir y nunca dos iguales seguidas', () => {
  const st = {};
  let prev = -1;
  for (let round = 0; round < 50; round++) {
    const seen = new Set();
    for (let k = 0; k < 15; k++) {
      const i = nextPhrase(st, 15);
      assert.notEqual(i, prev);
      assert.ok(!seen.has(i));
      seen.add(i);
      prev = i;
    }
    assert.equal(seen.size, 15);
  }
});

test('frases: la bolsa guardada sobrevive a datos viejos o rotos', () => {
  const st = { bag: [3, 99, 'x', -1], last: 5 };
  assert.equal(nextPhrase(st, 15), 3);
  assert.ok(nextPhrase(st, 15) !== 3);
});
