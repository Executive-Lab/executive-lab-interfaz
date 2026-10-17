// Codex no corre lo que el arnés le monta hasta que la persona confía (decisión 178).
//
// RSC 3.0.22 monta para Codex sus enganches en `.codex/hooks.json` de la carpeta
// (la memoria entre conversaciones y el repaso del conocimiento) y lo declara con
// `hook-trust-required` (`targets/memory.js`). Según la documentación de Codex
// (developers.openai.com/codex/hooks), antes de que un enganche que no es de
// administración corra, Codex pide revisar y confiar en su definición exacta, con
// `/hooks` dentro de Codex; y solo carga lo del `.codex/` de un proyecto si el
// proyecto es de confianza. Sin eso la memoria y lo demás no funcionan, y nada lo
// dice.
//
// Dónde queda guardado: en el `config.toml` de usuario de Codex (`$CODEX_HOME`, por
// defecto `~/.codex`), una tabla por enganche:
//
//   [hooks.state."<ruta del hooks.json>:<evento>:<grupo>:<manejador>"]
//   trusted_hash = "…"
//
// El formato NO está documentado: sale de las incidencias de openai/codex (#21615,
// #27133, #47283) y puede cambiar. La huella (`trusted_hash`) es un SHA-256 de una
// forma normalizada del enganche que no se puede recalcular de fuera, así que de
// aquí solo se sabe si CADA enganche del arnés tiene una entrada, no si la huella
// sigue valiendo: un enganche cambiado después de confiar se vería como confiado.
//
// P9: aquí solo se LEE. La barra no confía por la persona ni escribe en la
// configuración de Codex. Sin enlaces: un `.codex`, un `hooks.json` o un
// `config.toml` que lo sean no se leen, y se dice «no se sabe».
//
// Salida de `queSabe`:
//   { hay: false }                              la carpeta no trae enganches de Codex del arnés
//   { hay: true, estado: 'confia' }             todos los del arnés tienen su entrada
//   { hay: true, estado: 'falta' }              no hay entrada de alguno
//   { hay: true, estado: 'noSe', motivo }       no se pudo leer (enlace, enorme, forma rara)

const fs = require('node:fs');
const path = require('node:path');
const retirados = require('./retirados');

const CLAVE = 'executiveLab.enganchesDeCodexDicho';
const PASO = '/hooks'; // diccionario: interno
const MARCA_DEL_ARNES = '.rsc/';
const TOPE = 256 * 1024;

const esEnlace = (ruta) => { try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; } };

function leerPequeno(ruta) {
  if (esEnlace(ruta)) return { hecho: 'enlace' };
  let texto;
  try {
    const st = fs.statSync(ruta);
    if (!st.isFile()) return { hecho: 'noHay' };
    if (st.size > TOPE) return { hecho: 'enorme' };
    texto = fs.readFileSync(ruta, 'utf8');
  } catch (error) {
    return { hecho: error && error.code === 'ENOENT' ? 'noHay' : 'ilegible' };
  }
  return { hecho: 'ok', texto };
}

// Los enganches del arnés del `hooks.json` de la carpeta, con el sitio que ocupan:
// evento, grupo y manejador, que es lo que Codex usa para nombrarlos. Solo los que
// llaman a algo de `.rsc/`: los de la persona son suyos.
function losDelArnes(raiz) {
  const carpeta = path.join(raiz, '.codex');
  const fichero = path.join(carpeta, 'hooks.json');
  if (esEnlace(carpeta)) return { hecho: 'enlace' };
  const leido = leerPequeno(fichero);
  if (leido.hecho !== 'ok') return { hecho: leido.hecho, fichero };
  let json;
  try { json = JSON.parse(leido.texto); } catch { return { hecho: 'raro', fichero }; }
  const eventos = json && typeof json === 'object' && json.hooks && typeof json.hooks === 'object' ? json.hooks : null;
  if (!eventos) return { hecho: 'ok', fichero, enganches: [] };
  const enganches = [];
  for (const [evento, grupos] of Object.entries(eventos)) {
    if (!Array.isArray(grupos)) continue;
    grupos.forEach((grupo, g) => {
      const manejadores = grupo && Array.isArray(grupo.hooks) ? grupo.hooks : [];
      manejadores.forEach((m, h) => {
        const orden = m && typeof m.command === 'string' ? m.command.replaceAll('\\', '/') : '';
        if (orden.includes(MARCA_DEL_ARNES)) enganches.push({ evento, grupo: g, manejador: h });
      });
    });
  }
  return { hecho: 'ok', fichero, enganches };
}

