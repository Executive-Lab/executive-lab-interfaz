// Los recordatorios: las habilidades con botón que llevan `cuando` (decisión 144).
//
// A su hora, la barra lo dice con su botón. Hacerlo lo decide el alumno, y no
// por capricho: ni Claude ni Codex dejan que otro programa mande un mensaje por
// él (el texto se queda escrito en su caja), y lo que hace una habilidad puede
// salir de su ordenador o costar algo. Lo que sí se hace solo (P9): poner el
// recordatorio cuando la barra ve la costumbre, y decirlo en una frase.
//
// Lo que se recuerda vive en la propia habilidad, en su `metadata`, para que lo
// lean igual la barra, el asistente y quien abra el fichero. Lo que la barra
// apunta —cuándo se hizo cada uno, cuándo se pulsó cada botón— va en su almacén.

const fs = require('node:fs');
const path = require('node:path');
const proyecto = require('./proyecto');
const acciones = require('./acciones');
const cuando = require('./cuando');

const esHabilidad = (b) => Boolean(b.fichero && b.fichero.endsWith('SKILL.md'));

const disponibles = () => acciones.acciones().filter(esHabilidad);
// También los que haya que corregir: esconder un horario mal escrito deja a
// quien lo puso esperando un aviso que nunca llegará.
const conHorario = () => acciones.acciones().filter((b) => b.cuando);

// La fila de Recordatorios sale si hay algo que recordar o algo a lo que
// ponérselo: una habilidad con botón, o un recordatorio (solo sale lo que se tiene).
const hayAlgo = () => disponibles().length > 0 || conHorario().length > 0;

// Si el fichero de un botón está de verdad en esta carpeta: con los enlaces
// seguidos. Una habilidad compartida con otra carpeta se lee aquí, pero su
// horario se cambia allí. Un enlace roto no lanza: no está (revisión
// adversaria de la 155).
function dentroDeLaCarpeta(fichero) {
  const raiz = proyecto.raiz();
  if (!raiz || !fichero) return false;
  try {
    const relativa = path.relative(fs.realpathSync(raiz), fs.realpathSync(fichero));
    return relativa !== '' && !path.isAbsolute(relativa) && relativa !== '..' && !relativa.startsWith(`..${path.sep}`);
  } catch {
    return false;
  }
}

// Cambiar el horario, solo en una habilidad de esta carpeta; quitarlo, también
// de un comando de antes.
const puedeCambiar = (boton) => Boolean(boton && esHabilidad(boton) && dentroDeLaCarpeta(boton.fichero));
const puedeQuitar = (boton) => Boolean(boton && dentroDeLaCarpeta(boton.fichero));

const losQueHay = () => conHorario()
  .filter((b) => cuando.valido(b.cuando))
  .map((b) => ({ ...b, enPalabras: cuando.enPalabras(b.cuando) }));

// Los que tocan ahora, del más antiguo al más nuevo: los que tocaron después de
// la última vez que se hicieron o se dejaron para luego. Uno nuevo, o uno al que
// le han cambiado la hora (`vistos` guarda con qué hora se vio), no toca por lo
// que ya pasó: empieza a contar desde que se ve (`nuevos`, que quien llama
// apunta como hechos ahora).
function losQueTocan(hechos = {}, vistos = {}, ahora = Date.now()) {
  const nuevos = [];
  const tocan = [];
  for (const uno of losQueHay()) {
    if (!(uno.nombre in hechos) || vistos[uno.nombre] !== uno.cuando) {
      nuevos.push({ nombre: uno.nombre, cuando: uno.cuando });
      continue;
    }
    const ultima = cuando.ultimaVez(uno.cuando, ahora);
    if (ultima && ultima > hechos[uno.nombre]) tocan.push({ ...uno, ultima });
  }
  return { tocan: tocan.sort((a, b) => a.ultima - b.ultima), nuevos };
}

// Los botones que se pulsan con costumbre y todavía no se recuerdan.
// Solo habilidades: en un comando de los raíles (Copilot, Cline…), ponerse al día
// lo pisaría y se perdería sin decir nada.
function costumbres(usos = [], ahora = Date.now()) {
  return acciones.acciones()
    .filter((b) => !b.cuando && esHabilidad(b))
    .map((b) => ({ ...b, cron: cuando.costumbre(usos.filter((u) => u.nombre === b.nombre).map((u) => u.t), ahora) }))
    .filter((b) => b.cron)
    .map((b) => ({ ...b, enPalabras: cuando.enPalabras(b.cron) }));
}

