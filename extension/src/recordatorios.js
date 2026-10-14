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
const acciones = require('./acciones');
const cuando = require('./cuando');

const esHabilidad = (b) => Boolean(b.fichero && b.fichero.endsWith('SKILL.md'));

const losQueHay = () => acciones.acciones()
  .filter((b) => b.cuando && cuando.valido(b.cuando))
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
  const lineas = cabecera[2].split(/\r?\n/).filter((l) => !/^\s*cuando\s*:/.test(l));
  // `metadata:` sola, con un comentario detrás, o vacía en línea (`{}`).
  const esMetadata = (l) => /^metadata\s*:\s*(\{\s*\}\s*)?(#.*)?$/.test(l);
  if (cron) {
    const linea = `cuando: ${JSON.stringify(cron)}`;
    const meta = enMetadata ? lineas.findIndex(esMetadata) : -1;
    if (meta >= 0) {
      // Vacía en línea pasa a bloque; un comentario suyo, se queda.
      lineas[meta] = lineas[meta].replace(/^metadata\s*:\s*\{\s*\}\s*/, 'metadata: ').trimEnd();
      let fin = meta + 1;
      while (fin < lineas.length && (/^\s+\S/.test(lineas[fin]) || !lineas[fin].trim())) fin += 1;
      while (fin > meta + 1 && !lineas[fin - 1].trim()) fin -= 1;
      // Con la sangría que ya lleven las suyas.
      const sangria = ((lineas.slice(meta + 1, fin).find((l) => l.trim()) || '').match(/^\s+/) || ['  '])[0];
      lineas.splice(fin, 0, `${sangria}${linea}`);
    } else if (enMetadata) {
      lineas.push('metadata:', `  ${linea}`);
    } else {
      lineas.push(linea);
    }
  }
  const sinMetadataVacia = lineas.filter((l, i) => !(/^metadata\s*:\s*$/.test(l) && !/^\s+\S/.test(lineas[i + 1] || '')));
  // Con una función: un `$` en su texto no es una orden de reemplazo.
  return texto.replace(cabecera[0], () => `---${salto}${sinMetadataVacia.join(salto)}${salto}---`);
}

function ponerCuando(nombre, cron) {
  if (cron && !cuando.valido(cron)) return { ok: false, motivo: 'noSeEntiende' };
  const boton = acciones.acciones().find((b) => b.nombre === nombre);
  if (!boton || !boton.fichero) return { ok: false, motivo: 'noEsta' };
  // Ponerlo, solo en una habilidad; quitarlo, de donde esté.
  if (cron && !esHabilidad(boton)) return { ok: false, motivo: 'esUnComando' };
  const nuevo = conCuando(fs.readFileSync(boton.fichero, 'utf8'), cron, boton.fichero.endsWith('SKILL.md'));
  if (nuevo === null) return { ok: false, motivo: 'sinCabecera' };
  fs.writeFileSync(boton.fichero, nuevo);
  return { ok: true, boton, enPalabras: cron ? cuando.enPalabras(cron) : null };
}

module.exports = { losQueHay, losQueTocan, costumbres, conCuando, ponerCuando };
