// Lo que la barra deja en los ajustes de Claude de esta persona, en esta carpeta
// (decisión 157): `.claude/settings.local.json`.
//
// Ese fichero es de esta persona y de este ordenador. Claude lo deja fuera de git
// cuando lo crea él, pero aquí lo crean RSC (su memoria) y la barra, así que lo
// deja fuera la lista de lo que no entra en git (`no-entra-en-git.js`). Dos cosas,
// y solo si faltan:
//
//   · `"language": "español"`. Claude lo pasa tal cual, como la instrucción de
//     contestar siempre en ese idioma (code.claude.com/docs/en/settings-reference).
//     En la clase del 13-10 el asistente se puso a hablar en catalán. No se pone si
//     alguien ya ha dicho un idioma —aquí, en los ajustes de la carpeta o en los
//     suyos de usuario—, porque este fichero manda sobre los otros dos y lo pisaría.
//     Si uno de esos no se entiende, tampoco: no se sabe qué dice.
//   · `permissions.ask` con `Bash(git push *)` y `Bash(gh pr create *)`: que
//     pregunte siempre antes de subir a GitHub o de proponer allí un cambio. Sale
//     del ordenador en su nombre (P9), y en modo auto, con el que arranca Claude en
//     el editor si nadie dice otro, lo haría sin preguntar
//     (code.claude.com/docs/en/permission-modes). Un `ask` gana a cualquier
//     `allow`, también al que pone RSC con `gitPermissions`, y pregunta aunque la
//     orden vaya encadenada a otra (code.claude.com/docs/en/permissions). No es una
//     muralla: `git -C . push` no casa con la regla. Si esta persona ya la tiene
//     en `ask` o en `deny`, aquí o en sus ajustes de usuario, se respeta. Un
//     `allow` no cuenta: el `ask` le gana igual, y uno plantado en este fichero
//     bastaba para que no se pusiera nunca (revisión de seguridad de la 157, B5).
//   · Un enganche `Notification` (decisión 162) que llama a `avisar.mjs`, de la
//     habilidad de la casa: un aviso del sistema cuando Claude te pregunta algo
//     (`permission_prompt`) o ha terminado (`idle_prompt`), para quien se va a
//     otra ventana mientras trabaja (code.claude.com/docs/en/hooks). Como el
//     freno, con `node` a secas y la carpeta entre comillas: la forma sin shell
//     (`args`) pide un `node.exe` de verdad en Windows, y el relevo no lo es. No
//     se pone si esta persona ya tiene algún enganche `Notification`, aquí, en
//     los de la carpeta o en los suyos de usuario (ya se avisa a su manera), ni
//     si alguno apaga todos los enganches, ni si uno no se entiende, ni si el
//     guion no está todavía en la carpeta: llamaría a un fichero que no hay.
//
// Con el cuidado del control remoto (decisión 143, `control-remoto.js`):
//   · sin tocar nada más del fichero, y entero o nada, con sus permisos;
//   · si no se entiende como JSON, no se toca; ni a través de un enlace; ni si el
//     fichero está en git, porque entonces viaja y es del equipo;
//   · y se deja constancia de lo que se puso, en `.rsc/`, después de escribirlo:
//     «Quitarlo», en el aviso, o `node ajustes-locales.js --quitar <carpeta>`,
//     quita solo eso y solo si sigue como se dejó. Lo que se quita, a mano o así,
//     no se vuelve a poner.
//
// La constancia no se cree sin más (revisión de seguridad de la 157, M2): podría
// venir plantada en la carpeta. No entra en git (`no-entra-en-git.js`), lleva la
// huella de lo que dejó la barra y de la carpeta donde lo dejó, y solo nombra lo
// que la barra sabe poner: el español y sus dos reglas. Si la huella no casa, no
// se quita nada ni se da por nuestro. Y lo que está en git no se toca tampoco al
// quitar.
//
// Cuándo y en qué carpetas lo decide `arrancar.js`: al montar y, en las que ya
// estaban montadas, al abrir; y solo en las que la barra creó su historial (P4).
// Esto no carga el editor: se puede correr suelto.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const IDIOMA = 'español';
// Con el `*` al final, detrás de un espacio y como único comodín, la regla casa
// también con la orden pelada: `Bash(git push *)` pregunta por un `git push` sin
// nada más (code.claude.com/docs/en/permissions, «Wildcard patterns»).
const PREGUNTAR = ['Bash(git push *)', 'Bash(gh pr create *)'];
const FICHERO = ['.claude', 'settings.local.json'];
const CONSTANCIA = ['.rsc', 'executive-lab-ajustes-locales.json'];
// Lo que la barra sabe poner aquí, por su nombre: lo que se puede quitar por separado.
const LO_QUE_SE_PONE = ['idioma', 'preguntar', 'avisos'];

