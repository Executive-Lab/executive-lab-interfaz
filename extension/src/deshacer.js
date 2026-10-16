// Deshacer con RSC (decisión 173): quitar una habilidad o un agente que se añadió, y
// volver a lo que había antes de montar.
//
// Las dos cosas son de RSC y la barra no las inventa: `uninstall <id>` quita una
// habilidad o un agente (sus ficheros, su apunte en `.rsc.json` y en el estado) y
// `restore <copia>` devuelve lo que guardó en `.rsc/backups/`. Ninguno pregunta
// nada, así que la pregunta es de la barra, con un clic de la persona (P9): aquí
// solo está lo que decide si se ofrece y lo que se corre. Preguntar y repintar, en
// `extension.js`.
//
// Lo que no se ofrece nunca: lo suyo (`ownSkills`), lo que ponen los raíles de la
// barra (`acciones.esDeLaBarra`), lo que el arnés pone de suelo y lo de
// fontanería. Un botón que quita algo que hace falta para funcionar no es un
// botón: es una avería con rótulo.

const fs = require('node:fs');
const path = require('node:path');
const rsc = require('./rsc');
const proyecto = require('./proyecto');
const { etiqueta: unRotulo } = require('./limpio');

// Lo que RSC equipa siempre (`default-skill-floor.js`): `sync` lo volvería a poner.
const SUELO = new Set(['orient', 'suggest', 'unslop', 'ftd', 'connect-tool']);

// ¿Se ofrece «Quitarla» para esta habilidad? Solo la del catálogo que se añadió.
function sePuedeQuitarLaHabilidad(id, { propias = [], deLaBarra = false, esFontaneria = false } = {}) {
  if (typeof id !== 'string' || !/^[a-z0-9-]{2,40}$/.test(id)) return false;
  return !SUELO.has(id) && !propias.includes(id) && !deLaBarra && !esFontaneria;
}

// ¿Y para este agente? Solo el que la declaración apunta como pedido a RSC
// (`agents` de `.rsc.json`). Los que salen de una habilidad no son de nadie: los
// quita la habilidad. Y uno propio no lo conoce RSC.
function sePuedeQuitarElAgente(id, { declarados = [], propios = [] } = {}) {
  if (typeof id !== 'string' || !/^[a-z0-9-]{2,60}$/.test(id)) return false;
  return declarados.includes(id) && !propios.includes(id);
}

// Lo último que dijo RSC, en una línea y sin comillas, para decirlo en pantalla.
function loQueDijo(hecho) {
  const crudo = `${(hecho && hecho.error) || ''}\n${(hecho && hecho.salida) || ''}`;
  const lineas = crudo.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return unRotulo(lineas[lineas.length - 1] || '', 160);
}

// `rsc uninstall <id>` para todos los asistentes declarados. Lo que cuenta es el
// disco: que haya salido bien y que ya no esté la habilidad en ninguno.
async function quitar(id) {
  if (!sePuedeQuitarLaHabilidad(id)) return { ok: false, dijo: '' };
  const para = rsc.losAsistentes();
  const hecho = await rsc.correr(['uninstall', id, '--target', para.join(',')], { tiempoMaximo: 120000 });
  const siguen = para.filter((quien) => rsc.habilidadesDelArnesEnDisco(quien).includes(id));
  const ok = hecho.codigo === 0 && siguen.length === 0;
  return { ok, hecho, dijo: ok ? '' : loQueDijo(hecho) };
}

// Lo mismo con un agente. RSC no lo quita si una habilidad que sigue puesta lo
// necesita: entonces sale bien, el fichero sigue, y `siguePuesto` lo dice.
async function quitarAgente(id, ficheros) {
  if (typeof id !== 'string' || !/^[a-z0-9-]{2,60}$/.test(id)) return { ok: false, dijo: '' };
  const para = rsc.losAsistentes();
  const hecho = await rsc.correr(['uninstall', id, '--target', para.join(',')], { tiempoMaximo: 120000 });
  const siguePuesto = (ficheros || []).some((f) => fs.existsSync(f));
  return { ok: hecho.codigo === 0 && !siguePuesto, hecho, siguePuesto: hecho.codigo === 0 && siguePuesto, dijo: hecho.codigo === 0 ? '' : loQueDijo(hecho) };
}

