// Avisarte cuando Codex termine (decisión 171).
//
// Con Claude la barra deja un enganche en los ajustes de la carpeta (decisión 162).
// Codex no tiene nada parecido por carpeta: su `notify` vive en el `config.toml` de
// usuario (`$CODEX_HOME`, por defecto `~/.codex`), vale para todas sus
// conversaciones, y el `.codex/` de la carpeta lo ignora
// (learn.chatgpt.com/docs/config-file/config-advanced). Por eso no se pone solo
// (P9): se ofrece con un botón, y con su sí se hace esto, entero o nada:
//
//   · El guion (`avisar.mjs`) se copia a un sitio fijo del usuario,
//     `<codex>/executive-lab/avisar.mjs`: el de la extensión cambia con cada versión.
//     Sin seguir enlaces.
//   · `notify = ["<node de verdad>", "<el guion>"]` va en `config.toml`, ARRIBA: una
//     clave que se añade al final cae dentro de la última tabla. Se pone justo
//     después de la última clave de arriba, y el resultado se lee con el lector que
//     ya usa la barra (`retirados.leerElToml`) antes de escribir: si no se entiende,
//     no se escribe.
//   · Solo con un `node` de verdad, por su ruta absoluta. `notify` lanza el programa
//     sin shell, así que `node` a secas no sirve en Windows, y el del editor
//     (`process.execPath`) es Electron.
//   · Una constancia al lado del guion: lo que se puso, con su huella. «Quitarlo»
//     quita solo eso y solo si sigue tal como se dejó; y lo quitado, a mano o así, no
//     se vuelve a ofrecer.
//
// No se ofrece si ya hay un `notify` de arriba (es suyo: P4), si el `config.toml` no
// se entiende o es un enlace, o si hay constancia de cualquier tipo.
//
// El guion solo avisa en las carpetas que montó la barra; ver `avisar.mjs`.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const retirados = require('./retirados');

const CARPETA = 'executive-lab';
const GUION = 'avisar.mjs';
const CONSTANCIA = 'constancia.json';

const sha = (datos) => crypto.createHash('sha256').update(datos).digest('hex');
const esEnlace = (ruta) => { try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; } };
const esFichero = (ruta) => { try { return fs.statSync(ruta).isFile(); } catch { return false; } };

// Si la carpeta existe y tiene algo dentro.
// Sin contar un temporal nuestro que quedó de una pasada cortada.
const hayCosas = (carpeta) => { try { return fs.readdirSync(carpeta).some((f) => !/\.executive-lab-\d+(-[0-9a-f]+)?$/.test(f)); } catch { return false; } };

const rutas = (codex) => ({
  config: path.join(codex, 'config.toml'),
  carpeta: path.join(codex, CARPETA),
  guion: path.join(codex, CARPETA, GUION),
  constancia: path.join(codex, CARPETA, CONSTANCIA),
});

// ── Un node de verdad ──────────────────────────────────────────────────────

// El guion es un módulo ES con `await` de arriba: pide un Node que lo sepa leer.
const NODE_MINIMO = 18;

const sePareceANode = (ruta, esWindows) => path.basename(ruta).toLowerCase() === (esWindows ? 'node.exe' : 'node');

// Lo que contesta `node --version`: una versión que el guion sabe leer.
function esVersionValida(salida) {
  const version = String(salida).match(/^v(\d+)\.\d+\.\d+\s*$/);
  return Boolean(version) && Number(version[1]) >= NODE_MINIMO;
}

// `espera`, en milisegundos: lo que se le da a `--version` (las pruebas dan margen).
function dice(ruta, espera = 5000) {
  try {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const salida = execFileSync(ruta, ['--version'], {
      encoding: 'utf8', timeout: espera, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'], env,
    });
    return esVersionValida(salida);
  } catch {
    return false;
  }
}

