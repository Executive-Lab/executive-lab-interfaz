// En una carpeta de alguien, lo que la barra no hace sola se ofrece con su botón
// (decisión 177).
//
// Una carpeta de alguien es la que la barra no montó en este ordenador: su
// historial es de otra persona, o es un clon (`terreno.montadaAqui`, decisiones
// 157, 161 y 164). Ahí la barra no pone nada sola (P4), pero tampoco puede dejar
// a esa persona sin saber que existe. Tres cosas, cada una con su botón y su
// «Ahora no»; un clic es el sí de quien lo pulsa (P9):
//
//   · `marcas`: volver a encender lo que apagó una barra de antes. Antes de la 161
//     los raíles callaban la revisión periódica, la recogida de worktrees y el
//     guardián de gitmoji en todas las carpetas, y RSC ya lo apuntó en su
//     `.rsc.json`. RSC no trae una orden para encenderlos: dice «borra ese
//     fichero» (`worktree-reaper.mjs`) y, al reescribir `.rsc.json`, rehace
//     `optOuts` con las marcas que hay (`localDecisions`, `install-apply.js`).
//     Aquí se borra el fichero, y solo si es de la barra: tiene que decir lo que
//     escribió ella, palabra por palabra. Uno vacío, o con el texto de RSC, o
//     con el de otra persona, lo puso el equipo y no se toca. En un clon, RSC
//     rehízo la marca con su texto, así que tampoco se reconoce: solo en el
//     ordenador donde la dejó la barra.
//   · `claude`: el español y que pregunte antes de subir, en
//     `.claude/settings.local.json` (`ajustes-locales.js`, con `conSuSi`).
//   · `codex`: el `model` retirado del `.codex/config.toml` de la carpeta
//     (`retirados.js`, con `soloLaCarpeta`).
//
// Lo rechazado no vuelve a ofrecerse en esa carpeta. Se recuerda en el estado del
// editor para ella (no viaja, no entra en git). Lo que se hizo y se quitó
// después tampoco: la constancia de `ajustes-locales.js` ya lo dice.
//
// Esto no carga el editor: la memoria, la carpeta y el git se le pasan.

const fs = require('node:fs');
const path = require('node:path');
const ajustesLocales = require('./ajustes-locales');
const retirados = require('./retirados');

const CLAVE_RECHAZADO = 'executiveLab.deAlguienRechazado';
const OFERTAS = ['marcas', 'claude', 'codex'];

// Lo que escribió la barra en cada marca de la 161 que decide el equipo (`CALLAR`
// en `media/railes/aplicar.js`; una prueba exige que sigan siendo las mismas). La
// de esta máquina, `.no-scope-check`, no está: no viaja y la barra la deja en todas.
const MARCAS_DE_LA_BARRA = {
  '.no-audit': 'la revisión de habilidades es herramienta de quien mantiene esto, no del alumno\n',
  '.no-worktree-cleanup': 'un alumno no tiene worktrees, y el aviso lleva dos comandos\n',
  '.no-gitmoji': 'aquí se guarda en español y en frase: el guardián de gitmoji denegaría cada copia\n',
};

// ── Lo rechazado ─────────────────────────────────────────────────────────

const unObjeto = (x) => Boolean(x) && typeof x === 'object' && !Array.isArray(x);

function rechazadas(memoria, raiz) {
  try {
    const todo = memoria && memoria.get(CLAVE_RECHAZADO);
    const de = unObjeto(todo) && unObjeto(todo[raiz]) ? todo[raiz] : {};
    return new Set(OFERTAS.filter((cual) => de[cual] === true));
  } catch {
    // Si no se puede leer, mejor no insistir.
    return new Set(OFERTAS);
  }
}

async function rechazar(memoria, raiz, cual) {
  if (!memoria || !raiz || !OFERTAS.includes(cual)) return false;
  try {
    const todo = unObjeto(memoria.get(CLAVE_RECHAZADO)) ? memoria.get(CLAVE_RECHAZADO) : {};
    await memoria.update(CLAVE_RECHAZADO, { ...todo, [raiz]: { ...(unObjeto(todo[raiz]) ? todo[raiz] : {}), [cual]: true } });
    return true;
  } catch {
    return false;
  }
}

// ── Las marcas que apagó una barra de antes ──────────────────────────────

const esEnlace = (ruta) => { try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; } };

// Las que hay ahora y son de la barra: nombre del fichero, sin enlaces, y con su
// texto entero.
function marcasDeLaBarra(raiz) {
  const carpeta = path.join(raiz, '.rsc');
  if (esEnlace(carpeta)) return [];
  const hay = [];
  for (const [nombre, texto] of Object.entries(MARCAS_DE_LA_BARRA)) {
    const fichero = path.join(carpeta, nombre);
    try {
      if (esEnlace(fichero) || !fs.lstatSync(fichero).isFile() || fs.statSync(fichero).size > 4096) continue;
      if (fs.readFileSync(fichero, 'utf8') === texto) hay.push(nombre);
    } catch { /* no está */ }
  }
  return hay;
}

