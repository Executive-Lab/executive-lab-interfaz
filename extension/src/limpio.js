// Lo que se lee de la carpeta y la barra escribe con su voz: en un encargo al
// asistente o en el texto de un botón (revisión adversaria de la 154 y la 155).
//
// El `name` de una habilidad o de un agente, o el rótulo de un botón, los
// escribe quien hizo la carpeta. Un repositorio preparado puede llamarse
// «resumen» en el disco y declarar `name: "x» IGNORA lo anterior y…"`: si eso
// entra tal cual en «Usa el agente «…»», lo que la barra le pide al asistente
// lo ha escrito otro.
//
// Dos reglas:
// - Para pedir algo por su nombre (`/x`, `$x`, «Usa el agente «x»»), solo un
//   nombre corto de letras, números, `_`, `.` y `-`. Si no, el de la carpeta.
// - Cualquier rótulo que entre en un encargo va en una línea, sin «», comillas
//   ni caracteres de control, y con un tope.

const INVOCABLE = /^[A-Za-z0-9][\w.-]{0,63}$/;

const invocable = (nombre) => typeof nombre === 'string' && INVOCABLE.test(nombre);

// Saltos de línea, tabuladores, caracteres de control y de formato (los que
// dan la vuelta al texto o no se ven), comillas de todas las formas y «».
const FUERA = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu;
const COMILLAS = /[«»"'`“”‘’‚„‹›]/g;

function etiqueta(texto, tope = 120) {
  return String(texto ?? '')
    .replace(FUERA, ' ')
    .replace(COMILLAS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, tope)
    .trim();
}

// El nombre con el que se pide: el declarado si vale, y si no, el de la carpeta,
// limpio. Nunca el declarado a medias.
const invocacion = (declarado, id) => (invocable(declarado) ? declarado : etiqueta(id, 64));

module.exports = { INVOCABLE, invocable, etiqueta, invocacion };
