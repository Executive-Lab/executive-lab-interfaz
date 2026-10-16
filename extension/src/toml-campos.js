// Las cadenas de la cabecera de un agente TOML. No interpreta configuración:
// lee name/description sin confundir las instrucciones ni las tablas con ella.
// Conserva las posiciones para renombrar solo el name, sin reescribir el cuerpo.
//
// Todo valor se consume entero, sea cual sea: una cadena de varias líneas, y
// también un array o una tabla en línea, que pueden llevar cadenas de varias
// líneas dentro (`tags = ["""\nname = "falso"\n"""]`). Si no, lo de dentro se
// leía como campos de la raíz, y se renombraba el agente equivocado (revisión
// adversaria de la 154). Lo que no se sabe dónde acaba deja el fichero por no
// fiable: sin campos, y sin renombrar nada.
const { TOPE } = require('./frontmatter');

const ESCAPES = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r', '"': '"', '\\': '\\' };
// Una clave: suelta, entre comillas, o con puntos. Solo la suelta cuenta como
// campo; las demás se consumen igual.
const CLAVE = /^[ \t]*((?:[A-Za-z0-9_-]+|"(?:[^"\\\n]|\\.)*"|'[^'\n]*')(?:[ \t]*\.[ \t]*(?:[A-Za-z0-9_-]+|"(?:[^"\\\n]|\\.)*"|'[^'\n]*'))*)[ \t]*=[ \t]*/;
const SUELTA = /^[A-Za-z_][\w-]*$/;

// Una cadena que empieza en `i`: su valor, dónde acaba y si vale. `null` si no
// se cierra: no se sabe dónde acaba.
function cadena(texto, i) {
  const comilla = texto[i];
  const triple = texto.slice(i, i + 3) === comilla.repeat(3);
  const cierre = comilla.repeat(triple ? 3 : 1);
  i += cierre.length;
  let valor = '';
  let valida = true;
  if (triple && texto.slice(i, i + 2) === '\r\n') i += 2;
  else if (triple && texto[i] === '\n') i += 1;
  while (i < texto.length) {
    if (texto.startsWith(cierre, i)) {
      // Hasta dos comillas pegadas al cierre son del valor (`""""` acaba en una).
      let fin = i + cierre.length;
      if (triple) while (texto[fin] === comilla && fin - i < 5) fin += 1;
      return { valor: valor + comilla.repeat(fin - i - cierre.length), fin, valida };
    }
    const c = texto[i++];
    if (!triple && /[\r\n]/.test(c)) return null;
    if (comilla === '"' && c === '\\') {
      if (triple && /^[ \t]*\r?\n/.test(texto.slice(i))) {
        i += texto.slice(i).match(/^\s*/)[0].length;
        continue;
      }
      const escapado = texto[i++];
      if (Object.hasOwn(ESCAPES, escapado)) valor += ESCAPES[escapado];
      else if (escapado === 'u' || escapado === 'U') {
        const n = escapado === 'u' ? 4 : 8;
        const hex = texto.slice(i, i + n);
        const codigo = Number.parseInt(hex, 16);
        if (hex.length !== n || !/^[\da-f]+$/i.test(hex) || codigo > 0x10ffff || (codigo >= 0xd800 && codigo <= 0xdfff)) valida = false;
        else valor += String.fromCodePoint(codigo);
        i += n;
      } else valida = false;
    } else valor += c;
  }
  return null;
}

// Un array o una tabla en línea que empieza en `i`: dónde acaba, o -1. Las
// cadenas de dentro se saltan enteras, y los comentarios también.
function anidado(texto, i) {
  let profundidad = 0;
  while (i < texto.length) {
    const c = texto[i];
    if (c === '#') {
      const salto = texto.indexOf('\n', i);
      i = salto < 0 ? texto.length : salto;
      continue;
    }
    if (c === '"' || c === "'") {
      const leida = cadena(texto, i);
      if (!leida) return -1;
      i = leida.fin;
      continue;
    }
    if (c === '[' || c === '{') profundidad += 1;
    else if (c === ']' || c === '}') {
      profundidad -= 1;
      if (profundidad === 0) return i + 1;
    }
    i += 1;
  }
  return -1;
}

const finDeLinea = (texto, i) => {
  const fin = texto.indexOf('\n', i);
  return fin < 0 ? texto.length : fin;
};

// Los campos raíz que son cadenas, con dónde está cada valor; o null si el
// fichero no es fiable.
function cadenas(textoEntero) {
  const texto = String(textoEntero || '').slice(0, TOPE);
  const campos = {};
  let i = 0;
  while (i < texto.length) {
    const linea = texto.slice(i, finDeLinea(texto, i));
    if (/^\s*\[/.test(linea)) break; // desde una tabla ya no son campos raíz
    const clave = linea.match(CLAVE);
    if (!clave) {
      // Una cadena de varias líneas que no es el valor de nadie: no se sabe
      // qué es lo de dentro.
      if (/"""|'''/.test(linea.replace(/#.*$/, ''))) return null;
      i = finDeLinea(texto, i) + 1;
      continue;
    }
    i += clave[0].length;
    const desde = i;
    const primera = texto[i];
    if (primera === '"' || primera === "'") {
      const leida = cadena(texto, i);
      if (!leida) return null;
      i = leida.fin;
      const resto = texto.slice(i, finDeLinea(texto, i));
      if (leida.valida && SUELTA.test(clave[1]) && /^[ \t\r]*(?:#.*)?$/.test(resto)) {
        campos[clave[1]] = { valor: leida.valor, desde, hasta: i };
      }
    } else if (primera === '[' || primera === '{') {
      const fin = anidado(texto, i);
      if (fin < 0) return null;
      i = fin;
    }
    // Lo que quede de la línea (un número, una fecha, un comentario), fuera.
    i = finDeLinea(texto, i) + 1;
  }
  return campos;
}

const leer = (texto) => Object.fromEntries(Object.entries(cadenas(texto) || {}).map(([k, v]) => [k, v.valor]));
function renombrar(texto, nombre) {
  const campo = (cadenas(texto) || {}).name;
  if (!campo) throw new Error('El agente no tiene un name válido.');
  return texto.slice(0, campo.desde) + JSON.stringify(nombre) + texto.slice(campo.hasta);
}

module.exports = { leer, renombrar };