// ── Escribirlo en la habilidad ─────────────────────────────────────────
//
// En una habilidad, dentro de `metadata`, al final de lo que ya haya ahí; en un
// comando de antes, en su cabecera. Lo demás del fichero, intacto. Con `null`,
// se quita (y `metadata` también, si se queda vacía).
function conCuando(texto, cron, enMetadata) {
  const cabecera = texto.match(/^---(\r?\n)([\s\S]*?)\r?\n---/);
  if (!cabecera) return null;
  const salto = cabecera[1];
  let lineas = cabecera[2].split(/\r?\n/);
  // `metadata:` sola, con un comentario detrás, o vacía en línea (`{}`).
  const esMetadata = (l) => /^metadata\s*:\s*(\{\s*\}\s*)?(#.*)?$/.test(l);
  const metaInicial = lineas.findIndex((l) => /^metadata\s*:/.test(l));
  if (enMetadata && metaInicial >= 0 && !esMetadata(lineas[metaInicial])) return null;
  const finDeMetadata = (meta) => {
    let fin = meta + 1;
    while (fin < lineas.length && (!lineas[fin].trim() || /^\s/.test(lineas[fin]) || /^#/.test(lineas[fin]))) fin += 1;
    return fin;
  };
  const finInicial = metaInicial >= 0 ? finDeMetadata(metaInicial) : -1;
  const sangriaInicial = metaInicial < 0 ? '' : ((lineas.slice(metaInicial + 1, finInicial)
    .find((l) => l.trim() && !/^\s*#/.test(l)) || '').match(/^\s+/) || ['  '])[0];
  if (lineas.some((l, i) => (/^cuando\s*:/.test(l)
    || (enMetadata && i > metaInicial && i < finInicial && new RegExp(`^${sangriaInicial}cuando\\s*:`).test(l)))
    && /:\s*[>|]/.test(l))) return null;
  lineas = lineas.filter((l, i) => {
    if (/^cuando\s*:/.test(l)) return false; // el formato de antes
    if (!enMetadata || i <= metaInicial || i >= finInicial) return true;
    return !l.startsWith(`${sangriaInicial}cuando:`) && !new RegExp(`^${sangriaInicial}cuando\\s+:`).test(l);
  });
  if (cron) {
    const linea = `cuando: ${JSON.stringify(cron)}`;
    const meta = enMetadata ? lineas.findIndex(esMetadata) : -1;
    if (meta >= 0) {
      // Vacía en línea pasa a bloque; un comentario suyo, se queda.
      lineas[meta] = lineas[meta].replace(/^metadata\s*:\s*\{\s*\}\s*/, 'metadata: ').trimEnd();
      let fin = finDeMetadata(meta);
      while (fin > meta + 1 && !lineas[fin - 1].trim()) fin -= 1;
      // Con la sangría que ya lleven las suyas.
      const sangria = ((lineas.slice(meta + 1, fin).find((l) => l.trim() && !/^\s*#/.test(l)) || '').match(/^\s+/) || ['  '])[0];
      lineas.splice(fin, 0, `${sangria}${linea}`);
    } else if (enMetadata) {
      lineas.push('metadata:', `  ${linea}`);
    } else {
      lineas.push(linea);
    }
  }
  const metaFinal = lineas.findIndex(esMetadata);
  const vacia = metaFinal >= 0 && lineas.slice(metaFinal + 1, finDeMetadata(metaFinal))
    .every((l) => !l.trim() || /^\s*#/.test(l));
  const sinMetadataVacia = lineas.filter((l, i) => !(i === metaFinal && vacia && /^metadata\s*:\s*$/.test(l)));
  // Con una función: un `$` en su texto no es una orden de reemplazo.
  return texto.replace(cabecera[0], () => `---${salto}${sinMetadataVacia.join(salto)}${salto}---`);
}

function ponerCuando(nombre, cron) {
  if (cron && !cuando.valido(cron)) return { ok: false, motivo: 'noSeEntiende' };
  const boton = acciones.acciones().find((b) => b.nombre === nombre);
  if (!boton || !boton.fichero) return { ok: false, motivo: 'noEsta' };
  // Ponerlo, solo en una habilidad; quitarlo, de donde esté.
  if (cron && !esHabilidad(boton)) return { ok: false, motivo: 'esUnComando' };
  // Un botón puede leerse a través de un enlace compartido. Su horario no da
  // permiso para cambiar otra carpeta al escribir en esa habilidad.
  if (!dentroDeLaCarpeta(boton.fichero)) return { ok: false, motivo: 'fueraDeLaCarpeta' };
  const nuevo = conCuando(fs.readFileSync(boton.fichero, 'utf8'), cron, boton.fichero.endsWith('SKILL.md'));
  if (nuevo === null) return { ok: false, motivo: 'sinCabecera' };
  fs.writeFileSync(boton.fichero, nuevo);
  return { ok: true, boton, enPalabras: cron ? cuando.enPalabras(cron) : null };
}

// ── Si esta carpeta tiene conexiones ─────────────────────────────────────
//
// Las rutinas de Claude en la nube trabajan con una copia de lo subido a GitHub:
// el `.env` y `keys/` no viajan. Adivinar leyendo la habilidad si usa una
// conexión se engañaba —«Sube el informe a Google Drive» con la carpeta
// GOOGLE_DRIVE, una habilidad que remite a otro fichero, «lee el .env»—. Jose,
// en la revisión de la PR #48: ante la duda, escritorio. La nube solo se ofrece
// si la carpeta no tiene ninguna conexión: ninguna carpeta en `01-TOOLS/` salvo
// la plantilla, y ninguna clave en un `.env` ni fichero de acceso (lo que ya
// encuentra `sueltas.js`). Si no se puede mirar, también escritorio.
function tieneConexiones() {
  const base = proyecto.ruta('01-TOOLS');
  try {
    if (fs.readdirSync(base, { withFileTypes: true }).some((e) => (e.isDirectory() || e.isSymbolicLink()) && e.name !== '_TEMPLATE')) return true;
  } catch { /* sin 01-TOOLS */ }
  try {
    const { claves, ficheros } = require('./sueltas').paraProteger();
    return claves.length > 0 || ficheros.length > 0;
  } catch {
    return true;
  }
}

module.exports = { disponibles, conHorario, hayAlgo, losQueHay, losQueTocan, costumbres, conCuando, ponerCuando, dentroDeLaCarpeta, puedeCambiar, puedeQuitar, tieneConexiones };
