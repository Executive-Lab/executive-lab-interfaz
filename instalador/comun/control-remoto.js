// El control remoto de Claude, puesto para todas las sesiones (decisión 143).
//
// Jose: *«que automáticamente se ponga el control remoto para todas las
// sesiones, igual que hemos hecho con el focus view»*. Con él, una conversación
// abierta en el ordenador se sigue desde claude.ai o desde el móvil.
//
// No es un ajuste del editor, como `claudeCode.focusView`: es de Claude Code,
// `remoteControlAtStartup`, y Claude solo le hace caso en los ajustes de la
// persona —`~/.claude/settings.json`—: *«a project or local `true` is
// ignored»* (code.claude.com/docs/en/settings). Así que va ahí, y con cuidado:
//
//   · sin tocar nada más del fichero, y sin dejarlo a medias si algo falla;
//   · si ya dice algo, sí o no, se respeta: es una decisión suya;
//   · si no se puede leer como JSON, no se toca;
//   · y se deja una marca al lado, para que desinstalar quite solo lo que
//     pusimos nosotros.
//
// Necesita un plan de pago y la cuenta de claude.ai; sin eso, Claude lo ignora.
// La carpeta es la que use Claude: `CLAUDE_CONFIG_DIR` si está, como hace él.
//
// Lo usan los dos instaladores y la barra (que lo lleva copiado en
// `media/comun/`), y se puede correr suelto: `node control-remoto.js --quitar`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLAVE = 'remoteControlAtStartup';
const MARCA = '.executive-lab-control-remoto';

const carpetaDeClaude = (entorno = process.env, casa = os.homedir()) => entorno.CLAUDE_CONFIG_DIR || path.join(casa, '.claude');

function leer(fichero) {
  if (!fs.existsSync(fichero)) return {};
  try {
    const datos = JSON.parse(fs.readFileSync(fichero, 'utf8'));
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : null;
  } catch {
    return null;
  }
}

// Entero o nada: se escribe al lado y se cambia de golpe, con los permisos que
// tenía, porque Claude puede estar leyéndolo en ese momento.
function escribir(fichero, datos) {
  const temporal = `${fichero}.executive-lab-${process.pid}`;
  fs.writeFileSync(temporal, `${JSON.stringify(datos, null, 2)}\n`);
  try {
    fs.chmodSync(temporal, fs.statSync(fichero).mode);
  } catch { /* no había fichero */ }
  fs.renameSync(temporal, fichero);
}

function ponerElControlRemoto({ carpeta = carpetaDeClaude() } = {}) {
  const fichero = path.join(carpeta, 'settings.json');
  const datos = leer(fichero);
  if (!datos) return { hecho: 'ilegible', fichero };
  if (Object.prototype.hasOwnProperty.call(datos, CLAVE)) return { hecho: 'yaEstaba', valor: datos[CLAVE], fichero };
  fs.mkdirSync(carpeta, { recursive: true });
  escribir(fichero, { ...datos, [CLAVE]: true });
  fs.writeFileSync(path.join(carpeta, MARCA), `${CLAVE} lo puso Executive Lab. Al desinstalar se quita, si sigue a true.\n`);
  return { hecho: 'puesto', fichero };
}

// Solo si lo pusimos nosotros (la marca) y sigue como lo dejamos: si después
// lo apagó, o lo cambió, es suyo.
function quitarElControlRemoto({ carpeta = carpetaDeClaude() } = {}) {
  const marca = path.join(carpeta, MARCA);
  if (!fs.existsSync(marca)) return { hecho: 'noEraNuestro' };
  const fichero = path.join(carpeta, 'settings.json');
  const datos = leer(fichero);
  if (!datos) return { hecho: 'ilegible', fichero };
  let hecho = 'yaNoEstaba';
  if (datos[CLAVE] === true) {
    const { [CLAVE]: _quitado, ...resto } = datos;
    escribir(fichero, resto);
    hecho = 'quitado';
  }
  fs.rmSync(marca, { force: true });
  return { hecho, fichero };
}

module.exports = { ponerElControlRemoto, quitarElControlRemoto, carpetaDeClaude, CLAVE, MARCA };

if (require.main === module) {
  const hecho = process.argv.includes('--quitar') ? quitarElControlRemoto() : ponerElControlRemoto();
  console.log(`control remoto: ${hecho.hecho}`);
}
