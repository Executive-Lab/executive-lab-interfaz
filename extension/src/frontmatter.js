// Leer el frontmatter YAML de un fichero markdown.
//
// No es un analizador de YAML: es lo justo para `clave: valor` con listas
// entre corchetes, que es todo lo que hay en las cabeceras que leemos —
// comandos de Claude, artículos de la wiki, el perfil de usuario. Un YAML de
// verdad sería una dependencia para nada.

const fs = require('node:fs');

// Una cabecera no pasa de unas líneas. Lo que se lee de ella, de una cabecera YAML
// o de un TOML, tiene tope: un fichero enorme preparado a propósito no puede
// dejar la barra leyendo (revisión adversaria de la 154).
const TOPE = 64 * 1024;

// Los primeros `tope` bytes de un fichero, sin cargarlo entero. Un carácter
// cortado por la mitad al final no importa: la cabecera va antes.
function leerHasta(fichero, tope = TOPE) {
  const fd = fs.openSync(fichero, 'r');
  try {
    const trozo = Buffer.alloc(tope);
    const leidos = fs.readSync(fd, trozo, 0, tope, 0);
    return trozo.subarray(0, leidos).toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function analizar(textoEntero) {
  const texto = String(textoEntero || '').slice(0, TOPE);
  const bloque = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!bloque) return {};

  const campos = {};
  const lineas = bloque[1].split('\n');
  for (let i = 0; i < lineas.length; i += 1) {
    const linea = lineas[i];
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const corte = limpia.indexOf(':');
    if (corte <= 0) continue;

    const clave = limpia.slice(0, corte).trim();
    let valor = limpia.slice(corte + 1).trim();
    // Las descripciones nativas de Codex también usan los bloques YAML `>`
    // y `|`. Consumirlos evita leer como campos las líneas de su contenido.
    if (/^[>|][+-]?$/.test(valor)) {
      const sangria = linea.length - linea.trimStart().length;
      const cuerpo = [];
      while (i + 1 < lineas.length) {
        const siguiente = lineas[i + 1];
        if (siguiente.trim() && siguiente.length - siguiente.trimStart().length <= sangria) break;
        cuerpo.push(siguiente);
        i += 1;
      }
      const noVacias = cuerpo.filter((l) => l.trim());
      const margen = noVacias.length ? noVacias.reduce((min, l) => Math.min(min, l.length - l.trimStart().length), Infinity) : 0;
      const texto = cuerpo.map((l) => l.slice(margen)).join('\n');
      campos[clave] = valor[0] === '>' ? texto.replace(/([^\n])\n(?=[^\n])/g, '$1 ') : texto;
      continue;
    }
    if (valor.startsWith('"') && valor.endsWith('"')) {
      try { valor = JSON.parse(valor); } catch { valor = valor.slice(1, -1); }
    } else if (valor.startsWith("'") && valor.endsWith("'")) valor = valor.slice(1, -1).replace(/''/g, "'");
    if (valor.startsWith('[') && valor.endsWith(']')) {
      valor = valor.slice(1, -1).split(',').map((v) => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    campos[clave] = valor;
  }
  return campos;
}

function leer(fichero) {
  try {
    return analizar(leerHasta(fichero));
  } catch {
    return {};
  }
}

module.exports = { analizar, leer, leerHasta, TOPE };