// ── Volver a la copia del montaje ────────────────────────────────────────

// Lo que `restore --dry-run` dice que tocaría: RSC escribe una ruta por línea, con
// dos espacios delante, y dentro de la carpeta. Lo demás no cuenta.
function lasRutasDeLaSalida(salida, raiz) {
  // RSC escribe la ruta con los enlaces resueltos (en un Mac, `/private/var/…` y no `/var/…`).
  const dentro = [path.resolve(raiz)];
  try { dentro.push(fs.realpathSync(raiz)); } catch { /* la carpeta que no está, no cuenta */ }
  return String(salida || '').split(/\r?\n/)
    .filter((l) => /^ {2}\S/.test(l))
    .map((l) => l.trim())
    .filter((p) => path.isAbsolute(p) && dentro.some((d) => (path.resolve(p) + path.sep).startsWith(d + path.sep)));
}

// La ruta de algo de la carpeta, relativa a ella, o null si no es de dentro.
function deLaCarpeta(raiz, ruta) {
  const bases = [path.resolve(raiz)];
  try { bases.push(fs.realpathSync(raiz)); } catch { /* sin carpeta, nada */ }
  for (const base of bases) {
    const relativa = path.relative(base, path.resolve(ruta));
    if (relativa && !relativa.startsWith('..') && !path.isAbsolute(relativa)) return relativa;
  }
  return null;
}

// Qué tocaría, sin tocar nada (`restore <copia> --dry-run`). Null si RSC no responde.
async function loQueTocaria(id) {
  const raiz = proyecto.raiz();
  const hecho = await rsc.correr(['restore', id, '--dry-run'], { tiempoMaximo: 60000 });
  if (hecho.codigo !== 0) return { ok: false, dijo: loQueDijo(hecho), rutas: [] };
  return { ok: true, rutas: lasRutasDeLaSalida(hecho.salida, raiz) };
}

// RSC no guarda lo de ahora antes de restaurar. La barra sí: una copia de cada
// sitio que va a cambiar, en `.rsc/antes-de-recuperar/<fecha>/` (fuera de
// `.rsc/backups/`, que es de RSC y donde la barra busca la del montaje).
// Devuelve la carpeta, o null si no se pudo: entonces no se restaura.
function guardarLoDeAhora(rutas, ahora = new Date()) {
  const raiz = proyecto.raiz();
  const sello = ahora.toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
  const destino = path.join(raiz, '.rsc', 'antes-de-recuperar', sello);
  try {
    fs.mkdirSync(path.join(destino, 'files'), { recursive: true });
    for (const ruta of rutas) {
      let info;
      try { info = fs.lstatSync(ruta); } catch { continue; }
      const relativa = deLaCarpeta(raiz, ruta);
      if (!relativa) continue;
      const aqui = path.join(destino, 'files', relativa);
      fs.mkdirSync(path.dirname(aqui), { recursive: true });
      if (info.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(ruta), aqui);
      else fs.cpSync(ruta, aqui, { recursive: true, verbatimSymlinks: true });
    }
    return destino;
  } catch {
    return null;
  }
}

// `rsc restore <copia>`, con lo de ahora guardado antes.
async function recuperar(id, rutas) {
  const guardado = guardarLoDeAhora(rutas);
  if (!guardado) return { ok: false, guardado: null, dijo: '' };
  const hecho = await rsc.correr(['restore', id], { tiempoMaximo: 120000 });
  return { ok: hecho.codigo === 0, guardado, hecho, dijo: hecho.codigo === 0 ? '' : loQueDijo(hecho) };
}

module.exports = {
  SUELO, sePuedeQuitarLaHabilidad, sePuedeQuitarElAgente, quitar, quitarAgente,
  lasRutasDeLaSalida, loQueTocaria, guardarLoDeAhora, recuperar, loQueDijo,
};
