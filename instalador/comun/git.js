// Comprobar si hay git, y ponerlo cuando no lo hay.
//
// Vive aquí, en comun/, porque lo usan los dos: `preparar.js` al montar la
// carpeta desde el instalador, y la barra lateral cuando alguien instaló solo
// la extensión. Mismo sitio y misma razón que historial.js.
//
// ── Por qué git es obligatorio ───────────────────────────────────────────
//
// Durante un tiempo se trató como opcional: si no estaba, las copias de
// seguridad se hacían con una biblioteca de JavaScript que viajaba dentro. Era
// mentira por dos sitios. Primero, montar la carpeta hace `git init` antes que
// nada y aborta si falla. Y segundo, el arnés usa git por su cuenta —
// `git check-ignore` al instalar, los verify.sh de varias habilidades, y el
// registro de continuación, que se indexa por rama y por HEAD—. Sin git el
// arnés funcionaba a medias y sin decirlo.
//
// ── Por qué no lo llevamos dentro ────────────────────────────────────────
//
// Un git empaquetado solo lo ve quien lo invoque por su sitio exacto, y los
// scripts del arnés lo llaman por nombre. Hace falta un git instalado de
// verdad. Así que no distribuimos ninguno: se lanza el instalador oficial de
// cada sistema, que además está firmado por quien lo hace y no por nosotros.

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');

const ES_WINDOWS = process.platform === 'win32';
const ES_MAC = process.platform === 'darwin';

// Dónde vive un git de verdad en un Mac. `/usr/bin/git` NO está en la lista a
// propósito: existe SIEMPRE, también donde git no está instalado, y al
// invocarlo abre el diálogo de las herramientas de línea de comandos de Apple.
// Para comprobar no se ejecuta nunca; se mira el disco y se le pregunta a
// `xcode-select -p`, que responde sin abrir nada.
const GITS_DE_MAC = [
  '/Library/Developer/CommandLineTools/usr/bin/git',
  '/opt/homebrew/bin/git',
  '/usr/local/bin/git',
  '/usr/local/git/bin/git',
];

// La última versión estable de Git para Windows, preguntada a su propio
// proyecto. Aquí la versión no va clavada como la del arnés: git no cambia lo
// que el alumno ve, y fijarla significaría repartir uno viejo durante meses.
const ULTIMO_DE_WINDOWS = 'https://api.github.com/repos/git-for-windows/git/releases/latest';

// Solo el instalador de 64 bits. `PortableGit-…7z.exe` y `MinGit-…zip` quedan
// fuera: son copias que se descomprimen, y una copia es justo lo que no sirve.
const ES_EL_INSTALADOR = /^Git-[\d.]+-64-bit\.exe$/;

// Sin ruido y sin preguntas: así sale, sin ninguna ventana suya. Pero Windows sí
// puede preguntar (decisión 165). Aquí ponía que, «al no elevar», se instalaba
// para este usuario sin pedir administrador, y no es así:
//
//   · su `install.iss` lleva `PrivilegesRequired=none` y ningún
//     `PrivilegesRequiredOverridesAllowed`, así que `/CURRENTUSER` no hace nada;
//   · con una cuenta del grupo de administradores, que es la de casi cualquier
//     portátil de casa o de una pyme, pide elevarse: sale el aviso de Windows
//     («¿Quieres permitir que esta aplicación haga cambios?»). Si se le dice que
//     no, sale con el código 2 (winget-pkgs #369735, mayo de 2026);
//   · instalar solo para el usuario aunque sea administrador lo pidieron en
//     git-for-windows/git #4758, y se cerró sin hacerlo en diciembre de 2025.
//
// Con una cuenta sin permisos no pide nada, y su carpeta de siempre, la de
// Program Files, no se puede escribir. A mano, su propio instalador cambia
// entonces a `{userpf}\Git` (`%LOCALAPPDATA%\Programs\Git`). En silencio no hay
// esa página, así que se le dice con `/DIR`.
const EN_SILENCIO = ['/VERYSILENT', '/NORESTART', '/NOCANCEL', '/SP-', '/SUPPRESSMSGBOXES'];