// Los avisos del sistema (decisión 162). La orden, como la del freno.
const AVISAR = ['.claude', 'skills', 'executive-lab', 'avisar.mjs'];
const ORDEN_DE_AVISAR = 'node "${CLAUDE_PROJECT_DIR}/.claude/skills/executive-lab/avisar.mjs" "${CLAUDE_PROJECT_DIR}"';
// Solo letras, `_` y `|`: Claude lo lee como dos nombres exactos.
const CUANDO_AVISAR = 'permission_prompt|idle_prompt';
// Segundos. El guion se corta antes él solo; esto es por si acaso.
const TOPE_DE_AVISAR = 10;
const elEngancheDeAvisar = () => ({ matcher: CUANDO_AVISAR, hooks: [{ type: 'command', command: ORDEN_DE_AVISAR, timeout: TOPE_DE_AVISAR }] });

const carpetaDeClaude = (entorno = process.env, casa = os.homedir()) => entorno.CLAUDE_CONFIG_DIR || path.join(casa, '.claude');

const esEnlace = (ruta) => { try { return fs.lstatSync(ruta).isSymbolicLink(); } catch { return false; } };
const tiene = (datos, clave) => Boolean(datos) && Object.prototype.hasOwnProperty.call(datos, clave);
const esUnObjeto = (x) => Boolean(x) && typeof x === 'object' && !Array.isArray(x);

// Un objeto; `{}` si no está; null si no se entiende.
function leer(fichero) {
  if (!fs.existsSync(fichero)) return {};
  try {
    const texto = fs.readFileSync(fichero, 'utf8');
    // Vacío, o con solo espacios, es que no dice nada todavía.
    if (!texto.trim()) return {};
    const datos = JSON.parse(texto);
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : null;
  } catch {
    return null;
  }
}

// `Bash(git push:*)` y `Bash(git push *)` son la misma regla para Claude.
const mismaRegla = (a, b) => typeof a === 'string' && a.replace(/:\*\)$/, ' *)') === b;

// Lo que unos ajustes dicen de una regla: 'deny', 'ask', 'allow' o null.
function queDice(ajustes, regla) {
  const permisos = ajustes && ajustes.permissions;
  if (!permisos || typeof permisos !== 'object') return null;
  for (const cual of ['deny', 'ask', 'allow']) {
    if (Array.isArray(permisos[cual]) && permisos[cual].some((r) => mismaRegla(r, regla))) return cual;
  }
  return null;
}

// Si ya está decidido que pregunte o que no se haga. Un `allow` no lo decide: el
// `ask` le gana de todos modos.
const yaLoDice = (ajustes, regla) => ['deny', 'ask'].includes(queDice(ajustes, regla));

