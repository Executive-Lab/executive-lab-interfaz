// Leer del disco sin repetirse (decisión 188).
//
// Un repintado de la barra pregunta lo mismo muchas veces: `.rsc.json` lo leían
// decenas de funciones, `index.md` y `log.md` varias. Con una carpeta de
// verdad (un `.rsc.json` de 4 MB, un `log.md` de 7) cada lectura cuesta lo que
// cuesta, y el repintado se iba a más de veinte segundos. Aquí se lee una vez y
// se guarda mientras el fichero siga siendo el mismo: misma fecha de cambio,
// mismo tamaño y mismo inodo. Si alguien lo escribe, la clave cambia y se lee otra vez.
//
// Lo que devuelve es de SOLO LECTURA y se comparte entre quien lo pide: quien
// quiera cambiarlo, que lo copie antes.

const fs = require('node:fs');

const GUARDADAS = new Map();
const MAXIMO_DE_FICHEROS = 64;

const claveDe = (e) => `${e.mtimeMs}:${e.ctimeMs}:${e.size}:${e.ino}`;

// Cuántas veces se ha leído del disco de verdad: para las pruebas.
const contador = { lecturas: 0 };

// Lo que sale de `transformar(texto)`, guardado por fichero y por «qué es» (`como`).
// `tope`: de un fichero más grande, solo se leen los primeros `tope` bytes y se
// corta en el último salto de línea entero. Devuelve `undefined` si no se puede leer.
function deUnFichero(ruta, como, transformar, { tope = 0 } = {}) {
  let e;
  try { e = fs.statSync(ruta); } catch { GUARDADAS.delete(`${como}\n${ruta}`); return undefined; }
  if (!e.isFile()) return undefined;
  const llave = `${como}\n${ruta}`;
  const clave = `${claveDe(e)}:${tope}`;
  const guardada = GUARDADAS.get(llave);
  if (guardada && guardada.clave === clave) return guardada.valor;

  let valor;
  try {
    contador.lecturas += 1;
    let texto;
    if (tope && e.size > tope) {
      const fd = fs.openSync(ruta, 'r');
      try {
        const buffer = Buffer.alloc(tope);
        const leidos = fs.readSync(fd, buffer, 0, tope, 0);
        texto = buffer.toString('utf8', 0, leidos);
      } finally { fs.closeSync(fd); }
      const corte = texto.lastIndexOf('\n');
      if (corte > 0) texto = texto.slice(0, corte + 1);
    } else {
      texto = fs.readFileSync(ruta, 'utf8');
    }
    valor = transformar(texto);
  } catch {
    valor = undefined;
  }
  if (GUARDADAS.size >= MAXIMO_DE_FICHEROS) GUARDADAS.delete(GUARDADAS.keys().next().value);
  GUARDADAS.set(llave, { clave, valor });
  return valor;
}

const texto = (ruta, opciones) => deUnFichero(ruta, 'texto', (t) => t, opciones);
const json = (ruta) => deUnFichero(ruta, 'json', (t) => JSON.parse(t));

// Las entradas de una carpeta, con un tope: una carpeta de verdad puede tener
// decenas de miles y la barra solo necesita las primeras. `pasaDelTope` dice si
// se ha dejado alguna fuera. Se lee con `opendir`, que no carga la carpeta entera.
const TOPE_DE_ENTRADAS = 5000;
function entradas(carpeta, tope = TOPE_DE_ENTRADAS) {
  const lista = [];
  let pasaDelTope = false;
  const d = fs.opendirSync(carpeta);
  try {
    for (let e = d.readSync(); e; e = d.readSync()) {
      if (lista.length >= tope) { pasaDelTope = true; break; }
      lista.push(e);
    }
  } finally { d.closeSync(); }
  lista.pasaDelTope = pasaDelTope;
  return lista;
}

const olvidar = () => GUARDADAS.clear();

module.exports = { texto, json, deUnFichero, entradas, olvidar, contador, TOPE_DE_ENTRADAS };
