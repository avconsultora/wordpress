// Vista de pantalla grande (?display=1): ranking + QR, se actualiza sola.
import { GAME_URL, DISPLAY_REFRESH_MS } from './config.js?v=8';
import { fetchRanking } from './ranking.js?v=8';
import { qrCanvas } from './qr.js?v=8';
import * as S from './sprites.js?v=8';
import { renderRanking } from './game.js?v=8';

const $ = (id) => document.getElementById(id);

document.body.classList.add('display-mode');
$('display').hidden = false;

const logo = S.logoCanvas();
logo.className = 'logo';
$('dLogo').replaceWith(logo);

const qr = qrCanvas(GAME_URL, 8);
qr.className = 'qr';
$('dQr').replaceWith(qr);

// personaje saludando al lado del QR
const chars = S.officeCharacters();
const slot = $('dChar');
let f = 0, who = 0;
setInterval(() => {
  f = (f + 1) % 8;
  if (f === 0) who = (who + 1) % chars.length;
  const set = chars[who];
  const img = f < 4 ? set.wave[f & 1] : set.idle[(f >> 1) & 1];
  slot.replaceChildren(img);
}, 220);

async function refresh() {
  try {
    const data = await fetchRanking(null);
    renderRanking($('dList'), data.top, null);
    $('dStatus').hidden = true;
  } catch (e) {
    $('dStatus').hidden = false;
  }
}

refresh();
setInterval(refresh, DISPLAY_REFRESH_MS);
window.__eavBooted = true;