// La huella de lo que dejó la barra, atada a la carpeta donde lo dejó: una
// constancia traída de otro sitio no casa. Los avisos solo entran si están, así
// que una constancia de la 157 sigue casando.
function laHuella(raiz, { language = null, ask = [], avisos = false } = {}) {
  let donde = raiz;
  try { donde = fs.realpathSync(raiz); } catch { /* la que hay */ }
  const que = JSON.stringify({ donde, language, ask: [...ask].sort(), ...(avisos ? { avisos: true } : {}) });
  return crypto.createHash('sha256').update(que).digest('hex');
}

// La constancia, solo si es de verdad nuestra: lo que la barra sabe poner y con
// su huella. Si no, null, y no cuenta para nada.
function laConstancia(raiz) {
  const anotado = leer(path.join(raiz, ...CONSTANCIA));
  if (!anotado || typeof anotado.huella !== 'string') return null;
  const ask = Array.isArray(anotado.ask) ? anotado.ask : [];
  if (!ask.every((r) => PREGUNTAR.includes(r)) || ![undefined, IDIOMA].includes(anotado.language)) return null;
  if (![undefined, true].includes(anotado.avisos)) return null;
  const nuestro = { language: anotado.language || null, ask, avisos: anotado.avisos === true };
  return anotado.huella === laHuella(raiz, nuestro) ? nuestro : null;
}

// El enganche de los avisos tal como lo deja la barra. Si alguien lo ha cambiado,
// ya es suyo: ni se quita ni se da por puesto.
function esElDeAvisar(grupo) {
  if (!esUnObjeto(grupo) || grupo.matcher !== CUANDO_AVISAR || !Array.isArray(grupo.hooks) || grupo.hooks.length !== 1) return false;
  if (Object.keys(grupo).length !== 2) return false;
  const [orden] = grupo.hooks;
  return esUnObjeto(orden) && Object.keys(orden).length === 3
    && orden.type === 'command' && orden.command === ORDEN_DE_AVISAR && orden.timeout === TOPE_DE_AVISAR;
}

// Lo que unos ajustes dicen de los avisos: 'nada', 'algo' (algún enganche
// `Notification`, o todos apagados) o 'raro' (no se entiende cómo están).
function queDicenDeAvisar(ajustes) {
  if (!ajustes) return 'raro';
  if (ajustes.disableAllHooks === true) return 'algo';
  if (ajustes.hooks === undefined) return 'nada';
  if (!esUnObjeto(ajustes.hooks)) return 'raro';
  const avisos = ajustes.hooks.Notification;
  if (avisos === undefined) return 'nada';
  if (!Array.isArray(avisos)) return 'raro';
  return avisos.length ? 'algo' : 'nada';
}

// Entero o nada: se escribe al lado y se cambia de golpe, con los permisos que
// tenía, porque Claude lo vigila y lo vuelve a leer en cuanto cambia.
function escribir(fichero, datos) {
  const temporal = `${fichero}.executive-lab-${process.pid}`;
  fs.writeFileSync(temporal, `${JSON.stringify(datos, null, 2)}\n`, { flag: 'wx' });
  try {
    try {
      fs.chmodSync(temporal, fs.statSync(fichero).mode);
    } catch { /* no había fichero */ }
    fs.renameSync(temporal, fichero);
  } catch (error) {
    fs.rmSync(temporal, { force: true });
    throw error;
  }
}

// Si el fichero está en git, con un git a secas. La barra le pasa el suyo, que no
// corre el `fsmonitor` de nadie y no abre el diálogo de Apple. `null`: no se sabe.
function enGitASecas(raiz, relativo) {
  if (!fs.existsSync(path.join(raiz, '.git'))) return false;
  try {
    const salida = require('node:child_process').execFileSync('git', ['-c', 'core.fsmonitor=false', 'ls-files', '--', relativo], {
      cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, windowsHide: true,
    });
    return Boolean(salida.trim());
  } catch {
    return null;
  }
}

