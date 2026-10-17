// ¿Ha entrado la persona con su cuenta en el asistente? (decisión 186)
//
// Hasta aquí la barra no lo sabía y mandaba el primer encargo a una caja que, si
// no había sesión, iba a pedir entrar: el primer mensaje del montaje caía en una
// pantalla de acceso. Contesta 'si', 'no' o null (no se puede saber, y entonces
// se hace como antes: no se adivina).
//
// Qué dice la documentación oficial:
//   · Claude Code: `claude auth status` «sale con 0 si hay sesión y con 1 si no»
//     (https://code.claude.com/docs/en/cli-reference). No hay un fichero
//     documentado: la credencial vive en el llavero del sistema.
//   · Codex: guarda la sesión en `auth.json` de `CODEX_HOME` (por defecto
//     `~/.codex`) o, si se ha elegido `cli_auth_credentials_store` con `keyring`
//     o `auto`, en el llavero (https://learn.chatgpt.com/docs/auth). Con el
//     llavero, que no haya fichero no quiere decir que no haya sesión: null.
//
// Nunca se lee el contenido de una credencial: de `auth.json` solo se mira que
// exista y sea un fichero.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const VIGENCIA = 20 * 1000;
const recuerdo = new Map();

// Cambiable: las pruebas no lanzan el `claude` de verdad.
const modulo = {
  ejecutar: (...args) => require('./procesos').ejecutar(...args),
};

function codexHome(entorno = process.env, casa = os.homedir()) {
  return entorno.CODEX_HOME || path.join(casa, '.codex');
}

function guardaEnElLlavero(carpeta) {
  try {
    const fichero = path.join(carpeta, 'config.toml');
    if (fs.statSync(fichero).size > 256 * 1024) return false;
    return /^\s*cli_auth_credentials_store\s*=\s*["'](keyring|auto)["']/m.test(fs.readFileSync(fichero, 'utf8'));
  } catch {
    return false;
  }
}

function sesionDeCodex({ entorno = process.env, casa = os.homedir() } = {}) {
  const carpeta = codexHome(entorno, casa);
  try {
    if (fs.statSync(path.join(carpeta, 'auth.json')).isFile()) return 'si';
  } catch { /* sin fichero */ }
  return guardaEnElLlavero(carpeta) ? null : 'no';
}

async function sesionDeClaude({ cwd } = {}) {
  let hecho;
  try {
    hecho = await modulo.ejecutar('claude', ['auth', 'status'], { tiempoMaximo: 8000, ...(cwd ? { cwd } : {}) });
  } catch {
    return null;
  }
  if (!hecho) return null;
  // -1 es que no se pudo lanzar (no está `claude` a mano): no se sabe.
  if (hecho.codigo === 0) return 'si';
  if (hecho.codigo === 1) return 'no';
  return null;
}

// `asistente` es el de `asistentes.elDeAhora()`. Con memoria corta: se llama al
// pintar la principal.
async function haySesion(asistente, opciones = {}) {
  if (!asistente) return null;
  const id = asistente.id;
  const ahora = Date.now();
  const guardado = recuerdo.get(id);
  if (!opciones.fresco && guardado && ahora - guardado.cuando < VIGENCIA) return guardado.valor;
  const valor = id === 'codex' ? sesionDeCodex(opciones)
    : id === 'claude' ? await sesionDeClaude(opciones)
      : null;
  recuerdo.set(id, { cuando: ahora, valor });
  return valor;
}

// El primer encargo del montaje, guardado hasta que haya sesión.
let aplazado = null;
const aplazar = (texto) => { aplazado = texto || null; };
const loAplazado = () => aplazado;
const soltar = () => { const t = aplazado; aplazado = null; return t; };
const olvidar = () => { recuerdo.clear(); aplazado = null; };

module.exports = { haySesion, sesionDeCodex, sesionDeClaude, codexHome, aplazar, loAplazado, soltar, olvidar, modulo, VIGENCIA };
