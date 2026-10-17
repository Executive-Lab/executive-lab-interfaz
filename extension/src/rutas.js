// Comparar rutas sin equivocarse en Windows (decisión 189).
//
// Comparar rutas «por texto» (`startsWith(base + path.sep)`) falla en Windows de
// dos maneras: `C:\Users\Ana` y `c:\users\ana` son el mismo sitio, y VS Code
// entrega la unidad en minúscula mientras el sistema la da en mayúscula. Aquí
// está lo común: se compara con `path.relative`, que en Windows no distingue
// mayúsculas, y la plataforma se puede pasar para probarlo desde cualquier sitio.
const fs = require('fs');
const path = require('path');

const deLa = (plataforma) => (plataforma === 'win32' ? path.win32 : path.posix);

// El sitio real de una ruta, con los enlaces resueltos y, en Windows, con las
// mayúsculas que tiene en el disco. Si no se puede resolver, la ruta tal cual.
function sitioReal(ruta) {
  try {
    return (fs.realpathSync.native || fs.realpathSync)(ruta);
  } catch {
    return ruta;
  }
}

// ¿`ruta` cae dentro de `base`, sin ser la propia `base`? Solo texto: no mira el disco.
function estaDentro(base, ruta, plataforma = process.platform) {
  if (typeof base !== 'string' || typeof ruta !== 'string' || !base || !ruta) return false;
  const p = deLa(plataforma);
  const relativa = p.relative(p.resolve(base), p.resolve(ruta));
  return relativa !== '' && relativa !== '..' && !relativa.startsWith(`..${p.sep}`) && !p.isAbsolute(relativa);
}

// ¿Son la misma ruta? En Windows, sin distinguir mayúsculas.
function mismoSitio(a, b, plataforma = process.platform) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const p = deLa(plataforma);
  return p.relative(p.resolve(a), p.resolve(b)) === '';
}

module.exports = { estaDentro, mismoSitio, sitioReal };
