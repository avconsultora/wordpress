// Aviso si el juego no arranca (archivos mezclados de versiones distintas, red caída).
// Va en un archivo aparte (no inline) para que la política de seguridad (CSP) pueda prohibir scripts inline.
(function () {
  var errs = [];
  window.addEventListener('error', function (e) {
    errs.push(e.message || ((e.target && (e.target.src || e.target.href)) || 'error de carga'));
  }, true);
  setTimeout(function () {
    if (window.__eavBooted) return;
    var d = document.createElement('div');
    d.id = 'bootFail';
    d.style.cssText = 'position:fixed;inset:0;z-index:99;display:flex;flex-direction:column;gap:18px;align-items:center;justify-content:center;padding:24px;text-align:center;background:#0b0a10;color:#f2ead8;font:12px/1.8 PS2P,monospace';
    d.innerHTML = '<p>No se pudo cargar el juego.</p><button style="font:inherit;font-size:14px;padding:16px 24px;border:0;background:#f6c945;color:#0b0a10">RECARGAR</button><p style="font-size:8px;color:#77747f;max-width:320px;word-break:break-word"></p>';
    d.querySelector('button').onclick = function () { location.reload(); };
    d.lastChild.textContent = errs.slice(0, 2).join(' · ');
    document.body.appendChild(d);
  }, 6000);
})();
