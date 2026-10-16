// Lo que se deja puesto en los ajustes de usuario del editor, para que nadie
// tenga que tocar nada (decisión 163).
//
// Jose: *«que el instalador instale y configure todo para que el usuario no
// tenga que hacer mierdas […] La fricción del usuario debe ser MÍNIMA»*.
//
// Dos grupos, y la diferencia importa:
//
//   · DEL EDITOR: valen para todas las ventanas y cambian cómo se porta el
//     editor entero (la confianza, las actualizaciones, la página de
//     bienvenida). Solo los pone el instalador, en el ordenador del alumno. La
//     barra no los toca nunca: en el ordenador de quien usa el editor para otras
//     cosas, le cambiaría todas las ventanas (decisiones 15 y 71).
//   · DEL ASISTENTE: solo cambian la ventana de Claude o de Codex. Los pone el
//     instalador y, si faltan, la barra al arrancar, para quien solo instaló la
//     barra.
//
// Con cuidado, como el control remoto (decisión 143):
//
//   · lo que esa persona ya tenía decidido no se pisa (P4);
//   · cada clave se mira una vez por ordenador: si después la quita, no vuelve;
//   · y queda constancia al lado de sus ajustes, para que desinstalar quite solo
//     lo que pusimos y solo si sigue como lo dejamos.
//
// Lo usan los dos instaladores y la barra (copiado en `media/comun/`), y se
// puede correr suelto: `node ajustes-del-editor.js --quitar [--ajustes <fichero>]`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { escribirAjustes } = require('./ajustes');

const CONSTANCIA = '.executive-lab-ajustes.json';

// ── Del editor: solo el instalador ─────────────────────────────────────────
//
// Las fuentes y el porqué de cada una están en la decisión 163.
const DEL_EDITOR = {
  // Sin esto, cada carpeta nueva abre en modo restringido, y en ese modo ni
  // Claude ni Codex arrancan. Es de programa: no se puede poner por carpeta.
  'security.workspace.trust.enabled': false,
  'update.mode': 'none',
  'update.showReleaseNotes': false,
  'telemetry.telemetryLevel': 'off',
  'extensions.ignoreRecommendations': true,
  // El acceso directo abre el editor sin carpeta, y ahí lo primero que sale es
  // la página de bienvenida del editor. Por carpeta ya lo apaga la vista
  // sencilla; sin carpeta solo vale el de usuario.
  'workbench.startupEditor': 'none',
  // Al poner Claude o Codex con el editor abierto, se abría su guía de
  // primeros pasos. Es de máquina: por carpeta no hace nada.
  'workbench.welcomePage.walkthroughs.openOnInstall': false,
};

// Con Claude: cada botón de la barra le habla por su enlace, y el editor pide
// permiso la primera vez que una extensión abre el enlace de otra. Con esto no
// lo pide. Solo para la de Claude, y el enlace solo deja el texto escrito en su
// caja: lo manda la persona.
const DEL_EDITOR_CON_CLAUDE = {
  'extensions.confirmedUriHandlerExtensionIds': ['anthropic.claude-code'],
};

// ── Del asistente: el instalador y la barra ────────────────────────────────
const DE_CLAUDE = {
  // La vista enfocada: lo que le pides y lo que contesta, sin el trabajo de por
  // medio. Es de programa, así que en la carpeta no hacía nada.
  'claudeCode.focusView': true,
  // La lista de primeros pasos de Claude sale al entrar, antes de que haya
  // ninguna carpeta con la vista sencilla.
  'claudeCode.hideOnboarding': true,
};

// Solo si Codex es el único: con los dos, la barra ya abre el de la carpeta, y
// los dos a la vez es no saber con cuál hablar.
const DE_CODEX_SOLO = {
  'chatgpt.openOnStartup': true,
};

const ASISTENTES = ['claude', 'codex'];

// Con qué asistentes, según lo que se eligió: `claude`, `codex`, `losDos` o
// `automatico`. En automático, los que estén puestos (decisión 158).
function asistentesDe(valor, instalados = []) {
  if (valor === 'losDos') return [...ASISTENTES];
  if (ASISTENTES.includes(valor)) return [valor];
  return ASISTENTES.filter((a) => instalados.includes(a));
}

// Lo que toca poner para esos asistentes. `delEditor` solo lo pide el instalador.
function queToca(asistentes, { delEditor = false } = {}) {
  const conClaude = asistentes.includes('claude');
  const conCodex = asistentes.includes('codex');
  return {
    ...(delEditor ? DEL_EDITOR : {}),
    ...(delEditor && conClaude ? DEL_EDITOR_CON_CLAUDE : {}),
    ...(conClaude ? DE_CLAUDE : {}),
    ...(conCodex && !conClaude ? DE_CODEX_SOLO : {}),
  };
}

// Las que la barra puede poner: las del asistente, nunca las del editor.
const DE_LA_BARRA = Object.keys({ ...DE_CLAUDE, ...DE_CODEX_SOLO });
const DEL_INSTALADOR = Object.keys({ ...DEL_EDITOR, ...DEL_EDITOR_CON_CLAUDE });

