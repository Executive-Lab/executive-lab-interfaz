// Escribir en un settings.json de VS Code sin pisar lo que ya hubiera.
//
// Vive aquí, en comun/, porque lo usan los dos instaladores: el de Windows por
// medio de preparar.js y el de macOS directamente, antes incluso de que exista
// una carpeta de trabajo.
//
// Quien llama pasa `anotar` para que la explicación acabe en su registro: aquí
// no se imprime nada, que esto corre mientras el alumno mira una barra.

const fs = require('node:fs');
const path = require('node:path');

// ── Leer como lo lee el editor ────────────────────────────────────────────
//
// El settings.json admite comentarios, comas al final y la marca que deja el
// Bloc de notas delante (BOM). Para leerlo se quitan las tres cosas, fuera de
// las cadenas. Si ni asi se entiende, devuelve null: no se toca.
function leerJsonc(crudo) {
  const texto = String(crudo).replace(/^\uFEFF/, '');
  if (!texto.trim()) return {};
  let sin = '';
  let dentro = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (dentro) {
      sin += c;
      if (c === '\\') { sin += texto[i + 1] || ''; i += 1; } else if (c === '"') dentro = false;
    } else if (c === '"') {
      dentro = true;
      sin += c;
    } else if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i += 1;
      sin += '\n';
    } else if (c === '/' && texto[i + 1] === '*') {
      const fin = texto.indexOf('*/', i + 2);
      if (fin === -1) return null;
      i = fin + 1;
      sin += ' ';
    } else sin += c;
  }
  // Las comas que se quedan delante de un cierre, fuera de las cadenas.
  let limpio = '';
  dentro = false;
  for (let i = 0; i < sin.length; i += 1) {
    const c = sin[i];
    if (dentro) {
      limpio += c;
      if (c === '\\') { limpio += sin[i + 1] || ''; i += 1; } else if (c === '"') dentro = false;
    } else if (c === '"') {
      dentro = true;
      limpio += c;
    } else if (c === ',' && /^\s*[}\]]/.test(sin.slice(i + 1))) {
      // se salta
    } else limpio += c;
  }
  try {
    const datos = JSON.parse(limpio);
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : null;
  } catch {
    return null;
  }
}

// Donde se cierra el objeto de fuera, y el ultimo caracter de codigo antes de
// ese cierre. Con el mismo cuidado: lo que hay dentro de una cadena o de un
// comentario no cuenta. Buscarlo a ojo, con el ultimo `}` del texto, metia las
// claves dentro de un comentario del final (revision de la 163).
function elCierre(texto) {
  let profundidad = 0;
  let ultimo = -1;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (c === '"') {
      i += 1;
      while (i < texto.length && texto[i] !== '"') i += texto[i] === '\\' ? 2 : 1;
      if (i >= texto.length) return null;
      ultimo = i;
    } else if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i += 1;
    } else if (c === '/' && texto[i + 1] === '*') {
      const fin = texto.indexOf('*/', i + 2);
      if (fin === -1) return null;
      i = fin + 1;
    } else if (/\s/.test(c) || c === '\uFEFF') {
      // nada
    } else if (c === '{' || c === '[') {
      if (profundidad === 0 && c !== '{') return null;
      profundidad += 1;
      ultimo = i;
    } else if (c === '}' || c === ']') {
      profundidad -= 1;
      if (profundidad === 0) return { cierre: i, ultimo };
      if (profundidad < 0) return null;
      ultimo = i;
    } else {
      if (profundidad === 0) return null;
      ultimo = i;
    }
  }
  return null;
}

const esEnlace = (ruta) => {
  try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; }
};

// Entero o nada: se escribe al lado y se cambia de golpe, con los permisos que
// tenia. A traves de un enlace no se escribe: quien llama lo mira antes, y aqui
// el cambio de golpe sustituiria el enlace, no lo que hay al otro lado.
function escribirEntero(fichero, texto) {
  const temporal = `${fichero}.executive-lab-${process.pid}`;
  fs.writeFileSync(temporal, texto);
  try {
    fs.chmodSync(temporal, fs.lstatSync(fichero).mode);
  } catch { /* no habia fichero */ }
  fs.renameSync(temporal, fichero);
}

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Lo escrito se lee como el editor y dice lo que tenia que decir: lo suyo como
// estaba y lo nuestro con su valor. Si no, no se escribe.
function sigueBien(texto, antes, nuevos) {
  const despues = leerJsonc(texto);
  if (!despues) return false;
  for (const [c, v] of Object.entries(antes || {})) if (!igual(despues[c], v)) return false;
  for (const [c, v] of Object.entries(nuevos)) if (!igual(despues[c], v)) return false;
  return true;
}