// Inno sale con 2 cuando se cancela antes de empezar, y eso es lo que pasa al
// decirle que no al aviso de Windows.
const LE_DIJO_QUE_NO = 2;

// El grupo de administradores, por su SID, que no cambia con el idioma.
const ADMINISTRADORES = 'S-1-5-32-544';

// Dónde deja git su instalador en Windows: para todos, o solo para este
// usuario si no es administrador. `cmd\` es lo que pone en el PATH, pero el
// PATH de un programa que ya estaba abierto —el editor, la barra— es el de
// cuando arrancó: un git recién puesto no se ve por su nombre hasta reiniciar.
// Por eso se busca aquí, por su sitio.
function gitsDeWindows(entorno = process.env) {
  const local = entorno.LOCALAPPDATA || path.win32.join(entorno.USERPROFILE || os.homedir(), 'AppData', 'Local');
  return [
    path.win32.join(entorno.ProgramFiles || 'C:\\Program Files', 'Git', 'cmd', 'git.exe'),
    path.win32.join(local, 'Programs', 'Git', 'cmd', 'git.exe'),
  ];
}

// Lo que se le pasa a su instalador: en silencio, y, sin administrador, la
// carpeta de este usuario.
function comoSeLanza({ administrador = true, entorno = process.env } = {}) {
  if (administrador) return [...EN_SILENCIO];
  const local = entorno.LOCALAPPDATA || path.win32.join(entorno.USERPROFILE || os.homedir(), 'AppData', 'Local');
  return [...EN_SILENCIO, `/DIR=${path.win32.join(local, 'Programs', 'Git')}`];
}

const CADA = 5000;
const ESPERA_MAC = 45 * 60 * 1000;
const ESPERA_WINDOWS = 20 * 60 * 1000;

// El código de salida va aparte: el de su instalador dice si se le dijo que no.
function correr(programa, args, tiempoMaximo = 20000) {
  return new Promise((resolver) => {
    const proceso = execFile(programa, args, { encoding: 'utf8', timeout: tiempoMaximo, windowsHide: true },
      (error, salida) => resolver({
        ok: !error,
        salida: (salida || '').trim(),
        codigo: !error ? 0 : (typeof error.code === 'number' ? error.code : null),
      }));
    proceso.on('error', () => resolver({ ok: false, salida: '', codigo: null }));
  });
}

// Lo que dice `whoami /groups`. Sin poder saberlo, como si lo fuera: es lo que
// se hacía hasta ahora, y su instalador elige solo.
const esDelGrupoDeAdministradores = (grupos) => !grupos || !grupos.ok || String(grupos.salida || '').includes(ADMINISTRADORES);

async function esAdministrador() {
  return esDelGrupoDeAdministradores(await correr('whoami', ['/groups', '/fo', 'csv', '/nh']));
}

// Qué hacer cuando su instalador termina: si git ya se ve, listo; si se le dijo
// que no al aviso de Windows, decirlo; si no, esperar un poco a que se vea.
function trasElInstalador(lanzado, yaSeVe) {
  if (yaSeVe) return 'listo';
  if (lanzado && lanzado.codigo === LE_DIJO_QUE_NO) return 'sinPermiso';
  return 'esperar';
}

// ------------------------------------------------------------ comprobar

async function hayEnMac(opciones = {}) {
  const suyo = opciones.git && path.isAbsolute(opciones.git) ? [opciones.git] : [];
  if ([...suyo, ...GITS_DE_MAC].some((donde) => fs.existsSync(donde))) return true;

  const dev = await correr('/usr/bin/xcode-select', ['-p']);
  return Boolean(dev.ok && dev.salida && fs.existsSync(path.join(dev.salida, 'usr', 'bin', 'git')));
}

