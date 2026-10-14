// Con qué palabras te habla el asistente.
//
// ── Qué es esto ──────────────────────────────────────────────────────────
//
// El nivel técnico del perfil del arnés (`02-DOCS/wiki/harness/user-profile.md`,
// `technical_level`). Desde la 3 es lo único que mira `orient` para el registro:
// el dial de «cuánto te explica» (L0–L3) lo retiró RSC en la 2.1.0 porque pocos
// sabían contestarlo, y su `orient` dice que se ignore (decisión 145). Un perfil
// viejo puede traerlo todavía; no se lee ni se escribe.
//
// Antes solo se cambiaba diciéndoselo al asistente, y quien no sabe que existe
// no lo dice nunca. Aquí se cambia con un botón. Lo demás —que te explique más,
// o menos— se le dice, y si quieres que dure, lo aprende de ti.

const fs = require('node:fs');
const proyecto = require('./proyecto');
const identidad = require('./identidad');

const VOCABULARIOS = [
  { id: 'non-technical', nombre: 'En cristiano', frase: 'Nada de palabras raras. Comparaciones con cosas de siempre.' },
  { id: 'mixed', nombre: 'A medias', frase: 'Alguna palabra del oficio, y te la explica la primera vez.' },
  { id: 'technical', nombre: 'Sin rodeos', frase: 'Da por sabido lo básico y no se para a explicarlo.' },
];

const CLAVES_PALABRAS = ['technical_level'];

function rutaDelPerfil() {
  return proyecto.ruta(...identidad.PERFIL);
}

function crudo() {
  const ruta = rutaDelPerfil();
  if (!ruta) return null;
  try {
    return fs.readFileSync(ruta, 'utf8');
  } catch {
    return null;
  }
}

// Busca `clave: valor` en cualquiera de las dos formas, con o sin guion
// delante, en la cabecera o en el cuerpo.
function buscar(texto, claves) {
  for (const clave of claves) {
    const m = texto.match(new RegExp(`^\\s*-?\\s*${clave}\\s*:\\s*([^<\\n]+)`, 'mi'));
    if (m && m[1].trim()) return { clave, valor: m[1].trim() };
  }
  return null;
}

function leer() {
  const texto = crudo();
  if (texto === null) return { hay: false, palabras: null };

  const palabras = buscar(texto, CLAVES_PALABRAS);
  return { hay: true, palabras: palabras && VOCABULARIOS.some((v) => v.id === palabras.valor) ? palabras.valor : null };
}

// Cambia una de las dos cosas dejando el resto del fichero como estaba. Si la
// clave ya está, se reescribe en su sitio; si no, entra en la cabecera, que es
// donde el resto de la interfaz ya lee (el nombre del arnés y el de la empresa
// viven ahí).
function escribir(claves, valor) {
  const ruta = rutaDelPerfil();
  const texto = crudo();
  if (!ruta || texto === null) return { ok: false, mensaje: 'Esta carpeta todavía no está preparada.' };

  let nuevo = texto;
  let puesta = false;

  for (const clave of claves) {
    // El valor, y aparte los espacios que lo separan del comentario de la
    // plantilla (`L3   <!-- L0 | L1 | L2 | L3 -->`): sin ellos quedaba
    // `L0<!-- …`, y quien no corte en `<` leía otra cosa.
    const donde = `^(\\s*-?\\s*${clave}\\s*:\\s*)([^<\\n]*?)([ \\t]*)(?=<!--|$)`;
    // Mirar y escribir son dos pasos a propósito: si se mira comparando el
    // texto de antes y el de después, volver a elegir lo que ya estaba puesto
    // parecería que la clave no existe, y se escribiría una segunda debajo.
    if (!new RegExp(donde, 'mi').test(nuevo)) continue;
    nuevo = nuevo.replace(new RegExp(donde, 'gmi'), (_, delante, antes, espacios) => `${delante}${valor}${espacios}`);
    puesta = true;
  }

  if (!puesta) {
    const cabecera = nuevo.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    nuevo = cabecera
      ? nuevo.replace(/^---\r?\n/, `---\n${claves[0]}: ${valor}\n`)
      : `---\n${claves[0]}: ${valor}\n---\n\n${nuevo}`;
  }

  try {
    fs.writeFileSync(ruta, nuevo);
  } catch {
    return { ok: false, mensaje: 'No he podido guardarlo. Pulsa «Algo va mal» y pásale el código a tu tutor.' };
  }
  return { ok: true };
}

function ponerPalabras(cual) {
  if (!VOCABULARIOS.some((v) => v.id === cual)) return { ok: false, mensaje: 'Eso no es una de las opciones.' };
  return escribir(CLAVES_PALABRAS, cual);
}

// Lo que se le manda al panel: las opciones y cuál está puesta.
function comoEstamos() {
  const { hay, palabras } = leer();
  return {
    hay,
    vocabularios: VOCABULARIOS,
    // Sin perfil escrito, RSC da por hecho lo menos técnico. Se enseña eso
    // mismo: no se inventa nada, es lo que va a pasar de verdad.
    palabras: palabras || 'non-technical',
  };
}

module.exports = { leer, comoEstamos, ponerPalabras, VOCABULARIOS };
