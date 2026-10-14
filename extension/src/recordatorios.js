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

const losQueHay = () => acciones.acciones()
  .filter((b) => b.cuando && cuando.valido(b.cuando))
  .map((b) => ({ ...b, enPalabras: cuando.enPalabras(b.cuando) }));

// El que toca ahora: el que tocó después de la última vez que se hizo o se dejó
// para luego. Uno nuevo no toca por lo que ya pasó: empieza a contar desde que
// se ve (`nuevos`, que quien llama apunta como hechos ahora).
function elQueToca(hechos = {}, ahora = Date.now()) {
  const nuevos = [];
  let toca = null;
  for (const uno of losQueHay()) {
    const ultima = cuando.ultimaVez(uno.cuando, ahora);
    if (!(uno.nombre in hechos)) {
      nuevos.push(uno.nombre);
      continue;
    }
    if (ultima && ultima > hechos[uno.nombre] && (!toca || ultima < toca.ultima)) toca = { ...uno, ultima };
  }
  return { toca, nuevos };
}

// Los botones que se pulsan con costumbre y todavía no se recuerdan.
function costumbres(usos = [], ahora = Date.now()) {
  return acciones.acciones()
    .filter((b) => !b.cuando)
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
  const cabecera = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!cabecera) return null;
  const lineas = cabecera[1].split(/\r?\n/).filter((l) => !/^\s*cuando\s*:/.test(l));
  if (cron) {
    const linea = `cuando: ${JSON.stringify(cron)}`;
    const meta = enMetadata ? lineas.findIndex((l) => /^metadata\s*:\s*$/.test(l)) : -1;
    if (meta >= 0) {
      let fin = meta + 1;
      while (fin < lineas.length && /^\s+\S/.test(lineas[fin])) fin += 1;
      lineas.splice(fin, 0, `  ${linea}`);
    } else if (enMetadata) {
      lineas.push('metadata:', `  ${linea}`);
    } else {
      lineas.push(linea);
    }
  }
  const sinMetadataVacia = lineas.filter((l, i) => !(/^metadata\s*:\s*$/.test(l) && !/^\s+\S/.test(lineas[i + 1] || '')));
  return texto.replace(cabecera[0], `---\n${sinMetadataVacia.join('\n')}\n---`);
}

function ponerCuando(nombre, cron) {
  if (cron && !cuando.valido(cron)) return { ok: false, motivo: 'noSeEntiende' };
  const boton = acciones.acciones().find((b) => b.nombre === nombre);
  if (!boton || !boton.fichero) return { ok: false, motivo: 'noEsta' };
  const nuevo = conCuando(fs.readFileSync(boton.fichero, 'utf8'), cron, boton.fichero.endsWith('SKILL.md'));
  if (nuevo === null) return { ok: false, motivo: 'sinCabecera' };
  fs.writeFileSync(boton.fichero, nuevo);
  return { ok: true, boton, enPalabras: cron ? cuando.enPalabras(cron) : null };
}

module.exports = { losQueHay, elQueToca, costumbres, conCuando, ponerCuando };
