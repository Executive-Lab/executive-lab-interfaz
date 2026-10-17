// «Volver a la última conversación» (decisión 191).
//
// La documentación de Claude Code (code.claude.com/docs/en/vs-code, «Launch a VS
// Code tab from other tools») dice que `vscode://anthropic.claude-code/open?session=<id>`
// abre esa conversación si es del espacio de trabajo abierto, y que si no la
// encuentra empieza una nueva. Y de dónde sale el id, documentado, es del
// `session_id` que reciben los enganches (code.claude.com/docs/en/hooks).
//
// El enganche de avisos (`avisar.mjs`, decisión 162) ya corre en las carpetas de la
// barra y lo recibe. Apunta solo el id y la hora, nunca nada de la conversación, en
// `.rsc/executive-lab-ultima-conversacion.json`. Aquí se lee y se arma el enlace.
//
// No se mira `~/.claude/projects/…`: ese formato no está documentado.
//
// Lo que se lee lo escribió otro proceso, y acaba en un enlace: el id solo vale si
// son letras, números, `-` y `_`, de 6 a 64. Con otra cosa, como si no hubiera.

const fs = require('node:fs');
const path = require('node:path');

const FICHERO = ['.rsc', 'executive-lab-ultima-conversacion.json'];
const ID = /^[A-Za-z0-9_-]{6,64}$/;
const TOPE = 4096;
const EXTENSION = 'anthropic.claude-code';

// { id, cuando } o null. Un fichero de verdad (sin enlaces) y pequeño.
function laUltima(raiz) {
  try {
    const completa = path.join(raiz, ...FICHERO);
    const info = fs.lstatSync(completa);
    if (!info.isFile() || info.size > TOPE) return null;
    const datos = JSON.parse(fs.readFileSync(completa, 'utf8'));
    if (!datos || typeof datos.id !== 'string' || !ID.test(datos.id)) return null;
    const cuando = typeof datos.cuando === 'string' && !Number.isNaN(Date.parse(datos.cuando)) ? datos.cuando : null;
    return { id: datos.id, cuando };
  } catch {
    return null;
  }
}

// El enlace que documenta Claude Code. `esquema` es el del editor (`vscode`, o el de
// su variante); null si el id no sirve.
function elEnlace(id, esquema = 'vscode') {
  if (typeof id !== 'string' || !ID.test(id)) return null;
  const como = typeof esquema === 'string' && /^[a-z][a-z0-9-]{0,30}$/.test(esquema) ? esquema : 'vscode';
  return `${como}://${EXTENSION}/open?session=${encodeURIComponent(id)}`;
}

module.exports = { laUltima, elEnlace, FICHERO, ID };
