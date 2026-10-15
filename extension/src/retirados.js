// Codex con una versión que ya no existe (decisión 157).
//
// OpenAI retira modelos de Codex para quien entra con su cuenta de ChatGPT:
// GPT-5.4 y GPT-5.4 mini el 31-08-2026, GPT-5.3-Codex-Spark el 14-09 y GPT-5.5 el
// 14-10 (learn.chatgpt.com/docs/changelog). Si el `config.toml` de Codex —el de la
// persona, en `$CODEX_HOME` (por defecto `~/.codex`), o el de la carpeta, en
// `.codex/`— sigue diciendo `model = "gpt-5.5"`, Codex no contesta, y nada en la
// pantalla dice por qué.
//
// Se arregla solo (P9: es de su ordenador y se deshace): se quita esa línea, y la
// del perfil activo si la hay, y se deja una copia del fichero al lado. Sin la
// línea, Codex usa el que trae él. La lista es una tabla con su fecha y su fuente
// (`media/modelos-retirados.json`, P5): cuando retiren otro, se añade una fila.
//
// Con cuidado, porque el fichero es suyo y es TOML:
//   · solo esa línea, nada más del fichero, con sus saltos de línea y sus
//     permisos, y entero o nada;
//   · si hay algo que no se entiende —un texto de varias líneas, dos `model` en el
//     mismo sitio—, no se toca;
//   · ni a través de un enlace;
//   · ni si entra con una clave de la API (`forced_login_method = "api"`): con ella
//     esos modelos siguen funcionando.
//
// El perfil activo es el de antes de Codex 0.134.0: `profile = "x"` arriba y su
// tabla `[profiles.x]`. Desde entonces los perfiles son ficheros aparte que solo
// se usan con `--profile`, y esos no se tocan. En el `.codex/config.toml` de una
// carpeta Codex no lee perfiles, así que ahí solo cuenta la línea de arriba.
//
// Quién y cuándo lo decide `extension.js`: al abrir, si la persona usa Codex.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TABLA = path.join(__dirname, '..', 'media', 'modelos-retirados.json');

const carpetaDeCodex = (entorno = process.env, casa = os.homedir()) => entorno.CODEX_HOME || path.join(casa, '.codex');

function leerLaTabla(fichero = TABLA) {
  try {
    return JSON.parse(fs.readFileSync(fichero, 'utf8'));
  } catch {
    return null;
  }
}

// Los que ya están retirados hoy, por su id. Una fila con fecha futura espera.
function losRetirados(ahora = new Date(), tabla = leerLaTabla()) {
  const filas = tabla && Array.isArray(tabla.codex) ? tabla.codex : [];
  return new Map(filas
    .filter((f) => f && typeof f.id === 'string' && f.id && Date.parse(f.desde) <= ahora.getTime())
    .map((f) => [f.id, f]));
}

const esEnlace = (ruta) => { try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; } };