// Lo que haría falta poner, sin poner nada: { idioma, preguntar, avisos }.
// `conGuion`: si `avisar.mjs` ya está en la carpeta.
function loQueFalta({ local, deLaCarpeta, suyos, conGuion = false }) {
  const idioma = !tiene(local, 'language') && Boolean(deLaCarpeta) && !tiene(deLaCarpeta, 'language')
    && Boolean(suyos) && !tiene(suyos, 'language');
  // Unos permisos con otra forma no se entienden: no se tocan.
  const permisos = local.permissions;
  const seEntienden = permisos === undefined
    || (permisos && typeof permisos === 'object' && !Array.isArray(permisos) && (permisos.ask === undefined || Array.isArray(permisos.ask)));
  const preguntar = seEntienden ? PREGUNTAR.filter((regla) => !yaLoDice(local, regla) && !yaLoDice(suyos, regla)) : [];
  // Los avisos, solo si nadie dice nada de ellos en ninguno de los tres sitios.
  const avisos = conGuion && [local, deLaCarpeta, suyos].every((ajustes) => queDicenDeAvisar(ajustes) === 'nada');
  return { idioma, preguntar, avisos };
}

// `conSuSi` (decisión 177): en una carpeta de alguien, a quien la barra no le pone
// nada sola, lo pide esa persona con su botón. Mismas guardas, sin excepción;
// solo se pone lo que el botón cuenta, el español y que pregunte antes de subir
// (los avisos del sistema son otra cosa y no entran), y la constancia lo dice.
// `soloMirar`: no escribe nada, dice qué haría (`sePuede`) para poder ofrecerlo.
async function ponerLosDeLaBarra({ raiz, claude = carpetaDeClaude(), estaEnGit = enGitASecas, conSuSi = false, soloMirar = false } = {}) {
  if (!raiz) return { hecho: 'sinCarpeta' };
  const declaracion = leer(path.join(raiz, '.rsc.json'));
  if (!declaracion || !Array.isArray(declaracion.targets) || !declaracion.targets.includes('claude')) return { hecho: 'noEsParaClaude' };

  const carpeta = path.join(raiz, '.claude');
  const fichero = path.join(raiz, ...FICHERO);
  const constancia = path.join(raiz, ...CONSTANCIA);
  if ([carpeta, fichero, path.dirname(constancia), constancia].some(esEnlace)) return { hecho: 'enlace', fichero };
  let hayCarpeta = false;
  try { hayCarpeta = fs.lstatSync(carpeta).isDirectory(); } catch { /* no está */ }
  if (!hayCarpeta) return { hecho: 'noEsParaClaude' };

  const enGit = await estaEnGit(raiz, FICHERO.join('/'));
  if (enGit !== false) return { hecho: enGit ? 'enGit' : 'sinSaber', fichero };

  const local = leer(fichero);
  if (!local) return { hecho: 'ilegible', fichero };
  // Lo que la barra ya puso alguna vez y ya no está, lo quitó esta persona (a
  // mano o con «Quitarlo»): se respeta, y no se vuelve a poner en cada apertura
  // (revisión de corrección de la 157, M2). De la constancia solo cuenta lo que
  // tiene su huella.
  const antes = laConstancia(raiz) || { language: null, ask: [], avisos: false };
  // El guion, de verdad un fichero de la carpeta: sin él, cada aviso fallaría.
  const guion = path.join(raiz, ...AVISAR);
  let conGuion = false;
  // Y ningún tramo del camino es un enlace: uno en `skills/` daría por bueno un guion de fuera.
  const tramos = AVISAR.slice(1, -1).map((_, i) => path.join(raiz, ...AVISAR.slice(0, i + 2)));
  try { conGuion = !tramos.some(esEnlace) && fs.lstatSync(guion).isFile(); } catch { /* todavía no está */ }
  const sinQuitar = loQueFalta({
    local, deLaCarpeta: leer(path.join(carpeta, 'settings.json')), suyos: leer(path.join(claude, 'settings.json')), conGuion,
  });
  const falta = {
    idioma: sinQuitar.idioma && !antes.language,
    preguntar: sinQuitar.preguntar.filter((r) => !antes.ask.includes(r)),
    avisos: sinQuitar.avisos && !antes.avisos && !conSuSi,
  };
  if (!falta.idioma && !falta.preguntar.length && !falta.avisos) return { hecho: 'yaEstaba', fichero };
  if (soloMirar) return { hecho: 'sePuede', fichero, idioma: falta.idioma, preguntar: falta.preguntar, avisos: false };

  try {
    const nuevo = { ...local };
    if (falta.idioma) nuevo.language = IDIOMA;
    if (falta.preguntar.length) {
      const permisos = local.permissions || {};
      nuevo.permissions = { ...permisos, ask: [...(permisos.ask || []), ...falta.preguntar] };
    }
    if (falta.avisos) {
      const enganches = local.hooks || {};
      nuevo.hooks = { ...enganches, Notification: [...(enganches.Notification || []), elEngancheDeAvisar()] };
    }
    escribir(fichero, nuevo);
    // Después del fichero: si no se escribe, no hay constancia. Y con lo de antes,
    // para que lo que se quitó siga contando como quitado.
    const anotado = {
      language: falta.idioma || antes.language ? IDIOMA : null,
      ask: PREGUNTAR.filter((r) => falta.preguntar.includes(r) || antes.ask.includes(r)),
      avisos: falta.avisos || antes.avisos,
    };
    fs.mkdirSync(path.dirname(constancia), { recursive: true });
    escribir(constancia, {
      porQue: conSuSi
        ? 'Lo puso la barra de Executive Lab porque lo pidió esta persona con su botón (decisión 177). Al quitarlo, solo se quita lo que sigue como lo dejó.' // diccionario: interno
        : 'Lo puso la barra de Executive Lab (decisiones 157 y 162). Al quitarlo, solo se quita lo que sigue como lo dejó.', // diccionario: interno
      ...(anotado.language ? { language: anotado.language } : {}),
      ask: anotado.ask,
      ...(anotado.avisos ? { avisos: true } : {}),
      huella: laHuella(raiz, anotado),
    });
  } catch (error) {
    return { hecho: 'fallo', fichero, error: error.message };
  }
  return { hecho: 'puesto', fichero, idioma: falta.idioma, preguntar: falta.preguntar, avisos: falta.avisos };
}