// El primero que sirva, o null. `propio`: el que la barra ya usa (`entorno.node()`,
// el de la instalación o, si no hay, el del editor, que se descarta). Después, el
// del PATH y los sitios de siempre. Debe ser absoluto, un fichero, llamarse `node`
// y decir su versión como un Node, no como Electron.
function nodeDeVerdad({
  propio = null, entorno = process.env, esWindows = process.platform === 'win32', execPath = process.execPath,
  espera = 5000, comprobar = (c) => dice(c, espera), ademas = null,
} = {}) {
  const sitios = ademas || (esWindows ? [] : ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']);
  const delPath = String(entorno.PATH || entorno.Path || '').split(path.delimiter).filter(Boolean);
  const candidatos = [propio, ...[...delPath, ...sitios].map((d) => path.join(d, esWindows ? 'node.exe' : 'node'))];
  for (const c of candidatos) {
    if (typeof c !== 'string' || !path.isAbsolute(c) || c === execPath) continue;
    if (!sePareceANode(c, esWindows) || !esFichero(c)) continue;
    if (comprobar(c)) return c;
  }
  return null;
}

// ── Constancia ─────────────────────────────────────────────────────────────

// Atada a la carpeta de Codex donde se dejó, como la de la 157.
function laHuella(codex, { estado, notify = null, guion = null }) {
  let donde = codex;
  try { donde = fs.realpathSync(codex); } catch { /* la que hay */ }
  return sha(JSON.stringify({ donde, estado, notify, guion }));
}

const ESTADOS = ['puesto', 'quitado', 'noGracias'];

// La constancia, solo si es de verdad nuestra: su forma y su huella.
function laConstancia(codex) {
  const { constancia } = rutas(codex);
  if (esEnlace(constancia)) return null;
  try {
    if (fs.statSync(constancia).size > 64 * 1024) return null;
    const c = JSON.parse(fs.readFileSync(constancia, 'utf8'));
    if (!c || typeof c !== 'object' || !ESTADOS.includes(c.estado) || typeof c.huella !== 'string') return null;
    const notify = Array.isArray(c.notify) && c.notify.length === 2 && c.notify.every((x) => typeof x === 'string') ? c.notify : null;
    const guion = typeof c.guion === 'string' ? c.guion : null;
    if (c.estado === 'puesto' && (!notify || !guion)) return null;
    return c.huella === laHuella(codex, { estado: c.estado, notify, guion }) ? { estado: c.estado, notify, guion, linea: c.linea } : null;
  } catch {
    return null;
  }
}

function escribirEntero(fichero, contenido, { copiarModo = null } = {}) {
  // Con un aleatorio: uno viejo que quedó de otra pasada no hace fallar a esta.
  const temporal = `${fichero}.executive-lab-${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
  fs.writeFileSync(temporal, contenido, { flag: 'wx' });
  try {
    if (copiarModo !== null) fs.chmodSync(temporal, copiarModo);
    fs.renameSync(temporal, fichero);
  } catch (error) {
    fs.rmSync(temporal, { force: true });
    throw error;
  }
}

function apuntar(codex, estado, extra = {}) {
  const r = rutas(codex);
  const notify = extra.notify || null;
  const guion = extra.guion || null;
  fs.mkdirSync(r.carpeta, { recursive: true });
  escribirEntero(r.constancia, `${JSON.stringify({
    porQue: 'Lo puso la barra de Executive Lab (decisión 171). Al quitarlo, solo se quita lo que sigue como lo dejó.', // diccionario: interno
    estado,
    ...(notify ? { notify, guion, linea: extra.linea } : {}),
    huella: laHuella(codex, { estado, notify, guion }),
  }, null, 2)}\n`);
}

// ── Leer el config.toml ────────────────────────────────────────────────────

// { hecho: 'noHay' | 'ok' | 'raro' | 'enlace' | 'ilegible', texto, leido }
function mirarElConfig(codex) {
  const { config } = rutas(codex);
  if (esEnlace(config)) return { hecho: 'enlace' };
  if (!fs.existsSync(config)) return { hecho: 'noHay', texto: '' };
  let texto;
  try { texto = fs.readFileSync(config, 'utf8'); } catch { return { hecho: 'ilegible' }; }
  const leido = retirados.leerElToml(texto);
  return leido ? { hecho: 'ok', texto, leido } : { hecho: 'raro' };
}

// El texto con `linea` entre las claves de arriba, o null si el resultado no se entiende.
function conLaClave(texto, linea) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const lineas = texto.split('\n').map((l) => l.replace(/\r$/, ''));
  const hasta = (() => { const l = retirados.leerElToml(texto); return l && l.primeraTabla >= 0 ? l.primeraTabla : lineas.length; })();
  // Después de la última línea de arriba que no sea un comentario ni esté vacía.
  let donde = -1;
  for (let i = 0; i < hasta; i += 1) if (lineas[i].trim() && !lineas[i].trim().startsWith('#')) donde = i;
  const nuevo = [...lineas];
  if (donde >= 0) nuevo.splice(donde + 1, 0, linea);
  else nuevo.splice(0, 0, linea, ...(texto.trim() ? [''] : []));
  const resultado = nuevo.join(eol);
  const leido = retirados.leerElToml(resultado);
  // Tiene que seguir entendiéndose, con `notify` arriba, y las tablas intactas.
  const antes = retirados.leerElToml(texto);
  if (!leido || !leido.clavesDeArriba.has('notify') || !antes) return null;
  const tablas = (t) => t.split('\n').filter((l) => /^\s*\[/.test(l)).join('\n');
  return tablas(resultado) === tablas(texto) ? (resultado.endsWith(eol) || !resultado ? resultado : resultado + eol) : null;
}

const laLinea = (node, guion) => `notify = [${JSON.stringify(node)}, ${JSON.stringify(guion)}]`;

// ── Qué se ofrece ──────────────────────────────────────────────────────────

// { ofrecer: bool, motivo, node? }. No toca nada.
function queSeOfrece({ codex = retirados.carpetaDeCodex(), fuente, node = null } = {}) {
  if (!node) return { ofrecer: false, motivo: 'sinNode' };
  if (!fuente || !esFichero(fuente)) return { ofrecer: false, motivo: 'sinGuion' };
  const r = rutas(codex);
  if ([r.carpeta, r.guion, r.constancia].some(esEnlace)) return { ofrecer: false, motivo: 'enlace' };
  if (laConstancia(codex)) return { ofrecer: false, motivo: 'yaDecidido' };
  // Un guion o una carpeta con cosas que no nos constan: de otro, y no se pisa.
  if (esFichero(r.guion) || hayCosas(r.carpeta)) return { ofrecer: false, motivo: 'carpetaAjena' };
  const config = mirarElConfig(codex);
  if (config.hecho !== 'noHay' && config.hecho !== 'ok') return { ofrecer: false, motivo: config.hecho };
  if (config.leido && config.leido.clavesDeArriba.has('notify')) return { ofrecer: false, motivo: 'yaHayUno' };
  return { ofrecer: true, motivo: 'falta', node };
}

// ── Ponerlo ────────────────────────────────────────────────────────────────

function ponerlo({ codex = retirados.carpetaDeCodex(), fuente, node, ahora = new Date() } = {}) {
  const oferta = queSeOfrece({ codex, fuente, node });
  if (!oferta.ofrecer) return { hecho: 'noSeOfrece', motivo: oferta.motivo };
  const r = rutas(codex);
  const config = mirarElConfig(codex);
  const linea = laLinea(node, r.guion);
  const texto = conLaClave(config.texto, linea);
  if (texto === null) return { hecho: 'raro' };

  let copia = null;
  // Lo que escribió esta pasada: en un fallo, solo eso se deshace.
  let guionEscrito = false;
  let constanciaEscrita = false;
  try {
    const contenido = fs.readFileSync(fuente);
    fs.mkdirSync(r.carpeta, { recursive: true });
    if (esEnlace(r.carpeta)) return { hecho: 'enlace' };
    // El guion antes que la clave: si no se copia, no hay `notify` que llame a nada.
    escribirEntero(r.guion, contenido);
    guionEscrito = true;
    // Y la constancia antes de tocar el config, que es lo que no se puede dejar a medias.
    apuntar(codex, 'puesto', { notify: [node, r.guion], guion: sha(contenido), linea });
    constanciaEscrita = true;
    if (config.hecho === 'ok') {
      const suya = `${r.config}.copia-executive-lab-${ahora.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;
      fs.copyFileSync(r.config, suya, fs.constants.COPYFILE_EXCL);
      // Hasta que no se copia, no es nuestra: en un fallo no se borra.
      copia = suya;
      escribirEntero(r.config, texto, { copiarModo: fs.statSync(r.config).mode });
    } else {
      fs.mkdirSync(codex, { recursive: true });
      escribirEntero(r.config, texto);
    }
  } catch (error) {
    // Sin el `notify` escrito, lo demás sobra: el guion y la constancia se quitan.
    const sigue = mirarElConfig(codex);
    if (!sigue.leido || !sigue.leido.clavesDeArriba.has('notify')) {
      if (guionEscrito) fs.rmSync(r.guion, { force: true });
      if (constanciaEscrita) fs.rmSync(r.constancia, { force: true });
      try { fs.rmdirSync(r.carpeta); } catch { /* tiene otras cosas, o no está */ }
      if (copia) fs.rmSync(copia, { force: true });
    }
    return { hecho: 'fallo', error: error.message };
  }
  return { hecho: 'puesto', fichero: r.config, guion: r.guion, copia };
}