// ── Leer los ajustes del editor, comentarios incluidos ─────────────────────
//
// El settings.json del editor admite comentarios y comas al final, y mucha gente
// los tiene. Para saber qué claves tiene se quitan las dos cosas, fuera de las
// cadenas, y se lee. Si ni así se entiende, devuelve null: no se toca.
function leerJsonc(texto) {
  if (!String(texto).trim()) return {};
  let sin = '';
  let dentro = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (dentro) {
      sin += c;
      if (c === '\\') { sin += texto[i + 1] || ''; i += 1; } else if (c === '"') dentro = false;
    } else if (c === '"') {
      dentro = true;
      sin += c;
    } else if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i += 1;
      sin += '\n';
    } else if (c === '/' && texto[i + 1] === '*') {
      const fin = texto.indexOf('*/', i + 2);
      if (fin === -1) return null;
      i = fin + 1;
    } else sin += c;
  }
  // Las comas que se quedan delante de un cierre, fuera de las cadenas.
  let limpio = '';
  dentro = false;
  for (let i = 0; i < sin.length; i += 1) {
    const c = sin[i];
    if (dentro) {
      limpio += c;
      if (c === '\\') { limpio += sin[i + 1] || ''; i += 1; } else if (c === '"') dentro = false;
    } else if (c === '"') {
      dentro = true;
      limpio += c;
    } else if (c === ',' && /^\s*[}\]]/.test(sin.slice(i + 1))) {
      // se salta
    } else limpio += c;
  }
  try {
    const datos = JSON.parse(limpio);
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : null;
  } catch {
    return null;
  }
}

const tiene = (objeto, clave) => Object.prototype.hasOwnProperty.call(objeto, clave);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── La constancia ──────────────────────────────────────────────────────────
//
// Al lado de los ajustes. `puestas` es lo que pusimos y con qué valor;
// `respetadas`, lo que ya tenía decidido. Lo que sale en una de las dos ya se
// miró y no se vuelve a mirar.
function leerConstancia(carpeta) {
  const fichero = path.join(carpeta, CONSTANCIA);
  if (!fs.existsSync(fichero)) return { puestas: {}, respetadas: [] };
  try {
    const datos = JSON.parse(fs.readFileSync(fichero, 'utf8'));
    const puestas = datos && datos.puestas && typeof datos.puestas === 'object' && !Array.isArray(datos.puestas) ? datos.puestas : null;
    const respetadas = datos && Array.isArray(datos.respetadas) ? datos.respetadas.filter((c) => typeof c === 'string') : null;
    return puestas && respetadas ? { puestas, respetadas } : null;
  } catch {
    return null;
  }
}

// Entero o nada: se escribe al lado y se cambia de golpe.
function escribirEntero(fichero, texto) {
  const temporal = `${fichero}.executive-lab-${process.pid}`;
  fs.writeFileSync(temporal, texto);
  try {
    fs.chmodSync(temporal, fs.statSync(fichero).mode);
  } catch { /* no había fichero */ }
  fs.renameSync(temporal, fichero);
}

function apuntar(carpeta, { puestas, respetadas }) {
  fs.mkdirSync(carpeta, { recursive: true });
  escribirEntero(path.join(carpeta, CONSTANCIA), `${JSON.stringify({
    queEs: 'Lo que Executive Lab puso en los ajustes del editor. Al desinstalar se quita solo eso, si sigue igual.',
    puestas,
    respetadas,
  }, null, 2)}\n`);
}

// ── Poner lo que falta ─────────────────────────────────────────────────────
//
// Lo mismo para el instalador, que escribe el fichero, y para la barra, que
// escribe por el editor. Cada uno dice cómo se sabe si una clave ya la tiene
// decidida (`laTiene`) y cómo se escribe (`escribir`, que devuelve las que ha
// podido poner, o null si no ha podido con nada).
async function ponerLoQueFalta({ carpeta, toca, laTiene, escribir }) {
  const constancia = leerConstancia(carpeta);
  if (!constancia) return { hecho: 'ilegible', puestas: [], respetadas: [] };

  const miradas = new Set([...Object.keys(constancia.puestas), ...constancia.respetadas]);
  const nuevas = Object.keys(toca).filter((c) => !miradas.has(c));
  if (!nuevas.length) return { hecho: 'nada', puestas: [], respetadas: [] };

  const respetadas = nuevas.filter((c) => laTiene(c));
  const faltan = nuevas.filter((c) => !respetadas.includes(c));
  const puestas = faltan.length ? await escribir(Object.fromEntries(faltan.map((c) => [c, toca[c]]))) : [];
  if (!puestas) return { hecho: 'ilegible', puestas: [], respetadas: [] };
  // Lo que no se ha podido escribir no se apunta: se mira otra vez la próxima.
  if (!puestas.length && !respetadas.length) return { hecho: 'nada', puestas, respetadas };

  apuntar(carpeta, {
    puestas: { ...constancia.puestas, ...Object.fromEntries(puestas.map((c) => [c, toca[c]])) },
    respetadas: [...constancia.respetadas, ...respetadas],
  });
  return { hecho: puestas.length ? 'puesto' : 'nada', puestas, respetadas };
}