// Lo que se puso en una vez, por su nombre, para que «Quitarlo» quite eso y nada más.
const loQueSePuso = ({ idioma = false, preguntar = [], avisos = false } = {}) => [
  ...(idioma ? ['idioma'] : []), ...(preguntar.length ? ['preguntar'] : []), ...(avisos ? ['avisos'] : []),
];

// Solo lo que puso la barra (la constancia, con su huella) y sigue como lo dejó:
// si después lo cambió, es suyo. Y nada si el fichero está en git. Lo quitado no
// vuelve: la constancia se queda y dice que la barra ya lo puso una vez.
//
// `que`: de lo que se pone, qué se quita ('idioma', 'preguntar', 'avisos'). Sin
// él, todo. El «Quitarlo» de un aviso quita lo que ese aviso cuenta: el de los
// avisos del sistema no se lleva el español que se puso otro día.
async function quitarLosDeLaBarra({ raiz, estaEnGit = enGitASecas, que = null } = {}) {
  if (!raiz) return { hecho: 'sinCarpeta' };
  const constancia = path.join(raiz, ...CONSTANCIA);
  const fichero = path.join(raiz, ...FICHERO);
  if ([path.join(raiz, '.claude'), fichero, path.dirname(constancia), constancia].some(esEnlace)) return { hecho: 'enlace', fichero };
  if (!fs.existsSync(constancia)) return { hecho: 'noEraNuestro' };
  const anotado = laConstancia(raiz);
  if (!anotado) return { hecho: 'noCasa', fichero };
  const enGit = await estaEnGit(raiz, FICHERO.join('/'));
  if (enGit !== false) return { hecho: enGit ? 'enGit' : 'sinSaber', fichero };
  const local = leer(fichero);
  if (!local) return { hecho: 'ilegible', fichero };

  const quitar = new Set(Array.isArray(que) ? que.filter((q) => LO_QUE_SE_PONE.includes(q)) : LO_QUE_SE_PONE);
  const nuevo = { ...local };
  let quitado = false;
  if (quitar.has('idioma') && anotado.language && nuevo.language === anotado.language) {
    delete nuevo.language;
    quitado = true;
  }
  const nuestras = quitar.has('preguntar') && Array.isArray(anotado.ask) ? anotado.ask : [];
  const permisos = nuevo.permissions;
  if (nuestras.length && permisos && typeof permisos === 'object' && Array.isArray(permisos.ask)) {
    const ask = permisos.ask.filter((r) => !nuestras.includes(r));
    if (ask.length !== permisos.ask.length) {
      quitado = true;
      const { ask: _nuestras, ...resto } = permisos;
      nuevo.permissions = ask.length ? { ...resto, ask } : resto;
      if (!Object.keys(nuevo.permissions).length) delete nuevo.permissions;
    }
  }
  // El enganche de los avisos, solo si sigue tal como lo dejó la barra.
  const enganches = nuevo.hooks;
  if (quitar.has('avisos') && anotado.avisos && esUnObjeto(enganches) && Array.isArray(enganches.Notification)) {
    const avisos = enganches.Notification.filter((grupo) => !esElDeAvisar(grupo));
    if (avisos.length !== enganches.Notification.length) {
      quitado = true;
      const { Notification: _nuestro, ...resto } = enganches;
      nuevo.hooks = avisos.length ? { ...resto, Notification: avisos } : resto;
      if (!Object.keys(nuevo.hooks).length) delete nuevo.hooks;
    }
  }
  if (quitado) escribir(fichero, nuevo);
  // La constancia se queda: es lo que dice después que se quitó a propósito, y que
  // no se vuelve a poner al abrir.
  return { hecho: quitado ? 'quitado' : 'yaNoEstaba', fichero };
}