// «No, gracias»: se apunta y no se vuelve a ofrecer.
function noGracias({ codex = retirados.carpetaDeCodex() } = {}) {
  const r = rutas(codex);
  if ([r.carpeta, r.constancia].some(esEnlace)) return { hecho: 'enlace' };
  if (laConstancia(codex)) return { hecho: 'yaDecidido' };
  try {
    apuntar(codex, 'noGracias');
  } catch (error) {
    return { hecho: 'fallo', error: error.message };
  }
  return { hecho: 'apuntado' };
}

// ── Quitarlo ───────────────────────────────────────────────────────────────

// Solo lo que puso la barra y sigue como lo dejó. Lo quitado no vuelve: la
// constancia se queda, ahora como `quitado`.
function quitarlo({ codex = retirados.carpetaDeCodex() } = {}) {
  const r = rutas(codex);
  if ([r.carpeta, r.guion, r.constancia].some(esEnlace)) return { hecho: 'enlace' };
  if (!fs.existsSync(r.constancia)) return { hecho: 'noEraNuestro' };
  const c = laConstancia(codex);
  if (!c) return { hecho: 'noCasa' };
  if (c.estado !== 'puesto') return { hecho: 'yaNoEstaba' };
  const config = mirarElConfig(codex);
  if (config.hecho === 'noHay') {
    apuntarQuitado(codex);
    return { hecho: 'yaNoEstaba' };
  }
  if (config.hecho !== 'ok') return { hecho: config.hecho };

  // La línea tal como la dejó la barra, en las claves de arriba, y sola: si está
  // cambiada, es suya.
  const lineas = config.texto.split('\n');
  const hasta = config.leido.primeraTabla >= 0 ? config.leido.primeraTabla : lineas.length;
  const donde = [];
  for (let i = 0; i < hasta; i += 1) if (lineas[i].replace(/\r$/, '') === c.linea) donde.push(i);
  let quitado = false;
  if (donde.length === 1 && config.leido.clavesDeArriba.has('notify')) {
    const resto = lineas.filter((_, i) => i !== donde[0]).join('\n');
    // Solo si lo que queda se sigue entendiendo y ya no tiene `notify`.
    const leido = retirados.leerElToml(resto);
    if (leido && !leido.clavesDeArriba.has('notify')) {
      try {
        escribirEntero(r.config, resto, { copiarModo: fs.statSync(r.config).mode });
        quitado = true;
      } catch (error) {
        return { hecho: 'fallo', error: error.message };
      }
    }
  }
  // El guion, solo si es el que se copió y ningún `notify` lo sigue llamando.
  try {
    const sigueLlamado = !quitado && mirarElConfig(codex).leido && mirarElConfig(codex).leido.clavesDeArriba.has('notify');
    if (!sigueLlamado && esFichero(r.guion) && sha(fs.readFileSync(r.guion)) === c.guion) fs.rmSync(r.guion, { force: true });
  } catch { /* se queda */ }
  apuntarQuitado(codex);
  return { hecho: quitado ? 'quitado' : 'yaNoEstaba' };
}

function apuntarQuitado(codex) {
  try { apuntar(codex, 'quitado'); } catch { /* la constancia vieja sigue diciendo puesto */ }
}

const FRASE = 'He dejado a Codex avisándote cuando termine, aunque estés en otra ventana.';

module.exports = {
  CARPETA, GUION, CONSTANCIA, FRASE,
  nodeDeVerdad, esVersionValida, queSeOfrece, ponerlo, noGracias, quitarlo, laConstancia, laLinea, rutas,
};

// Suelto: `--quitar [carpeta de Codex]`.
if (require.main === module) {
  const args = process.argv.slice(2);
  const codex = args.find((a) => !a.startsWith('--')) || retirados.carpetaDeCodex();
  if (args.includes('--quitar')) console.log(`aviso de Codex: ${quitarlo({ codex }).hecho}`); // diccionario: interno
}
