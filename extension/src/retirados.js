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
// No usa `toml-campos.js` (decisión 154): ese lee los campos de arriba de un agente
// y se para en la primera tabla, y aquí hace falta la línea entera y la tabla del
// perfil. Este lee menos y, ante un texto de varias líneas, no toca nada.
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
const PROVEEDOR = unaClave('model_provider');
// Sin espacios alrededor del nombre dentro de la expresión: con ellos, una línea
// de `[` y miles de espacios sin cerrar tardaba minutos, y esto corre al abrir la
// carpeta (revisión de seguridad de la 157, M1). Se recortan después.
const CABECERA = /^\s*\[\[?([^[\]]*)\]\]?\s*(?:#.*)?$/;
const elValor = (m) => (m[1] !== undefined ? m[1] : m[2]);
const laTabla = (bruto) => bruto.trim().split('.').map((p) => p.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')).join('.');

// Un `config.toml` de verdad cabe de sobra en esto; lo que no, no se entiende. Se
// mira antes de pasarle ninguna expresión.
const LINEA_MAS_LARGA = 1000;
const FICHERO_MAS_GRANDE = 256 * 1024;

// Las llaves y los corchetes que abre y no cierra una línea, sin contar lo que va
// entre comillas ni el comentario.
const sinTextos = (linea) => linea.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""').replace(/#.*$/, '');
const cuantos = (texto, abre, cierra) => texto.split(abre).length - texto.split(cierra).length;

// Lo que importa de un `config.toml`, línea a línea; o null si no se entiende.
// `tabla` es '' arriba, antes de la primera cabecera.
//
// No se entiende —y entonces no se toca— un texto de varias líneas, una línea
// larguísima, una que empieza por `[` y no es una cabecera que se sepa leer (un
// nombre entre comillas con corchetes dentro, por ejemplo), una tabla en línea que
// sigue en otra línea y una lista que no se cierra. En todos, lo que parece la
// línea de `model` podría no serlo, o serlo de otra tabla (revisión de seguridad
// de la 157, B3). Dentro de una lista de varias líneas no hay ni cabeceras ni
// claves: un `["x"]` ahí es un elemento (revisión de corrección, B9).
//
// De paso se apunta con qué proveedor va cada sitio (`model_provider`) y si hay
// proveedores propios (`[model_providers.*]`): con otro que no sea OpenAI, `model`
// es el nombre de un despliegue suyo, que no se retira (revisión de corrección, M1).
function leerElToml(texto) {
  if (texto.length > FICHERO_MAS_GRANDE || /"""|'''/.test(texto)) return null;
  const lineas = texto.split('\n');
  if (lineas.some((l) => l.length > LINEA_MAS_LARGA)) return null;
  const modelos = [];
  const proveedores = new Map();
  let conProveedoresPropios = false;
  // Para la 171: los nombres de las claves de arriba, y dónde está la primera tabla.
  const clavesDeArriba = new Set();
  let primeraTabla = -1;
  let tabla = '';
  let perfil = null;
  let conClave = false;
  let enUnaLista = 0;
  let raro = false;
  lineas.forEach((cruda, i) => {
    if (raro) return;
    const linea = cruda.replace(/\r$/, '');
    const limpia = sinTextos(linea);
    if (enUnaLista > 0) {
      enUnaLista += cuantos(limpia, '[', ']');
      if (enUnaLista < 0 || cuantos(limpia, '{', '}') !== 0) raro = true;
      return;
    }
    const cabecera = linea.match(CABECERA);
    if (cabecera) {
      if (primeraTabla < 0) primeraTabla = i;
      tabla = laTabla(cabecera[1]);
      if (tabla === 'model_providers' || tabla.startsWith('model_providers.')) conProveedoresPropios = true;
      return;
    }
    if (/^\s*\[/.test(linea) || cuantos(limpia, '{', '}') !== 0) {
      raro = true;
      return;
    }
    if (tabla === '') {
      const clave = linea.match(/^\s*(?:"([^"\\]*)"|'([^']*)'|([A-Za-z0-9_-]+))\s*[.=]/);
      if (clave) clavesDeArriba.add(clave[1] ?? clave[2] ?? clave[3]);
    }
    // Una lista que sigue en las líneas de abajo.
    const abiertos = cuantos(limpia, '[', ']');
    if (abiertos < 0) {
      raro = true;
      return;
    }
    if (abiertos > 0) {
      enUnaLista = abiertos;
      return;
    }
    if (/^\s*model_providers\s*[.=]/.test(limpia)) conProveedoresPropios = true;
    const modelo = linea.match(MODELO);
    if (modelo) modelos.push({ i, tabla, id: elValor(modelo) });
    const proveedor = linea.match(PROVEEDOR);
    if (proveedor) proveedores.set(tabla, elValor(proveedor));
    if (tabla !== '') return;
    const elPerfil = linea.match(PERFIL);
    if (elPerfil) perfil = elValor(elPerfil);
    const entrada = linea.match(ENTRADA) || linea.match(ENTRADA_DE_ANTES);
    if (entrada && /^(api|apikey)$/i.test(elValor(entrada))) conClave = true;
  });
  return raro || enUnaLista !== 0 ? null : { lineas, modelos, perfil, conClave, proveedores, conProveedoresPropios, clavesDeArriba, primeraTabla };
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
  // Con proveedores propios, o con uno que no es OpenAI, no se sabe de quién es ese nombre.
  const deOpenAI = (sitio) => [undefined, 'openai'].includes(leido.proveedores.get(sitio));
  if (leido.conProveedoresPropios || !deOpenAI('')) return { hecho: 'otroProveedor', fichero };

  const cuentan = (m) => m.tabla === '' || (conPerfil && leido.perfil !== null && m.tabla === `profiles.${leido.perfil}` && deOpenAI(m.tabla));
  const aMirar = leido.modelos.filter(cuentan);
  // Dos `model` en el mismo sitio no es TOML: no se sabe cuál manda.
  const sitios = aMirar.map((m) => m.tabla);
  if (new Set(sitios).size !== sitios.length) return { hecho: 'raro', fichero };
  const quitar = aMirar.filter((m) => retirados.has(m.id));
  if (!quitar.length) return { hecho: 'nada', fichero };

  const fuera = new Set(quitar.map((m) => m.i));
  const copia = `${fichero}.copia-executive-lab-${sello(ahora)}`;
  let copiada = false;
  try {
    fs.copyFileSync(fichero, copia, fs.constants.COPYFILE_EXCL);
    copiada = true;
    escribir(fichero, leido.lineas.filter((_, i) => !fuera.has(i)).join('\n'));
  } catch (error) {
    // Si no se pudo cambiar, la copia sobra: si no, quedaría una por cada vez que
    // se abre (revisión de corrección de la 157, B8).
    if (copiada) fs.rmSync(copia, { force: true });
    return { hecho: 'fallo', fichero, error: error.message };
  }
  return { hecho: 'arreglado', fichero, copia, modelos: [...new Set(quitar.map((m) => m.id))] };
}

// Si entra en Codex con una clave de la API, según su `auth.json`. Solo se mira si
// el campo de la clave tiene algo, o si dice que entra así; su valor no se usa ni
// se apunta en ningún sitio (revisión de corrección de la 157, M1).
function entraConClave(codex) {
  const fichero = path.join(codex, 'auth.json');
  try {
    if (fs.statSync(fichero).size > 64 * 1024) return false;
    const datos = JSON.parse(fs.readFileSync(fichero, 'utf8'));
    if (!datos || typeof datos !== 'object') return false;
    const conCampo = typeof datos.OPENAI_API_KEY === 'string' && datos.OPENAI_API_KEY.length > 0;
    return conCampo || (typeof datos.auth_mode === 'string' && /api/i.test(datos.auth_mode));
  } catch {
    return false;
  }
}

// El suyo de usuario y, si se da, el de la carpeta.
function arreglar({ codex = carpetaDeCodex(), raiz = null, ahora = new Date(), tabla = leerLaTabla() } = {}) {
  const retirados = losRetirados(ahora, tabla);
  if (!retirados.size) return [];
  const suyo = path.join(codex, 'config.toml');
  // Con una clave de la API, esos modelos siguen funcionando: no se toca nada.
  if (entraConClave(codex)) return [{ hecho: 'conClave', fichero: path.join(codex, 'auth.json') }];
  if (!esEnlace(suyo) && fs.existsSync(suyo)) {
    let leido = null;
    try { leido = leerElToml(fs.readFileSync(suyo, 'utf8')); } catch { /* se mira abajo */ }
    if (leido && leido.conClave) return [{ hecho: 'conClave', fichero: suyo }];
    // Con otro proveedor arriba, el `model` de la carpeta también es suyo.
    if (leido && (leido.conProveedoresPropios || ![undefined, 'openai'].includes(leido.proveedores.get('')))) {
      return [{ hecho: 'otroProveedor', fichero: suyo }];
    }
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