const evento = (e) => String(e).toLowerCase().replace(/[_\-\s]/g, '');
const ruta = (r, minusculas) => {
  const limpia = String(r).replaceAll('\\', '/').replace(/^\/\/\?\//, '');
  return minusculas ? limpia.toLowerCase() : limpia;
};

// Las entradas `[hooks.state."…"]` con huella del config.toml, o null si hay algo de
// `hooks.state` escrito de una forma que este lector no entiende (clave con puntos,
// tabla en línea): entonces no se sabe.
function lasEntradas(texto) {
  const lineas = texto.split('\n');
  const reconocida = (l) => /^\s*\[\s*hooks\.state\.(?:"(?:[^"\\]|\\.)*"|'[^']*')\s*\]\s*(?:#.*)?$/.test(l);
  for (const l of lineas) {
    const sin = l.replace(/\r$/, '');
    if (/^\s*#/.test(sin) || reconocida(sin)) continue;
    // `hooks.state` escrito de otra forma, o las tablas que lo contienen: no se entiende.
    if (/\bhooks\.state\b/.test(sin) || /^\s*\[\s*hooks(\.state)?\s*\]/.test(sin)) return null;
  }
  const entradas = [];
  let actual = null;
  for (const cruda of lineas) {
    const linea = cruda.replace(/\r$/, '');
    const cabecera = linea.match(/^\s*\[\s*(.*?)\s*\]\s*(?:#.*)?$/);
    if (cabecera && !/^\s*\[\[/.test(linea)) {
      actual = null;
      const m = cabecera[1].match(/^hooks\.state\.(?:"((?:[^"\\]|\\.)*)"|'([^']*)')$/);
      if (m) {
        let clave = m[2];
        if (clave === undefined) {
          try { clave = JSON.parse(`"${m[1]}"`); } catch { clave = null; }
        }
        if (clave !== null) { actual = { clave, huella: false }; entradas.push(actual); }
      }
      continue;
    }
    if (actual && /^\s*trusted_hash\s*=\s*(?:"[^"]+"|'[^']+')/.test(linea)) actual.huella = true;
  }
  return entradas.filter((e) => e.huella);
}

function partirClave(clave) {
  const m = String(clave).match(/^(.*):([^:]+):(\d+):(\d+)$/);
  return m ? { fuente: m[1], evento: m[2], grupo: Number(m[3]), manejador: Number(m[4]) } : null;
}

// ¿Confía Codex en los enganches del arnés de esta carpeta? No toca nada.
// `codex`: la carpeta de Codex (para las pruebas); `minusculas`: Windows y Mac no
// distinguen mayúsculas en una ruta.
function queSabe({ raiz, codex = retirados.carpetaDeCodex(), minusculas = process.platform !== 'linux' } = {}) {
  if (!raiz) return { hay: false };
  const suyos = losDelArnes(raiz);
  if (suyos.hecho === 'noHay') return { hay: false };
  if (suyos.hecho !== 'ok') return { hay: true, estado: 'noSe', motivo: suyos.hecho };
  if (!suyos.enganches.length) return { hay: false };

  const config = path.join(codex, 'config.toml');
  const leido = leerPequeno(config);
  if (leido.hecho === 'noHay') return { hay: true, estado: 'falta', motivo: 'sinConfig' };
  if (leido.hecho !== 'ok') return { hay: true, estado: 'noSe', motivo: leido.hecho };
  const entradas = lasEntradas(leido.texto);
  if (entradas === null) return { hay: true, estado: 'noSe', motivo: 'formaRara' };

  const sitios = new Set([ruta(suyos.fichero, minusculas)]);
  try { sitios.add(ruta(fs.realpathSync(suyos.fichero), minusculas)); } catch { /* el de siempre */ }
  const tengo = entradas.map((e) => partirClave(e.clave)).filter((p) => p && sitios.has(ruta(p.fuente, minusculas)));
  const falta = suyos.enganches.filter((e) => !tengo.some((p) => evento(p.evento) === evento(e.evento) && p.grupo === e.grupo && p.manejador === e.manejador));
  return falta.length ? { hay: true, estado: 'falta', motivo: tengo.length ? 'faltaAlguno' : 'sinEntradas', faltan: falta.length }
    : { hay: true, estado: 'confia' };
}

// La tarjeta: solo si hay enganches y no consta que Codex confíe. Una línea clara.
// `noSe` se dice igual que `falta`: la persona no puede saber más que la barra.
function laTarjeta(info) {
  if (!info || !info.hay || info.estado === 'confia') return null;
  return {
    texto: 'Codex aún no usa lo que el arnés le deja en esta carpeta, como acordarse de lo último que hicisteis. Falta que confíes en ello una vez.',
    detalle: `Escribe ${PASO} en Codex y confía en lo de esta carpeta. Lo hace él, no yo.`, // diccionario: interno
  };
}

module.exports = { CLAVE, PASO, queSabe, laTarjeta, losDelArnes, lasEntradas, partirClave };