// La frase de lo que se puso (P9: lo que se hace solo se dice).
function laFrase({ idioma = false, preguntar = [], avisos = false } = {}) {
  const cosas = [
    idioma ? 'hablándote en español' : null,
    preguntar.length ? 'preguntándote antes de subir nada a GitHub' : null,
    avisos ? 'avisándote cuando termine o te necesite, aunque estés en otra ventana' : null,
  ].filter(Boolean);
  if (!cosas.length) return null;
  const dichas = cosas.length < 2 ? cosas[0] : `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}`;
  return `He dejado a Claude ${dichas}.`;
}

module.exports = {
  IDIOMA, PREGUNTAR, FICHERO, CONSTANCIA, LO_QUE_SE_PONE, AVISAR, ORDEN_DE_AVISAR, CUANDO_AVISAR,
  carpetaDeClaude, ponerLosDeLaBarra, quitarLosDeLaBarra, laFrase, loQueSePuso, queDice, laHuella, esElDeAvisar,
};

// `--quitar` quita todo lo de la barra; con `--solo=avisos` (o `idioma`,
// `preguntar`, separados por comas), solo eso.
if (require.main === module) {
  const args = process.argv.slice(2);
  const raiz = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
  const solo = (args.find((a) => a.startsWith('--solo=')) || '').slice('--solo='.length).split(',').filter(Boolean);
  const hacer = args.includes('--quitar') ? () => quitarLosDeLaBarra({ raiz, que: solo.length ? solo : null }) : () => ponerLosDeLaBarra({ raiz });
  hacer().then((hecho) => console.log(`ajustes de Claude de esta carpeta: ${hecho.hecho}`)); // diccionario: interno
}