// Dónde guarda el editor los ajustes de la persona.
function ficheroDeUsuario(entorno = process.env, plataforma = process.platform, casa = os.homedir()) {
  if (plataforma === 'win32') return path.join(entorno.APPDATA || path.join(casa, 'AppData', 'Roaming'), 'Code', 'User', 'settings.json');
  if (plataforma === 'darwin') return path.join(casa, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
  return path.join(entorno.XDG_CONFIG_HOME || path.join(casa, '.config'), 'Code', 'User', 'settings.json');
}

// El camino del instalador: en el fichero, sin pisar nada suyo.
async function ponerEnElFichero({ fichero = ficheroDeUsuario(), asistentes, delEditor = true, anotar = () => {} }) {
  let actuales = {};
  if (fs.existsSync(fichero)) {
    actuales = leerJsonc(fs.readFileSync(fichero, 'utf8'));
    if (!actuales) {
      anotar('AVISO: no entiendo los ajustes del editor; no los toco.');
      return { hecho: 'ilegible', puestas: [], respetadas: [], fichero };
    }
  }
  const hecho = await ponerLoQueFalta({
    carpeta: path.dirname(fichero),
    toca: queToca(asistentes, { delEditor }),
    laTiene: (clave) => tiene(actuales, clave),
    escribir: (nuevos) => {
      const r = escribirAjustes(fichero, nuevos, 'los ajustes del editor', anotar);
      return r.hecho === 'ilegible' ? null : r.claves;
    },
  });
  return { ...hecho, fichero };
}

// ── Quitar lo nuestro ──────────────────────────────────────────────────────
//
// Solo lo que dice la constancia, y solo si sigue con el valor que dejamos: si
// después lo cambió, es suyo. Con comentarios se quitan solo las líneas tal
// cual las escribimos; lo demás no se toca.
function laLinea(linea, clave, valor) {
  return linea.trim().replace(/,$/, '').trim() === `${JSON.stringify(clave)}: ${JSON.stringify(valor)}`;
}

function quitar({ fichero = ficheroDeUsuario() } = {}) {
  const carpeta = path.dirname(fichero);
  const marca = path.join(carpeta, CONSTANCIA);
  if (!fs.existsSync(marca)) return { hecho: 'noEraNuestro', quitadas: [] };
  const constancia = leerConstancia(carpeta);
  if (!constancia) return { hecho: 'ilegible', quitadas: [], fichero: marca };
  if (!fs.existsSync(fichero)) {
    fs.rmSync(marca, { force: true });
    return { hecho: 'yaNoEstaba', quitadas: [] };
  }

  const crudo = fs.readFileSync(fichero, 'utf8');
  const actuales = leerJsonc(crudo);
  if (!actuales) return { hecho: 'ilegible', quitadas: [], fichero };
  const nuestras = Object.keys(constancia.puestas).filter((c) => tiene(actuales, c) && igual(actuales[c], constancia.puestas[c]));

  let quitadas = [];
  if (nuestras.length) {
    let nuevo;
    try {
      const limpio = JSON.parse(crudo);
      for (const c of nuestras) delete limpio[c];
      nuevo = `${JSON.stringify(limpio, null, 2)}\n`;
      quitadas = nuestras;
    } catch {
      const fuera = new Set();
      nuevo = crudo.split('\n').filter((linea) => {
        const c = nuestras.find((k) => !fuera.has(k) && laLinea(linea, k, constancia.puestas[k]));
        if (!c) return true;
        fuera.add(c);
        return false;
      }).join('\n');
      quitadas = [...fuera];
    }
    if (quitadas.length) {
      fs.copyFileSync(fichero, `${fichero}.antes-de-desinstalar`);
      // Hay quien tiene sus ajustes en otro sitio y aquí un enlace: se escribe
      // en el suyo, sin cambiar el enlace por un fichero.
      escribirEntero(fs.realpathSync(fichero), nuevo);
    }
  }
  fs.rmSync(marca, { force: true });
  return { hecho: quitadas.length ? 'quitado' : 'yaNoEstaba', quitadas, fichero };
}

module.exports = {
  CONSTANCIA, DEL_EDITOR, DEL_EDITOR_CON_CLAUDE, DE_CLAUDE, DE_CODEX_SOLO, DE_LA_BARRA, DEL_INSTALADOR,
  asistentesDe, queToca, leerJsonc, leerConstancia, ponerLoQueFalta, ponerEnElFichero, quitar, ficheroDeUsuario,
};

if (require.main === module) {
  const i = process.argv.indexOf('--ajustes');
  const fichero = i !== -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : ficheroDeUsuario();
  if (process.argv.includes('--quitar')) {
    const hecho = quitar({ fichero });
    console.log(`ajustes del editor: ${hecho.hecho}${hecho.quitadas.length ? ` (${hecho.quitadas.length})` : ''}`);
  } else {
    console.log('Uso: node ajustes-del-editor.js --quitar [--ajustes <fichero>]');
  }
}