// Quita solo esas, y solo si siguen siendo de la barra en el momento de quitar
// (puede haberlas cambiado alguien mientras se miraba la pantalla).
function volverAEncender(raiz, nombres = null) {
  const sonDeLaBarra = marcasDeLaBarra(raiz);
  const quitadas = [];
  for (const nombre of sonDeLaBarra.filter((n) => !Array.isArray(nombres) || nombres.includes(n))) {
    try {
      fs.unlinkSync(path.join(raiz, '.rsc', nombre));
      quitadas.push(nombre);
    } catch { /* ya no estaba */ }
  }
  return { hecho: quitadas.length ? 'encendido' : 'nadaQueQuitar', quitadas };
}

// ── Lo de Claude, con su sí ──────────────────────────────────────────────

// `git`: (args) => Promise<{ codigo, salida }>, el de la barra. Sin él no se mira.
//
// El fichero de ajustes de esta persona no tiene que acabar en una copia por
// descuido: lo deja fuera Claude cuando lo crea él, pero aquí lo crea la barra, y
// la lista de lo que no entra en git (el bloque del `.gitignore`) no se pone en
// una carpeta de alguien sin su sí. Se deja fuera en `.git/info/exclude`, que es
// solo de este ordenador y no toca ningún fichero suyo ni viaja.
async function dejarFuera(raiz, git) {
  const info = path.join(raiz, '.git', 'info');
  const exclude = path.join(info, 'exclude');
  const lineas = ['/.claude/settings.local.json', '/.rsc/executive-lab-ajustes-locales.json'];
  try {
    if (!git || esEnlace(path.join(raiz, '.git')) || !fs.lstatSync(path.join(raiz, '.git')).isDirectory()) return 'sinGit';
    if (esEnlace(info) || esEnlace(exclude)) return 'enlace';
    const faltan = [];
    for (const linea of lineas) {
      const { codigo } = await git('check-ignore', '-q', '--', linea.slice(1));
      if (codigo === 1) faltan.push(linea);
    }
    if (!faltan.length) return 'yaEstaba';
    fs.mkdirSync(info, { recursive: true });
    const antes = fs.existsSync(exclude) ? fs.readFileSync(exclude, 'utf8') : '';
    fs.writeFileSync(exclude, `${antes}${antes && !antes.endsWith('\n') ? '\n' : ''}${faltan.join('\n')}\n`);
    return 'puesto';
  } catch {
    return 'fallo';
  }
}

// ── Qué se ofrece ────────────────────────────────────────────────────────

// { marcas, claude, codex }: cada uno, lo que se ofrecería, o null. Nada si la
// carpeta es de la barra (ahí se hace solo), o si ya se dijo que no. `aqui`: si
// la barra montó esta carpeta en este ordenador; `estaEnGit`: el de la barra;
// `codex`: la carpeta de Codex de esta persona, y `conCodex`: si usa Codex.
async function queSeOfrece({ raiz, memoria, aqui, estaEnGit, claude, codex, conCodex = false } = {}) {
  const nada = { marcas: null, claude: null, codex: null };
  if (!raiz || aqui) return nada;
  const no = rechazadas(memoria, raiz);
  const oferta = { ...nada };
  if (!no.has('marcas')) {
    const hay = marcasDeLaBarra(raiz);
    if (hay.length) oferta.marcas = { marcas: hay };
  }
  if (!no.has('claude')) {
    const mirado = await ajustesLocales.ponerLosDeLaBarra({ raiz, claude, estaEnGit, conSuSi: true, soloMirar: true }).catch(() => null);
    if (mirado && mirado.hecho === 'sePuede') oferta.claude = { idioma: mirado.idioma, preguntar: mirado.preguntar.length > 0 };
  }
  if (!no.has('codex') && conCodex) {
    const mirado = retirados.arreglar({ codex, raiz, soloLaCarpeta: true, soloMirar: true });
    const fila = mirado.find((h) => h.hecho === 'seArreglaria');
    if (fila) oferta.codex = { modelos: fila.modelos };
  }
  return oferta;
}

// Lo que hace el botón de Claude: con su sí, lo de la 157, y fuera de git.
async function ponerLoDeClaude({ raiz, claude, estaEnGit, git } = {}) {
  const hecho = await ajustesLocales.ponerLosDeLaBarra({ raiz, claude, estaEnGit, conSuSi: true });
  if (hecho.hecho === 'puesto') hecho.fuera = await dejarFuera(raiz, git);
  return hecho;
}

// Lo que hace el botón de Codex: solo el de esta carpeta, con copia.
function arreglarCodex({ raiz, codex } = {}) {
  return retirados.arreglar({ codex, raiz, soloLaCarpeta: true });
}

module.exports = {
  CLAVE_RECHAZADO, OFERTAS, MARCAS_DE_LA_BARRA,
  rechazadas, rechazar, marcasDeLaBarra, volverAEncender, dejarFuera, queSeOfrece, ponerLoDeClaude, arreglarCodex,
};