// Escribe sin pisar lo que ya hubiera.
//
// Si se reparsea y se reescribe, se le cargan los comentarios. Asi que cuando
// no es JSON puro se insertan las claves como texto, justo antes de la llave
// que cierra el objeto: entra lo nuestro y lo suyo queda intacto, comentarios
// incluidos.
//
// Con JSON puro, una clave que ya estuviera se cambia: quien no quiera pisar
// nada pasa solo las que faltan, como hace `ajustes-del-editor.js`.
//
// Devuelve que ha hecho y que claves ha escrito, para que quien llama pueda
// dejar constancia de lo que puso y no de lo que quiso poner (decision 163).
// Lo que no sale bien (`ilegible`, `enlace`) no escribe nada.
function escribirAjustes(fichero, nuevos, donde, anotar = () => {}) {
  const claves = Object.keys(nuevos);
  if (!claves.length) return { hecho: 'nada', claves: [] };

  if (esEnlace(fichero)) {
    anotar(`AVISO: ${donde} son un enlace a otro sitio; no los toco.`);
    return { hecho: 'enlace', claves: [] };
  }
  fs.mkdirSync(path.dirname(fichero), { recursive: true });

  // Un fichero vacio es como no tenerlo: el editor lo da por bueno.
  const crudo = fs.existsSync(fichero) ? fs.readFileSync(fichero, 'utf8') : '';
  if (!crudo.replace(/^\uFEFF/, '').trim()) {
    escribirEntero(fichero, `${JSON.stringify(nuevos, null, 2)}\n`);
    anotar(`${claves.length} ajustes en ${donde} (nuevo)`);
    return { hecho: 'nuevo', claves };
  }

  const actuales = leerJsonc(crudo);
  if (!actuales) {
    anotar(`AVISO: no entiendo ${donde}; no lo toco.`);
    return { hecho: 'ilegible', claves: [] };
  }

  // Camino limpio: JSON de verdad.
  try {
    const puros = JSON.parse(crudo);
    const texto = `${JSON.stringify({ ...puros, ...nuevos }, null, 2)}\n`;
    if (!sigueBien(texto, {}, nuevos)) throw new Error('no cuadra');
    escribirEntero(fichero, texto);
    anotar(`${claves.length} ajustes en ${donde}`);
    return { hecho: 'escrito', claves };
  } catch {
    /* tiene comentarios, comas al final o la marca: se inserta a mano */
  }

  // Las que ya estan no se tocan: no vamos a duplicar una clave ni a pisar lo
  // que esa persona haya puesto a proposito. Una comentada no esta.
  const faltan = claves.filter((c) => !Object.prototype.hasOwnProperty.call(actuales, c));
  if (!faltan.length) {
    anotar(`${donde}: ya estaban puestas`);
    return { hecho: 'yaEstaban', claves: [] };
  }

  const lugar = elCierre(crudo);
  if (!lugar) {
    anotar(`AVISO: no encuentro dónde acaba ${donde}; no lo toco.`);
    return { hecho: 'ilegible', claves: [] };
  }

  // La coma va justo detrás de lo último que hay, antes de su comentario si lo
  // tiene; si lo último es la llave que abre o ya hay coma, no hace falta.
  const { cierre, ultimo } = lugar;
  const coma = crudo[ultimo] === '{' || crudo[ultimo] === ',' ? '' : ',';
  const antes = `${crudo.slice(0, ultimo + 1)}${coma}${crudo.slice(ultimo + 1, cierre).replace(/\s*$/, '')}`;
  const lineas = faltan.map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(nuevos[c])}`).join(',\n');
  const texto = `${antes}\n${lineas}\n${crudo.slice(cierre)}`;

  const puestas = Object.fromEntries(faltan.map((c) => [c, nuevos[c]]));
  if (!sigueBien(texto, actuales, puestas)) {
    anotar(`AVISO: lo que quedaría en ${donde} no se lee bien; no lo toco.`);
    return { hecho: 'ilegible', claves: [] };
  }

  fs.copyFileSync(fichero, `${fichero}.antes-de-executive-lab`);
  escribirEntero(fichero, texto);
  anotar(`${faltan.length} ajustes insertados en ${donde} (tiene comentarios: copia al lado)`);
  return { hecho: 'insertado', claves: faltan };
}

module.exports = { escribirAjustes, leerJsonc, elCierre, escribirEntero, esEnlace, sigueBien };