// En Windows y en Linux preguntar es gratis: no hay ningún señuelo que disparar.
// En Windows, además, se mira dónde lo deja su instalador: recién puesto, por su
// nombre no se ve (`gitsDeWindows`).
// Un git de Windows a medias —el instalador copia `cmd\\git.exe` antes que el
// resto— se ve por su sitio pero no sirve: solo vale con el git de verdad al lado,
// en `<carpeta>\\bin\\git.exe`. La carpeta cambia con la versión (`mingw64`,
// `ucrt64`, `clangarm64`…: con una fija, la 2.56 no se daba nunca por puesta), así
// que vale cualquiera menos `cmd` y `bin`, que solo llevan lanzadores.
// `existe` y `listar` son para la prueba.
const SOLO_LANZADORES = new Set(['cmd', 'bin']);
const listarCarpeta = (carpeta) => { try { return fs.readdirSync(carpeta); } catch { return []; } };
function buscarGitDeWindows(entorno = process.env, existe = fs.existsSync, listar = listarCarpeta) {
  const puestos = gitsDeWindows(entorno).filter((donde) => existe(donde));
  const entero = (donde) => {
    const raiz = path.win32.dirname(path.win32.dirname(donde));
    return listar(raiz).some((dentro) => !SOLO_LANZADORES.has(String(dentro).toLowerCase())
      && existe(path.win32.join(raiz, dentro, 'bin', 'git.exe')));
  };
  const completo = puestos.find(entero);
  return { completo: completo || null, aMedias: !completo && puestos.length > 0 };
}

async function hayEnElResto(opciones = {}) {
  let porSuSitio = null;
  if (ES_WINDOWS && !opciones.git) {
    const buscado = buscarGitDeWindows();
    if (buscado.aMedias) return false;
    porSuSitio = buscado.completo;
  }
  const cual = opciones.git || porSuSitio || (ES_WINDOWS ? 'git.exe' : 'git');
  return (await correr(cual, ['--version'])).ok;
}

const hay = (opciones) => (ES_MAC ? hayEnMac(opciones) : hayEnElResto(opciones));

// ------------------------------------------------------------- instalar

// Cómo acabó, además de en palabras, en una marca: la barra lo cuenta a su
// manera al preparar una carpeta (decisión 165), y el instalador, con estas.
const NO_SE_PUDO = 'No he podido descargar git. Mira que haya conexión y vuelve a intentarlo.';
const TARDA_DEMASIADO = 'Se está haciendo muy largo. Déjalo terminar y vuelve a abrir esto dentro de un rato.';
const SIN_SU_PERMISO = 'No se ha puesto git: Windows necesitaba tu permiso. Vuelve a intentarlo y dile que sí.';

async function esperarA(cuanto, opciones, avisar) {
  const hasta = Date.now() + cuanto;
  while (Date.now() < hasta) {
    await new Promise((sigue) => { setTimeout(sigue, CADA); });
    if (await hay(opciones)) return { ok: true };
  }
  avisar(TARDA_DEMASIADO);
  return { ok: false, mensaje: TARDA_DEMASIADO, tarda: true };
}

// macOS. `xcode-select --install` vuelve enseguida: el diálogo es de Apple y va
// por su cuenta, así que lo único que se puede hacer es esperar a que aparezca
// el git. Devuelve error cuando ya estaba, caso que aquí no puede darse.
async function instalarEnMac(opciones, avisar) {
  avisar('Tu ordenador te va a pedir permiso para instalar git. Dile que sí y espera: puede tardar un buen rato.');
  await correr('/usr/bin/xcode-select', ['--install'], 30000);
  return esperarA(ESPERA_MAC, opciones, avisar);
}