// Una clave de arriba con un texto entre comillas, y nada más en la línea que un
// comentario. Lo que no tenga esta forma no se entiende, y no se toca.
const unaClave = (nombre) => new RegExp(`^\\s*${nombre}\\s*=\\s*(?:"([^"\\\\]*)"|'([^']*)')\\s*(?:#.*)?$`);
const MODELO = unaClave('model');
const PERFIL = unaClave('profile');
const ENTRADA = unaClave('forced_login_method');
const ENTRADA_DE_ANTES = unaClave('preferred_auth_method');
const CABECERA = /^\s*\[\[?\s*([^[\]]*?)\s*\]\]?\s*(?:#.*)?$/;
const elValor = (m) => (m[1] !== undefined ? m[1] : m[2]);
const laTabla = (bruto) => bruto.split('.').map((p) => p.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')).join('.');

// Lo que importa de un `config.toml`, línea a línea; o null si no se entiende.
// `tabla` es '' arriba, antes de la primera cabecera.
function leerElToml(texto) {
  if (/"""|'''/.test(texto)) return null;
  const lineas = texto.split('\n');
  const modelos = [];
  let tabla = '';
  let perfil = null;
  let conClave = false;
  lineas.forEach((cruda, i) => {
    const linea = cruda.replace(/\r$/, '');
    const cabecera = linea.match(CABECERA);
    if (cabecera) {
      tabla = laTabla(cabecera[1]);
      return;
    }
    const modelo = linea.match(MODELO);
    if (modelo) modelos.push({ i, tabla, id: elValor(modelo) });
    if (tabla !== '') return;
    const elPerfil = linea.match(PERFIL);
    if (elPerfil) perfil = elValor(elPerfil);
    const entrada = linea.match(ENTRADA) || linea.match(ENTRADA_DE_ANTES);
    if (entrada && /^(api|apikey)$/i.test(elValor(entrada))) conClave = true;
  });
  return { lineas, modelos, perfil, conClave };
}

// 20261015-143000
const sello = (ahora) => ahora.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');

// Entero o nada, con los permisos que tenía.
function escribir(fichero, texto) {
  const temporal = `${fichero}.executive-lab-${process.pid}`;
  fs.writeFileSync(temporal, texto, { flag: 'wx' });
  try {
    fs.chmodSync(temporal, fs.statSync(fichero).mode);
    fs.renameSync(temporal, fichero);
  } catch (error) {
    fs.rmSync(temporal, { force: true });
    throw error;
  }
}

// Un fichero: { hecho, fichero, copia?, modelos? }.
function arreglarUnFichero(fichero, retirados, { conPerfil = false, ahora = new Date() } = {}) {
  if (esEnlace(fichero)) return { hecho: 'enlace', fichero };
  if (!fs.existsSync(fichero)) return { hecho: 'noHay', fichero };
  let texto;
  try {
    texto = fs.readFileSync(fichero, 'utf8');
  } catch {
    return { hecho: 'ilegible', fichero };
  }
  const leido = leerElToml(texto);
  if (!leido) return { hecho: 'raro', fichero };

  const cuentan = (m) => m.tabla === '' || (conPerfil && leido.perfil !== null && m.tabla === `profiles.${leido.perfil}`);
  const aMirar = leido.modelos.filter(cuentan);
  // Dos `model` en el mismo sitio no es TOML: no se sabe cuál manda.
  const sitios = aMirar.map((m) => m.tabla);
  if (new Set(sitios).size !== sitios.length) return { hecho: 'raro', fichero };
  const quitar = aMirar.filter((m) => retirados.has(m.id));
  if (!quitar.length) return { hecho: 'nada', fichero };

  const fuera = new Set(quitar.map((m) => m.i));
  const copia = `${fichero}.copia-executive-lab-${sello(ahora)}`;
  try {
    fs.copyFileSync(fichero, copia, fs.constants.COPYFILE_EXCL);
    escribir(fichero, leido.lineas.filter((_, i) => !fuera.has(i)).join('\n'));
  } catch (error) {
    return { hecho: 'fallo', fichero, error: error.message };
  }
  return { hecho: 'arreglado', fichero, copia, modelos: [...new Set(quitar.map((m) => m.id))] };
}

// El suyo de usuario y, si se da, el de la carpeta.
function arreglar({ codex = carpetaDeCodex(), raiz = null, ahora = new Date(), tabla = leerLaTabla() } = {}) {
  const retirados = losRetirados(ahora, tabla);
  if (!retirados.size) return [];
  const suyo = path.join(codex, 'config.toml');
  // Con una clave de la API, esos modelos siguen funcionando: no se toca nada.
  if (!esEnlace(suyo) && fs.existsSync(suyo)) {
    let leido = null;
    try { leido = leerElToml(fs.readFileSync(suyo, 'utf8')); } catch { /* se mira abajo */ }
    if (leido && leido.conClave) return [{ hecho: 'conClave', fichero: suyo }];
  }
  const hechos = [arreglarUnFichero(suyo, retirados, { conPerfil: true, ahora })];
  if (raiz) {
    // La de la carpeta, tampoco a través de un enlace: llevaría fuera de ella.
    const suya = path.join(raiz, '.codex', 'config.toml');
    hechos.push(esEnlace(path.dirname(suya)) ? { hecho: 'enlace', fichero: suya } : arreglarUnFichero(suya, retirados, { ahora }));
  }
  return hechos;
}

// La frase, con los nombres de la tabla (P9: lo que se hace solo se dice).
function laFrase(hechos, tabla = leerLaTabla()) {
  const filas = tabla && Array.isArray(tabla.codex) ? tabla.codex : [];
  const ids = [...new Set((hechos || []).filter((h) => h.hecho === 'arreglado').flatMap((h) => h.modelos || []))];
  if (!ids.length) return null;
  const nombres = ids.map((id) => (filas.find((f) => f.id === id) || {}).nombre || id);
  const dichos = nombres.length < 2 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
  return `He arreglado Codex: tenía elegida una versión que ya no existe (${dichos}). Empieza una conversación nueva para que lo coja.`;
}

module.exports = { TABLA, carpetaDeCodex, leerLaTabla, losRetirados, leerElToml, arreglarUnFichero, arreglar, laFrase };