// Se ejecuta con permisos de administrador, así que antes de lanzarlo se
// comprueba su huella (sha256) con la que da GitHub para ese fichero. Sin huella
// o con otra distinta, no se ejecuta (falla cerrado). Se baja a una carpeta
// nueva, no a una ruta fija de %TEMP% que otro programa pudiera haber preparado.
// `traer` es para la prueba.
async function bajarElInstalador(traer = fetch) {
  const respuesta = await traer(ULTIMO_DE_WINDOWS, { headers: { Accept: 'application/vnd.github+json' } });
  if (!respuesta.ok) return null;

  const cual = ((await respuesta.json()).assets || []).find((a) => ES_EL_INSTALADOR.test(a.name));
  const esperada = cual && /^sha256:([0-9a-f]{64})$/i.exec(String(cual.digest || ''));
  if (!esperada) return null;

  const datos = await traer(cual.browser_download_url);
  if (!datos.ok) return null;

  const contenido = Buffer.from(await datos.arrayBuffer());
  if (crypto.createHash('sha256').update(contenido).digest('hex') !== esperada[1].toLowerCase()) return null;

  const fichero = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'git-')), cual.name);
  fs.writeFileSync(fichero, contenido);
  return fichero;
}

async function instalarEnWindows(opciones, avisar) {
  avisar('Descargando git…');

  let instalador = null;
  try {
    instalador = await bajarElInstalador();
  } catch { /* sin red, o GitHub caído: se trata igual que no encontrarlo */ }

  if (!instalador) {
    avisar(NO_SE_PUDO);
    return { ok: false, mensaje: NO_SE_PUDO, sinDescargar: true };
  }

  avisar('Instalando git. Si Windows te pide permiso, dile que sí.');
  const lanzado = await correr(instalador, comoSeLanza({ administrador: await esAdministrador() }), ESPERA_WINDOWS);

  // Lo que importa es si el git aparece, y en Windows tarda un momento en quedar
  // visible. Solo si se le dijo que no al aviso de Windows no se espera: no va a
  // aparecer, y esperar un minuto para acabar en «se está haciendo muy largo»
  // no dice qué ha pasado.
  const ahora = trasElInstalador(lanzado, await hay(opciones));
  if (ahora === 'listo') return { ok: true };
  if (ahora === 'sinPermiso') {
    avisar(SIN_SU_PERMISO);
    return { ok: false, mensaje: SIN_SU_PERMISO, sinPermiso: true };
  }
  return esperarA(60000, opciones, avisar);
}

async function instalar(opciones = {}, avisar = () => {}) {
  if (await hay(opciones)) return { ok: true, yaEstaba: true };
  if (ES_WINDOWS) return instalarEnWindows(opciones, avisar);
  if (ES_MAC) return instalarEnMac(opciones, avisar);

  const aMano = 'Pídesela a tu tutor: se llama git.';
  avisar(aMano);
  return { ok: false, mensaje: aMano };
}

// Lo que se enseña antes de pulsar. Cambia con el sistema porque lo que va a
// pasar al pulsar también cambia.
function comoSeInstala() {
  // Prometía que no iba a pedir nada, y con una cuenta de administrador Windows
  // pregunta (ver EN_SILENCIO; decisión 165).
  if (ES_WINDOWS) return 'La descargo y la instalo yo. Tarda un par de minutos, y si Windows te pide permiso, dile que sí.';
  if (ES_MAC) return 'Tu ordenador te la instala. Te pedirá permiso y tarda un buen rato la primera vez.';
  return 'Pídesela a tu tutor: se llama git.';
}

const sePuedeInstalarSolo = () => ES_WINDOWS || ES_MAC;

module.exports = {
  hay, instalar, comoSeInstala, sePuedeInstalarSolo, GITS_DE_MAC,
  // Lo de Windows, también para las pruebas, que corren en un Mac (decisión 165).
  gitsDeWindows, buscarGitDeWindows, bajarElInstalador, comoSeLanza, esDelGrupoDeAdministradores, trasElInstalador, correr, EN_SILENCIO, LE_DIJO_QUE_NO, ADMINISTRADORES,
};
